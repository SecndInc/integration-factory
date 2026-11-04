// Trace file I/O and the pure fold from lines to a Trace. Narrow Zod schemas parse the CDP
// params here, never in the recorder. Design: docs/design/api-docs.md §3, §4, §7, §8.

import { z } from 'zod';
import type { BadLine, RunId, SiteId, Trace, TraceLine } from './types.js';

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

// ---- File I/O

export interface ReadTraceResult {
  lines: readonly (TraceLine | BadLine)[];
  /** True when the file ended mid-line (a crash). The partial line is dropped. */
  truncatedTail: boolean;
}

/**
 * Tolerant reader. Throws CaptureError('trace-unreadable') only when the first line is not a run
 * line, and CaptureError('trace-version') when its traceVersion is unknown. Every other bad line
 * is kept as {kind:'bad'} so counts stay honest.
 */
export async function readTrace(path: string): Promise<ReadTraceResult> {
  void path;
  throw new Error('not implemented');
}

/** `<jobsDir>/<site>/traces/trace-<runId>.jsonl`. Creates the directory. */
export function tracePathFor(jobsDir: string, site: SiteId, runId: RunId): string {
  void jobsDir;
  void site;
  void runId;
  throw new Error('not implemented');
}

/** `<iso compact, e.g. 20261103T191204Z>-<hex4>`. Sorts by start time. */
export function newRunId(now?: Date): RunId {
  void now;
  throw new Error('not implemented');
}

/** Every trace path under `<jobsDir>/<site>/traces`, oldest first. */
export async function listTraces(jobsDir: string, site: SiteId): Promise<string[]> {
  void jobsDir;
  void site;
  throw new Error('not implemented');
}

/** Deletes traces whose run line startedAt is older than traceRetentionDays. Returns the paths removed. */
export async function pruneTraces(jobsDir: string, site: SiteId, now?: Date): Promise<string[]> {
  void jobsDir;
  void site;
  void now;
  throw new Error('not implemented');
}

// ---- The fold

/** Suffix match on the host, same rule as filterHost in playwright-capture.ts. Shared with derive. */
export function inScope(host: string, hosts: readonly string[]): boolean {
  void host;
  void hosts;
  throw new Error('not implemented');
}

/**
 * Pure fold over lines in seq order. Invariants it encodes:
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
 */
export function assemble(input: ReadTraceResult): Trace {
  void input;
  throw new Error('not implemented');
}

/** Resource types whose bodies are kept. Everything else is headers only. */
export const bodyTypes = ['Document', 'XHR', 'Fetch', 'EventSource', 'Other'] as const;
