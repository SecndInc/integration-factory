// The review gate between generated docs and git. Design: docs/design/agent-guidance.md §3.
//
//   npx tsx scripts/apidocs-docs-scan.ts <site> [--jobs jobs] [--docs docs/apis] [--trace <file>] [--accept]
//
// Reads docs/apis/<site>/{README.md,api.json,index.html,openapi.json} and the newest trace for the site,
// then checks four things: secret values from the trace that reached the docs (fail), example fields that
// look like personal data (needs-review), file sizes (needs-review), and endpoints that are noise rather
// than API (listed). It writes REVIEW.json next to the docs with the verdict and a hash of the four files;
// .claude/hooks/guard-bash.mjs lets `git add docs/apis/<site>` through only when that file says pass and
// the hash still matches. `--accept` turns needs-review into pass after a person has read the listed
// fields; it never clears a fail. Values are never printed, only key paths and counts.
//
// Exit codes: 0 pass, 1 fail, 2 needs-review, 3 inputs missing.

import { createHash } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const docFiles = ['README.md', 'api.json', 'index.html', 'openapi.json'] as const;
export const readmeMaxBytes = 1024 * 1024;
export const fileMaxBytes = 8 * 1024 * 1024;
const secretMinLength = 12;

const secretHeaderNames = /^(cookie|set-cookie|authorization|x-xsrf-token|x-csrf-token|x-api-key|x-auth-token)$/i;
const secretKeyNames = /^(token|access_token|refresh_token|id_token|api_key|apikey|secret|password|session|xsrf|csrf)$/i;
const secretPatterns: { name: string; pattern: RegExp }[] = [
  { name: 'bearer', pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/ },
  { name: 'basic', pattern: /Basic\s+[A-Za-z0-9+/=]{16,}/ },
  { name: 'jwt', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
];

const piiKeyPattern =
  /^(first_?name|last_?name|full_?name|display_?name|phone|phone_?number|mobile|cell|email|e_?mail|address|address_?line_?\d?|street|formatted_?address|short_?address|lat|lng|latitude|longitude|ssn|sin|dob|date_?of_?birth|birth_?date|iban|card_?number|account_?number|license_?plate)$/i;
/** `name` alone is a product or a team as often as a person; it counts only under one of these parents. */
const personParentPattern = /(customer|contact|user|owner|assignee|person|member|lead|homeowner|client|employee|recipient|signer|payer|author|creator)/i;
const noisePathPattern = /^\/(locales|cdn-cgi|broadcasting|sanctum|_next|static|assets)\/|\/ag\/g\/c$|\/ccm\/form-data\/|\.(json|js|css|map|png|jpe?g|gif|svg|ico|woff2?|ttf)$/i;

export interface ScanResult {
  site: string;
  scannedAt: string;
  docsDir: string;
  trace: string | null;
  hash: string;
  verdict: 'pass' | 'fail' | 'needs-review';
  secrets: { candidates: number; hits: { file: string; kind: string; preview: string }[] };
  pii: { hits: number; fields: string[] };
  sizes: Record<string, number>;
  oversize: string[];
  noise: string[];
  accepted?: { by: string; at: string; fieldsAtAcceptance: number };
}

export async function hashDocs(docsDir: string): Promise<string> {
  const h = createHash('sha256');
  for (const name of docFiles) {
    h.update(name);
    h.update('\0');
    h.update(await fs.readFile(path.join(docsDir, name)));
    h.update('\0');
  }
  return h.digest('hex');
}

/** Values the trace knows are secret: cookie values, auth and CSRF headers, token-named fields. */
export async function collectTraceSecrets(tracePath: string): Promise<Set<string>> {
  const secrets = new Set<string>();
  const cookieAttributes = /^(domain|path|expires|max-age|samesite|priority|partitioned)$/i;
  const hostname = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
  const addPairs = (text: string) => {
    for (const m of text.matchAll(/(?:^|[;,\s])([^=;,\s]+)=([^;,\s]{12,})/g)) {
      if (cookieAttributes.test(m[1]!) || hostname.test(m[2]!)) continue;
      secrets.add(m[2]!);
    }
    const bearer = text.match(/^(?:Bearer|Basic)\s+(\S{12,})$/i);
    if (bearer) secrets.add(bearer[1]!);
  };
  const walk = (node: unknown, parentKey: string | undefined, depth: number): void => {
    if (depth > 10 || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, parentKey, depth + 1);
      return;
    }
    const obj = node as Record<string, unknown>;
    const isCookieObject = typeof obj.name === 'string' && typeof obj.value === 'string' && ('domain' in obj || 'path' in obj);
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        if (secretHeaderNames.test(key)) addPairs(value);
        else if (isCookieObject && key === 'value' && value.length >= secretMinLength) secrets.add(value);
        else if (secretKeyNames.test(key) && value.length >= secretMinLength) secrets.add(value);
      } else if (value && typeof value === 'object') {
        walk(value, key, depth + 1);
      }
    }
  };
  const rl = createInterface({ input: createReadStream(tracePath), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    walk(parsed, undefined, 0);
  }
  // Values that are plainly not secrets even when they sit in a cookie: booleans, short numbers, dates.
  for (const value of [...secrets]) {
    if (/^(true|false|null|undefined)$/i.test(value) || /^\d{1,13}$/.test(value) || /^\d{4}-\d{2}-\d{2}/.test(value)) secrets.delete(value);
  }
  return secrets;
}

function findSecretHits(texts: Record<string, string>, secrets: Set<string>): ScanResult['secrets']['hits'] {
  const hits: ScanResult['secrets']['hits'] = [];
  const escaped = [...secrets].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const chunks: RegExp[] = [];
  for (let i = 0; i < escaped.length; i += 200) chunks.push(new RegExp(escaped.slice(i, i + 200).join('|')));
  for (const [file, text] of Object.entries(texts)) {
    for (const chunk of chunks) {
      const m = chunk.exec(text);
      if (m) hits.push({ file, kind: 'trace-value', preview: `${m[0].slice(0, 6)}… (${m[0].length} chars)` });
    }
    for (const { name, pattern } of secretPatterns) {
      const m = pattern.exec(text);
      if (m) hits.push({ file, kind: name, preview: `${m[0].slice(0, 10)}… (${m[0].length} chars)` });
    }
  }
  return hits;
}

function findPii(apiJson: unknown): ScanResult['pii'] {
  const fields = new Set<string>();
  let hits = 0;
  const isValue = (v: unknown) => (typeof v === 'string' && v.length > 0 && !/^\{[a-z]+\}$/i.test(v)) || typeof v === 'number';
  const walk = (node: unknown, trail: string[], parentKey: string | undefined, depth: number): void => {
    if (depth > 12 || node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node.slice(0, 50)) walk(item, trail, parentKey, depth + 1);
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const personal = piiKeyPattern.test(key) || (key === 'name' && parentKey !== undefined && personParentPattern.test(parentKey));
      if (personal && isValue(value)) {
        hits++;
        fields.add([...trail, key].join('.'));
      } else if (value && typeof value === 'object') {
        walk(value, [...trail, key], key, depth + 1);
      }
    }
  };
  const doc = apiJson as { endpoints?: { method?: string; pathTemplate?: string; request?: unknown; responses?: unknown }[] };
  for (const ep of doc.endpoints ?? []) {
    const label = `${ep.method ?? '?'} ${ep.pathTemplate ?? '?'}`;
    walk(ep.request, [label, 'request'], undefined, 0);
    walk(ep.responses, [label, 'responses'], undefined, 0);
  }
  return { hits, fields: [...fields].sort().slice(0, 200) };
}

function findNoise(apiJson: unknown): string[] {
  const doc = apiJson as { endpoints?: { method?: string; pathTemplate?: string; kind?: string }[] };
  return (doc.endpoints ?? [])
    .filter((ep) => ep.kind !== 'page' && ep.pathTemplate !== undefined && noisePathPattern.test(ep.pathTemplate))
    .map((ep) => `${ep.method ?? '?'} ${ep.pathTemplate}`);
}

async function newestTrace(jobsDir: string, site: string): Promise<string | null> {
  const dir = path.join(jobsDir, site, 'traces');
  let names: string[];
  try {
    names = (await fs.readdir(dir)).filter((n) => n.endsWith('.jsonl')).sort();
  } catch {
    return null;
  }
  const last = names.at(-1);
  return last ? path.join(dir, last) : null;
}

export interface ScanOptions {
  site: string;
  jobsDir?: string;
  docsRoot?: string;
  tracePath?: string;
  accept?: boolean;
  acceptedBy?: string;
}

export async function scanDocs(opts: ScanOptions): Promise<ScanResult> {
  const docsDir = path.join(opts.docsRoot ?? 'docs/apis', opts.site);
  const texts: Record<string, string> = {};
  const sizes: Record<string, number> = {};
  for (const name of docFiles) {
    const file = path.join(docsDir, name);
    try {
      texts[name] = await fs.readFile(file, 'utf8');
      sizes[name] = (await fs.stat(file)).size;
    } catch {
      throw new MissingInput(`missing ${file}; run \`npm run apidocs -- build ${opts.site}\` first`);
    }
  }
  const trace = opts.tracePath ?? (await newestTrace(opts.jobsDir ?? 'jobs', opts.site));
  const secrets = trace ? await collectTraceSecrets(trace) : new Set<string>();
  const secretHits = findSecretHits(texts, secrets);
  let apiJson: unknown;
  try {
    apiJson = JSON.parse(texts['api.json']!);
  } catch (error) {
    throw new MissingInput(`api.json is not JSON: ${(error as Error).message}`);
  }
  const pii = findPii(apiJson);
  const noise = findNoise(apiJson);
  const oversize = docFiles.filter((n) => sizes[n]! > (n === 'README.md' ? readmeMaxBytes : fileMaxBytes));

  let verdict: ScanResult['verdict'] = secretHits.length > 0 ? 'fail' : pii.hits > 0 || oversize.length > 0 ? 'needs-review' : 'pass';
  const result: ScanResult = {
    site: opts.site,
    scannedAt: new Date().toISOString(),
    docsDir,
    trace,
    hash: await hashDocs(docsDir),
    verdict,
    secrets: { candidates: secrets.size, hits: secretHits },
    pii,
    sizes,
    oversize,
    noise,
  };
  if (opts.accept && verdict === 'needs-review') {
    result.verdict = 'pass';
    result.accepted = { by: opts.acceptedBy ?? 'unknown', at: result.scannedAt, fieldsAtAcceptance: pii.hits };
  }
  await fs.writeFile(path.join(docsDir, 'REVIEW.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}

export class MissingInput extends Error {}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const valueFlags = new Set(['--jobs', '--docs', '--trace']);
  let site: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]!;
    if (valueFlags.has(token)) i++;
    else if (!token.startsWith('--') && site === undefined) site = token;
  }
  if (!site) {
    process.stderr.write('usage: apidocs-docs-scan <site> [--jobs jobs] [--docs docs/apis] [--trace <file>] [--accept]\n');
    return 3;
  }
  const acceptedBy = process.env.GIT_AUTHOR_NAME ?? process.env.USERNAME ?? process.env.USER;
  let result: ScanResult;
  try {
    result = await scanDocs({
      site,
      jobsDir: flag(argv, 'jobs'),
      docsRoot: flag(argv, 'docs'),
      tracePath: flag(argv, 'trace'),
      accept: argv.includes('--accept'),
      acceptedBy,
    });
  } catch (error) {
    if (error instanceof MissingInput) {
      process.stderr.write(`${error.message}\n`);
      return 3;
    }
    throw error;
  }
  const out = (s: string) => process.stdout.write(`${s}\n`);
  out(`review ${result.site}: ${result.verdict}${result.accepted ? ` (accepted by ${result.accepted.by})` : ''}`);
  out(`  trace: ${result.trace ?? 'none found; secret check skipped'}`);
  out(`  secrets: ${result.secrets.candidates} trace values checked, ${result.secrets.hits.length} reached the docs`);
  for (const h of result.secrets.hits) out(`    LEAK ${h.file} ${h.kind} ${h.preview}`);
  out(`  pii: ${result.pii.hits} example values under personal-looking keys${result.pii.fields.length ? ', e.g.' : ''}`);
  for (const f of result.pii.fields.slice(0, 12)) out(`    ${f}`);
  if (result.pii.fields.length > 12) out(`    … ${result.pii.fields.length - 12} more in REVIEW.json`);
  out(`  sizes: ${docFiles.map((n) => `${n} ${(result.sizes[n]! / 1024).toFixed(0)}K`).join(', ')}${result.oversize.length ? ` (over limit: ${result.oversize.join(', ')})` : ''}`);
  out(`  noise: ${result.noise.length} endpoints that look like assets or trackers${result.noise.length ? ', e.g. ' + result.noise.slice(0, 3).join('; ') : ''}`);
  out(`  wrote ${path.join(result.docsDir, 'REVIEW.json')} (hash ${result.hash.slice(0, 12)})`);
  if (result.verdict === 'needs-review') out('  a person reads the listed fields, then reruns with --accept, or fixes derive and rebuilds');
  if (result.verdict === 'fail') out('  a trace value is in the docs: fix redaction in src/apidocs/derive.ts or redact.ts, rebuild, rescan');
  return result.verdict === 'pass' ? 0 : result.verdict === 'fail' ? 1 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
