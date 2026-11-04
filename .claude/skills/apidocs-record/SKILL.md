---
name: apidocs-record
description: Stages 3 and 4 of site-to-API: record a workflow or run the read-only tour through the signed-in Chrome, then inspect the trace.
disable-model-invocation: true
---

# Record and inspect

Outcome: `jobs/<site>/traces/trace-<run>.jsonl` with outcome `completed`, and you know which steps produced which endpoints. The trace holds cookies and full bodies, so it stays under `jobs/` and is read through `inspect`, which redacts.

## Two ways to record

**The read-only tour** drives the existing tab itself. It opens the start page, reads the same-site navigation links, drops any whose href or text matches the deny pattern in `scripts/apidocs-readonly-tour.ts`, prints the planned list, and then only opens things: each navigation link, and on every page up to `--items` of the items it shows (a detail link, or a data row that holds no form control, left again by going back or Escape). That is where the per-record endpoints (`/api/job/{id}` and its sub-resources) come from. It writes `workflows/<site>/readonly-tour.json` with id-like path segments templated, and builds the docs when it finishes.

```
npm run apidocs:tour -- <site> --port 9222 --max 24 --items 3
```

It aborts before touching anything if the start page lands on a login path. Read the `will open` lines it prints: the deny pattern is a filter, and a label it let through that still looks like an action (a route named after a verb, an "approve" page) is a reason to lower `--max` or to author a workflow instead. An `item-N skipped: <reason>` line is one item the tour could not open; the run goes on. `an overlay (...) covers items on <page>` means an onboarding guide or dialog is drawn over the list: the tour clicks nothing there, and the person closes it by hand in the Chrome window before the next run (dismissing it is a saved preference, so the agent never does). Its last lines list **writes the pages made on their own** (non-GET requests in scope): the tour submits nothing, so these fire on load or on opening an item; tell the person which page did it, and drop that page from the next run if they say so. On a production target the tour is the default and often the whole of stage 3.

**Recording a workflow** uses the human driver: the command prints one step at a time, the person does it in the browser and presses Enter, and the recorder closes the step after the network settles. `s` skips, `f <reason>` fails, `q` ends the run. Stdin belongs to the person, so they run this in their own terminal while you wait:

```
npm run apidocs -- record <site> --workflow workflows/<site>/<id>.json --attach http://127.0.0.1:9222
```

`--headed` instead of `--attach` launches a fresh local Chromium with no session, which is right for the fixture and wrong for a real account. `--hold-bodies` holds responses until read, for bodies the page consumes before the recorder can fetch them (the `bodiesEvicted` count says whether you need it).

Exit codes: 0 completed, 2 browser unreachable (Chrome is not on the port; `/apidocs-target`), 3 trace unreadable, 4 the run failed or a step failed.

## Read the tally before anything else

The recorder prints per-step exchange counts and the totals. Judge them:

- `outcome completed` and every `network` step with exchanges: proceed.
- a `network` step with 0 exchanges: the step did not do what its `do` says, or the host filter excluded the API host (`--host api.example.com` adds one).
- `betweenSteps` above 5% of in-scope exchanges: the person acted between steps; rerun with tighter steps.
- `bodies.evicted` above a handful: rerun with `--hold-bodies`.
- `targets` in the dozens on a single tab is normal (workers, iframes, prefetch).

## Inspect

```
npm run apidocs -- inspect jobs/<site>/traces/<trace>.jsonl                # steps and endpoints
npm run apidocs -- inspect <trace> --step open-job                         # one step
npm run apidocs -- inspect <trace> --grep /api/jobs                        # endpoints matching
npm run apidocs -- inspect <trace> --show <exchangeId>                     # one exchange, headers redacted, body cut at 4000 chars
npm run apidocs -- har <trace> -o jobs/<site>/<run>.har                    # for DevTools; unredacted, stays in jobs/
```

`--raw` prints cookies and tokens; it exists for a person at the keyboard and its output goes nowhere. Report endpoints by method and path template, and bodies by field names.

## Done check

The trace path, `outcome completed`, and the counts line, pasted from the recorder's output. Then `/apidocs-build`.
