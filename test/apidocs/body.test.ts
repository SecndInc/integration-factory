import assert from 'node:assert/strict';
import test from 'node:test';
import { bodyJson, isTextMime, multipartBoundary, requestBody, responseBody, splitMultipart } from '../../src/apidocs/body.js';

const maxBytes = 1024;
const boundary = '----WebKitFormBoundaryX7';
const multipartCt = `multipart/form-data; boundary=${boundary}`;
const multipartText =
  `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nHello world\r\n` +
  `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="cat.png"\r\nContent-Type: image/png\r\n\r\n\r\n` +
  `--${boundary}--\r\n`;

test('requestBody: JSON stays text', () => {
  const b = requestBody({ contentType: 'application/json', postData: '{"a":1}', maxBytes });
  assert.deepEqual(b, { encoding: 'text', text: '{"a":1}', bytes: 7, truncated: false });
});

test('requestBody: nothing to record is undefined', () => {
  assert.equal(requestBody({ contentType: undefined, maxBytes }), undefined);
  assert.equal(requestBody({ contentType: 'application/json', postData: '', maxBytes }), undefined);
  assert.equal(requestBody({ contentType: 'application/json', entries: [], maxBytes }), undefined);
});

test('requestBody: multipart text becomes parts; the file part is omitted', () => {
  const b = requestBody({ contentType: multipartCt, postData: multipartText, maxBytes });
  assert.equal(b?.encoding, 'multipart');
  if (b?.encoding !== 'multipart') return;
  assert.equal(b.boundary, boundary);
  assert.equal(b.parts.length, 2);
  assert.equal(b.parts[0]!.name, 'title');
  assert.deepEqual(b.parts[0]!.content, { text: 'Hello world' });
  assert.equal(b.parts[1]!.name, 'photo');
  assert.equal(b.parts[1]!.filename, 'cat.png');
  assert.equal(b.parts[1]!.contentType, 'image/png');
  assert.deepEqual(b.parts[1]!.content, { omitted: 'file' });
});

test('requestBody: postDataEntries are joined; a file element contributes no bytes', () => {
  const head = Buffer.from(multipartText.slice(0, multipartText.indexOf('\r\n\r\n\r\n') + 4)).toString('base64');
  const tail = Buffer.from(multipartText.slice(multipartText.indexOf('\r\n\r\n\r\n') + 4)).toString('base64');
  const b = requestBody({ contentType: multipartCt, entries: [{ bytes: head }, {}, { bytes: tail }], maxBytes });
  assert.equal(b?.encoding, 'multipart');
  if (b?.encoding !== 'multipart') return;
  assert.deepEqual(
    b.parts.map((p) => [p.name, p.content]),
    [
      ['title', { text: 'Hello world' }],
      ['photo', { omitted: 'file' }],
    ],
  );
});

test('requestBody: binary entries become base64; large bodies are cut and flagged', () => {
  const bin = requestBody({ contentType: 'application/octet-stream', entries: [{ bytes: Buffer.from([0xff, 0xfe, 0x00]).toString('base64') }], maxBytes });
  assert.deepEqual(bin, { encoding: 'base64', base64: '//4A', bytes: 3, truncated: false });

  const big = requestBody({ contentType: 'text/plain', postData: 'a'.repeat(20), maxBytes: 8 });
  assert.deepEqual(big, { encoding: 'text', text: 'aaaaaaaa', bytes: 20, truncated: true });
});

test('splitMultipart: parts carry headers, name, filename and content type', () => {
  const parts = splitMultipart(multipartText, boundary);
  assert.equal(parts.length, 2);
  assert.deepEqual(parts[0]!.headers, [['Content-Disposition', 'form-data; name="title"']]);
  assert.equal(parts[0]!.filename, undefined);
  assert.equal(parts[0]!.contentType, undefined);
  assert.deepEqual(splitMultipart('not multipart', boundary), []);
});

test('splitMultipart: a field with an empty value is text, not a file', () => {
  const t = `--b\r\nContent-Disposition: form-data; name="q"\r\n\r\n\r\n--b--\r\n`;
  assert.deepEqual(splitMultipart(t, 'b')[0]!.content, { text: '' });
});

test('multipartBoundary: quoted, bare, and absent', () => {
  assert.equal(multipartBoundary('multipart/form-data; boundary=abc123'), 'abc123');
  assert.equal(multipartBoundary('multipart/form-data; boundary="a b"; charset=utf-8'), 'a b');
  assert.equal(multipartBoundary('multipart/form-data'), undefined);
  assert.equal(multipartBoundary('application/json; boundary=x'), undefined);
  assert.equal(multipartBoundary(undefined), undefined);
});

test('isTextMime', () => {
  for (const m of ['application/json', 'application/json; charset=utf-8', 'application/vnd.api+json', 'text/html', 'text/plain', 'application/xml', 'image/svg+xml', 'application/javascript', 'text/javascript', 'application/x-www-form-urlencoded', 'application/graphql', 'text/event-stream']) {
    assert.equal(isTextMime(m), true, m);
  }
  for (const m of ['image/png', 'application/octet-stream', 'application/pdf', 'font/woff2', '']) {
    assert.equal(isTextMime(m), false, m);
  }
});

test('responseBody: text stays text, base64 text mime decodes, binary stays base64', () => {
  assert.deepEqual(responseBody({ mimeType: 'application/json', body: '{"ok":true}', base64Encoded: false, maxBytes }), {
    encoding: 'text', text: '{"ok":true}', bytes: 11, truncated: false,
  });
  assert.deepEqual(responseBody({ mimeType: 'application/json', body: Buffer.from('{"ok":true}').toString('base64'), base64Encoded: true, maxBytes }), {
    encoding: 'text', text: '{"ok":true}', bytes: 11, truncated: false,
  });
  assert.deepEqual(responseBody({ mimeType: 'image/png', body: 'iVBORw==', base64Encoded: true, maxBytes }), {
    encoding: 'base64', base64: 'iVBORw==', bytes: 4, truncated: false,
  });
});

test('responseBody: marks truncated at maxBytes and reports the full size', () => {
  const text = responseBody({ mimeType: 'text/plain', body: 'abcdefghij', base64Encoded: false, maxBytes: 4 });
  assert.deepEqual(text, { encoding: 'text', text: 'abcd', bytes: 10, truncated: true });
  const bin = responseBody({ mimeType: 'image/png', body: Buffer.from('0123456789').toString('base64'), base64Encoded: true, maxBytes: 4 });
  assert.deepEqual(bin, { encoding: 'base64', base64: Buffer.from('0123').toString('base64'), bytes: 10, truncated: true });
});

test('bodyJson: parses JSON text, otherwise undefined', () => {
  const text = (t: string) => ({ encoding: 'text' as const, text: t, bytes: t.length, truncated: false });
  assert.deepEqual(bodyJson(text('{"a":[1,2]}')), { a: [1, 2] });
  assert.equal(bodyJson(text('nope')), undefined);
  assert.equal(bodyJson(text('')), undefined);
  assert.equal(bodyJson(undefined), undefined);
  assert.equal(bodyJson({ encoding: 'base64', base64: 'e30=', bytes: 2, truncated: false }), undefined);
  assert.equal(bodyJson({ encoding: 'multipart', boundary: 'b', parts: [], bytes: 0 }), undefined);
});
