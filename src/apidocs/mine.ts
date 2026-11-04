// Mining the app's own JavaScript for API routes, enums and chunk references. Pure: text in, data out.
// `apidocs mine` fetches the bundles and writes jobs/<site>/mined.json; this file never touches a socket
// or the disk. Design: docs/design/teardown-parity.md §4.
//
// What it finds:
//   - routes: string literals (single, double, template) whose content starts with `/api/` or `api/`
//     (an `https://host` prefix or a leading `${origin}` placeholder is stripped). `${...}` in a template
//     folds to `{id}`; `"/api/job/" + x` and `"/api/job/".concat(x)` fold to `/api/job/{id}`. The HTTP
//     method comes from the call site when it shows one (`.post(`, `method: "PUT"`, `fetch(` with no
//     method is GET) and is otherwise left empty.
//   - enums: `IDENT = { UPPER_SNAKE: "lower_string", ... }`, optionally `Object.freeze(...)`-wrapped.
//   - chunk refs: same-host script URLs (`/build/js/foo-abc123.js`, `static/js/123.chunk.js`) so the
//     fetch loop can follow them. The webpack `"static/js/" + ({...}[id]||id) + "." + {...}[id] + ".chunk.js"`
//     table is not expanded (it needs the runtime public path); the plain literals cover most bundles.

import { mineContextWindowChars, minePathMaxChars } from './limits.js';
import { httpMethods, type HttpMethod } from './types.js';


export interface MinedRoute {
  path: string;
  methods: HttpMethod[];
}

export interface MinedEnum {
  name: string;
  values: string[];
}

export interface MinedParts {
  routes: MinedRoute[];
  enums: MinedEnum[];
}

// ---------------------------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------------------------

/** A quote, then optionally an origin or a leading `${...}`, then `/api/` or `api/`. */
const routeAnchor = /["'`](?:https?:\/\/[^/"'`\s]+|\$\{[^{}]*\})?\/?api\//g;
/** Anything a route path never carries: whitespace, HTML, code, globs. */
const invalidPathChars = /[\s<>()*]/;
const methodSet = new Set<string>(httpMethods);
const methodRank = new Map<HttpMethod, number>(httpMethods.map((m, i) => [m, i]));

/** Position just past the closing quote of the literal that opens at `open`, or -1 when it never closes. */
function literalEnd(text: string, open: number): number {
  const quote = text[open]!;
  let depth = 0;
  for (let i = open + 1; i < text.length; i += 1) {
    const ch = text[i]!;
    if (ch === '\\') {
      i += 1;
      continue;
    }
    if (quote === '`') {
      if (ch === '$' && text[i + 1] === '{') {
        depth += 1;
        i += 1;
      } else if (ch === '}' && depth > 0) {
        depth -= 1;
      } else if (ch === '`' && depth === 0) {
        return i + 1;
      }
      continue;
    }
    if (ch === '\n') return -1;
    if (ch === quote) return i + 1;
  }
  return -1;
}

/** `${...}` folded to `{id}`, brace depth respected. */
function foldPlaceholders(content: string): string {
  let out = '';
  for (let i = 0; i < content.length; i += 1) {
    if (content[i] === '$' && content[i + 1] === '{') {
      let depth = 1;
      let j = i + 2;
      while (j < content.length && depth > 0) {
        if (content[j] === '{') depth += 1;
        else if (content[j] === '}') depth -= 1;
        j += 1;
      }
      out += '{id}';
      i = j - 1;
      continue;
    }
    out += content[i];
  }
  return out;
}

/** `+ "/more"`: a string continuation that keeps building the path. */
const stringContinuation = /^\s*\+\s*(["'])(\/[^"'`\s]*)\1/;
const plusOperator = /^\s*\+\s*/;
/** An identifier, member chain, index or call with no nesting: `id`, `a.b`, `x[0]`, `encodeURIComponent(id)`. */
const simpleOperand = /^[\w$.]+(?:\[[^\]]*\])*(?:\([^()]*\))?/;
const concatCall = /^\s*\.concat\(\s*[^()]*\)/;

/**
 * Follows `+ x`, `.concat(x)` and `+ "/more"` after a literal and returns the folded suffix. Only called when
 * the literal ends with `/`, so `"/api/jobs" + "?x"` style query building is left alone.
 */
function foldConcatenation(tail: string): string {
  let suffix = '';
  let rest = tail;
  for (let guard = 0; guard < 8; guard += 1) {
    const cont = stringContinuation.exec(rest);
    if (cont) {
      suffix += cont[2];
      rest = rest.slice(cont[0].length);
      if (!suffix.endsWith('/')) break;
      continue;
    }
    const plus = plusOperator.exec(rest);
    if (plus) {
      suffix += '{id}';
      rest = rest.slice(plus[0].length);
      const operand = simpleOperand.exec(rest);
      if (!operand) break;
      rest = rest.slice(operand[0].length);
      continue;
    }
    const concat = concatCall.exec(rest);
    if (concat) {
      suffix += '{id}';
      rest = rest.slice(concat[0].length);
      continue;
    }
    break;
  }
  return suffix;
}

function normalisePath(raw: string): string | undefined {
  let p = raw.replace(/^https?:\/\/[^/]+/, '');
  if (p.startsWith('{id}/api/')) p = p.slice('{id}'.length);
  if (p.startsWith('api/')) p = `/${p}`;
  const cut = p.search(/[?#]/);
  if (cut !== -1) p = p.slice(0, cut);
  if (!p.startsWith('/api/') || p.length <= '/api/'.length) return undefined;
  if (p.length > minePathMaxChars || invalidPathChars.test(p)) return undefined;
  return p;
}

const verbCallBefore = /\.(get|post|put|patch|delete|head|options)\s*\(\s*$/i;
const fetchBefore = /\bfetch\s*\(\s*$/;
const methodOption = /\bmethod\s*:\s*["'`]([a-z]+)["'`]/gi;

function asMethod(word: string): HttpMethod | undefined {
  const upper = word.toUpperCase();
  return methodSet.has(upper) ? (upper as HttpMethod) : undefined;
}

function methodOptionsIn(window: string): HttpMethod[] {
  const found: HttpMethod[] = [];
  methodOption.lastIndex = 0;
  for (let m = methodOption.exec(window); m; m = methodOption.exec(window)) {
    const method = asMethod(m[1]!);
    if (method) found.push(method);
  }
  return found;
}

/**
 * The method the call site shows for a literal, or undefined. `before` and `after` are the context windows,
 * already cut at the neighbouring route literals. A `method:` option counts only inside the same statement as the
 * path (no `;` between them; before the path, also no `}`), so a sibling call's option is not read as this one's.
 */
function inferMethod(before: string, after: string): HttpMethod | undefined {
  const verb = verbCallBefore.exec(before);
  if (verb) return asMethod(verb[1]!);
  const semicolon = after.indexOf(';');
  const optionsAfter = methodOptionsIn(semicolon === -1 ? after : after.slice(0, semicolon));
  if (optionsAfter.length > 0) return optionsAfter[0];
  const sameObjectBefore = before.slice(Math.max(before.lastIndexOf(';'), before.lastIndexOf('}')) + 1);
  const optionsBefore = methodOptionsIn(sameObjectBefore);
  if (optionsBefore.length > 0) return optionsBefore[optionsBefore.length - 1];
  if (fetchBefore.test(before)) return 'GET';
  return undefined;
}

function sortMethods(methods: Iterable<HttpMethod>): HttpMethod[] {
  return [...new Set(methods)].sort((a, b) => methodRank.get(a)! - methodRank.get(b)!);
}

function sortRoutes(routes: Map<string, Set<HttpMethod>>): MinedRoute[] {
  return [...routes.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, methods]) => ({ path, methods: sortMethods(methods) }));
}

/** API path strings in bundle text, with the method the call site shows. Sorted by path; methods merged per path. */
export function extractRoutes(text: string): MinedRoute[] {
  const routes = new Map<string, Set<HttpMethod>>();
  const anchor = new RegExp(routeAnchor.source, 'g');
  const nextAnchor = new RegExp(routeAnchor.source, 'g');
  let previousEnd = 0;
  for (let m = anchor.exec(text); m; m = anchor.exec(text)) {
    const open = m.index;
    const end = literalEnd(text, open);
    if (end === -1) continue;
    anchor.lastIndex = end;
    const content = text.slice(open + 1, end - 1);
    let folded = text[open] === '`' ? foldPlaceholders(content) : content;
    if (folded.endsWith('/')) folded += foldConcatenation(text.slice(end, end + mineContextWindowChars));
    const path = normalisePath(folded);
    if (!path) continue;

    nextAnchor.lastIndex = end;
    const next = nextAnchor.exec(text);
    const before = text.slice(Math.max(previousEnd, open - mineContextWindowChars), open);
    const after = text.slice(end, Math.min(next ? next.index : text.length, end + mineContextWindowChars));
    previousEnd = end;

    const methods = routes.get(path) ?? new Set<HttpMethod>();
    const method = inferMethod(before, after);
    if (method) methods.add(method);
    routes.set(path, methods);
  }
  return sortRoutes(routes);
}

// ---------------------------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------------------------

const enumLiteral = /([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\s*\(\s*)?\{([^{}]*)\}/g;
const enumEntry = /^(?:"([A-Z][A-Z0-9_]*)"|'([A-Z][A-Z0-9_]*)'|([A-Z][A-Z0-9_]*))\s*:\s*(?:"([a-z0-9_-]+)"|'([a-z0-9_-]+)')$/;

function parseEnumBody(body: string): string[] | undefined {
  const entries = body.split(',').map((e) => e.trim()).filter((e) => e.length > 0);
  if (entries.length < 2) return undefined;
  const values: string[] = [];
  for (const entry of entries) {
    const m = enumEntry.exec(entry);
    if (!m) return undefined;
    values.push((m[4] ?? m[5])!);
  }
  return values;
}

function sortEnums(enums: Iterable<MinedEnum>): MinedEnum[] {
  const seen = new Map<string, MinedEnum>();
  for (const e of enums) {
    const key = `${e.name}=${e.values.join(',')}`;
    if (!seen.has(key)) seen.set(key, { name: e.name, values: [...e.values] });
  }
  return [...seen.keys()].sort().map((key) => seen.get(key)!);
}

/**
 * A TypeScript enum as the compiler emits it: `t.Key="value",t.Other="other"` inside `(function(t){...})(Name||(Name={}))`.
 * One run of string assignments to Capitalised keys on the same variable; named after the enum when the IIFE
 * argument follows, else after the variable.
 */
const compiledEnumRun = /([A-Za-z_$][\w$]*)\.([A-Z][\w]*)\s*=\s*"([^"\\]{1,80})"(?:\s*[,;]\s*\1\.[A-Z][\w]*\s*=\s*"[^"\\]{1,80}")+/g;
const compiledEnumEntry = /\.([A-Z][\w]*)\s*=\s*"([^"\\]{1,80})"/g;
const compiledEnumName = /^\s*;?\s*\}\s*\)\s*\(\s*([A-Za-z_$][\w$]*)\s*(?:\|\||=)/;

/**
 * Enums in bundle text: object literals `NAME = { UPPER_SNAKE: "lower", ... }` and compiled TypeScript enums
 * (two entries or more). Sorted by name; deduped by name and values.
 */
export function extractEnums(text: string): MinedEnum[] {
  const found: MinedEnum[] = [];
  const literal = new RegExp(enumLiteral.source, 'g');
  for (let m = literal.exec(text); m; m = literal.exec(text)) {
    const values = parseEnumBody(m[2]!);
    if (values) found.push({ name: m[1]!, values });
  }
  const run = new RegExp(compiledEnumRun.source, 'g');
  for (let m = run.exec(text); m; m = run.exec(text)) {
    const entry = new RegExp(compiledEnumEntry.source, 'g');
    const values: string[] = [];
    for (let e = entry.exec(m[0]); e; e = entry.exec(m[0])) values.push(e[2]!);
    const after = compiledEnumName.exec(text.slice(m.index + m[0].length, m.index + m[0].length + minePathMaxChars));
    found.push({ name: after?.[1] ?? m[1]!, values });
  }
  return sortEnums(found);
}

// ---------------------------------------------------------------------------------------------
// Chunk references
// ---------------------------------------------------------------------------------------------

const scriptRef = /["'`]((?:https?:\/\/[^"'`\s$]+|\/?[\w@%~.-]+(?:\/[\w@%~.-]+)+)\.m?js)["'`]/g;

/**
 * Same-host script URLs referenced inside a bundle, resolved against `baseUrl`. A ref with no leading `/`
 * (`static/js/1.chunk.js`) resolves against the origin root, the webpack public-path convention; `/x.js`,
 * `./x.js`, `../x.js` and absolute URLs resolve as a browser would.
 */
export function extractChunkRefs(text: string, baseUrl: string): string[] {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const out = new Set<string>();
  const ref = new RegExp(scriptRef.source, 'g');
  for (let m = ref.exec(text); m; m = ref.exec(text)) {
    const value = m[1]!;
    const against = /^(?:https?:\/\/|\/|\.\.?\/)/.test(value) ? base : `${base.origin}/`;
    let resolved: URL;
    try {
      resolved = new URL(value, against);
    } catch {
      continue;
    }
    if (resolved.host !== base.host || (resolved.protocol !== 'http:' && resolved.protocol !== 'https:')) continue;
    resolved.hash = '';
    out.add(resolved.href);
  }
  return [...out];
}

// ---------------------------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------------------------

/** Routes merged per path (methods unioned), enums deduped; both sorted. */
export function mergeMined(parts: readonly MinedParts[]): MinedParts {
  const routes = new Map<string, Set<HttpMethod>>();
  for (const part of parts) {
    for (const route of part.routes) {
      const set = routes.get(route.path) ?? new Set<HttpMethod>();
      for (const method of route.methods) set.add(method);
      routes.set(route.path, set);
    }
  }
  return { routes: sortRoutes(routes), enums: sortEnums(parts.flatMap((p) => p.enums)) };
}

/** Everything `extractRoutes` and `extractEnums` find in one bundle. */
export function mineBundle(text: string): MinedParts {
  return { routes: extractRoutes(text), enums: extractEnums(text) };
}
