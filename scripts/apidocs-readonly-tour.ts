// Read-only tour of a signed-in web app through the person's own Chrome, recorded as one apidocs run.
//
//   npx tsx scripts/apidocs-readonly-tour.ts <target> [--port 9222] [--max 12] [--jobs jobs] [--out docs/apis]
//
// The person starts Chrome with --remote-debugging-port on a dedicated profile and signs in. This script
// attaches the recorder to that Chrome (browser-level CDP), drives the existing tab with Playwright over the
// same endpoint, and only ever NAVIGATES: it opens the start page, reads the navigation links on it, and
// visits each same-site link whose path does not look like an action. No clicks on buttons, no form
// submissions, no POST of its own. Links matching the deny pattern below are never followed. The Chrome
// window is left open and signed in.
//
// Output: a trace under jobs/<site>/traces (private, cookies inside, one-day retention), a workflow file
// listing the steps actually taken, and the four rendered docs under <out>/<site>.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromium, type Page } from 'playwright';
import { derive } from '../src/apidocs/derive.js';
import { emptyRedactionPolicy } from '../src/apidocs/redact.js';
import { renderApiDoc } from '../src/apidocs/render/index.js';
import { Recorder } from '../src/apidocs/recorder.js';
import { assemble, newRunId, readTrace, tracePathFor } from '../src/apidocs/trace.js';
import { WorkflowSchema, type RunId, type SiteId, type StepId, type Workflow, type WorkflowId } from '../src/apidocs/types.js';
import { siteIdOf } from '../src/apidocs/drivers/human.js';
import { loadTarget } from '../src/target.js';

const denyPattern = /log-?out|sign-?out|delete|remove|archive|export|download|create|new\b|add\b|edit|billing|payment|invite|cancel|unsubscribe|reset|verify|import|upload|send|share|duplicate|clone|approve|reject|submit|pay|refund|charge|connect|disconnect|oauth|auth\/|api\//i;
const workflowId = 'readonly-tour' as WorkflowId;

function flag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback;
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const targetName = argv.find((a) => !a.startsWith('--'));
  if (!targetName) throw new Error('usage: apidocs-readonly-tour <target> [--port 9222] [--max 12]');
  const port = Number(flag(argv, 'port', '9222'));
  const max = Number(flag(argv, 'max', '12'));
  const jobsDir = flag(argv, 'jobs', 'jobs');
  const outRoot = flag(argv, 'out', 'docs/apis');

  const target = await loadTarget(targetName);
  if (!target) throw new Error(`unknown target ${targetName}; put targets/${targetName}.json in place`);
  const site = siteIdOf(target) as SiteId;
  const startHost = new URL(target.startUrl).hostname;

  const version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()) as { webSocketDebuggerUrl: string };
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error('the attached Chrome has no browser context');
  const page: Page = context.pages().find((p) => p.url().includes(target.host)) ?? context.pages()[0] ?? (await context.newPage());
  await page.bringToFront();

  const runId = newRunId();
  const tracePath = tracePathFor(jobsDir, site, runId);
  const log = (m: string) => process.stdout.write(`  ${m}\n`);
  const recorder = await Recorder.attach({
    cdpUrl: version.webSocketDebuggerUrl,
    tracePath,
    runId,
    site,
    driver: 'playwright',
    workflowId,
    browserKind: 'attached',
    scope: { hosts: [target.host] },
    log,
  });

  const steps: { id: string; do: string; url: string }[] = [];
  let outcome: 'completed' | 'failed' = 'completed';
  try {
    await recorder.step('open-start' as StepId, 1, `Open ${target.startUrl}`, async () => {
      await page.goto(target.startUrl, { waitUntil: 'load' });
    });
    steps.push({ id: 'open-start', do: `Open ${target.startUrl}`, url: target.startUrl });
    const after = page.url();
    if (/login|sign-?in|signin|auth/i.test(new URL(after).pathname)) {
      throw new Error(`not signed in: the start page landed on ${after}. Sign in in the Chrome window and rerun.`);
    }

    const links = await page.evaluate((host: string) => {
      const seen = new Map<string, string>();
      for (const a of Array.from(document.querySelectorAll('a[href]'))) {
        const href = (a as HTMLAnchorElement).href;
        const text = (a.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
        let u: URL;
        try { u = new URL(href); } catch { continue; }
        if (u.hostname !== host || u.hash || u.pathname === '/' ) continue;
        if (!seen.has(u.origin + u.pathname)) seen.set(u.origin + u.pathname, text);
      }
      return Array.from(seen, ([href, text]) => ({ href, text }));
    }, startHost);
    const candidates = links.filter((l) => !denyPattern.test(l.href) && !denyPattern.test(l.text)).slice(0, max);
    log(`${links.length} same-site links on the start page, ${candidates.length} read-only candidates`);
    for (const l of candidates) log(`  will open ${l.href}  (${l.text || 'no text'})`);

    let index = 2;
    for (const l of candidates) {
      const id = `open-${index}` as StepId;
      const text = `Open ${l.text || new URL(l.href).pathname}`;
      await recorder.step(id, index, text, async (step) => {
        step.action('navigate', text, l.href);
        await page.goto(l.href, { waitUntil: 'load' });
      });
      steps.push({ id, do: text, url: l.href });
      index++;
    }
  } catch (error) {
    outcome = 'failed';
    log(`tour failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await recorder.close(outcome);
    await browser.close(); // disconnects from the attached Chrome; never closes it
  }
  log(`trace: ${tracePath}`);

  const workflow: Workflow = WorkflowSchema.parse({
    workflowVersion: 1,
    id: workflowId,
    name: 'Read-only tour',
    goal: 'Open the signed-in start page and every read-only navigation link it shows.',
    effect: 'read',
    preconditions: ['signed in'],
    inputs: [],
    steps: steps.map((s) => ({ id: s.id, do: s.do, expect: 'network', hints: [s.url] })),
  });
  const workflowsDir = path.join('workflows', site);
  await fs.mkdir(workflowsDir, { recursive: true });
  await fs.writeFile(path.join(workflowsDir, `${workflowId}.json`), JSON.stringify(workflow, null, 2) + '\n');

  const trace = assemble(await readTrace(tracePath));
  const doc = derive({ target, workflows: [workflow], traces: [{ path: tracePath, trace }], redaction: emptyRedactionPolicy });
  const rendered = renderApiDoc(doc);
  const outDir = path.join(outRoot, site);
  await fs.mkdir(outDir, { recursive: true });
  for (const [name, text] of Object.entries(rendered)) await fs.writeFile(path.join(outDir, name), text);

  const d = doc as unknown as { coverage: Record<string, number>; endpoints: { method: string; host: string; pathTemplate: string; kind: string; observedIn: unknown[] }[] };
  log(`outcome ${trace.outcome}, ${trace.exchanges.length} exchanges, counts ${JSON.stringify(trace.counts)}`);
  log(`coverage ${JSON.stringify(d.coverage)}`);
  for (const ep of d.endpoints) log(`${ep.kind.padEnd(4)} ${ep.method.padEnd(6)} ${ep.host}${ep.pathTemplate}  x${ep.observedIn.length}`);
  log(`docs: ${outDir}`);
  return outcome === 'completed' ? 0 : 4;
}

main().then((code) => { process.exitCode = code; }, (error) => { process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`); process.exitCode = 1; });
