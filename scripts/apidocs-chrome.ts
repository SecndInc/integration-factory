// Start the person's Chrome on a dedicated profile with remote debugging, and optionally wait for them to sign in.
//
//   npx tsx scripts/apidocs-chrome.ts <site> [--port 9222] [--profile jobs/<site>/chrome-profile] [--wait-signin] [--timeout-min 10]
//
// Chrome 136 and later ignore --remote-debugging-port on the default profile, so the profile lives under
// jobs/<site>/ (gitignored, one-day retention does not apply to it: the session stays signed in between runs).
// Nothing here types a credential: the person signs in by hand in the window. With --wait-signin the
// script polls /json until a tab is on the target host and off a login-looking path, then prints
// `signed-in: <url>` and exits 0. Exit 4 means the wait timed out, exit 3 means Chrome was not found.
// Design: docs/design/agent-guidance.md, docs/design/api-docs.md §4.

import { spawn } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { siteIdOf } from '../src/apidocs/drivers/human.js';
import { loadTarget } from '../src/target.js';

const loginPathPattern = /login|sign-?in|signin|auth|sso|mfa|verify/i;

function flag(argv: string[], name: string, fallback: string): string {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1]! : fallback;
}

export function findChrome(): string | undefined {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const candidates: string[] = [];
  if (process.platform === 'win32') {
    for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]) {
      if (base) candidates.push(path.join(base, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  } else {
    for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
      for (const dir of (process.env.PATH ?? '').split(path.delimiter)) candidates.push(path.join(dir, name));
    }
  }
  return candidates.find((c) => existsSync(c));
}

async function version(port: number): Promise<{ webSocketDebuggerUrl: string; Browser?: string } | undefined> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return undefined;
    return (await res.json()) as { webSocketDebuggerUrl: string; Browser?: string };
  } catch {
    return undefined;
  }
}

async function pages(port: number): Promise<{ type: string; url: string }[]> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json`, { signal: AbortSignal.timeout(1500) });
    return ((await res.json()) as { type: string; url: string }[]).filter((p) => p.type === 'page');
  } catch {
    return [];
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const name = argv.find((a) => !a.startsWith('--'));
  if (!name) throw new Error('usage: apidocs-chrome <site> [--port 9222] [--profile <dir>] [--wait-signin] [--timeout-min 10]');
  const target = await loadTarget(name);
  if (!target) throw new Error(`unknown target ${name}; put targets/${name}.json in place first`);
  const site = siteIdOf(target);
  const port = Number(flag(argv, 'port', '9222'));
  const profile = path.resolve(flag(argv, 'profile', path.join('jobs', site, 'chrome-profile')));
  const out = (s: string) => process.stdout.write(`${s}\n`);

  let v = await version(port);
  if (v) {
    out(`chrome already answering on 127.0.0.1:${port} (${v.Browser ?? 'unknown version'}); reusing it`);
  } else {
    const chrome = findChrome();
    if (!chrome) {
      process.stderr.write('chrome not found; set CHROME_PATH to the chrome executable\n');
      return 3;
    }
    await fs.mkdir(profile, { recursive: true });
    const child = spawn(
      chrome,
      [
        `--remote-debugging-port=${port}`,
        '--remote-debugging-address=127.0.0.1',
        `--user-data-dir=${profile}`,
        '--no-first-run',
        '--no-default-browser-check',
        target.startUrl,
      ],
      { detached: true, stdio: 'ignore' },
    );
    child.unref();
    out(`started ${chrome} on profile ${profile}`);
    for (let i = 0; i < 40 && !v; i++) {
      await sleep(500);
      v = await version(port);
    }
    if (!v) {
      process.stderr.write(`chrome did not answer on 127.0.0.1:${port} within 20s\n`);
      return 3;
    }
  }
  out(`cdp: ${v.webSocketDebuggerUrl}`);
  out(`attach: http://127.0.0.1:${port}`);

  if (!argv.includes('--wait-signin')) return 0;
  const deadline = Date.now() + Number(flag(argv, 'timeout-min', '10')) * 60_000;
  out(`waiting for a signed-in tab on ${target.host}; sign in by hand in the Chrome window`);
  while (Date.now() < deadline) {
    for (const p of await pages(port)) {
      let u: URL;
      try {
        u = new URL(p.url);
      } catch {
        continue;
      }
      const onHost = u.hostname === target.host || u.hostname.endsWith(`.${target.host}`);
      if (onHost && !loginPathPattern.test(u.pathname)) {
        out(`signed-in: ${u.origin}${u.pathname}`);
        return 0;
      }
    }
    await sleep(2000);
  }
  process.stderr.write('timed out waiting for sign-in; rerun with --wait-signin once the person is in\n');
  return 4;
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  },
);
