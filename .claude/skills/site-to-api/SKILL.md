---
name: site-to-api
description: Turn a website or web app into documented API endpoints (OpenAPI, Markdown, HTML) by recording what the app calls from a signed-in browser. Use this whenever the user wants to discover, reverse-engineer, document or "turn into an API" a SaaS app's private endpoints, run the apidocs recorder end to end on a real site, record workflows against a web app, or asks which endpoints an app uses, even when they never say "API docs". It routes to the stage skills.
---

# Site to API

The app's own front end already knows every endpoint. The pipeline records those calls while a person, or a read-only tour, uses the app in their own Chrome, then derives endpoints, schemas, auth and bindings from the trace and renders the docs. The stage map with commands and done checks is in `.claude/rules/site-to-api.md`; this skill decides what to do next.

## Settle two facts before any command

1. **Is the target production?** It is unless `targets/<site>.json` says `"environment": "staging"`, `"test"` or `"sandbox"`. Production means navigation only: no form, no button that creates, sends, deletes or exports. `.claude/rules/production-safety.md` is the contract and the hooks enforce the parts that can be enforced.
2. **Who signs in?** A person, in the Chrome that `/apidocs-target` starts. Wait for `signed-in:`; a tab on `/login` means wait.

Say both facts back in one line before starting. A user who says "production" and "read-only" has answered the first; a user who says nothing gets the production default.

## Route by stage

| You have | Next | Skill |
| --- | --- | --- |
| nothing, or only a URL | write the target, start Chrome, wait for sign-in | `/apidocs-target` |
| a signed-in Chrome and no workflow | run the read-only tour, or author a workflow for a specific goal | `/apidocs-record` or `/apidocs-workflow` |
| a workflow file | record it, then inspect the trace | `/apidocs-record` |
| a trace with outcome `completed` | build the docs, run the review gate | `/apidocs-build` |
| docs with a `pass` verdict | branch, commit `workflows/` and `docs/apis/<site>`, open the PR with evidence | `/apidocs-build` |
| a `needs-review` or `fail` verdict | stop; a person reads the listed fields, or redaction in `src/apidocs/derive.ts` changes | `/apidocs-build` |

First time on this machine: drill the whole pipeline against the fixture (`npm run apidocs:fixture`, target with `"environment": "test"`) before the real account, so the only new variable on the real run is the site.

## What the final report contains

- The planned URLs or steps, and the outcome and counts the recorder printed.
- The endpoint list by method and path template, with noise (locales, trackers, challenge pages) called out as noise.
- The scan verdict verbatim, and the screenshot path.
- What was left out and why: skipped links, evicted bodies, lint errors.
- Example values stay out: refer to a field by key path.
