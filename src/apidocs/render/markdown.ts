// README.md: the Markdown form of the same sections as index.html, for the PR and for agents.
// Headings carry the facts ("3 workflows, 27 endpoints, 2 bindings"), not labels. Pure.
// Design: docs/design/api-docs.md §6.

import type { Redacted } from '../redact.js';
import type { ApiDoc } from '../types.js';

export function toMarkdown(doc: Redacted<ApiDoc>): string {
  void doc;
  throw new Error('not implemented');
}
