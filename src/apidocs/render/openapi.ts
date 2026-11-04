// OpenAPI 3.1 from a Redacted<ApiDoc>. One operation per `api` endpoint. Every local $ref is
// inlined so the file loads in Redocly or Swagger UI unchanged and maps to MCP tool definitions
// mechanically. Extensions: x-integration-factory (bindings, ambient, evidence, coverage,
// workflows with inputs + sequence), components.securitySchemes from auth. Pure.
// Design: docs/design/api-docs.md §6, §13 item 6.

import type { Redacted } from '../redact.js';
import type { ApiDoc, BodyDoc, Endpoint, WorkflowDoc } from '../types.js';
import { compareStrings, inlineRefs, sortedEndpoints } from './shared.js';

export type OpenApiDocument = Record<string, unknown>;

type Json = Record<string, unknown>;

const httpMethods = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
const statusKey = /^(?:[1-5]\d\d|[1-5]XX|default)$/;
/** Headers OpenAPI says a parameter must not describe; they live in requestBody or security. */
const reservedHeaders = new Set(['accept', 'content-type', 'authorization']);

export function toOpenApi(doc: Redacted<ApiDoc>): OpenApiDocument {
  const endpoints = sortedEndpoints(doc).filter((ep) => ep.kind === 'api' && httpMethods.has(ep.method.toLowerCase()));
  const serverUrls = uniqueSorted([...doc.site.hosts], endpoints.map((ep) => ep.host));
  const schemes = securitySchemes(doc, endpoints);

  const paths: Record<string, Json> = {};
  const usedIds = new Set<string>();
  for (const ep of endpoints) {
    const method = ep.method.toLowerCase();
    let key = ep.operation === null ? ep.pathTemplate : `${ep.pathTemplate}#${ep.operation}`;
    if (paths[key]?.[method] !== undefined) key = `${key}#${ep.host}`;
    const item = (paths[key] ??= {});
    item[method] = operation(doc, ep, usedIds, serverUrls);
  }

  const out: OpenApiDocument = {
    openapi: '3.1.0',
    info: {
      title: doc.site.name,
      version: doc.generatedAt,
      description: `Derived from captured sessions of ${doc.site.startUrl}. Example values are redacted.`,
    },
    servers: serverUrls.map((url) => ({ url: serverUrl(url) })),
    tags: doc.workflows.map((wf) => ({ name: wf.name, description: wf.goal })),
    paths,
    'x-integration-factory': {
      redacted: true,
      generatedAt: doc.generatedAt,
      site: { id: doc.site.id, startUrl: doc.site.startUrl },
      auth: {
        cookies: doc.auth.cookies,
        headers: doc.auth.headers,
        loginWorkflowId: doc.auth.loginWorkflowId,
        verification: doc.auth.verification,
      },
      coverage: doc.coverage,
      workflows: doc.workflows.map(workflowExtension),
      outside: doc.outside,
    },
  };
  if (Object.keys(schemes).length > 0) out['components'] = { securitySchemes: schemes };
  return out;
}

function operation(doc: ApiDoc, ep: Endpoint, usedIds: Set<string>, serverUrls: readonly string[]): Json {
  const op: Json = {
    operationId: uniqueId(operationId(ep), usedIds),
    summary: ep.operation === null ? `${ep.method.toUpperCase()} ${ep.pathTemplate}` : `${ep.operation} (GraphQL)`,
    parameters: parameters(ep),
    responses: responses(ep),
    'x-integration-factory': {
      endpointId: ep.id,
      host: ep.host,
      graphqlOperation: ep.operation,
      ambient: ep.ambient,
      cors: ep.cors,
      headers: ep.headers,
      bindings: ep.bindings,
      observedIn: ep.observedIn,
    },
  };
  const tags = tagsOf(doc, ep);
  if (tags.length > 0) op['tags'] = tags;
  if (ep.request !== null) op['requestBody'] = requestBody(ep.request);
  const security = securityRequirement(ep);
  if (security !== null) op['security'] = [security];
  const url = ep.host.includes('://') ? ep.host : `https://${ep.host}`;
  if (serverUrls.length !== 1 || serverUrl(serverUrls[0]!) !== url) op['servers'] = [{ url }];
  return op;
}

function tagsOf(doc: ApiDoc, ep: Endpoint): string[] {
  return doc.workflows.filter((wf) => wf.steps.some((s) => s.calls.some((c) => c.endpointId === ep.id))).map((wf) => wf.name);
}

function parameters(ep: Endpoint): Json[] {
  const out: Json[] = [];
  const seen = new Set<string>();
  const add = (location: string, param: Json, name: string): void => {
    const id = `${location}:${name}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(param);
  };
  for (const match of ep.pathTemplate.matchAll(/\{([^}/]+)\}/g)) {
    const name = match[1]!;
    const known = ep.pathParams.find((p) => p.name === name);
    add('path', paramObject('path', name, true, known?.example, known?.source), name);
  }
  for (const p of ep.queryParams) {
    add('query', paramObject('query', p.name, p.required === true, p.example, p.source, p.required === 'unknown'), p.name);
  }
  for (const h of ep.headers) {
    if (reservedHeaders.has(h.name.toLowerCase())) continue;
    const param = paramObject('header', h.name, h.required === true, undefined, undefined, h.required === 'unknown');
    param['x-value-kind'] = h.valueKind;
    add('header', param, h.name.toLowerCase());
  }
  return out;
}

function paramObject(location: string, name: string, required: boolean, example: string | undefined, source: string | undefined, requiredUnknown = false): Json {
  const param: Json = { name, in: location, required, schema: { type: 'string' } };
  if (example !== undefined) param['example'] = example;
  if (source !== undefined) param['x-source'] = source;
  if (requiredUnknown) param['description'] = 'Whether this is required could not be determined from the captured traffic.';
  return param;
}

function mediaContent(body: BodyDoc): Json | null {
  if (body.schema === null && (body.example === null || body.example === undefined)) return null;
  const media: Json = { schema: body.schema === null ? {} : inlineRefs(body.schema) };
  if (body.example !== null && body.example !== undefined) media['example'] = body.example;
  return { [body.mediaType === '' ? 'application/octet-stream' : body.mediaType]: media };
}

function requestBody(body: BodyDoc): Json {
  const out: Json = { required: false, description: body.undecoded === null ? 'Request body as captured.' : `Request body not decoded: ${body.undecoded}` };
  out['content'] = mediaContent(body) ?? { [body.mediaType === '' ? 'application/octet-stream' : body.mediaType]: { schema: {} } };
  return out;
}

function responses(ep: Endpoint): Json {
  const out: Json = {};
  const unmapped: string[] = [];
  for (const status of Object.keys(ep.responses).sort(compareStrings)) {
    const body = ep.responses[status]!;
    const key = status.toUpperCase();
    if (!statusKey.test(key)) {
      unmapped.push(status);
      continue;
    }
    const res: Json = {
      description: body.undecoded === null ? `Response observed with status ${status}.` : `Response observed with status ${status}; body not decoded: ${body.undecoded}`,
    };
    const content = mediaContent(body);
    if (content !== null) res['content'] = content;
    out[key === 'DEFAULT' ? 'default' : key] = res;
  }
  if (Object.keys(out).length === 0) {
    out['default'] = {
      description: unmapped.length > 0 ? `Responses seen with statuses ${unmapped.join(', ')}.` : 'No response was captured for this endpoint.',
    };
  }
  return out;
}

function operationId(ep: Endpoint): string {
  const raw = ep.id.length > 0 ? ep.id : `${ep.method} ${ep.host}${ep.pathTemplate}`;
  const id = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return id.length > 0 ? id : 'operation';
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  for (let n = 2; used.has(id); n += 1) id = `${base}_${n}`;
  used.add(id);
  return id;
}

// ---- security --------------------------------------------------------------------------------

function schemeKey(kind: 'cookie' | 'header', name: string): string {
  if (kind === 'header' && name.toLowerCase() === 'authorization') return 'bearerAuth';
  return `${kind}_${name.toLowerCase().replace(/[^a-z0-9._-]+/g, '_')}`;
}

function securitySchemes(doc: ApiDoc, endpoints: readonly Endpoint[]): Json {
  const cookies = uniqueSorted([...doc.auth.cookies], endpoints.flatMap((ep) => ep.auth.cookies));
  const headers = uniqueSorted([...doc.auth.headers], endpoints.flatMap((ep) => ep.auth.headers));
  const out: Json = {};
  for (const name of cookies) out[schemeKey('cookie', name)] = { type: 'apiKey', in: 'cookie', name };
  for (const name of headers) {
    out[schemeKey('header', name)] =
      name.toLowerCase() === 'authorization' ? { type: 'http', scheme: 'bearer' } : { type: 'apiKey', in: 'header', name };
  }
  return out;
}

function securityRequirement(ep: Endpoint): Json | null {
  const names = [...ep.auth.cookies.map((n) => schemeKey('cookie', n)), ...ep.auth.headers.map((n) => schemeKey('header', n))];
  if (names.length === 0) return null;
  return Object.fromEntries([...new Set(names)].map((key): [string, unknown[]] => [key, []]));
}

// ---- helpers ---------------------------------------------------------------------------------

function workflowExtension(wf: WorkflowDoc): Json {
  return {
    id: wf.id,
    name: wf.name,
    goal: wf.goal,
    effect: wf.effect,
    inverse: wf.inverse,
    preconditions: wf.preconditions,
    inputs: wf.inputs.map((i) => ({ name: i.name, kind: i.kind, example: i.secret ? undefined : i.example, secret: i.secret })),
    latestRun: wf.latestRun,
    sequence: wf.sequence,
  };
}

/** `first` keeps its order; `rest` is appended sorted and deduplicated. */
function uniqueSorted(first: readonly string[], rest: readonly string[]): string[] {
  const seen = new Set(first);
  const extra = [...new Set(rest)].filter((x) => !seen.has(x)).sort(compareStrings);
  return [...new Set(first), ...extra];
}

function serverUrl(host: string): string {
  return host.includes('://') ? host : `https://${host}`;
}
