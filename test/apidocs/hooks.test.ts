// The .claude hooks, run the way Claude Code runs them: node <hook> with the tool call as JSON on stdin,
// CLAUDE_PROJECT_DIR set, exit 2 plus a stderr reason to block. Design: docs/design/agent-guidance.md §4.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
import { hashDocs } from '../../scripts/apidocs-docs-scan.js';

const hooksDir = path.resolve('.claude/hooks');

function run(hook: string, input: unknown, root: string) {
  const r = spawnSync(process.execPath, [path.join(hooksDir, hook)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
    timeout: 20_000,
  });
  return { status: r.status, stderr: r.stderr, stdout: r.stdout };
}

const bash = (command: string) => ({ tool_name: 'Bash', tool_input: { command } });
const write = (file_path: string) => ({ tool_name: 'Write', tool_input: { file_path } });

async function project() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hooks-'));
  await fs.mkdir(path.join(root, 'targets'), { recursive: true });
  await fs.mkdir(path.join(root, 'workflows', 'widgetry'), { recursive: true });
  await fs.writeFile(path.join(root, 'targets', 'widgetry.json'), JSON.stringify({ name: 'Widgetry', startUrl: 'http://127.0.0.1:1/', environment: 'production' }));
  await fs.writeFile(path.join(root, 'targets', 'staging.json'), JSON.stringify({ name: 'Staging', startUrl: 'http://127.0.0.1:1/', environment: 'staging' }));
  await fs.writeFile(path.join(root, 'workflows', 'widgetry', 'create-item.json'), JSON.stringify({ workflowVersion: 1, id: 'create-item', effect: 'write', inverse: 'delete-item', steps: [] }));
  await fs.writeFile(path.join(root, 'workflows', 'widgetry', 'no-inverse.json'), JSON.stringify({ workflowVersion: 1, id: 'no-inverse', effect: 'write', steps: [] }));
  await fs.writeFile(path.join(root, 'workflows', 'widgetry', 'list-items.json'), JSON.stringify({ workflowVersion: 1, id: 'list-items', effect: 'read', steps: [] }));
  return root;
}

async function docs(root: string, site: string) {
  const dir = path.join(root, 'docs', 'apis', site);
  await fs.mkdir(dir, { recursive: true });
  for (const name of ['README.md', 'api.json', 'index.html', 'openapi.json']) await fs.writeFile(path.join(dir, name), `${name} for ${site}`);
  return dir;
}

test('guard-bash: pushes to main or master are blocked, feature branches pass', async () => {
  const root = await project();
  for (const cmd of ['git push origin main', 'git push -u origin master', 'git push origin HEAD:main', 'git push origin feature:refs/heads/main']) {
    const r = run('guard-bash.mjs', bash(cmd), root);
    assert.equal(r.status, 2, cmd);
    assert.match(r.stderr, /main|master/);
  }
  assert.equal(run('guard-bash.mjs', bash('git push -u origin apidocs-widgetry'), root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('git status && git log --oneline -3'), root).status, 0);
});

test('guard-bash: jobs/, HAR, storageState and .env never get staged', async () => {
  const root = await project();
  for (const cmd of ['git add jobs/widgetry/traces/t.jsonl', 'git add -f capture.har', 'git add out/storageState.json', 'git add .env', 'cd x && git commit -am "oops" jobs/x']) {
    assert.equal(run('guard-bash.mjs', bash(cmd), root).status, 2, cmd);
  }
  assert.equal(run('guard-bash.mjs', bash('git add workflows/widgetry src/apidocs/derive.ts'), root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('git commit -m "docs: jobs/ and *.har never enter git; .env stays local"'), root).status, 0, 'words in a commit message are not pathspecs');
  assert.equal(run('guard-bash.mjs', bash('git commit -m "msg" jobs/x.jsonl'), root).status, 2, 'an unquoted pathspec after the message is still caught');
});

test('guard-bash: docs/apis/<site> is staged only with a passing, current REVIEW.json', async () => {
  const root = await project();
  const dir = await docs(root, 'widgetry');
  const add = bash('git add docs/apis/widgetry');
  let r = run('guard-bash.mjs', add, root);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /no REVIEW\.json/);

  await fs.writeFile(path.join(dir, 'REVIEW.json'), JSON.stringify({ verdict: 'needs-review', hash: await hashDocs(dir) }));
  r = run('guard-bash.mjs', add, root);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /needs-review/);

  await fs.writeFile(path.join(dir, 'REVIEW.json'), JSON.stringify({ verdict: 'pass', hash: await hashDocs(dir) }));
  assert.equal(run('guard-bash.mjs', add, root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('git add -A'), root).status, 0, 'git add -A checks every site and this one passes');

  await fs.appendFile(path.join(dir, 'index.html'), ' rebuilt');
  r = run('guard-bash.mjs', add, root);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /changed since its scan/);
  assert.equal(run('guard-bash.mjs', bash('git add .'), root).status, 2, 'git add . is caught too');
});

test('guard-bash: a cd prefix moves the gate to that directory (worktrees)', async () => {
  const root = await project();
  const other = await project();
  await docs(other, 'widgetry');
  const cmd = `cd ${other.replace(/\\/g, '/')} && git add docs/apis/widgetry`;
  let r = run('guard-bash.mjs', { ...bash(cmd), cwd: root }, root);
  assert.equal(r.status, 2, 'the docs live in the other checkout and have no REVIEW.json');
  assert.match(r.stderr, /no REVIEW\.json/);
  await fs.writeFile(path.join(other, 'docs', 'apis', 'widgetry', 'REVIEW.json'), JSON.stringify({ verdict: 'pass', hash: await hashDocs(path.join(other, 'docs', 'apis', 'widgetry')) }));
  r = run('guard-bash.mjs', { ...bash(cmd), cwd: root }, root);
  assert.equal(r.status, 0, r.stderr);
  const cwd = spawnSync(
    process.execPath,
    ['-e', `import(${JSON.stringify(pathToFileURL(path.join(hooksDir, 'shell.mjs')).href)}).then(m => console.log(JSON.stringify([m.finalCwd('cd sub && npm run apidocs -- build x', 'C:/base'), m.finalCwd('cd "C:/else where"; cd; ls', 'C:/base'), m.finalCwd('git status', 'C:/base')])))`],
    { encoding: 'utf8' },
  );
  assert.equal(cwd.status, 0, cwd.stderr);
  assert.deepEqual(JSON.parse(cwd.stdout.trim()).map((p: string) => p.replace(/\\/g, '/')), ['C:/base/sub', 'C:/base', 'C:/base']);
});

test('guard-bash: write workflows record only against staging/test/sandbox targets, with an inverse', async () => {
  const root = await project();
  let r = run('guard-bash.mjs', bash('npm run apidocs -- record widgetry --workflow workflows/widgetry/create-item.json --attach http://127.0.0.1:9222'), root);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /production/);
  r = run('guard-bash.mjs', bash('npm run apidocs -- record staging --workflow workflows/widgetry/no-inverse.json --headed'), root);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /inverse/);
  assert.equal(run('guard-bash.mjs', bash('npm run apidocs -- record staging --workflow workflows/widgetry/create-item.json --headed'), root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('npm run apidocs -- record widgetry --workflow workflows/widgetry/list-items.json --attach http://127.0.0.1:9222'), root).status, 0, 'read workflows are fine on production');
  assert.equal(run('guard-bash.mjs', bash('npx tsx src/apidocs-cli.ts record widgetry --workflow workflows/widgetry/create-item.json'), root).status, 2, 'the direct CLI spelling is covered');
});

test('guard-bash ignores other tools and malformed input', async () => {
  const root = await project();
  assert.equal(run('guard-bash.mjs', { tool_name: 'Read', tool_input: { file_path: 'x' } }, root).status, 0);
  const r = spawnSync(process.execPath, [path.join(hooksDir, 'guard-bash.mjs')], { input: 'not json', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(r.status, 0);
});

test('guard-write: jobs/ and docs/apis/ are machine-written; everything else is editable', async () => {
  const root = await project();
  for (const file of ['jobs/widgetry/traces/t.jsonl', 'jobs/x', 'docs/apis/widgetry/README.md', path.join(root, 'docs', 'apis', 'w', 'api.json')]) {
    const r = run('guard-write.mjs', write(file), root);
    assert.equal(r.status, 2, file);
    assert.match(r.stderr, /blocked/);
  }
  for (const file of ['src/apidocs/derive.ts', 'docs/design/api-docs.md', 'workflows/widgetry/list-items.json', 'jobsite/notes.md']) {
    assert.equal(run('guard-write.mjs', write(file), root).status, 0, file);
  }
  assert.equal(run('guard-write.mjs', { tool_name: 'NotebookEdit', tool_input: { notebook_path: 'jobs/n.ipynb' } }, root).status, 2);
});

test('after-build: recognises the build and tour commands and stays quiet otherwise', () => {
  const r = spawnSync(
    process.execPath,
    ['-e', `import(${JSON.stringify(pathToFileURL(path.join(hooksDir, 'after-build.mjs')).href)}).then(m => console.log(JSON.stringify([m.siteOf('npm run apidocs -- build roofr'), m.siteOf('npx tsx src/apidocs-cli.ts build acme --out x'), m.siteOf('npx tsx scripts/apidocs-readonly-tour.ts roofr --port 9222'), m.siteOf('npm run apidocs:tour -- roofr'), m.siteOf('npm run apidocs -- inspect jobs/x.jsonl')])))`],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout.trim()), ['roofr', 'acme', 'roofr', 'roofr', null]);
  const quiet = run('after-build.mjs', bash('npm run apidocs -- inspect jobs/x.jsonl'), process.cwd());
  assert.equal(quiet.status, 0);
  assert.equal(quiet.stdout, '');
});

test('session-start prints one status line per target and the browser probe', async () => {
  const root = await project();
  const r = spawnSync(process.execPath, [path.join(hooksDir, 'session-start.mjs')], { encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: root, APIDOCS_CDP_PORT: '1' } });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /widgetry: production/);
  assert.match(r.stdout, /staging: staging/);
  assert.match(r.stdout, /trace none; docs no docs/);
  assert.match(r.stdout, /nothing on 127\.0\.0\.1:1/);
});
