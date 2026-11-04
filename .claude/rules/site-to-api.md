# Site to API: the pipeline

Turning a web app into documented API endpoints is six stages. Each has one command, one output, one done check, and a skill that walks it. `/site-to-api` is the router.

| # | Stage | Command | Output | Done check | Skill |
| --- | --- | --- | --- | --- | --- |
| 1 | Target | `targets/<site>.json`; `npm run apidocs:chrome -- <site> --wait-signin` | a Chrome on `jobs/<site>/chrome-profile`, `signed-in:` printed | `/json/version` answers; a tab is on the host and off `/login` | `/apidocs-target` |
| 2 | Workflows | `workflows/<site>/<id>.json` | one file per workflow, `effect` set | `WorkflowSchema.parse` accepts it; every step has a `do` a person can follow | `/apidocs-workflow` |
| 3 | Record | `npm run apidocs -- record <site> --workflow <file> --attach http://127.0.0.1:9222`, or `npx tsx scripts/apidocs-readonly-tour.ts <site>` | `jobs/<site>/traces/trace-<run>.jsonl` | outcome `completed`; `betweenSteps` under 5% of in-scope exchanges | `/apidocs-record` |
| 4 | Inspect | `npm run apidocs -- inspect <trace> [--step id] [--grep s]` | nothing on disk | the endpoints a step should have produced are in its tally | `/apidocs-record` |
| 5 | Build | `npm run apidocs -- build <site>` | `docs/apis/<site>/{README.md,api.json,index.html,openapi.json}` | Redocly lint has no errors; HTML opens offline | `/apidocs-build` |
| 6 | Review | `npm run apidocs:scan -- <site>` | `docs/apis/<site>/REVIEW.json` | verdict `pass`; then branch, commit, PR with the scan output and a screenshot | `/apidocs-build` |

## Where things live

- `src/apidocs/`: recorder, trace fold, derive, redact, renderers. Limits are named in `src/apidocs/limits.ts`; nothing else holds a magic number.
- `src/apidocs-cli.ts`: `record | inspect | har | build`. Exit codes: 0 ok, 1 usage or unexpected, 2 browser unreachable, 3 trace unreadable, 4 run failed.
- `scripts/apidocs-*.ts`: entry points a person or agent runs (`chrome`, `readonly-tour`, `docs-scan`, `fixture-site`).
- `targets/<site>.json`: `name`, `startUrl`, optional `host`, `environment`.
- `workflows/<site>/`: committed. `jobs/<site>/`: never committed. `docs/apis/<site>/`: committed after review.
- Design: `docs/design/api-docs.md` (pipeline, data shapes, §9 layout), `docs/design/agent-guidance.md` (this package).

## What a first run looks like

A read-only tour of a signed-in SaaS app yields on the order of 100 endpoints, of which a quarter are assets, locale bundles, tracker proxies and a Cloudflare challenge. The scan lists those as noise; they are not a defect of the tour. Expect `GET /api/...` reads and page routes with `{teamId}`-style templating. Zero endpoints or a `failed` outcome means the tab was not signed in or the host filter is wrong.

## Drill offline first

`npx tsx scripts/apidocs-fixture-site.ts` starts a loopback site with the fixture routes (`test/apidocs/fixtures/site.ts`). Point a target with `"environment": "test"` at its URL and run every stage once before touching a real account. The fixture is also what the eval in `docs/design/agent-guidance-rubric.md` uses.
