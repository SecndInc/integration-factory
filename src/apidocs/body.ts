// Bodies as the derive stage wants them. Pure; no I/O. Design: docs/design/api-docs.md §3, §7.

import type { Body, Headers, MultipartPart } from './types.js';

/** Cuts `bytes` to `maxBytes`, reporting whether it cut. */
function clip(bytes: Buffer, maxBytes: number): { bytes: Buffer; truncated: boolean } {
  return bytes.length > maxBytes ? { bytes: bytes.subarray(0, maxBytes), truncated: true } : { bytes, truncated: false };
}

function utf8OrUndefined(bytes: Buffer): string | undefined {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}

/** Text for valid UTF-8, base64 for anything else. `size` is the pre-truncation byte count. */
function fromBytes(raw: Buffer, size: number, maxBytes: number): Body {
  const { bytes, truncated } = clip(raw, maxBytes);
  const text = utf8OrUndefined(bytes) ?? (truncated ? new TextDecoder('utf-8').decode(bytes) : undefined);
  return text === undefined
    ? { encoding: 'base64', base64: bytes.toString('base64'), bytes: size, truncated }
    : { encoding: 'text', text, bytes: size, truncated };
}

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
  let raw: Buffer;
  if (input.entries && input.entries.length > 0) {
    // File elements carry no bytes; they contribute nothing, so a file-backed multipart part
    // ends up with headers and an empty payload, which splitMultipart reports as omitted.
    raw = Buffer.concat(input.entries.map((e) => (e.bytes === undefined ? Buffer.alloc(0) : Buffer.from(e.bytes, 'base64'))));
  } else if (input.postData !== undefined) {
    raw = Buffer.from(input.postData, 'utf8');
  } else {
    return undefined;
  }
  if (raw.length === 0) return undefined;

  const boundary = multipartBoundary(input.contentType);
  const body = fromBytes(raw, raw.length, input.maxBytes);
  if (boundary && body.encoding === 'text') {
    return { encoding: 'multipart', boundary, parts: splitMultipart(body.text, boundary), bytes: raw.length };
  }
  return body;
}

/** Response body from `Network.getResponseBody` / `Fetch.getResponseBody`. Text for text-like mime types, base64 otherwise. */
export function responseBody(input: { mimeType: string; body: string; base64Encoded: boolean; maxBytes: number }): Body {
  if (!input.base64Encoded) {
    // CDP only sends unencoded text, so the payload is text whatever the mime type says.
    const raw = Buffer.from(input.body, 'utf8');
    const { bytes, truncated } = clip(raw, input.maxBytes);
    return { encoding: 'text', text: truncated ? new TextDecoder('utf-8').decode(bytes) : input.body, bytes: raw.length, truncated };
  }
  const raw = Buffer.from(input.body, 'base64');
  if (isTextMime(input.mimeType)) {
    const { bytes, truncated } = clip(raw, input.maxBytes);
    return { encoding: 'text', text: new TextDecoder('utf-8').decode(bytes), bytes: raw.length, truncated };
  }
  const { bytes, truncated } = clip(raw, input.maxBytes);
  return { encoding: 'base64', base64: bytes.toString('base64'), bytes: raw.length, truncated };
}

/** Splits a multipart body text on `--boundary`. Parts without a text payload are `{ omitted: 'file' }`. */
export function splitMultipart(text: string, boundary: string): readonly MultipartPart[] {
  const delimiter = `--${boundary}`;
  const chunks = text.split(delimiter);
  const parts: MultipartPart[] = [];
  // chunks[0] is the preamble. A chunk starting with "--" is the closing delimiter.
  for (const chunk of chunks.slice(1)) {
    if (chunk.startsWith('--')) break;
    const body = chunk.replace(/^\r?\n/, '');
    const split = body.match(/\r?\n\r?\n/);
    const headText = split ? body.slice(0, split.index) : body;
    let payload = split ? body.slice((split.index ?? 0) + split[0].length) : '';
    payload = payload.replace(/\r?\n$/, '');

    const headers: [string, string][] = [];
    for (const line of headText.split(/\r?\n/)) {
      const colon = line.indexOf(':');
      if (colon > 0) headers.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()]);
    }
    const headerValue = (name: string): string | undefined => headers.find(([n]) => n.toLowerCase() === name)?.[1];
    const disposition = headerValue('content-disposition') ?? '';
    const name = disposition.match(/(?:^|[;\s])name="([^"]*)"/)?.[1];
    const filename = disposition.match(/(?:^|[;\s])filename="([^"]*)"/)?.[1];
    const contentType = headerValue('content-type');

    const part: MultipartPart = {
      headers: headers as Headers,
      content: filename !== undefined && payload === '' ? { omitted: 'file' } : { text: payload },
    };
    if (name !== undefined) part.name = name;
    if (filename !== undefined) part.filename = filename;
    if (contentType !== undefined) part.contentType = contentType;
    parts.push(part);
  }
  return parts;
}

/** The `boundary` parameter of a multipart content-type, or undefined. */
export function multipartBoundary(contentType: string | undefined): string | undefined {
  if (!contentType || !/^\s*multipart\//i.test(contentType)) return undefined;
  const m = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  return m ? (m[1] ?? m[2]) : undefined;
}

/** True for mime types whose bodies are kept as text: json, +json, text/*, xml, javascript, x-www-form-urlencoded, graphql, event-stream. */
export function isTextMime(mimeType: string): boolean {
  const base = (mimeType.split(';')[0] ?? '').trim().toLowerCase();
  if (base.startsWith('text/')) return true;
  return /json|xml|javascript|ecmascript|x-www-form-urlencoded|graphql|event-stream/.test(base);
}

/** JSON value of a text body when it parses, else undefined. Used by derive for shapes and bindings. */
export function bodyJson(body: Body | undefined): unknown {
  if (!body || body.encoding !== 'text' || body.text.trim() === '') return undefined;
  try {
    return JSON.parse(body.text);
  } catch {
    return undefined;
  }
}
