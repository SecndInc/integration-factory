// HAR 1.2 export of an assembled Trace, so DevTools, Caido or Burp can be used as viewers
// without the pipeline depending on them. Pure; no I/O. Design: docs/design/api-docs.md §9.

import type { Trace } from './types.js';

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

/** pages[] = steps, entries[] = completed exchanges (not WebSocket), with the custom fields above. Values are NOT redacted. */
export function toHar(trace: Trace): Har {
  void trace;
  throw new Error('not implemented');
}
