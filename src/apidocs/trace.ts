// Trace file I/O and the pure fold from lines to a Trace. Narrow Zod schemas parse the CDP
// params here, never in the recorder. Design: docs/design/api-docs.md §3, §4, §7, §8.

import { randomBytes } from 'node:crypto';
import { createReadStream, mkdirSync, promises as fsp } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { requestBody, responseBody } from './body.js';
import { CaptureError } from './errors.js';
import { traceRetentionDays, webSocketBudgetBytes } from './limits.js';
import type {
  Action,
  BadLine,
  BodyLine,
  BodyState,
  Cookie,
  Counts,
  EndLine,
  Exchange,
  ExchangeId,
  Headers,
  Initiator,
  RunId,
  RunLine,
  SessionId,
  SiteId,
  Snapshot,
  StepRun,
  TargetInfo,
  Trace,
  TraceLine,
  WebSocketFrame,
} from './types.js';
import { TraceLineSchema } from './types.js';

// ---- Narrow CDP param schemas. Unknown fields pass through; a missing required field fails the line, not the file.

export const RequestWillBeSentSchema = z.object({
  requestId: z.string(),
  loaderId: z.string().optional(),
  documentURL: z.string().optional(),
  timestamp: z.number(),
  wallTime: z.number(),
  request: z.object({
    url: z.string(),
    method: z.string(),
    headers: z.record(z.string(), z.string()),
    postData: z.string().optional(),
    hasPostData: z.boolean().optional(),
    postDataEntries: z.array(z.object({ bytes: z.string().optional() })).optional(),
  }),
  initiator: z.object({
    type: z.string(),
    url: z.string().optional(),
    lineNumber: z.number().optional(),
    stack: z.unknown().optional(),
  }),
  redirectResponse: z.unknown().optional(),
  type: z.string().optional(),
  frameId: z.string().optional(),
  hasUserGesture: z.boolean().optional(),
});

export const RequestWillBeSentExtraInfoSchema = z.object({
  requestId: z.string(),
  associatedCookies: z.array(z.object({ cookie: z.record(z.string(), z.unknown()), blockedReasons: z.array(z.string()) })),
  headers: z.record(z.string(), z.string()),
});

export const ResponseReceivedSchema = z.object({
  requestId: z.string(),
  timestamp: z.number(),
  type: z.string(),
  response: z.object({
    url: z.string(),
    status: z.number(),
    statusText: z.string().optional(),
    headers: z.record(z.string(), z.string()),
    mimeType: z.string(),
    fromDiskCache: z.boolean().optional(),
    fromServiceWorker: z.boolean().optional(),
    protocol: z.string().optional(),
  }),
  hasExtraInfo: z.boolean().optional(),
});

export const ResponseReceivedExtraInfoSchema = z.object({
  requestId: z.string(),
  headers: z.record(z.string(), z.string()),
  statusCode: z.number(),
  blockedCookies: z.array(z.unknown()).optional(),
});

export const LoadingFinishedSchema = z.object({ requestId: z.string(), timestamp: z.number(), encodedDataLength: z.number() });
export const LoadingFailedSchema = z.object({
  requestId: z.string(),
  timestamp: z.number(),
  errorText: z.string(),
  canceled: z.boolean().optional(),
  blockedReason: z.string().optional(),
});
export const RequestServedFromCacheSchema = z.object({ requestId: z.string() });
export const WebSocketCreatedSchema = z.object({ requestId: z.string(), url: z.string(), initiator: z.unknown().optional() });
export const WebSocketFrameSchema = z.object({
  requestId: z.string(),
  timestamp: z.number(),
  response: z.object({ opcode: z.number(), mask: z.boolean(), payloadData: z.string() }),
});
export const WebSocketClosedSchema = z.object({ requestId: z.string(), timestamp: z.number() });
export const EventSourceMessageSchema = z.object({
  requestId: z.string(),
  timestamp: z.number(),
  eventName: z.string(),
  eventId: z.string(),
  data: z.string(),
});

/** The `redirectResponse` of a hop-closing requestWillBeSent. */
const RedirectResponseSchema = z.object({
  status: z.number(),
  headers: z.record(z.string(), z.string()),
  mimeType: z.string().optional(),
  protocol: z.string().optional(),
});
const StackSchema = z.object({
  callFrames: z.array(z.object({ url: z.string(), functionName: z.string(), lineNumber: z.number() })).min(1),
});

// ---- File I/O

export interface ReadTraceResult {
  lines: readonly (TraceLine | BadLine)[];
  /** True when the file ended mid-line (a crash). The partial line is dropped. */
  truncatedTail: boolean;
}

function seqOf(json: unknown): number | undefined {
  if (typeof json === 'object' && json !== null && 'seq' in json && typeof json.seq === 'number') return json.seq;
  return undefined;
}

/**
 * BadLine.seq convention: the line's own `seq` when its JSON parsed and carried one; otherwise
 * `-lineNo` (negative, 1-based file line), which can never collide with a writer `seq`.
 */
function parseLine(raw: string, lineNo: number): TraceLine | BadLine {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { kind: 'bad', seq: -lineNo, raw, error: `not JSON: ${(e as Error).message}` };
  }
  const parsed = TraceLineSchema.safeParse(json);
  if (parsed.success) return parsed.data;
  const error = parsed.error.issues.map((i) => `${i.path.join('.') || '(line)'}: ${i.message}`).join('; ');
  return { kind: 'bad', seq: seqOf(json) ?? -lineNo, raw, error };
}

/** The first line must be a run line of a known version; anything else means this is not a trace. */
function checkRunLine(raw: string | undefined, file: string): void {
  const unreadable = (why: string): CaptureError =>
    new CaptureError('trace-unreadable', `${file}: ${why}`, 'Record again with `apidocs record`; the file is not a trace.');
  if (raw === undefined) throw unreadable('the file has no lines');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw unreadable('the first line is not JSON');
  }
  if (typeof json !== 'object' || json === null || !('kind' in json) || json.kind !== 'run') throw unreadable('the first line is not a run line');
  const version = 'traceVersion' in json ? json.traceVersion : undefined;
  if (version !== 1) {
    throw new CaptureError('trace-version', `${file}: traceVersion ${String(version)} is not supported (this build reads 1)`, 'Update integration-factory, or re-record the trace.');
  }
}

/**
 * Tolerant reader. Throws CaptureError('trace-unreadable') when the file is missing or its first
 * line is not a run line, and CaptureError('trace-version') when its traceVersion is unknown.
 * Every other bad line is kept as {kind:'bad'} so counts stay honest. A last line with no
 * newline that does not parse is a cut tail: dropped, `truncatedTail: true`.
 */
export async function readTrace(path: string): Promise<ReadTraceResult> {
  const rawLines: { text: string; terminated: boolean }[] = [];
  let rest = '';
  try {
    const stream = createReadStream(path, { encoding: 'utf8' });
    for await (const chunk of stream) {
      rest += chunk as string;
      let nl = rest.indexOf('\n');
      while (nl >= 0) {
        rawLines.push({ text: rest.slice(0, nl).replace(/\r$/, ''), terminated: true });
        rest = rest.slice(nl + 1);
        nl = rest.indexOf('\n');
      }
    }
  } catch (e) {
    throw new CaptureError('trace-unreadable', `cannot read ${path}: ${(e as Error).message}`, 'Check the path, or list traces with `apidocs inspect`.');
  }
  if (rest.length > 0) rawLines.push({ text: rest.replace(/\r$/, ''), terminated: false });

  const numbered = rawLines.map((l, i) => ({ ...l, lineNo: i + 1 })).filter((l) => l.text.trim() !== '');
  checkRunLine(numbered[0]?.text, path);

  const lines: (TraceLine | BadLine)[] = [];
  let truncatedTail = false;
  for (const l of numbered) {
    const parsed = parseLine(l.text, l.lineNo);
    if (parsed.kind === 'bad' && !l.terminated) {
      truncatedTail = true;
      continue;
    }
    lines.push(parsed);
  }
  // The run line itself must also pass its schema, not only the version check.
  if (lines[0]?.kind !== 'run') {
    throw new CaptureError('trace-unreadable', `${path}: the run line is malformed`, 'Record again with `apidocs record`.');
  }
  return { lines, truncatedTail };
}

/** A site or run id becomes a path segment, so it may not hold a separator or be `.`/`..`. */
function assertSegment(kind: string, value: string): void {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value === '.' || value === '..') {
    throw new CaptureError('workflow-invalid', `${kind} ${JSON.stringify(value)} is not a safe path segment`, 'Use letters, digits, dot, dash and underscore only.');
  }
}

/** `<jobsDir>/<site>/traces/trace-<runId>.jsonl`. Creates the directory. Rejects an unsafe site or runId. */
export function tracePathFor(jobsDir: string, site: SiteId, runId: RunId): string {
  assertSegment('site', site);
  assertSegment('runId', runId);
  const dir = path.join(jobsDir, site, 'traces');
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `trace-${runId}.jsonl`);
}

/** `<iso compact, e.g. 20261103T191204Z>-<hex4>`. Sorts by start time. */
export function newRunId(now: Date = new Date()): RunId {
  const compact = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return `${compact}-${randomBytes(2).toString('hex')}` as RunId;
}

/** Every trace path under `<jobsDir>/<site>/traces`, oldest first (run ids sort by start time). */
export async function listTraces(jobsDir: string, site: SiteId): Promise<string[]> {
  assertSegment('site', site);
  const dir = path.join(jobsDir, site, 'traces');
  let names: string[];
  try {
    names = await fsp.readdir(dir);
  } catch {
    return [];
  }
  return names
    .filter((n) => /^trace-.+\.jsonl$/.test(n))
    .sort()
    .map((n) => path.join(dir, n));
}

async function firstLineOf(file: string): Promise<string | undefined> {
  const stream = createReadStream(file, { encoding: 'utf8' });
  let buf = '';
  try {
    for await (const chunk of stream) {
      buf += chunk as string;
      const nl = buf.indexOf('\n');
      if (nl >= 0) return buf.slice(0, nl);
    }
  } finally {
    stream.destroy();
  }
  return buf === '' ? undefined : buf;
}

const msPerDay = 24 * 60 * 60 * 1e3;

/** Deletes traces whose run line startedAt is older than traceRetentionDays. Returns the paths removed. */
export async function pruneTraces(jobsDir: string, site: SiteId, now: Date = new Date()): Promise<string[]> {
  assertSegment('site', site);
  const cutoff = now.getTime() - traceRetentionDays * msPerDay;
  const removed: string[] = [];
  for (const file of await listTraces(jobsDir, site)) {
    let startedMs: number | undefined;
    try {
      const first = await firstLineOf(file);
      const json: unknown = first === undefined ? undefined : JSON.parse(first);
      const startedAt = typeof json === 'object' && json !== null && 'startedAt' in json ? json.startedAt : undefined;
      if (typeof startedAt === 'string' && !Number.isNaN(Date.parse(startedAt))) startedMs = Date.parse(startedAt);
    } catch {
      // fall through to mtime
    }
    startedMs ??= (await fsp.stat(file)).mtimeMs;
    if (startedMs < cutoff) {
      await fsp.rm(file, { force: true });
      removed.push(file);
    }
  }
  return removed;
}

// ---- The fold

/**
 * Exact match or subdomain of any listed host (same rule as filterHost in playwright-capture.ts).
 * Shared with derive. A port on `host` is ignored.
 */
export function inScope(host: string, hosts: readonly string[]): boolean {
  const h = host.toLowerCase().replace(/:\d+$/, '');
  if (h === '') return false;
  return hosts.some((raw) => {
    const x = raw.toLowerCase().replace(/^\*?\./, '').replace(/:\d+$/, '');
    return x !== '' && (h === x || h.endsWith(`.${x}`));
  });
}

/** Resource types whose bodies are kept. Everything else is headers only. */
export const bodyTypes = ['Document', 'XHR', 'Fetch', 'EventSource', 'Other'] as const;

const msPerSecond = 1e3;

interface Term {
  kind: 'finished' | 'failed' | 'aborted' | 'closed' | 'redirected';
  /** Monotonic CDP timestamp, when the event had one. */
  ts?: number;
  /** Writer clock, ms, otherwise. */
  atMs?: number;
  error?: string;
  canceled?: boolean;
}

/** Everything the fold learned about one request hop. Exchange fields are derived from it in finalize(). */
interface Hop {
  ex: Exchange;
  sessionId: SessionId;
  requestId: string;
  baseTs: number;
  baseWall: number;
  isWs: boolean;
  rws?: z.infer<typeof RequestWillBeSentSchema>;
  reqExtra?: z.infer<typeof RequestWillBeSentExtraInfoSchema>;
  resp?: z.infer<typeof ResponseReceivedSchema>;
  respExtra?: z.infer<typeof ResponseReceivedExtraInfoSchema>;
  redirectResp?: z.infer<typeof RedirectResponseSchema>;
  fromCache: boolean;
  term?: Term;
  bodies: BodyLine[];
  frames: WebSocketFrame[];
  framesDropped: number;
  wsBytes: number;
  attributedInScope: boolean;
}

type MutableStep = Omit<StepRun, 'exchangeIds' | 'actions'> & { exchangeIds: ExchangeId[]; actions: Action[] };

function toHeaders(record: Readonly<Record<string, string>>): Headers {
  const out: [string, string][] = [];
  for (const [name, value] of Object.entries(record)) {
    // CDP joins repeated Set-Cookie lines with \n; wire order and duplicates are kept as separate entries.
    if (name.toLowerCase() === 'set-cookie') for (const line of value.split('\n')) out.push([name, line]);
    else out.push([name, value]);
  }
  return out;
}

function headerValue(headers: Headers, name: string): string | undefined {
  const lower = name.toLowerCase();
  return headers.find(([n]) => n.toLowerCase() === lower)?.[1];
}

function splitUrl(url: string): { host: string; path: string; query: [string, string][] } {
  try {
    const u = new URL(url);
    return { host: u.host, path: u.pathname, query: [...u.searchParams.entries()] };
  } catch {
    return { host: '', path: url, query: [] };
  }
}

function initiatorOf(i: { type: string; url?: string | undefined; lineNumber?: number | undefined; stack?: unknown }): Initiator {
  const out: Initiator = { type: i.type };
  if (i.url !== undefined) out.url = i.url;
  if (i.lineNumber !== undefined) out.lineNumber = i.lineNumber;
  const stack = StackSchema.safeParse(i.stack);
  if (stack.success) {
    const top = stack.data.callFrames[0]!;
    out.stackTop = { url: top.url, functionName: top.functionName, lineNumber: top.lineNumber };
  }
  return out;
}

function cookiesOf(extra: z.infer<typeof RequestWillBeSentExtraInfoSchema>): Cookie[] {
  const out: Cookie[] = [];
  for (const { cookie, blockedReasons } of extra.associatedCookies) {
    if (blockedReasons.length > 0) continue; // not sent on the wire
    const str = (k: string): string => (typeof cookie[k] === 'string' ? (cookie[k] as string) : '');
    const c: Cookie = {
      name: str('name'),
      value: str('value'),
      domain: str('domain'),
      path: str('path') || '/',
      httpOnly: cookie.httpOnly === true,
      secure: cookie.secure === true,
    };
    if (typeof cookie.sameSite === 'string') c.sameSite = cookie.sameSite;
    out.push(c);
  }
  return out;
}

/** Prefer a body that landed (`ok`), then a Fetch-domain read over a Network read, then the later line. */
function pickBody(lines: readonly BodyLine[], side: 'request' | 'response'): BodyLine | undefined {
  let best: BodyLine | undefined;
  const rank = (l: BodyLine): number => (l.state === 'ok' ? 2 : 0) + (l.source === 'fetch' ? 1 : 0);
  for (const l of lines) {
    if (l.side !== side) continue;
    if (best === undefined || rank(l) >= rank(best)) best = l;
  }
  return best;
}

/**
 * Pure fold over lines in file order, which is `seq` order: one writer, one counter. Invariants it encodes:
 *  - exchange.stepId is the step whose begin precedes the requestWillBeSent line with no end in between;
 *    before the first begin -> setupExchangeIds; between an end and the next begin -> outsideExchangeIds
 *  - a requestWillBeSent with redirectResponse closes hop n as completed(3xx, redirectTo) and opens hop n+1, same requestId
 *  - response/finished/failed/body lines attach by (sessionId, requestId) to the open hop; with no open hop they
 *    count as orphanEvents and still produce an exchange with headersSource 'renderer' and what the response carried
 *  - request.headers is the wire set from requestWillBeSentExtraInfo when present (headersSource 'wire'), else the renderer set
 *  - a session detach aborts its in-flight exchanges; a missing end line leaves them inflight and the open step interrupted
 *  - body lines: source 'fetch' wins over 'network' for the same request; loadingFinished with no body line -> bodyState 'lost';
 *    resource types outside bodyTypes -> 'skipped'
 *  - WebSocket: one exchange per socket with ws.frames; frames past webSocketBudgetBytes are counted in framesDropped
 *  - timestamps: wallTime from requestWillBeSent; later events convert with wallTime + (timestamp - first timestamp)
 *  - complete = end line present and !truncatedTail; outcome from the end line, else 'interrupted'
 *
 * Choices the invariants leave open:
 *  - Lines are folded in stable `seq` order, whatever order they arrive in; two lines with the same `seq`
 *    throw CaptureError('trace-unreadable'). Bad lines (see parseLine for their negative seq) are carried
 *    in badLines, sorted by seq, and never folded.
 *  - Exchanges on hosts outside run.scope.hosts are kept in `exchanges` only: no stepId, not in
 *    outsideExchangeIds (that list is between-steps and after-last-end, so its length equals
 *    counts.attribution.betweenSteps), and not counted in `counts.attribution` or `counts.bodies`.
 *  - An exchange that ended (completed, failed or aborted) with a response but no usable body line is 'lost',
 *    counted under counts.bodies.error because Counts has no `lost` field.
 *  - `counts` is always the fold's; the end line's own counts are not carried (Trace has no field for them).
 */
export function assemble(input: ReadTraceResult): Trace {
  const run = input.lines.find((l): l is RunLine => l.kind === 'run');
  if (!run) throw new CaptureError('trace-unreadable', 'the trace has no run line', 'Record again with `apidocs record`.');
  const maxBytes = run.bodies.maxBytes;

  const targets = new Map<string, TargetInfo>();
  const targetList: TargetInfo[] = [];
  const steps: MutableStep[] = [];
  const snapshots: Snapshot[] = [];
  const badLines: BadLine[] = [];
  const hops: Hop[] = [];
  const latest = new Map<string, Hop>();
  const hopCount = new Map<string, number>();
  const pendingReqExtra = new Map<string, z.infer<typeof RequestWillBeSentExtraInfoSchema>>();
  const setupIds: ExchangeId[] = [];
  const outsideIds: ExchangeId[] = [];
  let endLine: EndLine | undefined;

  let phase: 'before' | 'in' | 'between' = 'before';
  let open: MutableStep | undefined;
  let lastActionSeq: number | undefined;
  let orphanEvents = 0;
  const attribution = { inStep: 0, betweenSteps: 0, beforeFirstStep: 0 };

  const keyOf = (sessionId: string, requestId: string): string => `${sessionId}\u0000${requestId}`;
  const iso = (hop: Hop, ts: number): string => new Date((hop.baseWall + (ts - hop.baseTs)) * msPerSecond).toISOString();
  const msAt = (hop: Hop, ts: number): number => Math.round((hop.baseWall + (ts - hop.baseTs)) * msPerSecond);

  const badFromCdp = (line: Extract<TraceLine, { kind: 'cdp' }>, error: z.ZodError): void => {
    badLines.push({ kind: 'bad', seq: line.seq, raw: JSON.stringify(line), error: `${line.method}: ${error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` });
  };

  const targetFor = (sessionId: SessionId): Exchange['target'] => {
    const t = targets.get(sessionId);
    if (!t) return { sessionId, type: 'unknown', url: '' };
    const out: Exchange['target'] = { sessionId, type: t.type, url: t.url };
    if (t.openerId !== undefined) out.openerId = t.openerId;
    return out;
  };

  /** Creates the hop and applies the attribution rule. The only place an exchange is born. */
  const openHop = (a: {
    sessionId: SessionId;
    requestId: string;
    seq: number;
    method: string;
    url: string;
    headers: Headers;
    resourceType: string;
    initiator: Initiator;
    baseTs: number;
    baseWall: number;
    isWs: boolean;
    rws?: z.infer<typeof RequestWillBeSentSchema>;
  }): Hop => {
    const key = keyOf(a.sessionId, a.requestId);
    const n = hopCount.get(key) ?? 0;
    hopCount.set(key, n + 1);
    const u = splitUrl(a.url);
    const ex: Exchange = {
      id: `${a.sessionId}:${a.requestId}:${n}` as ExchangeId,
      seq: a.seq,
      target: targetFor(a.sessionId),
      resourceType: a.resourceType,
      initiator: a.initiator,
      request: {
        method: a.method,
        url: a.url,
        host: u.host,
        path: u.path,
        query: u.query,
        headers: a.headers,
        headersSource: 'renderer',
        cookies: [],
        at: new Date(a.baseWall * msPerSecond).toISOString(),
      },
      outcome: 'inflight',
      timing: { startMs: Math.round(a.baseWall * msPerSecond) },
    };
    const hop: Hop = {
      ex,
      sessionId: a.sessionId,
      requestId: a.requestId,
      baseTs: a.baseTs,
      baseWall: a.baseWall,
      isWs: a.isWs,
      fromCache: false,
      bodies: [],
      frames: [],
      framesDropped: 0,
      wsBytes: 0,
      attributedInScope: false,
    };
    if (a.rws) hop.rws = a.rws;
    const pending = pendingReqExtra.get(key);
    if (pending && !a.isWs) {
      hop.reqExtra = pending;
      pendingReqExtra.delete(key);
    }

    // Out-of-scope hosts stay in `exchanges` only: no stepId, no list, no attribution count.
    if (inScope(u.host, run.scope.hosts)) {
      hop.attributedInScope = true;
      if (phase === 'before') {
        setupIds.push(ex.id);
        attribution.beforeFirstStep++;
      } else if (phase === 'in' && open) {
        ex.stepId = open.id;
        if (lastActionSeq !== undefined) ex.actionSeq = lastActionSeq;
        open.exchangeIds.push(ex.id);
        attribution.inStep++;
      } else {
        outsideIds.push(ex.id);
        attribution.betweenSteps++;
      }
    }
    hops.push(hop);
    latest.set(key, hop);
    return hop;
  };

  const foldable: Exclude<TraceLine, RunLine>[] = [];
  for (const l of input.lines) {
    if (l.kind === 'bad') badLines.push(l);
    else if (l.kind !== 'run') foldable.push(l);
  }
  foldable.sort((a, b) => a.seq - b.seq); // Array.prototype.sort is stable
  for (let i = 1; i < foldable.length; i++) {
    if (foldable[i]!.seq === foldable[i - 1]!.seq) {
      throw new CaptureError('trace-unreadable', `two trace lines share seq ${foldable[i]!.seq}`, 'The file was written by two writers or edited; record again.');
    }
  }

  for (const line of foldable) {
    switch (line.kind) {
      case 'end':
        endLine = line;
        break;
      case 'target': {
        if (line.event === 'attached') {
          const info: TargetInfo = { sessionId: line.sessionId, targetId: line.targetId, type: line.type, url: line.url, attachedAt: line.at };
          if (line.openerId !== undefined) info.openerId = line.openerId;
          targets.set(line.sessionId, info);
          targetList.push(info);
        } else {
          const info = targets.get(line.sessionId);
          if (info) info.detachedAt = line.at;
          for (const h of hops) {
            if (h.sessionId === line.sessionId && !h.term) h.term = { kind: 'aborted', atMs: Date.parse(line.at) };
          }
        }
        break;
      }
      case 'step': {
        if (line.phase === 'begin') {
          if (open) {
            open.outcome = 'interrupted';
          }
          open = { id: line.id, index: line.index, startedAt: line.at, outcome: 'interrupted', exchangeIds: [], actions: [] };
          if (line.text !== undefined) open.text = line.text;
          steps.push(open);
          phase = 'in';
          lastActionSeq = undefined;
        } else if (open && open.id === line.id) {
          open.endedAt = line.at;
          open.outcome = line.outcome ?? 'ok';
          if (line.text !== undefined && open.text === undefined) open.text = line.text;
          if (line.note !== undefined) open.note = line.note;
          open = undefined;
          phase = 'between';
          lastActionSeq = undefined;
        }
        break;
      }
      case 'action': {
        const target = open && open.id === line.stepId ? open : [...steps].reverse().find((s) => s.id === line.stepId);
        if (!target) break;
        const a: Action = { seq: line.seq, at: line.at, action: line.action, detail: line.detail };
        if (line.url !== undefined) a.url = line.url;
        target.actions.push(a);
        if (target === open) lastActionSeq = line.seq;
        break;
      }
      case 'snapshot':
        snapshots.push({ seq: line.seq, at: line.at, stepId: line.stepId, cookies: line.cookies, storage: line.storage });
        break;
      case 'body': {
        const hop = latest.get(keyOf(line.sessionId, line.requestId));
        if (hop) hop.bodies.push(line);
        else orphanEvents++;
        break;
      }
      case 'cdp': {
        const sid = line.sessionId;
        const params = line.params;
        const at = Date.parse(line.at);
        /** The latest hop of this request, or an orphan count when there is none. */
        const hopFor = (requestId: string): Hop | undefined => {
          const h = latest.get(keyOf(sid, requestId));
          if (!h) orphanEvents++;
          return h;
        };
        const end = (requestId: string, term: Term): void => {
          const h = hopFor(requestId);
          if (h && !h.term) h.term = term;
        };

        switch (line.method) {
          case 'Network.requestWillBeSent': {
            const p = RequestWillBeSentSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const x = p.data;
            const prev = latest.get(keyOf(sid, x.requestId));
            const redirect = prev && x.redirectResponse !== undefined ? RedirectResponseSchema.safeParse(x.redirectResponse) : undefined;
            const hop = openHop({
              sessionId: sid,
              requestId: x.requestId,
              seq: line.seq,
              method: x.request.method,
              url: x.request.url,
              headers: toHeaders(x.request.headers),
              resourceType: x.type ?? 'Other',
              initiator: initiatorOf(x.initiator),
              baseTs: x.timestamp,
              baseWall: x.wallTime,
              isWs: false,
              rws: x,
            });
            if (prev && redirect) {
              prev.redirectResp = redirect.success ? redirect.data : { status: 0, headers: {} };
              prev.term = { kind: 'redirected', atMs: hop.ex.timing.startMs };
              prev.ex.redirectTo = hop.ex.id;
            }
            break;
          }
          case 'Network.requestWillBeSentExtraInfo': {
            const p = RequestWillBeSentExtraInfoSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const h = latest.get(keyOf(sid, p.data.requestId));
            // A second ExtraInfo on a hop that already has one belongs to the next redirect hop, which has not opened yet.
            if (h && !h.reqExtra && !h.isWs) h.reqExtra = p.data;
            else pendingReqExtra.set(keyOf(sid, p.data.requestId), p.data);
            break;
          }
          case 'Network.responseReceived': {
            const p = ResponseReceivedSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            let h = latest.get(keyOf(sid, p.data.requestId));
            if (!h) {
              orphanEvents++;
              h = openHop({
                sessionId: sid,
                requestId: p.data.requestId,
                seq: line.seq,
                method: 'UNKNOWN',
                url: p.data.response.url,
                headers: [],
                resourceType: p.data.type,
                initiator: { type: 'other' },
                baseTs: p.data.timestamp,
                baseWall: at / msPerSecond,
                isWs: false,
              });
            }
            h.resp = p.data;
            break;
          }
          case 'Network.responseReceivedExtraInfo': {
            const p = ResponseReceivedExtraInfoSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const h = hopFor(p.data.requestId);
            if (h) h.respExtra = p.data;
            break;
          }
          case 'Network.loadingFinished': {
            const p = LoadingFinishedSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            end(p.data.requestId, { kind: 'finished', ts: p.data.timestamp });
            break;
          }
          case 'Network.loadingFailed': {
            const p = LoadingFailedSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const error = p.data.blockedReason ? `${p.data.errorText} (${p.data.blockedReason})` : p.data.errorText;
            end(p.data.requestId, { kind: 'failed', ts: p.data.timestamp, error, canceled: p.data.canceled === true });
            break;
          }
          case 'Network.requestServedFromCache': {
            const p = RequestServedFromCacheSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const h = hopFor(p.data.requestId);
            if (h) h.fromCache = true;
            break;
          }
          case 'Network.webSocketCreated': {
            const p = WebSocketCreatedSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const init = z.object({ type: z.string(), url: z.string().optional(), lineNumber: z.number().optional(), stack: z.unknown().optional() }).safeParse(p.data.initiator);
            openHop({
              sessionId: sid,
              requestId: p.data.requestId,
              seq: line.seq,
              method: 'GET',
              url: p.data.url,
              headers: [],
              resourceType: 'WebSocket',
              initiator: init.success ? initiatorOf(init.data) : { type: 'other' },
              baseTs: 0,
              baseWall: at / msPerSecond,
              isWs: true,
            });
            break;
          }
          case 'Network.webSocketFrameSent':
          case 'Network.webSocketFrameReceived': {
            const p = WebSocketFrameSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            const h = hopFor(p.data.requestId);
            if (!h) break;
            const payload = p.data.response.payloadData;
            if (h.wsBytes + payload.length > webSocketBudgetBytes) {
              h.framesDropped++;
            } else {
              h.wsBytes += payload.length;
              h.frames.push({
                direction: line.method === 'Network.webSocketFrameSent' ? 'sent' : 'received',
                opcode: p.data.response.opcode,
                payload,
                at: line.at,
              });
            }
            break;
          }
          case 'Network.webSocketClosed': {
            const p = WebSocketClosedSchema.safeParse(params);
            if (!p.success) { badFromCdp(line, p.error); break; }
            end(p.data.requestId, { kind: 'closed', atMs: at });
            break;
          }
          default:
            // Network.dataReceived, eventSourceMessageReceived, Fetch.* and the rest carry nothing the Trace keeps.
            break;
        }
        break;
      }
    }
  }
  // ExtraInfo that never met a requestWillBeSent.
  orphanEvents += pendingReqExtra.size;

  if (open) open.outcome = 'interrupted';

  // ---- Build every exchange from what its hop collected.
  const counts: Counts = {
    targets: targetList.length,
    exchanges: hops.length,
    inScope: 0,
    bodies: { ok: 0, skipped: 0, evicted: 0, tooLarge: 0, error: 0 },
    attribution: { ...attribution, orphanEvents },
    inflightAtEnd: 0,
  };
  for (const hop of hops) {
    finalize(hop, maxBytes, iso, msAt);
    if (hop.ex.outcome === 'inflight') counts.inflightAtEnd++;
    if (!hop.attributedInScope) continue;
    counts.inScope++;
    const state = hop.ex.response?.bodyState;
    if (state === 'ok') counts.bodies.ok++;
    else if (state === 'skipped') counts.bodies.skipped++;
    else if (state === 'evicted') counts.bodies.evicted++;
    else if (state === 'too-large') counts.bodies.tooLarge++;
    else if (state === 'lost') counts.bodies.error++;
  }

  badLines.sort((a, b) => a.seq - b.seq || (a.raw < b.raw ? -1 : a.raw > b.raw ? 1 : 0));

  const complete = endLine !== undefined && !input.truncatedTail;
  const trace: Trace = {
    traceVersion: 1,
    runId: run.runId,
    site: run.site,
    driver: run.driver,
    startedAt: run.startedAt,
    complete,
    outcome: endLine?.outcome ?? 'interrupted',
    browser: run.browser,
    scope: run.scope,
    steps,
    exchanges: hops.map((h) => h.ex),
    setupExchangeIds: setupIds,
    outsideExchangeIds: outsideIds,
    snapshots,
    targets: targetList,
    counts,
    badLines,
  };
  if (run.workflowId !== undefined) trace.workflowId = run.workflowId;
  if (endLine) trace.finishedAt = endLine.at;
  return trace;
}

/** Derives the Exchange's headers, bodies, response, outcome and timing from the hop's collected events. */
function finalize(hop: Hop, maxBytes: number, iso: (hop: Hop, ts: number) => string, msAt: (hop: Hop, ts: number) => number): void {
  const { ex } = hop;

  // Request side: wire headers and cookies win over the renderer's set.
  if (hop.reqExtra) {
    ex.request.headers = toHeaders(hop.reqExtra.headers);
    ex.request.headersSource = 'wire';
    ex.request.cookies = cookiesOf(hop.reqExtra);
  }
  const contentType = headerValue(ex.request.headers, 'content-type');
  const reqLine = pickBody(hop.bodies, 'request');
  if (reqLine) {
    if (reqLine.state === 'ok') {
      const input: Parameters<typeof requestBody>[0] = { contentType, maxBytes };
      if (reqLine.text !== undefined) input.postData = reqLine.text;
      const entries = reqLine.entries ?? (reqLine.base64 !== undefined ? [{ bytes: reqLine.base64 }] : undefined);
      if (entries) input.entries = entries;
      const body = requestBody(input);
      if (body) ex.request.body = body;
    }
  } else if (hop.rws) {
    const input: Parameters<typeof requestBody>[0] = { contentType, maxBytes };
    if (hop.rws.request.postData !== undefined) input.postData = hop.rws.request.postData;
    if (hop.rws.request.postDataEntries) input.entries = hop.rws.request.postDataEntries;
    const body = requestBody(input);
    if (body) ex.request.body = body;
  }

  // Outcome and timing.
  const t = hop.term;
  const termMs = (): number | undefined => (t?.ts !== undefined ? msAt(hop, t.ts) : t?.atMs);
  switch (t?.kind) {
    case 'finished':
    case 'redirected':
    case 'closed':
      ex.outcome = 'completed';
      break;
    case 'failed':
      ex.outcome = t.canceled ? 'aborted' : 'failed';
      ex.error = t.error ?? 'failed';
      break;
    case 'aborted':
      ex.outcome = 'aborted';
      ex.error = 'target detached';
      break;
    default:
      ex.outcome = 'inflight';
  }
  const endMs = termMs();
  if (endMs !== undefined) ex.timing.endMs = Math.max(endMs, ex.timing.startMs);

  // Response side.
  const respSource = hop.redirectResp
    ? { status: hop.redirectResp.status, headers: hop.redirectResp.headers, mimeType: hop.redirectResp.mimeType ?? '', protocol: hop.redirectResp.protocol, fromDiskCache: false, fromServiceWorker: false, ts: undefined as number | undefined }
    : hop.resp
      ? { status: hop.resp.response.status, headers: hop.resp.response.headers, mimeType: hop.resp.response.mimeType, protocol: hop.resp.response.protocol, fromDiskCache: hop.resp.response.fromDiskCache === true, fromServiceWorker: hop.resp.response.fromServiceWorker === true, ts: hop.resp.timestamp as number | undefined }
      : undefined;
  if (!respSource) {
    if (hop.isWs) ex.ws = { frames: hop.frames, framesDropped: hop.framesDropped };
    return;
  }

  // responseReceivedExtraInfo carries the wire set (including raw set-cookie); without it the renderer's set stands.
  const headers = toHeaders(hop.respExtra?.headers ?? respSource.headers);
  const setCookies = headers.filter(([n]) => n.toLowerCase() === 'set-cookie').map(([, v]) => v);
  const at = respSource.ts !== undefined ? iso(hop, respSource.ts) : ex.request.at;

  const respLine = hop.redirectResp ? undefined : pickBody(hop.bodies, 'response');
  let body: Exchange['request']['body'];
  let bodyState: BodyState;
  if (respLine) {
    if (respLine.state === 'ok') {
      const data = respLine.base64 ?? respLine.text ?? '';
      body = responseBody({ mimeType: respSource.mimeType, body: data, base64Encoded: respLine.base64 !== undefined, maxBytes });
      bodyState = 'ok';
    } else {
      bodyState = respLine.state === 'error' ? 'lost' : respLine.state;
    }
  } else if (hop.redirectResp || !(bodyTypes as readonly string[]).includes(ex.resourceType)) {
    bodyState = 'skipped';
  } else {
    bodyState = ex.outcome === 'inflight' ? 'skipped' : 'lost';
  }

  ex.response = {
    status: respSource.status,
    headers,
    setCookies,
    mimeType: respSource.mimeType,
    fromCache: hop.fromCache || respSource.fromDiskCache,
    fromServiceWorker: respSource.fromServiceWorker,
    bodyState,
    at,
  };
  if (respSource.protocol !== undefined) ex.response.protocol = respSource.protocol;
  if (body) ex.response.body = body;
  if (hop.isWs) ex.ws = { frames: hop.frames, framesDropped: hop.framesDropped };
}
