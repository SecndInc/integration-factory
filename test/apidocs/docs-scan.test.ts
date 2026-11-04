// The review gate: secret values from the trace fail, personal-looking fields need review, --accept is
// recorded, and the hash tracks the rendered files. Design: docs/design/agent-guidance.md §3.

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { MissingInput, docFiles, hashDocs, scanDocs } from '../../scripts/apidocs-docs-scan.js';

const cookieValue = 'sess-9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c';
const bearer = 'Bearer abcdefghijklmnopqrstuvwxyz0123456789';

async function fixture(opts: { readmeExtra?: string; example?: unknown } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'docs-scan-'));
  const docsDir = path.join(root, 'docs', 'apis', 'widgetry');
  const tracesDir = path.join(root, 'jobs', 'widgetry', 'traces');
  await fs.mkdir(docsDir, { recursive: true });
  await fs.mkdir(tracesDir, { recursive: true });
  const api = {
    endpoints: [
      { method: 'GET', pathTemplate: '/api/items', kind: 'api', responses: { '200': { example: opts.example ?? { items: [{ id: 1, sku: 'W-1' }] } } } },
      { method: 'GET', pathTemplate: '/locales/en/app.json', kind: 'api', responses: {} },
    ],
  };
  await fs.writeFile(path.join(docsDir, 'README.md'), `# Widgetry\n\nGET /api/items\n${opts.readmeExtra ?? ''}`);
  await fs.writeFile(path.join(docsDir, 'api.json'), JSON.stringify(api));
  await fs.writeFile(path.join(docsDir, 'index.html'), '<html><body>Widgetry</body></html>');
  await fs.writeFile(path.join(docsDir, 'openapi.json'), JSON.stringify({ openapi: '3.1.0', paths: {} }));
  const lines = [
    JSON.stringify({ kind: 'run', runId: 'r1' }),
    JSON.stringify({ kind: 'snapshot', stepId: 's1', cookies: [{ name: 'session', value: cookieValue, domain: 'widgetry.test', path: '/' }], storage: {} }),
    JSON.stringify({ kind: 'cdp', method: 'Network.requestWillBeSentExtraInfo', params: { headers: { cookie: `session=${cookieValue}; theme=dark`, authorization: bearer } } }),
    'not json at all',
    JSON.stringify({ kind: 'end', outcome: 'completed' }),
  ];
  await fs.writeFile(path.join(tracesDir, 'trace-20260101T000000Z-1.jsonl'), lines.join('\n') + '\n');
  return { root, docsDir, scan: (extra: { accept?: boolean; acceptedBy?: string } = {}) => scanDocs({ site: 'widgetry', jobsDir: path.join(root, 'jobs'), docsRoot: path.join(root, 'docs', 'apis'), ...extra }) };
}

test('clean docs pass, noise is listed, REVIEW.json is written with the hash', async () => {
  const f = await fixture();
  const result = await f.scan();
  assert.equal(result.verdict, 'pass');
  assert.equal(result.secrets.hits.length, 0);
  assert.ok(result.secrets.candidates >= 2, 'cookie value and bearer token were collected from the trace');
  assert.deepEqual(result.noise, ['GET /locales/en/app.json']);
  const review = JSON.parse(await fs.readFile(path.join(f.docsDir, 'REVIEW.json'), 'utf8'));
  assert.equal(review.verdict, 'pass');
  assert.equal(review.hash, await hashDocs(f.docsDir));
  assert.ok(review.trace.endsWith('trace-20260101T000000Z-1.jsonl'));
});

test('a cookie value from the trace in any rendered file is a fail that --accept cannot clear', async () => {
  const f = await fixture({ readmeExtra: `Cookie: session=${cookieValue}\n` });
  const result = await f.scan({ accept: true, acceptedBy: 'tester' });
  assert.equal(result.verdict, 'fail');
  assert.equal(result.accepted, undefined);
  assert.equal(result.secrets.hits[0]?.file, 'README.md');
  assert.ok(!JSON.stringify(result).includes(cookieValue), 'the value itself is never written to REVIEW.json');
});

test('a bearer token pattern is a fail even without a trace', async () => {
  const f = await fixture({ readmeExtra: `Authorization: ${bearer}\n` });
  await fs.rm(path.join(f.root, 'jobs'), { recursive: true });
  const result = await f.scan();
  assert.equal(result.trace, null);
  assert.equal(result.verdict, 'fail');
  assert.equal(result.secrets.hits[0]?.kind, 'bearer');
});

test('personal-looking fields need review, are reported by key path, and --accept records the person', async () => {
  const f = await fixture({ example: { customer: { name: 'A Person' }, address: { street: '1 Main St', postal_code: '{redacted}' }, phone: '5550001234', product: { name: 'Widget' } } });
  const first = await f.scan();
  assert.equal(first.verdict, 'needs-review');
  assert.equal(first.pii.hits, 3, 'customer.name, address.street and phone; product.name and the redacted postal code do not count');
  assert.ok(first.pii.fields.includes('GET /api/items.responses.200.example.customer.name'));
  assert.ok(!JSON.stringify(first).includes('A Person'));
  const accepted = await f.scan({ accept: true, acceptedBy: 'reviewer' });
  assert.equal(accepted.verdict, 'pass');
  assert.equal(accepted.accepted?.by, 'reviewer');
  assert.equal(accepted.accepted?.fieldsAtAcceptance, 3);
});

test('the hash changes when a rendered file changes, so a stale review is detectable', async () => {
  const f = await fixture();
  const before = (await f.scan()).hash;
  await fs.appendFile(path.join(f.docsDir, 'index.html'), '<!-- rebuilt -->');
  assert.notEqual(await hashDocs(f.docsDir), before);
});

test('missing docs are a MissingInput, not a crash', async () => {
  const f = await fixture();
  await fs.rm(path.join(f.docsDir, docFiles[1]));
  await assert.rejects(f.scan(), MissingInput);
});
