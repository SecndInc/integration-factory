# Production safety for site-to-API work

The site being turned into an API is someone else's production account unless `targets/<site>.json` says `"environment": "staging"`, `"test"` or `"sandbox"`. Every rule below follows from that.

## Read-only means navigation

On a production target the browser only reads. Allowed: opening a URL, opening a list or detail page, switching tabs, applying a filter, paging, pressing Escape to close a dialog, and letting the page make whatever GET requests it makes on its own. Everything else changes the account or leaves a trail, so it stays untouched: form submits, uploads, downloads and exports (they write audit rows and send emails), toggles, drag and drop, "mark as read", dismissing onboarding tips (a saved preference), and any control whose label matches the deny list in `scripts/apidocs-readonly-tour.ts`.

A write workflow (`"effect": "write"`) records only against an account you control, has an `inverse` workflow that undoes it, and never runs on a production target. `.claude/hooks/guard-bash.mjs` refuses the record command otherwise.

## The person signs in

Sign-in happens by hand in the dedicated Chrome that `scripts/apidocs-chrome.ts` starts. The agent waits for `signed-in:` from `--wait-signin` and then attaches; it types no credential, reads no `TARGET_PASSWORD`, and leaves 2FA to the person. A tab still on a login path means wait, not retry.

## What stays on this machine

- `jobs/` (traces with cookies, Chrome profile, screenshots of the signed-in app), `*.har`, `storageState*.json`, `.env`: never staged, never pasted, never uploaded.
- Generated docs under `docs/apis/<site>/` reach git only through the review gate: `npm run apidocs:scan -- <site>` writes `REVIEW.json`, and `git add` is allowed when it says `pass` and its hash matches the files.
- Example values are account data. Refer to them by key path (`GET /api/jobs/cards responses.200.customer.name`), never by value, in chat, commits, PRs, issues and memory.
- Read a trace with `npm run apidocs -- inspect` (redacted). `--raw` is for a person at the keyboard, and its output goes nowhere.

## Snapshots (consented, read-only)

A snapshot replays the documented GET endpoints through the signed-in tab. It is still navigation-level read-only: GETs only, and never a request the page did not document as a GET. A token the page obtains through its own POST is captured from the page's own traffic and never re-sent or re-issued.

- It needs `snapshotConsent { by, on, expires?, scope }` in `targets/<site>.json` (`on` not in the future, `expires` not in the past). `.claude/hooks/guard-bash.mjs` refuses `apidocs -- snapshot <site>` on a production target without it; `--dry-run` and staging/test/sandbox targets are exempt.
- Its output, `jobs/<site>/snapshots/<run_id>/`, is the one thing under `jobs/` that leaves the machine, and only through `npm run snapshot:load -- <site>` into the restricted dataset described in `docs/design/snapshot-landing.md`: location `northamerica-northeast1`, named readers only, nothing public. The hook refuses ad-hoc uploads of `jobs/` (`bq load`, `gcloud storage cp`, `gsutil cp` and the like), `git add` of `*.ndjson`, datasets and buckets created in another location, and `allUsers` / `allAuthenticatedUsers` in any `bq`, `gcloud` or `gsutil` command. The hook reads the command line, not files: an ACL passed as `--source acl.json` is a person's review.
- Values in a snapshot are account data. Refer to them by key path, never by value.
- The project id, bucket and reader emails live only in the untracked `.env`.

## PII is the gate that passed the secret scan

A docs page can be free of cookies and tokens and still carry customer names, street addresses, phone numbers and coordinates, because the account holds them. The scan lists the key paths; a person reads them and either accepts (`--accept`, recorded in `REVIEW.json`) or fixes redaction in `src/apidocs/derive.ts` and rebuilds. Commit nothing under `docs/apis/` on a `needs-review` or `fail` verdict.
