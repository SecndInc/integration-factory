// The four outputs from one Redacted<ApiDoc>. Pure; no I/O. Byte-stable: the same doc gives the
// same bytes (stable key order, stable sorting, no clock). Design: docs/design/api-docs.md §6.

import type { Redacted } from '../redact.js';
import type { ApiDoc } from '../types.js';
import { toHtml } from './html.js';
import { toMarkdown } from './markdown.js';
import { toOpenApi } from './openapi.js';
import { stableJson } from './shared.js';

export interface RenderedDocs {
  'api.json': string;
  'openapi.json': string;
  'index.html': string;
  'README.md': string;
}

export function renderApiDoc(doc: Redacted<ApiDoc>): RenderedDocs {
  return {
    'api.json': stableJson(doc),
    'openapi.json': stableJson(toOpenApi(doc)),
    'index.html': toHtml(doc),
    'README.md': toMarkdown(doc),
  };
}

/** JSON.stringify with keys sorted at every level and a trailing newline. Implemented in shared.ts. */
export { stableJson };
