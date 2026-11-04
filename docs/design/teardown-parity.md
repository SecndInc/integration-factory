# Teardown parity: what a hand teardown had that the pipeline lacked

As of 2026-11-03. A person's teardown of the same app (one session, in-page capture, JS bundle mining, probing) was compared with the pipeline's first read-only tour. Endpoint overlap was 51; the teardown had 36 more, nearly all detail routes the tour never opened, plus auth understood rather than listed, write routes and enums from the bundles, and a few schemas where ours collapsed. This section records the four changes that close the gap without probing or writing.

## 1. Detail step in the read-only tour

`scripts/apidocs-readonly-tour.ts` only navigated sidebar links. Lists and detail drawers are where the per-record endpoints live (`/api/job/{id}` and its sub-resources, `/api/proposal/{id}`, `/api/report/{id}`).

After each page step the tour now probes the items that page shows: up to `tourItemsPerPage` (`--items`) of them, as their own `item-N` steps, in this order of preference, and only when the candidate's text and URL miss the deny pattern:

1. same-site links that are deeper than the page's own path, sit inside a list row, or carry one more record id than the page does (a `/jobs/details/{id}` card link on the home page), opened by navigation; the start page's navigation links are never items;
2. otherwise rows and cards (`table tbody tr`, `[role="row"]` outside a header, `[role="listitem"]`, `[class*="card"]`) that show a pointer cursor, contain no form control and have nothing drawn over them, clicked once; if the URL changed the tour goes back, else it presses Escape to close a drawer.

Both are "opening a detail page" under `production-safety.md`. Nothing else is clicked. An item that cannot be opened (click timeout, row gone) is one skipped step, logged `item-N skipped: <reason>`; the tour goes on. When an overlay covers the items (`div.pendo-backdrop-region-right`: an onboarding guide in progress) the tour says so and clicks nothing on that page, because dismissing the guide is a saved preference, a write the person makes by hand. Step names and workflow hints carry the templated path (`/jobs/{jobId}`), never a record id. The tour then reports **writes pages made on their own**: any in-scope non-GET exchange in the trace is printed by method and path, because some pages write on load (a calendar preference, a read done over POST); the person decides whether that page stays in the tour.

## 2. Auth that separates session from trackers

`derive` listed every cookie sent on most requests as auth. On a SaaS app that is 30 analytics cookies around one session cookie and one CSRF token. Now:

- `src/apidocs/noise.ts` holds the one list of tracker cookie prefixes (`_ga`, `_gid`, `_fbp`, `hubspotutk`, `ajs_`, `amplitude_`, `intercom-`, `osano_`, …) and the noise path pattern the review scan already used; the scan imports it.
- `auth.cookies` excludes tracker cookies. The excluded names are kept on the doc as `auth.trackerCookies` so the README can say "also sent, not needed".
- `auth.contextHeaders` lists custom request headers sent on the majority of API requests with a constant value (a tenant id, `x-requested-with`). They are not secrets, but a client that omits them gets 403, so the README and the HTML Auth section show them beside the cookies. Endpoint-level `auth.contextHeaders` mirrors it.

## 3. Schema collapse on word-like keys

`hasDynamicKeys` treated any key that `looksLikeSecret` as data, and a 16-character snake_case key with a digit (`allow_2d_reports`) matched the base64-token shape. The whole object became a map and every sibling key was lost. A key that is word-like (letters, digits, `_` or `-`, starting with a letter, at most 40 characters) is never dynamic. Secret-looking keys that remain are the real tokens-as-keys case.

## 4. Code routes: mining the app's own bundles

`apidocs mine <site>` reads the latest trace, takes the `Script` exchanges on the target host, downloads them without cookies into `jobs/<site>/bundles/`, follows chunk references found inside them (`/build/js/<name>-<hash>.js` style strings, same host), and writes `jobs/<site>/mined.json`. `src/apidocs/mine.ts` is pure: given bundle text it returns API path strings (`/api/...` literals and template literals with `${…}` folded to `{id}`), the HTTP method where the call site shows it, and enums (object literals whose keys are UPPER_SNAKE and values lowercase strings). `build` picks `mined.json` up when present and `derive` adds `code: { routes, enums, bundles }` to the doc. The README and HTML get a "Routes in code, not observed" table that marks which routes the traces also saw, and an "Enums in code" list. `openapi.json` stays observed-only.

State across a network, per `.claude/rules/system-design.md`:

- **Durable record:** `jobs/<site>/bundles/manifest.json` (url, sha256, bytes, fetchedAt, or `failed` with the status). A rerun skips what the manifest holds.
- **Liveness:** the HTTP status of each fetch; nothing is inferred from timing.
- **Retry and cap:** one retry per bundle after a failed status or network error, then the bundle is recorded `failed` and skipped. At most `bundlesMax` bundles and `bundleMaxBytes` each (`limits.ts`); the `Script` list from the trace is the seed and chunk references are followed transitively within the cap.
- **Acknowledgement and replay:** the manifest entry is the ack; mining replays from it, so an interrupted run resumes.
- **Every fetch fails:** `mine` exits 2 with the counts and writes no `mined.json`; `build` then runs without code routes, as before.
- **The number:** `mined: bundles N fetched, F failed, routes R (M with method), enums E`, printed by `mine` and stored in `api.json` `code.bundles` so a drop between runs is visible.
- **Prior art:** this is what the hand teardown did with a regex over the downloaded bundles, and what endpoint finders such as LinkFinder do over scripts.

## 5. Docs that fit: noise listed, examples trimmed, lists capped

The first full run produced a 5.9MB README from 143 endpoints. Three rules in `derive.ts` and the renderers bring it under `readmeMaxBytes`:

- an endpoint whose path matches `noisePathPattern` (`noise.ts`: locale bundles, assets, challenge pages, tracker proxies) is `noise: true`; it keeps its method and path and loses its bodies, and the README and HTML list noise in one "Assets, locale bundles and trackers" section; `coverage.noise` counts them;
- arrays in examples keep `exampleArrayMaxItems` items at every depth (the schema still comes from every item seen), which also cut the personal-looking example values the scan lists from 2437 to 313;
- per endpoint the renderers show `observedInMaxRows` observations and `bindingsMaxRows` bindings, the rest as "and N more".

## Result on the real target, 2026-11-04

Read-only tour over all 18 navigation links with three items per page (36 steps, 27 with exchanges), `mine` over 624 bundles (87 failed), `build`, compared with the teardown's raw files by path:

| | pipeline | teardown | shared |
| --- | --- | --- | --- |
| observed endpoints | 143 | 87 | 82 of the teardown's 87 |
| routes in code | 415 | 392 | 391 |
| routes with a method | 167 | 123 | |
| enums | 269 | 161 | 157 identical value sets |

The five teardown endpoints still unobserved are detail reads behind rows a Pendo guide overlay blocked (proposal, report, measurement queue version, team payments). Scan verdict `needs-review` on 313 personal-looking example values, a person's call.

## Done check

- `npm run typecheck && npm test`.
- On the fixture: the tour takes a detail step on the items page, `mine` extracts the fixture's write routes from its inline script, the README shows "Routes in code" and the Auth section shows no tracker cookies.
- On the real target: a second tour plus `mine` and `build`; the endpoint diff against the teardown shrinks, `auth.cookies` is the session set, and `/api/team` items have properties again.
