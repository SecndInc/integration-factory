// The one rule for "this path segment is an id", shared by onboard's distinctEndpoints and
// apidocs' derive. Moved out of playwright-capture.ts so the two cannot drift.
// Design: docs/design/api-docs.md §5 step 1.

/** Numeric, 12+ hex, UUID, or a 16+ character token mixing letters and digits. */
export function isIdSegment(segment: string): boolean {
  void segment;
  throw new Error('not implemented');
}
