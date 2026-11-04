// PreToolUse hook for Write, Edit and NotebookEdit. jobs/ holds machine-written traces and a Chrome
// profile; docs/apis/ holds rendered output that the next build overwrites. A hand edit in either place
// is lost or, worse, hides a leak until the rebuild. Exit 2 with the reason refuses the call.
// Design: docs/design/agent-guidance.md §4.

import path from 'node:path';

const projectRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();

export function check(filePath, root = projectRoot) {
  if (!filePath) return null;
  const rel = path.relative(root, path.resolve(root, String(filePath))).replace(/\\/g, '/');
  if (rel.startsWith('..')) return null;
  if (/^jobs(\/|$)/.test(rel)) return `${rel} is under jobs/, which only the recorder and the Chrome profile write`;
  if (/^docs\/apis(\/|$)/.test(rel)) return `${rel} is generated; change src/apidocs and run \`npm run apidocs -- build <site>\` instead`;
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
  const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  const problem = check(target, typeof input.cwd === 'string' && input.cwd ? input.cwd : projectRoot);
  if (problem) {
    process.stderr.write(`blocked: ${problem}\n`);
    return 2;
  }
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'guard-write.mjs') {
  main().then((code) => process.exit(code));
}
