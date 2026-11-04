import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough, Writable } from 'node:stream';
import test from 'node:test';
import { cliDeps, main, parseArgs } from '../../src/apidocs-cli.js';
import { recordWithHumanDriver, siteIdOf, type RecorderLike } from '../../src/apidocs/drivers/human.js';
import { CaptureError } from '../../src/apidocs/errors.js';
import { WorkflowSchema, type Counts, type RunId, type StepId, type Trace } from '../../src/apidocs/types.js';
import { resolveTarget } from '../../src/target.js';

// ---- helpers

async function tempDir(): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-cli-'));
}

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

function collector(): { stream: Writable; text: () => string } {
  let buffer = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      buffer += String(chunk);
      callback();
    },
  });
  return { stream, text: () => buffer };
}

const zeroCounts: Counts = {
  targets: 0,
  exchanges: 0,
  inScope: 0,
  bodies: { ok: 0, skipped: 0, evicted: 0, tooLarge: 0, error: 0 },
  attribution: { inStep: 0, betweenSteps: 0, beforeFirstStep: 0, orphanEvents: 0 },
  inflightAtEnd: 0,
};

const workflow = WorkflowSchema.parse({
  workflowVersion: 1,
  id: 'demo-flow',
  name: 'Demo flow',
  goal: 'Do four things',
  effect: 'read',
  steps: [
    { id: 'one', do: 'Step one' },
    { id: 'two', do: 'Step two', hints: ['a hint'] },
    { id: 'three', do: 'Step three' },
    { id: 'four', do: 'Step four' },
  ],
});

const target = resolveTarget({ name: 'Demo Site', startUrl: 'https://demo.example.com/' });

interface FakeRecorder extends RecorderLike {
  calls: { id: string; index: number; outcome: string; note?: string }[];
  closed: (string | undefined)[];
  opts?: unknown;
}

function fakeRecorder(inScope = 3): FakeRecorder {
  let inStep = 0;
  const fake: FakeRecorder = {
    calls: [],
    closed: [],
    async step(id: StepId, index: number, _text: string, fn) {
      let outcome = 'ok';
      let note: string | undefined;
      await fn({
        id,
        action() {},
        skip(n) {
          outcome = 'skipped';
          note = n;
        },
        fail(n) {
          outcome = 'failed';
          note = n;
        },
      });
      inStep += 2;
      fake.calls.push({ id, index, outcome, ...(note ? { note } : {}) });
    },
    async settle() {
      return { inflight: 0 };
    },
    get inScopeCount() {
      return inScope;
    },
    get counts(): Counts {
      return { ...zeroCounts, attribution: { ...zeroCounts.attribution, inStep } };
    },
    async close(outcome) {
      fake.closed.push(outcome);
      return { ...zeroCounts, attribution: { ...zeroCounts.attribution, inStep } };
    },
  };
  return fake;
}

// ---- parseArgs

test('parseArgs: positional, value flags in both forms, repeatable and boolean flags', () => {
  const args = parseArgs([
    'record', 'demo', '--workflow', 'w.json', '--attach=http://127.0.0.1:9222',
    '--host', 'a.com', '--host=b.com', '--headed', '--hold-bodies', '--jobs', 'j',
  ]);
  assert.equal(args.command, 'record');
  assert.deepEqual(args.positional, ['demo']);
  assert.deepEqual(args.flags, {
    workflow: 'w.json',
    attach: 'http://127.0.0.1:9222',
    host: ['a.com', 'b.com'],
    headed: true,
    'hold-bodies': true,
    jobs: 'j',
  });
});

test('parseArgs: single repeatable flag stays a string, -o is accepted, --raw and --redact-key parse', () => {
  assert.deepEqual(parseArgs(['record', 't', '--host', 'a.com']).flags, { host: 'a.com' });
  assert.deepEqual(parseArgs(['har', 'trace.jsonl', '-o', 'out.har']).flags, { o: 'out.har' });
  assert.deepEqual(parseArgs(['inspect', 't.jsonl', '--raw', '--show', 'x:y:0']).flags, { raw: true, show: 'x:y:0' });
  assert.deepEqual(parseArgs(['build', 't', '--redact-key', 'a', '--redact-key', 'b']).flags, { 'redact-key': ['a', 'b'] });
});

test('parseArgs: unknown command, missing value, unknown flag and bad boolean throw workflow-invalid with the usage line', () => {
  const cases: string[][] = [
    [],
    ['frobnicate'],
    ['record', 't', '--workflow'],
    ['record', 't', '--workflow', '--headed'],
    ['record', 't', '--nope'],
    ['record', 't', '--headed=yes'],
  ];
  for (const argv of cases) {
    assert.throws(
      () => parseArgs(argv),
      (error: unknown) => error instanceof CaptureError && error.code === 'workflow-invalid' && /apidocs (record|inspect|har|build)/.test(error.fix ?? ''),
      JSON.stringify(argv),
    );
  }
});

// ---- main exit codes

test('main returns 3 for a parse error', async () => {
  const cap = capture();
  try {
    assert.equal(await main(['record', 't', '--workflow']), 3);
    assert.match(cap.text(), /needs a value/);
    assert.match(cap.text(), /Usage:/);
  } finally {
    cap.restore();
  }
});

test('main returns 3 and lists the issues for an invalid workflow file', async () => {
  const dir = await tempDir();
  const targetFile = path.join(dir, 'demo.json');
  const workflowFile = path.join(dir, 'bad-workflow.json');
  await fs.writeFile(targetFile, JSON.stringify({ name: 'demo', startUrl: 'https://demo.example.com/' }));
  await fs.writeFile(workflowFile, JSON.stringify({ workflowVersion: 1, id: 'Bad Id', name: 'x', goal: 'y', effect: 'read', steps: [] }));
  const cap = capture();
  try {
    assert.equal(await main(['record', targetFile, '--workflow', workflowFile]), 3);
    assert.match(cap.text(), /not a valid workflow/);
    assert.match(cap.text(), /id:/);
    assert.match(cap.text(), /steps:/);
  } finally {
    cap.restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('main returns 2 when --attach points at a port nothing listens on', async () => {
  const dir = await tempDir();
  const targetFile = path.join(dir, 'demo.json');
  const workflowFile = path.join(dir, 'workflow.json');
  await fs.writeFile(targetFile, JSON.stringify({ name: 'demo', startUrl: 'https://demo.example.com/' }));
  await fs.writeFile(
    workflowFile,
    JSON.stringify({ workflowVersion: 1, id: 'flow', name: 'Flow', goal: 'g', effect: 'read', steps: [{ id: 'one', do: 'x' }] }),
  );
  const cap = capture();
  try {
    const code = await withDeps(
      {
        pruneTraces: async () => [],
        newRunId: () => '20261103T000000Z-abcd' as RunId,
        tracePathFor: (_jobs, _site, runId) => path.join(dir, `trace-${runId}.jsonl`),
      },
      () => main(['record', targetFile, '--workflow', workflowFile, '--attach', 'http://127.0.0.1:1']),
    );
    assert.equal(code, 2);
    assert.match(cap.text(), /remote-debugging-port/);
  } finally {
    cap.restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// ---- human driver

test('human driver: Enter, s, f <reason>, q give ok, skipped, failed, then owner_ended; close once', async () => {
  const recorder = fakeRecorder();
  const input = new PassThrough();
  const output = collector();
  input.write('\n');
  input.write('s\n');
  input.write('f broke\n');
  input.write('q\n');
  let disposed = 0;
  let opened: string | undefined;
  const logs: string[] = [];
  const summary = await recordWithHumanDriver({
    target,
    workflow,
    browser: { kind: 'local', headed: true },
    tracePath: 'trace.jsonl',
    runId: 'r1' as RunId,
    extraHosts: ['api.demo.example.com'],
    io: { input, output: output.stream },
    log: (line) => logs.push(line),
    recorder: async (opts) => {
      recorder.opts = opts;
      return recorder;
    },
    browserConnect: async () => ({
      cdpUrl: 'ws://127.0.0.1:1/devtools/browser/x',
      openPage: async (url) => {
        opened = url;
      },
      dispose: async () => {
        disposed += 1;
      },
    }),
  });

  assert.equal(summary.outcome, 'owner_ended');
  assert.deepEqual(
    summary.steps.map((s) => [s.id, s.outcome, s.exchanges]),
    [['one', 'ok', 2], ['two', 'skipped', 2], ['three', 'failed', 2], ['four', 'skipped', 2]],
  );
  assert.deepEqual(recorder.calls.map((c) => [c.id, c.outcome, c.note]), [
    ['one', 'ok', undefined],
    ['two', 'skipped', undefined],
    ['three', 'failed', 'broke'],
    ['four', 'skipped', 'run ended by owner'],
  ]);
  assert.deepEqual(recorder.closed, ['owner_ended']);
  assert.equal(disposed, 1);
  assert.equal(opened, 'https://demo.example.com/');
  const opts = recorder.opts as { scope: { hosts: string[] }; driver: string; site: string; browserKind: string };
  assert.deepEqual(opts.scope.hosts, ['demo.example.com', 'api.demo.example.com']);
  assert.equal(opts.driver, 'human');
  assert.equal(opts.site, 'demo-site');
  assert.equal(opts.browserKind, 'local');
  const printed = output.text();
  assert.match(printed, /\[1\/4\] Step one/);
  assert.match(printed, /\[2\/4\] Step two/);
  assert.match(printed, /hint: a hint/);
  assert.match(printed, /Workflow: Demo flow/);
  assert.match(printed, /Goal: Do four things/);
});

test('human driver: all Enter gives completed; a failed step without q gives failed', async () => {
  for (const [lines, expected] of [
    [['', '', '', ''], 'completed'],
    [['', 'f nope', '', ''], 'failed'],
  ] as const) {
    const recorder = fakeRecorder();
    const input = new PassThrough();
    for (const line of lines) input.write(`${line}\n`);
    const summary = await recordWithHumanDriver({
      target,
      workflow,
      browser: { kind: 'local', headed: false },
      tracePath: 't.jsonl',
      runId: 'r2' as RunId,
      io: { input, output: collector().stream },
      log: () => {},
      recorder: async () => recorder,
      browserConnect: async () => ({ cdpUrl: 'ws://x' }),
    });
    assert.equal(summary.outcome, expected);
    assert.deepEqual(recorder.closed, [expected]);
  }
});

test('human driver: end of input counts as q; unknown input is asked again', async () => {
  const recorder = fakeRecorder();
  const input = new PassThrough();
  input.write('what\n');
  input.write('\n');
  input.end();
  const output = collector();
  const summary = await recordWithHumanDriver({
    target,
    workflow,
    browser: { kind: 'local', headed: true },
    tracePath: 't.jsonl',
    runId: 'r3' as RunId,
    io: { input, output: output.stream },
    log: () => {},
    recorder: async () => recorder,
    browserConnect: async () => ({ cdpUrl: 'ws://x' }),
  });
  assert.match(output.text(), /not understood: "what"/);
  assert.equal(summary.outcome, 'owner_ended');
  assert.deepEqual(summary.steps.map((s) => s.outcome), ['ok', 'skipped']);
});

test('human driver: zero in-scope exchanges throws no-traffic-recorded, still closes the recorder and disposes', async () => {
  const recorder = fakeRecorder(0);
  let disposed = 0;
  await assert.rejects(
    recordWithHumanDriver({
      target,
      workflow,
      browser: { kind: 'local', headed: true },
      tracePath: 't.jsonl',
      runId: 'r4' as RunId,
      io: { input: new PassThrough(), output: collector().stream },
      log: () => {},
      recorder: async () => recorder,
      browserConnect: async () => ({
        cdpUrl: 'ws://x',
        openPage: async () => {},
        dispose: async () => {
          disposed += 1;
        },
      }),
    }),
    (error: unknown) => error instanceof CaptureError && error.code === 'no-traffic-recorded' && Boolean(error.fix),
  );
  assert.deepEqual(recorder.closed, ['failed']);
  assert.equal(disposed, 1);
  assert.equal(recorder.calls.length, 0);
});

test('human driver: attached waits for confirmation, opens no page, never disposes', async () => {
  const recorder = fakeRecorder();
  const input = new PassThrough();
  input.write('\n'); // on the site
  input.write('q\n'); // stop at step 1
  let disposed = 0;
  let opened = 0;
  const output = collector();
  const summary = await recordWithHumanDriver({
    target,
    workflow,
    browser: { kind: 'attached', cdpUrl: 'ws://127.0.0.1:9222/devtools/browser/x' },
    tracePath: 't.jsonl',
    runId: 'r5' as RunId,
    io: { input, output: output.stream },
    log: () => {},
    recorder: async () => recorder,
    browserConnect: async (browser) => ({
      cdpUrl: browser.kind === 'attached' ? browser.cdpUrl : 'ws://other',
      openPage: async () => {
        opened += 1;
      },
      dispose: async () => {
        disposed += 1;
      },
    }),
  });
  assert.equal(summary.outcome, 'owner_ended');
  assert.equal(opened, 0);
  assert.equal(disposed, 0);
  assert.deepEqual(recorder.closed, ['owner_ended']);
  assert.match(output.text(), /remote-debugging-port/);
});

test('human driver: browserbase without credentials is browser-unreachable naming the env vars', async () => {
  const saved = { key: process.env.BROWSERBASE_API_KEY, project: process.env.BROWSERBASE_PROJECT_ID };
  delete process.env.BROWSERBASE_API_KEY;
  delete process.env.BROWSERBASE_PROJECT_ID;
  try {
    await assert.rejects(
      recordWithHumanDriver({
        target,
        workflow,
        browser: { kind: 'browserbase' },
        tracePath: 't.jsonl',
        runId: 'r6' as RunId,
        io: { input: new PassThrough(), output: collector().stream },
        log: () => {},
        recorder: async () => fakeRecorder(),
      }),
      (error: unknown) =>
        error instanceof CaptureError &&
        error.code === 'browser-unreachable' &&
        /BROWSERBASE_API_KEY/.test(error.fix ?? '') &&
        /BROWSERBASE_PROJECT_ID/.test(error.fix ?? ''),
    );
  } finally {
    if (saved.key !== undefined) process.env.BROWSERBASE_API_KEY = saved.key;
    if (saved.project !== undefined) process.env.BROWSERBASE_PROJECT_ID = saved.project;
  }
});

test('siteIdOf kebab-cases the target name', () => {
  assert.equal(siteIdOf({ name: 'Demo Site' }), 'demo-site');
  assert.equal(siteIdOf({ name: '  My_App.v2 ' }), 'my-app-v2');
});

// ---- inspect and har with a fake assembled trace

function fakeTrace(): Trace {
  const exchange = (seq: number, host: string, pathName: string, stepId?: string) => ({
    id: `s:${seq}:0`,
    seq,
    ...(stepId ? { stepId } : {}),
    target: { sessionId: 's', type: 'page', url: 'https://demo.example.com/' },
    resourceType: 'XHR',
    initiator: { type: 'script' },
    request: {
      method: 'GET',
      url: `https://${host}${pathName}`,
      host,
      path: pathName,
      query: [],
      headers: [['Authorization', 'Bearer SECRET-TOKEN'], ['Accept', 'application/json']],
      headersSource: 'wire',
      cookies: [{ name: 'sid', value: 'COOKIE-VALUE', domain: host, path: '/', httpOnly: true, secure: true }],
      at: '2026-11-03T00:00:00.000Z',
    },
    response: {
      status: 200,
      headers: [['Content-Type', 'application/json']],
      setCookies: ['sid=COOKIE-VALUE; Path=/; HttpOnly'],
      mimeType: 'application/json',
      fromCache: false,
      fromServiceWorker: false,
      body: { encoding: 'text', text: '{"ok":true}', bytes: 11, truncated: false },
      bodyState: 'ok',
      at: '2026-11-03T00:00:01.000Z',
    },
    outcome: 'completed',
    timing: { startMs: 0 },
  });
  return {
    traceVersion: 1,
    runId: 'r' as RunId,
    site: 'demo' as never,
    driver: 'human',
    startedAt: '2026-11-03T00:00:00.000Z',
    complete: true,
    outcome: 'completed',
    browser: { kind: 'local', version: '1' },
    scope: { hosts: ['demo.example.com'] },
    steps: [{ id: 'one' as StepId, index: 0, startedAt: '', outcome: 'ok', exchangeIds: [], actions: [] }],
    exchanges: [exchange(1, 'demo.example.com', '/api/items', 'one'), exchange(2, 'cdn.other.com', '/x.js')],
    setupExchangeIds: [],
    outsideExchangeIds: ['s:2:0'],
    snapshots: [],
    targets: [],
    counts: zeroCounts,
    badLines: [{ kind: 'bad', seq: 9, raw: '{', error: 'x' }],
  } as unknown as Trace;
}

const traceDeps = {
  readTrace: async () => ({ lines: [], truncatedTail: true }),
  assemble: () => fakeTrace(),
  isSensitiveName: (name: string) => /^(authorization|cookie|set-cookie)$/i.test(name),
};

test('inspect: table with filters, bad-line count and truncatedTail', async () => {
  const cap = capture();
  try {
    const code = await withDeps(traceDeps, () => main(['inspect', 't.jsonl', '--host', 'demo.example.com', '--grep', 'ITEMS']));
    assert.equal(code, 0);
    const text = cap.text();
    assert.match(text, /demo\.example\.com\/api\/items/);
    assert.doesNotMatch(text, /cdn\.other\.com/);
    assert.match(text, /1 of 2 exchanges shown/);
    assert.match(text, /bad lines: 1\s+truncatedTail: true/);
  } finally {
    cap.restore();
  }
});

test('inspect --step filters by step; unmatched exchanges are labelled', async () => {
  const cap = capture();
  try {
    await withDeps(traceDeps, () => main(['inspect', 't.jsonl']));
    assert.match(cap.text(), /\(between\)/);
    assert.match(cap.text(), /2 of 2 exchanges shown/);
  } finally {
    cap.restore();
  }
  const cap2 = capture();
  try {
    await withDeps(traceDeps, () => main(['inspect', 't.jsonl', '--step', 'one']));
    assert.match(cap2.text(), /1 of 2 exchanges shown/);
  } finally {
    cap2.restore();
  }
});

test('inspect --show redacts sensitive headers and cookie values unless --raw', async () => {
  const cap = capture();
  try {
    assert.equal(await withDeps(traceDeps, () => main(['inspect', 't.jsonl', '--show', 's:1:0'])), 0);
    const text = cap.text();
    assert.match(text, /Authorization: \{redacted\}/);
    assert.match(text, /Accept: application\/json/);
    assert.match(text, /sid=\{redacted\}/);
    assert.doesNotMatch(text, /SECRET-TOKEN|COOKIE-VALUE/);
    assert.match(text, /\{"ok":true\}/);
  } finally {
    cap.restore();
  }
  const rawCap = capture();
  try {
    await withDeps(traceDeps, () => main(['inspect', 't.jsonl', '--show', 's:1:0', '--raw']));
    assert.match(rawCap.text(), /Bearer SECRET-TOKEN/);
    assert.match(rawCap.text(), /COOKIE-VALUE/);
  } finally {
    rawCap.restore();
  }
});

test('inspect --show fails closed when the sensitive-name test throws, and exits 3 for an unknown exchange', async () => {
  const cap = capture();
  try {
    const throwing = { ...traceDeps, isSensitiveName: () => { throw new Error('not implemented'); } };
    assert.equal(await withDeps(throwing, () => main(['inspect', 't.jsonl', '--show', 's:1:0'])), 0);
    assert.doesNotMatch(cap.text(), /SECRET-TOKEN/);
    assert.equal(await withDeps(traceDeps, () => main(['inspect', 't.jsonl', '--show', 'nope'])), 3);
  } finally {
    cap.restore();
  }
});

test('har writes 2-space JSON to -o, or next to the trace by default', async () => {
  const dir = await tempDir();
  const cap = capture();
  try {
    const deps = { ...traceDeps, toHar: () => ({ log: { version: '1.2' as const, creator: { name: 'x', version: '1' }, pages: [], entries: [] } }) };
    const explicit = path.join(dir, 'out.har');
    assert.equal(await withDeps(deps, () => main(['har', 't.jsonl', '-o', explicit])), 0);
    const text = await fs.readFile(explicit, 'utf8');
    assert.ok(text.startsWith('{\n  "log": {'));
    assert.ok(text.endsWith('}\n'));
    await assert.rejects(fs.stat(`${explicit}.tmp`));

    const trace = path.join(dir, 'trace-1.jsonl');
    assert.equal(await withDeps(deps, () => main(['har', trace])), 0);
    await fs.stat(path.join(dir, 'trace-1.har'));
  } finally {
    cap.restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});

// ---- build

test('build warns about a non-completed latest run, passes redact keys, writes four files atomically', async () => {
  const dir = await tempDir();
  const workflowsDir = path.join(dir, 'workflows');
  const outDir = path.join(dir, 'out');
  await fs.mkdir(workflowsDir);
  await fs.writeFile(path.join(workflowsDir, 'flow.json'), JSON.stringify({ workflowVersion: 1, id: 'demo-flow', name: 'F', goal: 'g', effect: 'read', steps: [{ id: 'one', do: 'x' }] }));
  await fs.writeFile(path.join(workflowsDir, 'other.yaml'), 'id: x');
  const targetFile = path.join(dir, 'demo.json');
  await fs.writeFile(targetFile, JSON.stringify({ name: 'demo', startUrl: 'https://demo.example.com/' }));
  const seen: { extraKeys?: readonly string[]; workflows?: number; traces?: number } = {};
  const cap = capture();
  try {
    const code = await withDeps(
      {
        listTraces: async () => [path.join(dir, 'a.jsonl'), path.join(dir, 'b.jsonl')],
        readTrace: async () => ({ lines: [], truncatedTail: false }),
        assemble: () => ({ ...fakeTrace(), workflowId: 'demo-flow', outcome: 'failed' }) as unknown as Trace,
        derive: ((input: { redaction: { extraKeys: readonly string[] }; workflows: unknown[]; traces: unknown[] }) => {
          seen.extraKeys = input.redaction.extraKeys;
          seen.workflows = input.workflows.length;
          seen.traces = input.traces.length;
          return {
            coverage: { steps: 1, stepsWithExchanges: 1, endpoints: 2, endpointsWithExample: 2, bindings: 0, inputsBound: 0, computedValues: 0, bodiesEvicted: 0, betweenSteps: 0 },
          };
        }) as never,
        renderApiDoc: (() => ({ 'api.json': '{}\n', 'openapi.json': '{}\n', 'index.html': '<html>', 'README.md': '# x\n' })) as never,
      },
      () => main(['build', targetFile, '--workflows', workflowsDir, '--out', outDir, '--redact-key', 'x-tenant', '--redact-key', 'x-org']),
    );
    assert.equal(code, 0);
    assert.deepEqual(seen, { extraKeys: ['x-tenant', 'x-org'], workflows: 1, traces: 2 });
    assert.match(cap.text(), /latest run r is failed, not completed/);
    assert.match(cap.text(), /YAML workflows are not read/);
    assert.match(cap.text(), /coverage: steps with exchanges 1\/1/);
    assert.deepEqual((await fs.readdir(outDir)).sort(), ['README.md', 'api.json', 'index.html', 'openapi.json']);
  } finally {
    cap.restore();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
