// SessionStart hook: one screen of orientation for site-to-API work. Lists the targets, the newest trace and
// the review verdict per site, and whether a Chrome is answering on the debugging port. Plain stdout is
// placed at the start of the conversation. Design: docs/design/agent-guidance.md §4.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const port = Number(process.env.APIDOCS_CDP_PORT || 9222);

function newestTrace(site) {
  const dir = path.join(root, 'jobs', site, 'traces');
  if (!existsSync(dir)) return null;
  const names = readdirSync(dir).filter((n) => n.endsWith('.jsonl')).sort();
  return names.at(-1) ?? null;
}

function verdict(site) {
  const file = path.join(root, 'docs', 'apis', site, 'REVIEW.json');
  if (!existsSync(file)) return existsSync(path.join(root, 'docs', 'apis', site)) ? 'built, not scanned' : 'no docs';
  try {
    return JSON.parse(readFileSync(file, 'utf8')).verdict;
  } catch {
    return 'REVIEW.json unreadable';
  }
}

async function chrome() {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) });
    const v = await res.json();
    return `${v.Browser ?? 'chrome'} answering on 127.0.0.1:${port}`;
  } catch {
    return `nothing on 127.0.0.1:${port} (npm run apidocs:chrome -- <site> --wait-signin starts one)`;
  }
}

const targetsDir = path.join(root, 'targets');
const lines = ['site-to-API status (hook: .claude/hooks/session-start.mjs)'];
if (existsSync(targetsDir)) {
  for (const file of readdirSync(targetsDir).filter((n) => n.endsWith('.json')).sort()) {
    let t = {};
    try {
      t = JSON.parse(readFileSync(path.join(targetsDir, file), 'utf8'));
    } catch {
      /* unreadable target; still listed */
    }
    const site = (t.name || file.replace(/\.json$/, '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const env = t.environment || 'production (read-only)';
    lines.push(`  ${site}: ${env}; trace ${newestTrace(site) ?? 'none'}; docs ${verdict(site)}`);
  }
} else {
  lines.push('  no targets/ yet; /apidocs-target creates one');
}
lines.push(`  browser: ${await chrome()}`);
lines.push('  router: /site-to-api; rules: .claude/rules/production-safety.md');
process.stdout.write(lines.join('\n') + '\n');
