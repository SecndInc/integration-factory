// Browser source, behind an interface — same pattern as model + sandbox. The capture
// runner does not care whether Chromium is local or in the cloud; swap by config.
//
// - LocalBrowserProvider: launches Chromium on this machine (needs `npx playwright
//   install chromium`). Good for dev.
// - BrowserbaseProvider: connects to cloud Chromium over CDP. Gives residential
//   proxies (avoids datacenter-IP flagging on legitimate authenticated sessions) and
//   managed sessions. Same Playwright API downstream.
//
// Neither is for defeating signup/captcha/bot-detection — capture runs on an
// already-authenticated session or public pages only.

import { chromium, type Browser } from 'playwright';
import net from 'node:net';
import { CaptureError } from '../apidocs/errors.js';
import { cdpConnectTimeoutMs as attachProbeTimeoutMs } from '../apidocs/limits.js';
import type { ProxyConfig } from './proxy.js';

export interface BrowserHandle {
  browser: Browser;
  /** Existing Chrome DevTools endpoint used by the read-only visual adviser. */
  cdpUrl?: string;
  dispose: () => Promise<void>;
}

export interface BrowserProvider {
  readonly kind: string;
  connect(): Promise<BrowserHandle>;
}

export class LocalBrowserProvider implements BrowserProvider {
  readonly kind = 'local';
  constructor(
    private readonly headed: boolean,
    private readonly proxy?: ProxyConfig,
    private readonly exposeCdp = false,
  ) {}
  async connect(): Promise<BrowserHandle> {
    if (this.proxy) process.stdout.write(`  local browser via proxy ${this.proxy.server}\n`);
    const debugPort = this.exposeCdp ? await availableLoopbackPort() : undefined;
    const browser = await chromium.launch({
      headless: !this.headed,
      ...(debugPort ? { args: [`--remote-debugging-port=${debugPort}`, '--remote-debugging-address=127.0.0.1'] } : {}),
      ...(this.proxy
        ? { proxy: { server: this.proxy.server, username: this.proxy.username, password: this.proxy.password } }
        : {}),
    });
    return {
      browser,
      ...(debugPort ? { cdpUrl: `http://127.0.0.1:${debugPort}` } : {}),
      dispose: async () => void (await browser.close()),
    };
  }
}

export class BrowserbaseProvider implements BrowserProvider {
  readonly kind = 'browserbase';
  constructor(
    private readonly apiKey: string,
    private readonly projectId: string,
    // Prefer an EXTERNAL residential proxy (e.g. superproxy) — Browserbase stealth +
    // your IP, no paid managed-proxy add-on. Falls back to managed proxies only if
    // BROWSERBASE_PROXIES=true and no external proxy is given (that needs a paid plan).
    private readonly externalProxy?: ProxyConfig,
    private readonly useManagedProxies = (process.env.BROWSERBASE_PROXIES ?? 'false') !== 'false',
  ) {}

  async connect(): Promise<BrowserHandle> {
    const proxies = this.externalProxy
      ? [{ type: 'external', server: this.externalProxy.server, username: this.externalProxy.username, password: this.externalProxy.password }]
      : this.useManagedProxies
        ? true
        : undefined;
    if (this.externalProxy) process.stdout.write(`  browserbase via external proxy ${this.externalProxy.server}\n`);
    const res = await fetch('https://api.browserbase.com/v1/sessions', {
      method: 'POST',
      headers: { 'X-BB-API-Key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: this.projectId, ...(proxies !== undefined ? { proxies } : {}) }),
    });
    if (!res.ok) {
      throw new Error(`browserbase session create failed: ${res.status} ${await res.text()}`);
    }
    const session = (await res.json()) as { id: string; connectUrl: string };
    // Surface where to watch it — the #1 "I can't find my session" fix.
    process.stdout.write(
      `  browserbase session ${session.id}\n  live view: https://www.browserbase.com/sessions/${session.id}\n`,
    );
    const browser = await chromium.connectOverCDP(session.connectUrl);
    return { browser, cdpUrl: session.connectUrl, dispose: async () => void (await browser.close()) };
  }
}

/**
 * A Chrome the person started themselves with --remote-debugging-port (on a copied profile, since
 * Chrome 136 refuses remote debugging on the default one). connectOverCDP gives a driver a page in
 * their profile; dispose disconnects and never closes their browser. Not for defeating bot
 * detection: it is the person's own session, recorded. Design: docs/design/api-docs.md §4, §7.
 */
export class AttachedBrowserProvider implements BrowserProvider {
  readonly kind = 'attached';
  constructor(private readonly cdpUrl: string) {}

  /**
   * `ws://`/`wss://` is returned as is. `http(s)://host:port` is asked for `/json/version` and its
   * `webSocketDebuggerUrl` is returned. Drivers that record without Playwright call this alone.
   */
  static async resolveWebSocketUrl(cdpUrl: string): Promise<string> {
    if (/^wss?:\/\//i.test(cdpUrl)) return cdpUrl;
    let base: URL;
    try {
      base = new URL(cdpUrl);
    } catch {
      throw new CaptureError('browser-unreachable', `not a usable CDP address: ${cdpUrl}`, attachFix);
    }
    if (base.protocol !== 'http:' && base.protocol !== 'https:') {
      throw new CaptureError('browser-unreachable', `not a usable CDP address: ${cdpUrl}`, attachFix);
    }
    const versionUrl = new URL('/json/version', base).toString();
    try {
      const res = await fetch(versionUrl, { signal: AbortSignal.timeout(attachProbeTimeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { webSocketDebuggerUrl?: unknown };
      if (typeof body.webSocketDebuggerUrl !== 'string' || !body.webSocketDebuggerUrl) {
        throw new Error('no webSocketDebuggerUrl in the response');
      }
      return body.webSocketDebuggerUrl;
    } catch (error) {
      throw new CaptureError(
        'browser-unreachable',
        `could not read ${versionUrl}: ${error instanceof Error ? error.message : String(error)}`,
        attachFix,
      );
    }
  }

  /**
   * Returns a Playwright handle on the person's Chrome. `dispose` calls `browser.close()`, which on a
   * connectOverCDP browser clears the contexts Playwright created and disconnects; it does not quit Chrome
   * (types.d.ts, Browser.close: "In case this browser is connected to, clears all created contexts ... and disconnects").
   */
  async connect(): Promise<BrowserHandle> {
    const wsUrl = await AttachedBrowserProvider.resolveWebSocketUrl(this.cdpUrl);
    let browser: Browser;
    try {
      browser = await chromium.connectOverCDP(wsUrl, { timeout: attachProbeTimeoutMs });
    } catch (error) {
      throw new CaptureError(
        'browser-unreachable',
        `could not attach to ${wsUrl}: ${error instanceof Error ? error.message : String(error)}`,
        attachFix,
      );
    }
    return { browser, cdpUrl: wsUrl, dispose: async () => void (await browser.close()) };
  }
}

const attachFix =
  'Start Chrome on a copy of your profile: chrome --remote-debugging-port=9222 --user-data-dir=<a copy of your profile folder>. ' +
  'Chrome 136 and later ignore --remote-debugging-port on the default profile folder, so copy it first. ' +
  'Then pass --attach http://127.0.0.1:9222 (or the ws:// URL from http://127.0.0.1:9222/json/version).';

async function availableLoopbackPort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('could not reserve a local Chrome debugging port'));
        return;
      }
      const port = address.port;
      server.close((error) => error ? reject(error) : resolve(port));
    });
  });
}
