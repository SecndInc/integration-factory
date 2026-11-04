// The module rules from docs/design/api-docs.md §9, as a failing test instead of prose:
//   - pure modules import nothing that does I/O
//   - only cdp.ts opens a socket; only recorder.ts writes a trace file
//   - outside src/apidocs, only the CLI and drivers reach into it
//   - no bare numeric limits outside limits.ts (every limit has a name)
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..', '..', 'src', 'apidocs');

const pureModules = ['body.ts', 'har.ts', 'derive.ts', 'redact.ts', 'noise.ts', 'mine.ts', 'types.ts', 'limits.ts', 'errors.ts', 'render/index.ts', 'render/openapi.ts', 'render/html.ts', 'render/markdown.ts'];
const ioImports = ['node:fs', 'node:http', 'node:https', 'node:net', 'node:child_process', 'playwright', 'node:readline'];

async function importsOf(file: string): Promise<string[]> {
  const text = await fs.readFile(path.join(root, file), 'utf8');
  return [...text.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1]!);
}

test('pure apidocs modules import nothing that does I/O', async () => {
  for (const file of pureModules) {
    const imports = await importsOf(file);
    const bad = imports.filter((i) => ioImports.some((io) => i === io || i.startsWith(`${io}/`)));
    assert.deepEqual(bad, [], `${file} imports ${bad.join(', ')}`);
  }
});

test('trace.ts may import node:fs only for readTrace; it never imports the recorder or cdp', async () => {
  const imports = await importsOf('trace.ts');
  assert.ok(!imports.some((i) => i.includes('recorder') || i.includes('cdp')), `trace.ts imports ${imports.join(', ')}`);
});

test('only cdp.ts opens a socket', async () => {
  const files = await allFiles(root);
  for (const file of files) {
    if (file.endsWith('cdp.ts')) continue;
    const text = await fs.readFile(file, 'utf8');
    assert.ok(!/new WebSocket\(/.test(text), `${path.relative(root, file)} opens a WebSocket`);
  }
});

test('only recorder.ts writes a trace file', async () => {
  const files = await allFiles(root);
  for (const file of files) {
    if (file.endsWith('recorder.ts')) continue;
    const text = await fs.readFile(file, 'utf8');
    assert.ok(!/createWriteStream\(/.test(text), `${path.relative(root, file)} creates a write stream`);
  }
});

test('renderers accept only a Redacted doc', async () => {
  for (const file of ['render/openapi.ts', 'render/html.ts', 'render/markdown.ts']) {
    const text = await fs.readFile(path.join(root, file), 'utf8');
    assert.match(text, /Redacted<ApiDoc>/, `${file} must take Redacted<ApiDoc>`);
  }
});

test('numeric limits live in limits.ts', async () => {
  const files = (await allFiles(root)).filter((f) => !f.endsWith('limits.ts') && !f.endsWith('types.ts'));
  const suspicious = /\b(?:\d{4,}|\d+\s*\*\s*1024)\b/;
  for (const file of files) {
    const lines = (await fs.readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '');
      if (/^\s*(\*|\/\*)/.test(line)) return;
      if (suspicious.test(code) && !/status|\b(?:19|20)\d\d\b|zod|z\./i.test(code)) {
        assert.fail(`${path.relative(root, file)}:${i + 1} has a bare limit: ${line.trim()}`);
      }
    });
  }
});

async function allFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await allFiles(p)));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}
