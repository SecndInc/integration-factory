import assert from 'node:assert/strict';
import test from 'node:test';
import { isIdSegment } from '../src/capture/path-template.js';
import { distinctEndpoints, type CapturedRoute } from '../src/capture/playwright-capture.js';

test('isIdSegment accepts numeric, 12+ hex, UUID and 16+ mixed tokens', () => {
  for (const s of ['123', '9', '0123456789ab', 'DEADBEEFCAFE0123', '3f2504e0-4f89-11d3-9a0c-0305e82c3301', 'a1b2c3d4e5f6g7h8', 'Kx9mP2qR7sT4vW1z']) {
    assert.ok(isIdSegment(s), s);
  }
});

test('isIdSegment rejects names, short tokens, single-class long words', () => {
  for (const s of ['', 'users', 'v1', 'abc123', 'deadbeef', 'internationalization', 'a-b-c-d-e-f-g-h-i', '1234567890123456x!']) {
    assert.ok(!isIdSegment(s), s);
  }
});

test('distinctEndpoints collapses id segments through isIdSegment', () => {
  const route = (url: string): CapturedRoute => ({ method: 'GET', url, status: 200, resourceType: 'xhr' });
  const out = distinctEndpoints([
    route('https://x.test/api/items/12'),
    route('https://x.test/api/items/9876543'),
    route('https://x.test/api/items/3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
    route('https://x.test/api/items/9f2c4e8a1b3d5f7a9c0e'),
    route('https://x.test/api/items/list'),
  ]);
  assert.deepEqual(out.map((r) => r.url), ['x.test/api/items/{id}', 'x.test/api/items/list']);
});
