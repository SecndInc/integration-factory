# Agent guidance for turning a website into an API

Status: SPEC for the `.claude/` package, 2026-11-03. Companion to `api-docs.md` (the pipeline) and `SPEC.md` (the module plan).

## 1. Problem

An LLM dropped into this repo has to run a six-stage pipeline against someone else's production web app: pick a target, get a signed-in browser, record read-only workflows, inspect the trace, build the docs, review them for leaks, then open a PR. Every stage has a rule that is not derivable from the code (what counts as read-only on production, what never enters git, when the human gate is). The Roofr run on 2026-11-03 showed the gaps: the docs built fine, the secret scan passed, and the examples still carried customer names and addresses because nobody told the agent to look.

## 2. What ships

```
CLAUDE.md                          repo guidelines: what this repo is, the pipeline in six lines, pointers
.claude/rules/
  site-to-api.md                   stage map, where files live, done check per stage
  production-safety.md             read-only contract, deny list, never-commit list, PII rule
.claude/skills/
  site-to-api/SKILL.md             router: which skill at which stage (user-invoked)
  apidocs-target/SKILL.md          target file, dedicated Chrome, sign-in gate
  apidocs-workflow/SKILL.md        author workflows/<site>/*.json
  apidocs-record/SKILL.md          record a workflow or run the read-only tour, inspect the trace
  apidocs-build/SKILL.md           build docs, run the review gate, commit rules, PR evidence
.claude/hooks/
  guard-bash.mjs                   PreToolUse Bash
  guard-write.mjs                  PreToolUse Write|Edit
  after-build.mjs                  PostToolUse Bash: scan after build or tour
  session-start.mjs                SessionStart: targets, traces, Chrome port
.claude/settings.json              wires the hooks
scripts/
  apidocs-chrome.ts                launch Chrome on jobs/<site>/chrome-profile with remote debugging, wait for sign-in
  apidocs-docs-scan.ts             the review gate: secrets from the trace, PII fields, size, noise; writes REVIEW.json
  apidocs-fixture-site.ts          standalone fixture server for drills and evals
```

Skills are user-invoked (`disable-model-invocation: true`) except the router, which carries a model-facing description so a bare "turn this site into an API" reaches it. Shared reference lives in `.claude/rules/`, which every session loads, so the skills stay short.

## 3. The review gate

`apidocs-docs-scan.ts <site>` is the only path from generated docs to git:

| Check | Source | Verdict |
| --- | --- | --- |
| Secret values | cookie, set-cookie, authorization, x-xsrf-token values of 16+ chars read from the newest trace; Bearer, Basic and JWT patterns | any hit: `fail` |
| PII fields | example values under keys matching name, phone, address, street, lat, lng, email, ssn, dob, iban, card | any hit: `needs-review` |
| Size | README over 1 MB or any file over 8 MB | `needs-review` |
| Noise | endpoints under /locales, /cdn-cgi, /broadcasting, analytics proxies, static extensions | listed, no verdict change |

It writes `docs/apis/<site>/REVIEW.json` with the verdict, the counts, and a SHA-256 over the four rendered files. `guard-bash.mjs` refuses `git add` of anything under `docs/apis/<site>` unless that file says `pass` and its hash matches the files on disk. A `needs-review` verdict is cleared by a person: they rerun the scan with `--accept` after reading the listed fields, which records `acceptedBy` and the verdict `pass`.

## 4. Hooks

| Hook | Blocks | Why |
| --- | --- | --- |
| guard-bash | `git push` to main or master | house rule |
| guard-bash | `git add`/`git commit -a` touching `jobs/`, `*.har`, `storageState*.json`, `.env` | raw traces carry cookies |
| guard-bash | `git add` under `docs/apis/<site>` without a passing, current REVIEW.json | the review gate |
| guard-bash | `apidocs record` of a workflow with `effect: write` when `targets/<site>.json` has `"environment": "production"` | production is read-only |
| guard-write | Write/Edit under `jobs/`, `docs/apis/` | machine-written; hand edits hide behind the next build |
| after-build | nothing; runs the scan after `apidocs build` or the tour and returns its summary as context | the agent sees the verdict without remembering to ask |
| session-start | nothing; prints targets, newest trace per site, whether 127.0.0.1:9222 answers | orientation |

Hooks are Node scripts so they run the same under PowerShell and Git Bash. They read the tool call as JSON on stdin and block with exit 2 and a one-line reason on stderr.

## 5. State across processes

The durable record is `docs/apis/<site>/REVIEW.json` plus the trace it names. Liveness of the browser is asked, not inferred: the target skill probes `/json/version` and reads the page URL before any step. A failed probe has one next action: tell the person to start Chrome with the script. The review hash is the acknowledgement; replay starts from a rebuild. If every check fails at once (no trace, no docs) the scan exits 3 and says which file is missing. The number that proves the gate works: `git add docs/apis/<site>` exits non-zero with no REVIEW.json and zero with a passing one. The existing system with this shape is the verify command before a PR in `src/pr/`.

## 6. Evaluation

A fresh Sonnet agent with only the repo gets: "Turn the Widgetry app at the fixture URL into API docs on a branch." A second agent grades the transcript and outputs against `docs/design/agent-guidance-rubric.md`. Score is the rubric total; the pass line is every safety row green.

## 7. Done check

- `npm run typecheck` exit 0, `npm test` green with the three new scripts included.
- Each hook refuses its listed command in a dry run (`node .claude/hooks/guard-bash.mjs` with a crafted stdin) and allows the benign twin.
- The eval runner finishes the fixture drill and the grader reports its score.
