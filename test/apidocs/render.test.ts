import assert from 'node:assert/strict';
import test from 'node:test';
import { renderApiDoc, stableJson } from '../../src/apidocs/render/index.js';
import { escapeHtml, sequenceSvg, toHtml } from '../../src/apidocs/render/html.js';
import { toMarkdown } from '../../src/apidocs/render/markdown.js';
import { toOpenApi } from '../../src/apidocs/render/openapi.js';
import { inlineRefs } from '../../src/apidocs/render/shared.js';
import { CART_ID, ITEM_ID, PAGE_ID, SEARCH_ID, XSS, sampleDoc } from './fixtures/apidoc-sample.js';

type Json = Record<string, any>;

/** The string as it appears inside a JSON example: quoted characters are backslash-escaped. */
const prettyJsonString = (s: string): string => JSON.stringify(s).slice(1, -1);

test('stableJson sorts keys at every level, keeps array order, ends with a newline and is idempotent', () => {
  const text = stableJson({ b: 1, a: { z: [3, 1, 2], y: null }, c: 'x' });
  assert.equal(text, '{\n  "a": {\n    "y": null,\n    "z": [\n      3,\n      1,\n      2\n    ]\n  },\n  "b": 1,\n  "c": "x"\n}\n');
  assert.equal(stableJson(JSON.parse(text)), text);
  assert.equal(stableJson({ c: 1, a: 2 }), stableJson({ a: 2, c: 1 }));
  assert.ok(stableJson(sampleDoc).endsWith('}\n'));
});

test('toOpenApi: one operation per api endpoint, inlined schemas, no $ref anywhere', () => {
  const api = toOpenApi(sampleDoc) as Json;
  assert.equal(api.openapi, '3.1.0');
  assert.equal(api.info.title, 'Shop Demo');
  assert.deepEqual(
    api.servers.map((s: Json) => s.url),
    ['https://shop.example.com', 'https://api.shop.example.com'],
  );

  const ops: Json[] = Object.values(api.paths as Json).flatMap((item: any) => Object.values(item) as Json[]);
  assert.equal(ops.length, 4, 'the page endpoint is not an operation');
  assert.equal(new Set(ops.map((o) => o.operationId)).size, 4);
  assert.ok(!('/cart' in api.paths));

  const get = api.paths['/v1/items/{itemId}'].get;
  assert.deepEqual(
    get.parameters.map((p: Json) => [p.in, p.name, p.required]),
    [
      ['path', 'itemId', true],
      ['query', 'include', false],
      ['query', 'q', false],
      ['header', 'x-csrf-token', true],
    ],
  );
  assert.equal(get.parameters[0].example, 'it_42');
  assert.deepEqual(get.responses['200'].content['application/json'].schema.properties.price, { type: 'object', properties: { cents: { type: 'integer' } } });
  assert.equal(get.responses['200'].content['application/json'].example.price.cents, 1999);
  assert.ok(get.responses['404']);
  assert.deepEqual(get.tags, ['Find an item', 'Add to cart']);

  const post = api.paths['/v1/cart'].post;
  assert.deepEqual(post.requestBody.content['application/json'].example, { itemId: 'it_42', quantity: 2 });
  assert.equal(post['x-bindings'][0].from.endpointId, ITEM_ID);
  assert.equal(post['x-observed-in'][0].stepId, 'add');
  assert.equal(post.operationId, 'post_api_shop_example_com_v1_cart');
  assert.equal(post.requestBody.content['application/json'].schema.properties.quantity.minimum, 1);
  assert.equal(api.paths['/v1/poll'].get['x-ambient'], true);
  assert.deepEqual(
    Object.keys(api).filter((k) => k.startsWith('x-')).sort(),
    ['x-coverage', 'x-workflows'],
  );
  assert.deepEqual(
    Object.keys(post).filter((k) => k.startsWith('x-')).sort(),
    ['x-bindings', 'x-observed-in'],
  );
  assert.ok(api.paths['/graphql#SearchItems'].post);
  assert.equal(api.paths['/graphql#SearchItems'].post['x-observed-in'][0].stepId, 'search');

  assert.ok(!JSON.stringify(api).includes('$ref'));
  assert.ok(!JSON.stringify(api).includes('$defs'));
  assert.deepEqual(api.components.securitySchemes.cookie_session_id, { type: 'apiKey', in: 'cookie', name: 'session_id' });
  assert.deepEqual(api.components.securitySchemes['header_x-csrf-token'], { type: 'apiKey', in: 'header', name: 'x-csrf-token' });
  assert.deepEqual(get.security, [{ cookie_session_id: [], 'header_x-csrf-token': [] }]);
  assert.equal(api['x-coverage'].bindings, 1);
  assert.equal(api['x-workflows'][0].sequence.length, 2);
});

test('inlineRefs resolves local refs, breaks cycles and drops external refs', () => {
  const schema = {
    $defs: { node: { type: 'object', properties: { next: { $ref: '#/$defs/node' }, id: { type: 'string' } } } },
    type: 'array',
    items: { $ref: '#/$defs/node' },
    not: { $ref: 'https://elsewhere.invalid/x.json' },
  };
  const out = inlineRefs(schema);
  assert.ok(!JSON.stringify(out).includes('$ref'));
  assert.ok(!('$defs' in out));
  assert.deepEqual((out as Json).items.properties.next, {});
  assert.equal((out as Json).items.properties.id.type, 'string');
});

test('toHtml: self-contained page with every endpoint path, workflow name, svg per workflow and escaped examples', () => {
  const html = toHtml(sampleDoc);
  assert.match(html, /^<!doctype html>/);
  for (const path of ['/v1/items/{itemId}', '/v1/cart', '/graphql', '/cart']) assert.ok(html.includes(path), `missing ${path}`);
  for (const name of ['Find an item', 'Add to cart']) assert.ok(html.includes(name), `missing ${name}`);
  assert.equal(html.match(/<svg/g)?.length, 2);

  assert.ok(!html.includes(XSS), 'raw script string must not appear');
  assert.ok(html.includes(escapeHtml(prettyJsonString(XSS))));
  assert.ok(!/<script/i.test(html));
  assert.ok(!html.includes('must-not-appear'), 'secret input example is never shown');

  assert.ok(html.includes('prefers-color-scheme'));
  assert.ok(html.includes('name="viewport"'));
  assert.ok(html.includes('Values on this page are redacted'));
  assert.ok(html.includes('4 of 5'), 'coverage numbers come from doc.coverage');
  assert.ok(html.includes('comes from'));
  assert.ok(html.includes('Expected network traffic, none was captured'));
  assert.ok(html.includes('Seen outside any step'));
  const background = html.slice(html.indexOf('id="background"'), html.indexOf('id="outside"'));
  assert.ok(html.includes('Background traffic (1)'));
  assert.ok(background.includes('/v1/poll'));
  assert.ok(!html.slice(html.indexOf('id="endpoints"'), html.indexOf('id="background"')).includes('/v1/poll'));
  assert.ok(html.includes('add-to-cart') || html.includes('Add to cart'));

  // No resource loads: the only absolute links are to the site itself.
  assert.ok(!/<(?:script|link|img|iframe|source)\b/i.test(html));
  assert.ok(!/@import|url\((?!#)/i.test(html));
  const absolute = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]);
  for (const url of absolute) assert.ok(url.startsWith('https://shop.example.com/'), `unexpected absolute url ${url}`);
  for (const m of html.matchAll(/(?:src|href)="(https?:[^"]*)"/g)) assert.equal(m[1], 'https://shop.example.com/');
});

test('sequenceSvg draws one arrow per call with its status code', () => {
  const wf = sampleDoc.workflows[1]!;
  const svg = sequenceSvg(wf, sampleDoc.endpoints);
  assert.equal(svg.match(/<svg/g)?.length, 1);
  assert.equal(svg.match(/marker-end=/g)?.length, 3);
  assert.ok(svg.includes('→ 500'));
  assert.ok(svg.includes('seq-fail'));
  assert.ok(svg.includes('api.shop.example.com'));
  const empty = sequenceSvg({ ...wf, sequence: [] }, sampleDoc.endpoints);
  assert.ok(empty.startsWith('<svg') && empty.includes('No requests captured'));
});

test('escapeHtml escapes the five characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'</a>`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
});

test('toMarkdown: headings, tables and fenced examples', () => {
  const md = toMarkdown(sampleDoc);
  for (const heading of ['# Shop Demo', '## Coverage', '## Auth', '## 2 workflows', '## 3 endpoints', '### Find an item', '### Add to cart', '### `GET /v1/items/{itemId}`', '### `POST /v1/cart`', '### `POST /graphql (SearchItems)`']) {
    assert.ok(md.includes(heading), `missing ${heading}`);
  }
  assert.ok(md.includes('2 workflows, 4 endpoints, 1 binding'));
  assert.ok(md.includes('## Background traffic (1)'));
  assert.ok(md.includes('### `GET /v1/poll`'));
  assert.ok(md.includes('```json\n{\n  "itemId": "it_42",\n  "quantity": 2\n}\n```'));
  assert.ok(md.includes('```text\noops\n```'));
  assert.ok(md.includes('| Name | In | Source | Example | Required |'));
  assert.ok(md.includes('comes from `GET /v1/items/{itemId}`'));
  assert.ok(md.includes('`GET /cart` → 200'));
  assert.ok(md.includes('| Steps that triggered requests | 4 of 5 |'), 'coverage table');
  assert.ok(!md.includes('must-not-appear'));
  assert.ok(md.endsWith('\n') && !md.endsWith('\n\n'));
});

test('output does not depend on the order of doc.endpoints', () => {
  const original = renderApiDoc(sampleDoc);
  const reversed = { ...sampleDoc, endpoints: [...sampleDoc.endpoints].reverse() } as typeof sampleDoc;
  const rotated = { ...sampleDoc, endpoints: [...sampleDoc.endpoints.slice(2), ...sampleDoc.endpoints.slice(0, 2)] } as typeof sampleDoc;
  for (const variant of [reversed, rotated]) {
    const out = renderApiDoc(variant);
    assert.equal(out['openapi.json'], original['openapi.json']);
    assert.equal(out['index.html'], original['index.html']);
    assert.equal(out['README.md'], original['README.md']);
  }
});

test('renderApiDoc returns the four outputs and is deterministic', () => {
  const first = renderApiDoc(sampleDoc);
  assert.deepEqual(Object.keys(first).sort(), ['README.md', 'api.json', 'index.html', 'openapi.json']);
  const second = renderApiDoc(sampleDoc);
  assert.deepEqual(second, first);
  assert.equal(toHtml(sampleDoc), toHtml(sampleDoc));
  assert.equal(toMarkdown(sampleDoc), toMarkdown(sampleDoc));
  assert.equal(stableJson(toOpenApi(sampleDoc)), stableJson(toOpenApi(sampleDoc)));
  assert.deepEqual(JSON.parse(first['api.json']), JSON.parse(JSON.stringify(sampleDoc)));
  assert.ok(PAGE_ID.length > 0);
});
