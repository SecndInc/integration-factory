import assert from 'node:assert/strict';
import test from 'node:test';
import { CaptureError } from '../../src/apidocs/errors.js';
import {
  backoffMs,
  buildUrl,
  classifyResponse,
  describePlan,
  extractIds,
  firstPage,
  monthRanges,
  nextPage,
  orderEndpoints,
  pageFingerprint,
  planRun,
  pageKeyFor,
  rangeValue,
  rowsOf,
  selectEndpoints,
  sha256Hex,
  statedTotal,
  valueNamesOf,
  validatePlan,
  widgetRequests,
  type PageState,
} from '../../src/apidocs/snapshot/plan.js';
import type { Paginator, WidgetRules } from '../../src/apidocs/snapshot/types.js';
import { snapshotBackoffMaxMs } from '../../src/apidocs/limits.js';

function basePlan(): Record<string, any> {
  return {
    planVersion: 1,
    site: 'demo',
    origins: { app: 'https://app.example.com', api: 'https://api.example.com/' },
    tabFor: { app: 'app.example.com', api: 'api.example.com' },
    loginPaths: ['^/login'],
    probe: { app: '/api/me', api: '/v1/ping' },
    headers: { xsrf: { fromCookie: 'XSRF-TOKEN', origin: 'app', decode: 'uri' }, team: { fromResponse: { endpoint: 'account', path: '$.team.id' } } },
    ids: { jobId: { endpoint: 'jobs', path: '$.data[].id' }, teamId: { endpoint: 'account', path: '$.team.id' } },
    endpoints: [
      { id: 'job-notes', origin: 'app', method: 'GET', path: '/api/job/{jobId}/notes', pathParams: { jobId: { fromId: 'jobId' } }, headers: ['team'], paginator: { kind: 'none' }, group: 'per-job-core', perId: 'core' },
      { id: 'jobs', docId: 'GET app.example.com/api/jobs', origin: 'app', method: 'GET', path: '/api/jobs', headers: ['xsrf'], paginator: { kind: 'laravel-meta', pageParam: 'page', perPageParam: 'per_page' }, records: '$.data', total: '$.meta.total', group: 'lists', yields: { jobId: '$.data[].id' } },
      { id: 'account', origin: 'app', method: 'GET', path: '/api/subscription', paginator: { kind: 'none' }, group: 'account' },
      { id: 'widgets-month', origin: 'api', method: 'GET', path: '/v1/dash/{dashId}/w/{widgetId}', paginator: { kind: 'none' }, range: { param: 'daterange', format: 'daterange-pipe' }, group: 'widgets-monthly', perId: 'full' },
    ],
  };
}

const planOf = () => validatePlan(basePlan());
const epOf = (id: string) => planOf().endpoints.find((e) => e.id === id)!;

function walk(p: Paginator, pages: unknown[], recordsPerPage: number[]): PageState[] {
  const visited: PageState[] = [];
  let state: PageState | null = firstPage(p);
  let i = 0;
  while (state && i < pages.length) {
    visited.push(state);
    state = nextPage(p, pages[i], state, recordsPerPage[i]!);
    i++;
  }
  assert.equal(state, null, 'paginator must have stopped inside the supplied pages');
  return visited;
}

test('laravel-meta stops on last_page, and without last_page on the first empty page', () => {
  const p: Paginator = { kind: 'laravel-meta', pageParam: 'page' };
  const withLast = [1, 2, 3].map((n) => ({ data: [1], meta: { current_page: n, last_page: 3, total: 3 } }));
  assert.deepEqual(walk(p, withLast, [1, 1, 1]), [{ page: 1 }, { page: 2 }, { page: 3 }]);
  const noLast = [{ data: [1], meta: {} }, { data: [1], meta: {} }, { data: [], meta: {} }];
  assert.deepEqual(walk(p, noLast, [1, 1, 0]), [{ page: 1 }, { page: 2 }, { page: 3 }]);
});

test('laravel-flat stops on the top-level last_page', () => {
  const p: Paginator = { kind: 'laravel-flat', pageParam: 'page' };
  const pages = [1, 2].map((n) => ({ current_page: n, last_page: 2, total: 2, data: [1] }));
  assert.deepEqual(walk(p, pages, [1, 1]), [{ page: 1 }, { page: 2 }]);
});

test('laravel-meta stops on a present, null links.next even when last_page is missing or says more', () => {
  const p: Paginator = { kind: 'laravel-meta', pageParam: 'page' };
  const pages = [{ data: [1], links: { next: '/x?page=2' } }, { data: [1], links: { next: null }, meta: { last_page: 9 } }];
  assert.deepEqual(walk(p, pages, [1, 1]), [{ page: 1 }, { page: 2 }]);
  // links.next absent: the old rules apply (a next page until an empty one).
  assert.deepEqual(walk(p, [{ data: [1] }, { data: [] }], [1, 0]), [{ page: 1 }, { page: 2 }]);
  assert.deepEqual(nextPage(p, { data: [1], links: {} }, { page: 1 }, 1), { page: 2 });
});

test('laravel-flat stops on a present, null next_page_url', () => {
  const p: Paginator = { kind: 'laravel-flat', pageParam: 'page' };
  const pages = [{ data: [1], next_page_url: '/x?page=2' }, { data: [1], next_page_url: null }];
  assert.deepEqual(walk(p, pages, [1, 1]), [{ page: 1 }, { page: 2 }]);
  assert.deepEqual(nextPage(p, { data: [1] }, { page: 1 }, 1), { page: 2 });
});

test('pageFingerprint: the first record id, else a hash of the record, nothing for an empty page', () => {
  assert.equal(pageFingerprint([{ id: 7, a: 1 }, { id: 8 }]), 'id:7');
  assert.equal(pageFingerprint([{ id: 'x' }]), 'id:x');
  assert.notEqual(pageFingerprint([{ a: 1 }]), pageFingerprint([{ a: 2 }]));
  assert.equal(pageFingerprint([{ a: 1 }]), pageFingerprint([{ a: 1 }, { a: 5 }]));
  assert.match(pageFingerprint([5])!, /^sha:[0-9a-f]{64}$/);
  assert.equal(pageFingerprint([]), undefined);
});

test('cursor stops on null, on empty, and on a repeated cursor, at either next path', () => {
  const meta: Paginator = { kind: 'cursor', cursorParam: 'cursor', nextPath: '$.meta.next_cursor' };
  const metaPages = [{ meta: { next_cursor: 'a' } }, { meta: { next_cursor: 'b' } }, { meta: { next_cursor: null } }];
  assert.deepEqual(walk(meta, metaPages, [1, 1, 1]), [{ cursor: null }, { cursor: 'a' }, { cursor: 'b' }]);
  const top: Paginator = { kind: 'cursor', cursorParam: 'cursor', nextPath: '$.next_cursor' };
  assert.deepEqual(walk(top, [{ next_cursor: 'x' }, { next_cursor: '' }], [1, 1]), [{ cursor: null }, { cursor: 'x' }]);
  assert.deepEqual(walk(top, [{ next_cursor: 'x' }, { next_cursor: 'x' }], [1, 1]), [{ cursor: null }, { cursor: 'x' }]);
});

test('datatables stops when start + length reaches the total, or on an empty page', () => {
  const p: Paginator = { kind: 'datatables', pageParam: 'range', length: 100, totalPath: '$.data.iTotalRecords', recordsPath: '$.data.aaData' };
  const page = { data: { iTotalRecords: 250, aaData: [1] } };
  assert.deepEqual(walk(p, [page, page, page], [100, 100, 50]), [{ start: 0 }, { start: 100 }, { start: 200 }]);
  assert.deepEqual(walk(p, [{ data: { iTotalRecords: 250, aaData: [1] } }, { data: { aaData: [] } }], [100, 0]), [{ start: 0 }, { start: 100 }]);
});

test('none never has a next page', () => {
  assert.equal(nextPage({ kind: 'none' }, {}, firstPage({ kind: 'none' }), 5), null);
});

test('pageKeyFor is deterministic and distinct across pages, ids, ranges and cursors', () => {
  const jobs = epOf('jobs');
  assert.equal(pageKeyFor(jobs, { ids: {}, page: { page: 3 } }), 'p=3');
  assert.equal(pageKeyFor(jobs, { ids: {}, page: { page: 3 } }), pageKeyFor(jobs, { ids: {}, page: { page: 3 } }));
  assert.notEqual(pageKeyFor(jobs, { ids: {}, page: { page: 3 } }), pageKeyFor(jobs, { ids: {}, page: { page: 4 } }));
  const notes = epOf('job-notes');
  assert.equal(pageKeyFor(notes, { ids: { jobId: '7' } }), 'id=7');
  assert.notEqual(pageKeyFor(notes, { ids: { jobId: '7' } }), pageKeyFor(notes, { ids: { jobId: '8' } }));
  const ranged: any = { ...epOf('widgets-month'), paginator: { kind: 'datatables', pageParam: 'range', totalPath: '$.t', recordsPath: '$.r' } };
  const [jan, feb] = [{ key: '2026-01', start: '2026-01-01', end: '2026-01-31' }, { key: '2026-02', start: '2026-02-01', end: '2026-02-28' }];
  const a = pageKeyFor(ranged, { ids: { dashId: '1', widgetId: '2' }, range: jan, page: { start: 0 } });
  assert.match(a, /r=2026-01&s=0,100$/);
  assert.notEqual(a, pageKeyFor(ranged, { ids: { dashId: '1', widgetId: '2' }, range: feb, page: { start: 0 } }));
  assert.notEqual(a, pageKeyFor(ranged, { ids: { dashId: '1', widgetId: '3' }, range: jan, page: { start: 0 } }));
  const cursorEp: any = { ...jobs, paginator: { kind: 'cursor', cursorParam: 'c', nextPath: '$.n' } };
  assert.equal(pageKeyFor(cursorEp, { ids: {}, page: { cursor: 'abc' } }), 'c=abc');
  assert.equal(pageKeyFor(epOf('account'), { ids: {} }), 'all');
});

test('pageKeyFor never contains the computed uuid', () => {
  const plan = planOf();
  const ep: any = { ...epOf('account'), query: { query_id: { computed: 'uuid' } } };
  const uuid = '11111111-2222-3333-4444-555555555555';
  assert.ok(buildUrl(plan, ep, { ids: {}, uuid: () => uuid }).includes(uuid));
  assert.ok(!pageKeyFor(ep, { ids: {} }).includes(uuid));
});

test('buildUrl substitutes and encodes path params, adds query and paginator params, trims the origin slash', () => {
  const plan = planOf();
  assert.equal(buildUrl(plan, epOf('jobs'), { ids: {}, page: { page: 2 } }), 'https://app.example.com/api/jobs?page=2&per_page=50');
  assert.equal(buildUrl(plan, epOf('job-notes'), { ids: { jobId: 'a/b c' } }), 'https://app.example.com/api/job/a%2Fb%20c/notes');
  const r = { key: '2026-01', start: '2026-01-01', end: '2026-01-31' };
  assert.equal(buildUrl(plan, epOf('widgets-month'), { ids: { dashId: '9', widgetId: '4' }, range: r }), 'https://api.example.com/v1/dash/9/w/4?daterange=2026-01-01%7C2026-01-31');
  assert.throws(() => buildUrl(plan, epOf('job-notes'), { ids: {} }), (e) => e instanceof CaptureError && e.code === 'plan-invalid');
  const dt: any = { ...epOf('account'), paginator: { kind: 'datatables', pageParam: 'range', length: 100, totalPath: '$.t', recordsPath: '$.r' } };
  assert.equal(buildUrl(plan, dt, { ids: {}, page: { start: 200 } }), 'https://app.example.com/api/subscription?range=200%2C100');
  const cur: any = { ...epOf('account'), paginator: { kind: 'cursor', cursorParam: 'cursor', nextPath: '$.n' } };
  assert.equal(buildUrl(plan, cur, { ids: {} }), 'https://app.example.com/api/subscription');
  assert.equal(buildUrl(plan, cur, { ids: {}, page: { cursor: 'k1' } }), 'https://app.example.com/api/subscription?cursor=k1');
});

test('monthRanges: 24 gapless UTC windows 2024-12..2026-11, the last ending today', () => {
  const rs = monthRanges(new Date('2026-11-06T12:00:00Z'), 24);
  assert.equal(rs.length, 24);
  assert.equal(rs[0]!.key, '2024-12');
  assert.equal(rs[23]!.key, '2026-11');
  assert.deepEqual(rs[23], { key: '2026-11', start: '2026-11-01', end: '2026-11-06' });
  assert.deepEqual(rs[1], { key: '2025-01', start: '2025-01-01', end: '2025-01-31' });
  for (let i = 1; i < rs.length; i++) {
    const prevEnd = new Date(`${rs[i - 1]!.end}T00:00:00Z`);
    prevEnd.setUTCDate(prevEnd.getUTCDate() + 1);
    assert.equal(prevEnd.toISOString().slice(0, 10), rs[i]!.start, `gap before ${rs[i]!.key}`);
  }
  assert.equal(monthRanges(new Date('2026-03-31T00:00:00Z'), 2)[0]!.end, '2026-02-28');
  assert.equal(monthRanges(new Date('2028-03-15T00:00:00Z'), 2)[0]!.end, '2028-02-29');
});

test('rangeValue formats iso-date, iso-datetime and daterange-pipe', () => {
  const r = { key: '2026-01', start: '2026-01-01', end: '2026-01-31' };
  assert.equal(rangeValue({ format: 'iso-date' }, r, 'start'), '2026-01-01');
  assert.equal(rangeValue({ format: 'iso-datetime' }, r, 'start'), '2026-01-01T00:00:00');
  assert.equal(rangeValue({ format: 'iso-datetime' }, r, 'end'), '2026-01-31T23:59:59');
  assert.equal(rangeValue({ format: 'daterange-pipe' }, r, 'start'), '2026-01-01|2026-01-31');
  assert.equal(rangeValue({ format: 'iso-date' }, r, 'pipe'), '2026-01-01|2026-01-31');
});

test('extractIds handles [] flatten and the .* wildcard, dedupes and stringifies', () => {
  assert.deepEqual(extractIds({ data: [{ id: 1 }, { id: 'b' }, { id: 1 }, { nope: 1 }] }, '$.data[].id'), ['1', 'b']);
  assert.deepEqual(extractIds({ data: { x: { id: 5 }, y: { id: 6 } } }, '$.data.*.id'), ['5', '6']);
  assert.deepEqual(extractIds({ data: { x: 5, y: 'z' } }, '$.data.*'), ['5', 'z']);
  assert.deepEqual(extractIds({ data: [{ id: 1 }] }, '$.data[0].id'), ['1']);
  assert.deepEqual(extractIds({ team: { id: 42 } }, '$.team.id'), ['42']);
  assert.deepEqual(extractIds({}, '$.missing[].id'), []);
  assert.deepEqual(extractIds({}, 'data'), []);
});

test('rowsOf, statedTotal', () => {
  assert.deepEqual(rowsOf({ data: [1, 2] }, '$.data'), [1, 2]);
  assert.deepEqual(rowsOf([1, 2, 3], '$'), [1, 2, 3]);
  assert.deepEqual(rowsOf({ data: { aaData: [[1], [2]] } }, '$.data.aaData'), [[1], [2]]);
  assert.deepEqual(rowsOf({ a: 1 }), [{ a: 1 }]);
  assert.deepEqual(rowsOf({ a: 1 }, '$.missing'), []);
  assert.deepEqual(rowsOf({ data: { id: 1 } }, '$.data'), [{ id: 1 }]);
  assert.equal(statedTotal({ meta: { total: 57 } }, '$.meta.total'), 57);
  assert.equal(statedTotal({ iTotalRecords: '12' }, '$.iTotalRecords'), 12);
  assert.equal(statedTotal({}, '$.meta.total'), undefined);
  assert.equal(statedTotal({ meta: { total: 1 } }), undefined);
});

test('validatePlan accepts the base plan and rejects each class of mistake, listing them', () => {
  assert.equal(planOf().site, 'demo');
  const fails = (mutate: (p: Record<string, any>) => void, match: RegExp, doc?: { endpoints: { id: string; method: string }[] }) => {
    const p = basePlan();
    mutate(p);
    assert.throws(() => validatePlan(p, doc), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && match.test(e.message), String(match));
  };
  fails((p) => (p.endpoints[1].method = 'POST'), /method/);
  fails((p) => (p.endpoints[2].id = 'jobs'), /duplicate endpoint id "jobs"/);
  fails((p) => (p.endpoints[2].id = 'Bad_Id'), /id/);
  fails((p) => (p.endpoints[2].origin = 'nowhere'), /unknown origin "nowhere"/);
  fails((p) => (p.endpoints[2].headers = ['nope']), /header "nope"/);
  fails((p) => (p.endpoints[0].pathParams.jobId.fromId = 'ghost'), /unknown id "ghost"/);
  fails((p) => delete p.probe.api, /origin "api" is used but has no probe/);
  fails((p) => (p.endpoints[1].records = 'data'), /unsupported JSON path/);
  const doc = { endpoints: [{ id: 'GET app.example.com/api/jobs', method: 'GET' }] };
  assert.equal(validatePlan(basePlan(), doc).endpoints.length, 4);
  fails(() => {}, /docId "GET app.example.com\/api\/jobs" is not in the api doc/, { endpoints: [] });
  fails(() => {}, /is a POST/, { endpoints: [{ id: 'GET app.example.com/api/jobs', method: 'POST' }] });
  fails((p) => {
    p.endpoints[2].method = 'DELETE';
    p.endpoints[1].id = 'x y';
  }, /(?=[\s\S]*method)(?=[\s\S]*id)/);
});

test('orderEndpoints puts parents before children and detects a cycle', () => {
  const order = orderEndpoints(planOf()).map((e) => e.id);
  assert.ok(order.indexOf('jobs') < order.indexOf('job-notes'));
  assert.ok(order.indexOf('account') < order.indexOf('job-notes'), 'header source first');
  assert.equal(order.length, 4);
  const p = basePlan();
  p.endpoints[1].dependsOn = ['job-notes'];
  assert.throws(() => validatePlan(p), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && /cycle/.test(e.message));
  assert.throws(() => orderEndpoints({ ...planOf(), endpoints: planOf().endpoints.map((e) => (e.id === 'jobs' ? { ...e, dependsOn: ['job-notes'] } : e)) }), (e) => e instanceof CaptureError);
});

test('selectEndpoints filters by only, group and per-id level', () => {
  const plan = planOf();
  const ids = (o: Parameters<typeof selectEndpoints>[1]) => selectEndpoints(plan, o).map((e) => e.id);
  assert.deepEqual(ids({ perId: 'core' }).sort(), ['account', 'job-notes', 'jobs']);
  assert.deepEqual(ids({ perId: 'full' }).sort(), ['account', 'job-notes', 'jobs', 'widgets-month']);
  assert.deepEqual(ids({ perId: 'full', only: ['jobs'] }), ['jobs']);
  assert.deepEqual(ids({ perId: 'full', groups: ['widgets-monthly'] }), ['widgets-month']);
});

test('classifyResponse', () => {
  const origin = 'https://app.example.com';
  const login = [/^\/login/];
  const c = (status: number, url = `${origin}/api/x`, contentType = 'application/json') => classifyResponse({ status, url, contentType }, origin, login);
  assert.equal(c(200), 'ok');
  assert.equal(c(200, undefined, 'application/json; charset=utf-8'), 'ok');
  assert.equal(c(204, undefined, ''), 'ok');
  assert.equal(c(401), 'session-dead');
  assert.equal(c(403), 'session-dead');
  assert.equal(c(200, 'https://sso.example.org/auth'), 'session-dead');
  assert.equal(c(200, `${origin}/login?next=/`), 'session-dead');
  assert.equal(c(200, undefined, 'text/html'), 'session-dead');
  assert.equal(c(429), 'retry');
  assert.equal(c(500), 'retry');
  assert.equal(c(503), 'retry');
  assert.equal(c(0, ''), 'retry');
  assert.equal(c(404), 'not-found');
  assert.equal(c(422), 'skip');
  assert.equal(c(200, undefined, 'text/plain'), 'skip');
});

test('backoffMs doubles, caps, and honours Retry-After', () => {
  assert.equal(backoffMs(1), 1_000);
  assert.equal(backoffMs(2), 2_000);
  assert.equal(backoffMs(3), 4_000);
  assert.equal(backoffMs(30), snapshotBackoffMaxMs);
  assert.equal(backoffMs(1, '7'), 7_000);
  assert.equal(backoffMs(3, '1'), 4_000);
  assert.equal(backoffMs(1, 'garbage'), 1_000);
  assert.equal(backoffMs(1, new Date(Date.UTC(2026, 10, 6, 0, 0, 10)).toUTCString(), Date.UTC(2026, 10, 6, 0, 0, 0)), 10_000);
});

// A synthetic dashboard in the shape of the YP dashboard response: widget ids at $.data.page.widget_ids[], definitions at
// $.data.page.layouts.<layout>.widgets.<id>, with data_source_id / data_type / data_view_id / type / timegroup / metadata.
// Every value here is made up.
const syntheticDash = {
  data: {
    page: {
      widget_ids: [11, 12, 13, 99],
      data_sources: [{ data_source_id: 'src-1', data_type: 'kind-a', data_view_id: 'view-1' }],
      layouts: {
        left: {
          widgets: {
            11: {
              data_source_id: 'src-1',
              data_type: 'kind-a',
              data_view_id: 'view-1',
              type: 'line-chart',
              timegroup: 'x',
              metadata: {
                filter_set_id: 'fs-7',
                time_grouping: 'week',
                data_columns: { selected: [{ field: 'alpha' }, { field: 'beta' }], grouped: [{ field: 'gamma' }] },
              },
            },
          },
        },
        right: {
          widgets: {
            12: { type: 'table', metadata: { data_columns: { selected: [{ field: 'delta' }] } } },
            13: { type: 'counter', metadata: {} },
          },
        },
      },
    },
  },
};

const ypRules = (over: Partial<WidgetRules> = {}): WidgetRules => ({
  dashIdsFrom: 'dashId',
  endpointTemplate: { widget: 'widget-data' },
  widgetIdParam: 'widget_request',
  pageIdParam: 'widget_page_id',
  literals: { timegrouping: 'month' },
  queryFromWidget: {
    widget_type: { path: '$.type' },
    fields: { path: '$.metadata.data_columns.selected[].field', join: ',' },
    groupby: { path: '$.metadata.data_columns.grouped[].field', join: ',' },
    filter_set_id: { path: '$.metadata.filter_set_id' },
    timegrouping: { path: '$.metadata.time_grouping' },
  },
  ...over,
});
const juneRange = { key: '2026-06', start: '2026-06-01', end: '2026-06-30' };

test('widgetRequests reads query values from each widget definition, by the rules, and routes every widget to the one endpoint', () => {
  const out = widgetRequests(syntheticDash, '92', ypRules(), juneRange);
  assert.deepEqual(out.map((r) => [r.widgetId, r.kind, r.endpointId]), [['11', 'widget', 'widget-data'], ['12', 'widget', 'widget-data'], ['13', 'widget', 'widget-data'], ['99', 'widget', 'widget-data']]);
  assert.deepEqual(out[0]!.ids, { dashId: '92', widgetId: '11' });
  assert.deepEqual(out[0]!.query, {
    timegrouping: 'week',
    widget_type: 'line-chart',
    fields: 'alpha,beta',
    groupby: 'gamma',
    filter_set_id: 'fs-7',
    widget_request: '11',
    widget_page_id: '92',
  });
  // A path that finds nothing leaves the parameter out; the literal stays.
  assert.deepEqual(out[1]!.query, { timegrouping: 'month', widget_type: 'table', fields: 'delta', widget_request: '12', widget_page_id: '92' });
  assert.deepEqual(out[2]!.query, { timegrouping: 'month', widget_type: 'counter', widget_request: '13', widget_page_id: '92' });
  // A widget id with no definition still gets its literals and the two ids.
  assert.deepEqual(out[3]!.query, { timegrouping: 'month', widget_request: '99', widget_page_id: '92' });
  assert.equal(out[0]!.range, juneRange);
  assert.deepEqual(widgetRequests({}, '92', ypRules(), juneRange), []);
});

test('widgetRequests: the parameter names for the widget id and dashboard id come from the rules', () => {
  const out = widgetRequests(syntheticDash, '5', ypRules({ widgetIdParam: 'w', pageIdParam: 'p', queryFromWidget: {} }), juneRange);
  assert.deepEqual(out[0]!.query, { timegrouping: 'month', w: '11', p: '5' });
});

test('widgetRequests without join takes the first value, and the ids always win over a path of the same name', () => {
  const rules = ypRules({ queryFromWidget: { fields: { path: '$.metadata.data_columns.selected[].field' }, widget_request: { path: '$.type' } } });
  const out = widgetRequests(syntheticDash, '92', rules, juneRange);
  assert.equal(out[0]!.query.fields, 'alpha');
  assert.equal(out[0]!.query.widget_request, '11');
});

test('widgetRequests: the service and category routes are optional and used only when their path finds a value', () => {
  const rules = ypRules({
    endpointTemplate: { widget: 'w-plain', service: 'w-service', category: 'w-category' },
    serviceIdPath: '$.data_source_id',
    categoryIdPath: '$.data_view_id',
    queryFromWidget: {},
  });
  const dash = {
    data: {
      page: {
        widget_ids: [1, 2, 3],
        layouts: { a: { widgets: { 1: { data_source_id: 'svc', data_view_id: 'cat' }, 2: { data_view_id: 'cat' }, 3: { type: 't' } } } },
      },
    },
  };
  const out = widgetRequests(dash, '92', rules, juneRange);
  assert.deepEqual(out.map((r) => [r.widgetId, r.kind, r.endpointId]), [['1', 'service', 'w-service'], ['2', 'category', 'w-category'], ['3', 'widget', 'w-plain']]);
  assert.deepEqual(out[0]!.ids, { dashId: '92', widgetId: '1', serviceId: 'svc' });
  assert.deepEqual(out[1]!.ids, { dashId: '92', widgetId: '2', categoryId: 'cat' });
  // The same dashboard with the routes unset: everything is a plain widget.
  const plain = widgetRequests(dash, '92', ypRules({ queryFromWidget: {} }), juneRange);
  assert.deepEqual(plain.map((r) => [r.kind, r.endpointId]), [['widget', 'widget-data'], ['widget', 'widget-data'], ['widget', 'widget-data']]);
});

test('validatePlan checks widgetRules: endpoints exist, route templates have id paths, paths parse', () => {
  const withRules = (over: Record<string, unknown>) => {
    const p = basePlan();
    p.ids.dashId = { endpoint: 'jobs', path: '$.data[].id' };
    p.widgetRules = { dashIdsFrom: 'dashId', endpointTemplate: { widget: 'widgets-month' }, widgetIdParam: 'widget_request', pageIdParam: 'widget_page_id', literals: {}, ...over };
    return p;
  };
  assert.doesNotThrow(() => validatePlan(withRules({ queryFromWidget: { fields: { path: '$.a[].b', join: ',' } } })));
  const fails = (over: Record<string, unknown>, match: RegExp) => assert.throws(() => validatePlan(withRules(over)), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && match.test(e.message), String(match));
  fails({ endpointTemplate: { widget: 'ghost' } }, /unknown endpoint "ghost"/);
  fails({ endpointTemplate: { widget: 'widgets-month', service: 'account' } }, /needs widgetRules\.serviceIdPath/);
  fails({ queryFromWidget: { fields: { path: 'metadata.x' } } }, /unsupported JSON path "metadata\.x"/);
  fails({ serviceIdPath: 'nope' }, /unsupported JSON path "nope"/);
  fails({ widgetIdParam: undefined }, /widgetIdParam/);
});

test('buildUrl resolves { fromValue } from the supplied values, and says what is missing', () => {
  const raw = basePlan();
  raw.values = { acct: { literal: 'unused' } };
  raw.endpoints[2].query = { search: { fromValue: 'acct' }, q: 'x' };
  const plan = validatePlan(raw);
  const ep = plan.endpoints.find((e) => e.id === 'account')!;
  assert.equal(buildUrl(plan, ep, { ids: {}, values: { acct: 'v 1' } }), 'https://app.example.com/api/subscription?search=v%201&q=x');
  assert.throws(() => buildUrl(plan, ep, { ids: {} }), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && /needs value "acct"/.test(e.message));
  assert.deepEqual(valueNamesOf(ep), ['acct']);
});

test('validatePlan: fromValue must name a value, value rules are checked like header rules, value names are plain', () => {
  const fails = (mutate: (p: Record<string, any>) => void, match: RegExp) => {
    const p = basePlan();
    mutate(p);
    assert.throws(() => validatePlan(p), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && match.test(e.message), String(match));
  };
  fails((p) => (p.endpoints[2].query = { search: { fromValue: 'ghost' } }), /unknown value "ghost"/);
  fails((p) => (p.values = { v: { fromPageResponse: { origin: 'nowhere', urlPattern: 'x', path: '$.a' } } }), /value "v" captures from unknown origin "nowhere"/);
  fails((p) => (p.values = { v: { fromResponse: { endpoint: 'ghost', path: '$.a' } } }), /value "v" comes from unknown endpoint "ghost"/);
  fails((p) => (p.values = { 'bad name': { literal: 'x' } }), /value name "bad name"/);
});

test('validatePlan: header names are lowercase HTTP header names', () => {
  const fails = (name: string) => {
    const p = basePlan();
    p.headers[name] = { literal: 'x' };
    assert.throws(() => validatePlan(p), (e) => e instanceof CaptureError && e.code === 'plan-invalid' && /header name/.test(e.message), name);
  };
  for (const name of ['X-Requested-With', 'team_id', 'has space', '-lead', 'x:y', '']) fails(name);
  const ok = basePlan();
  ok.headers['x-requested-with'] = { literal: 'XMLHttpRequest' };
  ok.headers.authorization = { literal: 'x' };
  assert.doesNotThrow(() => validatePlan(ok));
});

test('planRun follows value rules: a fromResponse value pulls its source in first, and its origin gets a tab', () => {
  const raw = basePlan();
  raw.values = { acct: { fromResponse: { endpoint: 'account', path: '$.team.uid' } }, page: { fromPageResponse: { origin: 'api', urlPattern: 'auth', path: '$.uid' } } };
  raw.endpoints[0].query = { search: { fromValue: 'acct' }, other: { fromValue: 'page' } };
  const plan = validatePlan(raw);
  const order = orderEndpoints(plan).map((e) => e.id);
  assert.ok(order.indexOf('account') < order.indexOf('job-notes'));
  const run = planRun(plan, { only: ['job-notes'], perId: 'core', idsFrom: { jobId: ['1'] } });
  assert.deepEqual(run.silent.map((s) => [s.endpoint.id, s.mode]), [['account', 'first']]);
  assert.deepEqual([...run.origins].sort(), ['api', 'app']);
});

test('describePlan mentions every selected endpoint, its notes and an estimate', () => {
  const p = basePlan();
  p.endpoints[2].skip = 'quota';
  p.endpoints[2].expect404 = true;
  const plan = validatePlan(p);
  const selected = selectEndpoints(plan, { perId: 'full' });
  const text = describePlan(plan, selected, { perId: 'full', months: 24, knownCounts: { jobId: 1770 } });
  for (const ep of selected) assert.ok(text.includes(ep.id), `missing ${ep.id}`);
  assert.match(text, /\[lists\]/);
  assert.match(text, /skip: quota/);
  assert.match(text, /404 expected/);
  assert.match(text, /1770 jobId/);
  assert.match(text, /24 months/);
  assert.match(text, /GET \/api\/jobs {2}laravel-meta/);
  const unknown = describePlan(plan, selected, { perId: 'full', months: 24 });
  assert.match(unknown, /N jobId/);
});

test('sha256Hex hashes UTF-8 bytes', () => {
  assert.equal(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.notEqual(sha256Hex('é'), sha256Hex('e'));
});

test('planRun pulls an unselected id parent in as silent, and a fromResponse header source as first-page', () => {
  const plan = planOf();
  const only = planRun(plan, { only: ['job-notes'], perId: 'core' });
  assert.deepEqual(only.selected.map((e) => e.id), ['job-notes']);
  assert.deepEqual(only.silent.map((s) => [s.endpoint.id, s.mode]), [['jobs', 'ids'], ['account', 'first']]);
  assert.deepEqual([...only.origins].sort(), ['app']);
  // The caller supplies the ids: the parent is no longer needed for ids, only account for the header.
  const supplied = planRun(plan, { only: ['job-notes'], perId: 'core', idsFrom: { jobId: ['1'] } });
  assert.deepEqual(supplied.silent.map((s) => s.endpoint.id), ['account']);
  // A selected parent is not also silent.
  assert.deepEqual(planRun(plan, { only: ['job-notes', 'jobs', 'account'], perId: 'core' }).silent, []);
});

test('planRun rejects an unknown --only or --group, and an empty selection', () => {
  const plan = planOf();
  assert.throws(() => planRun(plan, { only: ['nope'], perId: 'core' }), (e) => e instanceof CaptureError && e.code === 'plan-invalid');
  assert.throws(() => planRun(plan, { groups: ['nope'], perId: 'core' }), (e) => e instanceof CaptureError && e.code === 'plan-invalid');
  assert.throws(() => planRun(plan, { only: ['widgets-month'], perId: 'core' }), (e) => e instanceof CaptureError && e.code === 'plan-invalid', 'full-only endpoint under core selects nothing');
});

test('planRun lists origins read by header rules and never pulls in a skipped parent', () => {
  const raw = basePlan();
  raw.endpoints.find((e: any) => e.id === 'jobs').skip = 'no list on this account';
  const plan = validatePlan(raw);
  const run = planRun(plan, { only: ['job-notes'], perId: 'core' });
  assert.deepEqual(run.silent.map((s) => s.endpoint.id), ['account']);
});
