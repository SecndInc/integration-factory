// Shared by the Bash hooks: split a command the way a shell would, and work out which directory the
// interesting part runs in. A tool call carries the session cwd, but an agent working in a worktree
// writes `cd <dir> && git add ...`, and a gate that judged paths against the session cwd would look at
// the wrong checkout. Design: docs/design/agent-guidance.md §4.

import path from 'node:path';

/** Split a shell command at `&&`, `||`, `;` and newlines that sit outside quotes. */
export function splitSegments(cmd) {
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      cur += ch;
      if (ch === '\\' && quote === '"' && i + 1 < cmd.length) cur += cmd[++i];
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    const two = cmd.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      out.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (ch === ';' || ch === '\n') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function unquote(token) {
  return token.replace(/^(["'])(.*)\1$/, '$2');
}

/** The directory a segment runs in, given the directory the command started in and the segments before it. */
export function cwdAt(segments, index, start) {
  let cwd = start;
  for (let i = 0; i < index; i++) {
    const tokens = segments[i].trim().split(/\s+/);
    if (tokens[0] === 'cd' && tokens[1] && !tokens[1].startsWith('-')) cwd = path.resolve(cwd, unquote(tokens[1]));
    else if (tokens[0] === 'cd' && !tokens[1]) cwd = start;
    else if (tokens[0] === 'pushd' && tokens[1]) cwd = path.resolve(cwd, unquote(tokens[1]));
  }
  return cwd;
}

/** Where the last segment of a command runs. */
export function finalCwd(command, start) {
  const segments = splitSegments(String(command || ''));
  return cwdAt(segments, segments.length, start);
}
