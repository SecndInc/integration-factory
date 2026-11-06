# Snapshot landing: consented account data into BigQuery

Companion to `docs/design/snapshot.md` (the puller). This page covers the loader: `npm run snapshot:load -- <site>`
(`scripts/snapshot-load.ts`), the DDL in `scripts/snapshot/`, and the per-site views in `targets/<site>.views.sql`.

The input is `jobs/<site>/snapshots/<run_id>/` (one NDJSON file per endpoint, `failures.ndjson`, `manifest.json`).
The output is one restricted dataset per site and a `load-report.json` next to the run. `jobs/` never leaves the
machine except through this loader into the named dataset.

## Decisions

| Topic | Choice | Why |
| --- | --- | --- |
| Datasets | one per site, `snapshot_<site with - as _>`, in `northamerica-northeast1` | IAM, labels and the deletion date are per dataset; cross-site joins in one project are free |
| Location | `northamerica-northeast1` only; the loader refuses any other `SNAPSHOT_LOCATION` | data residency was a condition of the consent; a bucket or dataset in another region cannot be moved |
| Tables | `raw_rows`, `raw_failures`, `raw_manifest` per dataset, not table-per-endpoint | Roofr has about 85 endpoint ids with slashes and braces; one table means one load job, one verification query, one IAM surface |
| `payload` | `STRING`, parsed in the `v_rows` view with `SAFE.PARSE_JSON(payload, wide_number_mode => 'round')` | `TO_HEX(SHA256(payload)) = payload_sha256` proves the bytes landed unchanged; the JSON type canonicalizes and breaks that check. `SAFE.` keeps envelope lines that are not JSON (an HTML error page) from failing the view |
| Layout | no partitioning, `CLUSTER BY endpoint_id, page_key` | a one-shot has one date; every query filters on endpoint |
| Idempotency | `bq load --replace` (WRITE_TRUNCATE), one run per dataset; `run_id` column; resumed-run duplicates deduped in `v_rows` | reloading after `--resume` is atomic and cannot double the rows |
| Load path | `gcloud storage cp` to a same-region transient bucket, then `bq load gs://.../*.ndjson` with explicit schema files, `--max_bad_records=0`, no autodetect | local `bq load` is one file per job through Python; wildcards need GCS; a bad row stops the load instead of being skipped |
| Transient bucket | uniform access, public access prevention, soft delete 0, 7-day lifecycle; the loader never creates it and deletes its prefix on a passing load | the bucket is a staging area; a leftover copy of PII is a liability |
| Views now | `v_rows` (dedupe plus parsed JSON) and thin entity views, each `id, payload_json, payload, fetched_at` | column extraction is the cleaning work done afterwards |
| Encryption | Google-managed keys, no CMEK | the risk here is misconfigured access, which IAM handles; CMEK adds a revoked-key failure mode |
| Audit logs | BigQuery data-access logs are on by default and cannot be disabled; verify only | optionally add storage `DATA_READ` |
| Config | untracked `.env` keys `SNAPSHOT_*`, read with `loadEnv()`; documented in `.env.example` | the project id and bucket identify the client and stay out of git |
| Tooling | the `bq` and `gcloud` CLIs, no new npm dependency | see the Windows fix below |
| Retention | no table expiration; datasets and bucket are deleted when the engagement ends | the deletion date is an open decision recorded in every load report until it is known |

## `bq` on Windows

The `bq` found first on `PATH` under Git Bash is a `sh` wrapper that looks for `python3.12` and fails with
`python3.12: command not found`. `bq.cmd` works because it falls back to the SDK's bundled Python. The fix for both
is to point the wrapper at that interpreter:

```
CLOUDSDK_BQ_PYTHON=<sdk>/platform/bundledpython/python.exe
```

where `<sdk>` is `gcloud info --format="value(installation.sdk_root)"`. The loader does this itself: it reads the SDK
root, sets `CLOUDSDK_BQ_PYTHON`, `PYTHONUTF8=1`, `PYTHONIOENCODING=utf-8` and `CLOUDSDK_CORE_DISABLE_PROMPTS=1` in the
child environment, spawns `gcloud` and `bq` with `shell: true` (they are `.cmd` shims, which Node refuses to run
without a shell), and checks that `bq version` prints "BigQuery CLI" before anything else. Arguments are quoted for the
shell and values from `.env` are validated against strict patterns first. SQL always travels on stdin, never as an
argument, and every `bq` call carries `--location` and `--project_id`.

REST fallback if `bq` cannot be made to work: take a token with `gcloud auth print-access-token` (never print it),
then `POST https://bigquery.googleapis.com/bigquery/v2/projects/<PROJECT>/jobs` with a `load` configuration
(`jobs.insert`), poll `GET .../jobs/<jobId>?location=northamerica-northeast1` (`jobs.get`) until `DONE`, and run
checks with `POST .../queries` (`jobs.query`) and `location` set.

## DDL

`scripts/snapshot/ddl.sql` uses `${PROJECT}` and `${DS}`, substituted by the loader, and is idempotent
(`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE VIEW`).

- `raw_rows`: `run_id`, `site`, `endpoint_id` (not null), `method`, `path_template`, `url`, `fetched_at TIMESTAMP`,
  `status INT64`, `page_key`, `record_index INT64` (-1 is the envelope line, 0 and up are records), `payload STRING`,
  `payload_sha256`. Clustered by `endpoint_id, page_key`.
- `raw_failures`: the same columns without `payload`, plus `error`.
- `raw_manifest`: `run_id`, `site`, `endpoint_id`, `state`, `rows`, `bytes`, `started`, `finished`, `run_status`
  (the manifest flattened to one row per endpoint, in the temp directory, never in `jobs/`).
- `v_rows`: `raw_rows` kept where `ROW_NUMBER() OVER (PARTITION BY endpoint_id, page_key, record_index ORDER BY fetched_at DESC) = 1`,
  plus `payload_json`.
- `targets/roofr.views.sql`: `v_jobs`, `v_contacts`, `v_proposals`. `targets/yp-for-business.views.sql`: `v_leads`,
  `v_dash_leads`. Each selects `JSON_VALUE(payload,'$.id') AS id, payload_json, payload, fetched_at` from `v_rows` for
  one `endpoint_id` with `record_index >= 0`.

The three load schemas (`raw_*.schema.json`) match the DDL column for column. Required columns are `REQUIRED`, the
rest `NULLABLE`, so an empty `failures.ndjson` loads zero rows and truncates any previous content.

## IAM model

The dataset ACL keeps the creator as `OWNER`, drops the `projectReaders`, `projectWriters` and `projectOwners`
special groups, and adds `READER` for each address in `SNAPSHOT_VIEWERS`. Each viewer also gets project-level
`roles/bigquery.jobUser` so they can run queries. `npm run snapshot:load -- <site> --grant` does both (it edits the
ACL through `bq show --format=prettyjson`, a JSON edit and `bq update --source`, and refuses an edit that would leave
no user `OWNER`).

Caveat: dataset ACLs are additive to roles inherited from the project. Anyone with `roles/viewer`, `roles/editor`,
`roles/owner` or a `roles/bigquery.*` role on the project can read the dataset whatever its ACL says, and the
default compute service account often holds `editor`. The preflight prints every member of those roles and the load
report carries them as warnings and as an open decision. Accept the list, trim it, or move the work to a dedicated
project; the loader flags this and does not decide it.

## One-time setup

Run by a person, after `gcloud auth login` and `gcloud config set project <PROJECT>`:

```
gcloud services enable bigquery.googleapis.com storage.googleapis.com --project=<PROJECT>

gcloud storage buckets create gs://<BUCKET> --project=<PROJECT> --location=northamerica-northeast1 --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=0
gcloud storage buckets update gs://<BUCKET> --lifecycle-file=scripts/snapshot/bucket-lifecycle.json

npm run snapshot:load -- <site> --dry-run         # print the plan, spawn nothing
npm run snapshot:load -- <site>                   # preflight, upload, load, verify, report
npm run snapshot:load -- <site> --grant           # ACL and jobUser for SNAPSHOT_VIEWERS
```

`.env` needs `SNAPSHOT_GCS_BUCKET` and `SNAPSHOT_CONSENT_DATE`; `SNAPSHOT_GCP_PROJECT`, `SNAPSHOT_DELETE_AFTER` and
`SNAPSHOT_VIEWERS` are optional (see `.env.example`). `--step preflight|upload|load|verify` runs one stage;
`--keep-bucket` leaves the uploaded prefix in place; `--allow-partial` accepts a `partial` run, a non-empty
`failures.ndjson`, and a coverage miss in check D. An `aborted` run is never loaded.

The loader creates the dataset if it is missing (labels `client:roof-doctor`, `sensitivity:pii`,
`consent_date:<date>`, and `retention:engagement-end` or `retention:delete-after-date` plus `delete_after:<date>`;
no default table expiration). It does not create the bucket: it prints the two commands above and exits 1.

## Checks

Records only means `record_index >= 0` unless stated. A failing check exits 1 and still writes `load-report.json`
with verdict `fail`; the staged bucket prefix is kept for inspection.

| Check | Query | Passes when |
| --- | --- | --- |
| A. counts | per endpoint, `raw_manifest` full-joined to loaded records | loaded `n` equals manifest `rows`, `dup_slots` (`n` minus distinct `page_key#record_index`) is 0, no loaded endpoint is missing from the manifest |
| B. integrity | all rows including envelopes | `COUNTIF(TO_HEX(SHA256(payload)) != payload_sha256) = 0`, exactly one `run_id`, exactly one `site` equal to the target |
| C. ids | endpoints with more than one record per page | no record lacks `$.id` for an endpoint a view reads; other endpoints are listed as warnings |
| D. coverage | Roofr only: every `$.id` of endpoint `jobs` against each endpoint whose `path_template` has `{jobId}`, matched on the id in `url` | `missing = 0`; misses are listed and fail the load unless `--allow-partial` |
| E. secrets | query keys `token`, `access_token`, `api_key`, `key`, `session`, `sig`, `signature` in `url`; payloads mentioning `access_token`, `refresh_token`, `password`, `set-cookie` | `secret_in_url = 0`; payload hits are warnings a person reads |

On a pass the loader removes `gs://<BUCKET>/<site>/<run_id>/` and its temp directory. The load report holds
`project, dataset, location, loaded_at, consent_date, delete_after, retention, bq_job_ids, checks, verdict,
warnings, open_decisions`. `open_decisions` always includes the inherited-readers audit, and the retention and
deletion date while `SNAPSHOT_DELETE_AFTER` is empty.

## Retention

No table expiration is set. The datasets and the bucket are deleted when the engagement ends. The person who deletes
them records the date in the run log below, and sets `SNAPSHOT_DELETE_AFTER` for any later load once the date is known.

## Run log

No project ids, bucket names, emails or values here.

| Date | Site | Run id | Dataset | Verdict |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Cost

About 0.5 GB logical across both datasets, under the 10 GB free storage tier. Batch loads are free. A full scan of
`raw_rows` is about 0.0005 TB against the 1 TB per month free query tier. The transient bucket holds the files for
minutes to days (7-day lifecycle backstop). No budget alert is needed.
