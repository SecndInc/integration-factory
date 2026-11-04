// npm run apidocs -- <command> ...
//
//   record  <target> --workflow <file> [--attach <url> | --headed | --browserbase] [--host <h>]... [--hold-bodies] [--jobs <dir>]
//   inspect <trace.jsonl> [--step <id>] [--host <h>] [--grep <s>] [--show <exchangeId>] [--raw]
//   har     <trace.jsonl> [-o <out.har>]
//   build   <target> [--workflows <dir>] [--jobs <dir>] [--out <dir>] [--redact-key <k>]...
//
// Exit codes: 0 ok, 1 unexpected, 2 environment (browser, attach), 3 input (spec, trace), 4 run did not complete.
// `record` prunes traces older than traceRetentionDays before it starts. `build` reads every trace of the site,
// warns (never fails) when a workflow's latest run is not completed, and writes the four outputs atomically.
// `inspect` prints wire headers and cookies redacted unless --raw. Design: docs/design/api-docs.md §9.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { derive } from './apidocs/derive.js';
import { recordWithHumanDriver, siteIdOf, type BrowserSource } from './apidocs/drivers/human.js';
import { CaptureError, exitCodeFor } from './apidocs/errors.js';
import { showBodyMaxChars } from './apidocs/limits.js';
import { toHar } from './apidocs/har.js';
import { emptyRedactionPolicy, isSensitiveName, REDACTED } from './apidocs/redact.js';
import { renderApiDoc } from './apidocs/render/index.js';
import { assemble, listTraces, newRunId, pruneTraces, readTrace, tracePathFor } from './apidocs/trace.js';
import { WorkflowSchema, type Body, type Exchange, type Trace, type Workflow } from './apidocs/types.js';
import { loadTarget, type ResolvedTarget } from './target.js';

export interface ParsedArgs {
  command: 'record' | 'inspect' | 'har' | 'build';
  positional: string[];
  flags: Record<string, string | string[] | true>;
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
};
const usageAll = Object.values(usage).join('\n');
const commands = Object.keys(usage) as ParsedArgs['command'][];

const valueFlags = new Set(['workflow', 'attach', 'host', 'jobs', 'step', 'grep', 'show', 'o', 'workflows', 'out', 'redact-key']);
const booleanFlags = new Set(['headed', 'browserbase', 'hold-bodies', 'raw']);
const repeatableFlags = new Set(['host', 'redact-key']);

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

/** Write to `<file>.tmp`, then rename over `file`, so a reader never sees half a file. */
async function writeAtomic(file: string, text: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
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

  const doc = cliDeps.derive({
    target,
    workflows,
    traces,
    redaction: { ...emptyRedactionPolicy, extraKeys: flagList(args, 'redact-key') },
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
  return 0;
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
