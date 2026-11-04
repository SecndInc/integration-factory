// The read-only tour against the fixture site in a local Chromium: it opens the navigation links, then the
// items each page shows, and clicks nothing that writes. Design: docs/design/teardown-parity.md §1.

import assert from 'node:assert/strict';
import { existsSync, promises as fs } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright';
import { denyPattern, runTour } from '../../scripts/apidocs-readonly-tour.js';
import { targetFromUrl } from '../../src/target.js';
import { startFixtureSite } from './fixtures/site.js';

const chromiumPath = (() => {
  try {
    return chromium.executablePath();
  } catch {
    return '';
  }
})();
const skipBrowser = chromiumPath && existsSync(chromiumPath) ? false : `Chromium is not installed (looked for "${chromiumPath}"); run: npx playwright install chromium`;

function availableLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

test('denyPattern keeps list and detail pages and drops actions', () => {
  for (const ok of ['/items', '/items/1001', '/jobs/123/contacts', 'Items', 'first']) assert.ok(!denyPattern.test(ok), ok);
  for (const no of ['/items/new', '/items/1001/edit', 'Delete', 'Export CSV', '/api/items', 'Add item']) assert.ok(denyPattern.test(no), no);
});

test('the tour opens navigation links, then up to --items items per page, and makes no write', { skip: skipBrowser }, async (t) => {
  const site = await startFixtureSite();
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'apidocs-tour-'));
  const port = await availableLoopbackPort();
  const browser = await chromium.launch({ headless: true, args: [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'] });
  t.after(async () => {
    await browser.close().catch(() => undefined);
    await site.close();
    await fs.rm(dir, { recursive: true, force: true });
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(site.url);

  const lines: string[] = [];
  const target = targetFromUrl('Fixture', `${site.url}/`);
  const result = await runTour({
    target,
    port,
    max: 12,
    items: 2,
    jobsDir: path.join(dir, 'jobs'),
    outRoot: path.join(dir, 'docs'),
    workflowsDir: path.join(dir, 'workflows'),
    log: (m) => lines.push(m),
  });

  assert.equal(result.outcome, 'completed', lines.join('\n'));
  const ids = result.workflow.steps.map((s) => s.id);
  assert.deepEqual(ids.filter((id) => id.startsWith('open')), ['open-start', 'open-3', 'open-6'], 'two navigation links (/items/new is denied, /items/1001 is an item)');
  assert.deepEqual(
    ids.filter((id) => id.startsWith('item')),
    ['item-2', 'item-4', 'item-5', 'item-7', 'item-8'],
    'the record-id link on the start page, two links on /items, two clickable rows on /rows',
  );
  assert.ok(lines.some((l) => /item-8 skipped: locator\.click: Timeout/.test(l)), `the covered cell is skipped, the tour goes on: ${lines.join('\n')}`);
  assert.ok(lines.some((l) => l.startsWith('  an overlay (div) covers items on /rows')), `the covered card is reported: ${lines.join('\n')}`);
  const hints = result.workflow.steps.flatMap((s) => s.hints ?? []);
  assert.ok(hints.some((h) => /^\/items\/\{[a-z]+\}$/i.test(h)), `item hints are templated, got ${hints.join(', ')}`);
  assert.ok(!hints.some((h) => /100\d/.test(h)), 'no record id in the workflow file');

  const templates = result.endpoints.map((ep) => `${ep.method} ${ep.pathTemplate}`);
  assert.ok(templates.includes('GET /api/items'), templates.join(', '));
  assert.ok(templates.some((tpl) => /^GET \/api\/items\/\{/.test(tpl)), `detail endpoint recorded: ${templates.join(', ')}`);
  assert.ok(templates.includes('GET /api/rows'), `the rows page was opened: ${templates.join(', ')}`);
  assert.equal(result.writes.size, 0, `no write: ${[...result.writes.keys()].join(', ')}`);
  assert.ok(lines.some((l) => l.startsWith('writes the pages made on their own: none')));

  const wf = JSON.parse(await fs.readFile(path.join(dir, 'workflows', 'readonly-tour.json'), 'utf8')) as { steps: unknown[] };
  assert.equal(wf.steps.length, 8);
  for (const name of ['README.md', 'api.json', 'index.html', 'openapi.json']) assert.ok(existsSync(path.join(dir, 'docs', 'fixture', name)), name);
});
