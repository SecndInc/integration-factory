// derive(): assembled traces + workflow specs -> ApiDoc. Pure; no I/O; unit-tested on committed
// scrubbed fixture traces. Design: docs/design/api-docs.md §5.
//
// Order of work inside derive():
//   1. usable runs: traces with outcome 'completed'; a write workflow needs an `inverse` or it is listed, not derived
//   2. endpointKey: method + host + templatePath(path) (+ GraphQL operationName); isIdSegment from capture/path-template.ts
//   3. kinds: text/html documents -> 'page'; OPTIONS with access-control-request-method folds into its target (cors: true);
//      resourceType in {XHR, Fetch, Document, WebSocket, EventSource} or Other with JSON mime; ambient per limits.ts
//   4. bindings and inputs on real values, walking each trace in seq order (see findBindings)
//   5. schemas: shapeToJsonSchema over the examples per status; required = keys present in every example
//   6. redact last: every example and param through redact(); the result is a Redacted<ApiDoc>
//   7. auth: cookie names on every in-scope request, token-shaped header names, login workflow's verification
//   8. cases: one per completed run per workflow; coverage: counts only

import type { ResolvedTarget } from '../target.js';
import type { Redacted, RedactionPolicy } from './redact.js';
import type { ApiDoc, Binding, Exchange, JsonSchema, Trace, Workflow } from './types.js';

export interface DeriveInput {
  target: ResolvedTarget;
  workflows: readonly Workflow[];
  /** Assembled traces with their file paths, any outcome. */
  traces: readonly { path: string; trace: Trace }[];
  redaction: RedactionPolicy;
}

export function derive(input: DeriveInput): Redacted<ApiDoc> {
  void input;
  throw new Error('not implemented');
}

/** JSON Schema 2020-12 subset: type, properties, items, required, anyOf. Depth and key caps from limits.ts. A null mixed in gives type [T, "null"]. */
export function shapeToJsonSchema(examples: readonly unknown[]): JsonSchema {
  void examples;
  throw new Error('not implemented');
}

export interface ValueSource {
  exchangeId: Exchange['id'];
  location: Binding['from']['location'];
  path: string;
}

/**
 * For each dynamic value in `exchange` (path params, query values, non-standard headers, body leaves)
 * find the most recent earlier source: a response body leaf, response header, Set-Cookie value, or a
 * storage snapshot entry. Values shorter than bindingMinStringLength / bindingMinNumberDigits are skipped.
 * A value equal to a declared input is reported as `input`; no hit and high entropy -> `computed`.
 */
export function findBindings(
  exchange: Exchange,
  earlier: readonly Exchange[],
  snapshots: Trace['snapshots'],
  inputs: Readonly<Record<string, string>>,
): readonly { to: Binding['to']; from?: ValueSource; input?: string; computed: boolean }[] {
  void exchange;
  void earlier;
  void snapshots;
  void inputs;
  throw new Error('not implemented');
}

/** `/drafts/9f2c...` -> `/drafts/{draftId}`; params named after the previous segment, fallback {id}, {id2}. */
export function templatePath(path: string): { template: string; params: readonly { name: string; value: string }[] } {
  void path;
  throw new Error('not implemented');
}

/** operationName from a JSON body, or the name in its `query` text, for a POST to a path ending in /graphql. */
export function graphqlOperation(exchange: Exchange): string | undefined {
  void exchange;
  throw new Error('not implemented');
}
