// Bodies as the derive stage wants them. Pure; no I/O. Design: docs/design/api-docs.md §3, §7.

import type { Body, MultipartPart } from './types.js';

/**
 * Request body from what CDP gave: `postData` (text, up to maxPostDataSize), `postDataEntries`
 * (one entry per element; no `bytes` = file element) or the `Network.getRequestPostData` text.
 * For `multipart/form-data` with a boundary, splits into parts and marks file elements
 * `{ omitted: 'file' }`. Returns undefined when there is no body.
 */
export function requestBody(input: {
  contentType: string | undefined;
  postData?: string;
  entries?: readonly { bytes?: string }[];
  maxBytes: number;
}): Body | undefined {
  void input;
  throw new Error('not implemented');
}

/** Response body from `Network.getResponseBody` / `Fetch.getResponseBody`. Text for text-like mime types, base64 otherwise. */
export function responseBody(input: { mimeType: string; body: string; base64Encoded: boolean; maxBytes: number }): Body {
  void input;
  throw new Error('not implemented');
}

/** Splits a multipart body text on `--boundary`. Parts without a text payload are `{ omitted: 'file' }`. */
export function splitMultipart(text: string, boundary: string): readonly MultipartPart[] {
  void text;
  void boundary;
  throw new Error('not implemented');
}

/** The `boundary` parameter of a multipart content-type, or undefined. */
export function multipartBoundary(contentType: string | undefined): string | undefined {
  void contentType;
  throw new Error('not implemented');
}

/** True for mime types whose bodies are kept as text: json, +json, text/*, xml, javascript, x-www-form-urlencoded, graphql, event-stream. */
export function isTextMime(mimeType: string): boolean {
  void mimeType;
  throw new Error('not implemented');
}

/** JSON value of a text body when it parses, else undefined. Used by derive for shapes and bindings. */
export function bodyJson(body: Body | undefined): unknown {
  void body;
  throw new Error('not implemented');
}
