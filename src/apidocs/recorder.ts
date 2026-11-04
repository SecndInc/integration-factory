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

import type { Counts, DriverKind, RunId, SiteId, StepId, WorkflowId } from './types.js';

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

export class Recorder {
  private constructor() {}

  /**
   * Connects, writes the run line, auto-attaches every target, enables Network on each.
   * Resolves once every already-existing target is enabled, so the caller's first request is recorded.
   */
  static async attach(opts: RecorderOptions): Promise<Recorder> {
    void opts;
    throw new Error('not implemented');
  }

  /**
   * begin marker + snapshot, run fn, settle, end marker, fsync.
   * Outcome: fn returned -> ok; step.skip() -> skipped; step.fail() or fn threw -> failed
   * (the throw is rethrown after the end marker is on disk).
   */
  step(id: StepId, index: number, text: string, fn: (step: StepHandle) => Promise<void>): Promise<void> {
    void id;
    void index;
    void text;
    void fn;
    throw new Error('not implemented');
  }

  /** For drivers whose control flow is inverted (the navigator's phase callback). step() is sugar over these. */
  begin(id: StepId, index: number, text?: string): Promise<void> {
    void id;
    void index;
    void text;
    throw new Error('not implemented');
  }

  /** Throws CaptureError('step-order') when no step is open or a different one is. */
  end(id: StepId, outcome: 'ok' | 'failed' | 'skipped', note?: string): Promise<void> {
    void id;
    void outcome;
    void note;
    throw new Error('not implemented');
  }

  /** Resolves when no in-scope HTTP request has been in flight for quietMs, or at timeoutMs. WebSocket and EventSource never count. */
  settle(opts?: SettleOptions): Promise<{ inflight: number }> {
    void opts;
    throw new Error('not implemented');
  }

  /** In-scope exchanges seen so far. Used by drivers to refuse a run whose start page recorded nothing. */
  get inScopeCount(): number {
    throw new Error('not implemented');
  }

  /** Live counts; the same object that goes into the end line. */
  get counts(): Counts {
    throw new Error('not implemented');
  }

  /**
   * Writes the end line with the given outcome, fsyncs, closes the connection. Idempotent.
   * Called by the socket's onClose too, with reason 'browser-closed' and outcome 'interrupted'.
   */
  close(outcome?: 'completed' | 'failed' | 'owner_ended'): Promise<Counts> {
    void outcome;
    throw new Error('not implemented');
  }
}
