// PreToolUse hook for Bash and PowerShell. Reads the tool call from stdin and refuses, with exit 2 and a
// one-line reason, the commands that break the rules in .claude/rules/production-safety.md:
//   - git push to main or master
//   - git add / git commit that would stage jobs/, *.har, storageState*.json or .env
//   - git add of docs/apis/<site> without a passing, current REVIEW.json (the review gate)
//   - apidocs record of a write workflow against a target that is not marked staging/test/sandbox
//   - apidocs snapshot of a production target without a valid snapshotConsent (--dry-run is always fine)
//   - git add / commit of *.ndjson (snapshot data)
//   - bq / gcloud storage / gsutil moving a jobs/ path off the machine (only `npm run snapshot:load` may)
//   - creating a BigQuery dataset or bucket outside northamerica-northeast1
//   - granting allUsers / allAuthenticatedUsers through bq, gcloud or gsutil
// Everything else exits 0 and says nothing. Design: docs/design/agent-guidance.md §4.

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cwdAt, splitSegments } from './shell.mjs';

/** The directory the command runs in: the tool call's cwd (a worktree counts), else the project. */
let root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const docFiles = ['README.md', 'api.json', 'index.html', 'openapi.json'];

function hashDocs(dir) {
  const h = createHash('sha256');
  for (const name of docFiles) {
    h.update(name);
    h.update('\0');
    h.update(readFileSync(path.join(dir, name)));
    h.update('\0');
  }
  return h.digest('hex');
}

/** Why docs/apis/<site> may not be staged, or null when it may. */
export function reviewProblem(site) {
  const dir = path.join(root, 'docs', 'apis', site);
  if (!existsSync(dir)) return null;
  const reviewFile = path.join(dir, 'REVIEW.json');
  if (!existsSync(reviewFile)) return `docs/apis/${site} has no REVIEW.json; run \`npm run apidocs:scan -- ${site}\` and get a pass first`;
  let review;
  try {
    review = JSON.parse(readFileSync(reviewFile, 'utf8'));
  } catch {
    return `docs/apis/${site}/REVIEW.json is not JSON; rerun the scan`;
  }
  if (review.verdict !== 'pass') return `docs/apis/${site} review verdict is ${review.verdict}; a person resolves it before anything under docs/apis is staged`;
  if (!docFiles.every((n) => existsSync(path.join(dir, n)))) return `docs/apis/${site} is missing a rendered file; rebuild and rescan`;
  if (hashDocs(dir) !== review.hash) return `docs/apis/${site} changed since its scan; rerun \`npm run apidocs:scan -- ${site}\``;
  return null;
}

function sitesTouchedByAdd(tokens) {
  const sites = new Set();
  const all = tokens.some((t) => t === '-A' || t === '--all' || t === '.' || t === ':/' || t === 'docs' || t === 'docs/' || t === 'docs/apis' || t === 'docs/apis/');
  if (all) {
    const base = path.join(root, 'docs', 'apis');
    if (existsSync(base)) for (const name of readdirSync(base, { withFileTypes: true })) if (name.isDirectory()) sites.add(name.name);
  }
  for (const t of tokens) {
    const m = /^docs\/apis\/([^/\s]+)/.exec(t.replace(/\\/g, '/'));
    if (m) sites.add(m[1]);
  }
  return [...sites];
}

const SNAPSHOT_LOCATION = 'northamerica-northeast1';
const unquote = (t) => t.replace(/^(["'])(.*)\1$/, '$2');

function localToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function isDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Why a target's snapshotConsent is not usable today, or null when it is. */
export function consentProblem(consent, today = localToday()) {
  if (!consent || typeof consent !== 'object' || Array.isArray(consent)) return 'missing';
  if (typeof consent.by !== 'string' || !consent.by.trim()) return 'by is empty';
  if (typeof consent.scope !== 'string' || !consent.scope.trim()) return 'scope is empty';
  if (!isDate(consent.on)) return 'on is not a YYYY-MM-DD date';
  if (consent.on > today) return `on ${consent.on} is in the future`;
  if (consent.expires !== undefined) {
    if (!isDate(consent.expires)) return 'expires is not a YYYY-MM-DD date';
    if (consent.expires < today) return `consent expired ${consent.expires}`;
  }
  return null;
}

const SNAPSHOT_VALUE_FLAGS = new Set(['--attach', '--plan', '--resume', '--only', '--group', '--per-id', '--max-ids', '--ids-from', '--months']);

/** Why `apidocs snapshot <site>` may not run, or null. */
function snapshotProblem(tokens) {
  const si = tokens.findIndex((t) => t === 'snapshot');
  const rest = tokens.slice(si + 1);
  if (rest.includes('--dry-run')) return null;
  let site;
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t.startsWith('-')) {
      if (SNAPSHOT_VALUE_FLAGS.has(t)) i++;
      continue;
    }
    site = unquote(t);
    break;
  }
  if (!site) return null; // the CLI itself refuses a missing site
  const targetFile = site.endsWith('.json') ? path.resolve(root, site) : path.join(root, 'targets', `${site}.json`);
  let target;
  try {
    target = JSON.parse(readFileSync(targetFile, 'utf8'));
  } catch {
    target = undefined;
  }
  if (target && ['staging', 'test', 'sandbox'].includes(target.environment)) return null;
  const why = target ? consentProblem(target.snapshotConsent) : 'missing';
  if (why === null) return null;
  const detail = why === 'missing' ? '' : ` (${why})`;
  return `${site} is production and its target has no valid snapshotConsent { by, on, scope }${detail}; record the owner's consent in targets/${site}.json first`;
}

const CLOUD_CLI = /^(?:.*[\\/])?(bq|gcloud|gsutil)(?:\.(?:cmd|exe|ps1|bat))?$/i;
const BQ_VALUE_FLAGS = new Set(['--location', '--project_id', '--dataset_id', '--format', '--api', '--api_version', '--job_id', '--max_rows', '--bigquery_api_endpoint']);
const BQ_NON_DATASET_KINDS = new Set(['-t', '--table', '--view', '--materialized_view', '--transfer_config', '--transfer_run', '--reservation', '--reservation_assignment', '--capacity_commitment', '--connection', '--routine', '--model', '--external_table_definition']);

/** The cloud CLI a segment runs, with its arguments unquoted, or null. Leading `&` and VAR=value are skipped. */
function cloudCli(tokens) {
  for (let i = 0; i < tokens.length; i++) {
    const t = unquote(tokens[i]);
    if (t === '&' || /^[A-Za-z_]\w*=/.test(t)) continue;
    const m = CLOUD_CLI.exec(t);
    return m ? { name: m[1].toLowerCase(), args: tokens.slice(i + 1).map(unquote) } : null;
  }
  return null;
}

/** Location values given by flag: --location=x, --location x, and -l x where -l means location (not bq's --label). */
function locationsOf(args, shortL) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const eq = /^--location=(.*)$/.exec(a);
    if (eq) out.push(eq[1]);
    else if (a === '--location' || (shortL && a === '-l')) out.push(args[++i] ?? '');
  }
  return out.map((v) => v.toLowerCase());
}

/** Why a bq / gcloud / gsutil segment is refused, or null. */
function cloudProblem(tokens, segment) {
  const cli = cloudCli(tokens);
  if (!cli) return null;
  const { name, args } = cli;
  if (/allUsers|allAuthenticatedUsers/i.test(segment)) {
    return 'allUsers / allAuthenticatedUsers would make snapshot data public; grant named readers only (docs/design/snapshot-landing.md)';
  }
  let sub;
  let leaves = false;
  let creates = false;
  let shortL = true;
  let isBqDataset = false;
  if (name === 'bq') {
    shortL = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('-')) {
        if (BQ_VALUE_FLAGS.has(args[i])) i++;
        continue;
      }
      sub = args[i];
      break;
    }
    leaves = ['load', 'insert', 'cp', 'extract'].includes(sub);
    if (sub === 'mk') {
      const flags = args.filter((a) => a.startsWith('-'));
      const named = flags.some((a) => a === '-d' || a === '--dataset' || /^--dataset=(?!false)/i.test(a));
      // `bq mk <id>` with no kind flag also creates a dataset.
      creates = isBqDataset = named || !flags.some((a) => BQ_NON_DATASET_KINDS.has(a.split('=')[0]));
    }
  } else if (name === 'gcloud') {
    const words = args.filter((a) => !a.startsWith('-'));
    const si = words.indexOf('storage');
    if (si >= 0) {
      sub = words[si + 1];
      leaves = ['cp', 'rsync', 'mv'].includes(sub);
      creates = sub === 'buckets' && words[si + 2] === 'create';
    }
  } else {
    const words = args.filter((a) => !a.startsWith('-'));
    sub = words[0];
    leaves = ['cp', 'rsync', 'mv'].includes(sub);
    creates = sub === 'mb';
  }
  if (leaves) {
    const pathy = args.find((a) => !/^(gs|bq):\/\//i.test(a) && /(^|[\\/=])jobs([\\/]|$)/.test(a));
    if (pathy) return 'snapshot data leaves this machine only through `npm run snapshot:load -- <site>`';
  }
  if (creates) {
    const found = locationsOf(args, shortL);
    if (found.length === 0 || found.some((v) => v !== SNAPSHOT_LOCATION)) {
      const what = isBqDataset || name === 'bq' ? 'a BigQuery dataset' : 'a bucket';
      return `creating ${what} needs --location=${SNAPSHOT_LOCATION} (found ${found.length ? found.join(', ') : 'no location flag'}); snapshot data stays in that region`;
    }
  }
  return null;
}

export function check(command) {
  const cmd = String(command || '');
  const segments = splitSegments(cmd);
  const start = root;
  for (const [index, segment] of segments.entries()) {
    // `cd <worktree> && git add ...` is judged against the worktree, not the session cwd.
    root = cwdAt(segments, index, start);
    const tokens = segment.trim().split(/\s+/);
    const gi = tokens.indexOf('git');
    if (gi >= 0) {
      const sub = tokens[gi + 1];
      const rest = tokens.slice(gi + 2);
      if (sub === 'push') {
        if (rest.some((t) => /^(origin\/)?(main|master)$/.test(t) || /^[^:]*:(refs\/heads\/)?(main|master)$/.test(t))) {
          return 'git push to main/master is off limits; push the feature branch and open a PR';
        }
        if (!rest.some((t) => !t.startsWith('-') && t !== 'origin')) {
          try {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: root, encoding: 'utf8' }).trim();
            if (branch === 'main' || branch === 'master') return `git push from ${branch} is off limits; work on a feature branch`;
          } catch {
            /* not a repo; nothing to guard */
          }
        }
      }
      if (sub === 'add' || sub === 'commit' || sub === 'stage') {
        // Quoted text after `git commit` is a message, not a pathspec: judge only the unquoted tokens there.
        const candidates = sub === 'commit' ? segment.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, ' ').trim().split(/\s+/).slice(gi + 2) : rest;
        const nd = candidates.find((t) => /\.ndjson$/i.test(unquote(t)));
        if (nd) return `${nd} is snapshot data (account records) and never enters git; it leaves this machine only through \`npm run snapshot:load -- <site>\``;
        const bad = candidates.find((t) => /(^|\/)jobs(\/|$)|\.har$|storageState[^/]*\.json$|(^|\/)\.env(\.|$)/.test(t.replace(/\\/g, '/')));
        if (bad) return `${bad} carries cookies or credentials and never enters git (.claude/rules/production-safety.md)`;
        if (sub === 'add') {
          for (const site of sitesTouchedByAdd(rest)) {
            const problem = reviewProblem(site);
            if (problem) return problem;
          }
        }
        if (sub === 'commit' && rest.some((t) => t === '-a' || t === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/.test(t))) {
          try {
            const status = execSync('git status --porcelain -- docs/apis', { cwd: root, encoding: 'utf8' });
            const sites = new Set(status.split('\n').map((l) => /docs\/apis\/([^/]+)/.exec(l)?.[1]).filter(Boolean));
            for (const site of sites) {
              const problem = reviewProblem(site);
              if (problem) return problem;
            }
          } catch {
            /* ignore */
          }
        }
      }
    }
    if (/apidocs(?:-cli(?:\.ts)?)?\s+(?:--\s+)?snapshot(?=\s|$)/.test(segment)) {
      const problem = snapshotProblem(tokens);
      if (problem) return problem;
    }
    const cloud = cloudProblem(tokens, segment);
    if (cloud) return cloud;
    if (/apidocs(?:-cli(?:\.ts)?)?\s+(?:--\s+)?record\b/.test(segment)) {
      const wi = tokens.indexOf('--workflow');
      const ri = tokens.findIndex((t) => t === 'record');
      const targetName = tokens.slice(ri + 1).find((t) => !t.startsWith('--') && t !== tokens[wi + 1]);
      if (wi >= 0 && tokens[wi + 1] && targetName) {
        let workflow;
        try {
          workflow = JSON.parse(readFileSync(path.resolve(root, tokens[wi + 1]), 'utf8'));
        } catch {
          return null;
        }
        if (workflow && workflow.effect === 'write') {
          const targetFile = targetName.endsWith('.json') ? path.resolve(root, targetName) : path.join(root, 'targets', `${targetName}.json`);
          let env;
          try {
            env = JSON.parse(readFileSync(targetFile, 'utf8')).environment;
          } catch {
            env = undefined;
          }
          if (!['staging', 'test', 'sandbox'].includes(env)) {
            return `${tokens[wi + 1]} is a write workflow and ${targetName} is production (no "environment": "staging"|"test"|"sandbox" in its target file); write workflows record only against an account you control`;
          }
          if (!workflow.inverse) return `${tokens[wi + 1]} is a write workflow without an "inverse"; name the workflow that undoes it first`;
        }
      }
    }
  }
  return null;
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (!/^(Bash|PowerShell)$/.test(input.tool_name || '')) return 0;
  if (typeof input.cwd === 'string' && input.cwd) root = input.cwd;
  const problem = check(input.tool_input?.command);
  if (problem) {
    process.stderr.write(`blocked: ${problem}\n`);
    return 2;
  }
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'guard-bash.mjs') {
  main().then((code) => process.exit(code));
}
