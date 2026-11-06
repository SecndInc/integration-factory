// How the snapshot reaches the account: GETs issued from inside the signed-in tab, so cookies, TLS and the
// anti-bot layer see the real browser and the agent never reads a credential.
//
// Playwright attaches to a Chrome the person started and signed in (connectOverCDP). One tab per origin name is chosen
// by host; the fetcher never opens a tab and never navigates, with one exception: `pageResponseValue` reloads that
// origin's tab so the page itself makes the request that carries a token, and the fetcher only listens. Values read
// through cookie / pageResponseValue / storageValue stay in memory: they are returned to the caller and never logged or
// written. There is no method parameter anywhere: in-page requests are GET.
// Design: docs/design/snapshot.md.

import { chromium, type Browser, type Page } from 'playwright';
import { CaptureError } from '../errors.js';
import { snapshotBodyMaxBytes, snapshotRequestTimeoutMs } from '../limits.js';
import { jsonPath } from './plan.js';
import type { SnapshotPlan } from './types.js';

export interface FetchRequest {
  originName: string;
  url: string;
  headers: Record<string, string>;
}

export interface FetchResult {
  status: number;
  /** The URL after redirects. */
  url: string;
  contentType: string;
  /** The body; absent when it was over the cap (`tooLarge`) or the request failed (`error`). */
  text?: string;
  /** Characters seen when the body was over the cap. */
  tooLarge?: number;
  retryAfter?: string;
  /** A network error, abort or navigation that destroyed the page; `status` is 0. */
  error?: string;
}

export interface Fetcher {
  fetch(req: FetchRequest): Promise<FetchResult>;
  /** `document.cookie` value on that origin's tab (HttpOnly cookies are not visible). Raw, not decoded. */
  cookie(originName: string, name: string): Promise<string | undefined>;
  /**
   * Reload the origin's tab and return the value at `path` in the first JSON response whose URL matches `urlPattern`.
   * The matched body is cached per (origin, pattern): a second call for the same response does not reload again.
   */
  pageResponseValue(originName: string, urlPattern: RegExp, path: string): Promise<string | undefined>;
  storageValue(originName: string, area: 'local' | 'session', keyPattern: RegExp): Promise<string | undefined>;
  /** Names only. */
  storageKeys(originName: string): Promise<{ local: string[]; session: string[] }>;
  alive(): boolean;
  /** Disconnect. Never closes the person's browser. */
  close(): Promise<void>;
}

/**
 * The function run in the page, as source (a string, so no bundler helper such as `__name` leaks into the browser).
 * The method is the literal GET.
 */
const inPageFetch = `async (a) => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), a.timeoutMs);
  try {
    const r = await fetch(a.url, { method: 'GET', credentials: 'include', headers: a.headers, signal: ctl.signal, redirect: 'follow' });
    const text = await r.text();
    const contentType = r.headers.get('content-type') || '';
    const retryAfter = r.headers.get('retry-after') || undefined;
    if (text.length > a.maxBytes) return { status: r.status, url: r.url, contentType, tooLarge: text.length, retryAfter };
    return { status: r.status, url: r.url, contentType, text, retryAfter };
  } catch (e) {
    return { status: 0, url: a.url, contentType: '', error: String(e && e.message ? e.message : e) };
  } finally {
    clearTimeout(timer);
  }
}`;

const inPageCookie = `(name) => {
  for (const part of document.cookie.split('; ')) {
    const eq = part.indexOf('=');
    if (eq > 0 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return undefined;
}`;

const inPageStorageValue = `(a) => {
  const store = a.area === 'local' ? window.localStorage : window.sessionStorage;
  const re = new RegExp(a.source, a.flags);
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i);
    if (key !== null && re.test(key)) return store.getItem(key) === null ? undefined : store.getItem(key);
  }
  return undefined;
}`;

const inPageStorageKeys = `() => {
  const names = (s) => { const out = []; for (let i = 0; i < s.length; i += 1) out.push(s.key(i)); return out; };
  return { local: names(window.localStorage), session: names(window.sessionStorage) };
}`;

const call = (source: string, arg?: unknown): string => `(${source})(${arg === undefined ? '' : JSON.stringify(arg)})`;

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

export interface AttachOptions {
  /** Origin names that need a tab (default: every origin of the plan). */
  origins?: string[];
  /** Characters over which a body is reported `tooLarge` (default `snapshotBodyMaxBytes`). */
  maxBytes?: number;
  timeoutMs?: number;
}

export class PageFetcher implements Fetcher {
  private readonly captured = new Map<string, Promise<unknown | undefined>>();

  private constructor(
    private readonly browser: Browser,
    private readonly pages: Map<string, Page>,
    private readonly maxBytes: number,
    private readonly timeoutMs: number,
  ) {}

  static async attach(cdpHttpUrl: string, plan: SnapshotPlan, opts: AttachOptions = {}): Promise<PageFetcher> {
    let parsed: URL;
    try {
      parsed = new URL(cdpHttpUrl);
    } catch {
      throw new CaptureError('browser-unreachable', `--attach "${cdpHttpUrl}" is not a URL`, 'Pass the Chrome debugging address, e.g. http://127.0.0.1:9222.');
    }
    if (!loopbackHosts.has(parsed.hostname)) {
      throw new CaptureError('browser-unreachable', `--attach ${parsed.hostname} is not a local address`, 'The snapshot attaches only to a Chrome on this machine (127.0.0.1).');
    }
    let browser: Browser;
    try {
      browser = await chromium.connectOverCDP(cdpHttpUrl);
    } catch (error) {
      throw new CaptureError('browser-unreachable', `cannot attach to ${cdpHttpUrl}: ${(error as Error).message}`, 'Start the signed-in Chrome with `npm run apidocs:chrome -- <site> --wait-signin` and pass its address.');
    }
    const context = browser.contexts()[0];
    if (!context) {
      await browser.close().catch(() => undefined);
      throw new CaptureError('attach-failed', 'the attached Chrome has no browser context', 'Open a window in that Chrome and rerun.');
    }
    const pages = new Map<string, Page>();
    for (const name of opts.origins ?? Object.keys(plan.origins)) {
      const origin = plan.origins[name];
      if (!origin) {
        await browser.close().catch(() => undefined);
        throw new CaptureError('plan-invalid', `unknown origin "${name}"`);
      }
      const wanted = plan.tabFor[name] ?? new URL(origin).hostname;
      const page = context.pages().find((p) => hostnameOf(p.url()).includes(wanted));
      if (!page) {
        await browser.close().catch(() => undefined);
        throw new CaptureError('attach-failed', `no tab for origin "${name}" (host containing "${wanted}")`, `Open ${origin} in the signed-in Chrome and rerun.`);
      }
      pages.set(name, page);
    }
    return new PageFetcher(browser, pages, opts.maxBytes ?? snapshotBodyMaxBytes, opts.timeoutMs ?? snapshotRequestTimeoutMs);
  }

  private pageFor(originName: string): Page {
    const page = this.pages.get(originName);
    if (!page) throw new CaptureError('attach-failed', `origin "${originName}" has no tab`, 'Open it in the signed-in Chrome and rerun.');
    return page;
  }

  async fetch(req: FetchRequest): Promise<FetchResult> {
    const page = this.pageFor(req.originName);
    try {
      return (await page.evaluate(call(inPageFetch, { url: req.url, headers: req.headers, timeoutMs: this.timeoutMs, maxBytes: this.maxBytes }))) as FetchResult;
    } catch (error) {
      // The tab navigated or closed under the request: a retryable network-class failure.
      return { status: 0, url: req.url, contentType: '', error: (error as Error).message.split('\n')[0] ?? 'evaluate failed' };
    }
  }

  async cookie(originName: string, name: string): Promise<string | undefined> {
    const v = (await this.pageFor(originName).evaluate(call(inPageCookie, name))) as string | undefined;
    return v === null ? undefined : v;
  }

  async pageResponseValue(originName: string, urlPattern: RegExp, path: string): Promise<string | undefined> {
    const body = await this.capturedBody(originName, urlPattern);
    if (body === undefined) return undefined;
    const v = jsonPath(body, path)[0];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : undefined;
  }

  /**
   * The JSON body of the first response on the origin's tab whose URL matches, captured while the tab reloads. The body
   * is cached in memory per (origin, pattern), so several values read from one response (a token and an id) cost one
   * reload. A miss is not cached. The body is account data: it never leaves this object except as a path lookup.
   */
  private capturedBody(originName: string, urlPattern: RegExp): Promise<unknown | undefined> {
    const key = `${originName}\u0000${urlPattern.source}\u0000${urlPattern.flags}`;
    let p = this.captured.get(key);
    if (!p) {
      p = this.reloadAndCapture(originName, urlPattern);
      this.captured.set(key, p);
      void p.then((body) => {
        if (body === undefined && this.captured.get(key) === p) this.captured.delete(key);
      });
    }
    return p;
  }

  private async reloadAndCapture(originName: string, urlPattern: RegExp): Promise<unknown | undefined> {
    const page = this.pageFor(originName);
    let found: { body: unknown } | undefined;
    let wake: () => void = () => undefined;
    const arrived = new Promise<void>((resolve) => {
      wake = resolve;
    });
    const onResponse = async (response: { url(): string; json(): Promise<unknown> }): Promise<void> => {
      if (found !== undefined || !urlPattern.test(response.url())) return;
      try {
        const body = await response.json();
        if (found === undefined) {
          found = { body };
          wake();
        }
      } catch {
        // Not JSON or body gone: keep listening.
      }
    };
    page.on('response', onResponse);
    let timer: NodeJS.Timeout | undefined;
    try {
      // A reload is a navigation: the page re-issues its own requests; the snapshot sends none of them.
      await page.reload({ waitUntil: 'domcontentloaded', timeout: this.timeoutMs }).catch(() => undefined);
      await Promise.race([
        arrived,
        new Promise<void>((resolve) => {
          timer = setTimeout(resolve, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
      page.off('response', onResponse);
    }
    return found?.body;
  }

  async storageValue(originName: string, area: 'local' | 'session', keyPattern: RegExp): Promise<string | undefined> {
    const v = (await this.pageFor(originName).evaluate(call(inPageStorageValue, { area, source: keyPattern.source, flags: keyPattern.flags }))) as string | null | undefined;
    return v ?? undefined;
  }

  async storageKeys(originName: string): Promise<{ local: string[]; session: string[] }> {
    return (await this.pageFor(originName).evaluate(call(inPageStorageKeys))) as { local: string[]; session: string[] };
  }

  alive(): boolean {
    return this.browser.isConnected();
  }

  async close(): Promise<void> {
    // For a browser from connectOverCDP, Playwright's close() ends the connection and leaves the Chrome process and its
    // windows running (the runner test checks this); it never kills the person's browser.
    await this.browser.close().catch(() => undefined);
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
