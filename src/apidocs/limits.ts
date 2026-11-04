// Every numeric limit in src/apidocs, named after what it bounds. No other file holds a bare number.

/** Largest request or response body the recorder keeps. Larger ones are recorded as `too-large` with their size. */
export const bodyMaxBytes = 2 * 1024 * 1024;
/** Per-target in-memory resource buffer asked of Chromium, so bodies survive until `getResponseBody` lands. */
export const networkTotalBufferBytes = 256 * 1024 * 1024;
export const networkResourceBufferBytes = 32 * 1024 * 1024;
/** Text kept per WebSocket, after which frames are counted but not stored. */
export const webSocketBudgetBytes = 256 * 1024;
/** `settle()` resolves when no in-scope request has been in flight for this long. */
export const settleQuietMs = 500;
/** ...or at this cap, whichever comes first. */
export const settleCapMs = 10_000;
/** Raw traces hold cookies and tokens; `record` deletes traces older than this at start. */
export const traceRetentionDays = 1;
/** JSON Schema inference depth cap and keys-per-object cap. */
export const schemaDepthMax = 8;
export const schemaKeysPerObjectMax = 200;
/** A request value shorter than this is never searched for a binding. */
export const bindingMinStringLength = 6;
export const bindingMinNumberDigits = 4;
/** An endpoint seen in at least this many steps, and in more than half of one run's steps, is `ambient`. */
export const ambientMinSteps = 3;
/** Text bodies in examples are truncated here. */
export const exampleTextMaxBytes = 64 * 1024;
