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
/** Arrays in a documented example keep this many items; the schema still comes from every item seen. */
export const exampleArrayMaxItems = 2;
/** Observations listed per endpoint in the rendered docs; the rest is a count (a poll is seen hundreds of times). */
export const observedInMaxRows = 12;
/** Bindings listed per endpoint in the rendered docs; the rest is a count (every request carries the same cookies). */
export const bindingsMaxRows = 20;
/** Connecting the browser-level CDP socket, and probing `/json/version` or `connectOverCDP` in attach mode. */
export const cdpConnectTimeoutMs = 5_000;
/** `inspect --show` prints at most this much of a body unless `--raw`. */
export const showBodyMaxChars = 4000;
/** A value with no source counts as `computed` when it is at least this long and this random (Shannon bits per char). */
export const computedMinLength = 16;
export const computedMinEntropy = 3.5;
/** Distinct values kept per custom header while deciding whether it is constant (a context header) or a token. */
export const contextHeaderValuesMax = 2;
/** `apidocs mine`: bundles fetched per run, bytes kept per bundle, concurrent fetches, and the read-only tour's items opened per page. */
export const bundlesMax = 800;
export const bundleMaxBytes = 8 * 1024 * 1024;
export const mineFetchConcurrency = 4;
export const mineFetchTimeoutMs = 20_000;
export const tourItemsPerPage = 3;
/** A click on a list row that has not opened anything by then is skipped; the tour moves to the next item. */
export const tourClickTimeoutMs = 3_000;
/** Characters of call-site context read on each side of a path literal when inferring its method (mine). */
export const mineContextWindowChars = 160;
/** A path literal longer than this is inline data, not a route (mine). */
export const minePathMaxChars = 200;
