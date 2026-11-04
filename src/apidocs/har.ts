// HAR 1.2 export of an assembled Trace, so DevTools, Caido or Burp can be used as viewers
// without the pipeline depending on them. Pure; no I/O. Design: docs/design/api-docs.md §9.

import type { Body, Exchange, Trace } from './types.js';

export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    cookies: { name: string; value: string }[];
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    postData?: { mimeType: string; text: string };
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    cookies: { name: string; value: string }[];
    headers: { name: string; value: string }[];
    content: { size: number; mimeType: string; text?: string; encoding?: 'base64' };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: { send: number; wait: number; receive: number };
  /** Custom fields, underscore-prefixed as HAR allows. */
  _exchangeId: string;
  _step?: string;
  _initiator: string;
  _target: string;
  _bodyState: string;
}

export interface Har {
  log: {
    version: '1.2';
    creator: { name: string; version: string };
    pages: { id: string; title: string; startedDateTime: string; pageTimings: Record<string, never> }[];
    entries: HarEntry[];
  };
}

const unknownSize = -1;

function httpVersion(protocol: string | undefined): string {
  switch (protocol?.toLowerCase()) {
    case 'h2':
      return 'HTTP/2.0';
    case 'h3':
      return 'HTTP/3.0';
    case 'http/1.0':
      return 'HTTP/1.0';
    case undefined:
    case 'http/1.1':
      return 'HTTP/1.1';
    default:
      return protocol ?? 'HTTP/1.1';
  }
}

function headerValue(headers: readonly (readonly [string, string])[], name: string): string | undefined {
  const lower = name.toLowerCase();
  return headers.find(([n]) => n.toLowerCase() === lower)?.[1];
}

/** A multipart body written back out as wire text; file parts keep their headers and an empty payload. */
function multipartText(body: Extract<Body, { encoding: 'multipart' }>): string {
  let out = '';
  for (const part of body.parts) {
    out += `--${body.boundary}\r\n`;
    for (const [n, v] of part.headers) out += `${n}: ${v}\r\n`;
    out += '\r\n';
    if ('text' in part.content) out += part.content.text;
    else if ('base64' in part.content) out += part.content.base64;
    out += '\r\n';
  }
  return `${out}--${body.boundary}--\r\n`;
}

function bodyText(body: Body): string {
  switch (body.encoding) {
    case 'text':
      return body.text;
    case 'base64':
      return body.base64;
    case 'multipart':
      return multipartText(body);
  }
}

/** `name=value` of a Set-Cookie line, which is all HAR's cookie object needs from it. */
function setCookiePair(line: string): { name: string; value: string } {
  const pair = line.split(';')[0] ?? '';
  const eq = pair.indexOf('=');
  return eq < 0 ? { name: pair.trim(), value: '' } : { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
}

function entryOf(ex: Exchange, response: NonNullable<Exchange['response']>): HarEntry {
  const reqType = headerValue(ex.request.headers, 'content-type') ?? '';
  const startMs = ex.timing.startMs;
  const totalMs = Math.max(0, (ex.timing.endMs ?? startMs) - startMs);
  const respMs = Date.parse(response.at) - startMs;
  const wait = Number.isFinite(respMs) ? Math.min(totalMs, Math.max(0, respMs)) : 0;

  const entry: HarEntry = {
    startedDateTime: ex.request.at,
    time: totalMs,
    request: {
      method: ex.request.method,
      url: ex.request.url,
      httpVersion: httpVersion(response.protocol),
      cookies: ex.request.cookies.map((c) => ({ name: c.name, value: c.value })),
      headers: ex.request.headers.map(([name, value]) => ({ name, value })),
      queryString: ex.request.query.map(([name, value]) => ({ name, value })),
      headersSize: unknownSize,
      bodySize: ex.request.body ? ex.request.body.bytes : 0,
    },
    response: {
      status: response.status,
      statusText: '',
      httpVersion: httpVersion(response.protocol),
      cookies: response.setCookies.map(setCookiePair),
      headers: response.headers.map(([name, value]) => ({ name, value })),
      content: { size: response.body ? response.body.bytes : 0, mimeType: response.mimeType },
      redirectURL: headerValue(response.headers, 'location') ?? '',
      headersSize: unknownSize,
      bodySize: response.body ? response.body.bytes : unknownSize,
    },
    cache: {},
    timings: { send: 0, wait, receive: totalMs - wait },
    _exchangeId: ex.id,
    _initiator: ex.initiator.url ? `${ex.initiator.type} ${ex.initiator.url}` : ex.initiator.type,
    _target: `${ex.target.type} ${ex.target.url}`.trim(),
    _bodyState: response.bodyState,
  };
  if (ex.request.body) entry.request.postData = { mimeType: reqType, text: bodyText(ex.request.body) };
  const rb = response.body;
  if (rb) {
    entry.response.content.text = bodyText(rb);
    if (rb.encoding === 'base64') entry.response.content.encoding = 'base64';
  }
  if (ex.stepId !== undefined) {
    entry.pageref = ex.stepId;
    entry._step = ex.stepId;
  }
  return entry;
}

/**
 * pages[] = steps, entries[] = completed exchanges that have a response (not WebSocket), with the
 * custom fields above. Failed, aborted and in-flight exchanges are left out: HAR has no honest
 * shape for a request with no response. Entries are sorted by request time, then seq. Values are NOT redacted.
 */
export function toHar(trace: Trace): Har {
  const entries = trace.exchanges
    .filter((ex) => ex.outcome === 'completed' && ex.response !== undefined && ex.resourceType !== 'WebSocket')
    .sort((a, b) => a.timing.startMs - b.timing.startMs || a.seq - b.seq)
    .map((ex) => entryOf(ex, ex.response!));
  return {
    log: {
      version: '1.2',
      creator: { name: 'integration-factory apidocs', version: String(trace.traceVersion) },
      pages: trace.steps.map((s) => ({ id: s.id, title: s.text ?? s.id, startedDateTime: s.startedAt, pageTimings: {} })),
      entries,
    },
  };
}
