import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { CaptureError } from '../../src/apidocs/errors.js';
import { assemble, inScope, listTraces, newRunId, pruneTraces, readTrace, tracePathFor } from '../../src/apidocs/trace.js';
import type { ReadTraceResult } from '../../src/apidocs/trace.js';
import type { ExchangeId, RunId, SessionId, SiteId, Trace, TraceLine } from '../../src/apidocs/types.js';
import { TraceLineSchema } from '../../src/apidocs/types.js';

const fixture = path.join(import.meta.dirname, 'fixtures', 'trace-sample.jsonl');
const site = 'example-app' as SiteId;

async function fixtureTrace(): Promise<Trace> {
  return assemble(await readTrace(fixture));
}

function exchange(trace: Trace, id: string) {
  const ex = trace.exchanges.find((e) => e.id === id);
  assert.ok(ex, `exchange ${id} not found in ${trace.exchanges.map((e) => e.id).join(', ')}`);
  return ex;
}

async function tmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-trace-'));
}

test('every good line of the fixture passes TraceLineSchema; exactly one line is malformed', async () => {
  const raw = (await fs.readFile(fixture, 'utf8')).split('\n').filter((l) => l.trim() !== '');
  const failures: string[] = [];
  for (const [i, l] of raw.entries()) {
    let json: unknown;
    try {
      json = JSON.parse(l);
    } catch {
      failures.push(`line ${i + 1}: not JSON`);
      continue;
    }
    const r = TraceLineSchema.safeParse(json);
    if (!r.success) failures.push(`line ${i + 1}: schema`);
  }
  assert.deepEqual(failures, ['line 38: not JSON']);
  assert.ok(raw.length >= 20 && raw.length <= 40, `fixture has ${raw.length} lines`);
});

test('readTrace keeps the bad line, reports no truncated tail', async () => {
  const r = await readTrace(fixture);
  assert.equal(r.truncatedTail, false);
  assert.equal(r.lines.length, 40);
  const bad = r.lines.filter((l) => l.kind === 'bad');
  assert.equal(bad.length, 1);
  assert.equal(bad[0]!.kind === 'bad' && bad[0]!.seq, -38); // unparseable: its file line number
  assert.equal(r.lines[0]!.kind, 'run');
});

test('readTrace errors: missing file, first line not a run line, unknown traceVersion', async () => {
  const dir = await tmpDir();
  await assert.rejects(readTrace(path.join(dir, 'nope.jsonl')), (e: unknown) => e instanceof CaptureError && e.code === 'trace-unreadable');

  const notRun = path.join(dir, 'a.jsonl');
  await fs.writeFile(notRun, '{"kind":"end","seq":1}\n');
  await assert.rejects(readTrace(notRun), (e: unknown) => e instanceof CaptureError && e.code === 'trace-unreadable');

  const empty = path.join(dir, 'empty.jsonl');
  await fs.writeFile(empty, '');
  await assert.rejects(readTrace(empty), (e: unknown) => e instanceof CaptureError && e.code === 'trace-unreadable');

  const future = path.join(dir, 'v2.jsonl');
  await fs.writeFile(future, '{"kind":"run","traceVersion":2,"runId":"x"}\n');
  await assert.rejects(readTrace(future), (e: unknown) => e instanceof CaptureError && e.code === 'trace-version');
});

test('a cut last line is dropped and the trace assembles as incomplete', async () => {
  const dir = await tmpDir();
  const lines = (await fs.readFile(fixture, 'utf8')).split('\n');
  // Through the redirect's second hop (line 22), then half of line 23 with no newline: the process died mid-write.
  const cut = path.join(dir, 'cut.jsonl');
  await fs.writeFile(cut, `${lines.slice(0, 22).join('\n')}\n${lines[22]!.slice(0, 60)}`);

  const r = await readTrace(cut);
  assert.equal(r.truncatedTail, true);
  assert.equal(r.lines.length, 22);
  assert.ok(r.lines.every((l) => l.kind !== 'bad'));

  const t = assemble(r);
  assert.equal(t.complete, false);
  assert.equal(t.outcome, 'interrupted');
  assert.equal(t.finishedAt, undefined);
  assert.equal(t.steps[1]!.outcome, 'interrupted');
  assert.equal(t.steps[1]!.endedAt, undefined);
  assert.equal(exchange(t, 'S1:r4:1').outcome, 'inflight');
  assert.equal(t.counts.inflightAtEnd, 1); // only the redirect's second hop had no end event yet
});

test('an unterminated last line that is whole is kept', async () => {
  const dir = await tmpDir();
  const lines = (await fs.readFile(fixture, 'utf8')).split('\n');
  const file = path.join(dir, 'whole.jsonl');
  await fs.writeFile(file, lines.slice(0, 5).join('\n'));
  const r = await readTrace(file);
  assert.equal(r.truncatedTail, false);
  assert.equal(r.lines.length, 5);
});

test('inScope: exact host or subdomain, nothing else', () => {
  const hosts = ['app.example.com'];
  assert.equal(inScope('app.example.com', hosts), true);
  assert.equal(inScope('api.app.example.com', hosts), true);
  assert.equal(inScope('APP.example.com:8443', hosts), true);
  assert.equal(inScope('example.com', hosts), false);
  assert.equal(inScope('notapp.example.com', hosts), false);
  assert.equal(inScope('app.example.com.evil.net', hosts), false);
  assert.equal(inScope('', hosts), false);
  assert.equal(inScope('a.b.net', ['x.org', 'b.net']), true);
});

test('assemble: run, outcome, completeness, targets', async () => {
  const t = await fixtureTrace();
  assert.equal(t.traceVersion, 1);
  assert.equal(t.runId, '20261103T191204Z-ab12');
  assert.equal(t.workflowId, 'create-draft');
  assert.equal(t.complete, true);
  assert.equal(t.outcome, 'completed');
  assert.equal(t.finishedAt, '2026-11-03T19:12:21.000Z');
  assert.equal(t.targets.length, 2);
  assert.equal(t.targets[1]!.openerId, 'T1');
  assert.equal(t.targets[1]!.detachedAt, '2026-11-03T19:12:20.500Z');
  assert.equal(t.badLines.length, 1);
});

test('assemble: attribution by file order', async () => {
  const t = await fixtureTrace();
  assert.deepEqual(t.setupExchangeIds, ['S1:r1:0']);
  assert.deepEqual(t.outsideExchangeIds, ['S1:r3:0']);
  assert.equal(t.outsideExchangeIds.length, t.counts.attribution.betweenSteps); // no after-last-end exchange in this fixture
  assert.deepEqual(
    t.steps.map((s) => [s.id, s.index, s.outcome, s.exchangeIds]),
    [
      ['open-editor', 0, 'ok', ['S1:r2:0']],
      ['publish', 1, 'ok', ['S1:r4:0', 'S1:r4:1', 'S1:r5:0', 'S1:r6:0', 'S1:r8:0', 'S2:p1:0']],
    ],
  );
  assert.equal(t.steps[0]!.text, 'Open the editor and save a draft');
  assert.equal(t.steps[0]!.actions.length, 1);
  assert.equal(t.steps[0]!.actions[0]!.action, 'click');

  assert.equal(exchange(t, 'S1:r1:0').stepId, undefined);
  assert.equal(exchange(t, 'S1:r2:0').stepId, 'open-editor');
  assert.equal(exchange(t, 'S1:r2:0').actionSeq, 6);
  assert.equal(exchange(t, 'S1:r3:0').stepId, undefined); // between steps
  assert.equal(exchange(t, 'S1:r7:0').stepId, undefined); // out of scope, even inside a step
  assert.equal(exchange(t, 'S2:p1:0').stepId, 'publish');
});

test('assemble: counts come from the fold, not the end line', async () => {
  const t = await fixtureTrace();
  assert.deepEqual(t.counts, {
    targets: 2,
    exchanges: 10,
    inScope: 9,
    bodies: { ok: 1, skipped: 1, evicted: 1, tooLarge: 0, error: 3 },
    attribution: { inStep: 7, betweenSteps: 1, beforeFirstStep: 1, orphanEvents: 1 },
    inflightAtEnd: 2, // the end line says 0
  });
});

test('assemble: JSON POST with wire headers, cookies, set-cookie and both bodies', async () => {
  const ex = exchange(await fixtureTrace(), 'S1:r2:0');
  assert.equal(ex.request.method, 'POST');
  assert.equal(ex.request.host, 'app.example.com');
  assert.equal(ex.request.path, '/api/drafts');
  assert.deepEqual(ex.request.query, [['src', 'editor']]);
  assert.equal(ex.request.headersSource, 'wire');
  assert.ok(ex.request.headers.some(([n, v]) => n === 'X-CSRF' && v === 'tok_1'), 'wire-only header present');
  assert.deepEqual(ex.request.cookies.map((c) => [c.name, c.value, c.httpOnly]), [['sid', 's3cr3t', true]]);
  assert.equal(ex.request.at, '2026-11-03T19:12:08.000Z');
  assert.deepEqual(ex.request.body, { encoding: 'text', text: '{"title":"Hello","tags":["a"]}', bytes: 30, truncated: false });
  assert.equal(ex.initiator.type, 'script');
  assert.deepEqual(ex.initiator.stackTop, { url: 'https://app.example.com/app.js', functionName: 'saveDraft', lineNumber: 41 });
  assert.equal(ex.resourceType, 'Fetch');

  assert.equal(ex.outcome, 'completed');
  assert.equal(ex.response?.status, 201);
  assert.equal(ex.response?.bodyState, 'ok');
  assert.deepEqual(ex.response?.body, { encoding: 'text', text: '{"id":"d_123","title":"Hello"}', bytes: 30, truncated: false });
  assert.deepEqual(ex.response?.setCookies, ['draft=abc; Path=/; HttpOnly', 'flash=1; Path=/']);
  assert.equal(ex.response?.headers.filter(([n]) => n === 'set-cookie').length, 2);
  assert.equal(ex.response?.at, '2026-11-03T19:12:08.200Z');
  assert.equal(ex.timing.startMs, 1793733128000);
  assert.equal(ex.timing.endMs, 1793733128400);
  assert.equal(ex.target.type, 'page');
});

test('assemble: renderer headers when no ExtraInfo; lost and skipped bodies', async () => {
  const t = await fixtureTrace();
  const doc = exchange(t, 'S1:r1:0');
  assert.equal(doc.request.headersSource, 'renderer');
  assert.equal(doc.response?.bodyState, 'lost'); // Document, finished, no body line
  assert.equal(exchange(t, 'S1:r3:0').response?.bodyState, 'lost');
  assert.equal(exchange(t, 'S1:r3:0').request.host, 'api.app.example.com');
});

test('assemble: redirect hops are separate exchanges linked by redirectTo', async () => {
  const t = await fixtureTrace();
  const first = exchange(t, 'S1:r4:0');
  const second = exchange(t, 'S1:r4:1');
  assert.equal(first.request.url, 'https://app.example.com/old');
  assert.equal(first.redirectTo, 'S1:r4:1');
  assert.equal(first.outcome, 'completed');
  assert.equal(first.response?.status, 302);
  assert.equal(first.response?.bodyState, 'skipped');
  assert.equal(second.request.url, 'https://app.example.com/new');
  assert.equal(second.initiator.type, 'redirect');
  assert.equal(second.redirectTo, undefined);
  assert.equal(second.response?.status, 200);
  assert.equal(second.stepId, 'publish');
});

test('assemble: evicted body is recorded as evicted, not hidden', async () => {
  const ex = exchange(await fixtureTrace(), 'S1:r4:1');
  assert.equal(ex.response?.bodyState, 'evicted');
  assert.equal(ex.response?.body, undefined);
});

test('assemble: failed, in-flight and aborted outcomes', async () => {
  const t = await fixtureTrace();
  const failed = exchange(t, 'S1:r5:0');
  assert.equal(failed.outcome, 'failed');
  assert.equal(failed.error, 'net::ERR_CONNECTION_RESET');
  assert.equal(failed.response, undefined);
  assert.equal(failed.request.body?.encoding, 'text'); // inline postData, no body line

  assert.equal(exchange(t, 'S1:r6:0').outcome, 'inflight');
  assert.equal(exchange(t, 'S1:r6:0').timing.endMs, undefined);

  const popup = exchange(t, 'S2:p1:0');
  assert.equal(popup.outcome, 'aborted'); // its target detached before loadingFinished
  assert.equal(popup.target.openerId, 'T1');
  assert.equal(popup.response?.status, 200);
});

test('assemble: out-of-scope host stays in exchanges only, in no list and no count', async () => {
  const t = await fixtureTrace();
  const ex = exchange(t, 'S1:r7:0');
  assert.equal(ex.request.host, 'tracker.analytics-example.net');
  assert.equal(ex.stepId, undefined);
  assert.ok(!t.outsideExchangeIds.includes(ex.id));
  assert.ok(!t.setupExchangeIds.includes(ex.id));
  assert.ok(!t.steps.some((s) => s.exchangeIds.includes(ex.id)));
});

test('assemble: WebSocket frames attach to one exchange', async () => {
  const ex = exchange(await fixtureTrace(), 'S1:r8:0');
  assert.equal(ex.resourceType, 'WebSocket');
  assert.equal(ex.request.url, 'wss://app.example.com/ws');
  assert.equal(ex.outcome, 'completed');
  assert.deepEqual(
    ex.ws?.frames.map((f) => [f.direction, f.opcode, f.payload]),
    [
      ['sent', 1, '{"op":"sub"}'],
      ['received', 1, '{"op":"ack"}'],
    ],
  );
  assert.equal(ex.ws?.framesDropped, 0);
});

// ---- Synthetic lines for orderings the fixture does not cover.

const T = '2026-11-03T10:00:00.000Z';
const S = 'S9' as SessionId;
const runLine: TraceLine = {
  kind: 'run',
  traceVersion: 1,
  runId: 'r' as RunId,
  site,
  driver: 'human',
  startedAt: T,
  browser: { kind: 'local', version: 'x' },
  scope: { hosts: ['a.test'] },
  bodies: { maxBytes: 8, hold: false },
};
let seq = 0;
const cdp = (method: string, params: unknown, sessionId: SessionId = S): TraceLine => ({ kind: 'cdp', seq: ++seq, at: T, sessionId, method, params });
const rws = (requestId: string, url = 'https://a.test/x', extra: object = {}) =>
  cdp('Network.requestWillBeSent', { requestId, timestamp: 10, wallTime: 1000, request: { url, method: 'GET', headers: { A: '1' } }, initiator: { type: 'other' }, type: 'XHR', ...extra });
const input = (...lines: TraceLine[]): ReadTraceResult => ({ lines: [runLine, ...lines], truncatedTail: false });

test('assemble: ExtraInfo that arrives before its requestWillBeSent still counts as wire headers', () => {
  const t = assemble(
    input(
      cdp('Network.requestWillBeSentExtraInfo', { requestId: 'q', associatedCookies: [], headers: { A: '1', Cookie: 'k=v' } }),
      rws('q'),
    ),
  );
  assert.equal(t.exchanges[0]!.request.headersSource, 'wire');
  assert.equal(t.counts.attribution.orphanEvents, 0);
});

test('assemble: fetch body wins over network body; body is cut at maxBytes', () => {
  const body = (source: 'network' | 'fetch', text: string): TraceLine => ({
    kind: 'body', seq: ++seq, at: T, sessionId: S, requestId: 'q', side: 'response', source, state: 'ok', text, bytes: text.length,
  });
  const t = assemble(
    input(
      rws('q'),
      cdp('Network.responseReceived', { requestId: 'q', timestamp: 11, type: 'XHR', response: { url: 'https://a.test/x', status: 200, headers: {}, mimeType: 'text/plain' } }),
      cdp('Network.loadingFinished', { requestId: 'q', timestamp: 12, encodedDataLength: 1 }),
      body('fetch', '0123456789'),
      body('network', 'ignored'),
    ),
  );
  const b = t.exchanges[0]!.response!.body;
  assert.deepEqual(b, { encoding: 'text', text: '01234567', bytes: 10, truncated: true });
});

test('assemble: served-from-cache and canceled map to fromCache and aborted', () => {
  const t = assemble(
    input(
      rws('c'),
      cdp('Network.requestServedFromCache', { requestId: 'c' }),
      cdp('Network.responseReceived', { requestId: 'c', timestamp: 11, type: 'XHR', response: { url: 'https://a.test/x', status: 200, headers: {}, mimeType: 'application/json' } }),
      rws('d'),
      cdp('Network.loadingFailed', { requestId: 'd', timestamp: 12, errorText: 'net::ERR_ABORTED', canceled: true }),
    ),
  );
  assert.equal(t.exchanges[0]!.response?.fromCache, true);
  assert.equal(t.exchanges[1]!.outcome, 'aborted');
});

test('assemble: a response with no request is an orphan but still an exchange', () => {
  const t = assemble(
    input(cdp('Network.responseReceived', { requestId: 'o', timestamp: 5, type: 'XHR', response: { url: 'https://a.test/o', status: 204, headers: {}, mimeType: 'text/plain' } })),
  );
  assert.equal(t.exchanges.length, 1);
  assert.equal(t.exchanges[0]!.request.headersSource, 'renderer');
  assert.equal(t.exchanges[0]!.response?.status, 204);
  assert.equal(t.counts.attribution.orphanEvents, 1);
});

test('assemble: a malformed CDP payload becomes a bad line, not a crash', () => {
  const t = assemble(input(cdp('Network.requestWillBeSent', { requestId: 'z' })));
  assert.equal(t.exchanges.length, 0);
  assert.equal(t.badLines.length, 1);
  assert.match(t.badLines[0]!.error, /requestWillBeSent/);
});

test('assemble: WebSocket frames past the budget are counted, not stored', () => {
  const big = 'x'.repeat(200_000);
  const frame = (): TraceLine => cdp('Network.webSocketFrameReceived', { requestId: 'w', timestamp: 1, response: { opcode: 1, mask: false, payloadData: big } });
  const t = assemble(input(cdp('Network.webSocketCreated', { requestId: 'w', url: 'wss://a.test/s' }), frame(), frame(), frame()));
  assert.equal(t.exchanges[0]!.ws?.frames.length, 1);
  assert.equal(t.exchanges[0]!.ws?.framesDropped, 2);
});

test('assemble: outsideExchangeIds = between steps + after the last end, equal to the betweenSteps count', () => {
  const step = (phase: 'begin' | 'end', id: string): TraceLine => ({ kind: 'step', seq: ++seq, at: T, phase, id: id as never, index: 0, ...(phase === 'end' ? { outcome: 'ok' as const } : {}) });
  const t = assemble(
    input(
      step('begin', 's'), rws('in'), step('end', 's'),
      rws('between'), rws('elsewhere', 'https://other.test/x'),
    ),
  );
  assert.deepEqual(t.outsideExchangeIds, ['S9:between:0']);
  assert.equal(t.outsideExchangeIds.length, t.counts.attribution.betweenSteps);
  assert.equal(t.exchanges.length, 3);
});

test('assemble: shuffled lines give identical output', async () => {
  const r = await readTrace(fixture);
  const expected = assemble(r);
  const [run, ...rest] = r.lines;
  // Deterministic shuffles: reversed, and a stride permutation (7 is coprime with the 39 remaining lines).
  const reversed = [run!, ...[...rest].reverse()];
  const stride = [run!, ...rest.map((_, i) => rest[(i * 7) % rest.length]!)];
  assert.equal(new Set(stride).size, r.lines.length, 'stride must be a permutation');
  for (const lines of [reversed, stride]) {
    assert.deepEqual(assemble({ lines, truncatedTail: false }), expected);
  }
});

test('assemble: two lines with the same seq are trace-unreadable', async () => {
  const r = await readTrace(fixture);
  const dup = r.lines.find((l) => l.kind === 'cdp')!;
  assert.throws(() => assemble({ lines: [...r.lines, dup], truncatedTail: false }), (e: unknown) => e instanceof CaptureError && e.code === 'trace-unreadable');
});

test('assemble without a run line is trace-unreadable', () => {
  assert.throws(() => assemble({ lines: [], truncatedTail: false }), (e: unknown) => e instanceof CaptureError && e.code === 'trace-unreadable');
});

test('assemble is deterministic', async () => {
  const r = await readTrace(fixture);
  assert.deepEqual(assemble(r), assemble(r));
});

// ---- Paths, ids, retention

test('newRunId is sortable, filesystem-safe and unique enough', () => {
  const a = newRunId(new Date('2026-11-03T19:12:04.123Z'));
  const b = newRunId(new Date('2026-11-03T19:12:05.000Z'));
  assert.match(a, /^20261103T191204Z-[0-9a-f]{4}$/);
  assert.ok(a < b);
  assert.match(newRunId(), /^\d{8}T\d{6}Z-[0-9a-f]{4}$/);
  assert.doesNotMatch(a, /[:/\\ ]/);
});

test('tracePathFor builds the layout and creates the directory', async () => {
  const jobs = await tmpDir();
  const p = tracePathFor(jobs, site, '20261103T191204Z-ab12' as RunId);
  assert.equal(p, path.join(jobs, 'example-app', 'traces', 'trace-20261103T191204Z-ab12.jsonl'));
  assert.ok((await fs.stat(path.dirname(p))).isDirectory());
});

test('site and runId that could escape jobsDir are rejected before anything is created or deleted', async () => {
  const parent = await tmpDir();
  const jobs = path.join(parent, 'jobs');
  await fs.mkdir(jobs);
  const unsafe = (e: unknown) => e instanceof CaptureError && e.code === 'workflow-invalid';
  for (const bad of ['../x', '..', '.', 'a/b', 'a\\b', '', 'x y']) {
    assert.throws(() => tracePathFor(jobs, bad as SiteId, 'r1' as RunId), unsafe, `site ${bad}`);
    assert.throws(() => tracePathFor(jobs, site, bad as RunId), unsafe, `runId ${bad}`);
    await assert.rejects(listTraces(jobs, bad as SiteId), unsafe);
    await assert.rejects(pruneTraces(jobs, bad as SiteId), unsafe);
  }
  // The victim sits where '../x' would have pointed; it must survive.
  const victim = path.join(parent, 'x', 'traces');
  await fs.mkdir(victim, { recursive: true });
  const file = path.join(victim, 'trace-old.jsonl');
  await fs.writeFile(file, '');
  await assert.rejects(pruneTraces(jobs, '../x' as SiteId, new Date('2100-01-01')), unsafe);
  await fs.stat(file);
  assert.deepEqual(await fs.readdir(jobs), []);
});

test('listTraces returns trace files oldest first; empty when the directory is missing', async () => {
  const jobs = await tmpDir();
  assert.deepEqual(await listTraces(jobs, site), []);
  const newer = tracePathFor(jobs, site, '20261103T190000Z-bbbb' as RunId);
  const older = tracePathFor(jobs, site, '20261102T080000Z-aaaa' as RunId);
  await fs.writeFile(newer, '');
  await fs.writeFile(older, '');
  await fs.writeFile(path.join(path.dirname(older), 'notes.txt'), '');
  assert.deepEqual(await listTraces(jobs, site), [older, newer]);
});

test('pruneTraces deletes traces older than the retention window and reports them', async () => {
  const jobs = await tmpDir();
  const runWith = (startedAt: string): string => `${JSON.stringify({ ...runLine, startedAt })}\n`;
  const old = tracePathFor(jobs, site, '20261101T000000Z-0001' as RunId);
  const recent = tracePathFor(jobs, site, '20261103T120000Z-0002' as RunId);
  const garbage = tracePathFor(jobs, site, '20261103T130000Z-0003' as RunId);
  await fs.writeFile(old, runWith('2026-11-01T00:00:00.000Z'));
  await fs.writeFile(recent, runWith('2026-11-03T12:00:00.000Z'));
  await fs.writeFile(garbage, 'not json\n'); // no readable run line: falls back to mtime
  await fs.utimes(garbage, new Date('2026-11-03T17:00:00.000Z'), new Date('2026-11-03T17:00:00.000Z'));
  const removed = await pruneTraces(jobs, site, new Date('2026-11-03T18:00:00.000Z'));
  assert.deepEqual(removed, [old]);
  assert.deepEqual(await listTraces(jobs, site), [recent, garbage]);
});

// Typing check that the exported ids compile as brands in tests.
const _id: ExchangeId = 'S1:r1:0' as ExchangeId;
void _id;
