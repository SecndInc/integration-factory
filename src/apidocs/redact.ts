// The only constructor of `Redacted<T>`. Renderers accept a `Redacted<ApiDoc>`, so a raw
// captured value cannot reach a page except through redact(). Pure; no I/O.
// Design: docs/design/api-docs.md §5 step 4.

declare const redacted: unique symbol;
/** A value that went through redact(). */
export type Redacted<T> = T & { readonly [redacted]: true };

export const REDACTED = '{redacted}';

export interface RedactionPolicy {
  /** Extra header, cookie, query or body key names (case-insensitive) the site config lists. */
  extraKeys: readonly string[];
  /** Values of inputs marked `secret` in the workflow spec. Replaced wherever they appear. */
  secretValues: readonly string[];
}

export const emptyRedactionPolicy: RedactionPolicy = { extraKeys: [], secretValues: [] };

export type ValuePlace =
  | { in: 'header' | 'cookie' | 'query' | 'path'; name: string }
  | { in: 'body'; path: string } // JSONPath-like: "$.items[0].owner.email"
  | { in: 'doc' };

/** Header and key names redacted wherever they appear (lowercase compare). */
export const sensitiveNames = [
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
] as const;
/** Name fragments that mark a key as sensitive. Shared with sanitizedQuery in playwright-capture.ts. */
export const sensitiveNamePattern = /token|secret|key|auth|session|signature|password|passwd|email|code|csrf/i;

/**
 * Walks `value` and replaces anything sensitive with REDACTED, keeping structure.
 * Rules, first match wins:
 *   1. place name or key in sensitiveNames, matches sensitiveNamePattern, or in policy.extraKeys
 *   2. string equal to a policy.secretValue
 *   3. string shaped like a JWT, 32+ hex, 32+ base64/base64url, an email address, or a phone number
 * Objects and arrays recurse with the child's place. Numbers, booleans and null pass through.
 */
export function redact<T>(value: T, place: ValuePlace, policy: RedactionPolicy): Redacted<T> {
  void value;
  void place;
  void policy;
  throw new Error('not implemented');
}

/** True when `name` alone would cause redaction, without looking at the value. */
export function isSensitiveName(name: string, policy: RedactionPolicy): boolean {
  void name;
  void policy;
  throw new Error('not implemented');
}

/** True when the value alone looks like a secret (rule 3 above). */
export function looksLikeSecret(value: string): boolean {
  void value;
  throw new Error('not implemented');
}
