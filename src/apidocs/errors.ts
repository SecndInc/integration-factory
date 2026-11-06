// One error type for the capture and build path. The CLI maps `code` to an exit code and
// prints `fix`. No provider or protocol message reaches a user without passing through here.

export const captureErrorCodes = [
  'browser-unreachable',   // cdpUrl refused or /json/version failed
  'attach-failed',         // Target.setAutoAttach or Network.enable rejected
  'no-traffic-recorded',   // the start page produced zero in-scope exchanges: wrong browser or scope
  'trace-exists',          // record refuses to append to an existing trace path
  'trace-unreadable',      // a trace file could not be parsed at all
  'trace-version',         // a traceVersion/workflowVersion/docVersion the code does not know
  'workflow-invalid',      // a workflow spec failed its schema
  'browser-closed',        // the socket dropped mid-run
  'step-order',            // begin/end called out of protocol order (a caller bug)
  'plan-invalid',          // a snapshot plan failed its schema or cross-checks
  'consent-missing',       // snapshot on a production target without a valid snapshotConsent
  'session-expired',       // a liveness probe says the signed-in session is gone
  'snapshot-incomplete',   // the snapshot finished with failed or partial endpoints
] as const;
export type CaptureErrorCode = (typeof captureErrorCodes)[number];

export class CaptureError extends Error {
  constructor(
    readonly code: CaptureErrorCode,
    message: string,
    /** The one action that fixes it, printed by the CLI. */
    readonly fix?: string,
  ) {
    super(message);
    this.name = 'CaptureError';
  }
}

/** Exit codes the CLI uses. 0 ok, 1 unexpected, 2 environment, 3 input, 4 run did not complete. */
export function exitCodeFor(code: CaptureErrorCode): number {
  switch (code) {
    case 'browser-unreachable':
    case 'attach-failed':
    case 'no-traffic-recorded':
    case 'browser-closed':
      return 2;
    case 'trace-exists':
    case 'trace-unreadable':
    case 'trace-version':
    case 'workflow-invalid':
    case 'plan-invalid':
    case 'consent-missing':
      return 3;
    case 'session-expired':
    case 'snapshot-incomplete':
      return 4;
    case 'step-order':
      return 1;
  }
}
