// index.html: one self-contained file, no build step, no network, inline CSS and inline SVG for the
// sequence diagram. Sections in order: header + coverage line + run list; Auth; Workflows (inputs,
// latest run, steps with calls, sequence diagram, zero-exchange `network` steps flagged); Endpoints
// grouped by first path segment (params with source, request schema + example, responses per status,
// bindings, evidence); Background traffic (ambient); Seen outside any step.
// Reference, not tutorial: no prose the data cannot back. Pure. Design: docs/design/api-docs.md §6.

import type { Redacted } from '../redact.js';
import type { ApiDoc } from '../types.js';

export function toHtml(doc: Redacted<ApiDoc>): string {
  void doc;
  throw new Error('not implemented');
}

/** Inline SVG of `sequence[]` for one workflow: one lane per host, one arrow per call, labelled METHOD path -> status. */
export function sequenceSvg(workflow: Redacted<ApiDoc>['workflows'][number], endpoints: Redacted<ApiDoc>['endpoints']): string {
  void workflow;
  void endpoints;
  throw new Error('not implemented');
}

/** HTML-escapes text. Every string from the doc goes through this before it lands in markup. */
export function escapeHtml(text: string): string {
  void text;
  throw new Error('not implemented');
}
