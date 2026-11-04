// Read-only tour of a signed-in web app through the person's own Chrome, recorded as one apidocs run.
//
//   npx tsx scripts/apidocs-readonly-tour.ts <target> [--port 9222] [--max 12] [--items 3] [--jobs jobs] [--out docs/apis]
//
// The person starts Chrome with --remote-debugging-port on a dedicated profile and signs in. This script
// attaches the recorder to that Chrome (browser-level CDP), drives the existing tab with Playwright over the
// same endpoint, and only ever OPENS things: it opens the start page, reads the navigation links on it, visits
// each same-site link whose path does not look like an action, and on every page opens up to --items of the
// items the page shows (a detail link, or a data row that holds no form control) so the per-record endpoints
// are recorded too. A row that opened a page is left by going back; one that opened a drawer, by Escape.
// Links and rows matching the deny pattern below are never touched. No form submits, no POST of its own.
// The Chrome window is left open and signed in.
//
// Output: a trace under jobs/<site>/traces (private, cookies inside, one-day retention), a workflow file
// listing the steps actually taken, and the four rendered docs under <out>/<site>. The last lines list any
// non-GET request the pages made on their own: a page that writes on load is the person's call to keep.
//
// Design: docs/design/teardown-parity.md §1.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Page } from 'playwright';
import { derive, templatePath } from '../src/apidocs/derive.js';
import { settleCapMs, tourClickTimeoutMs, tourItemsPerPage } from '../src/apidocs/limits.js';
import { emptyRedactionPolicy } from '../src/apidocs/redact.js';
import { renderApiDoc } from '../src/apidocs/render/index.js';
import { Recorder } from '../src/apidocs/recorder.js';
import { assemble, newRunId, readTrace, tracePathFor } from '../src/apidocs/trace.js';
import { WorkflowSchema, type SiteId, type StepId, type Workflow, type WorkflowId } from '../src/apidocs/types.js';
import { siteIdOf } from '../src/apidocs/drivers/human.js';
import { loadTarget, type ResolvedTarget } from '../src/target.js';

export const denyPattern =
  /log-?out|sign-?out|delete|remove|archive|export|download|create|new\b|add\b|edit|billing|payment|invite|cancel|unsubscribe|reset|verify|import|upload|send|share|duplicate|clone|approve|reject|submit|pay|refund|charge|connect|disconnect|oauth|auth\/|api\//i;
const workflowId = 'readonly-tour' as WorkflowId;
const itemMarker = 'data-apidocs-item';

export interface TourOptions {
  target: ResolvedTarget;
  port: number;
  /** Navigation links opened from the start page. */
  max: number;
  /** Items opened per page. */
  items: number;
  jobsDir: string;
  outRoot: string;
  workflowsDir: string;
  log: (line: string) => void;
}

export interface TourResult {
  outcome: 'completed' | 'failed';
  tracePath: string;
  workflow: Workflow;
  /** In-scope requests that were not GET, HEAD or OPTIONS: `METHOD /templated/path` -> count. */
  writes: Map<string, number>;
  endpoints: { method: string; host: string; pathTemplate: string }[];
}

interface PageItems {
  /** Detail links on the page: same host, deeper than the page's path or inside a list row, not denied. */
  links: string[];
  /** Clickable rows and cards tagged `data-apidocs-item="0..n-1"`; zero when links were found. */
  rows: number;
  /** The element drawn over the first clickable item that something covers (`div.pendo-backdrop`), or null. */
  covered: string | null;
}

/**
 * Runs in the page. Reads the DOM and tags candidate rows; it changes nothing the server could see.
 * No inner function declarations: tsx would wrap them in a `__name` helper the page does not have.
 */
function collectItemsInPage(args: { host: string; pagePath: string; deny: string; max: number; marker: string; exclude: string[] }): PageItems {
  const denyRe = new RegExp(args.deny, 'i');
  // One id-like segment, with the separators: counting matches counts record ids without a helper function.
  const idRe = /\/(\d+|[0-9a-f]{8}-[0-9a-f-]{27}|[0-9a-f]{16,})(?=\/|$)/gi;
  const controls = 'input,button,select,textarea,[role="button"],[role="checkbox"],[role="switch"],[role="menuitem"],[contenteditable]';
  const excluded = new Set(args.exclude);
  const pageIds = (args.pagePath.match(idRe) ?? []).length;
  const links: string[] = [];
  const seen = new Set<string>();
  for (const a of Array.from(document.querySelectorAll('a[href]'))) {
    let u: URL;
    try {
      u = new URL((a as HTMLAnchorElement).href);
    } catch {
      continue;
    }
    if (u.hostname !== args.host || u.hash) continue;
    const p = u.pathname.replace(/\/+$/, '');
    if (p === '' || p === args.pagePath || excluded.has(u.origin + p)) continue;
    // A detail link: deeper than this page, inside a list row, or carrying a record id this page does not have.
    const deeper = args.pagePath !== '' && p.startsWith(`${args.pagePath}/`);
    const inRow = a.closest('table tbody,[role="row"],[role="listitem"],[role="grid"],[role="list"]') !== null;
    const hasRecordId = (p.match(idRe) ?? []).length > pageIds;
    if (!deeper && !inRow && !hasRecordId) continue;
    const label = (a.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (denyRe.test(u.pathname) || denyRe.test(label)) continue;
    if (seen.has(p)) continue;
    seen.add(p);
    links.push(u.origin + u.pathname + u.search);
    if (links.length >= args.max) break;
  }
  for (const el of Array.from(document.querySelectorAll(`[${args.marker}]`))) el.removeAttribute(args.marker);
  let rows = 0;
  let covered: string | null = null;
  if (links.length === 0) {
    // Rows and cards that look clickable: a pointer cursor on the element or one of its cells, nothing that
    // writes inside, and nothing drawn over them (an onboarding overlay turns every click into a timeout).
    const candidates = 'table tbody tr,[role="row"],[role="listitem"],[data-testid*="card"],[class*="card"]';
    for (const el of Array.from(document.querySelectorAll(candidates))) {
      if (el.parentElement?.closest(`[${args.marker}]`)) continue;
      if (el.closest('thead') !== null || el.querySelector('th,[role="columnheader"]') !== null) continue;
      if (el.querySelector(controls) !== null) continue;
      const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (label === '' || denyRe.test(label)) continue;
      const cell = el.querySelector('td,[role="gridcell"]');
      const pointer = getComputedStyle(el).cursor === 'pointer' || (cell !== null && getComputedStyle(cell).cursor === 'pointer');
      if (!pointer) continue;
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (top !== null && !el.contains(top)) {
        covered ??= `${top.tagName.toLowerCase()}${top.className ? `.${String(top.className).split(' ')[0]}` : ''}`;
        continue;
      }
      el.setAttribute(args.marker, String(rows));
      rows += 1;
      if (rows >= args.max) break;
    }
  }
  return { links, rows, covered };
}

/** Path with id-like segments templated, so a workflow file or a step name never carries a record id. */
function templated(url: string): string {
  return templatePath(new URL(url).pathname).template;
}

/** How many segments of a path are record ids (numeric or uuid-like). */
function recordIds(pathname: string): number {
  return templatePath(pathname).template.split('/').filter((s) => s.startsWith('{')).length;
}

function flag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback;
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: settleCapMs }).catch(() => undefined);
}

export async function runTour(opts: TourOptions): Promise<TourResult> {
  const { target, log } = opts;
  const site = siteIdOf(target) as SiteId;
  const startHost = new URL(target.startUrl).hostname;

  const version = (await (await fetch(`http://127.0.0.1:${opts.port}/json/version`)).json()) as { webSocketDebuggerUrl: string };
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${opts.port}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error('the attached Chrome has no browser context');
  const page: Page = context.pages().find((p) => p.url().includes(target.host)) ?? context.pages()[0] ?? (await context.newPage());
  await page.bringToFront();

  const runId = newRunId();
  const tracePath = tracePathFor(opts.jobsDir, site, runId);
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
  let index = 1;
  const nextId = (prefix: string): StepId => `${prefix}-${index}` as StepId;

  /** Start page and navigation links (origin + path): never items, whatever page they appear on. */
  const navigation: string[] = [];

  /** An item that cannot be opened (click timeout, row off screen, navigation error) is one skipped step, not a failed tour. */
  const skipItem = (step: { skip(note: string): void }, id: string, error: unknown): void => {
    const reason = (error instanceof Error ? error.message : String(error)).split('\n')[0] ?? 'unknown';
    step.skip(reason);
    log(`  ${id} skipped: ${reason}`);
  };

  /** Open up to opts.items of the items the current page shows, as their own steps. */
  const probeItems = async (): Promise<void> => {
    const pageUrl = page.url();
    const pagePath = new URL(pageUrl).pathname.replace(/\/+$/, '');
    const args = { host: startHost, pagePath, deny: denyPattern.source, max: opts.items, marker: itemMarker, exclude: navigation };
    const found = await page.evaluate(collectItemsInPage, args);
    const pageLabel = templated(pageUrl) || '/';
    if (found.links.length > 0) log(`${found.links.length} item link(s) on ${pageLabel}`);
    else if (found.rows > 0) log(`${found.rows} clickable row(s) on ${pageLabel}, no item links`);
    if (found.covered !== null) log(`  an overlay (${found.covered}) covers items on ${pageLabel}; close it by hand in the Chrome window to let the tour open them`);
    let k = 0;
    for (const href of found.links) {
      index += 1;
      k += 1;
      const id = nextId('item');
      const text = `Open item ${k} on ${pageLabel}`;
      await recorder.step(id, index, text, async (step) => {
        step.action('navigate', text, templated(href));
        try {
          await page.goto(href, { waitUntil: 'load' });
          await settle(page);
        } catch (error) {
          skipItem(step, id, error);
        }
      });
      steps.push({ id, do: text, url: templated(href) });
    }
    for (let row = 0; row < found.rows; row += 1) {
      index += 1;
      const id = nextId('item');
      const text = `Open row ${row + 1} on ${pageLabel}`;
      if (page.url() !== pageUrl) await page.goto(pageUrl, { waitUntil: 'load' });
      await page.evaluate(collectItemsInPage, args);
      const cell = page.locator(`[${itemMarker}="${row}"] td, [${itemMarker}="${row}"]`).first();
      if ((await cell.count()) === 0) {
        log(`  ${id} not opened: row ${row + 1} is no longer clickable`);
        continue;
      }
      await recorder.step(id, index, text, async (step) => {
        step.action('click', text, pageLabel);
        const before = context.pages().length;
        try {
          if (!(await cell.isVisible())) throw new Error('row is not visible');
          await cell.click({ timeout: tourClickTimeoutMs });
          await settle(page);
          for (const extra of context.pages().slice(before)) await extra.close();
          if (page.url() !== pageUrl) {
            step.action('navigate', 'opened a page; going back', templated(page.url()));
            await page.goBack({ waitUntil: 'load' }).catch(() => undefined);
          } else {
            await page.keyboard.press('Escape');
          }
          await settle(page);
        } catch (error) {
          skipItem(step, id, error);
          for (const extra of context.pages().slice(before)) await extra.close().catch(() => undefined);
        }
      });
      steps.push({ id, do: text, url: pageLabel });
    }
  };

  try {
    await recorder.step('open-start' as StepId, index, `Open ${target.startUrl}`, async () => {
      await page.goto(target.startUrl, { waitUntil: 'load' });
      await settle(page);
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
        try {
          u = new URL(href);
        } catch {
          continue;
        }
        if (u.hostname !== host || u.hash || u.pathname === '/') continue;
        if (!seen.has(u.origin + u.pathname)) seen.set(u.origin + u.pathname, text);
      }
      return Array.from(seen, ([href, text]) => ({ href, text }));
    }, startHost);
    // Navigation is a link with no more record ids than the page the start URL landed on (a root URL redirects
    // to a team page with an id in it); a link with one more is an item of the page it sits on, and
    // probeItems opens it as such.
    const landed = new URL(after);
    const startIds = recordIds(landed.pathname);
    const candidates = links
      .filter((l) => !denyPattern.test(l.href) && !denyPattern.test(l.text) && recordIds(new URL(l.href).pathname) <= startIds)
      .slice(0, opts.max);
    navigation.push(landed.origin + landed.pathname.replace(/\/+$/, ''), ...candidates.map((l) => l.href));
    log(`${links.length} same-site links on the start page, ${candidates.length} read-only candidates, up to ${opts.items} items opened per page`);
    for (const l of candidates) log(`  will open ${l.href}  (${l.text || 'no text'})`);

    await probeItems();
    for (const l of candidates) {
      index += 1;
      const id = nextId('open');
      const text = `Open ${l.text || new URL(l.href).pathname}`;
      await recorder.step(id, index, text, async (step) => {
        step.action('navigate', text, l.href);
        await page.goto(l.href, { waitUntil: 'load' });
        await settle(page);
      });
      steps.push({ id, do: text, url: l.href });
      await probeItems();
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
    goal: 'Open the signed-in start page, every read-only navigation link it shows, and a few of the items on each page.',
    effect: 'read',
    preconditions: ['signed in'],
    inputs: [],
    steps: steps.map((s) => ({ id: s.id, do: s.do, expect: 'network', hints: [s.url] })),
  });
  await fs.mkdir(opts.workflowsDir, { recursive: true });
  await fs.writeFile(path.join(opts.workflowsDir, `${workflowId}.json`), `${JSON.stringify(workflow, null, 2)}\n`);

  const trace = assemble(await readTrace(tracePath));
  const doc = derive({ target, workflows: [workflow], traces: [{ path: tracePath, trace }], redaction: emptyRedactionPolicy });
  const rendered = renderApiDoc(doc);
  const outDir = path.join(opts.outRoot, site);
  await fs.mkdir(outDir, { recursive: true });
  for (const [name, text] of Object.entries(rendered)) await fs.writeFile(path.join(outDir, name), text);

  const outside = new Set<string>(trace.outsideExchangeIds as readonly string[]);
  const writes = new Map<string, number>();
  for (const ex of trace.exchanges) {
    const method = ex.request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS' || outside.has(ex.id as string)) continue;
    const key = `${method} ${templatePath(ex.request.path).template}`;
    writes.set(key, (writes.get(key) ?? 0) + 1);
  }

  const d = doc as unknown as { coverage: Record<string, number>; endpoints: { method: string; host: string; pathTemplate: string; kind: string; observedIn: unknown[] }[] };
  log(`outcome ${trace.outcome}, ${trace.exchanges.length} exchanges, counts ${JSON.stringify(trace.counts)}`);
  log(`coverage ${JSON.stringify(d.coverage)}`);
  for (const ep of d.endpoints) log(`${ep.kind.padEnd(4)} ${ep.method.padEnd(6)} ${ep.host}${ep.pathTemplate}  x${ep.observedIn.length}`);
  if (writes.size === 0) log('writes the pages made on their own: none');
  else {
    log(`writes the pages made on their own (${writes.size}); the tour clicked nothing that submits, so these happen on load or on opening an item:`);
    for (const [key, n] of [...writes].sort()) log(`  ${key}  x${n}`);
  }
  log(`docs: ${outDir}`);
  return { outcome, tracePath, workflow, writes, endpoints: d.endpoints.map((ep) => ({ method: ep.method, host: ep.host, pathTemplate: ep.pathTemplate })) };
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const targetName = argv.find((a, i) => !a.startsWith('--') && !(argv[i - 1] ?? '').startsWith('--'));
  if (!targetName) throw new Error('usage: apidocs-readonly-tour <target> [--port 9222] [--max 12] [--items 3]');
  const target = await loadTarget(targetName);
  if (!target) throw new Error(`unknown target ${targetName}; put targets/${targetName}.json in place`);
  const result = await runTour({
    target,
    port: Number(flag(argv, 'port', '9222')),
    max: Number(flag(argv, 'max', '12')),
    items: Number(flag(argv, 'items', String(tourItemsPerPage))),
    jobsDir: flag(argv, 'jobs', 'jobs'),
    outRoot: flag(argv, 'out', 'docs/apis'),
    workflowsDir: path.join('workflows', siteIdOf(target)),
    log: (m) => process.stdout.write(`  ${m}\n`),
  });
  return result.outcome === 'completed' ? 0 : 4;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
      process.exitCode = 1;
    },
  );
}
