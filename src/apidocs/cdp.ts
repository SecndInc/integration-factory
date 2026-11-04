// The whole Chrome DevTools Protocol client: one WebSocket to the browser endpoint, many
// sessions. Events from every session arrive on one listener in wire order. This is the only
// file in src/apidocs that opens a socket. Uses the global WebSocket (Node 22).
// Design: docs/design/api-docs.md §7, §9.

import type { SessionId } from './types.js';

export interface CdpEvent {
  sessionId?: SessionId;
  method: string;
  params: unknown;
}

export interface CdpConnectOptions {
  /**
   * `http(s)://host:port` (reads `/json/version` for `webSocketDebuggerUrl`) or a
   * `ws(s)://` URL (a Browserbase connectUrl, or a webSocketDebuggerUrl directly).
   */
  cdpUrl: string;
  /** Milliseconds to wait for the socket to open. */
  connectTimeoutMs?: number;
}

export class Cdp {
  private constructor() {}

  /** Throws CaptureError('browser-unreachable') when the endpoint refuses or /json/version fails. */
  static async connect(opts: CdpConnectOptions): Promise<Cdp> {
    void opts;
    throw new Error('not implemented');
  }

  /**
   * Sends `{id, method, params, sessionId?}` and resolves with `result` on the matching id.
   * Rejects with an Error whose message is the CDP error message (e.g. "No resource with given identifier found").
   */
  send<T = unknown>(method: string, params?: object, sessionId?: SessionId): Promise<T> {
    void method;
    void params;
    void sessionId;
    throw new Error('not implemented');
  }

  /** Every event from every session, in arrival order. Listeners run synchronously. */
  onEvent(listener: (event: CdpEvent) => void): void {
    void listener;
    throw new Error('not implemented');
  }

  /** Fires once when the socket closes for any reason other than close(). */
  onClose(listener: (reason: string) => void): void {
    void listener;
    throw new Error('not implemented');
  }

  /** Idempotent. Pending sends reject with "connection closed". */
  close(): Promise<void> {
    throw new Error('not implemented');
  }
}
