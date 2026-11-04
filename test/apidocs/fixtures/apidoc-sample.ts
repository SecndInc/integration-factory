// A hand-built ApiDoc for the renderer tests: two workflows, four endpoints (a GET with path and
// query params, a JSON POST bound to the GET's response, a GraphQL operation, a page), auth
// cookies, an exchange outside any step, and coverage numbers. Built as a plain object, run through
// the schema, then branded: redact.ts is not implemented in this worktree, so the brand is a cast.

import type { Redacted } from '../../../src/apidocs/redact.js';
import { ApiDocSchema, type ApiDoc } from '../../../src/apidocs/types.js';

export const XSS = '<script>alert("x")</script>';

const API = 'api.shop.example.com';
export const ITEM_ID = `GET ${API}/v1/items/{itemId}`;
export const CART_ID = `POST ${API}/v1/cart`;
export const SEARCH_ID = `POST ${API}/graphql#SearchItems`;
export const POLL_ID = `GET ${API}/v1/poll`;
export const PAGE_ID ='GET shop.example.com/cart';

const evidence = (workflowId: string, stepId: string, exchangeId: string, at: string) => ({
  runId: '20261103T101500Z-ab12',
  workflowId,
  stepId,
  exchangeId,
  at,
});

const raw = {
  docVersion: 1,
  site: { id: 'shop-demo', name: 'Shop Demo', startUrl: 'https://shop.example.com/', hosts: ['shop.example.com', API] },
  generatedAt: '2026-11-03T10:30:00.000Z',
  source: {
    traces: [{ runId: '20261103T101500Z-ab12', path: 'runs/a.jsonl', complete: true, outcome: 'completed', usedForDerive: true }],
  },
  auth: { cookies: ['session_id'], headers: ['x-csrf-token'], loginWorkflowId: 'find-item', verification: 'password' },
  workflows: [
    {
      id: 'find-item',
      name: 'Find an item',
      goal: 'Search the catalogue and open one item.',
      effect: 'read',
      preconditions: ['Signed in'],
      inputs: [
        { name: 'query', kind: 'text', example: 'lamp', secret: false },
        { name: 'api-token', kind: 'text', example: 'must-not-appear', secret: true },
      ],
      latestRun: { runId: '20261103T101500Z-ab12', outcome: 'completed', at: '2026-11-03T10:20:00.000Z' },
      cases: [{ runId: '20261103T101500Z-ab12', inputs: { query: 'lamp' }, expect: [{ stepId: 'search', status: [200] }] }],
      steps: [
        {
          id: 'search',
          do: 'Type the query into the search box',
          expect: 'network',
          confirms: [],
          outcome: 'ok',
          calls: [{ endpointId: SEARCH_ID, exchangeId: 's1:r1:0', status: 200 }],
        },
        {
          id: 'open-item',
          do: 'Open the first result',
          expect: 'network',
          confirms: [],
          outcome: 'ok',
          calls: [{ endpointId: ITEM_ID, exchangeId: 's1:r2:0', status: 200 }],
        },
        { id: 'look-around', do: 'Check the page title', expect: 'network', confirms: [], outcome: 'ok', calls: [] },
      ],
      sequence: [
        { stepId: 'search', endpointId: SEARCH_ID, exchangeId: 's1:r1:0' },
        { stepId: 'open-item', endpointId: ITEM_ID, exchangeId: 's1:r2:0' },
      ],
    },
    {
      id: 'add-to-cart',
      name: 'Add to cart',
      goal: 'Put the opened item in the cart.',
      effect: 'write',
      inverse: 'remove-from-cart',
      preconditions: [],
      inputs: [{ name: 'quantity', kind: 'number', example: '2', secret: false }],
      latestRun: { runId: '20261103T101500Z-ab12', outcome: 'completed', at: '2026-11-03T10:25:00.000Z' },
      cases: [],
      steps: [
        {
          id: 'add',
          do: 'Press Add to cart',
          expect: 'network',
          confirms: ['Add to cart'],
          outcome: 'ok',
          calls: [
            { endpointId: ITEM_ID, exchangeId: 's1:r3:0', status: 200 },
            { endpointId: CART_ID, exchangeId: 's1:r4:0', status: 500 },
          ],
        },
        {
          id: 'view-cart',
          do: 'Open the cart',
          expect: 'url',
          confirms: [],
          outcome: 'ok',
          calls: [{ endpointId: PAGE_ID, exchangeId: 's1:r5:0', status: 200 }],
        },
      ],
      sequence: [
        { stepId: 'add', endpointId: ITEM_ID, exchangeId: 's1:r3:0' },
        { stepId: 'add', endpointId: CART_ID, exchangeId: 's1:r4:0' },
        { stepId: 'view-cart', endpointId: PAGE_ID, exchangeId: 's1:r5:0' },
      ],
    },
  ],
  endpoints: [
    {
      id: ITEM_ID,
      kind: 'api',
      method: 'GET',
      host: API,
      pathTemplate: '/v1/items/{itemId}',
      operation: null,
      pathParams: [{ name: 'itemId', example: 'it_42', required: true, source: 'binding' }],
      queryParams: [
        { name: 'include', example: 'reviews', required: false, source: 'literal' },
        { name: 'q', example: 'lamp', required: 'unknown', source: 'input' },
      ],
      headers: [
        { name: 'accept', required: true, valueKind: 'static' },
        { name: 'x-csrf-token', required: true, valueKind: 'token' },
      ],
      auth: { cookies: ['session_id'], headers: ['x-csrf-token'] },
      request: null,
      responses: {
        '200': {
          mediaType: 'application/json',
          schema: {
            $defs: { money: { type: 'object', properties: { cents: { type: 'integer' } } } },
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' }, price: { $ref: '#/$defs/money' } },
          },
          example: { id: 'it_42', name: XSS, price: { cents: 1999 } },
          undecoded: null,
        },
        '404': { mediaType: 'application/json', schema: { type: 'object', properties: { error: { type: 'string' } } }, example: { error: 'not found' }, undecoded: null },
      },
      bindings: [],
      ambient: false,
      cors: false,
      observedIn: [evidence('find-item', 'open-item', 's1:r2:0', '2026-11-03T10:18:00.000Z'), evidence('add-to-cart', 'add', 's1:r3:0', '2026-11-03T10:24:00.000Z')],
    },
    {
      id: CART_ID,
      kind: 'api',
      method: 'POST',
      host: API,
      pathTemplate: '/v1/cart',
      operation: null,
      pathParams: [],
      queryParams: [],
      headers: [{ name: 'content-type', required: true, valueKind: 'static' }],
      auth: { cookies: ['session_id'], headers: [] },
      request: {
        mediaType: 'application/json',
        schema: {
          $defs: { qty: { type: 'integer', minimum: 1 } },
          type: 'object',
          properties: { itemId: { type: 'string' }, quantity: { $ref: '#/$defs/qty' } },
          required: ['itemId'],
        },
        example: { itemId: 'it_42', quantity: 2 },
        undecoded: null,
      },
      responses: {
        '201': { mediaType: 'application/json', schema: { type: 'object', properties: { cartId: { type: 'string' } } }, example: { cartId: 'c_9' }, undecoded: null },
        '500': { mediaType: 'text/plain', schema: null, example: 'oops', undecoded: null },
      },
      bindings: [
        { from: { endpointId: ITEM_ID, location: 'response.body', path: '$.id' }, to: { location: 'body', path: '$.itemId' }, seen: 2 },
      ],
      ambient: false,
      cors: true,
      observedIn: [evidence('add-to-cart', 'add', 's1:r4:0', '2026-11-03T10:24:30.000Z')],
    },
    {
      id: SEARCH_ID,
      kind: 'api',
      method: 'POST',
      host: API,
      pathTemplate: '/graphql',
      operation: 'SearchItems',
      pathParams: [],
      queryParams: [],
      headers: [],
      auth: { cookies: ['session_id'], headers: [] },
      request: {
        mediaType: 'application/json',
        schema: { type: 'object', properties: { operationName: { type: 'string' }, variables: { type: 'object', properties: { term: { type: 'string' } } } } },
        example: { operationName: 'SearchItems', variables: { term: 'lamp' } },
        undecoded: null,
      },
      responses: {
        '200': {
          mediaType: 'application/json',
          schema: { type: 'object', properties: { data: { type: 'object' } } },
          example: { data: { items: [{ id: 'it_42' }] } },
          undecoded: null,
        },
      },
      bindings: [],
      ambient: false,
      cors: false,
      observedIn: [evidence('find-item', 'search', 's1:r1:0', '2026-11-03T10:17:00.000Z')],
    },
    {
      id: POLL_ID,
      kind: 'api',
      method: 'GET',
      host: API,
      pathTemplate: '/v1/poll',
      operation: null,
      pathParams: [],
      queryParams: [],
      headers: [],
      auth: { cookies: ['session_id'], headers: [] },
      request: null,
      responses: { '200': { mediaType: 'application/json', schema: { type: 'object', properties: { unread: { type: 'integer' } } }, example: { unread: 0 }, undecoded: null } },
      bindings: [],
      ambient: true,
      cors: false,
      observedIn: [evidence('find-item', 'search', 's1:r7:0', '2026-11-03T10:17:30.000Z')],
    },
    {
      id: PAGE_ID,
      kind: 'page',
      method: 'GET',
      host: 'shop.example.com',
      pathTemplate: '/cart',
      operation: null,
      pathParams: [],
      queryParams: [],
      headers: [],
      auth: { cookies: ['session_id'], headers: [] },
      request: null,
      responses: { '200': { mediaType: 'text/html', schema: null, example: null, undecoded: 'html page' } },
      bindings: [],
      ambient: false,
      cors: false,
      observedIn: [evidence('add-to-cart', 'view-cart', 's1:r5:0', '2026-11-03T10:25:00.000Z')],
    },
  ],
  outside: [{ runId: '20261103T101500Z-ab12', stepId: null, exchangeId: 's1:r9:0', at: '2026-11-03T10:26:00.000Z' }],
  coverage: {
    steps: 5,
    stepsWithExchanges: 4,
    endpoints: 5,
    endpointsWithExample: 4,
    bindings: 1,
    inputsBound: 2,
    computedValues: 0,
    bodiesEvicted: 0,
    betweenSteps: 1,
  },
};

export const sampleDoc: Redacted<ApiDoc> = ApiDocSchema.parse(raw) as Redacted<ApiDoc>;
