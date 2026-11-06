import assert from 'node:assert/strict';
import { existsSync, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  LoadError,
  buildCommands,
  checkSql,
  datasetFor,
  editAcl,
  evaluateChecks,
  flattenManifest,
  main,
  parseArgs,
  pickRun,
  readEnvConfig,
  renderReport,
  type CheckInput,
  type Exec,
  type LoadConfig,
  type Manifest,
  type Row,
  type RunEntry,
} from '../scripts/snapshot-load.js';

// ---- fixtures

function manifest(over: Partial<Manifest> = {}): Manifest {
  return {
    manifestVersion: 1,
    runId: 'run-b',
    site: 'roofr',
    planSha256: 'abc',
    startedAt: '2026-11-06T10:00:00.000Z',
    finishedAt: '2026-11-06T11:00:00.000Z',
    status: 'complete',
    counts: {},
    endpoints: {
      jobs: { state: 'complete', rows: 3, bytes: 300, pages: 1, total: 3 },
      'job-activities': { state: 'complete', rows: 2, bytes: 200, pages: 1 },
    },
    ...over,
  };
}

async function fixtureJobs(opts: { failures?: string; status?: Manifest['status'] } = {}): Promise<{ jobs: string; runDir: string }> {
  const jobs = await fs.mkdtemp(path.join(os.tmpdir(), 'snapshot-load-test-'));
  const runDir = path.join(jobs, 'roofr', 'snapshots', 'run-b');
  await fs.mkdir(runDir, { recursive: true });
  await fs.writeFile(path.join(runDir, 'jobs.ndjson'), '{"x":1}\n', 'utf8');
  await fs.writeFile(path.join(runDir, 'job-activities.ndjson'), '{"x":2}\n', 'utf8');
  await fs.writeFile(path.join(runDir, 'failures.ndjson'), opts.failures ?? '', 'utf8');
  await fs.writeFile(path.join(runDir, 'progress.json'), '{}', 'utf8');
  await fs.writeFile(path.join(runDir, 'manifest.json'), JSON.stringify(manifest({ status: opts.status ?? 'complete' })), 'utf8');
  return { jobs, runDir };
}

const ENV = {
  SNAPSHOT_GCS_BUCKET: 'example-bucket',
  SNAPSHOT_CONSENT_DATE: '2026-11-06',
  SNAPSHOT_GCP_PROJECT: 'example-project',
};

function cfg(over: Partial<LoadConfig> = {}): LoadConfig {
  return {
    site: 'roofr',
    dataset: 'snapshot_roofr',
    project: 'example-project',
    location: 'northamerica-northeast1',
    bucket: 'example-bucket',
    consentDate: '2026-11-06',
    deleteAfter: null,
    viewers: ['reader@example.com'],
    runId: 'run-b',
    runDir: '/tmp/jobs/roofr/snapshots/run-b',
    tmpDir: '/tmp/snapshot-load-roofr-run-b',
    rowFiles: ['/tmp/jobs/roofr/snapshots/run-b/jobs.ndjson', '/tmp/jobs/roofr/snapshots/run-b/job-activities.ndjson'],
    failuresFile: '/tmp/jobs/roofr/snapshots/run-b/failures.ndjson',
    manifestFile: '/tmp/snapshot-load-roofr-run-b/manifest.ndjson',
    schemaDir: '/repo/scripts/snapshot',
    ddl: 'CREATE TABLE IF NOT EXISTS `${PROJECT}.${DS}.raw_rows` (a STRING);',
    views: "CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_jobs` AS SELECT 1 FROM x WHERE endpoint_id = 'jobs';",
    viewEndpoints: ['jobs'],
    allowPartial: false,
    keepBucket: false,
    ...over,
  };
}

interface Call {
  cmd: string;
  args: string[];
  input?: string;
  env?: Record<string, string>;
}

const GOOD: Record<string, Row[]> = {
  counts: [
    { endpoint_id: 'jobs', manifest_rows: '3', loaded: '3', dup_slots: '0' },
    { endpoint_id: 'job-activities', manifest_rows: '2', loaded: '2', dup_slots: '0' },
  ],
  integrity: [{ bad_hash: '0', run_ids: '1', sites: '1', wrong_site: '0', total: '7' }],
  ids: [],
  coverage: [{ endpoint_id: 'job-activities', expected: '3', missing: '0', sample: [] }],
  secrets: [{ secret_in_url: '0', secret_in_payload: [] }],
};

function fakeExec(checks: Record<string, Row[]> = GOOD, datasetExists = true): { exec: Exec; calls: Call[] } {
  const calls: Call[] = [];
  const exec: Exec = async (cmd, args, opts) => {
    calls.push({ cmd, args, input: opts.input, env: opts.env });
    const line = `${cmd} ${args.join(' ')}`;
    const ok = (stdout = ''): { code: number; stdout: string; stderr: string } => ({ code: 0, stdout, stderr: '' });
    if (line.startsWith('gcloud info')) return ok('/sdk\n');
    if (line.startsWith('bq version')) return ok('This is BigQuery CLI 2.1.0\n');
    if (line.includes('auth print-access-token')) return ok('ya29.fake\n');
    if (line.includes('config get-value project')) return ok('example-project\n');
    if (args.includes('show')) {
      if (!datasetExists) return { code: 1, stdout: '', stderr: 'BigQuery error in show operation: Not found: Dataset example-project:snapshot_roofr' };
      return ok(JSON.stringify({ location: 'northamerica-northeast1', access: [{ role: 'OWNER', userByEmail: 'owner@example.com' }] }));
    }
    if (line.includes('buckets describe')) {
      return ok(JSON.stringify({ location: 'NORTHAMERICA-NORTHEAST1', uniform_bucket_level_access: true, public_access_prevention: 'enforced' }));
    }
    if (line.includes('get-iam-policy')) return ok(JSON.stringify({ bindings: [{ role: 'roles/viewer', members: ['user:someone@example.com'] }, { role: 'roles/storage.admin', members: ['user:x@example.com'] }] }));
    if (args.includes('load')) return ok('Waiting on bqjob_r1_abc ... DONE');
    if (args.includes('query') && opts.input) {
      const m = opts.input.match(/-- check:(\w+)/);
      if (m) return ok(JSON.stringify(checks[m[1]!] ?? []));
      return ok('');
    }
    return ok('');
  };
  return { exec, calls };
}

const isMutating = (c: Call): boolean =>
  ['cp', 'load', 'mk', 'update', 'rm', 'add-iam-policy-binding'].some((w) => c.args.includes(w));

// ---- pure functions

test('datasetFor maps hyphens to underscores and rejects odd ids', () => {
  assert.equal(datasetFor('yp-for-business'), 'snapshot_yp_for_business');
  assert.equal(datasetFor('roofr'), 'snapshot_roofr');
  assert.throws(() => datasetFor('Bad Site'), LoadError);
});

test('parseArgs reads flags and rejects unknown ones', () => {
  const a = parseArgs(['roofr', '--run', 'r1', '--step', 'load', '--allow-partial', '--grant', '--keep-bucket', '--dry-run', '--jobs', 'x']);
  assert.deepEqual(a, { site: 'roofr', run: 'r1', step: 'load', allowPartial: true, grant: true, keepBucket: true, dryRun: true, jobs: 'x' });
  assert.equal(parseArgs(['roofr']).step, 'all');
  assert.throws(() => parseArgs(['roofr', '--nope']), LoadError);
  assert.throws(() => parseArgs([]), LoadError);
  assert.throws(() => parseArgs(['roofr', '--step', 'bogus']), LoadError);
});

test('readEnvConfig refuses another location and missing required keys', () => {
  assert.throws(() => readEnvConfig({ ...ENV, SNAPSHOT_LOCATION: 'us-central1' }), /northamerica-northeast1/);
  assert.throws(() => readEnvConfig({ SNAPSHOT_CONSENT_DATE: '2026-11-06' }), /BUCKET/);
  assert.throws(() => readEnvConfig({ SNAPSHOT_GCS_BUCKET: 'b-ucket' }), /CONSENT_DATE/);
  assert.throws(() => readEnvConfig({ ...ENV, SNAPSHOT_CONSENT_DATE: 'yesterday' }), /YYYY-MM-DD/);
  assert.throws(() => readEnvConfig({ ...ENV, SNAPSHOT_VIEWERS: 'a@b.co, bad address' }), /invalid email/);
  const ok = readEnvConfig({ ...ENV, SNAPSHOT_DELETE_AFTER: '', SNAPSHOT_VIEWERS: 'a@example.com, b@example.com' });
  assert.equal(ok.location, 'northamerica-northeast1');
  assert.equal(ok.deleteAfter, null);
  assert.deepEqual(ok.viewers, ['a@example.com', 'b@example.com']);
});

test('pickRun takes the newest run and refuses partial or aborted without the flag', () => {
  const entry = (runId: string, startedAt: string, status: Manifest['status'], failuresBytes = 0): RunEntry => ({
    runId,
    manifest: manifest({ runId, startedAt, status }),
    failuresBytes,
  });
  const entries = [entry('old', '2026-11-01T00:00:00Z', 'complete'), entry('new', '2026-11-05T00:00:00Z', 'complete'), { runId: 'nomanifest', manifest: null, failuresBytes: 0 }];
  assert.equal(pickRun(entries).entry.runId, 'new');
  assert.equal(pickRun(entries, { run: 'old' }).entry.runId, 'old');
  assert.throws(() => pickRun(entries, { run: 'nomanifest' }), /no manifest/);

  const partial = [entry('p', '2026-11-06T00:00:00Z', 'partial')];
  assert.throws(() => pickRun(partial), /--allow-partial/);
  assert.equal(pickRun(partial, { allowPartial: true }).warnings.length, 1);

  const aborted = [entry('a', '2026-11-06T00:00:00Z', 'aborted')];
  assert.throws(() => pickRun(aborted, { allowPartial: true }), /aborted/);

  const withFailures = [entry('f', '2026-11-06T00:00:00Z', 'complete', 12)];
  assert.throws(() => pickRun(withFailures), /failures/);
  assert.ok(pickRun(withFailures, { allowPartial: true }).warnings.some((w) => /failures/.test(w)));

  assert.throws(() => pickRun([entry('r', '2026-11-06T00:00:00Z', 'running')], { allowPartial: true }), /running/);
  assert.throws(() => pickRun([]), /no run/);
});

test('flattenManifest emits one row per endpoint with run context', () => {
  const rows = flattenManifest(manifest());
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.find((r) => r.endpoint_id === 'jobs'), {
    run_id: 'run-b',
    site: 'roofr',
    endpoint_id: 'jobs',
    state: 'complete',
    rows: 3,
    bytes: 300,
    started: '2026-11-06T10:00:00.000Z',
    finished: '2026-11-06T11:00:00.000Z',
    run_status: 'complete',
  });
  assert.equal(flattenManifest(manifest({ finishedAt: undefined }))[0]!.finished, null);
});

test('buildCommands orders cp, load, ddl, checks; every bq call has location and project; SQL is on stdin', () => {
  const cmds = buildCommands(cfg());
  const idx = (pred: (c: (typeof cmds)[number]) => boolean): number => cmds.findIndex(pred);
  const cp = idx((c) => c.args.includes('cp'));
  const load = idx((c) => c.args.includes('load'));
  const ddl = idx((c) => c.phase === 'ddl');
  const check = idx((c) => c.phase === 'check');
  const rm = idx((c) => c.args.includes('rm'));
  assert.ok(cp >= 0 && cp < load && load < ddl && ddl < check && check < rm, `order ${cp} ${load} ${ddl} ${check} ${rm}`);

  for (const c of cmds.filter((x) => x.cmd === 'bq')) {
    assert.ok(c.args.includes('--location=northamerica-northeast1'), c.args.join(' '));
    assert.ok(c.args.includes('--project_id=example-project'), c.args.join(' '));
  }
  for (const c of cmds.filter((x) => x.phase === 'ddl' || x.phase === 'check')) {
    assert.ok(c.input && c.input.length > 20, 'SQL travels on stdin');
    assert.ok(!c.args.some((a) => /SELECT|CREATE/.test(a)), 'no SQL in argv');
    assert.ok(!/\$\{(PROJECT|DS)\}/.test(c.input!), 'placeholders substituted');
  }
  // the failures file and manifest go to their own prefixes; failures.ndjson is not in rows/
  const cps = cmds.filter((c) => c.args.includes('cp'));
  assert.ok(cps[0]!.args.every((a) => !a.endsWith('failures.ndjson')));
  assert.ok(cps.some((c) => c.args.at(-1)!.endsWith('/failures/')));
  assert.ok(cps.some((c) => c.args.at(-1)!.endsWith('/manifest/')));
  // loads are replace + strict
  for (const l of cmds.filter((c) => c.args.includes('load'))) {
    assert.ok(l.args.includes('--replace') && l.args.includes('--max_bad_records=0'));
    assert.ok(!l.args.includes('--autodetect'));
  }
  assert.equal(buildCommands(cfg({ keepBucket: true })).some((c) => c.args.includes('rm')), false);
  assert.equal(buildCommands(cfg({ site: 'yp-for-business' })).filter((c) => c.phase === 'check').length, 4);
});

test('checkSql returns five queries; coverage targets {jobId} endpoints', () => {
  const sql = checkSql(cfg());
  assert.deepEqual(Object.keys(sql).sort(), ['counts', 'coverage', 'ids', 'integrity', 'secrets']);
  assert.match(sql.integrity, /TO_HEX\(SHA256\(payload\)\) != payload_sha256/);
  assert.match(sql.coverage, /\{jobId\}/);
  assert.match(sql.secrets, /access_token\|api_key\|key\|session\|sig\|signature/);
  assert.match(sql.counts, /record_index >= 0/);
});

// ---- evaluateChecks

const input = (over: Partial<CheckInput> = {}): CheckInput => ({ ...structuredClone(GOOD) as unknown as CheckInput, ...over });
const evalOpts = { site: 'roofr', viewEndpoints: ['jobs'] };

test('evaluateChecks passes on clean results', () => {
  const e = evaluateChecks(input(), evalOpts);
  assert.equal(e.verdict, 'pass');
  assert.deepEqual(Object.values(e.checks).map((c) => c.pass), [true, true, true, true, true]);
});

test('evaluateChecks fails on a count mismatch, a duplicate slot, a bad hash, two run ids', () => {
  const mismatch = evaluateChecks(input({ counts: [{ endpoint_id: 'jobs', manifest_rows: '3', loaded: '2', dup_slots: '0' }] }), evalOpts);
  assert.equal(mismatch.checks.counts.pass, false);
  assert.match(mismatch.checks.counts.summary, /loaded 2, manifest 3/);

  const dup = evaluateChecks(input({ counts: [{ endpoint_id: 'jobs', manifest_rows: '3', loaded: '3', dup_slots: '1' }] }), evalOpts);
  assert.equal(dup.verdict, 'fail');
  assert.match(dup.checks.counts.summary, /duplicate/);

  const notListed = evaluateChecks(input({ counts: [{ endpoint_id: 'ghost', manifest_rows: null, loaded: '4', dup_slots: '0' }] }), evalOpts);
  assert.equal(notListed.checks.counts.pass, false);

  const hash = evaluateChecks(input({ integrity: [{ bad_hash: '2', run_ids: '1', sites: '1', wrong_site: '0', total: '7' }] }), evalOpts);
  assert.equal(hash.checks.integrity.pass, false);
  assert.match(hash.checks.integrity.summary, /SHA-256/);

  const runs = evaluateChecks(input({ integrity: [{ bad_hash: '0', run_ids: '2', sites: '1', wrong_site: '0', total: '7' }] }), evalOpts);
  assert.equal(runs.verdict, 'fail');
  assert.match(runs.checks.integrity.summary, /run_ids/);
});

test('evaluateChecks: missing ids fail only for endpoints the views use', () => {
  const unused = evaluateChecks(input({ ids: [{ endpoint_id: 'tags', records: '10', missing_id: '10' }] }), evalOpts);
  assert.equal(unused.checks.ids.pass, true);
  assert.ok(unused.warnings.some((w) => /tags/.test(w)));
  const used = evaluateChecks(input({ ids: [{ endpoint_id: 'jobs', records: '10', missing_id: '1' }] }), evalOpts);
  assert.equal(used.checks.ids.pass, false);
  assert.equal(used.verdict, 'fail');
});

test('evaluateChecks: roofr coverage miss fails unless --allow-partial; other sites skip it', () => {
  const miss = [{ endpoint_id: 'job-activities', expected: '3', missing: '1', sample: ['42'] }];
  const strict = evaluateChecks(input({ coverage: miss }), evalOpts);
  assert.equal(strict.checks.coverage.pass, false);
  assert.equal(strict.verdict, 'fail');
  const lenient = evaluateChecks(input({ coverage: miss }), { ...evalOpts, allowPartial: true });
  assert.equal(lenient.checks.coverage.pass, true);
  assert.ok(lenient.warnings.some((w) => /misses 1 of 3/.test(w)));
  const yp = evaluateChecks(input({ coverage: null }), { site: 'yp-for-business', viewEndpoints: [] });
  assert.equal(yp.checks.coverage.skipped, true);
  assert.equal(yp.verdict, 'pass');
});

test('evaluateChecks: secret_in_url fails, secret_in_payload only warns', () => {
  const url = evaluateChecks(input({ secrets: [{ secret_in_url: '2', secret_in_payload: [] }] }), evalOpts);
  assert.equal(url.checks.secrets.pass, false);
  assert.equal(url.verdict, 'fail');
  const payload = evaluateChecks(input({ secrets: [{ secret_in_url: '0', secret_in_payload: [{ endpoint_id: 'team', n: '3' }] }] }), evalOpts);
  assert.equal(payload.verdict, 'pass');
  assert.ok(payload.warnings.some((w) => /team/.test(w)));
});

// ---- editAcl

test('editAcl drops project groups, keeps user OWNER, adds READERs', () => {
  const ds = {
    id: 'p:snapshot_roofr',
    access: [
      { role: 'OWNER', specialGroup: 'projectOwners' },
      { role: 'OWNER', userByEmail: 'owner@example.com' },
      { role: 'WRITER', specialGroup: 'projectWriters' },
      { role: 'READER', specialGroup: 'projectReaders' },
      { role: 'READER', userByEmail: 'one@example.com' },
    ],
  };
  const out = editAcl(ds, ['one@example.com', 'two@example.com']) as { id: string; access: Row[] };
  assert.equal(out.id, ds.id);
  assert.equal(out.access.some((e) => 'specialGroup' in e), false);
  assert.ok(out.access.some((e) => e.role === 'OWNER' && e.userByEmail === 'owner@example.com'));
  assert.deepEqual(out.access.filter((e) => e.role === 'READER').map((e) => e.userByEmail), ['one@example.com', 'two@example.com']);
  assert.equal(ds.access.length, 5, 'input not mutated');
  assert.throws(() => editAcl({ access: [{ role: 'OWNER', specialGroup: 'projectOwners' }] }, ['a@example.com']), /OWNER/);
});

// ---- renderReport

test('renderReport lists the retention and inherited-reader decisions', () => {
  const evaluation = evaluateChecks(input(), evalOpts);
  const base = { evaluation, jobIds: ['bqjob_r1'], loadedAt: '2026-11-06T12:00:00.000Z', runWarnings: [], auditWarnings: ['inherited access: roles/viewer -> user:someone@example.com'] };
  const open = renderReport({ ...base, cfg: cfg({ deleteAfter: null }) }) as Row & { open_decisions: string[] };
  assert.equal(open.delete_after, null);
  assert.equal(open.retention, 'engagement-end');
  assert.ok(open.open_decisions.some((d) => /^Retention:/.test(d)));
  assert.ok(open.open_decisions.some((d) => /^Inherited project readers:/.test(d)));
  assert.equal(open.verdict, 'pass');
  const dated = renderReport({ ...base, cfg: cfg({ deleteAfter: '2027-03-31' }) }) as Row & { open_decisions: string[] };
  assert.equal(dated.retention, 'delete-after-date');
  assert.equal(dated.open_decisions.some((d) => /^Retention:/.test(d)), false);
});

// ---- main with a fake exec

test('--dry-run prints the plan and spawns nothing', async () => {
  const { jobs } = await fixtureJobs();
  const { exec, calls } = fakeExec();
  const lines: string[] = [];
  const code = await main(['roofr', '--dry-run', '--jobs', jobs], { exec, env: ENV, log: (l) => lines.push(l) });
  assert.equal(code, 0);
  assert.equal(calls.length, 0);
  assert.equal(calls.filter(isMutating).length, 0);
  const text = lines.join('\n');
  assert.match(text, /storage cp/);
  assert.match(text, /bq --location=northamerica-northeast1 --project_id=example-project load --replace/);
  assert.match(text, /-- check:coverage/);
  assert.match(text, /buckets create gs:\/\/example-bucket .*--soft-delete-duration=0/);
  assert.equal(existsSync(path.join(jobs, 'roofr', 'snapshots', 'run-b', 'load-report.json')), false);
});

test('full run passes: report written with open decision, bucket prefix removed, exact toolchain env', async () => {
  const { jobs, runDir } = await fixtureJobs();
  const { exec, calls } = fakeExec();
  const lines: string[] = [];
  const code = await main(['roofr', '--jobs', jobs], { exec, env: ENV, log: (l) => lines.push(l), now: () => new Date('2026-11-06T12:00:00Z') });
  assert.equal(code, 0, lines.join('\n'));
  const report = JSON.parse(await fs.readFile(path.join(runDir, 'load-report.json'), 'utf8')) as Row & { open_decisions: string[]; bq_job_ids: string[]; warnings: string[] };
  assert.equal(report.verdict, 'pass');
  assert.equal(report.dataset, 'snapshot_roofr');
  assert.equal(report.delete_after, null);
  assert.ok(report.open_decisions.some((d) => /Retention/.test(d)));
  assert.deepEqual(report.bq_job_ids, ['bqjob_r1_abc']);
  assert.ok(report.warnings.some((w) => /roles\/viewer/.test(w)), 'inherited viewer audit surfaced');
  assert.ok(!report.warnings.some((w) => /storage.admin/.test(w)), 'unrelated roles not listed');
  assert.ok(calls.some((c) => c.args.includes('rm')), 'bucket prefix removed on pass');
  const bqCall = calls.find((c) => c.cmd === 'bq' && c.args.includes('load'))!;
  assert.equal(bqCall.env?.CLOUDSDK_BQ_PYTHON, '/sdk/platform/bundledpython/python.exe');
  assert.equal(bqCall.env?.PYTHONUTF8, '1');
  assert.ok(!lines.join('\n').includes('ya29'), 'token never printed');
  assert.ok(!calls.some((c) => c.args.some((a) => a.includes('ya29'))));
  // cp happened before load before checks
  const at = (p: (c: Call) => boolean): number => calls.findIndex(p);
  assert.ok(at((c) => c.args.includes('cp')) < at((c) => c.args.includes('load')));
  assert.ok(at((c) => c.args.includes('load')) < at((c) => /-- check:counts/.test(c.input ?? '')));
});

test('a failing check exits 1, writes a fail report and keeps the bucket prefix', async () => {
  const { jobs, runDir } = await fixtureJobs();
  const bad = { ...GOOD, counts: [{ endpoint_id: 'jobs', manifest_rows: '3', loaded: '2', dup_slots: '0' }] };
  const { exec, calls } = fakeExec(bad);
  const code = await main(['roofr', '--jobs', jobs], { exec, env: ENV, log: () => undefined });
  assert.equal(code, 1);
  const report = JSON.parse(await fs.readFile(path.join(runDir, 'load-report.json'), 'utf8')) as Row;
  assert.equal(report.verdict, 'fail');
  assert.equal(calls.some((c) => c.args.includes('rm')), false);
});

test('creates the dataset with labels when absent', async () => {
  const { jobs } = await fixtureJobs();
  const { exec, calls } = fakeExec(GOOD, false);
  const code = await main(['roofr', '--step', 'preflight', '--jobs', jobs], { exec, env: { ...ENV, SNAPSHOT_DELETE_AFTER: '2027-03-31' }, log: () => undefined });
  assert.equal(code, 0);
  const mk = calls.find((c) => c.args.includes('mk'))!;
  assert.ok(mk.args.includes('--dataset'));
  assert.ok(mk.args.includes('sensitivity:pii'));
  assert.ok(mk.args.includes('consent_date:2026-11-06'));
  assert.ok(mk.args.includes('retention:delete-after-date'));
  assert.ok(!mk.args.some((a) => /default_table_expiration/.test(a)));
  assert.equal(calls.some((c) => c.args.includes('cp')), false, 'preflight step uploads nothing');
});

test('refuses a partial run without --allow-partial and a non-empty failures file', async () => {
  const partial = await fixtureJobs({ status: 'partial' });
  const lines: string[] = [];
  const { exec, calls } = fakeExec();
  assert.equal(await main(['roofr', '--jobs', partial.jobs], { exec, env: ENV, log: (l) => lines.push(l) }), 1);
  assert.match(lines.join('\n'), /allow-partial/);
  assert.equal(calls.length, 0, 'refused before any gcloud/bq call');

  const failing = await fixtureJobs({ failures: '{"error":"x"}\n' });
  assert.equal(await main(['roofr', '--jobs', failing.jobs], { exec, env: ENV, log: () => undefined }), 1);
  assert.equal(calls.length, 0);
});

test('refuses a location other than northamerica-northeast1 before spawning', async () => {
  const { jobs } = await fixtureJobs();
  const { exec, calls } = fakeExec();
  const lines: string[] = [];
  const code = await main(['roofr', '--jobs', jobs], { exec, env: { ...ENV, SNAPSHOT_LOCATION: 'US' }, log: (l) => lines.push(l) });
  assert.equal(code, 1);
  assert.match(lines.join('\n'), /northamerica-northeast1/);
  assert.equal(calls.length, 0);
});

test('missing gcloud auth stops with the login hint', async () => {
  const { jobs } = await fixtureJobs();
  const base = fakeExec().exec;
  const exec: Exec = async (cmd, args, opts) => (args.includes('print-access-token') ? { code: 1, stdout: '', stderr: 'expired' } : base(cmd, args, opts));
  const lines: string[] = [];
  assert.equal(await main(['roofr', '--jobs', jobs], { exec, env: ENV, log: (l) => lines.push(l) }), 1);
  assert.match(lines.join('\n'), /gcloud auth login/);
});

test('an active project that differs from SNAPSHOT_GCP_PROJECT stops the run', async () => {
  const { jobs } = await fixtureJobs();
  const { exec } = fakeExec();
  const lines: string[] = [];
  assert.equal(await main(['roofr', '--jobs', jobs], { exec, env: { ...ENV, SNAPSHOT_GCP_PROJECT: 'other-project' }, log: (l) => lines.push(l) }), 1);
  assert.match(lines.join('\n'), /differs from the active gcloud project/);
});

test('--grant edits the ACL through a temp file, then binds jobUser per viewer', async () => {
  const { jobs } = await fixtureJobs();
  const { exec, calls } = fakeExec();
  const code = await main(['roofr', '--grant', '--jobs', jobs], { exec, env: { ...ENV, SNAPSHOT_VIEWERS: 'a@example.com,b@example.com' }, log: () => undefined });
  assert.equal(code, 0);
  assert.ok(calls.some((c) => c.args.includes('update') && c.args.includes('--source')));
  const bindings = calls.filter((c) => c.args.includes('add-iam-policy-binding'));
  assert.equal(bindings.length, 2);
  assert.ok(bindings.every((b) => b.args.includes('--role=roles/bigquery.jobUser')));
});
