// The whole Chrome DevTools Protocol client: one WebSocket to the browser endpoint, many
// sessions. Events from every session arrive on one listener in wire order. This is the only
// file in src/apidocs that opens a socket. Uses the global WebSocket (Node 22).
// Design: docs/design/api-docs.md §7, §9.

import { CaptureError } from './errors.js';
import { cdpConnectTimeoutMs } from './limits.js';
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

/** Applies to the /json/version request and to the socket open. */
const defaultConnectTimeoutMs = cdpConnectTimeoutMs;

interface Pending {
  method: string;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

interface CdpMessage {
  id?: number;
  method?: string;
  params?: unknown;
  sessionId?: string;
  result?: unknown;
  error?: { message?: string; code?: number; data?: string };
}

export class Cdp {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly eventListeners: ((event: CdpEvent) => void)[] = [];
  private readonly closeListeners: ((reason: string) => void)[] = [];
  /** True once the socket is gone, for any reason. */
  private closed = false;
  /** True once close() was called; the close listeners then stay silent. */
  private closedByUs = false;
  /** Set when an event listener threw: the connection is ended and this becomes the close reason. */
  private listenerFailure: string | undefined;
  private readonly socketClosed: Promise<void>;

  private constructor(private readonly socket: WebSocket) {
    let markClosed!: () => void;
    this.socketClosed = new Promise<void>((resolve) => (markClosed = resolve));
    socket.addEventListener('message', (event) => this.onMessage(event.data));
    socket.addEventListener('close', (event) => {
      this.closed = true;
      this.rejectPending('connection closed');
      markClosed();
      if (this.closedByUs) return;
      const reason = this.listenerFailure ?? `socket closed (code ${event.code}${event.reason ? `: ${event.reason}` : ''})`;
      const listeners = this.closeListeners.splice(0);
      for (const listener of listeners) listener(reason);
    });
  }

  /** Throws CaptureError('browser-unreachable') when the endpoint refuses or /json/version fails. */
  static async connect(opts: CdpConnectOptions): Promise<Cdp> {
    const timeoutMs = opts.connectTimeoutMs ?? defaultConnectTimeoutMs;
    const wsUrl = await resolveWebSocketUrl(opts.cdpUrl, timeoutMs);
    const socket = await openSocket(wsUrl, timeoutMs);
    return new Cdp(socket);
  }

  /**
   * Sends `{id, method, params, sessionId?}` and resolves with `result` on the matching id.
   * Rejects with an Error whose message is the CDP error message (e.g. "No resource with given identifier found").
   */
  send<T = unknown>(method: string, params?: object, sessionId?: SessionId): Promise<T> {
    if (this.closed || this.closedByUs || this.listenerFailure) return Promise.reject(new Error('connection closed'));
    const id = this.nextId++;
    const message = JSON.stringify({ id, method, params: params ?? {}, ...(sessionId ? { sessionId } : {}) });
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { method, resolve: resolve as (result: unknown) => void, reject });
      try {
        this.socket.send(message);
      } catch (error) {
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Every event from every session, in arrival order. Listeners run synchronously.
   * A listener that throws ends the connection: later events would be missing from what it records,
   * so the close listeners fire with the error as the reason. Nothing is thrown out of the socket handler.
   */
  onEvent(listener: (event: CdpEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /** Fires once when the socket closes for any reason other than close(). */
  onClose(listener: (reason: string) => void): void {
    this.closeListeners.push(listener);
  }

  /** Idempotent. Pending sends reject with "connection closed". */
  async close(): Promise<void> {
    if (!this.closedByUs) {
      this.closedByUs = true;
      this.rejectPending('connection closed');
      if (!this.closed) {
        try {
          this.socket.close();
        } catch {
          // Already closing; the close event still fires.
        }
      }
    }
    if (!this.closed) await this.socketClosed;
  }

  private onMessage(data: unknown): void {
    if (this.listenerFailure) return; // the connection is ending; deliver nothing more
    let message: CdpMessage;
    try {
      message = JSON.parse(typeof data === 'string' ? data : Buffer.from(data as ArrayBuffer).toString('utf8')) as CdpMessage;
    } catch {
      return; // CDP only sends JSON text frames; anything else is not ours to interpret.
    }
    if (typeof message.id === 'number') {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message ?? `${pending.method} failed`));
      else pending.resolve(message.result);
      return;
    }
    if (typeof message.method !== 'string') return;
    const event: CdpEvent = {
      method: message.method,
      params: message.params,
      ...(message.sessionId ? { sessionId: message.sessionId as SessionId } : {}),
    };
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        this.endAfterListenerError(`event listener threw on ${event.method}: ${describe(error)}`);
        return;
      }
    }
  }

  /** Closes the socket from our side without marking it as close(); the close event reports `reason`. */
  private endAfterListenerError(reason: string): void {
    if (this.listenerFailure || this.closed || this.closedByUs) return;
    this.listenerFailure = reason;
    this.rejectPending('connection closed');
    try {
      this.socket.close();
    } catch {
      // Already closing; the close event still fires with the stored reason.
    }
  }

  private rejectPending(reason: string): void {
    const pending = [...this.pending.values()];
    this.pending.clear();
    for (const p of pending) p.reject(new Error(reason));
  }
}

async function resolveWebSocketUrl(cdpUrl: string, timeoutMs: number): Promise<string> {
  let url: URL;
  try {
    url = new URL(cdpUrl);
  } catch {
    throw unreachable(cdpUrl, 'not a URL');
  }
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return url.toString();
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw unreachable(cdpUrl, `unsupported protocol ${url.protocol}`);
  const versionUrl = new URL('/json/version', url);
  let body: unknown;
  try {
    const response = await fetch(versionUrl, { signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) throw new Error(`/json/version answered ${response.status}`);
    body = await response.json();
  } catch (error) {
    throw unreachable(cdpUrl, describe(error));
  }
  const wsUrl = (body as { webSocketDebuggerUrl?: unknown } | null)?.webSocketDebuggerUrl;
  if (typeof wsUrl !== 'string' || wsUrl.length === 0) throw unreachable(cdpUrl, '/json/version has no webSocketDebuggerUrl');
  return wsUrl;
}

async function openSocket(wsUrl: string, timeoutMs: number): Promise<WebSocket> {
  let socket: WebSocket;
  try {
    socket = new WebSocket(wsUrl);
  } catch (error) {
    throw unreachable(wsUrl, describe(error));
  }
  return await new Promise<WebSocket>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      try {
        socket.close();
      } catch {
        // Nothing to close.
      }
      reject(unreachable(wsUrl, `socket did not open within ${timeoutMs} ms`));
    }, timeoutMs);
    const onOpen = () => {
      cleanup();
      resolve(socket);
    };
    const onError = (event: Event) => {
      cleanup();
      const detail = (event as Event & { error?: unknown; message?: string }).error ?? (event as { message?: string }).message;
      reject(unreachable(wsUrl, detail ? describe(detail) : 'socket error'));
    };
    const onClose = (event: CloseEvent) => {
      cleanup();
      reject(unreachable(wsUrl, `socket closed before open (code ${event.code})`));
    };
    function cleanup() {
      clearTimeout(timer);
      socket.removeEventListener('open', onOpen);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('close', onClose);
    }
    socket.addEventListener('open', onOpen);
    socket.addEventListener('error', onError);
    socket.addEventListener('close', onClose);
  });
}

function unreachable(target: string, detail: string): CaptureError {
  return new CaptureError(
    'browser-unreachable',
    `cannot reach the browser at ${target}: ${detail}`,
    'Start the browser with --remote-debugging-port and pass its http://127.0.0.1:<port> URL, or check that the session is still open.',
  );
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause;
    return cause instanceof Error ? `${error.message} (${cause.message})` : error.message;
  }
  return String(error);
}
