// Helpers shared by the four renderers. Pure; no I/O, no clock, no randomness.
// Everything here is order-stable so the same ApiDoc gives the same bytes.

import type { ApiDoc, Binding, Endpoint, JsonSchema, WorkflowDoc } from '../types.js';

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** JSON.stringify with keys sorted at every level, 2-space indent and a trailing newline. */
export function stableJson(value: unknown): string {
  return `${JSON.stringify(canonical(value), null, 2) ?? 'null'}\n`;
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    const toJson = (value as { toJSON?: unknown }).toJSON;
    if (typeof toJson === 'function') return canonical((toJson as () => unknown).call(value));
    const record = value as Record<string, unknown>;
    // fromEntries defines own properties, so a key named "__proto__" cannot rewrite the prototype.
    return Object.fromEntries(
      Object.keys(record)
        .sort(compareStrings)
        .map((key) => [key, canonical(record[key])]),
    );
  }
  return value;
}

/** Example values as shown on a page: strings verbatim, everything else as stable JSON. */
export function prettyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  return stableJson(value).replace(/\n$/, '');
}

export function compareEndpoints(a: Endpoint, b: Endpoint): number {
  return (
    compareStrings(a.host, b.host) ||
    compareStrings(a.pathTemplate, b.pathTemplate) ||
    compareStrings(a.method.toUpperCase(), b.method.toUpperCase()) ||
    compareStrings(a.operation ?? '', b.operation ?? '') ||
    compareStrings(a.id, b.id)
  );
}

export function sortedEndpoints(doc: ApiDoc): Endpoint[] {
  return [...doc.endpoints].sort(compareEndpoints);
}

/** `GET /v1/items/{itemId}`, with `(Operation)` appended for a GraphQL operation. */
export function endpointTitle(ep: Endpoint): string {
  const base = `${ep.method.toUpperCase()} ${ep.pathTemplate}`;
  return ep.operation === null ? base : `${base} (${ep.operation})`;
}

export function firstSegment(pathTemplate: string): string {
  const seg = pathTemplate.split('/').filter((s) => s.length > 0)[0];
  return seg === undefined ? '/' : `/${seg}`;
}

/** Status the exchange got, from the workflow's step calls. */
export function statusByExchange(workflow: WorkflowDoc): Map<string, number | null> {
  const out = new Map<string, number | null>();
  for (const step of workflow.steps) for (const call of step.calls) out.set(call.exchangeId, call.status);
  return out;
}

/** Workflows whose steps hit this endpoint, in document order. */
export function workflowsOf(doc: ApiDoc, endpointId: string): WorkflowDoc[] {
  return doc.workflows.filter((wf) => wf.steps.some((s) => s.calls.some((c) => c.endpointId === endpointId)));
}

export interface OutgoingBinding {
  endpoint: Endpoint;
  binding: Binding;
}

/** Bindings on other endpoints whose value comes from this endpoint's response. */
export function bindingsOut(doc: ApiDoc, endpointId: string): OutgoingBinding[] {
  const out: OutgoingBinding[] = [];
  for (const endpoint of sortedEndpoints(doc)) {
    for (const binding of endpoint.bindings) {
      if (binding.from.endpointId === endpointId) out.push({ endpoint, binding });
    }
  }
  return out;
}

export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function requiredText(required: boolean | 'unknown'): string {
  return required === 'unknown' ? 'unknown' : required ? 'yes' : 'no';
}

/**
 * Replaces every local `$ref` with the node it points to, so the output has no `$ref` and no shared
 * definitions. A cycle, an external ref or a ref that does not resolve becomes `{}` (any value).
 */
export function inlineRefs(schema: JsonSchema): JsonSchema {
  const resolved = walk(schema, schema, [], true);
  return isRecord(resolved) ? resolved : {};
}

function walk(node: unknown, root: JsonSchema, stack: readonly string[], atRoot: boolean): unknown {
  if (Array.isArray(node)) return node.map((child) => walk(child, root, stack, false));
  if (!isRecord(node)) return node;
  const ref = node['$ref'];
  if (typeof ref === 'string') {
    if (!ref.startsWith('#') || stack.includes(ref)) return {};
    const target = pointer(root, ref);
    if (target === undefined) return {};
    const inlined = walk(target, root, [...stack, ref], false);
    const siblings = Object.entries(node).filter(([key]) => key !== '$ref');
    if (siblings.length === 0 || !isRecord(inlined)) return inlined;
    const extra = walk(Object.fromEntries(siblings), root, stack, false);
    return { ...inlined, ...(isRecord(extra) ? extra : {}) };
  }
  const entries = Object.entries(node)
    .filter(([key]) => !(atRoot && (key === '$defs' || key === 'definitions' || key === '$schema')))
    .map(([key, value]): [string, unknown] => [key, walk(value, root, stack, false)]);
  return Object.fromEntries(entries);
}

function pointer(root: JsonSchema, ref: string): unknown {
  if (ref === '#') return root;
  if (!ref.startsWith('#/')) return undefined;
  let cur: unknown = root;
  for (const raw of ref.slice(2).split('/')) {
    const key = decodeURIComponent(raw).replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(cur)) cur = cur[Number(key)];
    else if (isRecord(cur)) cur = cur[key];
    else return undefined;
  }
  return cur;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
