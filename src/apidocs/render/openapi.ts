// OpenAPI 3.1 from a Redacted<ApiDoc>. One operation per `api` endpoint. Every local $ref is
// inlined so the file loads in Redocly or Swagger UI unchanged and maps to MCP tool definitions
// mechanically. Extensions: x-observed-in, x-bindings, x-workflows (inputs + sequence),
// components.securitySchemes from auth. Pure. Design: docs/design/api-docs.md §6, §13 item 6.

import type { Redacted } from '../redact.js';
import type { ApiDoc } from '../types.js';

export type OpenApiDocument = Record<string, unknown>;

export function toOpenApi(doc: Redacted<ApiDoc>): OpenApiDocument {
  void doc;
  throw new Error('not implemented');
}
