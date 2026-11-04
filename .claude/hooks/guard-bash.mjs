// PreToolUse hook for Bash and PowerShell. Reads the tool call from stdin and refuses, with exit 2 and a
// one-line reason, the commands that break the rules in .claude/rules/production-safety.md:
//   - git push to main or master
//   - git add / git commit that would stage jobs/, *.har, storageState*.json or .env
//   - git add of docs/apis/<site> without a passing, current REVIEW.json (the review gate)
//   - apidocs record of a write workflow against a target that is not marked staging/test/sandbox
// Everything else exits 0 and says nothing. Design: docs/design/agent-guidance.md §4.

import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

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

/** Split a shell command at `&&`, `||`, `;` and newlines that sit outside quotes. */
function splitSegments(cmd) {
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      cur += ch;
      if (ch === '\\' && quote === '"' && i + 1 < cmd.length) cur += cmd[++i];
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    const two = cmd.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      out.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (ch === ';' || ch === '\n') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function check(command) {
  const cmd = String(command || '');
  const segments = splitSegments(cmd);
  for (const segment of segments) {
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
