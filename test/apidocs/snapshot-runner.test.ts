// The snapshot runner against the fixture site in a local Chromium (loopback only), as tour.test.ts does, plus a
// fake Fetcher for the widget flow. Nothing here touches a signed-in Chrome or the internet.

import assert from 'node:assert/strict';
import { existsSync, promises as fs } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { chromium, type BrowserContext, type Page } from 'playwright';
import { CaptureError } from '../../src/apidocs/errors.js';
import { PageFetcher, type AttachOptions, type FetchRequest, type FetchResult, type Fetcher } from '../../src/apidocs/snapshot/fetcher.js';
import { monthRanges, validatePlan } from '../../src/apidocs/snapshot/plan.js';
import { runSnapshot, type SnapshotRunOpts, type SnapshotSummary } from '../../src/apidocs/snapshot/runner.js';
import { SnapshotStore } from '../../src/apidocs/snapshot/store.js';
import { ManifestSchema, ProgressSchema, type SnapshotPlan, type SnapshotRow } from '../../src/apidocs/snapshot/types.js';
import { cursorTotal, dtTotal, flatTotal, pagedNototTotal, pagedTotal, startFixtureSite, type FixtureSite } from './fixtures/site.js';

const chromiumPath = (() => {
  try {
    return chromium.executablePath();
  } catch {
    return '';
  }
})();
const skipBrowser = chromiumPath && existsSync(chromiumPath) ? false : `Chromium is not installed (looked for "${chromiumPath}"); run: npx playwright install chromium`;

function availableLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

// ---- one Chromium for the file; each test gets its own fixture site, jobs dir and fetcher

let ctx: BrowserContext | undefined;
let page: Page | undefined;
let cdp = '';
let root = '';

before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-snapshot-'));
  if (skipBrowser) return;
  const port = await availableLoopbackPort();
  ctx = await chromium.launchPersistentContext(path.join(root, 'profile'), { headless: true, args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'] });
  page = ctx.pages()[0] ?? (await ctx.newPage());
  cdp = `http://127.0.0.1:${port}`;
});

after(async () => {
  await ctx?.close().catch(() => undefined);
  await fs.rm(root, { recursive: true, force: true });
});

interface Env {
  site: FixtureSite;
  jobs: string;
  plan(endpoints: Record<string, unknown>[], extra?: Record<string, unknown>): SnapshotPlan;
}

async function withSite(t: test.TestContext, fn: (env: Env) => Promise<void>): Promise<void> {
  const site = await startFixtureSite();
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-'));
  t.after(() => site.close());
  await page!.goto(site.url);
  const plan = (endpoints: Record<string, unknown>[], extra: Record<string, unknown> = {}): SnapshotPlan =>
    validatePlan({
      planVersion: 1,
      site: 'fixture',
      origins: { app: site.url },
      tabFor: { app: '127.0.0.1' },
      loginPaths: ['^/login'],
      probe: { app: '/api/probe' },
      headers: {},
      ids: {},
      endpoints,
      ...extra,
    });
  await fn({ site, jobs, plan });
}

const now = () => new Date('2026-11-06T12:00:00Z');
let runCounter = 0;
const nextRunId = () => `run-${++runCounter}`;

interface RunResult {
  summary?: SnapshotSummary;
  error?: unknown;
  lines: string[];
  runId: string;
  dir: string;
}

async function run(env: Env, plan: SnapshotPlan, over: Partial<SnapshotRunOpts> & { runId?: string; attach?: AttachOptions } = {}): Promise<RunResult> {
  const runId = over.runId ?? nextRunId();
  const { attach, runId: _ignored, ...rest } = over;
  const fetcher = await PageFetcher.attach(cdp, plan, attach);
  const store = rest.resume ? await SnapshotStore.resume(env.jobs, 'fixture', runId) : await SnapshotStore.create(env.jobs, 'fixture', runId, plan, now);
  const lines: string[] = [];
  const result: RunResult = { lines, runId, dir: store.dir };
  try {
    result.summary = await runSnapshot({ plan, site: 'fixture', runId, fetcher, store, perId: 'core', months: 3, now, sleep: async () => undefined, log: (l) => lines.push(l), ...rest });
  } catch (error) {
    result.error = error;
  } finally {
    await store.close();
    await fetcher.close();
  }
  return result;
}

async function ndjson<T>(dir: string, name: string): Promise<T[]> {
  try {
    const text = await fs.readFile(path.join(dir, name), 'utf8');
    return text.split('\n').filter(Boolean).map((l) => JSON.parse(l) as T);
  } catch {
    return [];
  }
}
const rowsOf = (dir: string, id: string) => ndjson<SnapshotRow>(dir, `${id}.ndjson`);
const records = (rows: SnapshotRow[]) => rows.filter((r) => r.record_index >= 0);
const envelopes = (rows: SnapshotRow[]) => rows.filter((r) => r.record_index === -1);
const distinct = (rows: SnapshotRow[]) => new Set(rows.map((r) => `${r.endpoint_id}|${r.page_key}|${r.record_index}`)).size;
const readManifest = async (dir: string) => ManifestSchema.parse(JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8')));
const readProgress = async (dir: string) => ProgressSchema.parse(JSON.parse(await fs.readFile(path.join(dir, 'progress.json'), 'utf8')));

const laravel = (id: string, path_: string, kind: 'laravel-meta' | 'laravel-flat', perPage: number, extra: Record<string, unknown> = {}) => ({
  id,
  origin: 'app',
  method: 'GET',
  path: path_,
  paginator: { kind, pageParam: 'page', perPageParam: 'per_page', perPage },
  records: '$.data',
  group: 'lists',
  ...extra,
});

// ---- paginators

test('paged, paged-notot, flat, cursor and datatables stop correctly and rows equal the stated totals', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan([
      laravel('paged', '/api/paged', 'laravel-meta', 15, { total: '$.meta.total' }),
      laravel('paged-notot', '/api/paged-notot', 'laravel-meta', 10),
      laravel('flat', '/api/flat', 'laravel-flat', 10, { total: '$.total' }),
      { id: 'cursor', origin: 'app', method: 'GET', path: '/api/cursor', paginator: { kind: 'cursor', cursorParam: 'cursor', nextPath: '$.meta.next_cursor' }, records: '$.data', group: 'lists' },
      { id: 'dt', origin: 'app', method: 'GET', path: '/api/dt', paginator: { kind: 'datatables', pageParam: 'page', length: 50, totalPath: '$.data.iTotalRecords', recordsPath: '$.data.aaData' }, records: '$.data.aaData', group: 'lists' },
    ]);
    const r = await run(env, plan);
    assert.equal(r.error, undefined, String(r.error));
    const s = r.summary!;
    assert.equal(s.status, 'complete', r.lines.join('\n'));
    assert.match(r.lines.at(-1)!, /^snapshot fixture run-\d+: endpoints planned 5 \/ complete 5 \/ partial 0 \/ failed 0; requests \d+ \(retries 0, 429s 0\); rows \d+; bytes \d+; totals matched 3 of 3; probe alive at end: yes; status complete$/);
    console.log(r.lines.at(-1));

    const paged = await rowsOf(r.dir, 'paged');
    assert.equal(records(paged).length, pagedTotal);
    assert.equal(envelopes(paged).length, 4, 'one raw envelope per page (57 rows at 15 per page)');
    assert.equal(paged[0]!.record_index, -1);
    assert.equal(paged[0]!.method, 'GET');
    assert.equal(paged[0]!.path_template, '/api/paged');
    assert.equal(paged[0]!.page_key, 'p=1');
    assert.ok((JSON.parse(paged[0]!.payload) as { meta: { total: number } }).meta.total === pagedTotal, 'the envelope payload is the raw response text');
    assert.deepEqual(JSON.parse(paged[1]!.payload), { id: 1, name: 'item 1' });
    assert.equal(paged[1]!.payload_sha256.length, 64);
    assert.equal(records(await rowsOf(r.dir, 'paged-notot')).length, pagedNototTotal);
    assert.equal(records(await rowsOf(r.dir, 'flat')).length, flatTotal);
    assert.equal(records(await rowsOf(r.dir, 'cursor')).length, cursorTotal);
    assert.equal(envelopes(await rowsOf(r.dir, 'cursor')).length, 3);
    assert.equal(records(await rowsOf(r.dir, 'dt')).length, dtTotal);
    assert.equal(envelopes(await rowsOf(r.dir, 'dt')).length, 3);

    const manifest = await readManifest(r.dir);
    assert.equal(manifest.status, 'complete');
    assert.equal(manifest.counts.probeAliveAtEnd, true);
    assert.equal(manifest.endpoints.paged!.total, pagedTotal);
    assert.equal(manifest.endpoints.paged!.pages, 4);
    assert.equal((await ndjson(r.dir, 'failures.ndjson')).length, 0);
    assert.ok(!page!.isClosed(), 'closing the fetcher leaves the person\'s browser and tab open');
    assert.equal(await page!.title(), 'fixture');
  });
});

// ---- per-id fan-out

const perIdEndpoints = [
  laravel('paged', '/api/paged', 'laravel-meta', 15, { total: '$.meta.total', yields: { thingId: '$.data[].id' } }),
  { id: 'things', origin: 'app', method: 'GET', path: '/api/things/{thingId}', pathParams: { thingId: { fromId: 'thingId' } }, paginator: { kind: 'none' }, group: 'per-id', perId: 'core' },
];
const perIdIds = { thingId: { endpoint: 'paged', path: '$.data[].id' } };

test('per-id things count equals the ids yielded, and --max-ids caps it', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan(perIdEndpoints, { ids: perIdIds });
    const all = await run(env, plan);
    assert.equal(all.summary?.status, 'complete', all.lines.join('\n'));
    const things = await rowsOf(all.dir, 'things');
    assert.equal(records(things).length, pagedTotal);
    assert.equal(envelopes(things).length, pagedTotal);
    assert.equal(new Set(records(things).map((r) => r.page_key)).size, pagedTotal, 'a page key per id');
    assert.ok(records(things).some((r) => r.page_key === 'id=1'));

    const capped = await run(env, plan, { maxIds: 5 });
    assert.equal(records(await rowsOf(capped.dir, 'things')).length, 5);
    assert.equal(capped.summary?.status, 'complete');
  });
});

test('--only on a child fetches its parent silently for the ids and writes none of the parent\'s rows', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan(perIdEndpoints, { ids: perIdIds });
    const r = await run(env, plan, { only: ['things'], maxIds: 5 });
    assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
    assert.equal((await rowsOf(r.dir, 'paged')).length, 0, 'no rows for the unselected parent');
    assert.equal(records(await rowsOf(r.dir, 'things')).length, 5);
    assert.equal(r.summary!.counts.endpointsPlanned, 1);
    assert.equal(r.summary!.counts.requests, 1 + 1 + 5 + 1, 'start probe, one parent page (enough ids for the cap), five details, end probe');
    assert.ok(r.lines.some((l) => l.startsWith('paged: fetched for ids only')));
    const progress = await readProgress(r.dir);
    assert.equal(progress.ids.thingId!.length, 5);
    assert.equal(progress.endpoints.paged!.acked.length, 0);

    // The caller supplies the ids: no parent request at all.
    const supplied = await run(env, plan, { only: ['things'], idsFrom: { thingId: ['3', '4'] } });
    assert.equal(supplied.summary!.counts.requests, 1 + 2 + 1);
    assert.deepEqual(records(await rowsOf(supplied.dir, 'things')).map((x) => x.page_key).sort(), ['id=3', 'id=4']);
  });
});

// ---- retries and failures

test('flaky answers 429 once: one retry, no failure', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan([{ id: 'flaky', origin: 'app', method: 'GET', path: '/api/flaky', paginator: { kind: 'none' }, group: 'misc' }]);
    const r = await run(env, plan);
    assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
    assert.equal(r.summary!.counts.retries, 1);
    assert.equal(r.summary!.counts.http429, 1);
    assert.equal((await ndjson(r.dir, 'failures.ndjson')).length, 0);
    assert.equal(records(await rowsOf(r.dir, 'flaky')).length, 1);
  });
});

test('a 500 endpoint yields one failure row after the retries and the run goes on, partial', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan([
      { id: 'err', origin: 'app', method: 'GET', path: '/api/err', paginator: { kind: 'none' }, group: 'misc' },
      laravel('paged', '/api/paged', 'laravel-meta', 15, { total: '$.meta.total' }),
    ]);
    const r = await run(env, plan);
    assert.equal(r.error, undefined, String(r.error));
    const s = r.summary!;
    assert.equal(s.status, 'partial');
    assert.equal(s.counts.retries, 3, 'snapshotRetryMax retries');
    assert.equal(s.counts.failed, 1);
    assert.equal(s.counts.complete, 1);
    assert.equal(s.endpoints.err!.state, 'failed');
    assert.equal(s.endpoints.paged!.state, 'complete');
    const failures = await ndjson<{ endpoint_id: string; status: number; error: string; record_index: null; payload_sha256: null }>(r.dir, 'failures.ndjson');
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.endpoint_id, 'err');
    assert.equal(failures[0]!.status, 500);
    assert.equal(failures[0]!.record_index, null);
    assert.equal(records(await rowsOf(r.dir, 'paged')).length, pagedTotal);
  });
});

test('a body over the cap is recorded too-large as a failure; small ones are kept', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan([
      { id: 'big', origin: 'app', method: 'GET', path: '/api/big', paginator: { kind: 'none' }, group: 'misc' },
      { id: 'team', origin: 'app', method: 'GET', path: '/api/team', paginator: { kind: 'none' }, group: 'misc' },
    ]);
    const r = await run(env, plan, { attach: { maxBytes: 100_000 } });
    assert.equal(r.summary?.status, 'partial', r.lines.join('\n'));
    const failures = await ndjson<{ endpoint_id: string; error: string }>(r.dir, 'failures.ndjson');
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.endpoint_id, 'big');
    assert.match(failures[0]!.error, /^too-large: \d+ characters/);
    assert.equal((await rowsOf(r.dir, 'big')).length, 0);
    assert.equal(records(await rowsOf(r.dir, 'team')).length, 1);
  });
});

test('a 404 on an expect404 endpoint is expected-404, not a failure', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const team = { id: 'team', origin: 'app', method: 'GET', path: '/api/team', paginator: { kind: 'none' }, group: 'misc' };
    const plan = env.plan([team, { ...perIdEndpoints[1]!, expect404: true }], { ids: { thingId: { endpoint: 'team', path: '$.team.id' } } });
    const r = await run(env, plan, { idsFrom: { thingId: ['999'] } });
    assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
    assert.equal(r.summary!.endpoints.things!.state, 'expected-404');
    assert.equal((await ndjson(r.dir, 'failures.ndjson')).length, 0);
    assert.equal((await rowsOf(r.dir, 'things')).length, 0);
  });
});

// ---- headers

const headerPlanParts = {
  headers: {
    'x-xsrf-token': { fromCookie: 'XSRF-TOKEN', origin: 'app', decode: 'uri' },
    'team-id': { fromResponse: { endpoint: 'team', path: '$.team.id' } },
  },
  endpoints: [
    { id: 'xsrf', origin: 'app', method: 'GET', path: '/api/xsrf', paginator: { kind: 'none' }, group: 'auth' },
    { id: 'team', origin: 'app', method: 'GET', path: '/api/team', paginator: { kind: 'none' }, group: 'auth' },
    { id: 'need-headers', origin: 'app', method: 'GET', path: '/api/need-headers', headers: ['x-xsrf-token', 'team-id'], dependsOn: ['xsrf'], paginator: { kind: 'none' }, records: '$.data', group: 'lists' },
  ],
};

test('headers derived from a cookie (uri-decoded) and an earlier response pass the 403 gate', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan(headerPlanParts.endpoints, { headers: headerPlanParts.headers });
    const r = await run(env, plan);
    assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
    const rows = records(await rowsOf(r.dir, 'need-headers'));
    assert.equal(rows.length, 1);
    assert.deepEqual(JSON.parse(rows[0]!.payload), { id: 1, team: 'team_1' });
    const everything = r.lines.join('\n') + (await fs.readFile(path.join(r.dir, 'manifest.json'), 'utf8')) + (await fs.readFile(path.join(r.dir, 'progress.json'), 'utf8'));
    assert.ok(!everything.includes('tok/+=abc') && !everything.includes('tok%2F'), 'the header value is in no log line, manifest or progress');
  });
});

test('without the headers the 403 is a failure row, not an abort, because the probe is alive', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const endpoints = headerPlanParts.endpoints.map((e) => (e.id === 'need-headers' ? { ...e, headers: [] } : e));
    const r = await run(env, env.plan(endpoints, { headers: headerPlanParts.headers }));
    assert.equal(r.error, undefined, String(r.error));
    assert.equal(r.summary!.status, 'partial');
    assert.equal(r.summary!.endpoints['need-headers']!.state, 'failed');
    const failures = await ndjson<{ status: number }>(r.dir, 'failures.ndjson');
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.status, 403);
  });
});

test('an unresolvable header fails only the dependent endpoint with a clear failure row', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    // The fixture never sets a cookie named NOPE.
    const headers = { 'x-xsrf-token': { fromCookie: 'NOPE', origin: 'app' } };
    const endpoints = [
      { id: 'team', origin: 'app', method: 'GET', path: '/api/team', paginator: { kind: 'none' }, group: 'auth' },
      { id: 'need-headers', origin: 'app', method: 'GET', path: '/api/need-headers', headers: ['x-xsrf-token'], paginator: { kind: 'none' }, group: 'lists' },
    ];
    const r = await run(env, env.plan(endpoints, { headers }));
    assert.equal(r.summary!.endpoints.team!.state, 'complete');
    assert.equal(r.summary!.endpoints['need-headers']!.state, 'failed');
    const failures = await ndjson<{ error: string; page_key: string }>(r.dir, 'failures.ndjson');
    assert.equal(failures.length, 1);
    assert.equal(failures[0]!.page_key, 'headers');
    assert.match(failures[0]!.error, /cookie "NOPE" is not readable/);
  });
});

// ---- ranges

test('a ranged endpoint makes one request series per month window', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan([{ id: 'range', origin: 'app', method: 'GET', path: '/api/range', range: { startParam: 'start', endParam: 'end', format: 'iso-date', months: 3 }, paginator: { kind: 'none' }, records: '$.data', group: 'monthly' }]);
    const r = await run(env, plan);
    assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
    const rows = records(await rowsOf(r.dir, 'range')).sort((a, b) => a.page_key.localeCompare(b.page_key)); // two series run at once
    const windows = monthRanges(now(), 3);
    assert.deepEqual(rows.map((x) => x.page_key), windows.map((w) => `r=${w.key}`));
    assert.deepEqual(rows.map((x) => JSON.parse(x.payload)), windows.map((w) => ({ start: w.start, end: w.end })));
    assert.equal(windows.at(-1)!.end, '2026-11-06', 'the current month ends today');
  });
});

// ---- expiry and resume

test('session expiry mid-run aborts with session-expired; a resume fetches only the rest and converges', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    const plan = env.plan(perIdEndpoints, { ids: perIdIds });
    // start probe (1) + 4 paged pages + 6 details answer normally; the next /api/* answers 401.
    await fetch(`${env.site.url}/api/expire-arm?after=11`);
    const first = await run(env, plan, { runId: 'expiring' });
    assert.ok(first.error instanceof CaptureError, String(first.error));
    assert.equal((first.error as CaptureError).code, 'session-expired');
    assert.match((first.error as CaptureError).fix ?? '', /sign in again in the Chrome, then rerun with --resume expiring/);
    assert.ok(first.lines.at(-1)!.startsWith('snapshot fixture expiring:'), first.lines.at(-1));
    assert.match(first.lines.at(-1)!, /status aborted$/);

    const aborted = await readManifest(first.dir);
    assert.equal(aborted.status, 'aborted');
    assert.equal(aborted.reason, 'session-expired');
    assert.equal(aborted.counts.probeAliveAtEnd, false);
    const progress = await readProgress(first.dir);
    assert.equal(progress.endpoints.paged!.status, 'complete');
    assert.equal(progress.endpoints.paged!.acked.length, 4);
    const acked = progress.endpoints.things!.acked.length;
    assert.ok(acked >= 4 && acked < pagedTotal, `some details acked before the expiry: ${acked}`);
    assert.equal(progress.ids.thingId!.length, pagedTotal, 'ids are persisted, so a resume does not refetch the parent');
    assert.equal(distinct(await rowsOf(first.dir, 'things')), (await rowsOf(first.dir, 'things')).length, 'no duplicate lines before the resume');

    await fetch(`${env.site.url}/api/expire-reset`);
    const second = await run(env, plan, { runId: 'expiring', resume: true });
    assert.equal(second.error, undefined, String(second.error));
    const s = second.summary!;
    assert.equal(s.status, 'complete', second.lines.join('\n'));
    assert.equal(s.counts.requests - aborted.counts.requests, 1 + (pagedTotal - acked) + 1, 'start probe, only the details not yet acked, end probe');
    assert.ok(second.lines.some((l) => l.startsWith('paged: already complete, skipped on resume')));

    const things = await rowsOf(second.dir, 'things');
    assert.equal(distinct(things), things.length, 'a clean resume leaves no duplicates');
    assert.equal(records(things).length, pagedTotal);
    assert.equal(distinct(await rowsOf(second.dir, 'paged')), (await rowsOf(second.dir, 'paged')).length);
    assert.equal(records(await rowsOf(second.dir, 'paged')).length, pagedTotal);
    await assert.rejects(SnapshotStore.resume(env.jobs, 'fixture', 'expiring'), /already complete/);
  });
});

test('a dead start probe aborts before any endpoint row is written', { skip: skipBrowser }, async (t) => {
  await withSite(t, async (env) => {
    await fetch(`${env.site.url}/api/expire-arm?after=0`);
    const r = await run(env, env.plan(perIdEndpoints, { ids: perIdIds }));
    assert.ok(r.error instanceof CaptureError);
    assert.equal((r.error as CaptureError).code, 'session-expired');
    assert.equal((await rowsOf(r.dir, 'paged')).length, 0);
    assert.equal(existsSync(path.join(r.dir, 'paged.ndjson')), false);
    assert.equal((await readManifest(r.dir)).status, 'aborted');
  });
});

// ---- widgets (fake fetcher: no browser)

interface FakeOpts {
  /** Cookies by name (raw, as document.cookie would hold them). */
  cookies?: Record<string, string>;
  /** Values pageResponseValue answers, by JSON path. */
  pageValues?: Record<string, string>;
  /** alive() turns false once this many requests were made. */
  aliveFor?: number;
}

class FakeFetcher implements Fetcher {
  readonly urls: string[] = [];
  readonly seen: { url: string; headers: Record<string, string> }[] = [];
  readonly pageCalls: string[] = [];
  constructor(
    private readonly respond: (url: URL) => { status?: number; body: unknown },
    private readonly opts: FakeOpts = {},
  ) {}
  async fetch(req: FetchRequest): Promise<FetchResult> {
    this.urls.push(req.url);
    this.seen.push({ url: req.url, headers: { ...req.headers } });
    const { status = 200, body } = this.respond(new URL(req.url));
    return { status, url: req.url, contentType: 'application/json', text: JSON.stringify(body) };
  }
  async cookie(_origin: string, name: string): Promise<string | undefined> {
    return this.opts.cookies?.[name];
  }
  async pageResponseValue(_origin: string, _pattern: RegExp, path: string): Promise<string | undefined> {
    this.pageCalls.push(path);
    return this.opts.pageValues?.[path];
  }
  async storageValue(): Promise<string | undefined> {
    return undefined;
  }
  async storageKeys(): Promise<{ local: string[]; session: string[] }> {
    return { local: [], session: [] };
  }
  alive(): boolean {
    return this.opts.aliveFor === undefined || this.urls.length < this.opts.aliveFor;
  }
  async close(): Promise<void> {}
}

const fakePlan = (extra: Record<string, unknown>, endpoints: Record<string, unknown>[]): SnapshotPlan =>
  validatePlan({
    planVersion: 1,
    site: 'fixture',
    origins: { api: 'https://api.example.test' },
    tabFor: { api: 'api.example.test' },
    loginPaths: ['^/login'],
    probe: { api: '/probe' },
    headers: {},
    ids: {},
    ...extra,
    endpoints,
  });

async function runFake(plan: SnapshotPlan, fetcher: FakeFetcher, over: Partial<SnapshotRunOpts> & { runId: string; jobs?: string } = { runId: 'fake' }): Promise<{ summary?: SnapshotSummary; error?: unknown; lines: string[]; dir: string }> {
  const { jobs: jobsOver, runId, ...rest } = over;
  const jobs = jobsOver ?? (await fs.mkdtemp(path.join(root, 'jobs-fake-')));
  const store = rest.resume ? await SnapshotStore.resume(jobs, 'fixture', runId) : await SnapshotStore.create(jobs, 'fixture', runId, plan, now);
  const lines: string[] = [];
  const out: { summary?: SnapshotSummary; error?: unknown; lines: string[]; dir: string } = { lines, dir: store.dir };
  try {
    out.summary = await runSnapshot({ plan, site: 'fixture', runId, fetcher, store, perId: 'core', months: 2, now, sleep: async () => undefined, log: (l) => lines.push(l), ...rest });
  } catch (error) {
    out.error = error;
  } finally {
    await store.close();
  }
  return out;
}

test('widget requests are derived from each dashboard and fetched for every month, with dash, widget and month in the page key', async () => {
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-widgets-'));
  const plan = validatePlan({
    planVersion: 1,
    site: 'fixture',
    origins: { api: 'https://api.example.test' },
    tabFor: { api: 'api.example.test' },
    loginPaths: ['^/login'],
    probe: { api: '/probe' },
    headers: {},
    ids: { dashId: { endpoint: 'dash-list', path: '$.data[].id' } },
    widgetRules: {
      dashIdsFrom: 'dashId',
      endpointTemplate: { widget: 'widget-data', service: 'service-data', category: 'category-data' },
      serviceIdPath: '$.service_id',
      categoryIdPath: '$.category_id',
      widgetIdParam: 'wid',
      pageIdParam: 'pid',
      literals: { timegrouping: 'month' },
      queryFromWidget: { metric: { path: '$.metric' } },
    },
    endpoints: [
      { id: 'dash-list', origin: 'api', method: 'GET', path: '/dashboards', paginator: { kind: 'none' }, records: '$.data', group: 'dash' },
      { id: 'dash', origin: 'api', method: 'GET', path: '/dash/{dashId}', paginator: { kind: 'none' }, group: 'dash' },
      { id: 'widget-data', origin: 'api', method: 'GET', path: '/w/{widgetId}', range: { startParam: 'from', endParam: 'to', format: 'iso-date', months: 2 }, paginator: { kind: 'none' }, group: 'widgets' },
      { id: 'service-data', origin: 'api', method: 'GET', path: '/s/{serviceId}/w/{widgetId}', range: { startParam: 'from', endParam: 'to', format: 'iso-date', months: 2 }, paginator: { kind: 'none' }, group: 'widgets' },
      { id: 'category-data', origin: 'api', method: 'GET', path: '/c/{categoryId}', range: { startParam: 'from', endParam: 'to', format: 'iso-date', months: 2 }, paginator: { kind: 'none' }, group: 'widgets' },
    ],
  });
  const dash = (id: string) => ({ data: { page: { widget_ids: [`${id}a`, `${id}b`], layouts: { main: { widgets: { [`${id}a`]: { metric: 'views' }, [`${id}b`]: { service_id: 's9' } } } } } } });
  const fetcher = new FakeFetcher((u) => {
    if (u.pathname === '/probe') return { body: { ok: true } };
    if (u.pathname === '/dashboards') return { body: { data: [{ id: 'd1' }, { id: 'd2' }] } };
    const d = /^\/dash\/(.+)$/.exec(u.pathname);
    if (d) return { body: dash(d[1]!) };
    return { body: { value: u.pathname } };
  });
  const store = await SnapshotStore.create(jobs, 'fixture', 'widgets', plan, now);
  const lines: string[] = [];
  const summary = await runSnapshot({ plan, site: 'fixture', runId: 'widgets', fetcher, store, perId: 'core', months: 2, now, sleep: async () => undefined, log: (l) => lines.push(l) });
  await store.close();
  assert.equal(summary.status, 'complete', lines.join('\n'));
  const widget = records(await rowsOf(store.dir, 'widget-data'));
  assert.deepEqual(widget.map((r) => r.page_key).sort(), ['d=d1&w=d1a&id=d1a&r=2026-10', 'd=d1&w=d1a&id=d1a&r=2026-11', 'd=d2&w=d2a&id=d2a&r=2026-10', 'd=d2&w=d2a&id=d2a&r=2026-11']);
  const service = records(await rowsOf(store.dir, 'service-data'));
  assert.equal(service.length, 4, 'two dashboards x two months');
  assert.equal((await rowsOf(store.dir, 'category-data')).length, 0, 'no category widgets, no requests');
  assert.ok(fetcher.urls.some((u) => /\/w\/d1a\?.*timegrouping=month/.test(u) && /metric=views/.test(u) && /wid=d1a&pid=d1/.test(u) && /from=2026-10-01&to=2026-10-31/.test(u)), fetcher.urls.join('\n'));
  assert.equal(summary.endpoints['widget-data']!.state, 'complete');
  assert.equal(summary.endpoints['category-data']!.state, 'complete');
  assert.equal(summary.counts.endpointsPlanned, 5);
});

// ---- fixes from the first review (fake fetcher: no browser)

test('probes carry the literal and cookie headers of the origin, never a header that needs a later response', async () => {
  const headers = {
    'x-requested-with': { literal: 'XMLHttpRequest' },
    'x-xsrf-token': { fromCookie: 'XSRF-TOKEN', origin: 'api', decode: 'uri' },
    'team-id': { fromResponse: { endpoint: 'acct', path: '$.team.id' } },
  };
  const endpoints = [
    { id: 'acct', origin: 'api', method: 'GET', path: '/acct', headers: ['x-requested-with', 'x-xsrf-token'], paginator: { kind: 'none' }, group: 'g' },
    { id: 'teamy', origin: 'api', method: 'GET', path: '/teamy', headers: ['x-requested-with', 'x-xsrf-token', 'team-id'], paginator: { kind: 'none' }, group: 'g' },
  ];
  const respond = (u: URL) => ({ body: u.pathname === '/acct' ? { team: { id: 't1' } } : { ok: true } });
  const fetcher = new FakeFetcher(respond, { cookies: { 'XSRF-TOKEN': 'tok%2F1' } });
  const r = await runFake(fakePlan({ headers }, endpoints), fetcher, { runId: 'probe-headers' });
  assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
  const probes = fetcher.seen.filter((x) => new URL(x.url).pathname === '/probe');
  assert.equal(probes.length, 2, 'start and end');
  for (const p of probes) assert.deepEqual(p.headers, { 'x-requested-with': 'XMLHttpRequest', 'x-xsrf-token': 'tok/1' });
  assert.equal(fetcher.seen.find((x) => x.url.endsWith('/teamy'))!.headers['team-id'], 't1', 'the endpoint itself still gets the late header');

  // A cookie that cannot be read is left off the probe; the literal still goes.
  const bare = new FakeFetcher(respond, {});
  const r2 = await runFake(fakePlan({ headers }, endpoints.slice(0, 1)), bare, { runId: 'probe-headers-2' });
  assert.ok(r2.error instanceof Error || r2.summary, 'the run ends either way');
  assert.deepEqual(bare.seen.find((x) => new URL(x.url).pathname === '/probe')!.headers, { 'x-requested-with': 'XMLHttpRequest' });
});

test('named values reach the request URL only: one page-response source can serve a header and a query value', async () => {
  const source = { fromPageResponse: { origin: 'api', urlPattern: 'authenticate', path: '$.data.uid' } };
  const plan = fakePlan(
    { headers: { authorization: { fromPageResponse: { origin: 'api', urlPattern: 'authenticate', path: '$.data.securityToken' } } }, values: { acctUid: source } },
    [{ id: 'acct', origin: 'api', method: 'GET', path: '/acct', query: { search: { fromValue: 'acctUid' } }, headers: ['authorization'], paginator: { kind: 'none' }, group: 'g' }],
  );
  const fetcher = new FakeFetcher(() => ({ body: { data: { ok: 1 } } }), { pageValues: { '$.data.uid': 'uid-synthetic-1', '$.data.securityToken': 'token-synthetic-1' } });
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-values-'));
  const r = await runFake(plan, fetcher, { runId: 'values', jobs });
  assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
  const call = fetcher.seen.find((x) => new URL(x.url).pathname === '/acct')!;
  assert.equal(new URL(call.url).searchParams.get('search'), 'uid-synthetic-1');
  assert.equal(call.headers.authorization, 'token-synthetic-1');
  assert.deepEqual([...fetcher.pageCalls].sort(), ['$.data.securityToken', '$.data.uid']);
  const rows = await rowsOf(r.dir, 'acct');
  assert.ok(rows[0]!.url.includes('search=uid-synthetic-1'), 'the row records the URL it requested');
  const elsewhere = r.lines.join('\n') + (await fs.readFile(path.join(r.dir, 'manifest.json'), 'utf8')) + (await fs.readFile(path.join(r.dir, 'progress.json'), 'utf8'));
  assert.ok(!elsewhere.includes('uid-synthetic-1') && !elsewhere.includes('token-synthetic-1'), 'no log line, manifest or progress holds a value');
  assert.equal(rows[0]!.page_key, 'all', 'the page key never holds a value');
});

test('a named value that cannot be resolved fails only the endpoints that use it, with a failure row', async () => {
  const plan = fakePlan(
    { values: { acctUid: { fromPageResponse: { origin: 'api', urlPattern: 'authenticate', path: '$.data.uid' } } } },
    [
      { id: 'needs-value', origin: 'api', method: 'GET', path: '/n', query: { search: { fromValue: 'acctUid' } }, paginator: { kind: 'none' }, group: 'g' },
      { id: 'plain', origin: 'api', method: 'GET', path: '/p', paginator: { kind: 'none' }, group: 'g' },
    ],
  );
  const r = await runFake(plan, new FakeFetcher(() => ({ body: { ok: 1 } })), { runId: 'value-missing' });
  assert.equal(r.summary?.status, 'partial');
  assert.equal(r.summary!.endpoints['needs-value']!.state, 'failed');
  assert.equal(r.summary!.endpoints.plain!.state, 'complete');
  const failures = await ndjson<{ error: string; page_key: string }>(r.dir, 'failures.ndjson');
  assert.equal(failures.length, 1);
  assert.match(failures[0]!.error, /^value "acctUid": the page made no response matching/);
});

test('a server that ignores the page parameter ends the series with a "page param ignored" failure, not a loop', async () => {
  const same = { data: [{ id: 1 }, { id: 2 }], meta: { total: 5 } };
  for (const kind of ['laravel-meta', 'laravel-flat'] as const) {
    const body = kind === 'laravel-meta' ? same : { data: same.data, total: 5 };
    const plan = fakePlan({}, [{ id: 'list', origin: 'api', method: 'GET', path: '/list', paginator: { kind, pageParam: 'page' }, records: '$.data', total: kind === 'laravel-meta' ? '$.meta.total' : '$.total', group: 'g' }]);
    const fetcher = new FakeFetcher(() => ({ body }));
    const r = await runFake(plan, fetcher, { runId: `ignored-${kind}` });
    assert.equal(r.summary?.status, 'partial', r.lines.join('\n'));
    assert.equal(r.summary!.endpoints.list!.state, 'partial');
    assert.equal(r.summary!.counts.requests, 4, 'start probe, page 1, page 2 (the repeat), end probe');
    const failures = await ndjson<{ error: string; page_key: string; endpoint_id: string }>(r.dir, 'failures.ndjson');
    assert.deepEqual(failures.map((x) => [x.endpoint_id, x.page_key, x.error]), [['list', 'p=2', 'page param ignored']]);
    assert.equal(records(await rowsOf(r.dir, 'list')).length, 2, 'only page 1 is written');
    assert.equal(r.summary!.counts.totalsStated, 0, 'an incomplete series states no total');
  }
});

test('a present, null links.next ends a Laravel series without an extra empty request', async () => {
  const plan = fakePlan({}, [{ id: 'list', origin: 'api', method: 'GET', path: '/list', paginator: { kind: 'laravel-meta', pageParam: 'page' }, records: '$.data', group: 'g' }]);
  const fetcher = new FakeFetcher((u) => (u.searchParams.get('page') === '1' ? { body: { data: [{ id: 1 }], links: { next: 'https://x.test/list?page=2' } } } : { body: { data: [{ id: 2 }], links: { next: null } } }));
  const r = await runFake(plan, fetcher, { runId: 'links-next' });
  assert.equal(r.summary?.status, 'complete', r.lines.join('\n'));
  assert.equal(r.summary!.counts.requests, 4, 'start probe, two pages, end probe');
  assert.equal(records(await rowsOf(r.dir, 'list')).length, 2);
});

test('a resume does not count acked series twice in the totals', async () => {
  const plan = fakePlan({ ids: { itemId: { endpoint: 'one', path: '$.none', fallbackLiterals: ['a', 'b', 'c'] } } }, [
    { id: 'one', origin: 'api', method: 'GET', path: '/one', paginator: { kind: 'none' }, records: '$.data', total: '$.total', group: 'g' },
    { id: 'two', origin: 'api', method: 'GET', path: '/two/{itemId}', paginator: { kind: 'none' }, records: '$.data', total: '$.total', group: 'g', perId: 'core' },
  ]);
  const respond = () => ({ body: { data: [{ id: 1 }], total: 1 } });
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-resume-totals-'));
  // start probe, "one", then two series of "two" answer; the browser is gone before the third.
  const first = await runFake(plan, new FakeFetcher(respond, { aliveFor: 4 }), { runId: 'resume-totals', jobs });
  assert.ok(first.error instanceof CaptureError, String(first.error));
  assert.equal((first.error as CaptureError).code, 'browser-closed');
  const aborted = await readManifest(first.dir);
  assert.equal(aborted.counts.totalsStated, 3, 'one + two series of "two"');
  const acked = (await readProgress(first.dir)).endpoints.two!.acked.length;
  assert.equal(acked, 2);

  const second = await runFake(plan, new FakeFetcher(respond), { runId: 'resume-totals', jobs, resume: true });
  assert.equal(second.error, undefined, String(second.error));
  assert.equal(second.summary!.status, 'complete', second.lines.join('\n'));
  assert.equal(second.summary!.counts.totalsStated, 4, 'one + three series of "two", each once');
  assert.equal(second.summary!.counts.totalsMatched, 4);
  assert.match(second.summary!.line, /totals matched 4 of 4/);
  const progress = await readProgress(second.dir);
  assert.deepEqual(progress.endpoints.one!.totals, { stated: 1, matched: 1 });
  assert.deepEqual(progress.endpoints.two!.totals, { stated: 3, matched: 3 });

  // A second resume of a finished endpoint keeps its stored contribution instead of dropping or doubling it.
  const raw = JSON.parse(await fs.readFile(path.join(second.dir, 'manifest.json'), 'utf8')) as { status: string };
  assert.equal(raw.status, 'complete');
});

test('a resume that replays acked dashboard pages for their bodies still counts each series once', async () => {
  const plan = fakePlan(
    {
      ids: { dashId: { endpoint: 'dash-list', path: '$.data[].id' } },
      widgetRules: { dashIdsFrom: 'dashId', endpointTemplate: { widget: 'widget-data' }, widgetIdParam: 'wid', pageIdParam: 'pid', literals: {} },
    },
    [
      { id: 'dash-list', origin: 'api', method: 'GET', path: '/list', paginator: { kind: 'none' }, records: '$.data', group: 'g' },
      { id: 'dash', origin: 'api', method: 'GET', path: '/dash/{dashId}', paginator: { kind: 'none' }, total: '$.total', group: 'g' },
      { id: 'widget-data', origin: 'api', method: 'GET', path: '/w/{widgetId}', range: { param: 'daterange', format: 'daterange-pipe', months: 1 }, paginator: { kind: 'none' }, group: 'w' },
    ],
  );
  const respond = (u: URL) => {
    if (u.pathname === '/list') return { body: { data: [{ id: 'd1' }, { id: 'd2' }] } };
    if (u.pathname.startsWith('/dash/')) return { body: { total: 1, data: { page: { widget_ids: ['w1'], layouts: { main: { widgets: { w1: {} } } } } } } };
    return { body: { value: 1 } };
  };
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-replay-totals-'));
  // start probe, the list, both dashboards answer; the browser is gone before the first widget request.
  const first = await runFake(plan, new FakeFetcher(respond, { aliveFor: 4 }), { runId: 'replay-totals', jobs });
  assert.equal((first.error as CaptureError | undefined)?.code, 'browser-closed', String(first.error));
  assert.equal((await readManifest(first.dir)).counts.totalsStated, 2);

  const second = await runFake(plan, new FakeFetcher(respond), { runId: 'replay-totals', jobs, resume: true });
  assert.equal(second.summary?.status, 'complete', second.lines.join('\n'));
  assert.equal(second.summary!.counts.totalsStated, 2, 'the replayed dashboards are not counted a second time');
  assert.equal(second.summary!.counts.totalsMatched, 2);
});

// ---- the page fetcher's capture cache (a stand-in tab: no browser)

test('pageResponseValue reloads the tab once for two values of the same response, and does not cache a miss', async () => {
  class StandInPage {
    reloads = 0;
    private readonly handlers = new Set<(r: { url(): string; json(): Promise<unknown> }) => Promise<void>>();
    on(_event: string, h: (r: { url(): string; json(): Promise<unknown> }) => Promise<void>): void {
      this.handlers.add(h);
    }
    off(_event: string, h: (r: { url(): string; json(): Promise<unknown> }) => Promise<void>): void {
      this.handlers.delete(h);
    }
    async reload(): Promise<void> {
      this.reloads += 1;
      for (const h of [...this.handlers]) {
        await h({ url: () => 'https://api.example.test/app-services/authenticate', json: async () => ({ data: { uid: 'uid-synthetic-2', securityToken: 'token-synthetic-2' } }) });
      }
    }
  }
  const tab = new StandInPage();
  const Ctor = PageFetcher as unknown as new (browser: unknown, pages: Map<string, unknown>, maxBytes: number, timeoutMs: number) => PageFetcher;
  const fetcher = new Ctor({ isConnected: () => true }, new Map([['api', tab]]), 1_000, 20);
  const pattern = /app-services\/authenticate/;
  const [token, uid] = await Promise.all([fetcher.pageResponseValue('api', pattern, '$.data.securityToken'), fetcher.pageResponseValue('api', pattern, '$.data.uid')]);
  assert.equal(token, 'token-synthetic-2');
  assert.equal(uid, 'uid-synthetic-2');
  assert.equal(await fetcher.pageResponseValue('api', pattern, '$.data.uid'), 'uid-synthetic-2');
  assert.equal(await fetcher.pageResponseValue('api', pattern, '$.data.missing'), undefined, 'a missing path is undefined, from the cached body');
  assert.equal(tab.reloads, 1, 'one reload served every read');

  assert.equal(await fetcher.pageResponseValue('api', /no-such-request/, '$.x'), undefined);
  assert.equal(await fetcher.pageResponseValue('api', /no-such-request/, '$.x'), undefined);
  assert.equal(tab.reloads, 3, 'a miss is not cached: each ask reloads again');
});

// ---- the store on its own (no browser)

test('the store acks a page only after its rows are appended, and concurrent acks all land in progress.json', async () => {
  const jobs = await fs.mkdtemp(path.join(root, 'jobs-store-'));
  const plan = validatePlan({
    planVersion: 1,
    site: 'fixture',
    origins: { app: 'http://127.0.0.1:1' },
    tabFor: { app: '127.0.0.1' },
    loginPaths: [],
    probe: { app: '/probe' },
    headers: {},
    ids: {},
    endpoints: [{ id: 'a', origin: 'app', method: 'GET', path: '/a', paginator: { kind: 'none' }, group: 'g' }],
  });
  const store = await SnapshotStore.create(jobs, 'fixture', 'store-1', plan, now);
  await assert.rejects(SnapshotStore.create(jobs, 'fixture', 'store-1', plan, now), /already exists/);
  const row = (page: string, index: number, payload: string): SnapshotRow => ({
    run_id: 'store-1',
    site: 'fixture',
    endpoint_id: 'a',
    method: 'GET',
    path_template: '/a',
    url: 'http://x/a',
    fetched_at: now().toISOString(),
    status: 200,
    page_key: page,
    record_index: index,
    payload,
    payload_sha256: '0'.repeat(64),
  });
  await store.appendRows('a', [row('p=1', -1, '{"data":[1,2]}'), row('p=1', 0, '1'), row('p=1', 1, '2')]);
  assert.equal((await readProgress(store.dir)).endpoints.a!.acked.length, 0, 'rows are on disk but the page is not acked yet');
  assert.equal(store.isAcked('a', 'p=1'), false);
  await Promise.all(Array.from({ length: 25 }, (_, i) => store.ack('a', `p=${i + 1}`, { addRows: 1 })));
  const progress = await readProgress(store.dir);
  assert.equal(progress.endpoints.a!.acked.length, 25);
  assert.equal(progress.endpoints.a!.rows, 25);
  assert.equal(store.isAcked('a', 'p=1'), true);

  // A crash between fsync and ack: the page is appended twice, and the loader dedupes on (endpoint, page_key, record_index).
  await store.appendRows('a', [row('p=1', -1, '{"data":[1,2]}'), row('p=1', 0, '1'), row('p=1', 1, '2')]);
  assert.equal(await store.countRecords('a', () => true), 2, 'duplicate lines count once');
  assert.equal(await store.countRecords('a', (k) => k === 'p=2'), 0);
  assert.equal(await store.readEnvelope('a'), '{"data":[1,2]}');
  assert.equal(await store.readEnvelope('a', 'p=9'), undefined);

  await store.recordIds('jobId', ['1', '2', '2']);
  await store.recordIds('jobId', ['3', '1']);
  assert.deepEqual((await readProgress(store.dir)).ids.jobId, ['1', '2', '3']);
  await store.close();

  const reopened = await SnapshotStore.resume(jobs, 'fixture', 'store-1');
  assert.equal(reopened.isAcked('a', 'p=25'), true);
  assert.deepEqual(reopened.idsOf('jobId'), ['1', '2', '3']);
  await reopened.writeManifest({ ...reopened.manifest, status: 'complete' });
  await reopened.close();
  await assert.rejects(SnapshotStore.resume(jobs, 'fixture', 'store-1'), /already complete/);
  await assert.rejects(SnapshotStore.resume(jobs, 'fixture', 'no-such-run'), /no run no-such-run/);
});
