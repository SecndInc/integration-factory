// `apidocs snapshot`: argument handling, the consent gate and the exit codes, with the fetcher, the store and the runner
// replaced (cliDeps). The run itself is covered by snapshot-runner.test.ts.

import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { cliDeps, main, parseArgs } from '../../src/apidocs-cli.js';
import type { Fetcher } from '../../src/apidocs/snapshot/fetcher.js';
import type { SnapshotSummary } from '../../src/apidocs/snapshot/runner.js';
import type { SnapshotStore } from '../../src/apidocs/snapshot/store.js';

function capture(): { text: () => string; restore: () => void } {
  let buffer = '';
  const realOut = process.stdout.write.bind(process.stdout);
  const realErr = process.stderr.write.bind(process.stderr);
  const sink = (chunk: string | Uint8Array): boolean => {
    buffer += String(chunk);
    return true;
  };
  process.stdout.write = sink as typeof process.stdout.write;
  process.stderr.write = sink as typeof process.stderr.write;
  return {
    text: () => buffer,
    restore: () => {
      process.stdout.write = realOut;
      process.stderr.write = realErr;
    },
  };
}

async function withDeps<T>(overrides: Partial<typeof cliDeps>, fn: () => Promise<T>): Promise<T> {
  const saved = { ...cliDeps };
  Object.assign(cliDeps, overrides);
  try {
    return await fn();
  } finally {
    Object.assign(cliDeps, saved);
  }
}

const consent = { by: 'the account owner', on: '2020-01-01', scope: 'read' };

const planJson = {
  planVersion: 1,
  site: 'snapcli',
  origins: { app: 'https://snap.example.com' },
  tabFor: { app: 'snap.example.com' },
  loginPaths: ['^/login'],
  probe: { app: '/api/me' },
  headers: {},
  ids: { jobId: { endpoint: 'jobs', path: '$.data[].id' } },
  endpoints: [
    { id: 'jobs', origin: 'app', method: 'GET', path: '/api/jobs', paginator: { kind: 'laravel-meta', pageParam: 'page' }, records: '$.data', group: 'lists' },
    { id: 'job-notes', origin: 'app', method: 'GET', path: '/api/jobs/{jobId}/notes', paginator: { kind: 'none' }, group: 'per-job', perId: 'core' },
  ],
};

interface Setup {
  dir: string;
  jobs: string;
  plan: string;
  target(extra: Record<string, unknown>): Promise<string>;
  idsFile(ids: Record<string, string[]>): Promise<string>;
}

async function setup(): Promise<Setup> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-snapshot-cli-'));
  const plan = path.join(dir, 'plan.json');
  await fs.writeFile(plan, JSON.stringify(planJson));
  let n = 0;
  return {
    dir,
    jobs: path.join(dir, 'jobs'),
    plan,
    target: async (extra) => {
      const file = path.join(dir, `target-${(n += 1)}.json`);
      await fs.writeFile(file, JSON.stringify({ name: 'Snapcli', startUrl: 'https://snap.example.com/', ...extra }));
      return file;
    },
    idsFile: async (ids) => {
      const file = path.join(dir, 'ids.json');
      await fs.writeFile(file, JSON.stringify(ids));
      return file;
    },
  };
}

async function runMain(argv: string[]): Promise<{ code: number; text: string }> {
  const cap = capture();
  try {
    const code = await main(argv);
    return { code, text: cap.text() };
  } finally {
    cap.restore();
  }
}

const boom = (what: string) => async (): Promise<never> => {
  throw new Error(`${what} must not be called`);
};

function stubs(status: SnapshotSummary['status'], calls: string[], reason?: string): Partial<typeof cliDeps> {
  const fetcher = { close: async () => void calls.push('fetcher.close') } as unknown as Fetcher;
  const store = { dir: 'jobs/snapcli/snapshots/stub', close: async () => void calls.push('store.close') } as unknown as SnapshotStore;
  return {
    attachFetcher: (async (url: string, _plan: unknown, opts?: { origins?: string[] }) => {
      calls.push(`attach ${url} origins=${opts?.origins?.join(',')}`);
      return fetcher;
    }) as unknown as typeof cliDeps.attachFetcher,
    createStore: (async (_jobs: string, site: string, runId: string) => {
      calls.push(`create ${site} ${runId}`);
      return store;
    }) as unknown as typeof cliDeps.createStore,
    resumeStore: (async (_jobs: string, site: string, runId: string) => {
      calls.push(`resume ${site} ${runId}`);
      return store;
    }) as unknown as typeof cliDeps.resumeStore,
    runSnapshot: (async (opts: Parameters<typeof cliDeps.runSnapshot>[0]) => {
      calls.push(`run only=${opts.only?.join(',') ?? ''} groups=${opts.groups?.join(',') ?? ''} perId=${opts.perId} months=${opts.months} maxIds=${opts.maxIds ?? ''} resume=${opts.resume}`);
      const line = `snapshot snapcli ${opts.runId}: stub status ${status}`;
      opts.log(line);
      return { runId: opts.runId, site: opts.site, status, ...(reason ? { reason } : {}), line, dir: store.dir } as unknown as SnapshotSummary;
    }) as unknown as typeof cliDeps.runSnapshot,
  };
}

test('parseArgs reads the snapshot flags, repeating --only and --group', () => {
  const a = parseArgs(['snapshot', 'roofr', '--attach', 'http://127.0.0.1:9222', '--only', 'a', '--only', 'b', '--group', 'g', '--per-id', 'full', '--max-ids', '5', '--months=6', '--dry-run', '--resume', 'r1']);
  assert.equal(a.command, 'snapshot');
  assert.deepEqual(a.positional, ['roofr']);
  assert.deepEqual(a.flags.only, ['a', 'b']);
  assert.equal(a.flags.group, 'g');
  assert.equal(a.flags['dry-run'], true);
  assert.equal(a.flags['per-id'], 'full');
  assert.equal(a.flags.months, '6');
  assert.equal(a.flags.resume, 'r1');
});

test('--dry-run prints the plan, creates nothing, attaches to nothing, and needs no consent', async () => {
  const s = await setup();
  const target = await s.target({ environment: 'production' });
  const ids = await s.idsFile({ jobId: ['1', '2', '3'] });
  const r = await withDeps({ attachFetcher: boom('attachFetcher') as never, createStore: boom('createStore') as never, resumeStore: boom('resumeStore') as never, runSnapshot: boom('runSnapshot') as never }, () =>
    runMain(['snapshot', target, '--plan', s.plan, '--jobs', s.jobs, '--dry-run', '--ids-from', ids]),
  );
  assert.equal(r.code, 0, r.text);
  assert.match(r.text, /snapshot plan snapcli: 2 endpoints, per-id core, 24 months/);
  assert.match(r.text, /jobs {2}GET \/api\/jobs/);
  assert.match(r.text, /job-notes/);
  assert.match(r.text, /3 jobId/, 'the supplied id count feeds the estimate');
  assert.match(r.text, /origins needing a tab: app/);
  await assert.rejects(fs.access(s.jobs), 'nothing is created under jobs/');
});

test('a run without --attach is a usage error', async () => {
  const s = await setup();
  const target = await s.target({ environment: 'staging' });
  const r = await runMain(['snapshot', target, '--plan', s.plan, '--jobs', s.jobs]);
  assert.equal(r.code, 3);
  assert.match(r.text, /--attach is required/);
  assert.match(r.text, /apidocs snapshot <target> --attach/);
});

test('a production target without a valid snapshotConsent is refused with consent-missing (exit 3) before anything attaches', async () => {
  const s = await setup();
  const cases: [string, Record<string, unknown>][] = [
    ['no consent', { environment: 'production' }],
    ['no environment (production is the default)', {}],
    ['not started', { environment: 'production', snapshotConsent: { ...consent, on: '2999-01-01' } }],
    ['expired', { environment: 'production', snapshotConsent: { ...consent, expires: '2020-02-01' } }],
  ];
  for (const [name, extra] of cases) {
    const calls: string[] = [];
    const target = await s.target(extra);
    const r = await withDeps(stubs('complete', calls), () => runMain(['snapshot', target, '--plan', s.plan, '--jobs', s.jobs, '--attach', 'http://127.0.0.1:9']));
    assert.equal(r.code, 3, `${name}: ${r.text}`);
    assert.match(r.text, /no valid snapshotConsent/, name);
    assert.deepEqual(calls, [], `${name}: nothing attached or created`);
  }
});

test('with a valid consent the run happens: exit 0 when complete, 4 when partial or aborted, resources closed', async () => {
  const s = await setup();
  const target = await s.target({ environment: 'production', snapshotConsent: { ...consent, expires: '2999-12-31' } });
  const base = ['snapshot', target, '--plan', s.plan, '--jobs', s.jobs, '--attach', 'http://127.0.0.1:9', '--only', 'job-notes', '--group', 'per-job', '--months', '6', '--max-ids', '9'];

  const ok: string[] = [];
  const done = await withDeps(stubs('complete', ok), () => runMain(base));
  assert.equal(done.code, 0, done.text);
  assert.match(done.text, /snapshot snapcli [^\s:]+: stub status complete/);
  assert.match(done.text, /run dir: jobs\/snapcli\/snapshots\/stub/);
  assert.ok(ok[0]!.startsWith('attach http://127.0.0.1:9 origins=app'), ok[0]);
  assert.match(ok[1]!, /^create snapcli \d{8}T\d{6}Z-[0-9a-f]{4}$/);
  assert.equal(ok[2], 'run only=job-notes groups=per-job perId=core months=6 maxIds=9 resume=false');
  assert.deepEqual(ok.slice(3), ['store.close', 'fetcher.close']);

  const part: string[] = [];
  const partial = await withDeps(stubs('partial', part, '1 failed'), () => runMain(base));
  assert.equal(partial.code, 4, partial.text);
  assert.match(partial.text, /snapshot partial: 1 failed/);
  assert.match(partial.text, /rerun with --resume/);
  assert.deepEqual(part.slice(-2), ['store.close', 'fetcher.close'], 'closed on the failure path too');

  const abort: string[] = [];
  assert.equal((await withDeps(stubs('aborted', abort, 'session-expired'), () => runMain(base))).code, 4);
});

test('--resume reopens the run, a staging target needs no consent, and a bad --per-id is refused', async () => {
  const s = await setup();
  const staging = await s.target({ environment: 'sandbox' });
  const calls: string[] = [];
  const r = await withDeps(stubs('complete', calls), () => runMain(['snapshot', staging, '--plan', s.plan, '--jobs', s.jobs, '--attach', 'http://127.0.0.1:9', '--resume', 'run-7', '--per-id', 'full']));
  assert.equal(r.code, 0, r.text);
  assert.ok(calls.includes('resume snapcli run-7'), calls.join('\n'));
  assert.ok(calls.some((c) => /perId=full .*resume=true$/.test(c)), calls.join('\n'));
  assert.ok(!calls.some((c) => c.startsWith('create')));

  const bad = await runMain(['snapshot', staging, '--plan', s.plan, '--attach', 'http://127.0.0.1:9', '--per-id', 'some']);
  assert.equal(bad.code, 3);
  assert.match(bad.text, /--per-id is core or full/);
});

test('a plan that fails validation is plan-invalid (exit 3) and names the problem', async () => {
  const s = await setup();
  const target = await s.target({ environment: 'staging' });
  const bad = path.join(s.dir, 'bad.json');
  await fs.writeFile(bad, JSON.stringify({ ...planJson, endpoints: [{ ...planJson.endpoints[0]!, method: 'POST' }] }));
  const r = await runMain(['snapshot', target, '--plan', bad, '--dry-run']);
  assert.equal(r.code, 3);
  assert.match(r.text, /snapshot plan is invalid/);
});
