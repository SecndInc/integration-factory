// Human driver: prints one step at a time and waits for Enter. The person does the step in the
// browser. Enter settles the network and closes the step; `s` skips, `f <reason>` fails, `q` ends
// the run as owner_ended. Works against any browser source; in attach mode there is no Playwright
// at all. Design: docs/design/api-docs.md §4.

import { createInterface } from 'node:readline';
import { AttachedBrowserProvider, BrowserbaseProvider, LocalBrowserProvider, type BrowserHandle } from '../../capture/browser-provider.js';
import type { ResolvedTarget } from '../../target.js';
import { CaptureError } from '../errors.js';
import { Recorder, type RecorderOptions, type StepHandle } from '../recorder.js';
import type { Counts, RunId, SiteId, Workflow } from '../types.js';

export type BrowserSource =
  /** A Chrome the person started with --remote-debugging-port. No Playwright. */
  | { kind: 'attached'; cdpUrl: string }
  /** LocalBrowserProvider(headed, proxy, exposeCdp = true); the driver opens startUrl in a new context. */
  | { kind: 'local'; headed: boolean; storageStatePath?: string }
  /** BrowserbaseProvider; the recorder connects to the session's connectUrl. */
  | { kind: 'browserbase'; storageStatePath?: string };

/** What the driver needs from a connected browser. The default builds it from the browser providers. */
export interface ConnectedBrowser {
  /** Browser-level websocket the recorder attaches to. */
  cdpUrl: string;
  /** Open a URL in a new page. Absent for attached browsers: the person navigates. */
  openPage?: (url: string) => Promise<void>;
  /** Close or disconnect the browser. Never called for an attached source. */
  dispose?: () => Promise<void>;
}

/** The part of Recorder the driver uses. */
export type RecorderLike = Pick<Recorder, 'step' | 'settle' | 'inScopeCount' | 'counts' | 'close'>;

export interface HumanDriverOptions {
  target: ResolvedTarget;
  workflow: Workflow;
  browser: BrowserSource;
  tracePath: string;
  runId: RunId;
  /** Extra in-scope hosts beyond target.host. */
  extraHosts?: readonly string[];
  holdBodies?: boolean;
  io: { input: NodeJS.ReadableStream; output: NodeJS.WritableStream };
  log: (line: string) => void;
  /** Test injection: replaces Recorder.attach. */
  recorder?: (opts: RecorderOptions) => Promise<RecorderLike>;
  /** Test injection: replaces the browser providers. */
  browserConnect?: (browser: BrowserSource, target: ResolvedTarget) => Promise<ConnectedBrowser>;
}

export interface RecordSummary {
  runId: RunId;
  tracePath: string;
  outcome: 'completed' | 'failed' | 'owner_ended';
  counts: Counts;
  steps: readonly { id: string; outcome: 'ok' | 'failed' | 'skipped'; exchanges: number }[];
}

/** kebab-case of the target name; the SiteId used for the recorder, the jobs directory and the workflows directory. */
export function siteIdOf(target: Pick<ResolvedTarget, 'name'>): SiteId {
  const id = target.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (id || 'site') as SiteId;
}

type Answer = { kind: 'ok' } | { kind: 'skip' } | { kind: 'fail'; reason: string } | { kind: 'quit' };

const promptText = '  Enter = done, s = skip, f <reason> = failed, q = stop > ';

/**
 * Attach the recorder, open the start page (local/browserbase) or tell the person to (attached),
 * refuse with CaptureError('no-traffic-recorded') when the start page produced zero in-scope exchanges,
 * then run each step through Recorder.step with a prompt. Always closes the recorder.
 */
export async function recordWithHumanDriver(opts: HumanDriverOptions): Promise<RecordSummary> {
  const { target, workflow, io } = opts;
  const say = (text: string): void => void io.output.write(`${text}\n`);

  const connected = await (opts.browserConnect ?? connectBrowser)(opts.browser, target);
  const reader = new LineReader(io.input);
  const attach = opts.recorder ?? ((o: RecorderOptions) => Recorder.attach(o));
  let recorder: RecorderLike | undefined;
  let outcome: RecordSummary['outcome'] = 'failed';
  const steps: { id: string; outcome: 'ok' | 'failed' | 'skipped'; exchanges: number }[] = [];
  let counts: Counts | undefined;

  try {
    recorder = await attach({
      cdpUrl: connected.cdpUrl,
      tracePath: opts.tracePath,
      runId: opts.runId,
      site: siteIdOf(target),
      driver: 'human',
      workflowId: workflow.id,
      browserKind: opts.browser.kind,
      scope: { hosts: [target.host, ...(opts.extraHosts ?? [])] },
      bodies: { hold: opts.holdBodies ?? false },
      log: opts.log,
    });

    say(`Workflow: ${workflow.name}`);
    say(`Goal: ${workflow.goal}`);

    let quit = false;
    const startUrl = target.loginUrl ?? target.startUrl;
    if (opts.browser.kind === 'attached') {
      say(`Open ${startUrl} in the Chrome you started with --remote-debugging-port, sign in if needed,`);
      say('then press Enter here (q to stop).');
      const line = await reader.next();
      if (line === undefined || line.trim().toLowerCase() === 'q') quit = true;
    } else if (connected.openPage) {
      try {
        await connected.openPage(startUrl);
      } catch (error) {
        throw new CaptureError(
          'browser-unreachable',
          `could not open ${startUrl}: ${error instanceof Error ? error.message : String(error)}`,
          'Check the target startUrl and your network, then run record again.',
        );
      }
    }

    if (!quit) {
      await recorder.settle();
      if (recorder.inScopeCount === 0) {
        throw new CaptureError(
          'no-traffic-recorded',
          `the start page produced no traffic for ${[target.host, ...(opts.extraHosts ?? [])].join(', ')}: the browser is not the one being recorded, or the scope is wrong`,
          'With --attach, browse the site in the Chrome that has --remote-debugging-port open and confirm its URL is the one you passed. Add other hosts the site uses with --host <h>.',
        );
      }
    }

    const total = workflow.steps.length;
    for (let i = 0; i < total && !quit; i += 1) {
      const step = workflow.steps[i]!;
      say('');
      say(`[${i + 1}/${total}] ${step.do}`);
      for (const hint of step.hints) say(`    hint: ${hint}`);
      for (const name of step.uses) {
        const input = workflow.inputs.find((candidate) => candidate.name === name);
        const example = input && !input.secret && input.example ? ` (example: ${input.example})` : input?.secret ? ' (secret)' : '';
        say(`    input: ${name}${example}`);
      }
      if (step.confirms.length > 0) say(`    presses: ${step.confirms.join(', ')}`);

      const before = recorder.counts.attribution.inStep;
      const given: { answer: Answer } = { answer: { kind: 'ok' } };
      await recorder.step(step.id, i, step.do, async (handle: StepHandle) => {
        const answer = await ask(reader, io);
        given.answer = answer;
        if (answer.kind === 'skip') handle.skip();
        else if (answer.kind === 'fail') handle.fail(answer.reason);
        else if (answer.kind === 'quit') handle.skip('run ended by owner');
      });
      const exchanges = Math.max(0, recorder.counts.attribution.inStep - before);
      const kind = given.answer.kind;
      const stepOutcome = kind === 'fail' ? 'failed' : kind === 'ok' ? 'ok' : 'skipped';
      steps.push({ id: step.id, outcome: stepOutcome, exchanges });
      say(`    ${stepOutcome}, ${exchanges} exchange${exchanges === 1 ? '' : 's'}`);
      if (kind === 'quit') quit = true;
    }

    outcome = quit ? 'owner_ended' : steps.some((s) => s.outcome === 'failed') ? 'failed' : 'completed';
  } finally {
    try {
      if (recorder) counts = await recorder.close(outcome);
    } finally {
      reader.close();
      if (opts.browser.kind !== 'attached' && connected.dispose) await connected.dispose();
    }
  }

  return {
    runId: opts.runId,
    tracePath: opts.tracePath,
    outcome,
    counts: counts as Counts,
    steps,
  };
}

async function ask(reader: LineReader, io: HumanDriverOptions['io']): Promise<Answer> {
  for (;;) {
    io.output.write(promptText);
    const line = await reader.next();
    if (line === undefined) return { kind: 'quit' };
    const text = line.trim();
    if (text === '') return { kind: 'ok' };
    const lower = text.toLowerCase();
    if (lower === 's') return { kind: 'skip' };
    if (lower === 'q') return { kind: 'quit' };
    const fail = /^f(?:\s+(.*))?$/i.exec(text);
    if (fail) return { kind: 'fail', reason: fail[1]?.trim() || 'marked failed by the person' };
    io.output.write(`\n  not understood: "${text}"\n`);
  }
}

/** Line queue over an input stream; resolves undefined at end of input. */
class LineReader {
  private readonly queue: string[] = [];
  private readonly waiters: ((line: string | undefined) => void)[] = [];
  private ended = false;
  private readonly rl;

  constructor(input: NodeJS.ReadableStream) {
    this.rl = createInterface({ input, crlfDelay: Infinity });
    this.rl.on('line', (line) => {
      const waiter = this.waiters.shift();
      if (waiter) waiter(line);
      else this.queue.push(line);
    });
    this.rl.on('close', () => {
      this.ended = true;
      for (const waiter of this.waiters.splice(0)) waiter(undefined);
    });
  }

  next(): Promise<string | undefined> {
    const line = this.queue.shift();
    if (line !== undefined) return Promise.resolve(line);
    if (this.ended) return Promise.resolve(undefined);
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  close(): void {
    this.rl.close();
  }
}

// ---- default browser wiring

async function connectBrowser(source: BrowserSource, target: ResolvedTarget): Promise<ConnectedBrowser> {
  void target;
  if (source.kind === 'attached') {
    return { cdpUrl: await AttachedBrowserProvider.resolveWebSocketUrl(source.cdpUrl) };
  }

  if (source.kind === 'browserbase') {
    const apiKey = process.env.BROWSERBASE_API_KEY;
    const projectId = process.env.BROWSERBASE_PROJECT_ID;
    if (!apiKey || !projectId) {
      throw new CaptureError(
        'browser-unreachable',
        'Browserbase credentials are not set',
        'Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in the environment, or use --attach <url> / --headed instead.',
      );
    }
  }

  let handle: BrowserHandle;
  try {
    handle =
      source.kind === 'local'
        ? await new LocalBrowserProvider(source.headed, undefined, true).connect()
        : await new BrowserbaseProvider(process.env.BROWSERBASE_API_KEY!, process.env.BROWSERBASE_PROJECT_ID!).connect();
  } catch (error) {
    throw new CaptureError(
      'browser-unreachable',
      `could not start the ${source.kind} browser: ${error instanceof Error ? error.message : String(error)}`,
      source.kind === 'local'
        ? 'Run `npx playwright install chromium`, or record in your own Chrome with --attach <url>.'
        : 'Check BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID and your Browserbase plan, or use --attach <url>.',
    );
  }
  if (!handle.cdpUrl) {
    await handle.dispose();
    throw new CaptureError('browser-unreachable', `the ${source.kind} browser did not expose a CDP endpoint`, 'Use --attach <url> instead.');
  }
  const browser = handle.browser;
  const cdpUrl = await AttachedBrowserProvider.resolveWebSocketUrl(handle.cdpUrl).catch(async (error: unknown) => {
    await handle.dispose();
    throw error;
  });
  return {
    cdpUrl,
    openPage: async (url) => {
      const context =
        source.kind === 'local'
          ? await browser.newContext(source.storageStatePath ? { storageState: source.storageStatePath } : {})
          : (browser.contexts()[0] ?? (await browser.newContext(source.storageStatePath ? { storageState: source.storageStatePath } : {})));
      const page = await context.newPage();
      await page.goto(url);
    },
    dispose: handle.dispose,
  };
}
