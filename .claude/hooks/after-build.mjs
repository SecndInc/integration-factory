// PostToolUse hook for Bash and PowerShell. When the command that just ran was `apidocs build <site>` or
// the read-only tour, run the review gate and hand its summary back as context, so the verdict is in
// front of the agent without a separate step. It never blocks (the tool already ran).
// Design: docs/design/agent-guidance.md §3, §4.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function siteOf(command) {
  const cmd = String(command || '');
  const build = /apidocs(?:-cli(?:\.ts)?)?\s+(?:--\s+)?build\s+(\S+)/.exec(cmd);
  if (build) return build[1];
  const tour = /apidocs-readonly-tour(?:\.ts)?\s+(\S+)/.exec(cmd) ?? /apidocs:tour\s+(?:--\s+)?(\S+)/.exec(cmd);
  if (tour && !tour[1].startsWith('--')) return tour[1];
  return null;
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return 0;
  }
  if (!/^(Bash|PowerShell)$/.test(input.tool_name || '')) return 0;
  const site = siteOf(input.tool_input?.command);
  if (!site || site.endsWith('.json')) return 0;
  const cwd = typeof input.cwd === 'string' && input.cwd ? input.cwd : root;
  const result = spawnSync('npx', ['tsx', 'scripts/apidocs-docs-scan.ts', site], { cwd, encoding: 'utf8', shell: true, timeout: 150_000 });
  const text = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (!text) return 0;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: `Review gate ran after this command (exit ${result.status}). Commit nothing under docs/apis/${site} unless the verdict is pass.\n${text}`,
      },
    }),
  );
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'after-build.mjs') {
  main().then((code) => process.exit(code));
}
