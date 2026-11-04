# API docs from emulated workflows

Status: design, 2026-11-03, revised the same day after the capture-store decision. Nothing here is built. Companion to `pomerado-notes.md` (what Pomerado does), `benchmark.md` (how output is scored) and `SPEC.md` (the package plan). Linear: SEC-598 (workflow specs) and SEC-599 (capture) describe the same two inputs. This document keeps SEC-599's own recorder, specifies it fully, and adds the docs renderer. Section 13 lists what Pomerado has that this page lacks and how each item is adopted.

## 1. What the page is for

A reader who has never opened the target app learns, from one page, how the app's private API is used to get a job done. The job comes first, the endpoint list second. Every endpoint on the page was seen in a real session, and the page says which workflow step produced it.

Pomerado's reference is one operation per tool, rendered by its hosted service from schemas the model wrote, with no network capture in the open-source build and no notion of sequence. Our page differs in three ways, each one measurable.

| Pomerado reference | This page |
|---|---|
| One tool, one operation, free-text description | One workflow, an ordered list of steps, each step with the requests it triggered |
| Schemas the minter declared | Schemas derived from captured bodies, with a redacted example per status code |
| Relations between tools live in prose ("flight_id from search_flights") | Bindings are data: `POST /drafts` response `id` feeds `PUT /drafts/{id}/publish` |
| No evidence of when or how an operation was observed | Each endpoint lists the workflow, step, time and exchange id it came from |
| Hosted-only, closed renderer | Local, one command, three outputs (JSON, OpenAPI 3.1, HTML) |

## 2. Pipeline

```
workflows/<site>/<name>.json     the job to do, as steps with hints and declared inputs
        │
        ▼
record ──── browser (local Chromium | Browserbase | your own Chrome) ──── target site
   │           ▲
   │           └── one CDP socket, Network events on every target
   ▼
trace-<runId>.jsonl     raw CDP events + step markers, appended as they happen
        │
        ▼
assemble ──▶ Trace  (steps, exchanges, snapshots)        pure fold, re-runnable on old traces
        │
        ▼
derive ──▶ api.json  (endpoints, schemas, bindings, inputs, auth, evidence)
        │
        ▼
render ──▶ docs/apis/<site>/index.html, openapi.json, README.md
```

The capture store is a recorder we own. It opens one Chrome DevTools Protocol socket to the browser, attaches a `Network` session to every target (page, popup, iframe, worker, service worker) and appends every event to one JSONL file. The driver writes step markers into the same file through the same writer, so attribution is file order, not a clock. No proxy, no CA certificate, no second process, no token.

Why not Caido, which the first draft chose: a proxy cannot be reached from Browserbase, terminates TLS with its own fingerprint (a bot signal on guarded sites), needs a cloud-refreshed token for unattended runs, and would still have left raw HTTP parsing on our side. Two prototypes and two full design candidates were compared on 2026-11-03; the comparison is summarised in section 11.

## 3. Data shapes

These are the types `src/apidocs/types.ts` declares with Zod. Two structures exist: the durable event log (lines) and the tree assembled from it, `Trace → StepRun → Exchange`, with an index over it, `Endpoint`, keyed by method and path template. Nothing else holds state.

```
Workflow   { workflowVersion: 1, id, name, goal, effect: "read" | "write", inverse?: workflowId,
             preconditions: string[], inputs: InputSpec[], steps: StepSpec[] }
InputSpec  { name, kind: "text" | "number" | "file" | "choice", example?: string, secret: boolean }
StepSpec   { id, do: string, hints: string[], expect: "url" | "network" | "ui", uses?: inputName[] }

Trace lines (one JSON object per line, `seq` from the single writer):
RunLine      { kind:"run", traceVersion:1, runId, site, driver, workflowId?, startedAt,
               browser:{ kind:"local"|"browserbase"|"attached", version }, scope:{ hosts }, bodies:{ maxBytes, hold } }
TargetLine   { kind:"target", seq, at, event:"attached"|"detached", sessionId, targetId, type, url, openerId? }
StepLine     { kind:"step", seq, at, phase:"begin"|"end", id, index, text?, outcome?, note? }
ActionLine   { kind:"action", seq, at, stepId, action, detail, url? }
SnapshotLine { kind:"snapshot", seq, at, stepId, cookies: Cookie[], storage: { origin, local, session }[] }
CdpLine      { kind:"cdp", seq, at, sessionId, method, params }          raw Network.* event, untouched
BodyLine     { kind:"body", seq, at, sessionId, requestId, side:"request"|"response", source:"network"|"fetch",
               state:"ok"|"evicted"|"too-large"|"error", text?|base64?|entries?, bytes, truncated? }
EndLine      { kind:"end", at, reason:"closed"|"browser-closed"|"error", counts }

Trace      { traceVersion:1, runId, site, driver, workflowId?, startedAt, finishedAt?, complete,
             outcome: RunOutcome, steps: StepRun[], exchanges: Exchange[], snapshots: Snapshot[], counts }
RunOutcome "completed" | "failed" | "interrupted" | "sign_in_failed" | "challenge_unresolved"
           | "site_unavailable" | "rate_limited" | "owner_ended"
StepRun    { id, index, text?, startedAt, endedAt?, outcome:"ok"|"failed"|"skipped"|"interrupted",
             exchangeIds: ExchangeId[], actions: Action[] }
Exchange   { id: "<sessionId>:<requestId>:<hop>", seq, stepId?, actionSeq?,
             target:{ sessionId, type, url, openerId? }, resourceType, initiator,
             request:{ method, url, host, path, query, headers, headersSource:"wire"|"renderer", cookies, body?, at },
             response?:{ status, headers, setCookies, mimeType, fromCache, fromServiceWorker,
                         body?, bodyState:"ok"|"skipped"|"evicted"|"too-large"|"lost", at },
             outcome:"completed"|"failed"|"inflight"|"aborted", error?, redirectTo?, ws?, timing }
Body       { encoding:"text", text, bytes, truncated } | { encoding:"base64", base64, bytes, truncated }
           | { encoding:"multipart", boundary, parts: MultipartPart[], bytes }
MultipartPart { headers, name?, filename?, contentType?, content:{ text }|{ base64 }|{ omitted:"file" } }

Endpoint   { id: "<METHOD> <host><pathTemplate>", method, host, pathTemplate, operation?,
             pathParams: Param[], queryParams: Param[], headers: HeaderUse[],
             auth: { cookies: string[], headers: string[] },
             request?: { schema: JsonSchema, example }, responses: Record<status, { schema: JsonSchema, example }>,
             bindings: Binding[], ambient: boolean, observedIn: Evidence[] }
Param      { name, example: string | "{redacted}", required: boolean | "unknown",
             source: "binding" | "input" | "literal" | "computed" }
HeaderUse  { name, required: boolean | "unknown", valueKind: "static" | "token" | "redacted" }
Binding    { from: { endpointId, location: "response.body" | "response.header" | "set-cookie" | "storage", path },
             to: { location: "path" | "query" | "header" | "body" | "cookie", path }, seen: number }
Evidence   { runId, workflowId, stepId | "setup" | null, exchangeId, at }

ApiDoc     { docVersion: 1, site, generatedAt, source: { traces: { runId, path, complete, outcome }[] },
             auth: { cookies: string[], headers: string[], loginWorkflowId?, verification?: "password"|"code"|"passkey"|"sso" },
             workflows: WorkflowDoc[], endpoints: Endpoint[], outside: Evidence[],
             coverage: { steps, stepsWithExchanges, endpoints, endpointsWithExample, bindings, inputsBound,
                         computedValues, bodiesEvicted, betweenSteps } }
WorkflowDoc{ ...Workflow, latestRun: { runId, outcome, at }, cases: Case[],
             sequence: { stepId, endpointId, exchangeId }[] }
Case       { runId, inputs: Record<name, value | "{redacted}">, expect: { stepId, status: number[] }[] }
```

`api.json` is the durable record of the result. Everything on the page is a view of it. A reader who doubts the page copies the exchange id from the evidence list and runs `apidocs inspect <trace> --show <id>`, or opens the HAR export in DevTools. `generatedAt` is the latest run end among the runs used, not the build time, so a rebuild with no new data produces no diff.

## 4. Attribution: which step produced which request

One rule, in the pure `assemble` fold: an exchange belongs to the step whose `begin` line precedes its `requestWillBeSent` line with no `end` in between. Both lines come from the same in-process writer with one `seq` counter, so there is no clock to compare. Before writing `end`, the driver calls `settle()`, which the recorder answers exactly because it counts in-flight requests from its own events: resolved when no in-scope HTTP request has been in flight for 500 ms, capped at 10 s. WebSocket and EventSource never count.

Exchanges whose request starts between an `end` and the next `begin` go to `betweenSteps`, before the first `begin` to `setup`. The page lists both under "Seen outside any step", never dropped. `action` markers give sub-step attribution. `initiator` gives the calling script, `parser` for document subresources, `preflight` for CORS, `redirect` for hops.

No header is injected and nothing is added to the page, so the site sees the same traffic a person produces.

Three drivers write the same trace:

- **Human, your own Chrome (first built).** `npm run apidocs -- record <site> --workflow w.json --attach http://127.0.0.1:9222`. The person starts Chrome with `--remote-debugging-port=9222` on a copied profile, logs in as themselves, and the recorder connects to that port. No Playwright, no automation flags, real fingerprint, passkeys and SSO work. The recorder enables only the `Network` and `Target` domains on its sessions. This is the mode for guarded sites.
- **Human, launched browser.** Same prompts, but the CLI launches Chromium through the existing `BrowserProvider` (local headed, or Browserbase with the external residential proxy). The recorder connects to the provider's `cdpUrl`. Each step prints its text and waits for Enter; `s` skips, `f <reason>` fails.
- **Navigator.** The existing plan-driven `surface-navigator` already sets `currentPhase` per surface or control. A new optional `onPhaseChange` hook wraps each phase in `begin`/`end`. Lands after the human drivers prove derive and render.

## 5. Derive

`derive({ site, workflows, traces }) → ApiDoc`, pure, no I/O, unit-tested against committed, scrubbed fixture traces. Only traces with outcome `completed` feed endpoints; every trace appears in `source.traces` and on the page.

1. **Template paths.** `isIdSegment` moves from `distinctEndpoints` (`src/capture/playwright-capture.ts`) into `src/capture/path-template.ts` so onboard and apidocs share one rule: numeric, 12+ hex, UUID, or a 16+ character token mixing letters and digits. Params are named after the previous segment (`/drafts/{draftId}`), falling back to `{id}`.
2. **Endpoint kinds.** `resourceType ∈ { XHR, Fetch, Document, WebSocket, EventSource }` plus `Other` with a JSON mime. `text/html` documents are `kind: "page"`, shown in workflows but left out of the reference. An `OPTIONS` carrying `access-control-request-method` folds into its target endpoint as `cors: true`. GraphQL endpoints split by `operationName`. An endpoint seen in at least 3 steps and in more than half the steps of one run is `ambient` (polling, analytics).
3. **Schemas.** `jsonShape` already produces keys and types. `shapeToJsonSchema` emits JSON Schema 2020-12 with `type`, `properties`, `items`, and `required` set to keys present in every example of that status. Depth cap 8, 200 keys per object. Examples keep the real structure and replace values the scrubber flags.
4. **Scrub.** One `redact(value, place, policy)` used by every stage, and the only constructor of the `Redacted<T>` brand that renderers accept. It replaces cookie values, `Authorization` and `X-*-Token` style headers, `Set-Cookie`, JWT-shaped and 32+ character hex or base64 strings, email addresses, phone numbers, any input marked `secret`, and any key the site config lists. The test asserts none of those appear in `api.json` or the rendered page. The raw trace stays in the private job area.
5. **Auth.** Cookie names sent with every in-scope exchange, and header names whose value looks like a token, go into `auth`. A `login` workflow, when present, is linked as `loginWorkflowId`, and its `verification` kind is copied from the workflow spec.
6. **Bindings and inputs.** For each dynamic value in a request (path param, query value, non-standard header, body leaf), search earlier exchanges of the same trace for the same value in a response body, response header, `Set-Cookie`, or a storage snapshot. The most recent hit is the binding. A value equal to a declared workflow input is `source: "input"` and becomes a parameter of the workflow on the page. A value with no hit and high entropy is `computed`, shown as "value set by site JavaScript, replay in a page". Bindings run before scrubbing, on real values.
7. **Cases.** Each completed run contributes one `Case` per workflow: the inputs used (secrets redacted) and the status codes each step produced. This is the recorded expectation a later replay checks against (section 13, item 3).
8. **Coverage.** Counts only. No scores from a model.

## 6. Render

Three outputs from one `ApiDoc`, written to `docs/apis/<site>/`:

- `api.json`, the record, validated by `ApiDocSchema` on write and on read.
- `openapi.json`, OpenAPI 3.1 with one operation per endpoint, `x-observed-in` listing workflows and steps, `x-bindings`, `x-workflows` listing each workflow's inputs and sequence, and `components.securitySchemes` from `auth`. Every local `$ref` is inlined so the file loads in Redocly or Swagger UI without edits and can be turned into MCP tool definitions mechanically.
- `index.html`, one self-contained file, no build step, no network. Sections, in order:
  1. The site, when it was captured, how many workflows and endpoints, the coverage line, and the run list with outcomes.
  2. **Auth.** Cookies and headers the site expects, which workflow establishes them, and the verification kind.
  3. **Workflows.** One block per workflow: goal, preconditions, declared inputs, latest run outcome and date, then each step as a row with the step text, its outcome and the exchanges it triggered as `METHOD path → status`. A sequence diagram drawn in inline SVG from `sequence[]`. A `network` step with zero exchanges is flagged.
  4. **Endpoints.** Grouped by first path segment. Each endpoint: method, path template, params table with each param's source, request schema and example, one response per status code, bindings in and out, and the evidence list (workflow, step, time, exchange id).
  5. **Background traffic.** Ambient endpoints, so polling does not clutter the workflows.
  6. **Seen outside any step.** Exchanges with no step, so nothing captured is hidden.
- `README.md`, the Markdown form of the same sections, for the PR and for agents.

The page is reference, not tutorial. No prose the data cannot back. Headings carry the facts ("3 workflows, 27 endpoints, 2 bindings"), not labels. Rendering is byte-stable: the same `ApiDoc` gives the same files.

## 7. Capture facts the design relies on

Measured on 2026-11-03 with Playwright 1.62.1's Chromium and Node 22.22.1, on a local fixture site with an XHR CSRF chain, a multipart upload, a service worker and a popup. Prototype files and results are in the session scratchpad, summarised here.

- **Attach.** `Target.setAutoAttach({ autoAttach: true, waitForDebuggerOnStart: true, flatten: true })` on the browser session attaches every existing and future target. A per-page `newCDPSession` misses a popup's first requests (measured), which is why the recorder attaches at browser level. For each attached page, iframe, worker or service worker the recorder sends `Network.enable`, re-issues `setAutoAttach` for children, and always `Runtime.runIfWaitingForDebugger`. Playwright uses the same wait on its own session; the popup fixture is the check that the two coexist.
- **Request bodies.** Playwright's `postDataBuffer()` returns null for a `FormData` body with a `Blob` (measured). In `requestWillBeSent` the multipart upload arrived with `hasPostData: true` and no `postData` or `postDataEntries` (measured on the browser-level session), so the recorder calls `Network.getRequestPostData` whenever `hasPostData` is set and the body is absent. That call returned the multipart text with headers and field values (measured on a per-page session); file-backed parts are omitted by Chromium. Multipart structure, field names, filenames and part content types are recovered; file bytes never are. That is enough for a doc.
- **Auto-attach next to Playwright.** Measured on 2026-11-03: with Playwright owning the browser, a second browser-level socket with `setAutoAttach({ waitForDebuggerOnStart: true })` recorded the popup's own document request and its API call on a separate session with `openerId` set, Playwright received its popup event in 85 ms, and no command errored. The design's one empirical risk is settled for local Chromium. Browserbase remains open decision 3.
- **Response bodies.** `Network.getResponseBody` after `loadingFinished`, issued inside the event handler before any await. The body can be evicted by a cross-document navigation in that target before the command lands. The failure is counted (`bodiesEvicted`), never hidden. `--hold-bodies` enables `Fetch.enable` on `Response` stage for XHR and Fetch so the body is read before the renderer sees it, at the cost of one round trip per response. Off by default.
- **Cookies and wire headers.** `requestWillBeSentExtraInfo.associatedCookies` and `.headers` give what was sent on the wire. `responseReceivedExtraInfo.headers` gives raw `set-cookie`. ExtraInfo is absent for cached and service-worker responses; `headersSource` says which set the exchange carries.
- **Ordering.** For one `requestId`, `requestWillBeSent` is first; ExtraInfo, `responseReceived`, `loadingFinished` or `loadingFailed` arrive in any order after. The fold keys on `(sessionId, requestId)`, so only the position of `requestWillBeSent` relative to step markers matters.
- **Timestamps.** `requestWillBeSent` has `wallTime`; later events only a monotonic `timestamp`. The fold converts. The writer stamps each line with its own clock as `at`. Neither is used for attribution.
- **Providers.** `LocalBrowserProvider` already exposes a `cdpUrl`; `BrowserbaseProvider` returns the session `connectUrl`, which is a browser-level socket. `AttachedBrowserProvider` is new: a Chrome the person started with `--remote-debugging-port`. Browserbase's advanced stealth is a session setting the provider does not send yet; it is one field, gated by plan.
- **Node.** The recorder uses the global `WebSocket`, present in Node 22. `engines` moves to `>=22`, as `SPEC.md` already plans.

## 8. State across processes

Per `.claude/rules/system-design.md`.

- **Durable record.** `trace-<runId>.jsonl` in the private job area, appended per event, fsynced after every step line and the end line. `api.json` for the result. Raw traces hold cookies and tokens, so they follow SEC-599's one-day retention and never leave the job area.
- **Liveness.** Asked, not inferred. `Browser.getVersion` at attach. The socket's close event ends the run as `browser-closed`. `settle()` asks the browser's own event stream for in-flight requests. After the start page loads, the recorder reports its in-scope count; zero aborts the run before step 1 with "the browser is not the one being recorded".
- **Retry and its cap.** No retries on the capture path. A `getResponseBody` failure is recorded once as `evicted`. A dropped socket ends the run. The next different action is a new `record`, which writes a new file. `build` is idempotent over every file for the site.
- **Acknowledgement and replay.** The `end` line is the acknowledgement that a trace is whole. A trace without one assembles as `complete: false`, its open step `interrupted`, its in-flight exchanges `inflight`, and the page says so. Replay is `build`, which starts from the files on disk every time. No cursor.
- **Every client fails at once.** One browser per run. If it dies, the open step is `interrupted`, the file is kept, the page shows it. `record` never appends to an existing file, so a rerun after a crash converges without cleanup.
- **The number.** `bodiesEvicted`, `betweenSteps` and `stepsWithExchanges / steps`, printed at the end of every run and written into the end line and the page. Evicted above zero on in-scope XHR means use `--hold-bodies`. Between-steps above a few percent means a driver that does not settle, not an odd site.
- **Prior art.** Playwright's own `HarTracer` and Puppeteer's auto-attach do the same attach-and-`getResponseBody` loop. Chrome DevTools "Preserve log" is the GUI equivalent, and its HAR is the format we export. The extension's `har-to-skills.ts` solves derivation from HAR. This design adds the step tree, the inputs, and the renderer.

## 9. Where things live

```
src/apidocs/
  types.ts              Zod schemas above, JSON Schema export
  cdp.ts                WebSocket client: connect, send, onEvent, onClose, close          ~110
  recorder.ts           attach, Network.enable per session, enrichment, writer, step/begin/end, settle, close  ~260
  trace.ts              line schemas, readTrace (tolerant of a cut tail), assemble fold    ~200
  body.ts               postDataEntries and response bodies to Body, multipart split      ~60
  har.ts                toHar: steps as pages, exchanges as entries with _step/_initiator ~80
  drivers/human.ts      Enter per step over Recorder.step                                 ~60
  drivers/navigator.ts  (phase 4) begin/end from SurfaceNavigator.onPhaseChange           ~50
  derive.ts             template, kinds, schema, scrub, auth, bindings, inputs, cases, coverage
  redact.ts             Redacted<T> brand and redact()
  render/markdown.ts, openapi.ts, html.ts
src/apidocs-cli.ts      record | inspect | har | build                                     ~130
src/capture/browser-provider.ts   + AttachedBrowserProvider (~15), + Browserbase advancedStealth field
src/capture/path-template.ts      isIdSegment, moved out of playwright-capture.ts
workflows/<site>/       workflow specs, committed
test/apidocs/           fixture site + real local Chromium (recorder), committed scrubbed trace (assemble, derive),
                        snapshot of rendered outputs, boundaries test over the import graph
docs/apis/<site>/       generated outputs, committed per site
```

Module rules, enforced by `test/apidocs/boundaries.test.ts`: `trace.ts`, `body.ts`, `har.ts`, `derive.ts`, `redact.ts` and `render/*` import nothing that does I/O. `cdp.ts` is the only file that opens a socket. `recorder.ts` is the only writer of a trace file. Renderers accept only `ApiDoc`, whose examples are `Redacted`, so a raw value cannot reach a page.

CLI:

```
npm run apidocs -- record <site> --workflow <file> [--attach <url> | --headed | --browserbase] [--hold-bodies]
npm run apidocs -- inspect <trace.jsonl> [--step <id>] [--host <h>] [--grep <s>] [--show <exchangeId>]
npm run apidocs -- har <trace.jsonl> [-o out.har]
npm run apidocs -- build <site> [--out docs/apis/<site>]
```

## 10. Phases and done checks

| # | Phase | Done check |
|---|---|---|
| 0 | `cdp.ts`, `recorder.ts` attach path, `trace.ts` | Against a local Chromium and the fixture site: the popup's own document request is in the trace with `openerId` set; the multipart upload has a `title` text part and a `photo` part with `omitted: "file"`; the CSRF chain's three exchanges are in one step in `seq` order with wire headers. A hand-cut trace assembles as `complete: false`. |
| 1 | Human drivers, attach mode, `inspect`, `har` | One workflow on the first test application through the person's own Chrome: every step prints a tally, `betweenSteps` under 5 percent, `bodiesEvicted` printed. The HAR opens in DevTools. |
| 2 | Derive | Unit tests on the committed fixture trace: a planted `id` chain becomes a binding, a declared input is `source: "input"`, a planted token is `computed`, the scrubber test passes, one `Case` per run, coverage counts match. Onboard tests still pass with the shared `isIdSegment`. |
| 3 | Render | `openapi.json` validates with `@redocly/cli lint`; `index.html` opens offline and lists the same endpoints as `api.json` (a script compares them); rebuild is byte-identical; screenshots in the PR. |
| 4 | Navigator driver | The existing `web-app-account` plan produces a trace and page for the fake marketplace with no human step. |
| 5 | Browserbase stealth and replay cases | `advancedStealth` sent when configured; a read workflow's derived direct-HTTP sequence replays against the site and matches its `Case` status codes. |

Phases 0 to 3 are one PR stack on a feature branch. Phases 4 and 5 are their own PRs.

## 11. Decisions this changes

- SEC-597 ruled a man-in-the-middle proxy out of scope and SEC-599 planned a CDP recorder. The owner asked for Caido on 2026-11-03; the first draft of this document adopted it. On the same day two prototypes and two full design candidates (Caido-backed, own recorder) were compared and the owner chose the own recorder. Deciding facts: Browserbase cannot reach a localhost proxy; a proxy's TLS fingerprint is a bot signal; Caido's token refresh needs its cloud; its step-marker ordering was unverifiable without a live instance; the own recorder captures everything the page needs with exact step order. What Caido still does better and this design gives up: a GUI during capture, non-browser clients, and the bytes of uploaded files. The HAR export keeps Caido, Burp and DevTools as optional viewers.
- The docs page is a new output next to the discovery doc PR. `src/pr/discovery-doc.ts` stays until the new renderer covers its sections, then it is deleted.
- `engines` moves to Node 22, which `SPEC.md` already planned.

## 12. Open decisions

1. Where generated pages are published: committed under `docs/apis/<site>/` in the target repo, a GitHub Pages branch, or both.
2. Whether the first application is one the owner controls. Write workflows need a test account and an `inverse` workflow.
3. Whether Browserbase accepts a second CDP socket while Playwright holds the first. A one-minute check. If not, Browserbase runs use per-page sessions through Playwright's connection, about 40 lines behind the same event listener, with a known gap on dedicated workers.
4. Whether the launched-browser human driver blocks service workers by default (`serviceWorkers: "block"`). It gives wire headers on every API call at the cost of a small behaviour change on the site. Attach mode cannot block them.
5. Which Browserbase plan tier is in use, which decides whether `advancedStealth` can be sent.

## 13. What Pomerado has that this page lacks, and how each is adopted

From `pomerado-notes.md` sections 3, 5, 6, 9 and 10, limited to what matters for a docs page built from captured workflows. Ranked by how much it changes what a reader can do with the page.

| # | Pomerado has | This design lacked | Adoption | Phase |
|---|---|---|---|---|
| 1 | A tool contract with a declared input schema, so a caller knows what to supply | Endpoints and bindings, but no statement of what the person typed | `Workflow.inputs[]` declared in the spec; derive marks matching request values `source: "input"`; the page shows each workflow's inputs as its parameter table; `openapi.json` carries them under `x-workflows` | 2 |
| 2 | `effect: read \| write` per operation, with declared confirmations before a write | `effect` on the workflow only | Keep `effect` per workflow; add `confirms: string[]` to `StepSpec` so a step that presses a confirm button says so, and the page labels it. Write workflows are not derived without an `inverse` | 2 |
| 3 | `test/cases.json`: recorded inputs and expectations, and a `live_tests` gate before publication | Coverage counts only | `Case` per completed run (inputs, status per step) in `api.json`; phase 5 replays a read workflow's direct-HTTP sequence and compares. `build` warns, never fails, when a workflow's latest run is not `completed` and shows the outcome badge | 2, 5 |
| 4 | A value-free sign-in recipe (`auth-fill.json`) with a verification kind, versioned | Cookie and header names only | `auth.verification` from the `login` workflow spec (`password`, `code`, `passkey`, `sso`); the Auth section says how a session is established and which workflow does it. `auth/login.ts` already persists `storageState`; the recipe stays value-free | 2 |
| 5 | Artifact schemas validated on load, versioned per concern | TypeScript interfaces, nothing validated on read-back (the repo-wide gap `pomerado-notes.md` section 3 names) | `workflowVersion`, `traceVersion`, `docVersion` on every record; Zod parse on every read; a version the code does not know is a named refusal, not a crash | 0, 2 |
| 6 | Canonical JSON Schema with local `$ref` inlined, so the served tool has none | Not specified | `openapi.json` inlines every local `$ref`. This makes one workflow equal one MCP tool definition mechanically, which is the bridge to serving what Pomerado serves | 3 |
| 7 | A `stopReason` taxonomy shared by every host | `ok \| failed \| skipped` | `RunOutcome` takes the subset that applies to a capture: `sign_in_failed`, `challenge_unresolved`, `site_unavailable`, `rate_limited`, `owner_ended`, plus `completed`, `failed`, `interrupted`. Written in the end line, shown per run on the page | 1 |
| 8 | Captures published without values, credentials masked everywhere a model or person reads, `.jobs/` records with one-day retention | Scrub rules for the page; retention stated in SEC-599 but not implemented | `Redacted<T>` brand so a renderer cannot take a raw value; `record` deletes traces older than one day in the job area at start; `inspect` prints wire headers redacted unless `--raw` | 1, 2 |
| 9 | A second-model reviewer in the tool path for write builds | No reviewer; the navigator is read-only today | Not needed for human drivers. When the navigator driver runs a write workflow (phase 4), each `act` goes through the `review/` hook `SPEC.md` plans before the browser moves. Out of scope for this document beyond the hook point | 4 |
| 10 | Conventions: tagged errors with a `code` union, limits in constant names, tests on synthetic sites, no logging in core | Not stated | Applied to `src/apidocs/`: `CaptureError` with a `code` union, `bodyMaxBytes`, `settleQuietMs`, `settleCapMs`, `traceRetentionDays` as named constants, fixture-only tests, `log` as an injected function | 0 |

Not adopted, on purpose: Pomerado's minter writing the implementation code (this page is evidence, not code), its hosted docs renderer (ours is local and open), and Effect-TS in any public type.
