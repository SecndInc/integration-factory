// The recorder against real Chromium (launched by Playwright with a remote-debugging port) and the
// loopback fixture site. Asserts on the JSONL the recorder wrote, read back line by line.
// Design: docs/design/api-docs.md §4, §7, §8, §10 (phase 0 done check).
import assert from 'node:assert/strict';
import { existsSync, promises as fs } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test, { type TestContext } from 'node:test';
import { chromium, type Browser, type Page } from 'playwright';
import { CaptureError } from '../../src/apidocs/errors.js';
import { Recorder, type RecorderOptions } from '../../src/apidocs/recorder.js';
import { TraceLineSchema, type Counts, type RunId, type SiteId, type StepId } from '../../src/apidocs/types.js';
import { slowMs, startFixtureSite, type FixtureSite } from './fixtures/site.js';

const chromiumPath = (() => {
  try {
    return chromium.executablePath();
  } catch {
    return '';
  }
})();
const skipBrowser =
  chromiumPath && existsSync(chromiumPath)
    ? false
    : `Chromium is not installed (looked for "${chromiumPath}"); run: npx playwright install chromium`;

// ---- Harness

/** A raw trace line as written. Params stay loose: these are CDP payloads. */
type Raw = Record<string, any>;

interface Harness {
  site: FixtureSite;
  browser: Browser;
  cdpUrl: string;
  dir: string;
}

async function availableLoopbackPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('could not reserve a local Chrome debugging port'));
        return;
      }
      const port = address.port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startHarness(t: TestContext): Promise<Harness> {
  const site = await startFixtureSite();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-recorder-'));
  const port = await availableLoopbackPort();
  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'],
  });
  t.after(async () => {
    await browser.close().catch(() => undefined);
    await site.close();
    await fs.rm(dir, { recursive: true, force: true });
  });
  return { site, browser, cdpUrl: `http://127.0.0.1:${port}`, dir };
}

function recorderOptions(h: Harness, file: string, extra: Partial<RecorderOptions> = {}): RecorderOptions {
  return {
    cdpUrl: h.cdpUrl,
    tracePath: path.join(h.dir, file),
    runId: '20261103T120000Z-abcd' as RunId,
    site: 'fixture' as SiteId,
    driver: 'playwright',
    browserKind: 'local',
    scope: { hosts: ['127.0.0.1'] },
    ...extra,
  };
}

async function readRaw(tracePath: string): Promise<{ texts: string[]; lines: Raw[] }> {
  const texts = (await fs.readFile(tracePath, 'utf8')).split('\n').filter((l) => l.length > 0);
  return { texts, lines: texts.map((l) => JSON.parse(l) as Raw) };
}

function waitDone(page: Page, name: string): Promise<unknown> {
  return page.waitForFunction((n) => (window as unknown as { done?: Record<string, unknown> }).done?.[n] !== undefined, name);
}

const sid = (id: string) => id as StepId;
const pathOf = (url: string) => new URL(url).pathname;
const keyOf = (l: Raw) => `${l.sessionId}|${l.params?.requestId ?? l.requestId}`;

// ---- The main run

test('records a multi-step Playwright run through real Chromium', { skip: skipBrowser }, async (t) => {
  const h = await startHarness(t);
  const opts = recorderOptions(h, 'trace-main.jsonl');
  const recorder = await Recorder.attach(opts);

  const context = await h.browser.newContext();
  const page = await context.newPage();
  let settled: { inflight: number } | undefined;
  let settledAt = 0;
  let slowStartedAt = 0;

  await recorder.step(sid('open'), 0, 'Open the start page', async () => {
    await page.goto(`${h.site.url}/`);
  });
  await recorder.step(sid('json'), 1, 'Load, create and refresh items', async (step) => {
    step.action('click', '#get');
    await page.click('#get');
    await waitDone(page, 'get');
    step.action('click', '#post');
    await page.click('#post');
    await waitDone(page, 'post');
    step.action('click', '#xhr');
    await page.click('#xhr');
    await waitDone(page, 'xhr');
  });
  await recorder.step(sid('upload'), 2, 'Upload a photo', async () => {
    await page.click('#upload');
    await waitDone(page, 'upload');
  });
  await recorder.step(sid('popup'), 3, 'Open the popup', async () => {
    const [popup] = await Promise.all([context.waitForEvent('page'), page.click('#popup')]);
    await popup.waitForFunction(() => document.title === 'popup-done');
  });
  await recorder.step(sid('redirect-cookie'), 4, 'Follow a redirect and get a cookie', async () => {
    await page.click('#redirect');
    await waitDone(page, 'redirect');
    await page.click('#cookie');
    await waitDone(page, 'cookie');
  });
  await recorder.step(sid('slow'), 5, 'Wait for the slow call', async () => {
    slowStartedAt = Date.now();
    await page.click('#slow'); // not awaited in the page: settle has to wait for it
    settled = await recorder.settle();
    settledAt = Date.now();
  });
  await recorder.step(sid('skipped'), 6, 'Nothing to do', async (step) => {
    step.skip('not needed on the fixture');
  });
  await assert.rejects(
    recorder.step(sid('fails'), 7, 'Fails on purpose', async () => {
      throw new Error('planned failure');
    }),
    /planned failure/,
  );
  await recorder.begin(sid('manual'), 8, 'Manual begin and end');
  await recorder.end(sid('manual'), 'ok', 'manual form');
  await assert.rejects(recorder.end(sid('manual'), 'ok'), (e: unknown) => e instanceof CaptureError && e.code === 'step-order');

  const done = await page.evaluate(() => (window as unknown as { done: Record<string, unknown> }).done);
  assert.ok(done.slow, 'the slow call finished in the page');

  const counts = await recorder.close('completed');
  console.log(`close() counts: ${JSON.stringify(counts)}`);
  assert.deepEqual(await recorder.close('completed'), counts, 'close() is idempotent');

  await assert.rejects(Recorder.attach(opts), (e: unknown) => e instanceof CaptureError && e.code === 'trace-exists');

  // ---- Read the trace back
  const { texts, lines } = await readRaw(opts.tracePath);

  for (const [i, text] of texts.entries()) {
    const parsed = TraceLineSchema.safeParse(JSON.parse(text));
    assert.ok(parsed.success, `line ${i + 1} fails TraceLineSchema: ${parsed.success ? '' : parsed.error.message}\n${text.slice(0, 300)}`);
  }
  for (let i = 1; i < lines.length; i++) {
    assert.ok(lines[i]!.seq > lines[i - 1]!.seq, `seq not increasing at line ${i + 1}: ${lines[i - 1]!.seq} then ${lines[i]!.seq}`);
  }
  const first = lines[0]!;
  const last = lines.at(-1)!;
  assert.equal(first.kind, 'run');
  assert.equal(first.runId, opts.runId);
  assert.match(first.browser.version, /Chrome/);
  assert.equal(last.kind, 'end');
  assert.equal(last.reason, 'closed');
  assert.equal(last.outcome, 'completed');
  assert.deepEqual(last.counts, counts, 'end line counts are what close() returned');

  const cdpLines = lines.filter((l) => l.kind === 'cdp');
  const requests = cdpLines.filter((l) => l.method === 'Network.requestWillBeSent');
  const requestFor = (pathname: string, method = 'GET'): Raw => {
    const found = requests.find((l) => pathOf(l.params.request.url) === pathname && l.params.request.method === method);
    assert.ok(found, `no requestWillBeSent for ${method} ${pathname}`);
    return found;
  };
  const bodyFor = (request: Raw, side: 'request' | 'response'): Raw | undefined =>
    lines.find((l) => l.kind === 'body' && l.side === side && l.sessionId === request.sessionId && l.requestId === request.params.requestId);
  const stepLine = (id: string, phase: 'begin' | 'end'): Raw => {
    const found = lines.find((l) => l.kind === 'step' && l.id === id && l.phase === phase);
    assert.ok(found, `no ${phase} line for step ${id}`);
    return found;
  };
  const assertInStep = (id: string, line: Raw, what: string) => {
    const begin = stepLine(id, 'begin').seq;
    const end = stepLine(id, 'end').seq;
    assert.ok(begin < line.seq && line.seq < end, `${what} (seq ${line.seq}) is not inside step ${id} (${begin}..${end})`);
  };

  // Popup: own document and own API call on a session other than the main page's, opener recorded.
  const mainDoc = requestFor('/');
  const popupDoc = requestFor('/popup');
  const popupData = requestFor('/api/popup-data');
  assert.equal(mainDoc.params.type, 'Document');
  assert.equal(popupDoc.params.type, 'Document');
  assert.notEqual(popupDoc.sessionId, mainDoc.sessionId, 'popup document is on its own session');
  assert.equal(popupData.sessionId, popupDoc.sessionId, 'popup API call is on the popup session');
  const targetOf = (sessionId: string) => lines.find((l) => l.kind === 'target' && l.event === 'attached' && l.sessionId === sessionId);
  const mainTarget = targetOf(mainDoc.sessionId);
  const popupTarget = targetOf(popupDoc.sessionId);
  assert.ok(mainTarget && popupTarget, 'both page targets have an attached line');
  assert.notEqual(popupTarget.targetId, mainTarget.targetId);
  assert.equal(popupTarget.openerId, mainTarget.targetId, 'popup target names the main page as opener');
  assertInStep('popup', popupDoc, 'popup document');
  assertInStep('popup', popupData, 'popup API call');

  // Multipart upload: body recovered through Network.getRequestPostData, field names present.
  const upload = requestFor('/api/upload', 'POST');
  assert.equal(upload.params.request.hasPostData, true);
  const uploadBody = bodyFor(upload, 'request');
  assert.ok(uploadBody, 'multipart request has a body line');
  assert.equal(uploadBody.source, 'network');
  assert.equal(uploadBody.state, 'ok');
  assert.match(uploadBody.text, /name="title"/);
  assert.match(uploadBody.text, /holiday/);
  assert.match(uploadBody.text, /name="photo"/);
  assertInStep('upload', upload, 'multipart upload');

  // JSON POST: request body (inline postData or body line) and response body.
  const post = requestFor('/api/items', 'POST');
  const postRequestText: string | undefined = post.params.request.postData ?? bodyFor(post, 'request')?.text;
  assert.deepEqual(JSON.parse(postRequestText ?? 'null'), { name: 'widget', qty: 3 });
  const postResponse = bodyFor(post, 'response');
  assert.ok(postResponse, 'JSON POST has a response body line');
  assert.equal(postResponse.state, 'ok');
  assert.match(JSON.parse(postResponse.text).id, /^itm_\d+$/);
  for (const [pathname, method] of [['/api/items', 'GET'], ['/api/items', 'POST'], ['/api/xhr-data', 'GET']] as const) {
    assertInStep('json', requestFor(pathname, method), `${method} ${pathname}`);
  }
  assert.equal(requestFor('/api/xhr-data').params.type, 'XHR');
  const getClick = lines.find((l) => l.kind === 'action' && l.stepId === 'json' && l.detail === '#get');
  assert.ok(getClick, 'action line for #get');
  assert.ok(getClick.seq < requestFor('/api/items').seq, 'the action marker precedes the request it caused');

  // Redirect: the hop to /api/after-redirect reuses the requestId and carries the 302.
  const redirect = requestFor('/redirect');
  const hop = requests.find((l) => l.sessionId === redirect.sessionId && l.params.requestId === redirect.params.requestId && l.params.redirectResponse);
  assert.ok(hop, 'redirect hop recorded');
  assert.equal(pathOf(hop.params.request.url), '/api/after-redirect');
  assert.equal(hop.params.redirectResponse.status, 302);
  assertInStep('redirect-cookie', redirect, 'redirect');

  // Set-Cookie: the raw header arrives in responseReceivedExtraInfo.
  const cookie = requestFor('/api/set-cookie');
  const extra = cdpLines.find(
    (l) => l.method === 'Network.responseReceivedExtraInfo' && l.sessionId === cookie.sessionId && l.params.requestId === cookie.params.requestId,
  );
  assert.ok(extra, 'set-cookie response has its ExtraInfo line');
  const setCookie = Object.entries(extra.params.headers as Record<string, string>).find(([k]) => k.toLowerCase() === 'set-cookie');
  assert.ok(setCookie && /fixture_session=/.test(setCookie[1]), 'ExtraInfo carries the raw set-cookie header');
  assertInStep('redirect-cookie', cookie, 'set-cookie call');

  // settle(): returned with nothing in flight, after /slow finished.
  assert.deepEqual(settled, { inflight: 0 });
  assert.ok(settledAt - slowStartedAt >= slowMs, `settle returned after ${settledAt - slowStartedAt} ms, before the slow call could finish`);
  const slow = requestFor('/slow');
  const slowFinished = cdpLines.find((l) => l.method === 'Network.loadingFinished' && keyOf(l) === keyOf(slow));
  assert.ok(slowFinished, '/slow finished');
  assert.ok(Date.parse(slowFinished.at) <= settledAt, 'settle resolved after /slow finished');
  assertInStep('slow', slow, '/slow request');
  assertInStep('slow', slowFinished, '/slow loadingFinished');

  // Step outcomes.
  assert.equal(stepLine('open', 'end').outcome, 'ok');
  assert.equal(stepLine('skipped', 'end').outcome, 'skipped');
  assert.equal(stepLine('skipped', 'end').note, 'not needed on the fixture');
  assert.equal(stepLine('fails', 'end').outcome, 'failed');
  assert.equal(stepLine('fails', 'end').note, 'planned failure');
  assert.equal(stepLine('manual', 'end').note, 'manual form');
  assertInStep('open', mainDoc, 'start page document');

  // Snapshot at a step begin holds the in-scope origin's localStorage.
  const snapshots = lines.filter((l) => l.kind === 'snapshot');
  assert.ok(snapshots.length > 0, 'snapshot lines written');
  const jsonSnapshot = snapshots.find((l) => l.stepId === 'json');
  assert.ok(jsonSnapshot, 'snapshot at step json');
  const origin = jsonSnapshot.storage.find((s: Raw) => s.origin === h.site.url);
  assert.equal(origin?.local['fixture-key'], 'fixture-value');
  const cookieSnapshot = snapshots.find((l) => l.stepId === 'slow');
  assert.ok(cookieSnapshot?.cookies.some((c: Raw) => c.name === 'fixture_session'), 'cookie set in step 4 is in the step 5 snapshot');

  // Counts match the lines.
  assertCountsMatchLines(lines, counts, ['127.0.0.1']);
  assert.equal(counts.inflightAtEnd, 0);
  assert.equal(counts.bodies.evicted, 0);
  assert.equal(counts.attribution.betweenSteps, 0, 'every request of this run started inside a step');
});

// ---- Hold mode

test('hold mode reads XHR and fetch bodies through Fetch before the page sees them', { skip: skipBrowser }, async (t) => {
  const h = await startHarness(t);
  const opts = recorderOptions(h, 'trace-hold.jsonl', { bodies: { hold: true } });
  const recorder = await Recorder.attach(opts);
  const page = await (await h.browser.newContext()).newPage();
  await recorder.step(sid('post'), 0, 'Create an item', async () => {
    await page.goto(`${h.site.url}/`);
    await page.click('#post');
    await waitDone(page, 'post');
    await page.click('#xhr');
    await waitDone(page, 'xhr');
  });
  const counts = await recorder.close('completed');
  console.log(`hold-mode close() counts: ${JSON.stringify(counts)}`);

  const { lines } = await readRaw(opts.tracePath);
  for (const line of lines) assert.ok(TraceLineSchema.safeParse(line).success, `bad line ${JSON.stringify(line).slice(0, 200)}`);
  assert.equal(lines[0]!.bodies.hold, true);
  const post = lines.find(
    (l) => l.kind === 'cdp' && l.method === 'Network.requestWillBeSent' && pathOf(l.params.request.url) === '/api/items' && l.params.request.method === 'POST',
  );
  assert.ok(post, 'POST recorded');
  const bodies = lines.filter((l) => l.kind === 'body' && l.side === 'response' && keyOf(l) === keyOf(post));
  assert.equal(bodies.length, 1, 'exactly one response body line for the held request');
  assert.equal(bodies[0]!.source, 'fetch');
  assert.equal(bodies[0]!.state, 'ok');
  // Fetch.getResponseBody usually answers base64; the recorder keeps what CDP gave and body.ts decodes.
  const heldText: string = bodies[0]!.text ?? Buffer.from(bodies[0]!.base64, 'base64').toString('utf8');
  assert.match(JSON.parse(heldText).id, /^itm_\d+$/);
  assert.equal(bodies[0]!.bytes, Buffer.byteLength(heldText));
  assert.ok(lines.some((l) => l.kind === 'cdp' && l.method === 'Fetch.requestPaused'), 'Fetch.requestPaused recorded verbatim');
  assertCountsMatchLines(lines, counts, ['127.0.0.1']);
});

// ---- Browser closes first

test('a browser that closes mid-step ends the trace as browser-closed, interrupted', { skip: skipBrowser }, async (t) => {
  const h = await startHarness(t);
  const opts = recorderOptions(h, 'trace-crash.jsonl');
  const recorder = await Recorder.attach(opts);
  const page = await (await h.browser.newContext()).newPage();
  await recorder.begin(sid('open'), 0, 'Open the start page');
  await page.goto(`${h.site.url}/`);
  await h.browser.close();

  const deadline = Date.now() + 10_000;
  while (!(await fs.readFile(opts.tracePath, 'utf8')).includes('"kind":"end"')) {
    assert.ok(Date.now() < deadline, 'end line written after the browser closed');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const counts = await recorder.close('completed');
  await assert.rejects(recorder.end(sid('open'), 'ok'), (e: unknown) => e instanceof CaptureError && e.code === 'browser-closed');

  const { lines } = await readRaw(opts.tracePath);
  for (const line of lines) assert.ok(TraceLineSchema.safeParse(line).success);
  const last = lines.at(-1)!;
  assert.equal(last.kind, 'end');
  assert.equal(last.reason, 'browser-closed');
  assert.equal(last.outcome, 'interrupted');
  assert.deepEqual(last.counts, counts);
  assert.ok(!lines.some((l) => l.kind === 'step' && l.phase === 'end'), 'the open step has no end line');
  assert.ok(lines.some((l) => l.kind === 'cdp' && l.method === 'Network.requestWillBeSent'), 'traffic before the close is kept');
});

// ---- No browser

test('an unreachable endpoint is browser-unreachable and creates no trace file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-recorder-'));
  try {
    const port = await availableLoopbackPort();
    const tracePath = path.join(dir, 'trace-none.jsonl');
    await assert.rejects(
      Recorder.attach({
        cdpUrl: `http://127.0.0.1:${port}`,
        tracePath,
        runId: '20261103T120000Z-abcd' as RunId,
        site: 'fixture' as SiteId,
        driver: 'playwright',
        browserKind: 'local',
        scope: { hosts: ['127.0.0.1'] },
      }),
      (e: unknown) => e instanceof CaptureError && e.code === 'browser-unreachable',
    );
    assert.equal(existsSync(tracePath), false);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// ---- Counts, recomputed from the file in file order

function assertCountsMatchLines(lines: Raw[], counts: Counts, hosts: string[]): void {
  const inScopeHost = (url: string) => {
    const host = new URL(url).hostname;
    return hosts.some((h) => host === h || host.endsWith(`.${h}`));
  };
  const expected: Counts = {
    targets: 0,
    exchanges: 0,
    inScope: 0,
    bodies: { ok: 0, skipped: 0, evicted: 0, tooLarge: 0, error: 0 },
    attribution: { inStep: 0, betweenSteps: 0, beforeFirstStep: 0, orphanEvents: 0 },
    inflightAtEnd: counts.inflightAtEnd,
  };
  const seen = new Set<string>();
  let open = false;
  let begun = false;
  let finishedSeen = 0;
  let responseBodies = 0;
  for (const l of lines) {
    if (l.kind === 'target' && l.event === 'attached') expected.targets++;
    if (l.kind === 'step') {
      open = l.phase === 'begin';
      begun ||= open;
    }
    if (l.kind === 'body') {
      const key = l.state === 'too-large' ? 'tooLarge' : (l.state as 'ok' | 'evicted' | 'error');
      expected.bodies[key]++;
      if (l.side === 'response') responseBodies++;
    }
    if (l.kind !== 'cdp') continue;
    if (l.method === 'Network.requestWillBeSent' || l.method === 'Network.webSocketCreated') {
      expected.exchanges++;
      if (inScopeHost(l.params.request?.url ?? l.params.url)) expected.inScope++;
      if (open) expected.attribution.inStep++;
      else if (begun) expected.attribution.betweenSteps++;
      else expected.attribution.beforeFirstStep++;
      if (l.params.request) seen.add(keyOf(l));
    }
    if (['Network.responseReceived', 'Network.loadingFinished', 'Network.loadingFailed'].includes(l.method)) {
      if (!seen.has(keyOf(l))) expected.attribution.orphanEvents++;
      else if (l.method === 'Network.loadingFinished') finishedSeen++;
    }
  }
  // Each finished request either got a response body line (network or fetch) or was skipped.
  expected.bodies.skipped = finishedSeen - responseBodies;
  assert.deepEqual(counts, expected);
}
