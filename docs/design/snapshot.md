# Snapshot: a consented one-shot read of a production account

## Purpose

The site-to-API runs document which read endpoints an account exposes. `apidocs snapshot` walks those documented GET endpoints once, through the Chrome the person already signed in to, and writes every response to a resumable local record under `jobs/<site>/snapshots/<run_id>/`. A separate loader (`npm run snapshot:load`, designed in `docs/design/snapshot-landing.md`) lands that record in a restricted BigQuery dataset so the account owner's data can be cleaned and transformed there.

It exists only because the account owner consented. The consent is recorded on the target (`snapshotConsent` in `targets/<site>.json`: who, ISO date, optional ISO expiry, scope `read`), and the CLI refuses a production target without a valid one (`consentValid` in `src/target.ts`; `--dry-run` is exempt because it sends nothing). Production safety stays in force: GETs only, the person signs in, nothing under `jobs/` is staged, example values are referred to by key path. The plan schema accepts only `GET`; no POST is ever sent, including the requests a page makes to obtain its own token.

Code is split pure and I/O. `src/apidocs/snapshot/types.ts` and `plan.ts` are pure (schemas, URL building, paginator state machines, response classification, ordering, dry-run text). The store, the in-page fetcher and the runner are separate modules and separate slices.

## SPEC

1. **Durable record.** `jobs/<site>/snapshots/<run_id>/` holds one NDJSON file per endpoint (`<endpoint_id>.ndjson`), `failures.ndjson`, `progress.json` and `manifest.json`. All of it is under `jobs/`, never committed. NDJSON lines are appended through an `fs.open` handle and fsynced per page; `progress.json` and `manifest.json` are written atomically (temp file, rename).
2. **Liveness is asked.** A probe GET per origin (path from `plan.probe`) runs at start, every `snapshotProbeEveryRequests` requests, after any 401/403 or redirect, and at the end. A probe answer that is not 2xx JSON on the API origin, or whose final URL matches a login path, means the session is dead: the run aborts with `session-expired` (exit 4) and prints "sign in again, then rerun with --resume <run_id>". The agent never retries sign-in. `browser.isConnected()` is checked before each page.

   A probe carries the headers the origin's endpoints send, except one read from a snapshot endpoint's response (`fromResponse`), which may not exist yet; a header that cannot be resolved is left off. A page-captured or storage header is sent: every ypapi endpoint, the probe included, needs the token the portal page obtains for itself. So a probe path must be documented without a `fromResponse` header: the Roofr probe is `GET /api/user/me`, whose documented `headers[]` have no `team-id` (that one comes from `user/me`'s own `$.user.current_team.id`). A probe must also fail when signed out: the YP Metrics probe is `GET /server/api/nav/app`, because `session/initUser` answers 200 with an expired SAML session (found by the first smoke run, 2026-11-06). The ypapi probe is `GET /bc/v1/app-services/maintenance` with the page-captured token. A cookie read at start that does not exist yet is asked again by the first endpoint that needs it.
3. **Retry, then a different action.** 429, 5xx, network error and timeout are retried up to `snapshotRetryMax` times (retries, not attempts: the first try plus `snapshotRetryMax` retries is at most `1 + snapshotRetryMax` requests, and `retries` in the number counts the retries), with backoff from `snapshotBackoffBaseMs` doubling to `snapshotBackoffMaxMs`, `Retry-After` honoured. Other 4xx do not retry. After the cap, a row goes to `failures.ndjson` and the endpoint is marked `partial` (a page paginator skips that page and continues; a cursor paginator stops that endpoint); the run continues. `snapshotConsecutiveFailuresMax` consecutive failures abort the run. The run never falls back to another credential, host or method.
4. **Acknowledgement and replay.** The ack is the `progress.json` entry (`acked` page keys) written after the page's NDJSON lines are fsynced. `--resume <run_id>` skips acked pages and refetches the first un-acked one. A crash between fsync and ack leaves at most one duplicate page per endpoint; `page_key` is deterministic, so the loader dedupes on `(endpoint_id, page_key, record_index)`.
5. **Every client fails in the same second.** One browser, one run. Probe fails at start: manifest `aborted`, exit 4, nothing written. Chrome dies mid-run: `--resume` converges from the last ack. A rerun without `--resume` is a new run id and never touches the old directory. The loader loads only `complete` runs unless `--allow-partial`.

   A Laravel series ends on a present, null `links.next` (meta) or `next_page_url` (flat), on `last_page`, or on an empty page; a page whose first record repeats the previous page's first record means the server ignored the page parameter, which is a failure row `page param ignored` (the repeated page is not written) and the endpoint is `partial`, never a loop.
6. **The number.** Printed at the end and stored in `manifest.json`: `endpoints planned P / complete C / partial X / failed F; requests R (retries K, 429s J); rows N; bytes B; totals matched T of T'; probe alive at end`. Pass: `C == P`, `F == 0`, `T == T'`, probe alive. `totals matched` (rows against a stated total such as `meta.total` or `iTotalRecords`) proves completeness. Each endpoint's contribution lives in `progress.json` (`totals: { stated, matched }`) and restarts from zero whenever the endpoint runs again, so a resume (which recounts acked series from the stored first page, or from a replayed body) counts every series exactly once; `429s` says the politeness floor is wrong. The loader repeats the count comparison in SQL and writes `load-report.json`. The metric ships in the same slice as the mechanism.
7. **Prior art.** `apidocs mine`'s manifest (one ack per unit, a rerun skips what is acked), Singer/Airbyte stream bookmarks (`progress.json` is one bookmark per endpoint), and the Laravel paginator and DataTables server protocols for the page shapes.

## Plan file: `snapshots/<site>.json`

Committed, no account values, parsed by `SnapshotPlanSchema` (`src/apidocs/snapshot/types.ts`) and cross-checked by `validatePlan` (`plan.ts`).

```ts
type HeaderRule =
  | { literal: string }
  | { fromCookie: string; origin: string; decode?: 'uri'; prefix?: string }                       // document.cookie on that origin's tab
  | { fromResponse: { endpoint: string; path: string }; prefix?: string }                         // from an earlier snapshot endpoint's response
  | { fromPageResponse: { origin: string; urlPattern: string; path: string }; prefix?: string }   // captured from the page's own traffic while the tab reloads; the snapshot never sends that request
  | { fromStorage: { origin: string; area: 'local' | 'session'; keyPattern: string }; prefix?: string };
// `plan.headers` keys are HTTP header names and must be lowercase (letters, digits, hyphens); the schema rejects others.
// `plan.values` takes the same rule kinds, under plain names, for query parameters.
// `prefix` is literal text put before the resolved value, e.g. "Bearer " when the page stores a bare token but sends
// `Authorization: Bearer <token>`. Found by the 2026-11-06 YP smoke: the ypapi token sent bare answered 403, with
// "Bearer " 200. The prefix is plan text, not a value; a value that already starts with it is sent unchanged.
type Paginator =
  | { kind: 'none' }
  | { kind: 'laravel-meta'; pageParam; perPageParam?; perPage? }   // $.meta.current_page / last_page / total
  | { kind: 'laravel-flat'; pageParam; perPageParam?; perPage? }   // $.current_page / last_page / total / data
  | { kind: 'cursor'; cursorParam; nextPath; perPageParam?; perPage? }
  | { kind: 'datatables'; pageParam; length?; totalPath; recordsPath };
type QueryValue = string | number | boolean | { fromId: string } | { fromRange: 'start' | 'end' | 'pipe' } | { computed: 'uuid' } | { fromValue: string };
type RangeFormat =
  | 'iso-date'          // 2026-01-01
  | 'iso-datetime'      // 2026-01-01T00:00:00 / 2026-01-31T23:59:59
  | 'sql-datetime'      // 2026-01-01 00:00:00 / 2026-01-31 23:59:59 (Roofr calendar: the T form answered 422 on 2026-11-06)
  | 'daterange-pipe';   // 2026-01-01|2026-01-31
```

An `EndpointPlan` has `id` (slug, unique, the NDJSON file name and BigQuery `endpoint_id`), optional `docId` (the id in `docs/apis/<site>/api.json`), `origin`, `method: 'GET'`, `path` (may contain `{param}`), `query`, `pathParams`, `headers` (names from `plan.headers`), `paginator`, `records`, `total`, `range`, `group`, `perId` (`core` or `full`; core is a subset of full), `expect404`, `skip`, `yields` (id name to JSON path) and `dependsOn`. The plan has `planVersion: 1`, `site`, `origins`, `tabFor`, `loginPaths`, `probe` (one per origin used), `headers`, optional `values`, `ids`, optional `widgetRules` and `endpoints`.

### Named values (`values`, `{ fromValue }`)

Some request parameters are account data that only the signed-in page knows (the YP account endpoint takes a user id in `search`, the same response that carries the `authorization` token). `values` maps a name to a header rule (literal, cookie, response, page response, storage); an endpoint query entry `{ fromValue: name }` takes it. The runner resolves it lazily, once per run (cached, like a header), after the endpoint's ids; a value that cannot be resolved fails only the endpoints that use it, with a failure row. A value is never logged, and never written to disk except inside the request `url` that the row for that request records (the same exposure as a path id); it is not part of `page_key`, the manifest or `progress.json`. One page reload serves every rule that reads the same `(origin, urlPattern)`: the fetcher keeps the captured response body in memory, so the token header and a value read from the same response cost one reload.

### Widget rules (`widgetRules`)

Data-driven dashboards: each dashboard id (from `ids[dashIdsFrom]`) is fetched by a plan endpoint, and the widgets in that body become requests to the widget-data endpoint, one series per widget and month window. Where things sit in the dashboard body is fixed in code (`$.data.page.widget_ids[]`, definitions at `$.data.page.layouts.<layout>.widgets.<id>`). Everything else is config:

```ts
type WidgetRules = {
  dashIdsFrom: string;                                  // an id name in plan.ids
  endpointTemplate: { widget: string; service?: string; category?: string };
  serviceIdPath?: string; categoryIdPath?: string;       // definition-relative; set only to opt in to a route
  widgetIdParam: string; pageIdParam: string;           // query params that carry the widget id and the dashboard id
  literals: Record<string, string>;                      // fixed pairs
  queryFromWidget?: Record<param, { path: string; join?: string }>;  // path relative to the widget definition
};
```

Every widget goes to `endpointTemplate.widget`. The `service` / `category` routes are optional: they are used for a widget only when the template names the endpoint, the matching `…IdPath` is set and finds a value in that definition (then `serviceId` / `categoryId` join the ids). A query is built as `literals`, then each `queryFromWidget` entry whose path finds a value (an array of strings is joined with `join`, otherwise the first scalar; no value leaves the parameter out), then `widgetIdParam` = widget id and `pageIdParam` = dashboard id, which always win. The YP plan fills `queryFromWidget` from the recorded `bindings[]` of the service data routes: `widget_type` from `$.type`, `fields` and `groupby` from `$.metadata.data_columns.selected[].field` / `grouped[].field` (joined with a comma), `filter_set_id` from `$.metadata.filter_set_id`, `timegrouping` from `$.metadata.time_grouping`; `widget_request` and `widget_page_id` are the two id params.

The schema rejects non-GET methods, duplicate or non-slug ids, unknown origin names, header names not in `plan.headers`, `fromId` names not in `plan.ids`, and a missing probe for any origin used. `validatePlan` also requires every `docId` to exist in the api doc when one is passed.

## On-disk layout and row contract

```
jobs/<site>/snapshots/<run_id>/
  <endpoint_id>.ndjson     SnapshotRow lines
  failures.ndjson          FailureRow lines
  progress.json            ProgressSchema
  manifest.json            ManifestSchema
```

`SnapshotRow` (one NDJSON line): `run_id, site, endpoint_id, method, path_template, url, fetched_at (ISO), status (int), page_key, record_index (int), payload (string), payload_sha256 (hex sha256 of the payload's UTF-8 bytes)`. `record_index = -1` is the envelope line whose payload is the raw response text verbatim; `0..n-1` are `JSON.stringify` of each extracted record; a body with no `records` path is one record at index 0.

`FailureRow`: the same keys minus `payload`, with `record_index` and `payload_sha256` null, plus `error`.

`progress.json`: `progressVersion 1`, `runId`, per endpoint `status` (`pending|running|complete|partial|failed|skipped|expected-404`), `acked` page keys, `rows`, optional `total` and `cursor`, plus `ids` (id name to values yielded so far).

`manifest.json`: `manifestVersion 1`, `runId`, `site`, `planSha256`, `startedAt`, `finishedAt?`, `status` (`running|complete|partial|aborted`), `reason?`, `counts` (`endpointsPlanned, complete, partial, failed, skipped, requests, retries, http429, rows, bytes, totalsMatched, totalsStated, probeAliveAtEnd`) and per-endpoint `state, rows, bytes, pages, total?`.

## `--only` and `--group`: silent parents

A selected child whose ids come from an unselected endpoint pulls that parent in as a silent prerequisite: the parent is fetched anyway (every page, so the ids are complete up to `--max-ids`), its ids are recorded in `progress.json`, and none of its rows are written, so the `<parent>.ndjson` file does not exist and the parent is not in the manifest's `endpointsPlanned`. The same holds for an unselected `fromResponse` source of a header or value (first page only, body kept in memory). Silent fetches count as requests and are probed like any other. `--ids-from <file>` supplies the ids instead and the parent is not fetched at all. `--dry-run` lists silent parents under "also fetched, not written". A `skip` endpoint is never pulled in.

## Guesses the smoke run must confirm

The plan files hold these as best readings of the recorded docs, not as facts. The one-request smoke (`--only <probe>`, then `--group account`) and the first full-group pass confirm or refute each; a refuted guess is a plan edit, not a code change.

- Cursor paginators send the cursor back in a parameter named `cursor` (the docs show the response field, not the request name).
- Roofr honours `per_page` on its lists (the docs show `page`; `per_page` is assumed).
- Roofr's material-order list (`pageNumber` / `perPage`, not `page` / `per_page`) numbers pages from 1 and ends by `links.next`, `last_page` or an empty page like the other lists.
- YP's `service-cgnad` view returns its rows without the `filter_set_id` the docs show bound from widget metadata (the plan sends none); the series total, if the response states one, is the check.
- The YP widget-data route accepts `daterange` (month window, `start|end`) and the `fields`, `groupby`, `filter_set_id` and `timegrouping` parameters bound from the widget definition. The recorded widget-data calls show only a subset of them; the service routes show the rest.
- The YP `authenticate` response carries `$.data.uid` and `$.data.securityToken`, and the page makes that request again on a reload (the snapshot never sends it).
- The YP `authorization` header is the raw token, with no scheme prefix.

## Request budget

Concurrency 2, 350 ms floor, about 3.5 requests per second.

| Run | Requests | Time |
| --- | --- | --- |
| Roofr `--per-id core` (7 per-job endpoints x ~1,770 jobs, contacts, invoices, lists, account) | ~16k | ~75 min |
| Roofr `--per-id full` (14 per-job endpoints) | ~28k | ~2.3 h |
| YP (account, DataTables lists, dashboards, widgets x 24 months, 9 service views x services x 24, leads x 24, ypapi) | ~7.5k | ~40 min |

Default is `core`; `full` is opt-in. Runs go outside the account's business hours. Every ceiling is a named limit in `src/apidocs/limits.ts` (`snapshotPagesMax`, `snapshotIdsMax`, `snapshotRequestsMax`).

## Operating procedure

1. The person runs `! gcloud auth login`, then `gcloud config get-value project`. The agent says the id back and the person confirms before anything is created. The project id, bucket name and reader emails live only in the untracked `.env` (keys in `.env.example`); they never appear in the repo, a PR or chat. `delete_after` may stay empty until the engagement end is known.
2. Add `snapshotConsent { by, on, scope: "read" }` to the production targets.
3. `npm run apidocs -- snapshot <site> --attach http://127.0.0.1:<port> --dry-run`: the plan, discovered id counts, estimated requests. Sanity-check the counts against what the app shows.
4. One-request smoke `--only <probe>`, then `--group account`, then the full run with `--per-id core`, outside business hours. A sign-in prompt pauses the run; the person signs in; rerun with `--resume <run_id>`. Read `totals matched T of T'` and `429s`.
5. Create the bucket and datasets (commands in `snapshot-landing.md`), then `npm run snapshot:load -- <site> --dry-run`, then the real load. Read the comparison table and `load-report.json`.
6. Dataset ACL and `jobUser` for the named readers; review the inherited-role audit the preflight printed.
7. Confirm the bucket prefix is gone; record date, site, run_id, dataset and verdict in a run log (no project id, no values).
8. Branch, never main: commit `snapshots/*.json`, views SQL, code, docs, tests. `git status` shows nothing under `jobs/` and no `.env`. The PR carries the dry-run plan output and the load report's count table.

## Open decisions

- Deletion date (`delete_after`) and who deletes the datasets and bucket; empty until the engagement end is known.
- Project-level inherited readers (default service accounts, project viewers and editors): accept, trim, or move to a dedicated project; decided from the preflight audit.
- `--allow-partial` when a per-job detail endpoint is missing for some jobs: fail or accept with the misses listed. Default in code: fail.
- Whether `url` is loaded as-is or with query strings stripped (the check for token-like query keys stops the load on a hit; default: as-is).
- Whether history older than 24 months is wanted later (`--months` exists; default `snapshotMonthsDefault`).
- Plan-file values settled at dry-run, not in code: which response path holds a user id for a session probe, whether the widget-data mapping holds for every widget type, and which storage key (if any) holds a portal token. The rest are on the guesses list above. Names are printed, values never.
