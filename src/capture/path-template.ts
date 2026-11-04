// The one rule for "this path segment is an id", shared by onboard's distinctEndpoints and
// apidocs' derive. Moved out of playwright-capture.ts so the two cannot drift.
// Design: docs/design/api-docs.md §5 step 1.

const numeric = /^\d+$/;
const hex = /^[0-9a-f]{12,}$/i;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenChars = /^[A-Za-z0-9_-]+$/;
const mixedTokenMinLength = 16;

/** Numeric, 12+ hex, UUID, or a 16+ character token mixing letters and digits. */
export function isIdSegment(segment: string): boolean {
  if (!segment) return false;
  if (numeric.test(segment) || hex.test(segment) || uuid.test(segment)) return true;
  return (
    segment.length >= mixedTokenMinLength &&
    tokenChars.test(segment) &&
    /[A-Za-z]/.test(segment) &&
    /\d/.test(segment)
  );
}
