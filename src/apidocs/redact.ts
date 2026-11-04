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

const jwtShape = /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
const authPrefix = /^(?:bearer|basic|token)\s+\S{8,}/i;
const hexToken = /^[0-9a-f]{32,}$/i;
const base64Token = /^[A-Za-z0-9+/_-]{32,}={0,2}$/;
const uuidShape = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneShapes = [/^\+\d[\d\s().-]{8,}\d$/, /^\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}$/];

/** Names the shared pattern misses: refresh tokens, session ids, credentials, one-time codes. */
const supplementaryNamePattern = /refresh|credential|jwt|bearer|passcode|otp|(?:^|[^a-z])(?:sid|pin)(?:$|[^a-z])/i;
const bearerInText = /\b(bearer|basic)(\s+)[A-Za-z0-9._~+/=-]{8,}/gi;
const jwtInText = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;
const pairInText = /([A-Za-z0-9_.-]+)(["']?\s*[=:]\s*)(["']?)([^\s&;,"'<>#?=]+)/g;

/** True when `name` alone would cause redaction, without looking at the value. */
export function isSensitiveName(name: string, policy: RedactionPolicy): boolean {
  const lower = name.toLowerCase();
  if ((sensitiveNames as readonly string[]).includes(lower)) return true;
  if (sensitiveNamePattern.test(lower) || supplementaryNamePattern.test(lower)) return true;
  return policy.extraKeys.some((k) => k.toLowerCase() === lower);
}

/** True when the value alone looks like a secret (rule 3 above). */
export function looksLikeSecret(value: string): boolean {
  if (jwtShape.test(value) || authPrefix.test(value) || hexToken.test(value)) return true;
  if (emailShape.test(value)) return true;
  if (phoneShapes.some((p) => p.test(value))) return true;
  if (uuidShape.test(value)) return false;
  return base64Token.test(value) && /[A-Za-z]/.test(value) && /\d/.test(value);
}

/**
 * Walks `value` and replaces anything sensitive with REDACTED, keeping structure.
 * Rules, first match wins:
 *   1. place name or key in sensitiveNames, matches sensitiveNamePattern, or in policy.extraKeys
 *   2. string equal to a policy.secretValue
 *   3. string shaped like a JWT, 32+ hex, 32+ base64/base64url, an email address, or a phone number
 * Objects and arrays recurse with the child's place. Numbers, booleans and null pass through.
 * Cookie values are always replaced; `set-cookie` and `cookie` header values keep names and attributes.
 */
export function redact<T>(value: T, place: ValuePlace, policy: RedactionPolicy): Redacted<T> {
  return walk(value, place, rootKey(place), false, policy) as Redacted<T>;
}

function rootKey(place: ValuePlace): string | undefined {
  if (place.in === 'doc') return undefined;
  if (place.in === 'body') return lastKey(place.path);
  return place.name;
}

function lastKey(path: string): string | undefined {
  const m = /\.([^.[\]]+)(?:\[\d+\])*$/.exec(path);
  return m?.[1];
}

function walk(value: unknown, place: ValuePlace, key: string | undefined, forced: boolean, policy: RedactionPolicy): unknown {
  if (typeof value === 'string') return redactString(value, place, key, forced, policy);
  if (Array.isArray(value)) {
    const sensitive = forced || (key !== undefined && isSensitiveName(key, policy));
    return value.map((item, i) => walk(item, place.in === 'body' ? { in: 'body', path: `${place.path}[${i}]` } : place, key, sensitive, policy));
  }
  if (value !== null && typeof value === 'object') {
    const sensitive = forced || (key !== undefined && isSensitiveName(key, policy));
    const out: Record<string, unknown> = {};
    for (const [k, child] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walk(child, childPlace(place, k), k, sensitive, policy);
    }
    return out;
  }
  return value;
}

function childPlace(place: ValuePlace, key: string): ValuePlace {
  if (place.in === 'body') return { in: 'body', path: `${place.path}.${key}` };
  if (place.in === 'doc') return place;
  return { in: place.in, name: key };
}

function redactString(value: string, place: ValuePlace, key: string | undefined, forced: boolean, policy: RedactionPolicy): string {
  if (place.in === 'cookie') return REDACTED;
  const lowerKey = key?.toLowerCase();
  if (place.in === 'header' && lowerKey === 'set-cookie') return redactCookieHeader(value, true);
  if (place.in === 'header' && lowerKey === 'cookie') return redactCookieHeader(value, false);
  if (forced || (key !== undefined && isSensitiveName(key, policy))) return REDACTED;
  if (policy.secretValues.includes(value)) return REDACTED;
  if (looksLikeSecret(value)) return REDACTED;
  return redactText(value, policy);
}

/**
 * Scans free text (and strings embedding URLs, query strings or forms) for secrets:
 * every policy secret value, `Bearer <token>`, JWT shapes, and the value of any
 * `name=value` / `name: value` pair whose name is sensitive.
 */
export function redactText(text: string, policy: RedactionPolicy): string {
  let out = text;
  for (const secret of policy.secretValues) {
    if (secret && out.includes(secret)) out = out.split(secret).join(REDACTED);
  }
  out = out.replace(bearerInText, (_m, scheme: string, space: string) => `${scheme}${space}${REDACTED}`);
  out = out.replace(jwtInText, REDACTED);
  return out.replace(pairInText, (match, name: string, sep: string, quote: string, val: string) =>
    val === REDACTED || !isSensitiveName(name, policy) ? match : `${name}${sep}${quote}${REDACTED}`,
  );
}

/** `a=1; b=2` or `id=abc; Path=/; HttpOnly` -> names and attribute names kept, values replaced. */
function redactCookieHeader(value: string, setCookie: boolean): string {
  return value
    .split(';')
    .map((segment, i) => {
      const part = segment.trim();
      if (setCookie && i > 0) return part; // attributes: Path, Domain, Expires, HttpOnly...
      const eq = part.indexOf('=');
      return eq < 0 ? part : `${part.slice(0, eq)}=${REDACTED}`;
    })
    .join('; ');
}
