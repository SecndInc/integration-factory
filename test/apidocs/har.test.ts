import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { toHar } from '../../src/apidocs/har.js';
import { assemble, readTrace } from '../../src/apidocs/trace.js';

const fixture = path.join(import.meta.dirname, 'fixtures', 'trace-sample.jsonl');

async function har() {
  return toHar(assemble(await readTrace(fixture)));
}

test('HAR 1.2 envelope with pages from steps', async () => {
  const h = await har();
  assert.equal(h.log.version, '1.2');
  assert.ok(h.log.creator.name.length > 0);
  assert.deepEqual(
    h.log.pages.map((p) => [p.id, p.title, p.startedDateTime]),
    [
      ['open-editor', 'Open the editor and save a draft', '2026-11-03T19:12:06.000Z'],
      ['publish', 'Publish the draft', '2026-11-03T19:12:13.000Z'],
    ],
  );
});

test('entries are the completed exchanges with a response, sorted by request time, no WebSocket', async () => {
  const h = await har();
  assert.deepEqual(
    h.log.entries.map((e) => e._exchangeId),
    ['S1:r1:0', 'S1:r2:0', 'S1:r3:0', 'S1:r4:0', 'S1:r4:1'],
  );
  const times = h.log.entries.map((e) => Date.parse(e.startedDateTime));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  // failed r5, in-flight r6 and r7, aborted p1 and the WebSocket r8 have no honest HAR shape
  assert.ok(!h.log.entries.some((e) => ['S1:r5:0', 'S1:r6:0', 'S1:r7:0', 'S2:p1:0', 'S1:r8:0'].includes(e._exchangeId)));
});

test('the JSON POST carries request postData, response content, wire headers and the custom fields', async () => {
  const e = (await har()).log.entries.find((x) => x._exchangeId === 'S1:r2:0')!;
  assert.equal(e.request.method, 'POST');
  assert.equal(e.request.url, 'https://app.example.com/api/drafts?src=editor');
  assert.equal(e.request.httpVersion, 'HTTP/2.0');
  assert.deepEqual(e.request.queryString, [{ name: 'src', value: 'editor' }]);
  assert.deepEqual(e.request.cookies, [{ name: 'sid', value: 's3cr3t' }]);
  assert.ok(e.request.headers.some((h) => h.name === 'X-CSRF' && h.value === 'tok_1'));
  assert.deepEqual(e.request.postData, { mimeType: 'application/json', text: '{"title":"Hello","tags":["a"]}' });
  assert.equal(e.request.bodySize, 30);

  assert.equal(e.response.status, 201);
  assert.deepEqual(e.response.content, { size: 30, mimeType: 'application/json', text: '{"id":"d_123","title":"Hello"}' });
  assert.deepEqual(e.response.cookies, [{ name: 'draft', value: 'abc' }, { name: 'flash', value: '1' }]);
  assert.equal(e.response.headers.filter((h) => h.name === 'set-cookie').length, 2);

  assert.equal(e.pageref, 'open-editor');
  assert.equal(e._step, 'open-editor');
  assert.equal(e._initiator, 'script https://app.example.com/app.js');
  assert.equal(e._target, 'page https://app.example.com/');
  assert.equal(e._bodyState, 'ok');
  assert.deepEqual(e.cache, {});
  assert.equal(e.time, 400);
  assert.deepEqual(e.timings, { send: 0, wait: 200, receive: 200 });
});

test('entries outside any step have no pageref; redirect and evicted state are visible', async () => {
  const entries = (await har()).log.entries;
  const setup = entries.find((x) => x._exchangeId === 'S1:r1:0')!;
  assert.equal(setup.pageref, undefined);
  assert.equal(setup._step, undefined);
  assert.equal(setup._bodyState, 'lost');

  const hop = entries.find((x) => x._exchangeId === 'S1:r4:0')!;
  assert.equal(hop.response.status, 302);
  assert.equal(hop.response.redirectURL, '/new');
  assert.equal(entries.find((x) => x._exchangeId === 'S1:r4:1')!._bodyState, 'evicted');
});

test('the HAR is plain JSON with no negative times', async () => {
  const h = await har();
  assert.deepEqual(JSON.parse(JSON.stringify(h)), h);
  for (const e of h.log.entries) {
    assert.ok(e.time >= 0 && e.timings.wait >= 0 && e.timings.receive >= 0, e._exchangeId);
  }
});
