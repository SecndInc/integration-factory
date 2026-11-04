import assert from 'node:assert/strict';
import test from 'node:test';
import { derive, findBindings, graphqlOperation, graphqlOperationInfo, shapeToJsonSchema, templatePath } from '../../src/apidocs/derive.js';
import { schemaDepthMax, schemaKeysPerObjectMax } from '../../src/apidocs/limits.js';
import { emptyRedactionPolicy } from '../../src/apidocs/redact.js';
import { ApiDocSchema, WorkflowSchema, type Exchange, type Trace, type Workflow } from '../../src/apidocs/types.js';
import { targetFromUrl } from '../../src/target.js';

// ---- builders (no recorder here: hand-built traces) ----

const host = 'shop.example.com';
const t0 = Date.UTC(2026, 10, 3, 12, 0, 0);
const iso = (n: number): string => new Date(t0 + n * 1000).toISOString();

interface ExOpts {
  seq: number;
  step?: string;
  method?: string;
  path: string;
  query?: [string, string][];
  headers?: [string, string][];
  cookies?: { name: string; value: string }[];
  reqBody?: unknown;
  reqText?: string;
  status?: number;
  resBody?: unknown;
  resHeaders?: [string, string][];
  setCookies?: string[];
  mimeType?: string;
  resourceType?: string;
  reqContentType?: string;
}

function ex(o: ExOpts): Exchange {
  const hasBody = o.reqBody !== undefined || o.reqText !== undefined;
  const text = o.reqText ?? (o.reqBody !== undefined ? JSON.stringify(o.reqBody) : '');
  const mime = o.mimeType ?? 'application/json';
  const status = o.status ?? 200;
  const resText = o.resBody === undefined ? undefined : typeof o.resBody === 'string' ? o.resBody : JSON.stringify(o.resBody);
  return {
    id: `s1:r${o.seq}:0`,
    seq: o.seq,
    ...(o.step ? { stepId: o.step } : {}),
    target: { sessionId: 's1', type: 'page', url: `https://${host}/` },
    resourceType: o.resourceType ?? 'XHR',
    initiator: { type: 'script' },
    request: {
      method: o.method ?? 'GET',
      url: `https://${host}${o.path}`,
      host,
      path: o.path,
      query: o.query ?? [],
      headers: [...(hasBody ? [['content-type', o.reqContentType ?? 'application/json'] as [string, string]] : []), ...(o.headers ?? [])],
      headersSource: 'wire',
      cookies: (o.cookies ?? []).map((c) => ({ ...c, domain: host, path: '/', httpOnly: true, secure: true })),
      ...(hasBody ? { body: { encoding: 'text', text, bytes: text.length, truncated: false } } : {}),
      at: iso(o.seq),
    },
    response: {
      status,
      headers: o.resHeaders ?? [],
      setCookies: o.setCookies ?? [],
      mimeType: mime,
      fromCache: false,
      fromServiceWorker: false,
      ...(resText !== undefined ? { body: { encoding: 'text', text: resText, bytes: resText.length, truncated: false } } : {}),
      bodyState: resText !== undefined ? 'ok' : 'skipped',
      at: iso(o.seq),
    },
    outcome: 'completed',
    timing: { startMs: o.seq },
  } as unknown as Exchange;
}

function trace(runId: string, workflowId: string, stepIds: string[], exchanges: Exchange[], over: Partial<Trace> = {}): Trace {
  return {
    traceVersion: 1,
    runId,
    site: 'shop',
    driver: 'human',
    workflowId,
    startedAt: iso(0),
    finishedAt: iso(100),
    complete: true,
    outcome: 'completed',
    browser: { kind: 'local', version: '1' },
    scope: { hosts: [host] },
    steps: stepIds.map((id, index) => ({
      id,
      index,
      startedAt: iso(0),
      endedAt: iso(1),
      outcome: 'ok',
      exchangeIds: exchanges.filter((e) => e.stepId === id).map((e) => e.id),
      actions: [],
    })),
    exchanges,
    setupExchangeIds: [],
    outsideExchangeIds: [],
    snapshots: [],
    targets: [],
    counts: {
      targets: 1,
      exchanges: exchanges.length,
      inScope: exchanges.length,
      bodies: { ok: 0, skipped: 0, evicted: 0, tooLarge: 0, error: 0 },
      attribution: { inStep: exchanges.length, betweenSteps: 0, beforeFirstStep: 0, orphanEvents: 0 },
      inflightAtEnd: 0,
    },
    badLines: [],
    ...over,
  } as unknown as Trace;
}

const workflow: Workflow = WorkflowSchema.parse({
  workflowVersion: 1,
  id: 'create-draft',
  name: 'Create a draft',
  goal: 'Create and publish a draft listing',
  effect: 'read',
  inputs: [{ name: 'title', kind: 'text', example: 'Blue lamp special' }],
  steps: [
    { id: 'open', do: 'Open the shop', expect: 'network' },
    { id: 'create', do: 'Create the draft', expect: 'network', uses: ['title'] },
    { id: 'publish', do: 'Publish it', expect: 'network', confirms: ['Publish now'] },
  ],
});

const loginWorkflow: Workflow = WorkflowSchema.parse({
  workflowVersion: 1,
  id: 'login',
  name: 'Sign in',
  goal: 'Establish a session',
  effect: 'read',
  verification: 'password',
  steps: [{ id: 'sign-in', do: 'Sign in' }],
});

const sid = 'sidvalue0a1b2c3d4e5';
const csrf = 'csrf-token-value-1234';

function shopRun(runId: string, draftId: string, base: number): Trace {
  const cookies = [{ name: 'sid', value: sid }];
  return trace(runId, 'create-draft', ['open', 'create', 'publish'], [
    ex({ seq: base + 1, step: 'open', path: '/api/session', resBody: { csrf, user: { name: 'Ann', email: 'ann@example.com' } }, setCookies: [`sid=${sid}; Path=/; HttpOnly`] }),
    ex({
      seq: base + 2,
      step: 'create',
      method: 'POST',
      path: '/api/drafts',
      headers: [['x-csrf-token', csrf]],
      cookies,
      reqBody: { title: 'Blue lamp special', price: 25 },
      status: 201,
      resBody: { id: draftId, title: 'Blue lamp special', createdAt: '2026-11-03T12:00:00Z' },
    }),
    ex({
      seq: base + 3,
      step: 'publish',
      method: 'PUT',
      path: `/api/drafts/${draftId}/publish`,
      headers: [['x-csrf-token', csrf]],
      cookies,
      resBody: { status: 'published' },
    }),
    ex({ seq: base + 4, step: 'publish', path: '/static/app.js', resourceType: 'Script', mimeType: 'text/javascript' }),
  ]);
}

const target = targetFromUrl('shop', `https://${host}/`);

function run(traces: Trace[], wfs: Workflow[] = [workflow]) {
  return derive({ target, workflows: wfs, traces: traces.map((t) => ({ path: `trace-${t.runId}.jsonl`, trace: t })), redaction: emptyRedactionPolicy });
}

// ---- templatePath ----

test('templatePath names params after the previous segment', () => {
  const r = templatePath('/users/123/orders/3f2504e0-4f89-11d3-9a0c-0305e82c3301');
  assert.equal(r.template, '/users/{userId}/orders/{orderId}');
  assert.deepEqual(r.params, [
    { name: 'userId', value: '123' },
    { name: 'orderId', value: '3f2504e0-4f89-11d3-9a0c-0305e82c3301' },
  ]);
});

test('templatePath falls back to {id}, {id2} and keeps plain segments', () => {
  assert.equal(templatePath('/12345/67890').template, '/{id}/{id2}');
  assert.equal(templatePath('/v1/categories/42/items').template, '/v1/categories/{categoryId}/items');
  assert.equal(templatePath('/drafts/9f2c4e8a1b3d5f7a9c0e/publish').template, '/drafts/{draftId}/publish');
  assert.equal(templatePath('/a/b').template, '/a/b');
});

// ---- graphqlOperation ----

test('graphqlOperation reads operationName and query text', () => {
  const named = ex({ seq: 1, method: 'POST', path: '/graphql', reqBody: { operationName: 'GetUser', query: 'query GetUser { me { id } }' } });
  assert.equal(graphqlOperation(named), 'GetUser');
  const fromQuery = ex({ seq: 2, method: 'POST', path: '/api/graphql', reqBody: { query: 'mutation CreateDraft($t: String) { createDraft(title: $t) { id } }' } });
  assert.deepEqual(graphqlOperationInfo(fromQuery), { name: 'CreateDraft', type: 'mutation' });
  assert.equal(graphqlOperation(ex({ seq: 3, method: 'POST', path: '/api/drafts', reqBody: { query: 'query X { a }' } })), undefined);
  assert.equal(graphqlOperation(ex({ seq: 4, method: 'GET', path: '/graphql' })), undefined);
});

test('derive splits a GraphQL endpoint by operation', () => {
  const t = trace('r1', 'create-draft', ['open'], [
    ex({ seq: 1, step: 'open', method: 'POST', path: '/graphql', reqBody: { operationName: 'A', query: 'query A { a }' }, resBody: { data: { a: 1 } } }),
    ex({ seq: 2, step: 'open', method: 'POST', path: '/graphql', reqBody: { operationName: 'B', query: 'mutation B { b }' }, resBody: { data: { b: 1 } } }),
  ]);
  const doc = run([t]);
  assert.deepEqual(doc.endpoints.map((e) => e.id), [`POST ${host}/graphql#mutation:B`, `POST ${host}/graphql#query:A`]);
  assert.deepEqual(doc.endpoints.map((e) => e.operation), ['mutation:B', 'query:A']);
});

test('derive matches a request host that carries a port against a scope host without one', () => {
  const e = ex({ seq: 1, step: 'open', path: '/api/items', resBody: { items: [] } });
  (e.request as { host: string }).host = `${host}:8443`;
  const doc = run([trace('r1', 'create-draft', ['open'], [e])]);
  assert.equal(doc.endpoints.length, 1);
  assert.equal(doc.endpoints[0]?.pathTemplate, '/api/items');
});

test('derive keeps a same-named query and mutation apart, and anonymous operations by type', () => {
  const gql = (seq: number, body: unknown) => ex({ seq, step: 'open', method: 'POST', path: '/graphql', reqBody: body, resBody: { data: { n: seq } } });
  const t = trace('r1', 'create-draft', ['open'], [
    gql(1, { operationName: 'Item', query: 'query Item { a }' }),
    gql(2, { operationName: 'Item', query: 'mutation Item { a }' }),
    gql(3, { query: '{ me { id } }' }),
    gql(4, { query: 'mutation { reset }' }),
  ]);
  const doc = run([t]);
  assert.deepEqual(doc.endpoints.map((e) => e.operation).sort(), ['mutation:Item', 'mutation:anonymous', 'query:Item', 'query:anonymous']);
  assert.equal(doc.endpoints.length, 4);
});

// ---- leaks in adjacent paths ----

function leakDoc(exchanges: Exchange[], wfs: Workflow[] = [workflow]) {
  return run([trace('r1', 'create-draft', ['open'], exchanges.map((e) => ({ ...e, stepId: 'open' }) as Exchange))], wfs);
}

test('text bodies: pairs with sensitive names, Bearer tokens and JWTs are redacted', () => {
  const doc = leakDoc([
    ex({ seq: 1, path: '/api/text', mimeType: 'text/plain', resBody: 'login ok; refresh=rSECRETTEXT111 and Bearer bSECRETEMBED999 jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SIGSECRETX' }),
    ex({ seq: 2, path: '/api/form', method: 'POST', reqContentType: 'text/plain', reqText: 'sid=fSECRETFORM333&x=1', resBody: 'x', mimeType: 'text/plain' }),
  ]);
  const text = JSON.stringify(doc);
  for (const m of ['rSECRETTEXT111', 'bSECRETEMBED999', 'SIGSECRETX', 'fSECRETFORM333']) assert.ok(!text.includes(m), m);
  const form = doc.endpoints.find((e) => e.pathTemplate === '/api/form')!;
  assert.equal(form.request!.undecoded, `sid=${'{redacted}'}&x=1`);
  assert.match(doc.endpoints.find((e) => e.pathTemplate === '/api/text')!.responses['200']!.undecoded!, /^login ok; refresh=\{redacted\} and Bearer \{redacted\}/);
});

test('strings in JSON bodies: embedded URLs, query strings and policy secrets are scanned', () => {
  const policy = { extraKeys: [], secretValues: ['plainsecretvalue'] };
  const doc = derive({
    target,
    workflows: [workflow],
    traces: [
      {
        path: 'p',
        trace: trace('r1', 'create-draft', ['open'], [
          ex({ seq: 1, step: 'open', path: '/api/embed', resBody: { redirect: 'https://x.example/cb?access_token=eSECRETEMBED222&next=/home', note: 'see plainsecretvalue here', hdr: 'Authorization: Basic dXNlcjpwYXNzd29yZA==' } }),
        ]),
      },
    ],
    redaction: policy,
  });
  const example = doc.endpoints[0]!.responses['200']!.example as Record<string, string>;
  assert.equal(example.redirect, 'https://x.example/cb?access_token={redacted}&next=/home');
  assert.equal(example.note, 'see {redacted} here');
  assert.ok(!JSON.stringify(doc).includes('dXNlcjpwYXNzd29yZA'));
});

test('dynamic property names do not reach schema or example', () => {
  const doc = leakDoc([
    ex({ seq: 1, path: '/api/map', resBody: { 'dyn@keySECRET.io': { n: 1 }, 'other@keySECRET.io': { n: 2 } } }),
    ex({ seq: 2, path: '/api/ids', resBody: { '1001': 1, '1002': 2, '1003': 3, '1004': 4 } }),
  ]);
  const text = JSON.stringify(doc);
  assert.ok(!text.includes('keySECRET'));
  const map = doc.endpoints.find((e) => e.pathTemplate === '/api/map')!.responses['200']!;
  assert.deepEqual(map.schema, { type: 'object', additionalProperties: { type: 'object', properties: { n: { type: 'integer' } }, required: ['n'] } });
  assert.deepEqual(map.example, { '{key}': { n: 1 } });
  const ids = doc.endpoints.find((e) => e.pathTemplate === '/api/ids')!.responses['200']!;
  assert.deepEqual(ids.schema, { type: 'object', additionalProperties: { type: 'integer' } });
  assert.deepEqual(ids.example, { '{key}': 1 });
});

test('secret-looking path segments become {token} params in ids and workflow calls', () => {
  assert.equal(templatePath('/reset/passwordSECRETnodigit').template, '/reset/{token}');
  assert.equal(templatePath('/auth/password-reset').template, '/auth/password-reset');
  assert.equal(templatePath('/api/resetPasswordConfirm').template, '/api/resetPasswordConfirm');
  const doc = leakDoc([ex({ seq: 1, path: '/reset/passwordSECRETnodigit' })]);
  assert.ok(!JSON.stringify(doc).includes('passwordSECRET'));
  assert.equal(doc.endpoints[0]!.id, `GET ${host}/reset/{token}`);
  assert.equal(doc.endpoints[0]!.pathParams[0]!.example, '{redacted}');
  assert.equal(doc.workflows[0]!.sequence[0]!.endpointId, `GET ${host}/reset/{token}`);
});

test('non-secret input examples are redacted by the same rules as Case inputs', () => {
  const wf = WorkflowSchema.parse({
    workflowVersion: 1,
    id: 'create-draft',
    name: 'n',
    goal: 'g',
    effect: 'read',
    inputs: [
      { name: 'contact', kind: 'text', example: 'person@corp.example' },
      { name: 'title', kind: 'text', example: 'Blue lamp' },
    ],
    steps: [{ id: 'open', do: 'x' }],
  });
  const doc = leakDoc([ex({ seq: 1, path: '/api/a', resBody: { a: 1 } })], [wf]);
  assert.ok(!JSON.stringify(doc).includes('person@corp.example'));
  assert.deepEqual(doc.workflows[0]!.inputs.map((i) => i.example), ['{redacted}', 'Blue lamp']);
  assert.deepEqual(doc.workflows[0]!.cases[0]!.inputs, { contact: '{redacted}', title: 'Blue lamp' });
});

// ---- shapeToJsonSchema ----

test('shapeToJsonSchema merges examples: unions, required, nullable, items', () => {
  const schema = shapeToJsonSchema([
    { id: 1, name: 'a', tags: ['x'], note: null },
    { id: 2.5, name: 'b', extra: true, note: 'hi' },
  ]) as Record<string, any>;
  assert.equal(schema.type, 'object');
  assert.deepEqual(schema.required, ['id', 'name', 'note']);
  assert.equal(schema.properties.id.type, 'number');
  assert.deepEqual(schema.properties.note.type, ['string', 'null']);
  assert.deepEqual(schema.properties.tags, { type: 'array', items: { type: 'string' } });
  assert.deepEqual(schema.properties.extra, { type: 'boolean' });
  assert.deepEqual(shapeToJsonSchema([1, 'a']), { anyOf: [{ type: 'integer' }, { type: 'string' }] });
});

test('shapeToJsonSchema merges array items across examples and adds format hints', () => {
  const schema = shapeToJsonSchema([
    { items: [{ a: 1 }], at: '2026-11-03T12:00:00Z', id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301', mail: 'a@b.co', url: 'https://x.io/p' },
    { items: [{ a: 2, b: 'x' }], at: '2026-11-04T12:00:00Z', id: '3f2504e0-4f89-11d3-9a0c-0305e82c3302', mail: 'c@d.co', url: 'https://y.io/p' },
  ]) as Record<string, any>;
  assert.deepEqual(schema.properties.items.items.required, ['a']);
  assert.equal(schema.properties.items.items.properties.b.type, 'string');
  assert.equal(schema.properties.at.format, 'date-time');
  assert.equal(schema.properties.id.format, 'uuid');
  assert.equal(schema.properties.mail.format, 'email');
  assert.equal(schema.properties.url.format, 'uri');
  const mixed = shapeToJsonSchema([{ at: '2026-11-03T12:00:00Z' }, { at: 'tomorrow' }]) as Record<string, any>;
  assert.equal(mixed.properties.at.format, undefined);
});

test('shapeToJsonSchema caps depth and keys', () => {
  let deep: unknown = 'leaf';
  for (let i = 0; i < schemaDepthMax + 3; i += 1) deep = { child: deep };
  let node = shapeToJsonSchema([deep]) as Record<string, any>;
  let depth = 0;
  while (node.properties) {
    node = node.properties.child;
    depth += 1;
  }
  assert.equal(depth, schemaDepthMax);
  assert.equal(node.type, 'object');

  const wide: Record<string, number> = {};
  for (let i = 0; i < schemaKeysPerObjectMax + 50; i += 1) wide[`k${i}`] = i;
  const wideSchema = shapeToJsonSchema([wide]) as Record<string, any>;
  assert.equal(Object.keys(wideSchema.properties).length, schemaKeysPerObjectMax);
});

// ---- findBindings ----

test('findBindings: declared input wins over everything', () => {
  const create = ex({ seq: 2, method: 'POST', path: '/api/drafts', reqBody: { title: 'Blue lamp special' } });
  const earlier = [ex({ seq: 1, path: '/api/echo', resBody: { title: 'Blue lamp special' } })];
  const found = findBindings(create, earlier, [], { title: 'Blue lamp special' });
  assert.deepEqual(found, [{ to: { location: 'body', path: '$.title' }, input: 'title', computed: false }]);
});

test('findBindings: binding from an earlier response body, to path/query/header/body', () => {
  const earlier = [ex({ seq: 1, path: '/api/drafts', resBody: { id: '9f2c4e8a1b3d5f7a9c0e', ref: 'REF-998877', nested: { list: [{ n: 'tok_abcdef123' }] } } })];
  const later = ex({
    seq: 2,
    method: 'POST',
    path: '/api/drafts/9f2c4e8a1b3d5f7a9c0e/publish',
    query: [['ref', 'REF-998877']],
    headers: [['x-nested', 'tok_abcdef123']],
    reqBody: { draft: { id: '9f2c4e8a1b3d5f7a9c0e' } },
  });
  const found = findBindings(later, earlier, [], {});
  const byTo = Object.fromEntries(found.map((f) => [`${f.to.location}:${f.to.path}`, f.from]));
  const id = earlier[0]!.id;
  assert.deepEqual(byTo['path:draftId'], { exchangeId: id, location: 'response.body', path: '$.id' });
  assert.deepEqual(byTo['query:ref'], { exchangeId: id, location: 'response.body', path: '$.ref' });
  assert.deepEqual(byTo['header:x-nested'], { exchangeId: id, location: 'response.body', path: '$.nested.list[0].n' });
  assert.deepEqual(byTo['body:$.draft.id'], { exchangeId: id, location: 'response.body', path: '$.id' });
});

test('findBindings: binding from Set-Cookie, response header, and storage snapshot; latest source wins', () => {
  const first = ex({ seq: 1, path: '/a', resBody: { tok: 'shared-value-1' } });
  const second = ex({
    seq: 2,
    path: '/b',
    resBody: { tok: 'shared-value-1' },
    setCookies: ['sid=cookie-secret-77; Path=/'],
    resHeaders: [['x-request-ref', 'header-value-55']],
  });
  const later = ex({
    seq: 5,
    path: '/c',
    cookies: [{ name: 'sid', value: 'cookie-secret-77' }],
    headers: [['x-ref', 'header-value-55'], ['x-local', 'stored-value-99'], ['x-tok', 'shared-value-1']],
  });
  const snap = { seq: 3, at: iso(3), stepId: 's', cookies: [], storage: [{ origin: `https://${host}`, local: { k: 'stored-value-99' }, session: {} }] } as unknown as Trace['snapshots'][number];
  const found = findBindings(later, [first, second], [snap], {});
  const by = Object.fromEntries(found.map((f) => [`${f.to.location}:${f.to.path}`, f.from]));
  assert.deepEqual(by['cookie:sid'], { exchangeId: second.id, location: 'set-cookie', path: 'sid' });
  assert.deepEqual(by['header:x-ref'], { exchangeId: second.id, location: 'response.header', path: 'x-request-ref' });
  assert.equal(by['header:x-local']?.location, 'storage');
  assert.equal(by['header:x-local']?.path, 'localStorage[k]');
  assert.equal(by['header:x-tok']?.exchangeId, second.id);
});

test('findBindings: ambient, literal and computed', () => {
  const common = { 'x-app-build': 'build-2026-ab12' };
  const mk = (seq: number, extra: [string, string][] = []) =>
    ex({ seq, path: `/p${seq}`, headers: [['x-app-build', common['x-app-build']], ...extra] });
  const earlier = [mk(1), mk(2)];
  const current = mk(3, [['x-signature', 'a'.repeat(8)], ['x-mode', 'web'], ['x-short', 'ab'], ['x-nonce-token', 'Zq8Xk2Lm9Pw4Rt7Yv1']]);
  const found = findBindings(current, earlier, [], {});
  const by = Object.fromEntries(found.map((f) => [`${f.to.location}:${f.to.path}`, f]));
  // ambient: reported with no source and not computed
  assert.deepEqual(by['header:x-app-build'], { to: { location: 'header', path: 'x-app-build' }, computed: false });
  // literal: short or ordinary values are not reported
  assert.equal(by['header:x-mode'], undefined);
  assert.equal(by['header:x-short'], undefined);
  // computed: signature-like name, or high-entropy opaque value with no source
  assert.equal(by['header:x-signature']?.computed, true);
  assert.equal(by['header:x-nonce-token']?.computed, true);
});

test('findBindings skips values below the minimum length', () => {
  const earlier = [ex({ seq: 1, path: '/a', resBody: { id: 42, code: 'ab' } })];
  const later = ex({ seq: 2, path: '/b', query: [['id', '42'], ['code', 'ab']] });
  assert.deepEqual(findBindings(later, earlier, [], {}), []);
});

// ---- derive ----

test('derive groups two runs of one workflow into one endpoint set with a Case per run', () => {
  const doc = run([shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0), shopRun('r2', 'a1b2c3d4e5f6a7b8c9d0', 100)]);
  ApiDocSchema.parse(doc);
  assert.deepEqual(doc.endpoints.map((e) => e.id), [
    `GET ${host}/api/session`,
    `POST ${host}/api/drafts`,
    `PUT ${host}/api/drafts/{draftId}/publish`,
  ]);
  const publish = doc.endpoints.find((e) => e.method === 'PUT')!;
  assert.equal(publish.observedIn.length, 2);
  assert.deepEqual(publish.observedIn.map((e) => e.runId), ['r1', 'r2']);
  assert.equal(publish.pathParams[0]?.source, 'binding');
  assert.deepEqual(publish.bindings.filter((b) => b.to.location === 'path').map((b) => [b.from.endpointId, b.from.path, b.seen]), [[`POST ${host}/api/drafts`, '$.id', 2]]);
  assert.deepEqual(
    publish.bindings.filter((b) => b.to.location === 'header').map((b) => [b.from.endpointId, b.from.location, b.from.path, b.to.path, b.seen]),
    [[`GET ${host}/api/session`, 'response.body', '$.csrf', 'x-csrf-token', 2]],
  );

  const wf = doc.workflows[0]!;
  assert.equal(wf.cases.length, 2);
  assert.deepEqual(wf.cases.map((c) => c.runId), ['r1', 'r2']);
  assert.deepEqual(wf.cases[0]!.inputs, { title: 'Blue lamp special' });
  assert.deepEqual(wf.cases[0]!.expect, [
    { stepId: 'open', status: [200] },
    { stepId: 'create', status: [201] },
    { stepId: 'publish', status: [200] },
  ]);
  assert.equal(wf.steps[2]!.confirms[0], 'Publish now');
  assert.equal(wf.sequence.length, 3);
  assert.equal(wf.latestRun?.runId, 'r2');
  // the static script is not an endpoint
  assert.ok(!doc.endpoints.some((e) => e.pathTemplate.endsWith('.js')));
});

test('derive marks declared inputs, binds cookies, and builds schemas and coverage', () => {
  const doc = run([shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0)]);
  const create = doc.endpoints.find((e) => e.method === 'POST')!;
  assert.equal(create.kind, 'api');
  assert.ok(create.bindings.some((b) => b.from.location === 'set-cookie' && b.to.location === 'cookie'));
  const reqSchema = create.request!.schema as Record<string, any>;
  assert.deepEqual(reqSchema.required, ['title', 'price']);
  const res = create.responses['201']!;
  assert.equal((res.schema as Record<string, any>).properties.createdAt.format, 'date-time');
  assert.equal(doc.coverage.steps, 3);
  assert.equal(doc.coverage.stepsWithExchanges, 3);
  assert.equal(doc.coverage.endpoints, 3);
  assert.equal(doc.coverage.endpointsWithExample, 3);
  assert.equal(doc.coverage.inputsBound, 1);
  assert.ok(doc.coverage.bindings >= 3);
  // input source is recorded on the body leaf's binding entry, i.e. counted in inputsBound
  assert.equal(doc.generatedAt, iso(100));
});

test('derive detects auth cookies and headers and links the login workflow', () => {
  const doc = run([shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0)], [workflow, loginWorkflow]);
  assert.deepEqual(doc.auth.cookies, ['sid']);
  assert.deepEqual(doc.auth.headers, ['x-csrf-token']);
  assert.equal(doc.auth.loginWorkflowId, 'login');
  assert.equal(doc.auth.verification, 'password');
  const create = doc.endpoints.find((e) => e.method === 'POST')!;
  assert.deepEqual(create.auth, { cookies: ['sid'], headers: ['x-csrf-token'] });
  assert.equal(create.headers.find((h) => h.name === 'x-csrf-token')?.valueKind, 'redacted');
});

test('derive lists incomplete and non-completed traces but does not use them', () => {
  const good = shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0);
  const cut = trace('r2', 'create-draft', ['open'], [ex({ seq: 201, step: 'open', path: '/api/only-in-cut-run', resBody: { a: 1 } })], { complete: false, outcome: 'interrupted' });
  const failed = trace('r3', 'create-draft', ['open'], [ex({ seq: 301, step: 'open', path: '/api/only-in-failed-run', resBody: { a: 1 } })], { outcome: 'failed' });
  const doc = run([good, cut, failed]);
  ApiDocSchema.parse(doc);
  assert.deepEqual(doc.source.traces.map((t) => [t.runId, t.usedForDerive, t.complete, t.outcome]), [
    ['r1', true, true, 'completed'],
    ['r2', false, false, 'interrupted'],
    ['r3', false, true, 'failed'],
  ]);
  assert.ok(!doc.endpoints.some((e) => e.pathTemplate.includes('only-in')));
  assert.equal(doc.workflows[0]!.cases.length, 1);
  assert.equal(doc.workflows[0]!.latestRun?.outcome, 'failed');
});

test('derive does not derive a write workflow without an inverse', () => {
  const write = WorkflowSchema.parse({ ...workflow, effect: 'write' });
  const doc = run([shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0)], [write]);
  assert.equal(doc.endpoints.length, 0);
  assert.equal(doc.source.traces[0]!.usedForDerive, false);
  const withInverse = WorkflowSchema.parse({ ...workflow, effect: 'write', inverse: 'delete-draft' });
  assert.ok(run([shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0)], [withInverse]).endpoints.length > 0);
});

test('derive folds preflights into cors, marks pages, ambient endpoints, and out-of-step traffic', () => {
  const poll = (seq: number, step: string) => ex({ seq, step, path: '/api/poll', resBody: { n: seq } });
  const t = trace('r1', 'create-draft', ['open', 'create', 'publish', 'extra'], [
    ex({ seq: 1, step: 'open', path: '/', resourceType: 'Document', mimeType: 'text/html', resBody: '<html></html>' }),
    ex({ seq: 2, step: 'open', method: 'OPTIONS', path: '/api/drafts', headers: [['access-control-request-method', 'POST']], resourceType: 'Preflight', status: 204 }),
    ex({ seq: 3, step: 'open', method: 'POST', path: '/api/drafts', reqBody: { title: 'x' }, resBody: { ok: true } }),
    poll(4, 'open'),
    poll(5, 'create'),
    poll(6, 'publish'),
    ex({ seq: 7, path: '/api/stray', resBody: { s: 1 } }),
  ]);
  const doc = run([t]);
  ApiDocSchema.parse(doc);
  const byId = Object.fromEntries(doc.endpoints.map((e) => [e.id, e]));
  assert.equal(byId[`GET ${host}/`]!.kind, 'page');
  assert.equal(byId[`POST ${host}/api/drafts`]!.cors, true);
  assert.ok(!byId[`OPTIONS ${host}/api/drafts`]);
  assert.equal(byId[`GET ${host}/api/poll`]!.ambient, true);
  assert.equal(byId[`GET ${host}/api/stray`]!.ambient, false);
  assert.deepEqual(doc.outside.map((o) => [o.exchangeId, o.stepId]), [['s1:r7:0', null]]);
  assert.ok(!doc.workflows[0]!.sequence.some((s) => s.endpointId.endsWith('/api/poll')));
});

test('derive redacts examples, params, headers and secret inputs', () => {
  const secretWf = WorkflowSchema.parse({
    workflowVersion: 1,
    id: 'create-draft',
    name: 'n',
    goal: 'g',
    effect: 'read',
    inputs: [{ name: 'passphrase', kind: 'text', example: 'hunter2-hunter2', secret: true }],
    steps: [{ id: 'open', do: 'x' }],
  });
  const t = trace('r1', 'create-draft', ['open'], [
    ex({
      seq: 1,
      step: 'open',
      method: 'POST',
      path: '/api/login',
      reqBody: { user: 'ann', password: 'pw-plain-1', note: 'hunter2-hunter2' },
      resBody: { token: 'abc', profile: { email: 'ann@example.com', city: 'Oslo' } },
    }),
  ]);
  const doc = run([t], [secretWf]);
  const text = JSON.stringify(doc);
  for (const leaked of ['pw-plain-1', 'hunter2-hunter2', 'ann@example.com']) assert.ok(!text.includes(leaked), `${leaked} leaked`);
  const ep = doc.endpoints[0]!;
  assert.equal((ep.request!.example as any).user, 'ann');
  assert.equal((ep.request!.example as any).password, '{redacted}');
  assert.equal((ep.responses['200']!.example as any).profile.city, 'Oslo');
  assert.equal(doc.workflows[0]!.inputs[0]!.example, '{redacted}');
  assert.equal(doc.workflows[0]!.cases[0]!.inputs.passphrase, '{redacted}');
});

test('derive output is deterministic', () => {
  const traces = [shopRun('r1', '9f2c4e8a1b3d5f7a9c0e', 0), shopRun('r2', 'a1b2c3d4e5f6a7b8c9d0', 100)];
  assert.equal(JSON.stringify(run(traces)), JSON.stringify(run([...traces].reverse())));
});
