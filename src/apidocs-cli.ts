// npm run apidocs -- <command> ...
//
//   record  <target> --workflow <file> [--attach <url> | --headed | --browserbase] [--host <h>]... [--hold-bodies] [--jobs <dir>]
//   inspect <trace.jsonl> [--step <id>] [--host <h>] [--grep <s>] [--show <exchangeId>] [--raw]
//   har     <trace.jsonl> [-o <out.har>]
//   build   <target> [--workflows <dir>] [--jobs <dir>] [--out <dir>] [--redact-key <k>]...   (keys also from target.redactKeys)
//   mine    <target> [--jobs <dir>]
//   snapshot <target> --attach <url> [--plan <file>] [--resume <runId>] [--only <id>]... [--group <g>]... [--per-id core|full]
//            [--max-ids N] [--ids-from <file>] [--months N] [--jobs <dir>] [--dry-run]
//
// Exit codes: 0 ok, 1 unexpected, 2 environment (browser, attach, every bundle fetch failed), 3 input (spec, trace),
// 4 run did not complete (a snapshot that is partial or aborted, a signed-in session that expired).
// `record` prunes traces older than traceRetentionDays before it starts. `build` reads every trace of the site,
// warns (never fails) when a workflow's latest run is not completed, picks up jobs/<site>/mined.json when `mine`
// wrote one, and writes the four outputs atomically. `mine` fetches the Script URLs of the latest trace without
// cookies into jobs/<site>/bundles/ (manifest.json is the durable record; a rerun resumes from it) and writes
// jobs/<site>/mined.json. `inspect` prints wire headers and cookies redacted unless --raw.
// Design: docs/design/api-docs.md §9, docs/design/teardown-parity.md §4.

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { writeAtomic } from './apidocs/atomic.js';
import { derive } from './apidocs/derive.js';
import { recordWithHumanDriver, siteIdOf, type BrowserSource } from './apidocs/drivers/human.js';
import { CaptureError, exitCodeFor } from './apidocs/errors.js';
import { bundleMaxBytes, bundlesMax, mineFetchConcurrency, mineFetchTimeoutMs, showBodyMaxChars, snapshotMonthsDefault } from './apidocs/limits.js';
import { toHar } from './apidocs/har.js';
import { extractChunkRefs, mergeMined, mineBundle, type MinedParts } from './apidocs/mine.js';
import { emptyRedactionPolicy, isSensitiveName, REDACTED } from './apidocs/redact.js';
import { renderApiDoc } from './apidocs/render/index.js';
import { assemble, listTraces, newRunId, pruneTraces, readTrace, tracePathFor } from './apidocs/trace.js';
import { MinedCodeSchema, WorkflowSchema, type Body, type Exchange, type MinedCode, type Trace, type Workflow } from './apidocs/types.js';
import { PageFetcher } from './apidocs/snapshot/fetcher.js';
import { describePlan, planRun, validatePlan } from './apidocs/snapshot/plan.js';
import { runSnapshot } from './apidocs/snapshot/runner.js';
import { SnapshotStore } from './apidocs/snapshot/store.js';
import { consentValid, loadTarget, type ResolvedTarget } from './target.js';

export interface ParsedArgs {
  command: 'record' | 'inspect' | 'har' | 'build' | 'mine' | 'snapshot';
  positional: string[];
  flags: Record<string, string | string[] | true>;
}

/** What `cliDeps.fetchText` returns: the status, the decoded body, and its size (the size alone when it was over the cap). */
export interface FetchedText {
  status: number;
  text: string;
  bytes: number;
}

/**
 * The one network call `mine` makes: a cookie-less, header-less GET that follows redirects and stops reading past
 * bundleMaxBytes (returning the size seen so far with an empty text). Never sends credentials: a bundle behind
 * sign-in is simply recorded failed.
 */
async function fetchText(url: string, signal: AbortSignal): Promise<FetchedText> {
  const response = await fetch(url, { signal, redirect: 'follow', credentials: 'omit' });
  const declared = Number(response.headers.get('content-length') ?? '0');
  if (declared > bundleMaxBytes) {
    await response.body?.cancel();
    return { status: response.status, text: '', bytes: declared };
  }
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  if (response.body) {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > bundleMaxBytes) {
        await reader.cancel();
        return { status: response.status, text: '', bytes };
      }
      chunks.push(value);
    }
  }
  return { status: response.status, text: new TextDecoder().decode(Buffer.concat(chunks)), bytes };
}

/**
 * The collaborators the commands call. Exported so tests can replace the ones that are not under test;
 * production code never writes to it.
 */
export const cliDeps = {
  recordWithHumanDriver,
  pruneTraces,
  newRunId,
  tracePathFor,
  listTraces,
  readTrace,
  assemble,
  toHar,
  derive,
  renderApiDoc,
  isSensitiveName,
  fetchText,
  attachFetcher: PageFetcher.attach.bind(PageFetcher),
  createStore: SnapshotStore.create.bind(SnapshotStore),
  resumeStore: SnapshotStore.resume.bind(SnapshotStore),
  runSnapshot,
};

// ---------------------------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------------------------

const usage: Record<ParsedArgs['command'], string> = {
  record:
    'apidocs record <target> --workflow <file> [--attach <url> | --headed | --browserbase] [--host <h>]... [--hold-bodies] [--jobs <dir>]',
  inspect: 'apidocs inspect <trace.jsonl> [--step <id>] [--host <h>] [--grep <s>] [--show <exchangeId>] [--raw]',
  har: 'apidocs har <trace.jsonl> [-o <out.har>]',
  build: 'apidocs build <target> [--workflows <dir>] [--jobs <dir>] [--out <dir>] [--redact-key <k>]...',
  mine: 'apidocs mine <target> [--jobs <dir>]',
  snapshot:
    'apidocs snapshot <target> --attach <http://127.0.0.1:port> [--plan <file>] [--resume <runId>] [--only <id>]... [--group <g>]... [--per-id core|full] [--max-ids N] [--ids-from <file>] [--months N] [--jobs <dir>] [--dry-run]',
};
const usageAll = Object.values(usage).join('\n');
const commands = Object.keys(usage) as ParsedArgs['command'][];

const valueFlags = new Set(['workflow', 'attach', 'host', 'jobs', 'step', 'grep', 'show', 'o', 'workflows', 'out', 'redact-key', 'plan', 'resume', 'only', 'group', 'per-id', 'max-ids', 'ids-from', 'months']);
const booleanFlags = new Set(['headed', 'browserbase', 'hold-bodies', 'raw', 'dry-run']);
const repeatableFlags = new Set(['host', 'redact-key', 'only', 'group']);

function usageError(message: string, command?: ParsedArgs['command']): CaptureError {
  return new CaptureError('workflow-invalid', message, `Usage:\n${command ? usage[command] : usageAll}`);
}

/** Throws CaptureError('workflow-invalid') on an unknown command or a flag that needs a value without one. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const [first, ...rest] = argv;
  if (!first || !(commands as string[]).includes(first)) {
    throw usageError(first ? `unknown command "${first}"` : 'no command given');
  }
  const command = first as ParsedArgs['command'];
  const positional: string[] = [];
  const flags: ParsedArgs['flags'] = {};

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i]!;
    const long = token.startsWith('--');
    if (!long && !(token.startsWith('-') && token.length === 2)) {
      positional.push(token);
      continue;
    }
    const body = long ? token.slice(2) : token.slice(1);
    const eq = body.indexOf('=');
    const name = eq === -1 ? body : body.slice(0, eq);
    const inline = eq === -1 ? undefined : body.slice(eq + 1);

    if (booleanFlags.has(name)) {
      if (inline !== undefined) throw usageError(`--${name} does not take a value`, command);
      flags[name] = true;
      continue;
    }
    if (!valueFlags.has(name) || (!long && name !== 'o')) {
      throw usageError(`unknown flag "${token}"`, command);
    }
    let value = inline;
    if (value === undefined) {
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('--')) throw usageError(`--${name} needs a value`, command);
      value = next;
      i += 1;
    }
    const existing = flags[name];
    if (repeatableFlags.has(name) && existing !== undefined && existing !== true) {
      flags[name] = [...(Array.isArray(existing) ? existing : [existing]), value];
    } else {
      flags[name] = value;
    }
  }
  return { command, positional, flags };
}

function flagString(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags[name];
  if (value === undefined || value === true) return undefined;
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function flagList(args: ParsedArgs, name: string): string[] {
  const value = args.flags[name];
  if (value === undefined || value === true) return [];
  return Array.isArray(value) ? value : [value];
}

function positionalOrThrow(args: ParsedArgs, what: string): string {
  const value = args.positional[0];
  if (!value) throw usageError(`missing ${what}`, args.command);
  return value;
}

function out(line = ''): void {
  process.stdout.write(`${line}\n`);
}

function warn(line: string): void {
  process.stderr.write(`warning: ${line}\n`);
}

async function loadTargetOrThrow(name: string, command: ParsedArgs['command']): Promise<ResolvedTarget> {
  const target = await loadTarget(name);
  if (!target) {
    throw new CaptureError(
      'workflow-invalid',
      `no target "${name}"`,
      `Create targets/${name}.json (name, startUrl, optional host) or pass a path to a target .json file.\nUsage:\n${usage[command]}`,
    );
  }
  return target;
}

async function readWorkflowFile(file: string): Promise<Workflow> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    throw new CaptureError('workflow-invalid', `cannot read workflow ${file}: ${(error as Error).message}`, 'Pass an existing workflow JSON file with --workflow.');
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new CaptureError('workflow-invalid', `${file} is not valid JSON: ${(error as Error).message}`, 'Workflow files are JSON; see docs/design/api-docs.md §3.');
  }
  const parsed = WorkflowSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n');
    throw new CaptureError('workflow-invalid', `${file} is not a valid workflow:\n${issues}`, 'Fix the fields listed above; see docs/design/api-docs.md §3 for the workflow shape.');
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------------------------
// record
// ---------------------------------------------------------------------------------------------

export async function record(args: ParsedArgs): Promise<number> {
  const targetName = positionalOrThrow(args, 'target');
  const workflowFile = flagString(args, 'workflow');
  if (!workflowFile) throw usageError('--workflow is required', 'record');
  const attach = flagString(args, 'attach');
  if (attach && args.flags.browserbase) throw usageError('--attach and --browserbase are exclusive', 'record');

  const target = await loadTargetOrThrow(targetName, 'record');
  const workflow = await readWorkflowFile(workflowFile);

  const jobsDir = flagString(args, 'jobs') ?? 'jobs';
  const site = siteIdOf(target);
  const removed = await cliDeps.pruneTraces(jobsDir, site);
  if (removed.length > 0) out(`pruned ${removed.length} old trace${removed.length === 1 ? '' : 's'}`);

  const browser: BrowserSource = attach
    ? { kind: 'attached', cdpUrl: attach }
    : args.flags.browserbase
      ? { kind: 'browserbase' }
      : { kind: 'local', headed: true };
  const runId = cliDeps.newRunId();
  const tracePath = cliDeps.tracePathFor(jobsDir, site, runId);

  const summary = await cliDeps.recordWithHumanDriver({
    target,
    workflow,
    browser,
    tracePath,
    runId,
    extraHosts: flagList(args, 'host'),
    holdBodies: args.flags['hold-bodies'] === true,
    io: { input: process.stdin, output: process.stdout },
    log: (line) => out(line),
  });

  out('');
  out(`run ${summary.runId}: ${summary.outcome}`);
  for (const step of summary.steps) {
    out(`  ${step.id.padEnd(24)} ${step.outcome.padEnd(8)} ${step.exchanges} exchange${step.exchanges === 1 ? '' : 's'}`);
  }
  const c = summary.counts;
  out(
    `exchanges ${c.exchanges} (in scope ${c.inScope}), bodies evicted ${c.bodies.evicted}, ` +
      `between steps ${c.attribution.betweenSteps}, before first step ${c.attribution.beforeFirstStep}`,
  );
  out(`trace: ${summary.tracePath}`);
  return summary.outcome === 'completed' ? 0 : 4;
}

// ---------------------------------------------------------------------------------------------
// inspect
// ---------------------------------------------------------------------------------------------


/** Target redactKeys first, then --redact-key flags; one entry per key, compared case-insensitively. */
export function mergeRedactKeys(fromTarget: readonly string[] | undefined, fromFlags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of [...(fromTarget ?? []), ...fromFlags]) {
    const lower = key.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    out.push(key);
  }
  return out;
}

function hostMatches(host: string, wanted: string): boolean {
  return host === wanted || host.endsWith(`.${wanted}`);
}

function sensitive(name: string): boolean {
  try {
    return cliDeps.isSensitiveName(name, emptyRedactionPolicy);
  } catch {
    // Fail closed: if the test cannot run, hide the value.
    return true;
  }
}

export async function inspect(args: ParsedArgs): Promise<number> {
  const file = positionalOrThrow(args, 'trace file');
  const read = await cliDeps.readTrace(file);
  const trace = cliDeps.assemble(read);
  const raw = args.flags.raw === true;

  const show = flagString(args, 'show');
  if (show) {
    const exchange = trace.exchanges.find((candidate) => candidate.id === show);
    if (!exchange) {
      throw new CaptureError('trace-unreadable', `no exchange "${show}" in ${file}`, 'List exchange ids with `apidocs inspect <trace.jsonl>`; the id is in the first column.');
    }
    printExchange(exchange, raw);
    printTraceFooter(trace, read.truncatedTail);
    return 0;
  }

  const stepFilter = flagString(args, 'step');
  const hostFilter = flagList(args, 'host');
  const grep = flagString(args, 'grep')?.toLowerCase();
  const setup = new Set<string>(trace.setupExchangeIds);
  const outside = new Set<string>(trace.outsideExchangeIds);

  const rows = trace.exchanges.filter((exchange) => {
    if (stepFilter && exchange.stepId !== stepFilter) return false;
    if (hostFilter.length > 0 && !hostFilter.some((h) => hostMatches(exchange.request.host, h))) return false;
    if (grep && !exchange.request.url.toLowerCase().includes(grep)) return false;
    return true;
  });

  out(`run ${trace.runId}  site ${trace.site}  driver ${trace.driver}  outcome ${trace.outcome}  complete ${trace.complete}`);
  out(`steps ${trace.steps.map((s) => `${s.id}:${s.outcome}`).join(' ') || '(none)'}`);
  out('');
  const header = ['seq', 'id', 'step', 'method', 'url', 'status', 'type', 'body'];
  const table = rows.map((exchange) => [
    String(exchange.seq),
    exchange.id,
    exchange.stepId ?? (setup.has(exchange.id) ? '(setup)' : outside.has(exchange.id) ? '(between)' : '-'),
    exchange.request.method,
    `${exchange.request.host}${exchange.request.path}`,
    exchange.response ? String(exchange.response.status) : exchange.outcome,
    exchange.resourceType,
    exchange.response?.bodyState ?? '-',
  ]);
  const widths = header.map((h, column) => Math.max(h.length, ...table.map((row) => row[column]!.length)));
  const format = (row: string[]): string => row.map((cell, column) => cell.padEnd(widths[column]!)).join('  ').trimEnd();
  out(format(header));
  for (const row of table) out(format(row));
  out('');
  out(`${rows.length} of ${trace.exchanges.length} exchanges shown`);
  printTraceFooter(trace, read.truncatedTail);
  return 0;
}

function printTraceFooter(trace: Trace, truncatedTail: boolean): void {
  out(`bad lines: ${trace.badLines.length}  truncatedTail: ${truncatedTail}`);
}

function headerLines(headers: readonly (readonly [string, string])[], raw: boolean): string[] {
  return headers.map(([name, value]) => `  ${name}: ${raw || !sensitive(name) ? value : REDACTED}`);
}

function bodyLines(body: Body | undefined, raw: boolean): string[] {
  if (!body) return ['  (none)'];
  if (body.encoding === 'text') {
    const text = !raw && body.text.length > showBodyMaxChars ? `${body.text.slice(0, showBodyMaxChars)}\n  ... ${body.text.length - showBodyMaxChars} more characters (use --raw for all)` : body.text;
    return [`  [text, ${body.bytes} bytes${body.truncated ? ', truncated' : ''}]`, ...text.split('\n').map((line) => `  ${line}`)];
  }
  if (body.encoding === 'base64') return [`  [binary, ${body.bytes} bytes${body.truncated ? ', truncated' : ''}]`];
  return [
    `  [multipart, boundary ${body.boundary}, ${body.bytes} bytes]`,
    ...body.parts.map((part) => {
      const content = 'text' in part.content ? `text, ${part.content.text.length} chars` : 'base64' in part.content ? 'binary' : 'omitted: file';
      return `  - ${part.name ?? '(unnamed)'}${part.filename ? ` filename=${part.filename}` : ''}${part.contentType ? ` type=${part.contentType}` : ''} (${content})`;
    }),
  ];
}

function printExchange(exchange: Exchange, raw: boolean): void {
  const { request, response } = exchange;
  out(`exchange ${exchange.id}  seq ${exchange.seq}  step ${exchange.stepId ?? '-'}  outcome ${exchange.outcome}${exchange.error ? ` (${exchange.error})` : ''}`);
  out(`target ${exchange.target.type} ${exchange.target.url}  resourceType ${exchange.resourceType}`);
  out(`initiator ${exchange.initiator.type}${exchange.initiator.url ? ` ${exchange.initiator.url}` : ''}`);
  out('');
  out(`${request.method} ${request.url}`);
  out(`request headers (${request.headersSource}):`);
  for (const line of headerLines(request.headers, raw)) out(line);
  out('request cookies:');
  if (request.cookies.length === 0) out('  (none)');
  for (const cookie of request.cookies) out(`  ${cookie.name}=${raw ? cookie.value : REDACTED}  domain=${cookie.domain} path=${cookie.path}`);
  out('request body:');
  for (const line of bodyLines(request.body, raw)) out(line);
  out('');
  if (!response) {
    out('no response');
  } else {
    out(`response ${response.status}  ${response.mimeType}  body ${response.bodyState}`);
    out('response headers:');
    for (const line of headerLines(response.headers, raw)) out(line);
    out('set-cookie:');
    if (response.setCookies.length === 0) out('  (none)');
    for (const cookie of response.setCookies) {
      const [pair = '', ...attributes] = cookie.split(';');
      const name = pair.split('=')[0] ?? '';
      out(`  ${raw ? cookie : [`${name}=${REDACTED}`, ...attributes.map((a) => a.trim())].join('; ')}`);
    }
    out('response body:');
    for (const line of bodyLines(response.body, raw)) out(line);
  }
}

// ---------------------------------------------------------------------------------------------
// har
// ---------------------------------------------------------------------------------------------

export async function har(args: ParsedArgs): Promise<number> {
  const file = positionalOrThrow(args, 'trace file');
  const trace = cliDeps.assemble(await cliDeps.readTrace(file));
  const target = flagString(args, 'o') ?? file.replace(/\.jsonl$/i, '') + '.har';
  await writeAtomic(target, `${JSON.stringify(cliDeps.toHar(trace), null, 2)}\n`);
  out(`wrote ${target} (${trace.exchanges.length} exchanges; values are not redacted, keep it private)`);
  return 0;
}

// ---------------------------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------------------------

export async function build(args: ParsedArgs): Promise<number> {
  const targetName = positionalOrThrow(args, 'target');
  const target = await loadTargetOrThrow(targetName, 'build');
  const site = siteIdOf(target);
  const workflowsDir = flagString(args, 'workflows') ?? path.join('workflows', site);
  const jobsDir = flagString(args, 'jobs') ?? 'jobs';
  const outDir = flagString(args, 'out') ?? path.join('docs', 'apis', site);

  let names: string[];
  try {
    names = (await fs.readdir(workflowsDir)).sort();
  } catch {
    throw new CaptureError('workflow-invalid', `cannot read workflows directory ${workflowsDir}`, `Put workflow .json files in ${workflowsDir} or pass --workflows <dir>.`);
  }
  const skipped = names.filter((name) => /\.ya?ml$/i.test(name));
  if (skipped.length > 0) warn(`YAML workflows are not read (JSON only): ${skipped.join(', ')}`);
  const workflows: Workflow[] = [];
  for (const name of names.filter((n) => n.endsWith('.json'))) {
    workflows.push(await readWorkflowFile(path.join(workflowsDir, name)));
  }
  if (workflows.length === 0) {
    throw new CaptureError('workflow-invalid', `no workflow .json files in ${workflowsDir}`, `Put workflow .json files in ${workflowsDir} or pass --workflows <dir>.`);
  }

  const paths = await cliDeps.listTraces(jobsDir, site);
  if (paths.length === 0) {
    throw new CaptureError(
      'trace-unreadable',
      `no traces for ${site} under ${jobsDir}`,
      `Run \`apidocs record ${targetName} --workflow <file>\` first; traces older than the retention period are deleted by record.`,
    );
  }
  const traces: { path: string; trace: Trace }[] = [];
  for (const file of paths) {
    traces.push({ path: file, trace: cliDeps.assemble(await cliDeps.readTrace(file)) });
  }

  for (const workflow of workflows) {
    const latest = [...traces].reverse().find((entry) => entry.trace.workflowId === workflow.id);
    if (!latest) warn(`workflow ${workflow.id} has no recorded run`);
    else if (latest.trace.outcome !== 'completed') warn(`workflow ${workflow.id}: latest run ${latest.trace.runId} is ${latest.trace.outcome}, not completed`);
  }

  const code = await readMinedCode(minedPathFor(jobsDir, site));

  const doc = cliDeps.derive({
    target,
    workflows,
    traces,
    redaction: { ...emptyRedactionPolicy, extraKeys: mergeRedactKeys(target.redactKeys, flagList(args, 'redact-key')) },
    ...(code ? { code } : {}),
  });
  const rendered = cliDeps.renderApiDoc(doc);
  for (const [name, text] of Object.entries(rendered)) {
    await writeAtomic(path.join(outDir, name), text);
  }

  const c = doc.coverage;
  out(`wrote ${Object.keys(rendered).join(', ')} to ${outDir}`);
  out(
    `coverage: steps with exchanges ${c.stepsWithExchanges}/${c.steps}, endpoints ${c.endpoints} (${c.endpointsWithExample} with example), ` +
      `bindings ${c.bindings}, inputs bound ${c.inputsBound}, computed ${c.computedValues}, bodies evicted ${c.bodiesEvicted}, between steps ${c.betweenSteps}`,
  );
  if (code) out(`code: routes ${code.routes.length}, enums ${code.enums.length} from mined.json`);
  return 0;
}

function minedPathFor(jobsDir: string, site: string): string {
  return path.join(jobsDir, site, 'mined.json');
}

/** `jobs/<site>/mined.json` when it exists and parses; a malformed file is a warning, not a failure. */
async function readMinedCode(file: string): Promise<MinedCode | undefined> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch {
    return undefined;
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (error) {
    warn(`${file} is not valid JSON (${(error as Error).message}); building without code routes`);
    return undefined;
  }
  const parsed = MinedCodeSchema.safeParse(json);
  if (!parsed.success) {
    warn(`${file} is not a mined.json this build understands; building without code routes. Rerun \`apidocs mine\`.`);
    return undefined;
  }
  return parsed.data;
}

// ---------------------------------------------------------------------------------------------
// mine
// ---------------------------------------------------------------------------------------------

/** One line of `jobs/<site>/bundles/manifest.json`: the acknowledgement that a bundle was fetched (or that it could not be). */
type ManifestEntry = { sha256: string; bytes: number; fetchedAt: string; file: string } | { failed: string; at: string };

interface BundleManifest {
  manifestVersion: 1;
  site: string;
  entries: Record<string, ManifestEntry>;
}

async function readManifest(file: string, site: string): Promise<BundleManifest> {
  const empty: BundleManifest = { manifestVersion: 1, site, entries: {} };
  let json: unknown;
  try {
    json = JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return empty;
  }
  const m = json as Partial<BundleManifest> | null;
  if (!m || m.manifestVersion !== 1 || m.site !== site || typeof m.entries !== 'object' || m.entries === null) {
    warn(`${file} is not a manifest for ${site}; starting a fresh one`);
    return empty;
  }
  return { manifestVersion: 1, site, entries: { ...m.entries } };
}

type FetchOutcome = { ok: true; text: string; bytes: number } | { ok: false; reason: string };

/** One GET with the timeout; a network error or a non-2xx status is a failure the caller may retry, `too-large` is not. */
async function fetchOnce(url: string): Promise<FetchOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), mineFetchTimeoutMs);
  try {
    const result = await cliDeps.fetchText(url, controller.signal);
    if (result.bytes > bundleMaxBytes) return { ok: false, reason: 'too-large' };
    if (result.status < 200 || result.status >= 300) return { ok: false, reason: `status ${result.status}` };
    return { ok: true, text: result.text, bytes: result.bytes };
  } catch (error) {
    const message = error instanceof Error ? (error.name === 'AbortError' ? `timeout after ${mineFetchTimeoutMs}ms` : error.message) : String(error);
    return { ok: false, reason: `network: ${message}` };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(url: string, attempts: number): Promise<FetchOutcome> {
  let last: FetchOutcome = { ok: false, reason: 'not attempted' };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    last = await fetchOnce(url);
    if (last.ok || last.reason === 'too-large') return last;
  }
  return last;
}

export async function mine(args: ParsedArgs): Promise<number> {
  const targetName = positionalOrThrow(args, 'target');
  const target = await loadTargetOrThrow(targetName, 'mine');
  const site = siteIdOf(target);
  const jobsDir = flagString(args, 'jobs') ?? 'jobs';

  const paths = await cliDeps.listTraces(jobsDir, site);
  const latest = paths[paths.length - 1];
  if (!latest) {
    throw new CaptureError(
      'trace-unreadable',
      `no traces for ${site} under ${jobsDir}`,
      `Run \`apidocs record ${targetName} --workflow <file>\` or the read-only tour first; mine reads the Script URLs of the latest trace.`,
    );
  }
  const trace = cliDeps.assemble(await cliDeps.readTrace(latest));
  const seeds = [
    ...new Set(
      trace.exchanges
        .filter((exchange) => exchange.resourceType === 'Script' && hostMatches(exchange.request.host, target.host))
        .map((exchange) => exchange.request.url),
    ),
  ].slice(0, bundlesMax);
  if (seeds.length === 0) {
    throw new CaptureError(
      'trace-unreadable',
      `latest trace ${latest} has no Script exchanges on ${target.host}`,
      'Record a run that loads the app (the start page must be on the target host); scripts served from another host are not mined.',
    );
  }

  const bundlesDir = path.join(jobsDir, site, 'bundles');
  const manifestFile = path.join(bundlesDir, 'manifest.json');
  const manifest = await readManifest(manifestFile, site);

  const queue = [...seeds];
  const known = new Set(seeds);
  const mined: MinedParts[] = [];
  let fetched = 0;
  let failed = 0;

  const resolveOne = async (url: string): Promise<{ url: string; text?: string }> => {
    const existing = manifest.entries[url];
    if (existing && 'sha256' in existing) {
      try {
        return { url, text: await fs.readFile(path.join(bundlesDir, existing.file), 'utf8') };
      } catch {
        // The manifest says fetched but the file is gone: fetch it again.
      }
    }
    const attempts = existing && 'failed' in existing ? 1 : 2;
    const outcome = await fetchWithRetry(url, attempts);
    const now = new Date().toISOString();
    if (!outcome.ok) {
      manifest.entries[url] = { failed: outcome.reason, at: now };
      return { url };
    }
    const sha256 = createHash('sha256').update(outcome.text).digest('hex');
    const file = `${sha256.slice(0, 16)}.js`;
    await writeAtomic(path.join(bundlesDir, file), outcome.text);
    manifest.entries[url] = { sha256, bytes: outcome.bytes, fetchedAt: now, file };
    return { url, text: outcome.text };
  };

  while (queue.length > 0) {
    const batch = queue.splice(0, mineFetchConcurrency);
    const results = await Promise.all(batch.map(resolveOne));
    for (const result of results) {
      if (result.text === undefined) {
        failed += 1;
        continue;
      }
      fetched += 1;
      mined.push(mineBundle(result.text));
      for (const ref of extractChunkRefs(result.text, result.url)) {
        if (known.has(ref) || known.size >= bundlesMax) continue;
        known.add(ref);
        queue.push(ref);
      }
    }
    await writeAtomic(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const merged = mergeMined(mined);
  const withMethod = merged.routes.filter((route) => route.methods.length > 0).length;
  const metric = `mined: bundles ${fetched} fetched, ${failed} failed, routes ${merged.routes.length} (${withMethod} with method), enums ${merged.enums.length}`;
  if (fetched === 0) {
    throw new CaptureError(
      'browser-unreachable',
      `${metric}\nno bundle could be fetched for ${site}`,
      `Bundles are fetched without cookies; see ${manifestFile} for the status of each URL. Check the network and that ${target.host} serves its scripts publicly, then rerun.`,
    );
  }

  const minedCode: MinedCode = MinedCodeSchema.parse({
    minedVersion: 1,
    site,
    minedAt: new Date().toISOString(),
    routes: merged.routes,
    enums: merged.enums,
    bundles: { fetched, failed },
  });
  const minedFile = minedPathFor(jobsDir, site);
  await writeAtomic(minedFile, `${JSON.stringify(minedCode, null, 2)}\n`);
  out(metric);
  out(`wrote ${minedFile}`);
  return 0;
}

// ---------------------------------------------------------------------------------------------
// snapshot
// ---------------------------------------------------------------------------------------------

function positiveInt(args: ParsedArgs, name: string): number | undefined {
  const raw = flagString(args, name);
  if (raw === undefined) return undefined;
  if (!/^[1-9]\d*$/.test(raw)) throw usageError(`--${name} needs a positive whole number`, 'snapshot');
  return Number(raw);
}

async function readJsonFile(file: string, what: string, code: 'plan-invalid' | 'workflow-invalid'): Promise<unknown> {
  let text: string;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch (error) {
    throw new CaptureError(code, `cannot read ${what} ${file}: ${(error as Error).message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new CaptureError(code, `${file} is not valid JSON: ${(error as Error).message}`);
  }
}

const nonProductionEnvironments = new Set(['staging', 'test', 'sandbox']);

/** Walk the documented GET endpoints of a consented account once and write a resumable record under jobs/<site>/snapshots/<runId>/. */
export async function snapshot(args: ParsedArgs): Promise<number> {
  const targetName = positionalOrThrow(args, 'target');
  const target = await loadTargetOrThrow(targetName, 'snapshot');
  const site = siteIdOf(target);
  const jobsDir = flagString(args, 'jobs') ?? 'jobs';
  const dryRun = args.flags['dry-run'] === true;

  const perId = flagString(args, 'per-id') ?? 'core';
  if (perId !== 'core' && perId !== 'full') throw usageError('--per-id is core or full', 'snapshot');
  const months = positiveInt(args, 'months') ?? snapshotMonthsDefault;
  const maxIds = positiveInt(args, 'max-ids');
  const only = flagList(args, 'only');
  const groups = flagList(args, 'group');
  const attach = flagString(args, 'attach');
  const resume = flagString(args, 'resume');
  if (!dryRun && !attach) throw usageError('--attach is required (the signed-in Chrome, e.g. http://127.0.0.1:9222)', 'snapshot');
  if (resume && dryRun) throw usageError('--resume and --dry-run are exclusive', 'snapshot');

  const planFile = flagString(args, 'plan') ?? path.join('snapshots', `${site}.json`);
  const planJson = await readJsonFile(planFile, 'plan', 'plan-invalid');
  const docFile = path.join('docs', 'apis', site, 'api.json');
  let doc: { endpoints: { id: string; method: string }[] } | undefined;
  try {
    const parsed = JSON.parse(await fs.readFile(docFile, 'utf8')) as { endpoints?: unknown };
    if (Array.isArray(parsed.endpoints)) doc = parsed as { endpoints: { id: string; method: string }[] };
  } catch {
    // Absent or unreadable: validate without it.
  }
  if (!doc) out(`note: ${docFile} not found; docId cross-checks skipped`);
  const plan = validatePlan(planJson, doc);

  const idsFromFile = flagString(args, 'ids-from');
  let idsFrom: Record<string, string[]> | undefined;
  if (idsFromFile) {
    const raw = await readJsonFile(idsFromFile, '--ids-from file', 'workflow-invalid');
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw) || Object.values(raw).some((v) => !Array.isArray(v))) {
      throw new CaptureError('workflow-invalid', `${idsFromFile} must be a JSON object of id name to an array of values`);
    }
    idsFrom = Object.fromEntries(Object.entries(raw as Record<string, unknown[]>).map(([k, v]) => [k, v.map(String)]));
  }

  const run = planRun(plan, { perId, ...(only.length > 0 ? { only } : {}), ...(groups.length > 0 ? { groups } : {}), ...(idsFrom ? { idsFrom } : {}) });

  if (dryRun) {
    const known = idsFrom ? Object.fromEntries(Object.entries(idsFrom).map(([k, v]) => [k, v.length])) : undefined;
    out(describePlan(plan, run.selected, { perId, months, ...(known ? { knownCounts: known } : {}) }));
    if (run.silent.length > 0) out(`\nalso fetched, not written, for ids or headers: ${run.silent.map((s) => s.endpoint.id).join(', ')}`);
    out(`\norigins needing a tab: ${run.origins.join(', ')}`);
    return 0;
  }

  const environment = (target as { environment?: string }).environment;
  const production = !nonProductionEnvironments.has(environment ?? '');
  if (production && !consentValid(target.snapshotConsent, new Date().toISOString().slice(0, 10))) {
    throw new CaptureError(
      'consent-missing',
      `${target.name} is a production target and has no valid snapshotConsent`,
      `Add { "by": ..., "on": "YYYY-MM-DD", "scope": "read" } as snapshotConsent in targets/${site}.json once the account owner has agreed (see docs/design/snapshot.md), or use --dry-run.`,
    );
  }

  const fetcher = await cliDeps.attachFetcher(attach!, plan, { origins: run.origins });
  let store: SnapshotStore | undefined;
  try {
    const runId = resume ?? cliDeps.newRunId();
    store = resume ? await cliDeps.resumeStore(jobsDir, site, runId) : await cliDeps.createStore(jobsDir, site, runId, plan);
    const summary = await cliDeps.runSnapshot({
      plan,
      site,
      runId,
      fetcher,
      store,
      ...(only.length > 0 ? { only } : {}),
      ...(groups.length > 0 ? { groups } : {}),
      perId,
      ...(maxIds !== undefined ? { maxIds } : {}),
      ...(idsFrom ? { idsFrom } : {}),
      months,
      now: () => new Date(),
      sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      log: (line) => out(line),
      resume: resume !== undefined,
    });
    out(`run dir: ${summary.dir}`);
    if (summary.status !== 'complete') {
      throw new CaptureError(
        'snapshot-incomplete',
        `snapshot ${summary.status}${summary.reason ? `: ${summary.reason}` : ''}`,
        `See ${path.join(summary.dir, 'manifest.json')} and failures.ndjson; fix the cause and rerun with --resume ${summary.runId}.`,
      );
    }
    return 0;
  } finally {
    await store?.close().catch(() => undefined);
    await fetcher.close().catch(() => undefined);
  }
}


export async function main(argv: readonly string[]): Promise<number> {
  try {
    const args = parseArgs(argv);
    switch (args.command) {
      case 'record':
        return await record(args);
      case 'inspect':
        return await inspect(args);
      case 'har':
        return await har(args);
      case 'build':
        return await build(args);
      case 'mine':
        return await mine(args);
      case 'snapshot':
        return await snapshot(args);
    }
  } catch (error) {
    if (error instanceof CaptureError) {
      process.stderr.write(`${error.message}\n${error.fix ? `${error.fix}\n` : ''}`);
      return exitCodeFor(error.code);
    }
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

const invokedDirectly = process.argv[1]?.endsWith('apidocs-cli.ts') || process.argv[1]?.endsWith('apidocs-cli.js');
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
