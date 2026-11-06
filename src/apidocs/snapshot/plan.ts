// Pure core of the snapshot stage: plan validation, URL and page-key building, paginator state
// machines, a minimal JSON path evaluator, response classification, ordering and the dry-run text.
// No fs, no network, no clock: the caller passes `now`, the uuid source and the response facts.
import { createHash } from 'node:crypto';
import { CaptureError } from '../errors.js';
import { snapshotBackoffBaseMs, snapshotBackoffMaxMs, snapshotDataTablesLength, snapshotPerPage } from '../limits.js';
import { SnapshotPlanSchema, type EndpointPlan, type Paginator, type QueryValue, type RangeSpec, type HeaderRule, type SnapshotPlan, type WidgetRules } from './types.js';

const msPerSecond = 1_000;

export function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------------------------
// JSON path: `$`, `.key`, `[n]`, `[]` / `[*]` (flatten array items, or object values), `.*` (object values).

type Tok = { t: 'key'; k: string } | { t: 'all' } | { t: 'idx'; i: number };

function tokenize(path: string): Tok[] | undefined {
  if (!path.startsWith('$')) return undefined;
  const toks: Tok[] = [];
  let rest = path.slice(1);
  while (rest.length > 0) {
    const dot = /^\.(\*|[^.[\]]+)/.exec(rest);
    if (dot) {
      toks.push(dot[1] === '*' ? { t: 'all' } : { t: 'key', k: dot[1]! });
      rest = rest.slice(dot[0].length);
      continue;
    }
    const br = /^\[(\*|\d*)\]/.exec(rest);
    if (br) {
      toks.push(br[1] === '' || br[1] === '*' ? { t: 'all' } : { t: 'idx', i: Number(br[1]) });
      rest = rest.slice(br[0].length);
      continue;
    }
    return undefined;
  }
  return toks;
}

/** True when `path` is a path this evaluator can run. */
export function isJsonPath(path: string): boolean {
  return tokenize(path) !== undefined;
}

/** Every node `path` selects in `body`. An unparseable path or a missing key selects nothing. */
export function jsonPath(body: unknown, path: string): unknown[] {
  const toks = tokenize(path);
  if (!toks) return [];
  let nodes: unknown[] = [body];
  for (const tok of toks) {
    const next: unknown[] = [];
    for (const n of nodes) {
      if (n === null || typeof n !== 'object') continue;
      if (tok.t === 'key') {
        if (!Array.isArray(n) && Object.hasOwn(n, tok.k)) {
          const v = (n as Record<string, unknown>)[tok.k];
          if (v !== undefined) next.push(v);
        }
      } else if (tok.t === 'all') {
        next.push(...(Array.isArray(n) ? n : Object.values(n)));
      } else if (Array.isArray(n) && n[tok.i] !== undefined) {
        next.push(n[tok.i]);
      }
    }
    nodes = next;
  }
  return nodes;
}

/** Ids a path yields, as strings, deduplicated, in first-seen order. Arrays reached are flattened one level. */
export function extractIds(body: unknown, path: string): string[] {
  const out = new Set<string>();
  const take = (v: unknown) => {
    if (typeof v === 'string' && v !== '') out.add(v);
    else if (typeof v === 'number' && Number.isFinite(v)) out.add(String(v));
  };
  for (const n of jsonPath(body, path)) {
    if (Array.isArray(n)) n.forEach(take);
    else take(n);
  }
  return [...out];
}

/** The records of a response. No path: the whole body is one record. A path to an array: that array. */
export function rowsOf(body: unknown, recordsPath?: string): unknown[] {
  if (recordsPath === undefined) return [body];
  const nodes = jsonPath(body, recordsPath);
  if (nodes.length === 1 && Array.isArray(nodes[0])) return nodes[0];
  return nodes.filter((n) => n !== null && n !== undefined);
}

/** The total the response states about itself, when the path finds a number. */
export function statedTotal(body: unknown, totalPath?: string): number | undefined {
  if (!totalPath) return undefined;
  const v = jsonPath(body, totalPath)[0];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

// ---------------------------------------------------------------------------------------------
// Month windows and range formatting.

export interface MonthRange {
  key: string; // YYYY-MM
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

/** `months` calendar months ending with the current (partial) month, oldest first, UTC. */
export function monthRanges(now: Date, months: number): MonthRange[] {
  const out: MonthRange[] = [];
  const y0 = now.getUTCFullYear();
  const m0 = now.getUTCMonth();
  for (let back = months - 1; back >= 0; back--) {
    const idx = y0 * 12 + m0 - back;
    const y = Math.floor(idx / 12);
    const m = idx - y * 12;
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const current = back === 0;
    out.push({ key: `${y}-${pad2(m + 1)}`, start: ymd(y, m, 1), end: current ? ymd(y, m, now.getUTCDate()) : ymd(y, m, lastDay) });
  }
  return out;
}

/** One value of a window in the endpoint's range format. `daterange-pipe` is always "start|end". */
export function rangeValue(range: Pick<RangeSpec, 'format'>, r: MonthRange, which: 'start' | 'end' | 'pipe'): string {
  if (range.format === 'daterange-pipe') return `${r.start}|${r.end}`;
  const fmt = (d: string, edge: 'start' | 'end') => (range.format === 'iso-datetime' ? `${d}T${edge === 'start' ? '00:00:00' : '23:59:59'}` : d);
  if (which === 'start') return fmt(r.start, 'start');
  if (which === 'end') return fmt(r.end, 'end');
  return `${fmt(r.start, 'start')}|${fmt(r.end, 'end')}`;
}

// ---------------------------------------------------------------------------------------------
// Page state machines.

export type PageState = { page?: number; cursor?: string | null; start?: number };

export function firstPage(p: Paginator): PageState {
  switch (p.kind) {
    case 'none':
      return {};
    case 'laravel-meta':
    case 'laravel-flat':
      return { page: 1 };
    case 'cursor':
      return { cursor: null };
    case 'datatables':
      return { start: 0 };
  }
}

/** The state of the page after this one, or null when this was the last. `recordsSeen` is the records on this page. */
export function nextPage(p: Paginator, body: unknown, state: PageState, recordsSeen: number): PageState | null {
  switch (p.kind) {
    case 'none':
      return null;
    case 'laravel-meta':
    case 'laravel-flat': {
      if (recordsSeen === 0) return null;
      const cur = state.page ?? 1;
      // A link to the next page that is present and null says this was the last page, whatever last_page says.
      const next = jsonPath(body, p.kind === 'laravel-meta' ? '$.links.next' : '$.next_page_url');
      if (next.length === 1 && next[0] === null) return null;
      const last = statedTotal(body, p.kind === 'laravel-meta' ? '$.meta.last_page' : '$.last_page');
      if (last !== undefined && cur >= last) return null;
      return { page: cur + 1 };
    }
    case 'cursor': {
      const raw = jsonPath(body, p.nextPath)[0];
      if (raw === null || raw === undefined || raw === '') return null;
      const next = String(raw);
      if (next === state.cursor) return null;
      return { cursor: next };
    }
    case 'datatables': {
      if (recordsSeen === 0) return null;
      const length = p.length ?? snapshotDataTablesLength;
      const start = state.start ?? 0;
      const total = statedTotal(body, p.totalPath);
      if (total !== undefined && start + length >= total) return null;
      if (total === undefined && recordsSeen < length) return null;
      return { start: start + length };
    }
  }
}

/**
 * What a page starts with, for telling "the server ignored the page parameter" from a real next page: the id of the
 * first record when it has a scalar `id`, otherwise a hash of the record. Undefined for an empty page.
 */
export function pageFingerprint(records: readonly unknown[]): string | undefined {
  if (records.length === 0) return undefined;
  const first = records[0];
  if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
    const id = (first as Record<string, unknown>).id;
    if (typeof id === 'string' || typeof id === 'number') return `id:${id}`;
  }
  return `sha:${sha256Hex(JSON.stringify(first))}`;
}

// ---------------------------------------------------------------------------------------------
// URLs and page keys.

export interface UrlCtx {
  ids: Record<string, string>;
  range?: MonthRange;
  page?: PageState;
  /** Source of a fresh uuid for `{ computed: 'uuid' }` query values. */
  uuid?: () => string;
  /** Extra query pairs applied after the endpoint's own (widget parameters). */
  extraQuery?: Record<string, string>;
  /** Resolved `plan.values` for `{ fromValue }` query entries. Account data: only the request URL may hold them. */
  values?: Record<string, string>;
}

const placeholder = /\{([A-Za-z0-9_]+)\}/g;

function bad(message: string): never {
  throw new CaptureError('plan-invalid', message);
}

/** Id names an endpoint's URL depends on, sorted. */
function idNamesOf(ep: EndpointPlan): string[] {
  const names = new Set<string>();
  const covered = new Set(Object.keys(ep.pathParams ?? {}));
  for (const v of Object.values(ep.pathParams ?? {})) names.add(v.fromId);
  for (const v of Object.values(ep.query ?? {})) if (typeof v === 'object' && 'fromId' in v) names.add(v.fromId);
  for (const m of ep.path.matchAll(placeholder)) if (!covered.has(m[1]!)) names.add(m[1]!);
  return [...names].sort();
}

/** Names of the `plan.values` an endpoint's query uses, sorted. */
export function valueNamesOf(ep: EndpointPlan): string[] {
  const names = new Set<string>();
  for (const v of Object.values(ep.query ?? {})) if (typeof v === 'object' && 'fromValue' in v) names.add(v.fromValue);
  return [...names].sort();
}

function resolvePathParam(ep: EndpointPlan, param: string, ids: Record<string, string>): string {
  const idName = ep.pathParams?.[param]?.fromId ?? param;
  const v = ids[idName];
  if (v === undefined || v === '') bad(`endpoint "${ep.id}" needs id "${idName}" for {${param}}`);
  return v;
}

function queryValue(ep: EndpointPlan, key: string, v: QueryValue, ctx: UrlCtx): string {
  if (typeof v !== 'object') return String(v);
  if ('fromId' in v) {
    const id = ctx.ids[v.fromId];
    if (id === undefined) bad(`endpoint "${ep.id}" query "${key}" needs id "${v.fromId}"`);
    return id;
  }
  if ('fromRange' in v) {
    if (!ctx.range) bad(`endpoint "${ep.id}" query "${key}" needs a range window`);
    return rangeValue({ format: ep.range?.format ?? 'iso-date' }, ctx.range, v.fromRange);
  }
  if ('fromValue' in v) {
    const value = ctx.values?.[v.fromValue];
    if (value === undefined) bad(`endpoint "${ep.id}" query "${key}" needs value "${v.fromValue}"`);
    return value;
  }
  if (!ctx.uuid) bad(`endpoint "${ep.id}" query "${key}" needs a uuid source`);
  return ctx.uuid();
}

export function buildUrl(plan: SnapshotPlan, ep: EndpointPlan, ctx: UrlCtx): string {
  const origin = plan.origins[ep.origin];
  if (!origin) bad(`endpoint "${ep.id}" uses unknown origin "${ep.origin}"`);
  const path = ep.path.replace(placeholder, (_m, name: string) => encodeURIComponent(resolvePathParam(ep, name, ctx.ids)));
  const q = new Map<string, string>();
  for (const [k, v] of Object.entries(ep.query ?? {})) q.set(k, queryValue(ep, k, v, ctx));
  if (ep.range && ctx.range) {
    const fmt = { format: ep.range.format };
    if (ep.range.param) q.set(ep.range.param, rangeValue(fmt, ctx.range, 'pipe'));
    if (ep.range.startParam) q.set(ep.range.startParam, rangeValue(fmt, ctx.range, 'start'));
    if (ep.range.endParam) q.set(ep.range.endParam, rangeValue(fmt, ctx.range, 'end'));
  }
  for (const [k, v] of Object.entries(ctx.extraQuery ?? {})) q.set(k, v);
  const pg = ep.paginator;
  const state = ctx.page ?? firstPage(pg);
  switch (pg.kind) {
    case 'none':
      break;
    case 'laravel-meta':
    case 'laravel-flat':
      q.set(pg.pageParam, String(state.page ?? 1));
      if (pg.perPageParam) q.set(pg.perPageParam, String(pg.perPage ?? snapshotPerPage));
      break;
    case 'cursor':
      if (state.cursor) q.set(pg.cursorParam, state.cursor);
      if (pg.perPageParam) q.set(pg.perPageParam, String(pg.perPage ?? snapshotPerPage));
      break;
    case 'datatables':
      q.set(pg.pageParam, `${state.start ?? 0},${pg.length ?? snapshotDataTablesLength}`);
      break;
  }
  const qs = [...q].map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return `${origin.replace(/\/+$/, '')}${path}${qs ? `?${qs}` : ''}`;
}

/** Deterministic key of one request: distinct across ids, range window and page; never holds the computed uuid. */
export function pageKeyFor(ep: EndpointPlan, ctx: Pick<UrlCtx, 'ids' | 'range' | 'page'>): string {
  const parts: string[] = [];
  const names = idNamesOf(ep);
  for (const n of names) parts.push(`${names.length === 1 ? 'id' : n}=${encodeURIComponent(ctx.ids[n] ?? '')}`);
  if (ctx.range) parts.push(`r=${ctx.range.key}`);
  const pg = ep.paginator;
  const state = ctx.page ?? firstPage(pg);
  switch (pg.kind) {
    case 'none':
      break;
    case 'laravel-meta':
    case 'laravel-flat':
      parts.push(`p=${state.page ?? 1}`);
      break;
    case 'cursor':
      parts.push(`c=${encodeURIComponent(state.cursor ?? '')}`);
      break;
    case 'datatables':
      parts.push(`s=${state.start ?? 0},${pg.length ?? snapshotDataTablesLength}`);
      break;
  }
  return parts.length > 0 ? parts.join('&') : 'all';
}

// ---------------------------------------------------------------------------------------------
// Responses and retries.

export type ResponseClass = 'ok' | 'retry' | 'skip' | 'not-found' | 'session-dead';

/**
 * 401/403, a final URL off the API origin or on a login path, or a 2xx HTML page = session dead.
 * 429, 5xx and 0 (network error, timeout) = retry. 404 = not found. 2xx JSON (or 204) = ok. Anything else = skip.
 */
export function classifyResponse(r: { status: number; url: string; contentType: string }, apiOrigin: string, loginPaths: RegExp[]): ResponseClass {
  if (r.status === 401 || r.status === 403) return 'session-dead';
  try {
    const finalUrl = new URL(r.url, apiOrigin);
    if (finalUrl.origin !== new URL(apiOrigin).origin) return 'session-dead';
    if (loginPaths.some((re) => re.test(finalUrl.pathname))) return 'session-dead';
  } catch {
    // An unparseable URL says nothing about the session; the status decides.
  }
  if (r.status === 0 || r.status === 429 || r.status >= 500) return 'retry';
  if (r.status === 404) return 'not-found';
  if (r.status >= 200 && r.status < 300) {
    if (r.status === 204) return 'ok';
    const type = r.contentType.toLowerCase();
    if (type.includes('html')) return 'session-dead';
    return type.includes('json') ? 'ok' : 'skip';
  }
  return 'skip';
}

/**
 * Wait before retry number `attempt` (1 = after the first failure): base doubling, capped at the max.
 * A `Retry-After` in seconds or as an HTTP date (with `nowMs`) is honoured even above the cap.
 */
export function backoffMs(attempt: number, retryAfterHeader?: string, nowMs?: number): number {
  const exp = Math.min(snapshotBackoffBaseMs * 2 ** Math.max(0, attempt - 1), snapshotBackoffMaxMs);
  const header = retryAfterHeader?.trim();
  if (!header) return exp;
  let ra = Number.NaN;
  if (/^\d+(\.\d+)?$/.test(header)) ra = Number(header) * msPerSecond;
  else if (nowMs !== undefined) ra = Date.parse(header) - nowMs;
  return Number.isFinite(ra) && ra > 0 ? Math.max(exp, ra) : exp;
}

// ---------------------------------------------------------------------------------------------
// Ordering and selection.

/** The header and value rules an endpoint needs resolved before it can run. */
function rulesOf(plan: SnapshotPlan, ep: EndpointPlan): HeaderRule[] {
  const out: HeaderRule[] = [];
  for (const h of ep.headers ?? []) {
    const rule = plan.headers[h];
    if (rule) out.push(rule);
  }
  for (const v of valueNamesOf(ep)) {
    const rule = plan.values?.[v];
    if (rule) out.push(rule);
  }
  return out;
}

function dependenciesOf(plan: SnapshotPlan, ep: EndpointPlan): string[] {
  const deps = new Set<string>(ep.dependsOn ?? []);
  for (const name of idNamesOf(ep)) {
    const src = plan.ids[name]?.endpoint;
    if (src) deps.add(src);
  }
  for (const rule of rulesOf(plan, ep)) if ('fromResponse' in rule) deps.add(rule.fromResponse.endpoint);
  return [...deps];
}

/** Topological order, parents (id and header sources) before children, otherwise plan order. Cycles throw `plan-invalid`. */
export function orderEndpoints(plan: SnapshotPlan): EndpointPlan[] {
  const byId = new Map(plan.endpoints.map((e) => [e.id, e] as const));
  const deps = new Map(plan.endpoints.map((e) => [e.id, dependenciesOf(plan, e).filter((d) => byId.has(d))] as const));
  const done = new Set<string>();
  const out: EndpointPlan[] = [];
  let remaining = plan.endpoints.slice();
  while (remaining.length > 0) {
    const ready = remaining.filter((e) => (deps.get(e.id) ?? []).every((d) => done.has(d)));
    if (ready.length === 0) bad(`endpoint dependency cycle among: ${remaining.map((e) => e.id).join(', ')}`);
    for (const e of ready) {
      out.push(e);
      done.add(e.id);
    }
    remaining = remaining.filter((e) => !done.has(e.id));
  }
  return out;
}

export interface SelectOpts {
  only?: string[];
  groups?: string[];
  perId: 'core' | 'full';
}

/** The endpoints to run, in dependency order. `perId: 'core'` drops `full`-only per-id endpoints; `full` keeps both. */
export function selectEndpoints(plan: SnapshotPlan, opts: SelectOpts): EndpointPlan[] {
  return orderEndpoints(plan).filter((e) => {
    if (opts.only && opts.only.length > 0 && !opts.only.includes(e.id)) return false;
    if (opts.groups && opts.groups.length > 0 && !opts.groups.includes(e.group)) return false;
    if (e.perId === 'full' && opts.perId !== 'full') return false;
    return true;
  });
}

/** Id names an endpoint's URL needs, sorted (path placeholders, `pathParams` and `fromId` query values). */
export function endpointIdNames(ep: EndpointPlan): string[] {
  return idNamesOf(ep);
}

export interface RunPlanOpts extends SelectOpts {
  /** Id names the caller supplies, so their source endpoints are not needed. */
  idsFrom?: Record<string, unknown>;
}

export interface RunPlan {
  /** The endpoints asked for, in dependency order (including `skip` ones, which are listed and never fetched). */
  selected: EndpointPlan[];
  /** Endpoints that are not selected but whose ids or response a selected endpoint needs: fetched, never written. */
  silent: { endpoint: EndpointPlan; mode: 'ids' | 'first' }[];
  /** Endpoints that return a dashboard, from which `widgetRules` derive the widget requests. */
  dashboards: string[];
  /** Origin names that need a tab: endpoints run, silent parents, and the origins header rules read from. */
  origins: string[];
}

/**
 * What a run will touch. `only`/`groups` that match nothing throw `plan-invalid`. A selected child whose ids come
 * from an unselected parent pulls that parent in as `silent` mode `ids` (every page, ids recorded, rows not written);
 * a `fromResponse` header source that is not selected is `silent` mode `first` (first page, body kept in memory).
 * `skip` endpoints are never pulled in.
 */
export function planRun(plan: SnapshotPlan, opts: RunPlanOpts): RunPlan {
  const known = new Set(plan.endpoints.map((e) => e.id));
  for (const id of opts.only ?? []) if (!known.has(id)) bad(`--only "${id}" is not an endpoint of the plan`);
  const groups = new Set(plan.endpoints.map((e) => e.group));
  for (const g of opts.groups ?? []) if (!groups.has(g)) bad(`--group "${g}" is not a group of the plan (${[...groups].join(', ')})`);
  const selected = selectEndpoints(plan, opts);
  if (selected.length === 0) bad('no endpoint matches --only / --group / --per-id');

  const byId = new Map(plan.endpoints.map((e) => [e.id, e] as const));
  const active = new Set(selected.filter((e) => !e.skip).map((e) => e.id));
  const widgetIds = widgetEndpointIds(plan.widgetRules);
  const need = new Map<string, 'ids' | 'first'>();
  const queue: EndpointPlan[] = selected.filter((e) => !e.skip);

  const want = (id: string, mode: 'ids' | 'first') => {
    const ep = byId.get(id);
    if (!ep || ep.skip) return;
    const prior = need.get(id);
    if (prior === 'ids' || prior === mode) return;
    need.set(id, mode === 'ids' ? 'ids' : (prior ?? mode));
    if (prior === undefined && !active.has(id)) queue.push(ep);
  };
  const needsOf = (ep: EndpointPlan) => {
    for (const name of idNamesOf(ep)) {
      if (opts.idsFrom && name in opts.idsFrom) continue;
      const src = plan.ids[name]?.endpoint;
      if (src && src !== ep.id) want(src, 'ids');
    }
    for (const rule of rulesOf(plan, ep)) if ('fromResponse' in rule) want(rule.fromResponse.endpoint, 'first');
  };

  const dashboards: string[] = [];
  const rules = plan.widgetRules;
  if (rules && selected.some((e) => widgetIds.has(e.id) && !e.skip)) {
    for (const e of plan.endpoints) if (!widgetIds.has(e.id) && !e.skip && idNamesOf(e).includes(rules.dashIdsFrom)) dashboards.push(e.id);
    for (const id of dashboards) want(id, 'ids');
    if (!(opts.idsFrom && rules.dashIdsFrom in opts.idsFrom)) {
      const src = plan.ids[rules.dashIdsFrom]?.endpoint;
      if (src) want(src, 'ids');
    }
  }
  for (let i = 0; i < queue.length; i++) needsOf(queue[i]!);

  const order = orderEndpoints(plan);
  const silent = order.filter((e) => !active.has(e.id) && need.has(e.id)).map((endpoint) => ({ endpoint, mode: need.get(endpoint.id)! }));
  const origins = new Set<string>();
  const addRule = (rule: HeaderRule) => {
    if ('fromCookie' in rule) origins.add(rule.origin);
    if ('fromPageResponse' in rule) origins.add(rule.fromPageResponse.origin);
    if ('fromStorage' in rule) origins.add(rule.fromStorage.origin);
  };
  for (const ep of [...selected.filter((e) => !e.skip), ...silent.map((s) => s.endpoint)]) {
    origins.add(ep.origin);
    for (const rule of rulesOf(plan, ep)) addRule(rule);
  }
  return { selected, silent, dashboards, origins: [...origins] };
}

// ---------------------------------------------------------------------------------------------
// Validation.

/**
 * Parse a plan and run the cross-checks. With `doc`, every `docId` must be an endpoint of the api doc and a GET.
 * Throws `plan-invalid` listing every problem.
 */
export function validatePlan(json: unknown, doc?: { endpoints: { id: string; method: string }[] }): SnapshotPlan {
  const parsed = SnapshotPlanSchema.safeParse(json);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `${i.path.length > 0 ? `${i.path.join('.')}: ` : ''}${i.message}`);
    throw new CaptureError('plan-invalid', `snapshot plan is invalid:\n- ${lines.join('\n- ')}`, 'fix snapshots/<site>.json');
  }
  const plan = parsed.data;
  const problems: string[] = [];
  const checkPath = (where: string, p: string | undefined) => {
    if (p !== undefined && !isJsonPath(p)) problems.push(`${where}: unsupported JSON path "${p}"`);
  };
  for (const [name, src] of Object.entries(plan.ids)) checkPath(`ids.${name}.path`, src.path);
  for (const ep of plan.endpoints) {
    checkPath(`${ep.id}.records`, ep.records);
    checkPath(`${ep.id}.total`, ep.total);
    for (const [k, p] of Object.entries(ep.yields ?? {})) checkPath(`${ep.id}.yields.${k}`, p);
    const pg = ep.paginator;
    if (pg.kind === 'cursor') checkPath(`${ep.id}.paginator.nextPath`, pg.nextPath);
    if (pg.kind === 'datatables') {
      checkPath(`${ep.id}.paginator.totalPath`, pg.totalPath);
      checkPath(`${ep.id}.paginator.recordsPath`, pg.recordsPath);
    }
  }
  for (const [param, src] of Object.entries(plan.widgetRules?.queryFromWidget ?? {})) checkPath(`widgetRules.queryFromWidget.${param}.path`, src.path);
  checkPath('widgetRules.serviceIdPath', plan.widgetRules?.serviceIdPath);
  checkPath('widgetRules.categoryIdPath', plan.widgetRules?.categoryIdPath);
  for (const re of plan.loginPaths) {
    try {
      new RegExp(re);
    } catch {
      problems.push(`loginPaths: "${re}" is not a regular expression`);
    }
  }
  if (doc) {
    const docById = new Map(doc.endpoints.map((e) => [e.id, e] as const));
    for (const ep of plan.endpoints) {
      if (!ep.docId) continue;
      const d = docById.get(ep.docId);
      if (!d) problems.push(`${ep.id}: docId "${ep.docId}" is not in the api doc`);
      else if (d.method.toUpperCase() !== 'GET') problems.push(`${ep.id}: docId "${ep.docId}" is a ${d.method}, the snapshot only sends GET`);
    }
  }
  try {
    orderEndpoints(plan);
  } catch (e) {
    problems.push(e instanceof Error ? e.message : String(e));
  }
  if (problems.length > 0) throw new CaptureError('plan-invalid', `snapshot plan is invalid:\n- ${problems.join('\n- ')}`, 'fix snapshots/<site>.json');
  return plan;
}

// ---------------------------------------------------------------------------------------------
// Widgets (data-driven dashboards).

/** Endpoint ids the widget rules route to. */
export function widgetEndpointIds(rules: WidgetRules | undefined): Set<string> {
  return new Set(Object.values(rules?.endpointTemplate ?? {}).filter((id): id is string => id !== undefined));
}

export interface WidgetRequest {
  /** Plan endpoint to run: `endpointTemplate.widget`, or the optional service / category route the definition selects. */
  endpointId: string;
  kind: 'widget' | 'service' | 'category';
  widgetId: string;
  /** Merge into the `ids` of `buildUrl`: `dashId`, `widgetId`, and `serviceId` / `categoryId` on those routes. */
  ids: Record<string, string>;
  /** Merge into `extraQuery` of `buildUrl`: literals, values read from the definition, then the widget id and dashboard id params. */
  query: Record<string, string>;
  /** The window these parameters apply to; the endpoint's `range` turns it into query pairs. */
  range: MonthRange;
}

const scalar = (v: unknown): string | undefined => (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : undefined);

/** The scalars a definition-relative path selects, arrays flattened one level, empty strings dropped, in document order. */
function scalarsAt(def: unknown, path: string): string[] {
  const out: string[] = [];
  for (const node of jsonPath(def, path)) {
    for (const v of Array.isArray(node) ? node : [node]) {
      const s = scalar(v);
      if (s !== undefined && s !== '') out.push(s);
    }
  }
  return out;
}

/**
 * Requests for the widgets of one dashboard. Where things sit in the dashboard body is fixed (documented in
 * docs/design/snapshot.md): widget ids at `$.data.page.widget_ids[]`, each definition at
 * `$.data.page.layouts.<layout>.widgets.<id>`. Everything else comes from `rules`:
 *   - every widget goes to `endpointTemplate.widget`, unless `serviceIdPath` / `categoryIdPath` is set, the matching
 *     template endpoint exists and the path finds a value in the definition (then the `service` / `category` route, with
 *     `serviceId` / `categoryId` in `ids`);
 *   - query = `literals`, then each `queryFromWidget` entry whose path finds a value (arrays joined with `join`, else the
 *     first scalar), then `widgetIdParam` = the widget id and `pageIdParam` = the dashboard id.
 * A dashboard without that shape yields no requests; a widget id with no definition still gets a request (literals and ids only).
 */
export function widgetRequests(dash: unknown, dashId: string, rules: WidgetRules, range: MonthRange): WidgetRequest[] {
  const widgetIds = extractIds(dash, '$.data.page.widget_ids');
  const layouts = jsonPath(dash, '$.data.page.layouts.*');
  const out: WidgetRequest[] = [];
  for (const widgetId of widgetIds) {
    let def: unknown = {};
    for (const layout of layouts) {
      const found = jsonPath(layout, `$.widgets.${widgetId}`)[0];
      if (found !== null && typeof found === 'object' && !Array.isArray(found)) {
        def = found;
        break;
      }
    }
    const serviceId = rules.endpointTemplate.service && rules.serviceIdPath ? scalarsAt(def, rules.serviceIdPath)[0] : undefined;
    const categoryId = !serviceId && rules.endpointTemplate.category && rules.categoryIdPath ? scalarsAt(def, rules.categoryIdPath)[0] : undefined;
    const kind: WidgetRequest['kind'] = serviceId ? 'service' : categoryId ? 'category' : 'widget';
    const ids: Record<string, string> = { dashId, widgetId };
    if (serviceId) ids.serviceId = serviceId;
    if (categoryId) ids.categoryId = categoryId;
    const query: Record<string, string> = { ...rules.literals };
    for (const [param, src] of Object.entries(rules.queryFromWidget ?? {})) {
      const values = scalarsAt(def, src.path);
      if (values.length === 0) continue;
      query[param] = src.join !== undefined ? values.join(src.join) : values[0]!;
    }
    query[rules.widgetIdParam] = widgetId;
    query[rules.pageIdParam] = dashId;
    const endpointId = kind === 'service' ? rules.endpointTemplate.service! : kind === 'category' ? rules.endpointTemplate.category! : rules.endpointTemplate.widget;
    out.push({ endpointId, kind, widgetId, ids, query, range });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Dry-run text.

export interface DescribeOpts {
  perId: 'core' | 'full';
  months: number;
  knownCounts?: Record<string, number>;
}

function describePaginator(p: Paginator): string {
  switch (p.kind) {
    case 'none':
      return 'single response';
    case 'laravel-meta':
    case 'laravel-flat':
      return `${p.kind} (${p.pageParam}${p.perPageParam ? `, ${p.perPageParam}=${p.perPage ?? snapshotPerPage}` : ''})`;
    case 'cursor':
      return `cursor (${p.cursorParam} from ${p.nextPath})`;
    case 'datatables':
      return `datatables (${p.pageParam}, length ${p.length ?? snapshotDataTablesLength})`;
  }
}

/** Dry-run text: per group, each selected endpoint with method, path, paginator, notes and an estimated request count. */
export function describePlan(plan: SnapshotPlan, selected: EndpointPlan[], opts: DescribeOpts): string {
  const lines: string[] = [`snapshot plan ${plan.site}: ${selected.length} endpoints, per-id ${opts.perId}, ${opts.months} months`];
  const groups = [...new Set(selected.map((e) => e.group))];
  let total = 0;
  let exact = true;
  for (const g of groups) {
    lines.push('', `[${g}]`);
    for (const ep of selected.filter((e) => e.group === g)) {
      const notes: string[] = [];
      if (ep.skip) notes.push(`skip: ${ep.skip}`);
      if (ep.expect404) notes.push('404 expected');
      if (ep.perId) notes.push(`per-id ${ep.perId}`);
      const factors: string[] = [];
      let count = 1;
      if (ep.range) {
        const months = ep.range.months ?? opts.months;
        factors.push(`${months} months`);
        count *= months;
      }
      const per = ep.perId ? idNamesOf(ep)[0] : undefined;
      if (per) {
        const known = opts.knownCounts?.[per];
        if (known === undefined) {
          factors.push(`N ${per}`);
          exact = false;
        } else {
          factors.push(`${known} ${per}`);
          count *= known;
        }
      }
      if (!ep.skip) total += count;
      const est = ep.skip ? 'not fetched' : `~${count} request${count === 1 ? '' : 's'}${factors.length > 0 ? ` (${factors.join(' x ')})` : ''}${ep.paginator.kind === 'none' ? '' : ' per page set'}`;
      lines.push(`  ${ep.id}  ${ep.method} ${ep.path}  ${describePaginator(ep.paginator)}${notes.length > 0 ? `  [${notes.join('; ')}]` : ''}  ${est}`);
    }
  }
  lines.push('', `estimated requests (first page of each series${exact ? '' : ', unknown id counts excluded'}): ${total}`);
  return lines.join('\n');
}
