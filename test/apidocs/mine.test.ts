import assert from 'node:assert/strict';
import test from 'node:test';
import { minePathMaxChars } from '../../src/apidocs/limits.js';
import { extractChunkRefs, extractEnums, extractRoutes, mergeMined } from '../../src/apidocs/mine.js';

// ---- extractRoutes

test('extractRoutes: double, single and template literals; api/ is normalised to /api/; dedupe', () => {
  const text = `
    const a = "/api/jobs";
    const b = '/api/jobs';
    const c = \`/api/teams\`;
    const d = "api/users";
    const e = "/api/jobs";
  `;
  assert.deepEqual(extractRoutes(text), [
    { path: '/api/jobs', methods: [] },
    { path: '/api/teams', methods: [] },
    { path: '/api/users', methods: [] },
  ]);
});

test('extractRoutes: template placeholders fold to {id}, a leading origin placeholder or https origin is stripped', () => {
  const text = [
    'fetch(`/api/jobs/${id}/notes/${note.id}`)',
    'fetch(`${origin}/api/teams/${teamId}`)',
    'axios.get("https://app.example.com/api/me")',
  ].join(';\n');
  assert.deepEqual(extractRoutes(text), [
    { path: '/api/jobs/{id}/notes/{id}', methods: ['GET'] },
    { path: '/api/me', methods: ['GET'] },
    { path: '/api/teams/{id}', methods: ['GET'] },
  ]);
});

test('extractRoutes: string concatenation after a trailing slash folds to {id}, including .concat and continuations', () => {
  const text = [
    'fetch("/api/job/" + jobId)',
    'fetch("/api/job/".concat(id))',
    'fetch("/api/team/" + teamId + "/members/" + memberId)',
    'fetch("/api/card/" + encodeURIComponent(cardId) + "/notes")',
    'const base = "/api/plain" + "?x=1"',
  ].join(';\n');
  assert.deepEqual(extractRoutes(text), [
    { path: '/api/card/{id}/notes', methods: ['GET'] },
    { path: '/api/job/{id}', methods: ['GET'] },
    { path: '/api/plain', methods: [] },
    { path: '/api/team/{id}/members/{id}', methods: ['GET'] },
  ]);
});

test('extractRoutes: method from .verb( call sites, method: options before and after, fetch with no method is GET', () => {
  const text = [
    'axios.post("/api/jobs", body)',
    'http.put(`/api/jobs/${id}`, body)',
    'client.patch("/api/jobs/1/status")',
    'api.delete("/api/jobs/2")',
    'fetch("/api/jobs", { method: "POST" })',
    'fetch("/api/jobs", { headers: { a: "1" }, method: "PUT" })',
    'fetch("/api/search", {method:"post"})',
    'request({ method: "DELETE", url: "/api/jobs/3" })',
    'fetch("/api/profile")',
    'const path = "/api/unknown"',
  ].join(';\n');
  assert.deepEqual(extractRoutes(text), [
    { path: '/api/jobs', methods: ['POST', 'PUT'] },
    { path: '/api/jobs/1/status', methods: ['PATCH'] },
    { path: '/api/jobs/2', methods: ['DELETE'] },
    { path: '/api/jobs/3', methods: ['DELETE'] },
    { path: '/api/jobs/{id}', methods: ['PUT'] },
    { path: '/api/profile', methods: ['GET'] },
    { path: '/api/search', methods: ['POST'] },
    { path: '/api/unknown', methods: [] },
  ]);
});

test('extractRoutes: a neighbouring call\'s method option is not read as this literal\'s', () => {
  const text = 'const a = "/api/a"; fetch("/api/b", { method: "POST" }); const c = "/api/c";';
  assert.deepEqual(extractRoutes(text), [
    { path: '/api/a', methods: [] },
    { path: '/api/b', methods: ['POST'] },
    { path: '/api/c', methods: [] },
  ]);
});

test('extractRoutes: drops whitespace, angle brackets, parens, globs, over-long and bare /api/ literals; cuts query strings', () => {
  const long = `/api/${'x'.repeat(minePathMaxChars)}`;
  const text = [
    '"/api/with space"',
    '"/api/<tag>"',
    '"/api/(group)"',
    '"/api/*"',
    `"${long}"`,
    '"/api/"',
    '"/api/items?page=1"',
    '"/api/items#frag"',
    '"not /api/inside"',
    '"/apidocs/x"',
  ].join(', ');
  assert.deepEqual(extractRoutes(text), [{ path: '/api/items', methods: [] }]);
});

test('extractRoutes: an unterminated literal is skipped and the rest of the text is still scanned', () => {
  const text = 'x = "/api/broken\nfetch("/api/ok")';
  assert.deepEqual(extractRoutes(text), [{ path: '/api/ok', methods: ['GET'] }]);
});

// ---- extractEnums

test('extractEnums: readable, minified, quoted keys and Object.freeze; dedupe by name and values', () => {
  const text = [
    'const JobStatus = { DRAFT: "draft", SENT: "sent", ACCEPTED: "accepted" }',
    'var e={ACTIVE:"active",ARCHIVED:"archived"}',
    'exports.Role = { "OWNER": \'owner\', \'MEMBER\': "member", }',
    'const Kind = Object.freeze({ ONE: "one", TWO: "two-2", THREE: "three_3" })',
    'const JobStatus = { DRAFT: "draft", SENT: "sent", ACCEPTED: "accepted" }',
  ].join(';\n');
  assert.deepEqual(extractEnums(text), [
    { name: 'JobStatus', values: ['draft', 'sent', 'accepted'] },
    { name: 'Kind', values: ['one', 'two-2', 'three_3'] },
    { name: 'Role', values: ['owner', 'member'] },
    { name: 'e', values: ['active', 'archived'] },
  ]);
});

test('extractEnums: rejects one entry, non-UPPER_SNAKE keys, uppercase or non-string values, nested objects', () => {
  const text = [
    'const One = { ONLY: "only" }',
    'const Mixed = { Active: "active", DONE: "done" }',
    'const Upper = { A: "A", B: "B" }',
    'const Numbers = { A: 1, B: 2 }',
    'const Nested = { A: { B: "b" }, C: "c" }',
    'const Spaced = { A: "a b", B: "c" }',
    'x == { A: "a", B: "b" }',
  ].join(';\n');
  assert.deepEqual(extractEnums(text), []);
});

// ---- extractChunkRefs

test('extractChunkRefs: same-host refs only, bare paths resolve from the origin root, hashes dropped, dedupe', () => {
  const base = 'https://app.example.com/build/js/main-abc.js';
  const text = [
    '"/build/js/foo-abc123.js"',
    "'static/js/123.chunk.js'",
    '`./vendor-1.js`',
    '"../lib/x.mjs"',
    '"https://app.example.com/build/js/other.js"',
    '"https://cdn.other.com/lib.js"',
    '"//cdn.other.com/proto.js"',
    '"/build/js/foo-abc123.js"',
    '"data.json"',
    '"/no/slash/at/end.js.map"',
    '`/build/js/${name}.js`',
  ].join(',');
  assert.deepEqual(extractChunkRefs(text, base), [
    'https://app.example.com/build/js/foo-abc123.js',
    'https://app.example.com/static/js/123.chunk.js',
    'https://app.example.com/build/js/vendor-1.js',
    'https://app.example.com/build/lib/x.mjs',
    'https://app.example.com/build/js/other.js',
  ]);
  assert.deepEqual(extractChunkRefs('"/a/b.js"', 'not a url'), []);
});

// ---- mergeMined

test('mergeMined: methods union per path, enums deduped, both sorted', () => {
  const merged = mergeMined([
    { routes: [{ path: '/api/b', methods: ['POST'] }, { path: '/api/a', methods: [] }], enums: [{ name: 'Z', values: ['z'] }] },
    { routes: [{ path: '/api/b', methods: ['GET', 'POST'] }], enums: [{ name: 'A', values: ['a'] }, { name: 'Z', values: ['z'] }] },
  ]);
  assert.deepEqual(merged, {
    routes: [
      { path: '/api/a', methods: [] },
      { path: '/api/b', methods: ['GET', 'POST'] },
    ],
    enums: [
      { name: 'A', values: ['a'] },
      { name: 'Z', values: ['z'] },
    ],
  });
});

test('extractEnums reads compiled TypeScript enums and names them after the IIFE argument', () => {
  const text =
    '(function(t){t.JOB_CREATED="job_created",t.JobUpdated="job_updated";t.Done="done"})(EventName||(EventName={}));' +
    'e.displayName="Button",e.defaultProps={};' +
    '(function(r){r.A="a"})(Single||(Single={}));' +
    'var x=1;(function(s){s.Draft="draft",s.Live="live"})(Status=Status||{})';
  const enums = extractEnums(text);
  assert.deepEqual(enums, [
    { name: 'EventName', values: ['job_created', 'job_updated', 'done'] },
    { name: 'Status', values: ['draft', 'live'] },
  ]);
});
