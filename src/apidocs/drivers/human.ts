// Human driver: prints one step at a time and waits for Enter. The person does the step in the
// browser. Enter settles the network and closes the step; `s` skips, `f <reason>` fails, `q` ends
// the run as owner_ended. Works against any browser source; in attach mode there is no Playwright
// at all. Design: docs/design/api-docs.md §4.

import type { ResolvedTarget } from '../../target.js';
import type { Counts, RunId, Workflow } from '../types.js';

export type BrowserSource =
  /** A Chrome the person started with --remote-debugging-port. No Playwright. */
  | { kind: 'attached'; cdpUrl: string }
  /** LocalBrowserProvider(headed, proxy, exposeCdp = true); the driver opens startUrl in a new context. */
  | { kind: 'local'; headed: boolean; storageStatePath?: string }
  /** BrowserbaseProvider; the recorder connects to the session's connectUrl. */
  | { kind: 'browserbase'; storageStatePath?: string };

export interface HumanDriverOptions {
  target: ResolvedTarget;
  workflow: Workflow;
  browser: BrowserSource;
  tracePath: string;
  runId: RunId;
  /** Extra in-scope hosts beyond target.host. */
  extraHosts?: readonly string[];
  holdBodies?: boolean;
  io: { input: NodeJS.ReadableStream; output: NodeJS.WritableStream };
  log: (line: string) => void;
}

export interface RecordSummary {
  runId: RunId;
  tracePath: string;
  outcome: 'completed' | 'failed' | 'owner_ended';
  counts: Counts;
  steps: readonly { id: string; outcome: 'ok' | 'failed' | 'skipped'; exchanges: number }[];
}

/**
 * Attach the recorder, open the start page (local/browserbase) or tell the person to (attached),
 * refuse with CaptureError('no-traffic-recorded') when the start page produced zero in-scope exchanges,
 * then run each step through Recorder.step with a prompt. Always closes the recorder.
 */
export async function recordWithHumanDriver(opts: HumanDriverOptions): Promise<RecordSummary> {
  void opts;
  throw new Error('not implemented');
}
