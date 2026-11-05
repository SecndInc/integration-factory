---
name: apidocs-build
description: Stages 5 and 6 of site-to-API: build the docs from the traces, run the review gate, and land workflows and docs on a branch with a PR.
disable-model-invocation: true
---

# Build, review, land

Outcome: `docs/apis/<site>/` rendered, `REVIEW.json` says `pass`, and a PR from a feature branch carries the evidence. The gate exists because a page can be free of tokens and still full of customer records; the Roofr run proved it.

## 1. Mine, then build

```
npm run apidocs -- mine <site>
npm run apidocs -- build <site>
```

`mine` downloads the app's own script bundles named in the latest trace (no cookies, no API calls) into `jobs/<site>/bundles/` and writes `jobs/<site>/mined.json`: the API paths the code holds (write routes the tour never calls), the method where the call site shows it, and the enums. Its one line of output, `mined: bundles N fetched, F failed, routes R (M with method), enums E`, is the number to compare between runs; exit 2 means every fetch failed and build goes on without it. `build` picks `mined.json` up when present and adds "Routes in code, not observed" and "Enums in code" to the README and HTML; `openapi.json` stays observed-only.

`build` folds every trace under `jobs/<site>/traces` with every workflow under `workflows/<site>` and writes README.md, api.json, index.html, openapi.json atomically. A warning about a non-completed run means that trace is listed on the page but not used for derive. The PostToolUse hook runs the review gate right after and hands you its summary.

## 2. Check the rendering

```
npx --yes @redocly/cli@1 lint docs/apis/<site>/openapi.json --format=summary
```

Warnings are expected (no license, no 4xx responses). An error is a defect in `src/apidocs/render/openapi.ts` unless it is `security-defined` on an endpoint the app really calls without cookies, which the noise list usually explains.

Screenshot for the PR, kept out of git:

```
node -e "const {chromium}=require('playwright');const {pathToFileURL}=require('url');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});await p.goto(pathToFileURL(require('path').resolve('docs/apis/<site>/index.html')).href);await p.screenshot({path:'jobs/<site>/index.png'});await b.close();})()"
```

Look at it. The header counts (workflows, endpoints, bindings) match the build output; the Auth section lists cookie names, never values.

## 3. The review gate

```
npm run apidocs:scan -- <site>
```

| Verdict | Meaning | Next |
| --- | --- | --- |
| `pass` | no trace value in the docs, no personal-looking field, sizes in bounds | commit |
| `needs-review` | fields like `customer.name`, `address`, `phone` carry values, or a file is oversized | a person reads the listed key paths; either `npm run apidocs:scan -- <site> --accept` (recorded with their name) or the leaf key names (and the parent key of any object whose children carry values) go into `redactKeys` in `targets/<site>.json`, rebuild, rescan. `--redact-key` on `build` is for a one-off trial; the target file is what a rebuild reads |
| `fail` | a cookie, header or token value from the trace reached a page | when the value sits under a named key (an instance hostname in a settings field), add the key to `redactKeys`; otherwise fix `src/apidocs/redact.ts` or `derive.ts`, add the case to `test/apidocs/redact.test.ts`; rebuild, rescan |
| exit 3 | docs or api.json missing | build first |

`--accept` is a person's decision; an agent reports `needs-review` and stops. `guard-bash.mjs` refuses `git add docs/apis/<site>` on any other verdict, or when the files changed after the scan.

The noise list (locale bundles, tracker proxies, Cloudflare challenges) is information for the PR, not a blocker: derive marks them `noise`, the docs list them by path without bodies, and the count is `coverage.noise`.

## 4. Land

```
git checkout -b apidocs-<site>
git add workflows/<site> docs/apis/<site>
git commit
```

`jobs/` is ignored and the hook refuses it anyway. Commit message: what was recorded (site, workflows, steps, endpoint count) and the scan verdict. The PR body states the verification: the recorder's outcome and counts, the lint summary, the scan output, and the screenshot attached. Push the branch and open the PR; main is never pushed.

## Done check

`REVIEW.json` verdict `pass` with a hash equal to `hashDocs` of the committed files (the hook checks it), lint with 0 errors, the PR URL.
