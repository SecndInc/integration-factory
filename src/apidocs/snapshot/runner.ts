// The snapshot run: walk the plan's GET endpoints through a Fetcher, write every response to the SnapshotStore, and
// end with the number that says whether the copy is complete. Design and the seven answers: docs/design/snapshot.md.
//
// Rules this file keeps:
//   - GET only; the method is not a parameter anywhere (the Fetcher has none).
//   - Liveness is asked: a probe per origin at start, every snapshotProbeEveryRequests, after any session-looking
//     answer (401/403, redirect off the API origin or to a login path, HTML) and at the end. A dead probe aborts.
//   - A page is acked only after its rows are fsynced (store.appendRows, then store.ack). Resume skips acked pages.
//   - Retry 429/5xx/network/timeout with backoff, then write a failure row and move on; consecutive failures abort.
//   - Values (ids, header values, `plan.values`) never reach the log; log lines carry endpoint ids and counts. A
//     `plan.values` entry is written nowhere except inside the request URL a row records.
//   - Probes carry the literal and cookie headers the origin's endpoints use (never a header that needs a later response).
//
// `--only` / `--group` choice for a child whose ids come from an unselected parent: the parent is fetched anyway as a
// "silent" prerequisite (see planRun): its ids are recorded in progress.json, its rows are not written, and it is not
// part of the manifest. A `fromResponse` header source that is not selected is fetched once, first page only, the same way.

import { randomUUID } from 'node:crypto';
import { CaptureError, type CaptureErrorCode } from '../errors.js';
import {
  snapshotConcurrency,
  snapshotConsecutiveFailuresMax,
  snapshotIdsMax,
  snapshotMinDelayMs,
  snapshotPagesMax,
  snapshotProbeEveryRequests,
  snapshotRequestsMax,
  snapshotRetryMax,
} from '../limits.js';
import type { FetchResult, Fetcher } from './fetcher.js';
import {
  backoffMs,
  buildUrl,
  classifyResponse,
  endpointIdNames,
  extractIds,
  firstPage,
  jsonPath,
  monthRanges,
  nextPage,
  orderEndpoints,
  pageKeyFor,
  planRun,
  rowsOf,
  sha256Hex,
  statedTotal,
  valueNamesOf,
  widgetEndpointIds,
  widgetRequests,
  pageFingerprint,
  type MonthRange,
  type PageState,
  type ResponseClass,
  type RunPlan,
} from './plan.js';
import type { SnapshotStore } from './store.js';
import type { EndpointPlan, EndpointState, FailureRow, HeaderRule, Manifest, SnapshotPlan, SnapshotRow } from './types.js';

export interface SnapshotRunOpts {
  plan: SnapshotPlan;
  site: string;
  runId: string;
  fetcher: Fetcher;
  store: SnapshotStore;
  only?: string[];
  groups?: string[];
  perId: 'core' | 'full';
  maxIds?: number;
  /** Id values supplied by the caller (`--ids-from`); their source endpoints are not fetched for them. */
  idsFrom?: Record<string, string[]>;
  months: number;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
  log: (line: string) => void;
  resume?: boolean;
}

export interface SnapshotSummary {
  runId: string;
  site: string;
  status: Manifest['status'];
  reason?: string;
  counts: Manifest['counts'];
  endpoints: Manifest['endpoints'];
  /** The final log line, also passed to `log`. */
  line: string;
  dir: string;
}

class RunAborted extends Error {
  constructor(
    readonly code: CaptureErrorCode,
    readonly reason: string,
    message: string,
    readonly fix?: string,
  ) {
    super(message);
  }
}

/** A header the plan cannot resolve: a plan or sign-in problem, reported per dependent endpoint. */
class HeaderError extends Error {}

const doneStates: readonly EndpointState[] = ['complete', 'expected-404'];
const assumeFullPage = Number.MAX_SAFE_INTEGER;

/** At most `concurrency` requests in flight on one tab and `minDelayMs` between starts. */
class Gate {
  private inflight = 0;
  private nextStart = 0;
  private readonly waiters: (() => void)[] = [];
  constructor(
    private readonly now: () => Date,
    private readonly sleep: (ms: number) => Promise<void>,
  ) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.inflight >= snapshotConcurrency) await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.inflight += 1;
    try {
      const t = this.now().getTime();
      const start = Math.max(t, this.nextStart);
      this.nextStart = start + snapshotMinDelayMs;
      if (start > t) await this.sleep(start - t);
      return await fn();
    } finally {
      this.inflight -= 1;
      this.waiters.shift()?.();
    }
  }
}

interface Agg {
  ok: number;
  fail: number;
  expected404: number;
  incomplete: boolean;
  total?: number;
}

interface SeriesOpts {
  ep: EndpointPlan;
  ids: Record<string, string>;
  range?: MonthRange;
  headers: Record<string, string>;
  /** Resolved `plan.values` the endpoint's query names. */
  values?: Record<string, string>;
  /** Fetch for ids / bodies only: nothing is written or acked, failures only reach the log. */
  silent: boolean;
  firstOnly?: boolean;
  /** Fetch acked pages again (their rows are already on disk) so their bodies are available. */
  replayAcked?: boolean;
  extraQuery?: Record<string, string>;
  keyPrefix?: string;
  fanOut: boolean;
  onFirstBody?: (body: unknown) => void;
  stopWhen?: () => boolean;
}

interface Resolved {
  headers: Record<string, string>;
  values: Record<string, string>;
}

type Outcome = { r: FetchResult; cls: ResponseClass | 'too-large' };

class Run {
  private readonly plan: SnapshotPlan;
  private readonly store: SnapshotStore;
  private readonly fetcher: Fetcher;
  private readonly rp: RunPlan;
  private readonly gates = new Map<string, Gate>();
  private readonly sinceProbe = new Map<string, number>();
  private readonly probing = new Map<string, Promise<boolean>>();
  private readonly headerCache = new Map<string, Promise<string>>();
  private readonly valueCache = new Map<string, Promise<string>>();
  /** Per endpoint: series that stated a total and how many matched. Reset when the endpoint reruns, so a resume never counts a series twice. */
  private readonly totals = new Map<string, { stated: number; matched: number }>();
  private readonly firstBodies = new Map<string, string>();
  private readonly dashBodies = new Map<string, unknown>();
  private readonly agg = new Map<string, Agg>();
  private readonly bytesBy = new Map<string, number>();
  private readonly clean = new Set<string>();
  private readonly loginRes: RegExp[];
  private readonly widgetEndpoints: Set<string>;
  private readonly dashboards: Set<string>;
  private readonly idCap: number;
  private aborted?: RunAborted;
  private consecutive = 0;
  private readonly counters: { requests: number; retries: number; http429: number };

  constructor(private readonly opts: SnapshotRunOpts) {
    this.plan = opts.plan;
    this.store = opts.store;
    this.fetcher = opts.fetcher;
    this.rp = planRun(opts.plan, { ...(opts.only ? { only: opts.only } : {}), ...(opts.groups ? { groups: opts.groups } : {}), perId: opts.perId, ...(opts.idsFrom ? { idsFrom: opts.idsFrom } : {}) });
    this.loginRes = opts.plan.loginPaths.map((re) => new RegExp(re));
    this.widgetEndpoints = widgetEndpointIds(opts.plan.widgetRules);
    this.dashboards = new Set(this.rp.dashboards);
    this.idCap = Math.min(opts.maxIds ?? snapshotIdsMax, snapshotIdsMax);
    const seed = opts.store.manifest;
    this.counters = {
      requests: seed.counts.requests,
      retries: seed.counts.retries,
      http429: seed.counts.http429,
    };
    for (const [id, e] of Object.entries(seed.endpoints)) this.bytesBy.set(id, e.bytes);
    for (const [id, e] of Object.entries(opts.store.progress.endpoints)) if (e.totals) this.totals.set(id, { ...e.totals });
  }

  // ---- top level

  async execute(): Promise<SnapshotSummary> {
    const { log, runId, site } = this.opts;
    let probeAliveAtEnd = false;
    try {
      await this.body();
      probeAliveAtEnd = await this.probeAll();
    } catch (error) {
      if (!(error instanceof RunAborted)) {
        await this.store.finish(this.manifest('aborted', `error: ${error instanceof Error ? error.message : String(error)}`, false));
        throw error;
      }
      this.aborted = error;
    }
    if (this.aborted) {
      const manifest = this.manifest('aborted', this.aborted.reason, false);
      await this.store.finish(manifest);
      const line = this.line(manifest);
      log(line);
      throw new CaptureError(this.aborted.code, `${line}\n${this.aborted.message}`, this.aborted.fix ?? `rerun with --resume ${runId}`);
    }
    const draft = this.manifest('running', undefined, probeAliveAtEnd);
    const c = draft.counts;
    const good = c.failed === 0 && c.partial === 0 && c.complete === c.endpointsPlanned && c.totalsMatched === c.totalsStated && probeAliveAtEnd;
    const manifest = this.manifest(good ? 'complete' : 'partial', good ? undefined : this.why(draft), probeAliveAtEnd);
    await this.store.finish(manifest);
    const line = this.line(manifest);
    log(line);
    return { runId, site, status: manifest.status, ...(manifest.reason ? { reason: manifest.reason } : {}), counts: manifest.counts, endpoints: manifest.endpoints, line, dir: this.store.dir };
  }

  private async body(): Promise<void> {
    const { plan } = this;
    const fetchedOrigins = new Set<string>();
    for (const e of [...this.rp.selected.filter((x) => !x.skip), ...this.rp.silent.map((s) => s.endpoint)]) fetchedOrigins.add(e.origin);
    for (const origin of fetchedOrigins) if (!(await this.probe(origin))) this.abortSession(origin);

    for (const ep of this.rp.selected) {
      if (ep.skip) {
        this.opts.log(`${ep.id}: skipped (${ep.skip})`);
        await this.store.setState(ep.id, 'skipped');
      }
    }
    if (this.opts.idsFrom) {
      for (const [name, values] of Object.entries(this.opts.idsFrom)) await this.store.recordIds(name, values.slice(0, this.idCap));
    }

    const selected = new Set(this.rp.selected.map((e) => e.id));
    const silent = new Map(this.rp.silent.map((s) => [s.endpoint.id, s.mode] as const));
    for (const ep of orderEndpoints(plan)) {
      if (this.widgetEndpoints.has(ep.id)) continue;
      if (selected.has(ep.id)) await this.runEndpoint(ep);
      else if (silent.has(ep.id)) await this.runSilent(ep, silent.get(ep.id)!);
    }
    await this.runWidgets();
  }

  // ---- endpoints

  private widgetsWanted(): boolean {
    return this.rp.selected.some((e) => this.widgetEndpoints.has(e.id) && !e.skip);
  }

  private aggOf(id: string): Agg {
    let a = this.agg.get(id);
    if (!a) this.agg.set(id, (a = { ok: 0, fail: 0, expected404: 0, incomplete: false }));
    return a;
  }

  private async runEndpoint(ep: EndpointPlan): Promise<void> {
    if (ep.skip) return;
    const needsBody = this.dashboards.has(ep.id) && this.widgetsWanted();
    const prior = this.store.stateOf(ep.id);
    if (this.opts.resume && doneStates.includes(prior) && !needsBody) {
      this.opts.log(`${ep.id}: already ${prior}, skipped on resume`);
      this.clean.add(ep.id);
      return;
    }
    await this.store.setState(ep.id, 'running');
    this.agg.set(ep.id, { ok: 0, fail: 0, expected404: 0, incomplete: false });
    this.totals.set(ep.id, { stated: 0, matched: 0 });
    const res = await this.resolveFor(ep, false);
    if (res) {
      const combos = this.combos(ep);
      if (typeof combos === 'string') await this.noIds(ep, combos, false);
      else await this.pool(combos, combos.length > 1 ? snapshotConcurrency : 1, (c) => this.runSeries({ ep, ids: c.ids, ...(c.range ? { range: c.range } : {}), ...res, silent: false, replayAcked: needsBody, fanOut: combos.length > 1, ...this.dashCapture(ep, c.ids) }));
    }
    await this.finalize(ep);
    await this.store.writeManifest(this.manifest('running', undefined, false));
  }

  private async runSilent(ep: EndpointPlan, mode: 'ids' | 'first'): Promise<void> {
    const needsBody = this.dashboards.has(ep.id) && this.widgetsWanted();
    if (mode === 'ids' && !needsBody && doneStates.includes(this.store.stateOf(ep.id))) return;
    if (mode === 'first' && (this.firstBodies.has(ep.id) || (await this.store.readEnvelope(ep.id)) !== undefined)) return;
    this.opts.log(`${ep.id}: fetched for ${mode === 'ids' ? 'ids' : 'a header value'} only, rows not written`);
    const res = await this.resolveFor(ep, true);
    if (!res) return;
    const combos = this.combos(ep);
    if (typeof combos === 'string') {
      this.opts.log(`${ep.id}: no values for id "${combos}"`);
      return;
    }
    const before = this.aggOf(`silent:${ep.id}`);
    before.fail = 0;
    before.incomplete = false;
    const stopWhen = mode === 'ids' && this.opts.maxIds !== undefined && !needsBody ? () => this.idsSatisfied(ep) : undefined;
    await this.pool(combos, combos.length > 1 ? snapshotConcurrency : 1, (c) =>
      this.runSeries({ ep, ids: c.ids, ...(c.range ? { range: c.range } : {}), ...res, silent: true, firstOnly: mode === 'first', fanOut: combos.length > 1, ...(stopWhen ? { stopWhen } : {}), ...this.dashCapture(ep, c.ids) }),
    );
    if (before.fail === 0 && !before.incomplete) this.clean.add(ep.id);
  }

  /** Keep the first response of a dashboard endpoint per dashboard id: the widget requests are derived from it. */
  private dashCapture(ep: EndpointPlan, ids: Record<string, string>): Pick<SeriesOpts, 'onFirstBody'> | Record<string, never> {
    const rules = this.plan.widgetRules;
    if (!rules || !this.dashboards.has(ep.id)) return {};
    const dashId = ids[rules.dashIdsFrom];
    return dashId === undefined ? {} : { onFirstBody: (body: unknown) => void this.dashBodies.set(dashId, body) };
  }

  private async finalize(ep: EndpointPlan): Promise<void> {
    const a = this.aggOf(ep.id);
    const had = a.ok > 0 || this.store.ackedCount(ep.id) > 0;
    let state: EndpointState;
    if (a.fail > 0 || a.incomplete) state = had ? 'partial' : 'failed';
    else if (a.ok === 0 && a.expected404 > 0 && !had) state = 'expected-404';
    else state = 'complete';
    if (state === 'complete' || state === 'expected-404') this.clean.add(ep.id);
    const t = this.totals.get(ep.id);
    await this.store.setState(ep.id, state, { ...(a.total !== undefined ? { total: a.total } : {}), ...(t ? { totals: { ...t } } : {}) });
    this.opts.log(`${ep.id}: ${state}${a.fail > 0 ? `, ${a.fail} failure${a.fail === 1 ? '' : 's'}` : ''}`);
  }

  private async noIds(ep: EndpointPlan, name: string, silent: boolean): Promise<void> {
    const src = this.plan.ids[name]?.endpoint;
    if (src && (this.clean.has(src) || doneStates.includes(this.store.stateOf(src)))) {
      this.opts.log(`${ep.id}: no values for id "${name}", nothing to fetch`);
      return;
    }
    await this.failure(ep, this.plan.origins[ep.origin] ?? '', 'ids', 0, `no values for id "${name}" (its source ${src ?? 'is not in the plan'} did not complete)`, silent);
  }

  // ---- ids

  private idValues(name: string): string[] {
    const have = this.opts.idsFrom?.[name] ?? this.store.idsOf(name);
    const values = have.length > 0 ? have : (this.plan.ids[name]?.fallbackLiterals ?? []).map(String);
    return values.slice(0, this.idCap);
  }

  private idSources(ep: EndpointPlan): [string, string][] {
    const out: [string, string][] = [];
    for (const [name, src] of Object.entries(this.plan.ids)) if (src.endpoint === ep.id) out.push([name, src.path]);
    for (const [name, p] of Object.entries(ep.yields ?? {})) out.push([name, p]);
    return out.filter(([name]) => !(this.opts.idsFrom && name in this.opts.idsFrom));
  }

  private idsSatisfied(ep: EndpointPlan): boolean {
    const sources = this.idSources(ep);
    return sources.length > 0 && sources.every(([name]) => this.store.idsOf(name).length >= this.idCap);
  }

  private async collectIds(ep: EndpointPlan, body: unknown): Promise<void> {
    for (const [name, p] of this.idSources(ep)) {
      const room = this.idCap - this.store.idsOf(name).length;
      if (room <= 0) continue;
      const have = new Set(this.store.idsOf(name));
      await this.store.recordIds(name, extractIds(body, p).filter((id) => !have.has(id)).slice(0, room));
    }
  }

  /** The id and range combinations of an endpoint, or the name of an id that has no values. */
  private combos(ep: EndpointPlan): { ids: Record<string, string>; range?: MonthRange }[] | string {
    let sets: Record<string, string>[] = [{}];
    for (const name of endpointIdNames(ep)) {
      const values = this.idValues(name);
      if (values.length === 0) return name;
      sets = sets.flatMap((base) => values.map((v) => ({ ...base, [name]: v })));
    }
    const ranges: (MonthRange | undefined)[] = ep.range ? monthRanges(this.opts.now(), ep.range.months ?? this.opts.months) : [undefined];
    return sets.flatMap((ids) => ranges.map((range) => ({ ids, ...(range ? { range } : {}) })));
  }

  // ---- headers

  /** The headers and named values an endpoint needs, or undefined (after a failure row) when one cannot be resolved. */
  private async resolveFor(ep: EndpointPlan, silent: boolean): Promise<Resolved | undefined> {
    const headers: Record<string, string> = {};
    const values: Record<string, string> = {};
    try {
      for (const name of ep.headers ?? []) headers[name] = await this.header(name);
      for (const name of valueNamesOf(ep)) values[name] = await this.value(name);
      return { headers, values };
    } catch (error) {
      if (!(error instanceof HeaderError)) throw error;
      await this.failure(ep, this.plan.origins[ep.origin] ?? '', 'headers', 0, error.message, silent);
      if (!silent) this.aggOf(ep.id).incomplete = true;
      return undefined;
    }
  }

  private header(name: string): Promise<string> {
    let p = this.headerCache.get(name);
    if (!p) {
      p = this.computeRule(`header "${name}"`, this.plan.headers[name]);
      this.headerCache.set(name, p);
      this.forgetOnFailure(this.headerCache, name, p);
    }
    return p;
  }

  private value(name: string): Promise<string> {
    let p = this.valueCache.get(name);
    if (!p) {
      p = this.computeRule(`value "${name}"`, this.plan.values?.[name]);
      this.valueCache.set(name, p);
      this.forgetOnFailure(this.valueCache, name, p);
    }
    return p;
  }

  /** A rule that failed is asked again next time (the cookie a probe could not read may exist by the first endpoint). */
  private forgetOnFailure(cache: Map<string, Promise<string>>, name: string, p: Promise<string>): void {
    p.catch(() => {
      if (cache.get(name) === p) cache.delete(name);
    });
  }

  private async computeRule(label: string, rule: HeaderRule | undefined): Promise<string> {
    if (!rule) throw new HeaderError(`${label} is not in the plan`);
    if ('literal' in rule) return rule.literal;
    if ('fromCookie' in rule) {
      const raw = await this.fetcher.cookie(rule.origin, rule.fromCookie);
      if (raw === undefined || raw === '') throw new HeaderError(`${label}: cookie "${rule.fromCookie}" is not readable on origin "${rule.origin}" (HttpOnly, or the tab is not signed in)`);
      return rule.decode === 'uri' ? decodeURIComponent(raw) : raw;
    }
    if ('fromResponse' in rule) {
      const ep = rule.fromResponse.endpoint;
      const text = this.firstBodies.get(ep) ?? (await this.store.readEnvelope(ep));
      if (text === undefined) throw new HeaderError(`${label}: endpoint "${ep}" has no stored response to read ${rule.fromResponse.path} from`);
      let v: unknown;
      try {
        v = jsonPath(JSON.parse(text), rule.fromResponse.path)[0];
      } catch {
        v = undefined;
      }
      if (typeof v !== 'string' && typeof v !== 'number') throw new HeaderError(`${label}: ${rule.fromResponse.path} not found in the response of "${ep}"`);
      return String(v);
    }
    if ('fromPageResponse' in rule) {
      const v = await this.fetcher.pageResponseValue(rule.fromPageResponse.origin, new RegExp(rule.fromPageResponse.urlPattern), rule.fromPageResponse.path);
      if (v === undefined) throw new HeaderError(`${label}: the page made no response matching the plan's urlPattern on a reload of origin "${rule.fromPageResponse.origin}"`);
      return v;
    }
    const v = await this.fetcher.storageValue(rule.fromStorage.origin, rule.fromStorage.area, new RegExp(rule.fromStorage.keyPattern));
    if (v === undefined) throw new HeaderError(`${label}: no ${rule.fromStorage.area} storage key matches the plan's keyPattern on origin "${rule.fromStorage.origin}"`);
    return v;
  }

  // ---- series and pages

  private keyOf(s: SeriesOpts, page: PageState): string {
    const own = pageKeyFor(s.ep, { ids: s.ids, ...(s.range ? { range: s.range } : {}), page });
    return [s.keyPrefix, own === 'all' ? '' : own].filter(Boolean).join('&') || 'all';
  }

  private seriesBase(s: SeriesOpts): string {
    const own = pageKeyFor({ ...s.ep, paginator: { kind: 'none' } }, { ids: s.ids, ...(s.range ? { range: s.range } : {}) });
    return [s.keyPrefix, own === 'all' ? '' : own].filter(Boolean).join('&');
  }

  private async runSeries(s: SeriesOpts): Promise<void> {
    const { ep } = s;
    const pg = ep.paginator;
    const agg = s.silent ? this.aggOf(`silent:${ep.id}`) : this.aggOf(ep.id);
    const totalPath = ep.total ?? (pg.kind === 'datatables' ? pg.totalPath : undefined);
    let state: PageState | null = firstPage(pg);
    let pages = 0;
    let records = 0;
    let stated: number | undefined;
    let skippedAcked = false;
    let incomplete = false;
    let first = true;
    let prevFingerprint: string | undefined;

    while (state) {
      this.assertRunning();
      if (pages >= snapshotPagesMax) {
        await this.failure(ep, '', this.keyOf(s, state), 0, `more than ${snapshotPagesMax} pages in one series`, s.silent);
        incomplete = true;
        break;
      }
      pages += 1;
      const pageKey = this.keyOf(s, state);
      const acked = !s.silent && this.store.isAcked(ep.id, pageKey);
      if (acked && !s.replayAcked) {
        if (pg.kind === 'cursor') {
          const stored = s.fanOut ? undefined : this.store.cursorOf(ep.id);
          if (stored !== undefined) {
            skippedAcked = true;
            first = false;
            state = stored === null || stored === state.cursor ? null : { cursor: stored };
            continue;
          }
          // Several series share one stored cursor: replay this page to learn the next cursor.
        } else {
          skippedAcked = true;
          first = false;
          state = nextPage(pg, undefined, state, assumeFullPage);
          continue;
        }
      }

      let url: string;
      try {
        url = buildUrl(this.plan, ep, { ids: s.ids, ...(s.range ? { range: s.range } : {}), page: state, uuid: randomUUID, ...(s.values ? { values: s.values } : {}), ...(s.extraQuery ? { extraQuery: s.extraQuery } : {}) });
      } catch (error) {
        await this.failure(ep, '', pageKey, 0, error instanceof Error ? error.message : String(error), s.silent);
        incomplete = true;
        break;
      }
      const { r, cls } = await this.fetchRetry(ep.origin, url, s.headers);

      if (cls === 'session-dead') {
        if (!(await this.probe(ep.origin))) this.abortSession(ep.origin);
        await this.failure(ep, url, pageKey, r.status, `http ${r.status} while the session probe is alive`, s.silent);
        this.noteFailure();
        incomplete = true;
        break;
      }
      if (cls === 'not-found') {
        this.consecutive = 0;
        if (ep.expect404) {
          agg.expected404 += 1;
        } else {
          await this.failure(ep, url, pageKey, r.status, 'not found', s.silent);
          incomplete = true;
        }
        break;
      }
      if (cls === 'retry') {
        await this.failure(ep, url, pageKey, r.status, `${r.error ?? `http ${r.status}`} after ${snapshotRetryMax} retries`, s.silent);
        this.noteFailure();
        incomplete = true;
        if (pg.kind === 'cursor') break;
        state = nextPage(pg, undefined, state, assumeFullPage);
        continue;
      }
      if (cls === 'skip' || cls === 'too-large') {
        const why = cls === 'too-large' ? `too-large: ${r.tooLarge} characters` : `http ${r.status} ${r.contentType || 'no content type'}`;
        await this.failure(ep, url, pageKey, r.status, why, s.silent);
        this.noteFailure();
        incomplete = true;
        break;
      }

      // ok
      const text = r.text ?? '';
      let body: unknown = null;
      if (text.trim() !== '') {
        try {
          body = JSON.parse(text);
        } catch {
          await this.failure(ep, url, pageKey, r.status, 'response is not JSON', s.silent);
          this.noteFailure();
          incomplete = true;
          break;
        }
      }
      this.consecutive = 0;
      const recs = text.trim() === '' ? [] : rowsOf(body, ep.records);
      if (pg.kind === 'laravel-meta' || pg.kind === 'laravel-flat') {
        // A server that ignores the page parameter answers every page with the first one: stop instead of looping.
        const fingerprint = pageFingerprint(recs);
        if (fingerprint !== undefined && fingerprint === prevFingerprint) {
          await this.failure(ep, url, pageKey, r.status, 'page param ignored', s.silent);
          incomplete = true;
          break;
        }
        prevFingerprint = fingerprint;
      }
      if (first && s.onFirstBody) s.onFirstBody(body);
      first = false;
      if (text !== '' && !this.firstBodies.has(ep.id)) this.firstBodies.set(ep.id, text);
      const total = statedTotal(body, totalPath);
      if (total !== undefined) stated = total;
      await this.collectIds(ep, body);
      const next = nextPage(pg, body, state, recs.length);
      if (!s.silent && !acked) {
        const rows = this.rowsFor(ep, url, r.status, pageKey, text, recs);
        const bytes = await this.store.appendRows(ep.id, rows);
        await this.store.ack(ep.id, pageKey, { addRows: rows.length, ...(pg.kind === 'cursor' ? { cursor: next?.cursor ?? null } : {}) });
        this.bytesBy.set(ep.id, (this.bytesBy.get(ep.id) ?? 0) + bytes);
      }
      records += recs.length;
      agg.ok += 1;
      state = s.firstOnly || s.stopWhen?.() ? null : next;
    }

    if (incomplete) agg.incomplete = true;
    if (!s.silent && !incomplete && stated === undefined && skippedAcked && totalPath) {
      // Every page was acked by an earlier attempt: no body was fetched, so read the stated total back from the first
      // stored page. The endpoint's totals restart on every run, so this series is counted exactly once.
      const text = await this.store.readEnvelope(ep.id, this.keyOf(s, firstPage(pg)));
      if (text !== undefined) {
        try {
          stated = statedTotal(JSON.parse(text), totalPath);
        } catch {
          // An unreadable envelope states nothing.
        }
      }
    }
    if (!s.silent && !incomplete && stated !== undefined) {
      const have = skippedAcked ? await this.store.countRecords(ep.id, this.inSeries(this.seriesBase(s))) : records;
      const t = this.totalsOf(ep.id);
      t.stated += 1;
      if (have === stated) t.matched += 1;
      else this.opts.log(`${ep.id}: a series has ${have} records but states a total of ${stated}`);
      agg.total = (agg.total ?? 0) + stated;
    }
  }

  private totalsOf(id: string): { stated: number; matched: number } {
    let t = this.totals.get(id);
    if (!t) this.totals.set(id, (t = { stated: 0, matched: 0 }));
    return t;
  }

  private sumTotals(): { stated: number; matched: number } {
    let stated = 0;
    let matched = 0;
    for (const t of this.totals.values()) {
      stated += t.stated;
      matched += t.matched;
    }
    return { stated, matched };
  }

  private inSeries(base: string): (pageKey: string) => boolean {
    return base === '' ? () => true : (k) => k === base || k.startsWith(`${base}&`);
  }

  private rowsFor(ep: EndpointPlan, url: string, status: number, pageKey: string, text: string, recs: unknown[]): SnapshotRow[] {
    const fetchedAt = this.opts.now().toISOString();
    // Key order is the file format: readEnvelope and countRecords read page_key and record_index before the payload.
    const row = (index: number, payload: string): SnapshotRow => ({
      run_id: this.opts.runId,
      site: this.opts.site,
      endpoint_id: ep.id,
      method: ep.method,
      path_template: ep.path,
      url,
      fetched_at: fetchedAt,
      status,
      page_key: pageKey,
      record_index: index,
      payload,
      payload_sha256: sha256Hex(payload),
    });
    return [row(-1, text), ...recs.map((rec, i) => row(i, JSON.stringify(rec)))];
  }

  private async failure(ep: EndpointPlan, url: string, pageKey: string, status: number, error: string, silent: boolean): Promise<void> {
    const a = silent ? this.aggOf(`silent:${ep.id}`) : this.aggOf(ep.id);
    a.fail += 1;
    if (silent) {
      this.opts.log(`${ep.id}: ${error}`);
      return;
    }
    const row: FailureRow = {
      run_id: this.opts.runId,
      site: this.opts.site,
      endpoint_id: ep.id,
      method: ep.method,
      path_template: ep.path,
      url,
      fetched_at: this.opts.now().toISOString(),
      status,
      page_key: pageKey,
      record_index: null,
      payload_sha256: null,
      error,
    };
    await this.store.appendFailure(row);
  }

  private noteFailure(): void {
    this.consecutive += 1;
    if (this.consecutive >= snapshotConsecutiveFailuresMax) {
      this.abort('snapshot-incomplete', 'consecutive-failures', `${snapshotConsecutiveFailuresMax} requests failed in a row`, `check the Chrome and the site, then rerun with --resume ${this.opts.runId}`);
    }
  }

  // ---- widgets (data-driven dashboards)

  private async runWidgets(): Promise<void> {
    const rules = this.plan.widgetRules;
    if (!rules) return;
    const eps = this.rp.selected.filter((e) => this.widgetEndpoints.has(e.id) && !e.skip);
    if (eps.length === 0) return;
    const dashIds = this.idValues(rules.dashIdsFrom);
    for (const ep of eps) {
      const prior = this.store.stateOf(ep.id);
      if (this.opts.resume && doneStates.includes(prior)) {
        this.opts.log(`${ep.id}: already ${prior}, skipped on resume`);
        this.clean.add(ep.id);
        continue;
      }
      await this.store.setState(ep.id, 'running');
      this.agg.set(ep.id, { ok: 0, fail: 0, expected404: 0, incomplete: false });
      this.totals.set(ep.id, { stated: 0, matched: 0 });
      const res = await this.resolveFor(ep, false);
      if (res) {
        const tasks: { ids: Record<string, string>; range: MonthRange; query: Record<string, string>; prefix: string }[] = [];
        const ranges = monthRanges(this.opts.now(), ep.range?.months ?? this.opts.months);
        for (const dashId of dashIds) {
          const dash = this.dashBodies.get(dashId);
          if (dash === undefined) {
            await this.failure(ep, '', `d=${dashId}`, 0, 'the dashboard response is not available to derive widgets from', false);
            continue;
          }
          for (const range of ranges) {
            for (const req of widgetRequests(dash, dashId, rules, range)) {
              if (req.endpointId === ep.id) tasks.push({ ids: req.ids, range: req.range, query: req.query, prefix: `d=${dashId}&w=${req.widgetId}` });
            }
          }
        }
        await this.pool(tasks, snapshotConcurrency, (t) => this.runSeries({ ep, ids: t.ids, range: t.range, ...res, silent: false, extraQuery: t.query, keyPrefix: t.prefix, fanOut: true }));
      }
      await this.finalize(ep);
      await this.store.writeManifest(this.manifest('running', undefined, false));
    }
  }

  // ---- requests

  private gate(origin: string): Gate {
    let g = this.gates.get(origin);
    if (!g) this.gates.set(origin, (g = new Gate(this.opts.now, this.opts.sleep)));
    return g;
  }

  private assertRunning(): void {
    if (this.aborted) throw this.aborted;
  }

  private abort(code: CaptureErrorCode, reason: string, message: string, fix?: string): never {
    this.aborted ??= new RunAborted(code, reason, message, fix);
    throw this.aborted;
  }

  private abortSession(origin: string): never {
    this.opts.log(`session on origin "${origin}" is gone: sign in again in the Chrome, then rerun with --resume ${this.opts.runId}`);
    return this.abort('session-expired', 'session-expired', `the signed-in session on origin "${origin}" is gone`, `sign in again in the Chrome, then rerun with --resume ${this.opts.runId}`);
  }

  private async send(originName: string, url: string, headers: Record<string, string>, probing: boolean): Promise<FetchResult> {
    this.assertRunning();
    if (this.counters.requests >= snapshotRequestsMax) {
      this.abort('snapshot-incomplete', 'request-cap', `the run reached ${snapshotRequestsMax} requests`, `rerun with --resume ${this.opts.runId} to continue`);
    }
    if (!this.fetcher.alive()) {
      this.abort('browser-closed', 'browser-closed', 'the Chrome closed or disconnected', `start the signed-in Chrome again, then rerun with --resume ${this.opts.runId}`);
    }
    if (!probing && (this.sinceProbe.get(originName) ?? 0) >= snapshotProbeEveryRequests && !(await this.probe(originName))) this.abortSession(originName);
    const r = await this.gate(originName).run(async () => {
      this.counters.requests += 1;
      this.sinceProbe.set(originName, (this.sinceProbe.get(originName) ?? 0) + 1);
      return await this.fetcher.fetch({ originName, url, headers });
    });
    if (r.status === 429) this.counters.http429 += 1;
    return r;
  }

  private classify(originName: string, r: FetchResult): Outcome['cls'] {
    if (r.tooLarge !== undefined && r.status >= 200 && r.status < 300) return 'too-large';
    return classifyResponse({ status: r.status, url: r.url, contentType: r.contentType }, this.plan.origins[originName]!, this.loginRes);
  }

  private async fetchRetry(originName: string, url: string, headers: Record<string, string>, probing = false): Promise<Outcome> {
    for (let attempt = 0; ; attempt += 1) {
      const r = await this.send(originName, url, headers, probing);
      const cls = this.classify(originName, r);
      if (cls !== 'retry' || attempt >= snapshotRetryMax) return { r, cls };
      this.counters.retries += 1;
      await this.opts.sleep(backoffMs(attempt + 1, r.retryAfter, this.opts.now().getTime()));
    }
  }

  /** Ask the origin whether the session is alive. Concurrent askers share one answer. */
  private probe(origin: string): Promise<boolean> {
    let p = this.probing.get(origin);
    if (!p) {
      p = this.askProbe(origin).finally(() => this.probing.delete(origin));
      this.probing.set(origin, p);
    }
    return p;
  }

  private async askProbe(origin: string): Promise<boolean> {
    this.sinceProbe.set(origin, 0);
    const path = this.plan.probe[origin];
    const base = this.plan.origins[origin];
    if (!path || !base) return false;
    const { cls } = await this.fetchRetry(origin, `${base.replace(/\/+$/, '')}${path}`, await this.probeHeaders(origin), true);
    return cls === 'ok';
  }

  /**
   * Headers a probe carries: every header that endpoints on this origin send, except one read from a snapshot
   * endpoint's response (fromResponse), which may not exist yet. A page-captured or storage header (a token the page
   * obtains for itself) is sent, because without it every request on such an origin looks like a dead session. A
   * header that cannot be resolved is left out: the probe then asks with what the page itself would carry.
   */
  private async probeHeaders(origin: string): Promise<Record<string, string>> {
    const names = new Set<string>();
    for (const e of [...this.rp.selected.filter((x) => !x.skip), ...this.rp.silent.map((x) => x.endpoint)]) {
      if (e.origin === origin) for (const h of e.headers ?? []) names.add(h);
    }
    const out: Record<string, string> = {};
    for (const name of names) {
      const rule = this.plan.headers[name];
      if (!rule || 'fromResponse' in rule) continue;
      try {
        out[name] = await this.header(name);
      } catch (error) {
        if (!(error instanceof HeaderError)) throw error;
      }
    }
    return out;
  }

  private async probeAll(): Promise<boolean> {
    const origins = new Set<string>();
    for (const e of [...this.rp.selected.filter((x) => !x.skip), ...this.rp.silent.map((s) => s.endpoint)]) origins.add(e.origin);
    let alive = true;
    for (const o of origins) if (!(await this.probe(o))) alive = false;
    if (!alive) this.opts.log('the session probe is dead at the end of the run');
    return alive;
  }

  private async pool<T>(items: T[], workers: number, fn: (item: T) => Promise<void>): Promise<void> {
    let next = 0;
    let firstError: unknown;
    const worker = async (): Promise<void> => {
      while (next < items.length && firstError === undefined && !this.aborted) {
        const item = items[next++]!;
        try {
          await fn(item);
        } catch (error) {
          firstError ??= error;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(workers, items.length) }, worker));
    if (this.aborted) throw this.aborted;
    if (firstError !== undefined) throw firstError;
  }

  // ---- manifest

  private manifest(status: Manifest['status'], reason: string | undefined, probeAliveAtEnd: boolean): Manifest {
    const planned = this.rp.selected.filter((e) => !e.skip);
    const states = this.rp.selected.map((e) => [e, this.store.stateOf(e.id)] as const);
    const count = (pred: (s: EndpointState) => boolean) => states.filter(([e, s]) => !e.skip && pred(s)).length;
    const endpoints: Manifest['endpoints'] = {};
    let rows = 0;
    let bytes = 0;
    for (const [e, state] of states) {
      const p = this.store.progress.endpoints[e.id];
      const b = this.bytesBy.get(e.id) ?? 0;
      rows += p?.rows ?? 0;
      bytes += b;
      endpoints[e.id] = { state, rows: p?.rows ?? 0, bytes: b, pages: this.store.ackedCount(e.id), ...(p?.total !== undefined ? { total: p.total } : {}) };
    }
    const prior = this.store.manifest;
    const totals = this.sumTotals();
    return {
      manifestVersion: 1,
      runId: this.opts.runId,
      site: this.opts.site,
      planSha256: prior.planSha256,
      startedAt: prior.startedAt,
      ...(status === 'running' ? {} : { finishedAt: this.opts.now().toISOString() }),
      status,
      ...(reason ? { reason } : {}),
      counts: {
        endpointsPlanned: planned.length,
        complete: count((s) => doneStates.includes(s)),
        partial: count((s) => s === 'partial' || s === 'running' || s === 'pending'),
        failed: count((s) => s === 'failed'),
        skipped: this.rp.selected.filter((e) => e.skip).length,
        requests: this.counters.requests,
        retries: this.counters.retries,
        http429: this.counters.http429,
        rows,
        bytes,
        totalsMatched: totals.matched,
        totalsStated: totals.stated,
        probeAliveAtEnd,
      },
      endpoints,
    };
  }

  private why(m: Manifest): string {
    const c = m.counts;
    const parts: string[] = [];
    if (c.partial > 0) parts.push(`${c.partial} partial`);
    if (c.failed > 0) parts.push(`${c.failed} failed`);
    if (c.totalsMatched !== c.totalsStated) parts.push(`totals matched ${c.totalsMatched} of ${c.totalsStated}`);
    if (!c.probeAliveAtEnd) parts.push('probe dead at end');
    return parts.join(', ') || 'incomplete';
  }

  private line(m: Manifest): string {
    const c = m.counts;
    return (
      `snapshot ${this.opts.site} ${this.opts.runId}: endpoints planned ${c.endpointsPlanned} / complete ${c.complete} / partial ${c.partial} / failed ${c.failed}; ` +
      `requests ${c.requests} (retries ${c.retries}, 429s ${c.http429}); rows ${c.rows}; bytes ${c.bytes}; ` +
      `totals matched ${c.totalsMatched} of ${c.totalsStated}; probe alive at end: ${c.probeAliveAtEnd ? 'yes' : 'no'}; status ${m.status}`
    );
  }
}

export async function runSnapshot(opts: SnapshotRunOpts): Promise<SnapshotSummary> {
  return await new Run(opts).execute();
}
