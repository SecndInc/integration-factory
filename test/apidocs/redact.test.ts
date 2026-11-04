import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyRedactionPolicy, isSensitiveName, looksLikeSecret, REDACTED, redact, type RedactionPolicy } from '../../src/apidocs/redact.js';

const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVPmB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const policy: RedactionPolicy = { extraKeys: ['X-Tenant-Ref', 'internalNote'], secretValues: ['hunter2-hunter2'] };

test('isSensitiveName uses the shared pattern, fixed names and policy keys', () => {
  for (const name of ['Authorization', 'Set-Cookie', 'x-api-key', 'access_token', 'csrfToken', 'password', 'userEmail', 'sessionId']) {
    assert.ok(isSensitiveName(name, emptyRedactionPolicy), name);
  }
  for (const name of ['title', 'price', 'content-type', 'x-tenant-ref']) assert.ok(!isSensitiveName(name, emptyRedactionPolicy), name);
  assert.ok(isSensitiveName('x-tenant-ref', policy));
  assert.ok(isSensitiveName('INTERNALNOTE', policy));
});

test('looksLikeSecret catches JWTs, bearer prefixes, long hex/base64, emails, phones', () => {
  assert.ok(looksLikeSecret(jwt));
  assert.ok(looksLikeSecret('Bearer abcdef0123456789'));
  assert.ok(looksLikeSecret('0123456789abcdef0123456789abcdef'));
  assert.ok(looksLikeSecret('QWxhZGRpbjpvcGVuIHNlc2FtZQ9fK3Lm8Xp2Zr7Tq1Bv'));
  assert.ok(looksLikeSecret('ann@example.com'));
  assert.ok(looksLikeSecret('+1 415 555 0132'));
  assert.ok(!looksLikeSecret('3f2504e0-4f89-11d3-9a0c-0305e82c3301'));
  assert.ok(!looksLikeSecret('Blue lamp special'));
  assert.ok(!looksLikeSecret('1700000000000'));
  assert.ok(!looksLikeSecret('abcdef'));
});

test('redact walks nested bodies, keeping structure and non-sensitive leaves', () => {
  const body = {
    title: 'Blue lamp',
    count: 3,
    ok: true,
    none: null,
    owner: { name: 'Ann', email: 'ann@example.com', apiKey: 'plain' },
    tokens: ['a', 'b'],
    list: [{ password: 'x', n: 1 }, { note: 'hunter2-hunter2 inside', jwt }],
    internalNote: { deep: 'text' },
  };
  const out = redact(body, { in: 'body', path: '$' }, policy) as any;
  assert.equal(out.title, 'Blue lamp');
  assert.equal(out.count, 3);
  assert.equal(out.ok, true);
  assert.equal(out.none, null);
  assert.deepEqual(out.owner, { name: 'Ann', email: REDACTED, apiKey: REDACTED });
  assert.deepEqual(out.tokens, [REDACTED, REDACTED]);
  assert.deepEqual(out.list[0], { password: REDACTED, n: 1 });
  assert.equal(out.list[1].note, `${REDACTED} inside`);
  assert.equal(out.list[1].jwt, REDACTED);
  assert.deepEqual(out.internalNote, { deep: REDACTED });
  assert.equal(body.owner.email, 'ann@example.com', 'input is not mutated');
});

test('redact by place: headers, cookies, query', () => {
  assert.equal(redact('Bearer abc.def.ghi', { in: 'header', name: 'Authorization' }, emptyRedactionPolicy), REDACTED);
  assert.equal(redact('keep-me', { in: 'header', name: 'x-trace' }, emptyRedactionPolicy), 'keep-me');
  assert.equal(redact('tenant-9', { in: 'header', name: 'x-tenant-ref' }, policy), REDACTED);
  assert.equal(redact('anything', { in: 'cookie', name: 'theme' }, emptyRedactionPolicy), REDACTED);
  assert.equal(redact('dark', { in: 'query', name: 'theme' }, emptyRedactionPolicy), 'dark');
  assert.equal(redact('0123456789abcdef0123456789abcdef', { in: 'query', name: 'ref' }, emptyRedactionPolicy), REDACTED);
  assert.equal(redact('hunter2-hunter2', { in: 'query', name: 'q' }, policy), REDACTED);
});

test('redact keeps cookie names and set-cookie attribute names', () => {
  assert.equal(
    redact('sid=abc123; Path=/; HttpOnly; SameSite=Lax', { in: 'header', name: 'Set-Cookie' }, emptyRedactionPolicy),
    `sid=${REDACTED}; Path=/; HttpOnly; SameSite=Lax`,
  );
  assert.equal(redact('a=1; b=2', { in: 'header', name: 'cookie' }, emptyRedactionPolicy), `a=${REDACTED}; b=${REDACTED}`);
  const cookies = redact({ sid: 'abc', theme: 'dark' }, { in: 'cookie', name: 'jar' }, emptyRedactionPolicy);
  assert.deepEqual(cookies, { sid: REDACTED, theme: REDACTED });
  const headers = redact({ 'set-cookie': ['a=1; Secure', 'b=2'], 'x-ok': 'fine' }, { in: 'header', name: 'headers' }, emptyRedactionPolicy);
  assert.deepEqual(headers, { 'set-cookie': [`a=${REDACTED}; Secure`, `b=${REDACTED}`], 'x-ok': 'fine' });
});
