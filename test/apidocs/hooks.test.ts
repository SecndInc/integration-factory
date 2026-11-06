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

/** A local YYYY-MM-DD, `days` from today (the hook compares against the local date). */
function dayOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

test('guard-bash: a snapshot of a production target needs a valid snapshotConsent', async () => {
  const root = await project();
  const target = (name: string, extra: Record<string, unknown>) =>
    fs.writeFile(path.join(root, 'targets', `${name}.json`), JSON.stringify({ name, startUrl: 'http://127.0.0.1:1/', ...extra }));
  const consent = { by: 'owner@example.test', on: dayOffset(-1), scope: 'read' };
  await target('noconsent', { environment: 'production' });
  await target('consented', { environment: 'production', snapshotConsent: consent });
  await target('open-ended', { snapshotConsent: { ...consent, expires: dayOffset(0) } });
  await target('future', { environment: 'production', snapshotConsent: { ...consent, on: dayOffset(1) } });
  await target('expired', { environment: 'production', snapshotConsent: { ...consent, expires: dayOffset(-1) } });
  await target('nobody', { environment: 'production', snapshotConsent: { ...consent, by: ' ' } });
  await target('noscope', { environment: 'production', snapshotConsent: { ...consent, scope: '' } });
  await target('baddate', { environment: 'production', snapshotConsent: { ...consent, on: '2026-13-40' } });

  const snap = (site: string, tail = '--attach http://127.0.0.1:9222') => bash(`npm run apidocs -- snapshot ${site} ${tail}`);
  for (const site of ['noconsent', 'future', 'expired', 'nobody', 'noscope', 'baddate', 'widgetry', 'missing-target']) {
    const r = run('guard-bash.mjs', snap(site), root);
    assert.equal(r.status, 2, site);
    assert.match(r.stderr, new RegExp(`${site} is production and its target has no valid snapshotConsent \\{ by, on, scope \\}`), site);
    assert.match(r.stderr, new RegExp(`record the owner's consent in targets/${site}\\.json first`), site);
  }
  assert.match(run('guard-bash.mjs', snap('future'), root).stderr, /in the future/);
  assert.match(run('guard-bash.mjs', snap('expired'), root).stderr, /expired/);
  for (const site of ['consented', 'open-ended']) assert.equal(run('guard-bash.mjs', snap(site), root).status, 0, site);
  assert.equal(run('guard-bash.mjs', snap('noconsent', '--dry-run --attach http://127.0.0.1:9222'), root).status, 0, '--dry-run is always allowed');
  assert.equal(run('guard-bash.mjs', snap('staging'), root).status, 0, 'a staging target needs no consent');
  assert.equal(run('guard-bash.mjs', snap('noconsent', '--resume r1 --per-id core'), root).status, 2, 'a flag value is not the site');
  assert.equal(run('guard-bash.mjs', bash('npx tsx src/apidocs-cli.ts snapshot noconsent --attach http://127.0.0.1:9222'), root).status, 2, 'the direct CLI spelling is covered');
  assert.equal(run('guard-bash.mjs', bash('tsx src/apidocs-cli.ts snapshot consented --attach http://127.0.0.1:9222'), root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('npm run apidocs -- snapshot --attach http://127.0.0.1:9222 noconsent'), root).status, 2, 'flags before the site');
  assert.equal(run('guard-bash.mjs', bash('npm run snapshot:load -- noconsent'), root).status, 0, 'the loader is not the snapshot command');

  // The consent is read from the checkout the command runs in.
  const other = await project();
  const cmd = `cd ${other.replace(/\\/g, '/')} && npm run apidocs -- snapshot widgetry --attach http://127.0.0.1:9222`;
  assert.equal(run('guard-bash.mjs', { ...bash(cmd), cwd: root }, root).status, 2);
  await fs.writeFile(path.join(other, 'targets', 'widgetry.json'), JSON.stringify({ name: 'W', startUrl: 'http://127.0.0.1:1/', environment: 'production', snapshotConsent: consent }));
  assert.equal(run('guard-bash.mjs', { ...bash(cmd), cwd: root }, root).status, 0);
});

test('guard-bash: snapshot NDJSON never enters git', async () => {
  const root = await project();
  for (const cmd of ['git add jobs/x/snapshots/r/jobs.ndjson', 'git add out.ndjson', 'git add -f data/Rows.NDJSON', 'git commit -m "x" out.ndjson']) {
    assert.equal(run('guard-bash.mjs', bash(cmd), root).status, 2, cmd);
  }
  const r = run('guard-bash.mjs', bash('git add out.ndjson'), root);
  assert.match(r.stderr, /snapshot:load/);
  assert.equal(run('guard-bash.mjs', bash('git add snapshots/roofr.json'), root).status, 0);
  assert.equal(run('guard-bash.mjs', bash('git commit -m "snapshot: .ndjson stays local"'), root).status, 0, 'words in a commit message are not pathspecs');
});

test('guard-bash: snapshot data leaves the machine only through snapshot:load', async () => {
  const root = await project();
  for (const cmd of [
    'gcloud storage cp jobs/roofr/snapshots/r/jobs.ndjson gs://b/',
    'gcloud storage rsync -r jobs\\roofr gs://b/x',
    'bq load ds.t jobs/roofr/x.ndjson',
    'bq --location=northamerica-northeast1 load --source_format=NEWLINE_DELIMITED_JSON ds.t ./jobs/roofr/x.ndjson',
    'gsutil -m cp -r jobs/roofr gs://b',
    'gsutil mv jobs/roofr/x.ndjson gs://b/',
  ]) {
    const r = run('guard-bash.mjs', bash(cmd), root);
    assert.equal(r.status, 2, cmd);
    assert.match(r.stderr, /npm run snapshot:load/, cmd);
  }
  for (const cmd of [
    'gcloud storage cp scripts/snapshot/bucket-lifecycle.json gs://b/',
    'gcloud storage cp gs://b/jobs/x.ndjson ./tmp/',
    'gsutil -m cp -r scripts/snapshot gs://b',
    'bq load ds.t scripts/snapshot/raw_rows.schema.json',
    'bq query --use_legacy_sql=false "select 1"',
    'npm run snapshot:load -- roofr',
    'cp jobs/roofr/x.ndjson /tmp/y',
  ]) {
    assert.equal(run('guard-bash.mjs', bash(cmd), root).status, 0, cmd);
  }
});

test('guard-bash: datasets and buckets are created only in northamerica-northeast1', async () => {
  const root = await project();
  const ok = [
    'bq --location=northamerica-northeast1 mk --dataset p:ds',
    'bq --location northamerica-northeast1 mk -d p:ds',
    'bq mk --dataset --location=NorthAmerica-Northeast1 p:ds',
    'gcloud storage buckets create gs://b --location=northamerica-northeast1',
    'gcloud storage buckets create gs://b -l northamerica-northeast1 --uniform-bucket-level-access',
    'gsutil mb -l northamerica-northeast1 gs://b',
    'bq mk --table p:ds.t schema.json',
  ];
  for (const cmd of ok) assert.equal(run('guard-bash.mjs', bash(cmd), root).status, 0, cmd);
  const bad = [
    'bq mk --dataset p:ds',
    'bq --location=US mk -d p:ds',
    'bq mk p:ds',
    'bq mk -d -l northamerica-northeast1 p:ds', // bq's -l is --label, not a location
    'gcloud storage buckets create gs://b',
    'gcloud storage buckets create gs://b --location=us-central1',
    'gsutil mb gs://b',
    'gsutil mb -l US gs://b',
  ];
  for (const cmd of bad) {
    const r = run('guard-bash.mjs', bash(cmd), root);
    assert.equal(r.status, 2, cmd);
    assert.match(r.stderr, /northamerica-northeast1/, cmd);
  }
});

test('guard-bash: nothing is granted to allUsers or allAuthenticatedUsers', async () => {
  const root = await project();
  for (const cmd of [
    'gcloud storage buckets add-iam-policy-binding gs://b --member=allUsers --role=roles/storage.objectViewer',
    'gcloud storage buckets add-iam-policy-binding gs://b --member allAuthenticatedUsers --role roles/storage.objectViewer',
    'gsutil iam ch allUsers:objectViewer gs://b',
    'bq add-iam-policy-binding --member=allAuthenticatedUsers --role=roles/bigquery.dataViewer p:ds.t',
    `bq update --source '{"access":[{"role":"READER","specialGroup":"allAuthenticatedUsers"}]}' p:ds`,
    'gcloud projects add-iam-policy-binding p --member="allUsers" --role=roles/viewer',
  ]) {
    const r = run('guard-bash.mjs', bash(cmd), root);
    assert.equal(r.status, 2, cmd);
    assert.match(r.stderr, /public/, cmd);
  }
  assert.equal(run('guard-bash.mjs', bash('gcloud storage buckets add-iam-policy-binding gs://b --member=user:someone@example.test --role=roles/storage.objectViewer'), root).status, 0);
  // Limits of the hook: it reads the command line, not files. An ACL file passed with --source is not opened.
  assert.equal(run('guard-bash.mjs', bash('bq update --source acl.json p:ds'), root).status, 0);
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
    ['-e', `import(${JSON.stringify(pathToFileURL(path.join(hooksDir, 'after-build.mjs')).href)}).then(m => console.log(JSON.stringify([m.siteOf('npm run apidocs -- build roofr'), m.siteOf('npx tsx src/apidocs-cli.ts build acme --out x'), m.siteOf('npx tsx scripts/apidocs-readonly-tour.ts roofr --port 9222'), m.siteOf('npm run apidocs:tour -- roofr'), m.siteOf('npm run apidocs -- inspect jobs/x.jsonl'), m.siteOf('wc -l scripts/apidocs-readonly-tour.ts src/apidocs-cli.ts'), m.siteOf('grep -n x scripts/apidocs-readonly-tour.ts | head')])))`],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout.trim()), ['roofr', 'acme', 'roofr', 'roofr', null, null, null]);
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
