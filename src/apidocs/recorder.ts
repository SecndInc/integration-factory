// The only writer of a trace file. Attaches a Network session to every target through
// browser-level auto-attach, appends raw CDP events and the driver's step markers through
// one in-process writer with one `seq` counter, and fetches bodies as events arrive.
// It assembles nothing; trace.ts folds the file later.
// Design: docs/design/api-docs.md §4, §7, §8. Measured facts in §7 are the contract.
//
// Private data path, listed so a reader can trace it without opening the bodies:
//   onAttached(event)     -> target line; for page|iframe|worker|shared_worker|service_worker|webview:
//                            Network.enable (buffer limits + maxPostDataSize), Target.setAutoAttach (recursive),
//                            Fetch.enable when bodies.hold; finally Runtime.runIfWaitingForDebugger
//   onDetached(event)     -> target line 'detached'
//   onNetworkEvent(event) -> cdp line verbatim; enrichment issued synchronously inside the handler:
//                            requestWillBeSent with hasPostData and no body -> Network.getRequestPostData -> body line
//                            loadingFinished, in scope, bodyTypes, under bodyMaxBytes -> Network.getResponseBody -> body line
//   onFetchPaused(event)  -> Fetch.getResponseBody -> body line (source 'fetch') -> Fetch.continueRequest (finally)
//   writer                -> one fs.WriteStream (flags 'a'), in-process queue, seq counter,
//                            fsync after step and end lines

import { createWriteStream, existsSync, fsync, mkdirSync, openSync, type WriteStream } from 'node:fs';
import path from 'node:path';
import { Cdp, type CdpEvent } from './cdp.js';
import { CaptureError } from './errors.js';
import { bodyMaxBytes, networkResourceBufferBytes, networkTotalBufferBytes, settleCapMs, settleQuietMs } from './limits.js';
import { bodyTypes } from './trace.js';
import type {
  Cookie,
  Counts,
  DriverKind,
  RunId,
  RunLine,
  RunOutcome,
  SessionId,
  SiteId,
  StepId,
  TraceLine,
  WorkflowId,
} from './types.js';

export interface RecorderOptions {
  cdpUrl: string;
  /** New file per run. attach() throws CaptureError('trace-exists') for an existing path. */
  tracePath: string;
  runId: RunId;
  site: SiteId;
  driver: DriverKind;
  workflowId?: WorkflowId;
  browserKind: 'local' | 'browserbase' | 'attached';
  /** Metadata is recorded for every host; bodies and snapshots only for these (suffix match, as filterHost). */
  scope: { hosts: readonly string[] };
  /** Defaults: bodyMaxBytes from limits.ts, hold false. */
  bodies?: { maxBytes?: number; hold?: boolean };
  /** Cookies + localStorage + sessionStorage of in-scope origins at each step begin. Default true. */
  snapshots?: boolean;
  log?: (message: string) => void;
}

export interface StepHandle {
  readonly id: StepId;
  /** Sub-step marker. Later exchanges carry this action's seq until the next marker. */
  action(kind: string, detail: string, url?: string): void;
  skip(note?: string): void;
  fail(note: string): void;
}

export interface SettleOptions {
  quietMs?: number;
  timeoutMs?: number;
}

// ---- What gets recorded

/** Target types that make network requests of their own; each gets Network.enable and recursive auto-attach. */
const networkTargetTypes = new Set(['page', 'iframe', 'worker', 'shared_worker', 'service_worker', 'webview']);
/** Target types where Fetch.enable must succeed in hold mode; on workers it is best effort. */
const holdRequiredTypes = new Set(['page', 'iframe', 'webview']);
/** Network events written verbatim. dataReceived and priority changes are noise for a doc. */
const recordedNetworkEvents = new Set([
  'Network.requestWillBeSent',
  'Network.requestWillBeSentExtraInfo',
  'Network.responseReceived',
  'Network.responseReceivedExtraInfo',
  'Network.loadingFinished',
  'Network.loadingFailed',
  'Network.requestServedFromCache',
  'Network.webSocketCreated',
  'Network.webSocketWillSendHandshakeRequest',
  'Network.webSocketHandshakeResponseReceived',
  'Network.webSocketFrameSent',
  'Network.webSocketFrameReceived',
  'Network.webSocketFrameError',
  'Network.webSocketClosed',
  'Network.eventSourceMessageReceived',
]);
const bodyTypeSet = new Set<string>(bodyTypes);
/** Bodies the renderer can still lose (a navigation, buffer pressure). Anything else is an `error`. */
const evictedPattern = /No resource with given identifier|No data found for resource|evicted/i;
const autoAttach = { autoAttach: true, waitForDebuggerOnStart: true, flatten: true } as const;
const holdPatterns = [
  { resourceType: 'XHR', requestStage: 'Response' },
  { resourceType: 'Fetch', requestStage: 'Response' },
] as const;

// ---- Internal state shapes

interface SessionInfo {
  sessionId: SessionId;
  targetId: string;
  type: string;
  url: string;
  openerId?: string;
  detached: boolean;
}

interface RequestInfo {
  sessionId: SessionId;
  requestId: string;
  inScope: boolean;
  resourceType?: string;
  contentLength?: number;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** A trace line before the writer stamps `seq` and `at`. */
type LineInput = DistributiveOmit<Exclude<TraceLine, RunLine>, 'seq' | 'at'>;

interface CdpCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
}

// ---- The writer: one stream, one seq counter, append only

class TraceWriter {
  private seq = 0;
  private sealed = false;
  private failure: Error | undefined;
  private lastWrite: Promise<void> = Promise.resolve();

  private constructor(
    private readonly fd: number,
    private readonly stream: WriteStream,
  ) {
    stream.on('error', (error) => {
      this.failure ??= error;
    });
  }

  /** Creates the file exclusively: an existing path is a CaptureError('trace-exists'), never appended to. */
  static open(tracePath: string): TraceWriter {
    mkdirSync(path.dirname(tracePath), { recursive: true });
    let fd: number;
    try {
      fd = openSync(tracePath, 'ax');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') throw traceExists(tracePath);
      throw error;
    }
    return new TraceWriter(fd, createWriteStream(tracePath, { fd, flags: 'a', encoding: 'utf8' }));
  }

  get isSealed(): boolean {
    return this.sealed;
  }

  /** The run line carries seq 0 and no `at` (its schema has startedAt). */
  writeRun(line: RunLine): void {
    this.append({ ...line, seq: this.seq++ });
  }

  /** Stamps seq and at, queues the line, returns its seq. After seal() lines are dropped and -1 is returned. */
  write(line: LineInput): number {
    if (this.sealed) return -1;
    const seq = this.seq++;
    const { kind, ...rest } = line;
    this.append({ kind, seq, at: new Date().toISOString(), ...rest });
    return seq;
  }

  /** Nothing after the end line. */
  seal(): void {
    this.sealed = true;
  }

  /** Resolves when every line queued so far is on the file descriptor and fsynced. */
  async sync(): Promise<void> {
    await this.lastWrite;
    if (this.failure) throw this.failure;
    if (this.stream.closed) return;
    await new Promise<void>((resolve, reject) => fsync(this.fd, (error) => (error ? reject(error) : resolve())));
  }

  async close(): Promise<void> {
    if (this.stream.closed) return;
    await new Promise<void>((resolve) => {
      this.stream.once('close', () => resolve());
      this.stream.end();
    });
  }

  private append(record: object): void {
    const text = `${JSON.stringify(record)}\n`;
    this.lastWrite = new Promise<void>((resolve) => {
      this.stream.write(text, (error) => {
        if (error) this.failure ??= error;
        resolve();
      });
    });
  }
}

// ---- The recorder

export class Recorder {
  private readonly log: (message: string) => void;
  private readonly maxBytes: number;
  private readonly hold: boolean;
  private readonly snapshotsOn: boolean;
  private readonly scopeHosts: readonly string[];

  private readonly sessions = new Map<SessionId, SessionInfo>();
  private readonly requests = new Map<string, RequestInfo>();
  /** In-scope HTTP requests started and not yet finished, failed, or orphaned by a detach. */
  private readonly inflight = new Set<string>();
  /** Requests whose response body the Fetch path reads; the Network path leaves them alone. */
  private readonly heldKeys = new Set<string>();
  private readonly inScopeOrigins = new Set<string>();
  private lastActivityAt = Date.now();
  private readonly settleWaiters = new Set<() => void>();

  /** Target preparation still running (Network.enable ... runIfWaitingForDebugger). */
  private readonly attachWork = new Set<Promise<void>>();
  /** Every CDP command whose answer becomes a line, so close() can wait for them before the end line. */
  private readonly enrichment = new Set<Promise<void>>();
  private readonly attachFailures: string[] = [];

  private openStep: { id: StepId; index: number } | undefined;
  private anyStepBegun = false;
  private finishing: Promise<Counts> | undefined;
  private browserClosed = false;

  private readonly live: Counts = {
    targets: 0,
    exchanges: 0,
    inScope: 0,
    bodies: { ok: 0, skipped: 0, evicted: 0, tooLarge: 0, error: 0 },
    attribution: { inStep: 0, betweenSteps: 0, beforeFirstStep: 0, orphanEvents: 0 },
    inflightAtEnd: 0,
  };

  private constructor(
    private readonly cdp: Cdp,
    private readonly writer: TraceWriter,
    opts: RecorderOptions,
  ) {
    this.log = opts.log ?? (() => undefined);
    this.maxBytes = opts.bodies?.maxBytes ?? bodyMaxBytes;
    this.hold = opts.bodies?.hold ?? false;
    this.snapshotsOn = opts.snapshots ?? true;
    this.scopeHosts = opts.scope.hosts;
  }

  /**
   * Connects, writes the run line, auto-attaches every target, enables Network on each.
   * Resolves once every already-existing target is enabled, so the caller's first request is recorded.
   */
  static async attach(opts: RecorderOptions): Promise<Recorder> {
    if (opts.scope.hosts.length === 0) throw new Error('Recorder.attach: scope.hosts must name at least one host');
    if (existsSync(opts.tracePath)) throw traceExists(opts.tracePath);

    const cdp = await Cdp.connect({ cdpUrl: opts.cdpUrl });
    let version: string;
    try {
      version = (await cdp.send<{ product: string }>('Browser.getVersion')).product;
    } catch (error) {
      await cdp.close();
      throw attachFailed(`Browser.getVersion failed: ${describe(error)}`);
    }

    let writer: TraceWriter;
    try {
      writer = TraceWriter.open(opts.tracePath);
    } catch (error) {
      await cdp.close();
      throw error;
    }

    const recorder = new Recorder(cdp, writer, opts);
    const maxBytes = opts.bodies?.maxBytes ?? bodyMaxBytes;
    writer.writeRun({
      kind: 'run',
      traceVersion: 1,
      runId: opts.runId,
      site: opts.site,
      driver: opts.driver,
      ...(opts.workflowId ? { workflowId: opts.workflowId } : {}),
      startedAt: new Date().toISOString(),
      browser: { kind: opts.browserKind, version },
      scope: { hosts: [...opts.scope.hosts] },
      bodies: { maxBytes, hold: opts.bodies?.hold ?? false },
    });

    cdp.onEvent((event) => recorder.onEvent(event));
    cdp.onClose((reason) => {
      recorder.browserClosed = true;
      recorder.log(`recorder: browser connection closed (${reason}); ending the trace as interrupted`);
      void recorder.finish('browser-closed', 'interrupted');
    });

    try {
      await cdp.send('Target.setAutoAttach', autoAttach);
      await recorder.attachSettled();
    } catch (error) {
      await recorder.finish('error', 'failed');
      throw attachFailed(`Target.setAutoAttach failed: ${describe(error)}`);
    }
    if (recorder.attachFailures.length > 0) {
      await recorder.finish('error', 'failed');
      throw attachFailed(recorder.attachFailures.join('; '));
    }
    return recorder;
  }

  /**
   * begin marker + snapshot, run fn, settle, end marker, fsync.
   * Outcome: fn returned -> ok; step.skip() -> skipped; step.fail() or fn threw -> failed
   * (the throw is rethrown after the end marker is on disk).
   */
  async step(id: StepId, index: number, text: string, fn: (step: StepHandle) => Promise<void>): Promise<void> {
    await this.begin(id, index, text);
    let outcome: 'ok' | 'failed' | 'skipped' = 'ok';
    let note: string | undefined;
    let thrown: { error: unknown } | undefined;
    const handle: StepHandle = {
      id,
      action: (kind, detail, url) => this.action(id, kind, detail, url),
      skip: (skipNote) => {
        outcome = 'skipped';
        note = skipNote;
      },
      fail: (failNote) => {
        outcome = 'failed';
        note = failNote;
      },
    };
    try {
      await fn(handle);
    } catch (error) {
      outcome = 'failed';
      note ??= describe(error);
      thrown = { error };
    }
    await this.settle();
    try {
      await this.end(id, outcome, note);
    } catch (endError) {
      throw thrown ? thrown.error : endError;
    }
    if (thrown) throw thrown.error;
  }

  /** For drivers whose control flow is inverted (the navigator's phase callback). step() is sugar over these. */
  async begin(id: StepId, index: number, text?: string): Promise<void> {
    this.assertRecording(`begin(${id})`);
    if (this.openStep) {
      throw new CaptureError('step-order', `begin(${id}) while step ${this.openStep.id} is still open`, 'Call end() for the open step first.');
    }
    this.openStep = { id, index };
    this.anyStepBegun = true;
    this.writer.write({ kind: 'step', phase: 'begin', id, index, ...(text !== undefined ? { text } : {}) });
    await this.writer.sync();
    if (this.snapshotsOn) {
      try {
        await this.snapshot(id);
      } catch (error) {
        this.log(`recorder: snapshot at ${id} failed: ${describe(error)}`);
      }
    }
  }

  /** Throws CaptureError('step-order') when no step is open or a different one is. */
  async end(id: StepId, outcome: 'ok' | 'failed' | 'skipped', note?: string): Promise<void> {
    if (!this.openStep || this.openStep.id !== id) {
      const open = this.openStep ? `step ${this.openStep.id} is open` : 'no step is open';
      throw new CaptureError('step-order', `end(${id}) but ${open}`, 'Call begin() before end(), with the same step id.');
    }
    this.assertRecording(`end(${id})`);
    const { index } = this.openStep;
    this.openStep = undefined;
    this.writer.write({ kind: 'step', phase: 'end', id, index, outcome, ...(note !== undefined ? { note } : {}) });
    await this.writer.sync();
  }

  /** Resolves when no in-scope HTTP request has been in flight for quietMs, or at timeoutMs. WebSocket and EventSource never count. */
  settle(opts?: SettleOptions): Promise<{ inflight: number }> {
    const quietMs = opts?.quietMs ?? settleQuietMs;
    const timeoutMs = opts?.timeoutMs ?? settleCapMs;
    if (this.finishing) return Promise.resolve({ inflight: this.inflight.size });
    const startedAt = Date.now();
    return new Promise((resolve) => {
      let quietTimer: NodeJS.Timeout | undefined;
      const done = () => {
        clearTimeout(quietTimer);
        clearTimeout(capTimer);
        this.settleWaiters.delete(check);
        resolve({ inflight: this.inflight.size });
      };
      // Runs now, on every in-flight change, and when the quiet window may have elapsed.
      const check = () => {
        clearTimeout(quietTimer);
        if (this.finishing) return done();
        if (this.inflight.size > 0) return;
        const quietFor = Date.now() - Math.max(this.lastActivityAt, startedAt);
        if (quietFor >= quietMs) return done();
        quietTimer = setTimeout(check, quietMs - quietFor);
      };
      const capTimer = setTimeout(done, timeoutMs);
      this.settleWaiters.add(check);
      check();
    });
  }

  /** In-scope exchanges seen so far. Used by drivers to refuse a run whose start page recorded nothing. */
  get inScopeCount(): number {
    return this.live.inScope;
  }

  /** Live counts; the same object that goes into the end line. */
  get counts(): Counts {
    return this.live;
  }

  /**
   * Writes the end line with the given outcome, fsyncs, closes the connection. Idempotent.
   * Called by the socket's onClose too, with reason 'browser-closed' and outcome 'interrupted'.
   */
  close(outcome?: 'completed' | 'failed' | 'owner_ended'): Promise<Counts> {
    return this.finish('closed', outcome ?? 'completed');
  }

  // ---- Lifecycle

  private finish(reason: 'closed' | 'browser-closed' | 'error', outcome: RunOutcome): Promise<Counts> {
    this.finishing ??= (async () => {
      for (const wake of [...this.settleWaiters]) wake();
      await this.drain();
      this.live.inflightAtEnd = this.inflight.size;
      const counts = structuredClone(this.live);
      this.writer.write({ kind: 'end', reason, outcome, counts });
      this.writer.seal();
      try {
        await this.writer.sync();
      } finally {
        await this.writer.close();
        await this.cdp.close();
      }
      return counts;
    })();
    return this.finishing;
  }

  /** Waits for body fetches and target preparation already issued, so their lines precede the end line. */
  private async drain(): Promise<void> {
    const deadline = Date.now() + settleCapMs;
    while (this.enrichment.size > 0) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        this.log(`recorder: ${this.enrichment.size} body or attach commands still pending at close`);
        return;
      }
      let timer: NodeJS.Timeout | undefined;
      await Promise.race([
        Promise.allSettled([...this.enrichment]),
        new Promise<void>((resolve) => (timer = setTimeout(resolve, remaining))),
      ]);
      clearTimeout(timer);
    }
  }

  private async attachSettled(): Promise<void> {
    const deadline = Date.now() + settleCapMs;
    while (this.attachWork.size > 0 && Date.now() < deadline) await Promise.allSettled([...this.attachWork]);
  }

  private assertRecording(what: string): void {
    if (!this.finishing) return;
    if (this.browserClosed) {
      throw new CaptureError('browser-closed', `${what}: the browser connection closed and the trace was ended`, 'Start a new record run.');
    }
    throw new CaptureError('step-order', `${what} after close()`, 'Call close() last.');
  }

  // ---- Event routing. Every handler is synchronous; CDP commands it needs are issued before it returns.

  private onEvent(event: CdpEvent): void {
    if (this.writer.isSealed) return;
    try {
      switch (event.method) {
        case 'Target.attachedToTarget':
          return this.onAttached(event);
        case 'Target.detachedFromTarget':
          return this.onDetached(event);
        case 'Fetch.requestPaused':
          return this.onFetchPaused(event);
        default:
          if (recordedNetworkEvents.has(event.method)) this.onNetworkEvent(event);
      }
    } catch (error) {
      this.log(`recorder: ${event.method} handler failed: ${describe(error)}`);
    }
  }

  private onAttached(event: CdpEvent): void {
    const params = event.params as {
      sessionId: string;
      targetInfo: { targetId: string; type: string; url: string; openerId?: string };
      waitingForDebugger: boolean;
    };
    const { targetInfo } = params;
    const info: SessionInfo = {
      sessionId: params.sessionId as SessionId,
      targetId: targetInfo.targetId,
      type: targetInfo.type,
      url: targetInfo.url,
      ...(targetInfo.openerId ? { openerId: targetInfo.openerId } : {}),
      detached: false,
    };
    this.sessions.set(info.sessionId, info);
    this.live.targets++;
    this.writer.write({
      kind: 'target',
      event: 'attached',
      sessionId: info.sessionId,
      targetId: info.targetId,
      type: info.type,
      url: info.url,
      ...(info.openerId ? { openerId: info.openerId } : {}),
    });
    const work = this.prepareTarget(info, params.waitingForDebugger);
    this.attachWork.add(work);
    void work.finally(() => this.attachWork.delete(work));
    this.track(work);
  }

  /** Network on, Fetch on in hold mode, children auto-attached; the target always resumes. */
  private async prepareTarget(info: SessionInfo, waitingForDebugger: boolean): Promise<void> {
    const { sessionId } = info;
    try {
      if (networkTargetTypes.has(info.type)) {
        await this.cdp.send(
          'Network.enable',
          { maxTotalBufferSize: networkTotalBufferBytes, maxResourceBufferSize: networkResourceBufferBytes, maxPostDataSize: this.maxBytes },
          sessionId,
        );
        if (this.hold) {
          try {
            await this.cdp.send('Fetch.enable', { patterns: holdPatterns }, sessionId);
          } catch (error) {
            if (holdRequiredTypes.has(info.type)) throw error;
            this.log(`recorder: Fetch.enable refused on ${info.type} ${info.url}: ${describe(error)}`);
          }
        }
        try {
          await this.cdp.send('Target.setAutoAttach', autoAttach, sessionId);
        } catch (error) {
          // Workers may refuse child auto-attach; their own traffic is already enabled.
          if (!info.detached) this.log(`recorder: child auto-attach refused on ${info.type} ${info.url}: ${describe(error)}`);
        }
      }
    } catch (error) {
      if (!info.detached && !this.finishing) {
        const failure = `${info.type} ${info.url || info.targetId}: ${describe(error)}`;
        this.attachFailures.push(failure);
        this.log(`recorder: attach failed for ${failure}`);
      }
    } finally {
      if (waitingForDebugger) {
        await this.cdp.send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => undefined);
      }
    }
  }

  private onDetached(event: CdpEvent): void {
    const params = event.params as { sessionId: string };
    const info = this.sessions.get(params.sessionId as SessionId);
    if (!info || info.detached) return;
    info.detached = true;
    this.writer.write({
      kind: 'target',
      event: 'detached',
      sessionId: info.sessionId,
      targetId: info.targetId,
      type: info.type,
      url: info.url,
      ...(info.openerId ? { openerId: info.openerId } : {}),
    });
    // Requests of a gone target never finish; they stop counting toward settle.
    let changed = false;
    for (const key of [...this.inflight]) {
      if (this.requests.get(key)?.sessionId === info.sessionId) changed = this.inflight.delete(key) || changed;
    }
    if (changed) this.activity();
  }

  private onNetworkEvent(event: CdpEvent): void {
    const sessionId = (event.sessionId ?? '') as SessionId;
    const params = (event.params ?? {}) as Record<string, unknown>;
    // The verbatim line first, so any enrichment line always follows the event it enriches.
    this.writer.write({ kind: 'cdp', sessionId, method: event.method, params: event.params });
    switch (event.method) {
      case 'Network.requestWillBeSent':
        return this.onRequest(sessionId, params);
      case 'Network.webSocketCreated':
        return this.onWebSocketCreated(params);
      case 'Network.responseReceived':
        return this.onResponse(sessionId, params);
      case 'Network.loadingFinished':
        return this.onFinished(sessionId, params);
      case 'Network.loadingFailed':
        return this.onFailed(sessionId, params);
    }
  }

  private onRequest(sessionId: SessionId, params: Record<string, unknown>): void {
    const requestId = String(params.requestId);
    const request = params.request as { url: string; hasPostData?: boolean; postData?: string };
    const resourceType = typeof params.type === 'string' ? params.type : undefined;
    const key = requestKey(sessionId, requestId);
    const url = parseUrl(request.url);
    const inScope = url !== undefined && hostInScope(url.hostname, this.scopeHosts);

    this.live.exchanges++;
    if (inScope) {
      this.live.inScope++;
      this.inScopeOrigins.add(url.origin);
    }
    this.attribute();

    // A redirect hop reuses the requestId; the new hop replaces the old one's info.
    this.requests.set(key, { sessionId, requestId, inScope, ...(resourceType ? { resourceType } : {}) });
    if (inScope && resourceType !== 'EventSource') {
      this.inflight.add(key);
      this.activity();
    } else if (this.inflight.delete(key)) {
      this.activity(); // redirected out of scope
    }

    if (inScope && request.hasPostData && request.postData === undefined) {
      this.track(
        this.cdp
          .send<{ postData: string; base64Encoded?: boolean }>('Network.getRequestPostData', { requestId }, sessionId)
          .then(
            (result) => this.writeBody(sessionId, requestId, 'request', 'network', result.postData, result.base64Encoded ?? false),
            (error) => this.writeBodyFailure(sessionId, requestId, 'request', 'network', error),
          ),
      );
    }
  }

  private onWebSocketCreated(params: Record<string, unknown>): void {
    const url = parseUrl(String(params.url));
    this.live.exchanges++;
    if (url && hostInScope(url.hostname, this.scopeHosts)) this.live.inScope++;
    this.attribute();
  }

  private onResponse(sessionId: SessionId, params: Record<string, unknown>): void {
    const info = this.requests.get(requestKey(sessionId, String(params.requestId)));
    if (!info) {
      this.live.attribution.orphanEvents++;
      return;
    }
    if (!info.resourceType && typeof params.type === 'string') info.resourceType = params.type;
    const headers = (params.response as { headers?: Record<string, string> } | undefined)?.headers ?? {};
    const length = Number(headerValue(headers, 'content-length'));
    if (Number.isFinite(length) && length >= 0) info.contentLength = length;
  }

  private onFinished(sessionId: SessionId, params: Record<string, unknown>): void {
    const requestId = String(params.requestId);
    const key = requestKey(sessionId, requestId);
    const info = this.requests.get(key);
    if (!info) {
      this.live.attribution.orphanEvents++;
      return;
    }
    if (this.inflight.delete(key)) this.activity();
    if (this.heldKeys.has(key)) return; // the Fetch path read this body before the renderer saw it
    if (!info.inScope || !bodyTypeSet.has(info.resourceType ?? '')) {
      this.live.bodies.skipped++;
      return;
    }
    if (info.contentLength !== undefined && info.contentLength > this.maxBytes) {
      // content-length is the encoded size; the decoded body is at least as large.
      this.writeTooLarge(sessionId, requestId, 'response', 'network', info.contentLength);
      return;
    }
    // Issued inside the handler, before any await, so a following navigation cannot evict it first.
    this.track(
      this.cdp.send<{ body: string; base64Encoded: boolean }>('Network.getResponseBody', { requestId }, sessionId).then(
        (result) => this.writeBody(sessionId, requestId, 'response', 'network', result.body, result.base64Encoded),
        (error) => this.writeBodyFailure(sessionId, requestId, 'response', 'network', error),
      ),
    );
  }

  private onFailed(sessionId: SessionId, params: Record<string, unknown>): void {
    const key = requestKey(sessionId, String(params.requestId));
    if (!this.requests.has(key)) {
      this.live.attribution.orphanEvents++;
      return;
    }
    if (this.inflight.delete(key)) this.activity();
  }

  /** Hold mode: the response is paused before the renderer sees it, read, then released. */
  private onFetchPaused(event: CdpEvent): void {
    const sessionId = (event.sessionId ?? '') as SessionId;
    const params = event.params as {
      requestId: string;
      request: { url: string };
      responseStatusCode?: number;
      responseErrorReason?: string;
      responseHeaders?: { name: string; value: string }[];
      networkId?: string;
    };
    this.writer.write({ kind: 'cdp', sessionId, method: event.method, params: event.params });
    const fetchId = params.requestId;
    const release = () =>
      this.cdp.send('Fetch.continueRequest', { requestId: fetchId }, sessionId).then(
        () => undefined,
        (error) => this.log(`recorder: Fetch.continueRequest failed: ${describe(error)}`),
      );
    const url = parseUrl(params.request.url);
    const status = params.responseStatusCode;
    const readable =
      status !== undefined &&
      params.responseErrorReason === undefined &&
      !(status >= 300 && status < 400) &&
      url !== undefined &&
      hostInScope(url.hostname, this.scopeHosts);
    if (!readable) {
      this.track(release());
      return;
    }
    const networkId = params.networkId ?? fetchId;
    this.heldKeys.add(requestKey(sessionId, networkId));
    const length = Number((params.responseHeaders ?? []).find((h) => h.name.toLowerCase() === 'content-length')?.value);
    if (Number.isFinite(length) && length > this.maxBytes) {
      this.writeTooLarge(sessionId, networkId, 'response', 'fetch', length);
      this.track(release());
      return;
    }
    this.track(
      this.cdp
        .send<{ body: string; base64Encoded: boolean }>('Fetch.getResponseBody', { requestId: fetchId }, sessionId)
        .then(
          (result) => this.writeBody(sessionId, networkId, 'response', 'fetch', result.body, result.base64Encoded),
          (error) => this.writeBodyFailure(sessionId, networkId, 'response', 'fetch', error),
        )
        .finally(release),
    );
  }

  // ---- Lines the recorder composes

  private action(stepId: StepId, kind: string, detail: string, url?: string): void {
    if (this.finishing) return;
    this.writer.write({ kind: 'action', stepId, action: kind, detail, ...(url !== undefined ? { url } : {}) });
  }

  private writeBody(
    sessionId: SessionId,
    requestId: string,
    side: 'request' | 'response',
    source: 'network' | 'fetch',
    data: string,
    base64: boolean,
  ): void {
    if (this.writer.isSealed) return;
    const bytes = Buffer.byteLength(data, base64 ? 'base64' : 'utf8');
    if (bytes > this.maxBytes) return this.writeTooLarge(sessionId, requestId, side, source, bytes);
    this.live.bodies.ok++;
    this.writer.write({
      kind: 'body',
      sessionId,
      requestId,
      side,
      source,
      state: 'ok',
      ...(base64 ? { base64: data } : { text: data }),
      bytes,
    });
  }

  private writeTooLarge(sessionId: SessionId, requestId: string, side: 'request' | 'response', source: 'network' | 'fetch', bytes: number): void {
    if (this.writer.isSealed) return;
    this.live.bodies.tooLarge++;
    this.writer.write({ kind: 'body', sessionId, requestId, side, source, state: 'too-large', bytes });
  }

  private writeBodyFailure(
    sessionId: SessionId,
    requestId: string,
    side: 'request' | 'response',
    source: 'network' | 'fetch',
    error: unknown,
  ): void {
    if (this.writer.isSealed) return;
    const message = describe(error);
    const state = evictedPattern.test(message) ? 'evicted' : 'error';
    if (state === 'evicted') this.live.bodies.evicted++;
    else this.live.bodies.error++;
    this.writer.write({ kind: 'body', sessionId, requestId, side, source, state, bytes: 0, error: message });
  }

  /** Cookies and storage of in-scope origins, read from live page sessions. Best effort per call. */
  private async snapshot(stepId: StepId): Promise<void> {
    const pages = [...this.sessions.values()].filter((s) => s.type === 'page' && !s.detached);
    const origins = [...this.inScopeOrigins];
    const cookies = new Map<string, Cookie>();
    const storage: { origin: string; local: Record<string, string>; session: Record<string, string> }[] = [];
    if (origins.length > 0) {
      for (const page of pages) {
        try {
          const result = await this.cdp.send<{ cookies: CdpCookie[] }>('Network.getCookies', { urls: origins.map((o) => `${o}/`) }, page.sessionId);
          for (const c of result.cookies) {
            cookies.set(`${c.name}\u0000${c.domain}\u0000${c.path}`, {
              name: c.name,
              value: c.value,
              domain: c.domain,
              path: c.path,
              httpOnly: c.httpOnly,
              secure: c.secure,
              ...(c.sameSite ? { sameSite: c.sameSite } : {}),
            });
          }
        } catch {
          // A page that navigated away or closed has nothing to add.
        }
      }
      for (const origin of origins) {
        for (const page of pages) {
          const local = await this.storageItems(page.sessionId, origin, true);
          if (!local) continue;
          const session = (await this.storageItems(page.sessionId, origin, false)) ?? {};
          storage.push({ origin, local, session });
          break;
        }
      }
    }
    this.writer.write({ kind: 'snapshot', stepId, cookies: [...cookies.values()], storage });
  }

  private async storageItems(sessionId: SessionId, origin: string, isLocalStorage: boolean): Promise<Record<string, string> | undefined> {
    try {
      const result = await this.cdp.send<{ entries: string[][] }>(
        'DOMStorage.getDOMStorageItems',
        { storageId: { securityOrigin: origin, isLocalStorage } },
        sessionId,
      );
      const items: Record<string, string> = {};
      for (const [k, v] of result.entries) if (k !== undefined) items[k] = v ?? '';
      return items;
    } catch {
      return undefined; // this page has no frame of that origin
    }
  }

  // ---- Bookkeeping

  /** Same rule as the fold: the step whose begin precedes the request with no end in between. */
  private attribute(): void {
    if (this.openStep) this.live.attribution.inStep++;
    else if (this.anyStepBegun) this.live.attribution.betweenSteps++;
    else this.live.attribution.beforeFirstStep++;
  }

  private activity(): void {
    this.lastActivityAt = Date.now();
    for (const check of [...this.settleWaiters]) check();
  }

  private track(work: Promise<unknown>): void {
    const tracked: Promise<void> = work
      .then(
        () => undefined,
        (error) => this.log(`recorder: ${describe(error)}`),
      )
      .finally(() => this.enrichment.delete(tracked));
    this.enrichment.add(tracked);
  }
}

// ---- Helpers

function requestKey(sessionId: string, requestId: string): string {
  return `${sessionId}\u0000${requestId}`;
}

function parseUrl(url: string): URL | undefined {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
}

/** Suffix match on the host, the rule filterHost uses in playwright-capture.ts (and trace.ts inScope). */
function hostInScope(hostname: string, hosts: readonly string[]): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return hosts.some((entry) => {
    const allowed = entry.toLowerCase().replace(/^www\./, '');
    return host === allowed || host.endsWith(`.${allowed}`);
  });
}

function headerValue(headers: Record<string, string>, name: string): string | undefined {
  for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === name) return value;
  return undefined;
}

function traceExists(tracePath: string): CaptureError {
  return new CaptureError('trace-exists', `trace file already exists: ${tracePath}`, 'Record into a new file; a trace is never appended to.');
}

function attachFailed(detail: string): CaptureError {
  return new CaptureError('attach-failed', `could not attach the recorder: ${detail}`, 'Check that the browser allows a second DevTools client, then record again.');
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
