// derive(): assembled traces + workflow specs -> ApiDoc. Pure; no I/O; unit-tested on committed
// scrubbed fixture traces. Design: docs/design/api-docs.md §5.
//
// Order of work inside derive():
//   1. usable runs: traces with outcome 'completed'; a write workflow needs an `inverse` or it is listed, not derived
//   2. endpointKey: method + host + templatePath(path) (+ GraphQL operationName); isIdSegment from capture/path-template.ts
//   3. kinds: text/html documents -> 'page'; OPTIONS with access-control-request-method folds into its target (cors: true);
//      resourceType in {XHR, Fetch, Document, WebSocket, EventSource} or Other with JSON mime; ambient per limits.ts
//   4. bindings and inputs on real values, walking each trace in seq order (see findBindings)
//   5. schemas: shapeToJsonSchema over the examples per status; required = keys present in every example
//   6. redact last: every example and param through redact(); the result is a Redacted<ApiDoc>
//   7. auth: cookie names on every in-scope request, token-shaped header names, login workflow's verification
//   8. cases: one per completed run per workflow; coverage: counts only

import { isIdSegment } from '../capture/path-template.js';
import type { ResolvedTarget } from '../target.js';
import {
  ambientMinSteps,
  bindingMinNumberDigits,
  bindingMinStringLength,
  computedMinEntropy,
  computedMinLength,
  exampleTextMaxBytes,
  schemaDepthMax,
  schemaKeysPerObjectMax,
} from './limits.js';
import { isSensitiveName, looksLikeSecret, REDACTED, redact, type Redacted, type RedactionPolicy } from './redact.js';
import type {
  ApiDoc,
  Binding,
  Body,
  BodyDoc,
  Coverage,
  Endpoint,
  EndpointId,
  Evidence,
  Exchange,
  ExchangeId,
  Headers as HeaderList,
  HeaderUse,
  JsonSchema,
  Param,
  ParamSource,
  RunId,
  SiteId,
  StepId,
  Trace,
  Workflow,
  WorkflowDoc,
  WorkflowId,
} from './types.js';

export interface DeriveInput {
  target: ResolvedTarget;
  workflows: readonly Workflow[];
  /** Assembled traces with their file paths, any outcome. */
  traces: readonly { path: string; trace: Trace }[];
  redaction: RedactionPolicy;
}

// ---------------------------------------------------------------------------------------------
// templatePath, graphqlOperation
// ---------------------------------------------------------------------------------------------

/** `/drafts/9f2c...` -> `/drafts/{draftId}`; params named after the previous segment, fallback {id}, {id2}. */
export function templatePath(path: string): { template: string; params: readonly { name: string; value: string }[] } {
  const bare = path.split(/[?#]/, 1)[0] ?? '';
  const segments = bare.split('/');
  const used = new Set<string>();
  const params: { name: string; value: string }[] = [];
  const out = segments.map((segment, i) => {
    const prev = segments[i - 1];
    const secret = !isIdSegment(segment) && isSecretSegment(segment, prev);
    if (!secret && !isIdSegment(segment)) return segment;
    const base = secret ? 'token' : (prev && !isIdSegment(prev) ? paramBase(prev) : '') || 'id';
    const name = uniqueName(base, used);
    used.add(name);
    params.push({ name, value: segment });
    return `{${name}}`;
  });
  return { template: out.join('/') || '/', params };
}

const secretSegmentMinLength = 16;
const secretRouteWords = /^(?:reset|verify|confirm|invite|unsubscribe|activate|magic|token|redeem)$/i;

/** A non-id segment that still looks like a secret: token-shaped, sensitive-named with a shouting run, or after reset/verify/... */
function isSecretSegment(segment: string, previous: string | undefined): boolean {
  if (looksLikeSecret(segment)) return true;
  const mixed = /\d/.test(segment) || /[A-Z]{3,}/.test(segment);
  if (segment.length >= secretSegmentMinLength && mixed && isSensitiveName(segment, { extraKeys: [], secretValues: [] })) return true;
  return Boolean(previous && secretRouteWords.test(previous) && segment.length >= bindingMinStringLength + 2 && mixed && /[A-Za-z]/.test(segment));
}

function paramBase(previous: string): string {
  const words = previous.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length === 0) return '';
  const last = words[words.length - 1] ?? '';
  const singular = last.endsWith('ies') ? `${last.slice(0, -3)}y` : last.endsWith('s') && !last.endsWith('ss') ? last.slice(0, -1) : last;
  const parts = [...words.slice(0, -1), singular];
  const camel = parts.map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1))).join('');
  return /^[A-Za-z]/.test(camel) ? `${camel}Id` : '';
}

function uniqueName(base: string, used: ReadonlySet<string>): string {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

export interface GraphqlOperationInfo {
  name: string;
  type: 'query' | 'mutation' | 'subscription';
}

function parseGraphql(exchange: Exchange): { name?: string; type: GraphqlOperationInfo['type'] } | undefined {
  if (exchange.request.method.toUpperCase() !== 'POST') return undefined;
  if (!/\/graphql\/?$/i.test(exchange.request.path.split('?', 1)[0] ?? '')) return undefined;
  const body = decodeBody(exchange.request.body, headerValue(exchange.request.headers, 'content-type'));
  const json = body?.json;
  if (!json || typeof json !== 'object' || Array.isArray(json)) return undefined;
  const record = json as Record<string, unknown>;
  const query = typeof record.query === 'string' ? record.query : '';
  const declared = /^\s*(query|mutation|subscription)\b\s*([A-Za-z_]\w*)?/.exec(query);
  const type = (declared?.[1] as GraphqlOperationInfo['type'] | undefined) ?? 'query';
  const name = typeof record.operationName === 'string' && record.operationName ? record.operationName : declared?.[2];
  return { ...(name ? { name } : {}), type };
}

/** Operation name and type for a JSON POST to a path ending in /graphql; undefined when anonymous. */
export function graphqlOperationInfo(exchange: Exchange): GraphqlOperationInfo | undefined {
  const parsed = parseGraphql(exchange);
  return parsed?.name ? { name: parsed.name, type: parsed.type } : undefined;
}

/** `query:Name`, `mutation:Name` or `query:anonymous`: the endpoint's operation string. */
function graphqlOperationKey(exchange: Exchange): string | undefined {
  const parsed = parseGraphql(exchange);
  return parsed ? `${parsed.type}:${parsed.name ?? 'anonymous'}` : undefined;
}

/** operationName from a JSON body, or the name in its `query` text, for a POST to a path ending in /graphql. */
export function graphqlOperation(exchange: Exchange): string | undefined {
  return graphqlOperationInfo(exchange)?.name;
}

// ---------------------------------------------------------------------------------------------
// shapeToJsonSchema
// ---------------------------------------------------------------------------------------------

const formatChecks: readonly (readonly [string, RegExp])[] = [
  ['uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i],
  ['date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i],
  ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/],
  ['uri', /^https?:\/\/[^\s]+$/i],
];

/** JSON Schema 2020-12 subset: type, properties, items, required, anyOf. Depth and key caps from limits.ts. A null mixed in gives type [T, "null"]. */
export function shapeToJsonSchema(examples: readonly unknown[]): JsonSchema {
  return schemaOf(examples.filter((e) => e !== undefined), 0);
}

/** More dynamic-looking keys (ids) than this makes an object a map. */
const dynamicKeyCap = 3;

/** True when property names carry data (emails, tokens, many ids): the object is a map, not a record. */
function hasDynamicKeys(keys: readonly string[]): boolean {
  return keys.some((k) => looksLikeSecret(k)) || keys.filter((k) => isIdSegment(k)).length > dynamicKeyCap;
}

/** Replaces the keys of map-like objects with a single `{key}` entry, recursively. */
function collapseDynamicKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(collapseDynamicKeys);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value as Record<string, unknown>);
  if (hasDynamicKeys(entries.map(([k]) => k))) {
    return entries.length ? { '{key}': collapseDynamicKeys(entries[0]?.[1]) } : {};
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, collapseDynamicKeys(v)]));
}

type JsonKind ='null' | 'boolean' | 'integer' | 'number' | 'string' | 'array' | 'object';

function kindOf(value: unknown): JsonKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return Number.isInteger(value) ? 'integer' : 'number';
    case 'string':
      return 'string';
    default:
      return 'object';
  }
}

function schemaOf(examples: readonly unknown[], depth: number): JsonSchema {
  if (examples.length === 0) return {};
  const byKind = new Map<JsonKind, unknown[]>();
  for (const example of examples) {
    const kind = kindOf(example);
    byKind.set(kind, [...(byKind.get(kind) ?? []), example]);
  }
  // integer and number merge into number
  const ints = byKind.get('integer');
  if (ints && byKind.has('number')) {
    byKind.set('number', [...(byKind.get('number') ?? []), ...ints]);
    byKind.delete('integer');
  }
  const nullable = byKind.has('null');
  byKind.delete('null');
  const parts = [...byKind.entries()].map(([kind, values]) => kindSchema(kind, values, depth));
  if (parts.length === 0) return { type: 'null' };
  if (parts.length === 1) {
    const only = parts[0] as JsonSchema;
    return nullable ? { ...only, type: [only.type, 'null'] } : only;
  }
  return { anyOf: nullable ? [...parts, { type: 'null' }] : parts };
}

function kindSchema(kind: JsonKind, values: readonly unknown[], depth: number): JsonSchema {
  if (kind === 'array') {
    if (depth >= schemaDepthMax) return { type: 'array' };
    const items = values.flatMap((v) => v as unknown[]);
    return items.length === 0 ? { type: 'array' } : { type: 'array', items: schemaOf(items, depth + 1) };
  }
  if (kind === 'object') {
    if (depth >= schemaDepthMax) return { type: 'object' };
    const objects = values as Record<string, unknown>[];
    if (hasDynamicKeys(objects.flatMap((o) => Object.keys(o)))) {
      return { type: 'object', additionalProperties: schemaOf(objects.flatMap((o) => Object.values(o)), depth + 1) };
    }
    const keys: string[] = [];
    for (const obj of objects) {
      for (const key of Object.keys(obj)) {
        if (!keys.includes(key) && keys.length < schemaKeysPerObjectMax) keys.push(key);
      }
    }
    const properties: Record<string, JsonSchema> = {};
    for (const key of keys) {
      properties[key] = schemaOf(objects.filter((o) => key in o).map((o) => o[key]), depth + 1);
    }
    const required = keys.filter((key) => objects.every((o) => key in o));
    return {
      type: 'object',
      ...(keys.length ? { properties } : {}),
      ...(required.length ? { required } : {}),
    };
  }
  if (kind === 'string') {
    const strings = values as string[];
    const format = formatChecks.find(([, re]) => strings.every((s) => re.test(s)))?.[0];
    return format ? { type: 'string', format } : { type: 'string' };
  }
  return { type: kind };
}

// ---------------------------------------------------------------------------------------------
// Bodies and request values
// ---------------------------------------------------------------------------------------------

interface DecodedBody {
  mediaType: string;
  /** Present when the body parsed as JSON, a form, or multipart fields. */
  json?: unknown;
  text?: string;
  binaryBytes?: number;
}

const decodedCache = new WeakMap<object, DecodedBody>();

function headerValue(headers: HeaderList, name: string): string | undefined {
  const lower = name.toLowerCase();
  return headers.find(([n]) => n.toLowerCase() === lower)?.[1];
}

function mediaTypeOf(contentType: string | undefined): string {
  return (contentType ?? '').split(';', 1)[0]?.trim().toLowerCase() ?? '';
}

function decodeBody(body: Body | undefined, contentType: string | undefined): DecodedBody | undefined {
  if (!body) return undefined;
  const cached = decodedCache.get(body);
  if (cached) return cached;
  const mediaType = mediaTypeOf(contentType);
  let decoded: DecodedBody;
  if (body.encoding === 'multipart') {
    const fields: Record<string, unknown> = {};
    for (const part of body.parts) {
      const name = part.name ?? '';
      if ('text' in part.content) fields[name] = part.content.text;
      else fields[name] = { filename: part.filename ?? null, contentType: part.contentType ?? null };
    }
    decoded = { mediaType: 'multipart/form-data', json: fields };
  } else if (body.encoding === 'base64') {
    decoded = { mediaType: mediaType || 'application/octet-stream', binaryBytes: body.bytes };
  } else if (mediaType.includes('x-www-form-urlencoded')) {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of new URLSearchParams(body.text)) fields[k] = fields[k] === undefined ? v : [fields[k], v].flat();
    decoded = { mediaType, json: fields };
  } else {
    const trimmed = body.text.trimStart();
    const jsonLike = mediaType.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[');
    let parsed: { ok: true; value: unknown } | { ok: false } = { ok: false };
    if (jsonLike) {
      try {
        parsed = { ok: true, value: JSON.parse(body.text) as unknown };
      } catch {
        /* not JSON */
      }
    }
    decoded = parsed.ok
      ? { mediaType: mediaType || 'application/json', json: parsed.value }
      : { mediaType: mediaType || 'text/plain', text: truncate(body.text) };
  }
  decodedCache.set(body, decoded);
  return decoded;
}

function truncate(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return bytes.length > exampleTextMaxBytes ? new TextDecoder().decode(bytes.subarray(0, exampleTextMaxBytes)) : text;
}

const standardHeaders = new Set([
  'host',
  'user-agent',
  'accept',
  'accept-language',
  'accept-encoding',
  'content-type',
  'content-length',
  'connection',
  'origin',
  'referer',
  'cache-control',
  'pragma',
  'upgrade-insecure-requests',
  'dnt',
  'te',
  'priority',
  'if-none-match',
  'if-modified-since',
  'range',
  'cookie',
]);

function isStandardHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return standardHeaders.has(lower) || lower.startsWith('sec-') || lower.startsWith(':');
}

interface RequestValue {
  to: Binding['to'];
  value: string;
}

const requestValueCache = new WeakMap<Exchange, readonly RequestValue[]>();

function toKey(to: Binding['to']): string {
  return `${to.location}:${to.path}`;
}

function eligible(value: string): boolean {
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return value.replace(/\D/g, '').length >= bindingMinNumberDigits;
  return value.length >= bindingMinStringLength;
}

function bodyLeaves(value: unknown, path: string, depth: number, out: { path: string; value: string }[]): void {
  if (depth > schemaDepthMax * 2) return;
  if (typeof value === 'string') out.push({ path, value });
  else if (typeof value === 'number') out.push({ path, value: String(value) });
  else if (Array.isArray(value)) value.forEach((item, i) => bodyLeaves(item, `${path}[${i}]`, depth + 1, out));
  else if (value && typeof value === 'object') {
    for (const [k, child] of Object.entries(value as Record<string, unknown>)) bodyLeaves(child, `${path}.${k}`, depth + 1, out);
  }
}

function parseCookieHeader(value: string): { name: string; value: string }[] {
  return value
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const eq = p.indexOf('=');
      return eq < 0 ? { name: p, value: '' } : { name: p.slice(0, eq), value: p.slice(eq + 1) };
    });
}

function requestValues(exchange: Exchange): readonly RequestValue[] {
  const cached = requestValueCache.get(exchange);
  if (cached) return cached;
  const out: RequestValue[] = [];
  const seen = new Set<string>();
  const add = (to: Binding['to'], value: string): void => {
    const k = toKey(to);
    if (value === '' || seen.has(k)) return;
    seen.add(k);
    out.push({ to, value });
  };
  for (const p of templatePath(exchange.request.path).params) add({ location: 'path', path: p.name }, p.value);
  for (const [k, v] of exchange.request.query) add({ location: 'query', path: k }, v);
  for (const [name, raw] of exchange.request.headers) {
    if (isStandardHeader(name)) continue;
    const value = name.toLowerCase() === 'authorization' ? raw.replace(/^(?:bearer|basic|token)\s+/i, '') : raw;
    add({ location: 'header', path: name.toLowerCase() }, value);
  }
  const cookies =
    exchange.request.cookies.length > 0
      ? exchange.request.cookies.map((c) => ({ name: c.name, value: c.value }))
      : parseCookieHeader(headerValue(exchange.request.headers, 'cookie') ?? '');
  for (const c of cookies) add({ location: 'cookie', path: c.name }, c.value);
  const decoded = decodeBody(exchange.request.body, headerValue(exchange.request.headers, 'content-type'));
  if (decoded?.json !== undefined) {
    const leaves: { path: string; value: string }[] = [];
    bodyLeaves(decoded.json, '$', 0, leaves);
    for (const leaf of leaves) add({ location: 'body', path: leaf.path }, leaf.value);
  }
  requestValueCache.set(exchange, out);
  return out;
}

// ---------------------------------------------------------------------------------------------
// findBindings
// ---------------------------------------------------------------------------------------------

export interface ValueSource {
  exchangeId: Exchange['id'];
  location: Binding['from']['location'];
  path: string;
}

interface SourceHit {
  location: Binding['from']['location'];
  path: string;
}

const sourceIndexCache = new WeakMap<Exchange, ReadonlyMap<string, SourceHit>>();

function responseSources(exchange: Exchange): ReadonlyMap<string, SourceHit> {
  const cached = sourceIndexCache.get(exchange);
  if (cached) return cached;
  const index = new Map<string, SourceHit>();
  const put = (value: string, hit: SourceHit): void => {
    if (value !== '' && !index.has(value)) index.set(value, hit);
  };
  const response = exchange.response;
  if (response) {
    const decoded = decodeBody(response.body, response.mimeType);
    if (decoded?.json !== undefined) {
      const leaves: { path: string; value: string }[] = [];
      bodyLeaves(decoded.json, '$', 0, leaves);
      for (const leaf of leaves) put(leaf.value, { location: 'response.body', path: leaf.path });
    }
    for (const [name, value] of response.headers) {
      const lower = name.toLowerCase();
      if (lower === 'set-cookie') continue;
      const hit = { location: 'response.header', path: lower } as const;
      put(value, hit);
      if (lower === 'location' || lower === 'content-location') {
        const [pathPart = '', queryPart = ''] = value.split('?', 2);
        for (const segment of pathPart.split('/')) put(segment, hit);
        for (const [, v] of new URLSearchParams(queryPart)) put(v, hit);
      }
    }
    for (const line of response.setCookies) {
      const first = line.split(';', 1)[0] ?? '';
      const eq = first.indexOf('=');
      if (eq > 0) put(first.slice(eq + 1).trim(), { location: 'set-cookie', path: first.slice(0, eq).trim() });
    }
  }
  sourceIndexCache.set(exchange, index);
  return index;
}

function snapshotSources(snapshot: Trace['snapshots'][number]): Map<string, SourceHit> {
  const index = new Map<string, SourceHit>();
  const put = (value: string, path: string): void => {
    if (value !== '' && !index.has(value)) index.set(value, { location: 'storage', path });
  };
  for (const c of snapshot.cookies) put(c.value, `cookie[${c.name}]`);
  for (const s of snapshot.storage) {
    for (const [k, v] of Object.entries(s.local)) put(v, `localStorage[${k}]`);
    for (const [k, v] of Object.entries(s.session)) put(v, `sessionStorage[${k}]`);
  }
  return index;
}

const derivedNamePattern = /signature|hmac|(?:^|[-_.[$])(?:sig|hash|digest|nonce|checksum|mac)(?:[-_.\]]|$)/i;

function entropyOf(text: string): number {
  const counts = new Map<string, number>();
  for (const ch of text) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / text.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function looksComputed(rv: RequestValue): boolean {
  if (derivedNamePattern.test(rv.to.path)) return true;
  const v = rv.value;
  return (
    v.length >= computedMinLength &&
    /^[A-Za-z0-9+/_=.-]+$/.test(v) &&
    /[A-Za-z]/.test(v) &&
    /\d/.test(v) &&
    entropyOf(v) >= computedMinEntropy
  );
}

/**
 * For each dynamic value in `exchange` (path params, query values, non-standard headers, body leaves, cookies)
 * find the most recent earlier source: a response body leaf, response header, Set-Cookie value, or a
 * storage snapshot entry. Values shorter than bindingMinStringLength / bindingMinNumberDigits are skipped.
 * A value equal to a declared input is reported as `input`; no hit and high entropy -> `computed`.
 * A value present in every earlier exchange (at least ambientMinSteps in all) is reported with no
 * `from`, no `input` and `computed: false`; a plain literal is not reported at all.
 */
export function findBindings(
  exchange: Exchange,
  earlier: readonly Exchange[],
  snapshots: Trace['snapshots'],
  inputs: Readonly<Record<string, string>>,
): readonly { to: Binding['to']; from?: ValueSource; input?: string; computed: boolean }[] {
  const inputByValue = new Map<string, string>();
  for (const [name, value] of Object.entries(inputs)) {
    if (value !== '' && !inputByValue.has(value)) inputByValue.set(value, name);
  }
  const priorSnapshots = snapshots.filter((s) => s.seq < exchange.seq);
  const out: { to: Binding['to']; from?: ValueSource; input?: string; computed: boolean }[] = [];
  for (const rv of requestValues(exchange)) {
    const inputName = inputByValue.get(rv.value);
    if (inputName !== undefined) {
      out.push({ to: rv.to, input: inputName, computed: false });
      continue;
    }
    if (!eligible(rv.value)) continue;
    const from = latestSource(rv.value, earlier, priorSnapshots);
    if (from) {
      out.push({ to: rv.to, from, computed: false });
      continue;
    }
    if (earlier.length + 1 >= ambientMinSteps && earlier.every((e) => requestValues(e).some((v) => v.value === rv.value))) {
      out.push({ to: rv.to, computed: false });
      continue;
    }
    if (looksComputed(rv)) out.push({ to: rv.to, computed: true });
  }
  return out;
}

function latestSource(value: string, earlier: readonly Exchange[], snapshots: Trace['snapshots']): ValueSource | undefined {
  let best: { seq: number; source: ValueSource } | undefined;
  for (let i = earlier.length - 1; i >= 0; i -= 1) {
    const ex = earlier[i] as Exchange;
    const hit = responseSources(ex).get(value);
    if (hit) {
      best = { seq: ex.seq, source: { exchangeId: ex.id, ...hit } };
      break;
    }
  }
  for (let i = snapshots.length - 1; i >= 0; i -= 1) {
    const snap = snapshots[i] as Trace['snapshots'][number];
    if (best && snap.seq < best.seq) break;
    const hit = snapshotSources(snap).get(value);
    if (hit) {
      best = { seq: snap.seq, source: { exchangeId: `snapshot:${snap.seq}` as ExchangeId, ...hit } };
      break;
    }
  }
  return best?.source;
}

// ---------------------------------------------------------------------------------------------
// derive
// ---------------------------------------------------------------------------------------------

const keptResourceTypes = new Set(['XHR', 'Fetch', 'Document', 'WebSocket', 'EventSource']);
const staticExtension = /\.(?:js|mjs|css|map|png|jpe?g|gif|svg|ico|webp|avif|bmp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav|ogg)$/i;
const sourceRank: Record<ParamSource, number> = { literal: 0, computed: 1, binding: 2, input: 3 };
const storageEndpoint = 'storage' as EndpointId;

interface ParamAcc {
  example: string;
  count: number;
  source: ParamSource;
}

interface HeaderAcc {
  count: number;
  values: Set<string>;
  source: ParamSource;
}

interface BodyExample {
  mediaType: string;
  json?: unknown;
  hasJson: boolean;
  text?: string;
}

interface Acc {
  id: EndpointId;
  method: string;
  host: string;
  pathTemplate: string;
  operation: string | null;
  exchanges: number;
  allPage: boolean;
  cors: boolean;
  pathParams: Map<string, ParamAcc>;
  queryParams: Map<string, ParamAcc>;
  headers: Map<string, HeaderAcc>;
  cookieNames: Set<string>;
  requests: BodyExample[];
  responses: Map<string, { mediaType: string; examples: BodyExample[] }>;
  bindings: Map<string, Binding>;
  stepsByRun: Map<string, Set<string>>;
  observedIn: Evidence[];
}

interface Call {
  stepId: StepId | null;
  endpointId: EndpointId;
  exchangeId: ExchangeId;
  status: number | null;
}

interface RunRecord {
  trace: Trace;
  path: string;
  used: boolean;
  calls: Call[];
}

function sortBy<T>(items: readonly T[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'site';
}

function hostMatches(host: string, scope: readonly string[]): boolean {
  // Same rule as inScope in trace.ts: the port is not part of the host (a loopback fixture on :61160 is 127.0.0.1).
  const h = host.toLowerCase().replace(/:\d+$/, '');
  return scope.some((s) => h === s || h.endsWith(`.${s}`));
}

function rank(source: ParamSource, current: ParamSource): ParamSource {
  return sourceRank[source] > sourceRank[current] ? source : current;
}

export function derive(input: DeriveInput): Redacted<ApiDoc> {
  const { target, workflows } = input;
  const workflowById = new Map<string, Workflow>(workflows.map((w) => [w.id as string, w]));
  const policy: RedactionPolicy = {
    extraKeys: input.redaction.extraKeys,
    secretValues: [
      ...input.redaction.secretValues,
      ...workflows.flatMap((w) => w.inputs.filter((i) => i.secret && i.example).map((i) => i.example as string)),
    ],
  };

  // Step 1: usable runs.
  const runs: RunRecord[] = sortBy(input.traces, (t) => `${t.trace.startedAt}|${t.trace.runId}`).map(({ path, trace }) => {
    const workflow = trace.workflowId ? workflowById.get(trace.workflowId) : undefined;
    const derivable = !workflow || workflow.effect === 'read' || Boolean(workflow.inverse);
    return { trace, path, used: trace.complete && trace.outcome === 'completed' && derivable, calls: [] };
  });
  const usedRuns = runs.filter((r) => r.used);

  const accs = new Map<string, Acc>();
  const corsKeys = new Set<string>();
  const outside: Evidence[] = [];
  const computedValues = new Set<string>();
  const inputsBound = new Set<string>();
  const authCookieCounts = new Map<string, number>();
  const authHeaderCounts = new Map<string, { count: number; secretLike: boolean }>();
  let totalRequests = 0;

  for (const run of usedRuns) {
    const { trace } = run;
    const workflow = trace.workflowId ? workflowById.get(trace.workflowId) : undefined;
    const inputMap: Record<string, string> = {};
    for (const spec of workflow?.inputs ?? []) if (spec.example) inputMap[spec.name] = spec.example;
    const scope = [...trace.scope.hosts, target.host].flatMap((h) => {
      const lower = h.toLowerCase();
      return [lower, lower.replace(/^www\./, '')];
    });
    const setup = new Set<string>(trace.setupExchangeIds);
    const ordered = [...trace.exchanges].sort((a, b) => a.seq - b.seq);

    // Steps 2 and 3: scope, static assets, preflights, templating.
    const kept: { ex: Exchange; template: ReturnType<typeof templatePath>; operation: string | null; key: string }[] = [];
    for (const ex of ordered) {
      if (!hostMatches(ex.request.host, scope)) continue;
      const preflightFor = headerValue(ex.request.headers, 'access-control-request-method');
      const template = templatePath(ex.request.path);
      if (ex.request.method.toUpperCase() === 'OPTIONS' && preflightFor) {
        corsKeys.add(`${preflightFor.toUpperCase()} ${ex.request.host}${template.template}`);
        continue;
      }
      if (staticExtension.test(ex.request.path.split('?', 1)[0] ?? '')) continue;
      const json = (ex.response?.mimeType ?? '').toLowerCase().includes('json');
      if (!keptResourceTypes.has(ex.resourceType) && !(ex.resourceType === 'Other' && json)) continue;
      const operation = graphqlOperationKey(ex) ?? null;
      const method = ex.request.method.toUpperCase();
      kept.push({ ex, template, operation, key: `${method} ${ex.request.host}${template.template}${operation ? `#${operation}` : ''}` });
    }

    // Values present in every kept exchange are session constants, not computed.
    const valueFrequency = new Map<string, number>();
    for (const { ex } of kept) {
      for (const v of new Set(requestValues(ex).map((r) => r.value))) valueFrequency.set(v, (valueFrequency.get(v) ?? 0) + 1);
    }

    // Step 4: walk in seq order.
    const earlier: Exchange[] = [];
    const endpointOf = new Map<string, EndpointId>();
    for (const { ex, template, operation, key } of kept) {
      const method = ex.request.method.toUpperCase();
      let acc = accs.get(key);
      if (!acc) {
        acc = {
          id: key as EndpointId,
          method,
          host: ex.request.host,
          pathTemplate: template.template,
          operation,
          exchanges: 0,
          allPage: true,
          cors: false,
          pathParams: new Map(),
          queryParams: new Map(),
          headers: new Map(),
          cookieNames: new Set(),
          requests: [],
          responses: new Map(),
          bindings: new Map(),
          stepsByRun: new Map(),
          observedIn: [],
        };
        accs.set(key, acc);
      }
      acc.exchanges += 1;
      const mime = (ex.response?.mimeType ?? '').toLowerCase();
      const isPage = mime.includes('text/html') || (!ex.response && ex.resourceType === 'Document');
      acc.allPage = acc.allPage && isPage;

      const values = requestValues(ex);
      const found = new Map(findBindings(ex, earlier, trace.snapshots, inputMap).map((f) => [toKey(f.to), f]));
      totalRequests += 1;

      for (const rv of values) {
        const entry = found.get(toKey(rv.to));
        const ambientConstant = entry?.computed && (valueFrequency.get(rv.value) ?? 0) === kept.length && kept.length >= ambientMinSteps;
        const computed = Boolean(entry?.computed) && !ambientConstant;
        const source: ParamSource = entry?.input !== undefined ? 'input' : entry?.from ? 'binding' : computed ? 'computed' : 'literal';
        if (entry?.input !== undefined) inputsBound.add(entry.input);
        if (computed) computedValues.add(`${key}|${toKey(rv.to)}`);
        if (rv.to.location === 'path' || rv.to.location === 'query') {
          const map = rv.to.location === 'path' ? acc.pathParams : acc.queryParams;
          const existing = map.get(rv.to.path);
          if (existing) {
            existing.count += 1;
            existing.source = rank(source, existing.source);
          } else map.set(rv.to.path, { example: rv.value, count: 1, source });
        } else if (rv.to.location === 'header') {
          const existing = acc.headers.get(rv.to.path);
          if (existing) {
            existing.count += 1;
            existing.values.add(rv.value);
            existing.source = rank(source, existing.source);
          } else acc.headers.set(rv.to.path, { count: 1, values: new Set([rv.value]), source });
          const g = authHeaderCounts.get(rv.to.path);
          authHeaderCounts.set(rv.to.path, { count: (g?.count ?? 0) + 1, secretLike: (g?.secretLike ?? false) || looksLikeSecret(rv.value) });
        } else if (rv.to.location === 'cookie') {
          acc.cookieNames.add(rv.to.path);
          authCookieCounts.set(rv.to.path, (authCookieCounts.get(rv.to.path) ?? 0) + 1);
        }
        if (entry?.from) {
          const fromEndpoint = entry.from.location === 'storage' ? storageEndpoint : endpointOf.get(entry.from.exchangeId);
          if (fromEndpoint) {
            const bindingKey = `${fromEndpoint}|${entry.from.location}|${entry.from.path}|${toKey(rv.to)}`;
            const existing = acc.bindings.get(bindingKey);
            if (existing) existing.seen += 1;
            else acc.bindings.set(bindingKey, { from: { endpointId: fromEndpoint, location: entry.from.location, path: entry.from.path }, to: rv.to, seen: 1 });
          }
        }
      }

      const requestBody = decodeBody(ex.request.body, headerValue(ex.request.headers, 'content-type'));
      if (requestBody) acc.requests.push({ mediaType: requestBody.mediaType, hasJson: requestBody.json !== undefined, json: requestBody.json, text: requestBody.text ?? (requestBody.binaryBytes !== undefined ? `[binary ${requestBody.binaryBytes} bytes]` : undefined) });
      if (ex.response) {
        const status = String(ex.response.status);
        const slot = acc.responses.get(status) ?? { mediaType: mediaTypeOf(ex.response.mimeType) || 'application/octet-stream', examples: [] };
        const body = isPage ? undefined : decodeBody(ex.response.body, ex.response.mimeType);
        if (body) slot.examples.push({ mediaType: body.mediaType, hasJson: body.json !== undefined, json: body.json, text: body.text ?? (body.binaryBytes !== undefined ? `[binary ${body.binaryBytes} bytes]` : undefined) });
        acc.responses.set(status, slot);
      }

      const stepId = ex.stepId ?? null;
      const evidence: Evidence = {
        runId: trace.runId,
        ...(trace.workflowId ? { workflowId: trace.workflowId } : {}),
        stepId: stepId ?? (setup.has(ex.id) ? 'setup' : null),
        exchangeId: ex.id,
        at: ex.request.at,
      };
      acc.observedIn.push(evidence);
      if (evidence.stepId === 'setup' || evidence.stepId === null) outside.push(evidence);
      if (stepId) {
        const steps = acc.stepsByRun.get(trace.runId) ?? new Set<string>();
        steps.add(stepId);
        acc.stepsByRun.set(trace.runId, steps);
      }
      run.calls.push({ stepId, endpointId: acc.id, exchangeId: ex.id, status: ex.response?.status ?? null });
      endpointOf.set(ex.id, acc.id);
      earlier.push(ex);
    }
  }

  // Step 7: auth, from what is sent on most in-scope requests.
  const majority = (count: number): boolean => totalRequests > 0 && count * 2 > totalRequests;
  const authCookies = [...authCookieCounts].filter(([, n]) => majority(n)).map(([name]) => name).sort();
  const authHeaders = [...authHeaderCounts]
    .filter(([name, g]) => majority(g.count) && (isSensitiveName(name, policy) || g.secretLike))
    .map(([name]) => name)
    .sort();
  const loginWorkflow = workflows.find((w) => w.verification) ?? workflows.find((w) => (w.id as string) === 'login');

  // Steps 3 and 5: finalize endpoints.
  const traceById = new Map(runs.map((r) => [r.trace.runId as string, r.trace]));
  const endpoints: Endpoint[] = sortBy([...accs.values()], (a) => a.id).map((acc) => {
    const requiredOf = (count: number): boolean | 'unknown' => (count === acc.exchanges ? (acc.exchanges > 1 ? true : 'unknown') : false);
    const paramsOf = (map: Map<string, ParamAcc>, place: 'path' | 'query', required: (count: number) => boolean | 'unknown'): Param[] =>
      [...map].map(([name, p]) => ({
        name,
        example: redact(p.example, { in: place, name }, policy),
        required: required(p.count),
        source: p.source,
      }));
    const headers: HeaderUse[] = [...acc.headers].map(([name, h]) => {
      const first = [...h.values][0] ?? '';
      const redacted = isSensitiveName(name, policy) || looksLikeSecret(first);
      const valueKind: HeaderUse['valueKind'] = redacted ? 'redacted' : h.source !== 'literal' ? 'token' : h.values.size === 1 ? 'static' : 'token';
      return { name, required: requiredOf(h.count), valueKind };
    });
    const ambient = [...acc.stepsByRun].some(([runId, steps]) => {
      const total = traceById.get(runId)?.steps.length ?? 0;
      return steps.size >= ambientMinSteps && steps.size * 2 > total;
    });
    return {
      id: acc.id,
      kind: acc.allPage ? 'page' : 'api',
      method: acc.method,
      host: acc.host,
      pathTemplate: acc.pathTemplate,
      operation: acc.operation,
      pathParams: paramsOf(acc.pathParams, 'path', () => true),
      queryParams: paramsOf(acc.queryParams, 'query', requiredOf),
      headers,
      auth: {
        cookies: authCookies.filter((c) => acc.cookieNames.has(c)),
        headers: authHeaders.filter((h) => acc.headers.has(h)),
      },
      request: bodyDoc(acc.requests, undefined, policy),
      responses: Object.fromEntries([...acc.responses].map(([status, slot]) => [status, bodyDoc(slot.examples, slot.mediaType, policy) as BodyDoc])),
      bindings: [...acc.bindings.values()],
      ambient,
      cors: acc.cors || corsKeys.has(`${acc.method} ${acc.host}${acc.pathTemplate}`),
      observedIn: acc.observedIn,
    };
  });
  const ambientIds = new Set(endpoints.filter((e) => e.ambient).map((e) => e.id as string));

  // Steps 7 and 8: workflows and cases.
  const workflowDocs: WorkflowDoc[] = workflows.map((wf) => {
    const own = runs.filter((r) => r.trace.workflowId === wf.id);
    const ownUsed = own.filter((r) => r.used);
    const latest = own[own.length - 1];
    const latestUsed = ownUsed[ownUsed.length - 1];
    const stepSource = latestUsed ?? latest;
    const inputs = wf.inputs.map((spec) =>
      spec.example === undefined
        ? spec
        : { ...spec, example: spec.secret ? REDACTED : redact(spec.example, { in: 'body', path: `$.${spec.name}` }, policy) },
    );
    const steps = wf.steps.map((spec) => {
      const run = stepSource?.trace.steps.find((s) => s.id === spec.id);
      const calls = (latestUsed?.calls ?? [])
        .filter((c) => c.stepId === spec.id && !ambientIds.has(c.endpointId))
        .map((c) => ({ endpointId: c.endpointId, exchangeId: c.exchangeId, status: c.status }));
      return { id: spec.id, do: spec.do, expect: spec.expect, confirms: spec.confirms, outcome: run?.outcome ?? null, calls };
    });
    const caseInputs: Record<string, string> = {};
    for (const spec of wf.inputs) {
      if (spec.example === undefined) continue;
      caseInputs[spec.name] = spec.secret ? REDACTED : redact(spec.example, { in: 'body', path: `$.${spec.name}` }, policy);
    }
    const cases = ownUsed.map((r) => ({
      runId: r.trace.runId,
      inputs: { ...caseInputs },
      expect: wf.steps
        .map((spec) => ({
          stepId: spec.id,
          status: [...new Set(r.calls.filter((c) => c.stepId === spec.id && c.status !== null).map((c) => c.status as number))].sort((a, b) => a - b),
        }))
        .filter((e) => e.status.length > 0),
    }));
    return {
      id: wf.id,
      name: wf.name,
      goal: wf.goal,
      effect: wf.effect,
      ...(wf.inverse ? { inverse: wf.inverse } : {}),
      preconditions: wf.preconditions,
      inputs,
      latestRun: latest ? { runId: latest.trace.runId, outcome: latest.trace.outcome, at: latest.trace.finishedAt ?? latest.trace.startedAt } : null,
      cases,
      steps,
      sequence: steps.flatMap((s) => s.calls.map((c) => ({ stepId: s.id, endpointId: c.endpointId, exchangeId: c.exchangeId }))),
    };
  });

  // Step 8: coverage, counts only.
  const coverage: Coverage = {
    steps: workflowDocs.reduce((n, w) => n + w.steps.length, 0),
    stepsWithExchanges: workflowDocs.reduce((n, w) => n + w.steps.filter((s) => s.calls.length > 0).length, 0),
    endpoints: endpoints.length,
    endpointsWithExample: endpoints.filter((e) => (e.request?.example ?? null) !== null || Object.values(e.responses).some((r) => r.example !== null)).length,
    bindings: endpoints.reduce((n, e) => n + e.bindings.length, 0),
    inputsBound: inputsBound.size,
    computedValues: computedValues.size,
    bodiesEvicted: usedRuns.reduce((n, r) => n + r.trace.counts.bodies.evicted, 0),
    betweenSteps: usedRuns.reduce((n, r) => n + r.trace.counts.attribution.betweenSteps, 0),
  };

  const timeSource = usedRuns.length > 0 ? usedRuns : runs;
  const latestTime = timeSource.map((r) => r.trace.finishedAt ?? r.trace.startedAt).sort().pop() ?? new Date(0).toISOString();
  const hosts = [...new Set([target.host, ...runs.flatMap((r) => r.trace.scope.hosts)])].sort();

  const doc: ApiDoc = {
    docVersion: 1,
    site: { id: slugify(target.name) as SiteId, name: target.name, startUrl: target.startUrl, hosts },
    generatedAt: latestTime,
    source: {
      traces: runs.map((r) => ({ runId: r.trace.runId as RunId, path: r.path, complete: r.trace.complete, outcome: r.trace.outcome, usedForDerive: r.used })),
    },
    auth: {
      cookies: authCookies,
      headers: authHeaders,
      ...(loginWorkflow ? { loginWorkflowId: loginWorkflow.id as WorkflowId } : {}),
      ...(loginWorkflow?.verification ? { verification: loginWorkflow.verification } : {}),
    },
    workflows: workflowDocs,
    endpoints,
    outside,
    coverage,
  };
  return doc as Redacted<ApiDoc>;
}

/** Merge examples into one documented body. Examples and text pass through redact(); schemas hold no values. */
function bodyDoc(examples: readonly BodyExample[], fallbackMediaType: string | undefined, policy: RedactionPolicy): BodyDoc | null {
  if (examples.length === 0) return fallbackMediaType === undefined ? null : { mediaType: fallbackMediaType, schema: null, example: null, undecoded: null };
  const first = examples[0] as BodyExample;
  const jsons = examples.filter((e) => e.hasJson).map((e) => e.json);
  if (jsons.length > 0) {
    return {
      mediaType: examples.find((e) => e.hasJson)?.mediaType ?? first.mediaType,
      schema: shapeToJsonSchema(jsons),
      example: redact(collapseDynamicKeys(jsons[0]), { in: 'body', path: '$' }, policy),
      undecoded: null,
    };
  }
  const text = examples.find((e) => e.text !== undefined)?.text;
  return {
    mediaType: first.mediaType,
    schema: null,
    example: null,
    undecoded: text === undefined ? null : scrubText(text, policy),
  };
}

function scrubText(text: string, policy: RedactionPolicy): string {
  return redact(text, { in: 'body', path: '$' }, policy);
}
