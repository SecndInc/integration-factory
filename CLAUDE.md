# integration-factory

Two tracks share this repo. `src/` builds an integration into a target codebase (sandbox, agent, verify, PR; `npm run demo` shows it offline). `src/apidocs/` turns a website into an API: a recorder on the person's own Chrome captures what the app calls while they use it, and derive plus render turn the trace into OpenAPI, Markdown and HTML under `docs/apis/<site>/`.

Start any site-to-API task with `/site-to-api`. The rules in `.claude/rules/` load on their own; `production-safety.md` is the one that matters when a real account is involved.

## Commands

```
npm run typecheck && npm test            the done check for any code change
npm run apidocs -- <record|inspect|har|build> ...
npm run apidocs:chrome -- <site> --wait-signin
npm run apidocs:scan -- <site>
npx tsx scripts/apidocs-fixture-site.ts  offline drill site
```

## Conventions

- TypeScript ESM on Node 22, `node:test` through `tsx`, no test framework. Browser tests use a loopback fixture and a local Chromium; nothing in `test/` reaches the internet.
- Every limit lives in `src/apidocs/limits.ts`. `src/apidocs/cdp.ts` is the only socket; `recorder.ts` the only trace writer; `derive.ts`, `redact.ts` and `render/*` do no I/O (`test/apidocs/boundaries.test.ts` enforces it).
- Target specifics go in `targets/`, workflow specifics in `workflows/`, codebase specifics in profiles. Nothing site-specific in `src/`.
- Design decisions are written down before code: `docs/design/*.md`. A multi-file change gets its section there first.
- A PR that changes rendered output carries the scan output and a screenshot of `index.html`.
