// npm run apidocs -- <command> ...
//
//   record  <target> --workflow <file> [--attach <url> | --headed | --browserbase] [--host <h>]... [--hold-bodies] [--jobs <dir>]
//   inspect <trace.jsonl> [--step <id>] [--host <h>] [--grep <s>] [--show <exchangeId>] [--raw]
//   har     <trace.jsonl> [-o <out.har>]
//   build   <target> [--workflows <dir>] [--jobs <dir>] [--out <dir>] [--redact-key <k>]...
//
// Exit codes: 0 ok, 1 unexpected, 2 environment (browser, attach), 3 input (spec, trace), 4 run did not complete.
// `record` prunes traces older than traceRetentionDays before it starts. `build` reads every trace of the site,
// warns (never fails) when a workflow's latest run is not completed, and writes the four outputs atomically.
// `inspect` prints wire headers and cookies redacted unless --raw. Design: docs/design/api-docs.md §9.

import { CaptureError, exitCodeFor } from './apidocs/errors.js';

export interface ParsedArgs {
  command: 'record' | 'inspect' | 'har' | 'build';
  positional: string[];
  flags: Record<string, string | string[] | true>;
}

/** Throws CaptureError('workflow-invalid') on an unknown command or a flag that needs a value without one. */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  void argv;
  throw new Error('not implemented');
}

export async function record(args: ParsedArgs): Promise<number> {
  void args;
  throw new Error('not implemented');
}

export async function inspect(args: ParsedArgs): Promise<number> {
  void args;
  throw new Error('not implemented');
}

export async function har(args: ParsedArgs): Promise<number> {
  void args;
  throw new Error('not implemented');
}

export async function build(args: ParsedArgs): Promise<number> {
  void args;
  throw new Error('not implemented');
}

export async function main(argv: readonly string[]): Promise<number> {
  try {
    const args = parseArgs(argv);
    switch (args.command) {
      case 'record':
        return await record(args);
      case 'inspect':
        return await inspect(args);
      case 'har':
        return await har(args);
      case 'build':
        return await build(args);
    }
  } catch (error) {
    if (error instanceof CaptureError) {
      process.stderr.write(`${error.message}\n${error.fix ? `${error.fix}\n` : ''}`);
      return exitCodeFor(error.code);
    }
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

const invokedDirectly = process.argv[1]?.endsWith('apidocs-cli.ts') || process.argv[1]?.endsWith('apidocs-cli.js');
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
