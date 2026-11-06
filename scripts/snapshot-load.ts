// Loads a consented account snapshot (jobs/<site>/snapshots/<run_id>/) into a restricted BigQuery
// dataset: preflight, upload to a transient bucket, bq load, DDL and views, five checks, report.
// Design: docs/design/snapshot-landing.md. All spawning goes through an injected `exec`.
//
//   npx tsx scripts/snapshot-load.ts <site> [--run <run_id>] [--step preflight|upload|load|verify|all]
//     [--allow-partial] [--grant] [--keep-bucket] [--dry-run] [--jobs <dir>]

import { spawn } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../src/env-file.js';

// ---- types (local mirror of the puller's contract)

export type RunStatus = 'running' | 'complete' | 'partial' | 'aborted';

export interface Manifest {
  manifestVersion: number;
  runId: string;
  site: string;
  planSha256?: string;
  startedAt: string;
  finishedAt?: string;
  status: RunStatus;
  reason?: string;
  counts?: Record<string, unknown>;
  endpoints: Record<string, { state: string; rows: number; bytes: number; pages?: number; total?: number }>;
}

export interface RunEntry {
  runId: string;
  manifest: Manifest | null;
  failuresBytes: number;
}

export interface ManifestRow {
  run_id: string;
  site: string;
  endpoint_id: string;
  state: string;
  rows: number;
  bytes: number;
  started: string;
  finished: string | null;
  run_status: RunStatus;
}

export interface ExecOpts {
  input?: string;
  env?: Record<string, string>;
}
export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}
export type Exec = (cmd: string, args: string[], opts: ExecOpts) => Promise<ExecResult>;

export type Step = 'preflight' | 'upload' | 'load' | 'verify' | 'all';

export interface Args {
  site: string;
  run?: string;
  step: Step;
  allowPartial: boolean;
  grant: boolean;
  keepBucket: boolean;
  dryRun: boolean;
  jobs: string;
}

export interface LoadConfig {
  site: string;
  dataset: string;
  project: string;
  location: string;
  bucket: string;
  consentDate: string;
  deleteAfter: string | null;
  viewers: string[];
  runId: string;
  runDir: string;
  tmpDir: string;
  rowFiles: string[]; // absolute, forward slashes
  failuresFile: string;
  manifestFile: string;
  schemaDir: string;
  ddl: string;
  views: string | null;
  viewEndpoints: string[];
  allowPartial: boolean;
  keepBucket: boolean;
}

export type Phase = 'preflight' | 'upload' | 'load' | 'ddl' | 'check' | 'cleanup';
export interface Cmd {
  cmd: 'gcloud' | 'bq';
  args: string[];
  input?: string;
  phase: Phase;
  note?: string;
}

export type Row = Record<string, unknown>;
export interface CheckInput {
  counts: Row[];
  integrity: Row[];
  ids: Row[];
  coverage: Row[] | null;
  secrets: Row[];
}
export interface CheckResult {
  pass: boolean;
  skipped?: boolean;
  summary: string;
  details: unknown;
}
export type CheckName = 'counts' | 'integrity' | 'ids' | 'coverage' | 'secrets';
export interface Evaluation {
  checks: Record<CheckName, CheckResult>;
  verdict: 'pass' | 'fail';
  warnings: string[];
}

export interface Deps {
  exec?: Exec;
  env?: Record<string, string | undefined>;
  log?: (line: string) => void;
  now?: () => Date;
}

export class LoadError extends Error {}

export const LOCATION = 'northamerica-northeast1';
const ENV_KEYS = [
  'SNAPSHOT_GCP_PROJECT',
  'SNAPSHOT_GCS_BUCKET',
  'SNAPSHOT_LOCATION',
  'SNAPSHOT_CONSENT_DATE',
  'SNAPSHOT_DELETE_AFTER',
  'SNAPSHOT_VIEWERS',
];
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CP_CHUNK = 25; // keeps each command line well under the Windows 8191-character limit

const fwd = (p: string): string => p.replace(/\\/g, '/');

// ---- pure helpers

export function datasetFor(site: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(site)) throw new LoadError(`invalid site "${site}"`);
  return `snapshot_${site.replace(/-/g, '_')}`;
}

export function parseArgs(argv: string[]): Args {
  const out: Args = { site: '', step: 'all', allowPartial: false, grant: false, keepBucket: false, dryRun: false, jobs: 'jobs' };
  const takeValue = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new LoadError(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    switch (a) {
      case '--run':
        out.run = takeValue(i++, a);
        break;
      case '--step': {
        const v = takeValue(i++, a);
        if (!['preflight', 'upload', 'load', 'verify', 'all'].includes(v)) throw new LoadError(`--step must be preflight|upload|load|verify|all`);
        out.step = v as Step;
        break;
      }
      case '--jobs':
        out.jobs = takeValue(i++, a);
        break;
      case '--allow-partial':
        out.allowPartial = true;
        break;
      case '--grant':
        out.grant = true;
        break;
      case '--keep-bucket':
        out.keepBucket = true;
        break;
      case '--dry-run':
        out.dryRun = true;
        break;
      default:
        if (a.startsWith('--')) throw new LoadError(`unknown flag ${a}`);
        if (out.site) throw new LoadError(`unexpected argument ${a}`);
        out.site = a;
    }
  }
  if (!out.site) throw new LoadError('usage: snapshot-load <site> [--run <run_id>] [--step ...] [--allow-partial] [--grant] [--keep-bucket] [--dry-run] [--jobs <dir>]');
  datasetFor(out.site);
  if (out.run !== undefined && !/^[A-Za-z0-9._-]+$/.test(out.run)) throw new LoadError(`invalid run id "${out.run}"`);
  return out;
}

export interface EnvConfig {
  project: string | null;
  bucket: string;
  location: string;
  consentDate: string;
  deleteAfter: string | null;
  viewers: string[];
}

const EMAIL = /^[^\s@"'&|<>^%,;]+@[^\s@"'&|<>^%,;]+\.[^\s@"'&|<>^%,;]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates .env values. They end up on command lines, so each is checked against a strict pattern. */
export function readEnvConfig(env: Record<string, string | undefined>): EnvConfig {
  const get = (k: string): string => (env[k] ?? '').trim();
  const location = get('SNAPSHOT_LOCATION') || LOCATION;
  if (location !== LOCATION) throw new LoadError(`SNAPSHOT_LOCATION must be ${LOCATION} (got "${location}")`);
  const bucket = get('SNAPSHOT_GCS_BUCKET');
  if (!bucket) throw new LoadError('SNAPSHOT_GCS_BUCKET is required (.env)');
  if (!/^[a-z0-9][a-z0-9._-]{1,220}$/.test(bucket)) throw new LoadError('SNAPSHOT_GCS_BUCKET is not a valid bucket name');
  const consentDate = get('SNAPSHOT_CONSENT_DATE');
  if (!consentDate) throw new LoadError('SNAPSHOT_CONSENT_DATE is required (.env, YYYY-MM-DD)');
  if (!DATE.test(consentDate)) throw new LoadError('SNAPSHOT_CONSENT_DATE must be YYYY-MM-DD');
  const deleteAfter = get('SNAPSHOT_DELETE_AFTER') || null;
  if (deleteAfter && !DATE.test(deleteAfter)) throw new LoadError('SNAPSHOT_DELETE_AFTER must be YYYY-MM-DD or empty');
  const project = get('SNAPSHOT_GCP_PROJECT') || null;
  if (project && !/^[a-z0-9][a-z0-9.:-]{3,}$/.test(project)) throw new LoadError('SNAPSHOT_GCP_PROJECT is not a valid project id');
  const viewers = get('SNAPSHOT_VIEWERS')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const v of viewers) if (!EMAIL.test(v)) throw new LoadError(`SNAPSHOT_VIEWERS has an invalid email: ${v}`);
  return { project, bucket, location, consentDate, deleteAfter, viewers };
}

export function pickRun(
  entries: RunEntry[],
  opts: { run?: string; allowPartial?: boolean } = {},
): { entry: RunEntry & { manifest: Manifest }; warnings: string[] } {
  const withManifest = entries.filter((e): e is RunEntry & { manifest: Manifest } => e.manifest !== null);
  let entry: (RunEntry & { manifest: Manifest }) | undefined;
  if (opts.run) {
    entry = withManifest.find((e) => e.runId === opts.run);
    if (!entry) throw new LoadError(`run ${opts.run} has no manifest.json`);
  } else {
    entry = [...withManifest].sort((a, b) => (b.manifest.startedAt || '').localeCompare(a.manifest.startedAt || '') || b.runId.localeCompare(a.runId))[0];
    if (!entry) throw new LoadError('no run with a manifest.json under the snapshots directory');
  }
  const { status } = entry.manifest;
  const warnings: string[] = [];
  if (status === 'aborted') throw new LoadError(`run ${entry.runId} is aborted${entry.manifest.reason ? ` (${entry.manifest.reason})` : ''}; aborted runs are never loaded`);
  if (status === 'running') throw new LoadError(`run ${entry.runId} is still running; wait for it or resume it`);
  if (status !== 'complete') {
    if (!opts.allowPartial) throw new LoadError(`run ${entry.runId} is ${status}; pass --allow-partial to load it anyway`);
    warnings.push(`loaded a ${status} run (--allow-partial)`);
  }
  if (entry.failuresBytes > 0) {
    if (!opts.allowPartial) throw new LoadError(`run ${entry.runId} has failures.ndjson rows; pass --allow-partial to load it anyway`);
    warnings.push('failures.ndjson is not empty (--allow-partial)');
  }
  return { entry, warnings };
}

export function flattenManifest(manifest: Manifest): ManifestRow[] {
  return Object.entries(manifest.endpoints).map(([endpoint_id, e]) => ({
    run_id: manifest.runId,
    site: manifest.site,
    endpoint_id,
    state: e.state,
    rows: e.rows,
    bytes: e.bytes,
    started: manifest.startedAt,
    finished: manifest.finishedAt ?? null,
    run_status: manifest.status,
  }));
}

export function substitute(sql: string, cfg: { project: string; dataset: string }): string {
  return sql.replace(/\$\{PROJECT\}/g, cfg.project).replace(/\$\{DS\}/g, cfg.dataset);
}

export function extractViewEndpoints(viewsSql: string | null): string[] {
  if (!viewsSql) return [];
  return [...new Set([...viewsSql.matchAll(/endpoint_id\s*=\s*'([^']+)'/g)].map((m) => m[1]!))];
}

const gsPrefix = (cfg: LoadConfig): string => `gs://${cfg.bucket}/${cfg.site}/${cfg.runId}`;
const bqBase = (cfg: LoadConfig): string[] => [`--location=${cfg.location}`, `--project_id=${cfg.project}`];
const tbl = (cfg: LoadConfig, name: string): string => `\`${cfg.project}.${cfg.dataset}.${name}\``;
const bqId = (cfg: LoadConfig): string => `${cfg.project}:${cfg.dataset}`;

export function bucketCreateCommands(cfg: Pick<LoadConfig, 'bucket' | 'project' | 'location'>): string[] {
  return [
    `gcloud storage buckets create gs://${cfg.bucket} --project=${cfg.project} --location=${cfg.location} --uniform-bucket-level-access --public-access-prevention --soft-delete-duration=0`,
    `gcloud storage buckets update gs://${cfg.bucket} --lifecycle-file=scripts/snapshot/bucket-lifecycle.json`,
  ];
}

export function datasetLabels(cfg: Pick<LoadConfig, 'consentDate' | 'deleteAfter'>): string[] {
  const labels = ['client:roof-doctor', 'sensitivity:pii', `consent_date:${cfg.consentDate}`];
  if (cfg.deleteAfter) labels.push('retention:delete-after-date', `delete_after:${cfg.deleteAfter}`);
  else labels.push('retention:engagement-end');
  return labels;
}

export function checkSql(cfg: LoadConfig): Record<CheckName, string> {
  const rows = tbl(cfg, 'raw_rows');
  const manifest = tbl(cfg, 'raw_manifest');
  const counts = `-- check:counts
SELECT
  COALESCE(m.endpoint_id, r.endpoint_id) AS endpoint_id,
  m.\`rows\` AS manifest_rows,
  COALESCE(r.n, 0) AS loaded,
  COALESCE(r.n, 0) - COALESCE(r.d, 0) AS dup_slots
FROM ${manifest} AS m
FULL OUTER JOIN (
  SELECT endpoint_id, COUNT(*) AS n, COUNT(DISTINCT CONCAT(page_key, '#', CAST(record_index AS STRING))) AS d
  FROM ${rows}
  WHERE record_index >= 0
  GROUP BY endpoint_id
) AS r ON m.endpoint_id = r.endpoint_id
ORDER BY endpoint_id`;
  const integrity = `-- check:integrity
SELECT
  COUNTIF(TO_HEX(SHA256(payload)) != payload_sha256) AS bad_hash,
  COUNT(DISTINCT run_id) AS run_ids,
  COUNT(DISTINCT site) AS sites,
  COUNTIF(site != '${cfg.site}') AS wrong_site,
  COUNT(*) AS total
FROM ${rows}`;
  const ids = `-- check:ids
WITH pages AS (
  SELECT endpoint_id, page_key, COUNT(*) AS c
  FROM ${rows}
  WHERE record_index >= 0
  GROUP BY endpoint_id, page_key
),
multi AS (
  SELECT endpoint_id FROM pages GROUP BY endpoint_id HAVING MAX(c) > 1
)
SELECT
  r.endpoint_id,
  COUNT(*) AS records,
  COUNTIF(JSON_VALUE(SAFE.PARSE_JSON(r.payload, wide_number_mode => 'round'), '$.id') IS NULL) AS missing_id
FROM ${rows} AS r
JOIN multi USING (endpoint_id)
WHERE r.record_index >= 0
GROUP BY r.endpoint_id
HAVING missing_id > 0
ORDER BY r.endpoint_id`;
  const coverage = `-- check:coverage
WITH job_ids AS (
  SELECT DISTINCT JSON_VALUE(SAFE.PARSE_JSON(payload, wide_number_mode => 'round'), '$.id') AS id
  FROM ${rows}
  WHERE endpoint_id = 'jobs' AND record_index >= 0
),
child_eps AS (
  SELECT DISTINCT endpoint_id FROM ${rows} WHERE path_template LIKE '%{jobId}%'
),
seen AS (
  SELECT DISTINCT endpoint_id, REGEXP_EXTRACT(url, r'/jobs?/([^/?#]+)') AS id
  FROM ${rows}
  WHERE path_template LIKE '%{jobId}%'
)
SELECT
  c.endpoint_id,
  COUNT(j.id) AS expected,
  COUNTIF(s.id IS NULL) AS missing,
  ARRAY_AGG(IF(s.id IS NULL, j.id, NULL) IGNORE NULLS LIMIT 20) AS sample
FROM child_eps AS c
CROSS JOIN job_ids AS j
LEFT JOIN seen AS s ON s.endpoint_id = c.endpoint_id AND s.id = j.id
GROUP BY c.endpoint_id
ORDER BY c.endpoint_id`;
  const secrets = `-- check:secrets
SELECT
  (SELECT COUNTIF(REGEXP_CONTAINS(url, r'(?i)[?&](token|access_token|api_key|key|session|sig|signature)=')) FROM ${rows}) AS secret_in_url,
  ARRAY(
    SELECT AS STRUCT endpoint_id, COUNT(*) AS n
    FROM ${rows}
    WHERE REGEXP_CONTAINS(payload, r'(?i)access_token|refresh_token|password|set-cookie')
    GROUP BY endpoint_id
    ORDER BY endpoint_id
  ) AS secret_in_payload`;
  return { counts, integrity, ids, coverage, secrets };
}

const num = (v: unknown): number => (v === null || v === undefined || v === '' ? NaN : Number(v));

export function evaluateChecks(results: CheckInput, opts: { site: string; allowPartial?: boolean; viewEndpoints?: string[] }): Evaluation {
  const warnings: string[] = [];
  const viewEndpoints = opts.viewEndpoints ?? [];

  // A. counts
  const countProblems: string[] = [];
  for (const r of results.counts) {
    const id = String(r.endpoint_id);
    const m = num(r.manifest_rows);
    const n = num(r.loaded);
    const dup = num(r.dup_slots);
    if (Number.isNaN(m)) countProblems.push(`${id}: loaded ${n} rows but the manifest does not list it`);
    else if (n !== m) countProblems.push(`${id}: loaded ${n}, manifest ${m}`);
    if (dup !== 0) countProblems.push(`${id}: ${dup} duplicate page_key#record_index slots`);
  }
  if (results.counts.length === 0) countProblems.push('no endpoints in manifest or rows');
  const counts: CheckResult = {
    pass: countProblems.length === 0,
    summary: countProblems.length === 0 ? `${results.counts.length} endpoints: loaded equals manifest, no duplicate slots` : countProblems.join('; '),
    details: results.counts,
  };

  // B. integrity
  const integ = results.integrity[0] ?? {};
  const integProblems: string[] = [];
  if (num(integ.total) === 0 || Number.isNaN(num(integ.total))) integProblems.push('no rows loaded');
  if (num(integ.bad_hash) !== 0) integProblems.push(`${integ.bad_hash} rows whose SHA-256 differs from payload_sha256`);
  if (num(integ.run_ids) !== 1) integProblems.push(`${integ.run_ids} distinct run_ids (expected 1)`);
  if (num(integ.sites) !== 1 || num(integ.wrong_site) !== 0) integProblems.push(`site mismatch (${integ.sites} sites, ${integ.wrong_site} rows not "${opts.site}")`);
  const integrity: CheckResult = {
    pass: integProblems.length === 0,
    summary: integProblems.length === 0 ? `${integ.total} rows, hashes match, one run_id, one site` : integProblems.join('; '),
    details: integ,
  };

  // C. ids
  const idBlocking: string[] = [];
  for (const r of results.ids) {
    const id = String(r.endpoint_id);
    const msg = `${id}: ${r.missing_id} of ${r.records} records have no $.id`;
    if (viewEndpoints.includes(id)) idBlocking.push(msg);
    else warnings.push(`ids: ${msg}`);
  }
  const ids: CheckResult = {
    pass: idBlocking.length === 0,
    summary: idBlocking.length === 0 ? `${results.ids.length} multi-record endpoints with missing ids, none used by the views` : idBlocking.join('; '),
    details: results.ids,
  };

  // D. coverage (roofr only)
  let coverage: CheckResult;
  if (results.coverage === null) {
    coverage = { pass: true, skipped: true, summary: `not applicable to site ${opts.site}`, details: null };
  } else {
    const missing = results.coverage.filter((r) => num(r.missing) > 0);
    if (results.coverage.length === 0) warnings.push('coverage: no endpoint with {jobId} in its path template was loaded');
    for (const r of missing) warnings.push(`coverage: ${r.endpoint_id} misses ${r.missing} of ${r.expected} job ids (sample ${JSON.stringify(r.sample)})`);
    coverage = {
      pass: missing.length === 0 || opts.allowPartial === true,
      summary:
        missing.length === 0
          ? `${results.coverage.length} per-job endpoints cover every job id`
          : `${missing.length} per-job endpoints miss job ids${opts.allowPartial ? ' (accepted with --allow-partial)' : ''}`,
      details: results.coverage,
    };
  }

  // E. secrets
  const sec = results.secrets[0] ?? {};
  const inUrl = num(sec.secret_in_url);
  const inPayload = Array.isArray(sec.secret_in_payload) ? (sec.secret_in_payload as Row[]) : [];
  for (const p of inPayload) warnings.push(`secrets: ${p.endpoint_id} has ${p.n} payload rows mentioning access_token|refresh_token|password|set-cookie (a person reads them)`);
  const secrets: CheckResult = {
    pass: inUrl === 0,
    summary: inUrl === 0 ? `secret_in_url = 0; ${inPayload.length} endpoints with payload mentions (warning only)` : `secret_in_url = ${inUrl}`,
    details: { secret_in_url: inUrl, secret_in_payload: inPayload },
  };

  const checks = { counts, integrity, ids, coverage, secrets };
  const verdict = Object.values(checks).every((c) => c.pass) ? 'pass' : 'fail';
  return { checks, verdict, warnings };
}

/** Dataset ACL edit: keep user OWNERs, drop project-level special groups, add a READER per viewer. */
export function editAcl(datasetJson: Row, viewers: string[]): Row {
  const access = Array.isArray(datasetJson.access) ? (datasetJson.access as Row[]) : [];
  const dropGroups = new Set(['projectReaders', 'projectWriters', 'projectOwners', 'allAuthenticatedUsers']);
  const lower = viewers.map((v) => v.toLowerCase());
  const kept = access.filter((e) => {
    if (typeof e.specialGroup === 'string' && dropGroups.has(e.specialGroup)) return false;
    if (typeof e.iamMember === 'string' && /^all(Authenticated)?Users$/.test(e.iamMember)) return false;
    if (e.role === 'READER' && typeof e.userByEmail === 'string' && lower.includes(e.userByEmail.toLowerCase())) return false; // re-added below
    return true;
  });
  if (!kept.some((e) => e.role === 'OWNER' && typeof e.userByEmail === 'string')) {
    throw new LoadError('refusing to edit the ACL: no user OWNER entry would remain on the dataset');
  }
  for (const v of viewers) kept.push({ role: 'READER', userByEmail: v });
  return { ...datasetJson, access: kept };
}

export function iamAudit(policy: Row): { role: string; members: string[] }[] {
  const bindings = Array.isArray(policy.bindings) ? (policy.bindings as Row[]) : [];
  return bindings
    .filter((b) => typeof b.role === 'string' && /^roles\/(viewer|editor|owner)$|^roles\/bigquery\./.test(b.role))
    .map((b) => ({ role: String(b.role), members: Array.isArray(b.members) ? (b.members as string[]) : [] }));
}

export interface ReportInput {
  cfg: LoadConfig;
  evaluation: Evaluation;
  jobIds: string[];
  loadedAt: string;
  runWarnings: string[];
  auditWarnings: string[];
}

export function renderReport(i: ReportInput): Row {
  const { cfg, evaluation } = i;
  const openDecisions: string[] = [];
  if (!cfg.deleteAfter) {
    openDecisions.push('Retention: SNAPSHOT_DELETE_AFTER is empty, so the dataset is labelled retention:engagement-end and has no expiry. Decide the deletion date and who deletes the datasets and the bucket.');
  }
  openDecisions.push(
    i.auditWarnings.length > 0
      ? `Inherited project readers: ${i.auditWarnings.length} project-level role(s) can read the dataset regardless of its ACL (see warnings). Accept, trim, or move to a dedicated project.`
      : 'Inherited project readers: audit not collected or none found; confirm with `gcloud projects get-iam-policy` before relying on the dataset ACL.',
  );
  return {
    site: cfg.site,
    run_id: cfg.runId,
    project: cfg.project,
    dataset: cfg.dataset,
    location: cfg.location,
    loaded_at: i.loadedAt,
    consent_date: cfg.consentDate,
    delete_after: cfg.deleteAfter,
    retention: cfg.deleteAfter ? 'delete-after-date' : 'engagement-end',
    bq_job_ids: i.jobIds,
    checks: evaluation.checks,
    verdict: evaluation.verdict,
    warnings: [...i.runWarnings, ...i.auditWarnings, ...evaluation.warnings],
    open_decisions: openDecisions,
  };
}

// ---- command builders

export function preflightCommands(cfg: LoadConfig): Cmd[] {
  return [
    { cmd: 'gcloud', args: ['config', 'get-value', 'project'], phase: 'preflight' },
    { cmd: 'bq', args: [...bqBase(cfg), 'show', '--format=prettyjson', bqId(cfg)], phase: 'preflight', note: 'dataset exists in the location?' },
    {
      cmd: 'bq',
      args: [
        ...bqBase(cfg),
        'mk',
        '--dataset',
        `--location=${cfg.location}`,
        `--description=Consented one-shot account snapshot of ${cfg.site}. Contains PII. Restricted access.`,
        ...datasetLabels(cfg).flatMap((l) => ['--label', l]),
        bqId(cfg),
      ],
      phase: 'preflight',
      note: 'only if the dataset is absent; no default table expiration',
    },
    { cmd: 'gcloud', args: ['storage', 'buckets', 'describe', `gs://${cfg.bucket}`, '--format=json'], phase: 'preflight', note: 'same location, uniform access, public access prevention' },
    { cmd: 'gcloud', args: ['projects', 'get-iam-policy', cfg.project, '--format=json'], phase: 'preflight', note: 'audit of inherited project readers' },
  ];
}

export function uploadCommands(cfg: LoadConfig): Cmd[] {
  const out: Cmd[] = [];
  for (let i = 0; i < cfg.rowFiles.length; i += CP_CHUNK) {
    out.push({ cmd: 'gcloud', args: ['storage', 'cp', ...cfg.rowFiles.slice(i, i + CP_CHUNK), `${gsPrefix(cfg)}/rows/`], phase: 'upload' });
  }
  out.push({ cmd: 'gcloud', args: ['storage', 'cp', cfg.failuresFile, `${gsPrefix(cfg)}/failures/`], phase: 'upload' });
  out.push({ cmd: 'gcloud', args: ['storage', 'cp', cfg.manifestFile, `${gsPrefix(cfg)}/manifest/`], phase: 'upload' });
  return out;
}

export function loadCommands(cfg: LoadConfig): Cmd[] {
  const load = (table: string, schema: string, uri: string, extra: string[] = []): Cmd => ({
    cmd: 'bq',
    args: [
      ...bqBase(cfg),
      'load',
      '--replace',
      '--source_format=NEWLINE_DELIMITED_JSON',
      '--max_bad_records=0',
      `--schema=${fwd(path.join(cfg.schemaDir, schema))}`,
      ...extra,
      `${bqId(cfg)}.${table}`,
      uri,
    ],
    phase: 'load',
  });
  return [
    load('raw_rows', 'raw_rows.schema.json', `${gsPrefix(cfg)}/rows/*.ndjson`, ['--clustering_fields=endpoint_id,page_key']),
    // An empty failures file still loads (zero rows), which truncates any previous content.
    load('raw_failures', 'raw_failures.schema.json', `${gsPrefix(cfg)}/failures/failures.ndjson`),
    load('raw_manifest', 'raw_manifest.schema.json', `${gsPrefix(cfg)}/manifest/manifest.ndjson`),
  ];
}

const queryArgs = (cfg: LoadConfig, json = false): string[] => [...bqBase(cfg), ...(json ? ['--format=json'] : []), 'query', '--use_legacy_sql=false', '--max_rows=100000'];

export function ddlCommands(cfg: LoadConfig): Cmd[] {
  const out: Cmd[] = [{ cmd: 'bq', args: queryArgs(cfg), input: substitute(cfg.ddl, cfg), phase: 'ddl', note: 'scripts/snapshot/ddl.sql' }];
  if (cfg.views) out.push({ cmd: 'bq', args: queryArgs(cfg), input: substitute(cfg.views, cfg), phase: 'ddl', note: `targets/${cfg.site}.views.sql` });
  return out;
}

export function checkCommands(cfg: LoadConfig): Cmd[] {
  const sql = checkSql(cfg);
  const names: CheckName[] = cfg.site === 'roofr' ? ['counts', 'integrity', 'ids', 'coverage', 'secrets'] : ['counts', 'integrity', 'ids', 'secrets'];
  return names.map((n) => ({ cmd: 'bq' as const, args: queryArgs(cfg, true), input: sql[n], phase: 'check' as const, note: n }));
}

export function cleanupCommands(cfg: LoadConfig): Cmd[] {
  return [{ cmd: 'gcloud', args: ['storage', 'rm', '-r', `${gsPrefix(cfg)}/`], phase: 'cleanup', note: 'on pass, unless --keep-bucket' }];
}

export function buildCommands(cfg: LoadConfig): Cmd[] {
  return [...preflightCommands(cfg), ...uploadCommands(cfg), ...loadCommands(cfg), ...ddlCommands(cfg), ...checkCommands(cfg), ...(cfg.keepBucket ? [] : cleanupCommands(cfg))];
}

export function grantCommands(cfg: LoadConfig, aclFile: string): Cmd[] {
  return [
    { cmd: 'bq', args: [...bqBase(cfg), 'show', '--format=prettyjson', bqId(cfg)], phase: 'preflight', note: 'read the dataset ACL' },
    { cmd: 'bq', args: [...bqBase(cfg), 'update', '--source', aclFile, bqId(cfg)], phase: 'preflight', note: 'ACL: owner kept, projectReaders/Writers/Owners removed, READER per viewer' },
    ...cfg.viewers.map((v): Cmd => ({
      cmd: 'gcloud',
      args: ['projects', 'add-iam-policy-binding', cfg.project, `--member=user:${v}`, '--role=roles/bigquery.jobUser', '--condition=None'],
      phase: 'preflight',
    })),
  ];
}

// ---- real exec

export function quoteArg(a: string, platform: string = process.platform): string {
  if (/^[A-Za-z0-9_\-.:/\\=,@+]+$/.test(a)) return a;
  if (platform === 'win32') {
    if (/["%\r\n]/.test(a)) throw new LoadError(`argument cannot be passed safely through cmd.exe: ${a.slice(0, 40)}`);
    return `"${a.endsWith('\\') ? `${a}\\` : a}"`;
  }
  return `'${a.replace(/'/g, `'\\''`)}'`;
}

/** gcloud and bq are .cmd shims on Windows, which Node only runs through a shell; SQL goes on stdin. */
export const realExec: Exec = (cmd, args, opts) =>
  new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let child;
    try {
      child = spawn(cmd, args.map((a) => quoteArg(a)), { shell: true, windowsHide: true, env: { ...process.env, ...opts.env }, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      resolve({ code: 127, stdout, stderr: String(e) });
      return;
    }
    child.stdout.on('data', (d) => (stdout += String(d)));
    child.stderr.on('data', (d) => (stderr += String(d)));
    child.on('error', (e) => resolve({ code: 127, stdout, stderr: stderr + String(e) }));
    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
    child.stdin.on('error', () => undefined);
    child.stdin.end(opts.input ?? '');
  });

// ---- run discovery

export async function readRunEntries(jobsDir: string, site: string): Promise<RunEntry[]> {
  const base = path.join(jobsDir, site, 'snapshots');
  if (!existsSync(base)) return [];
  const out: RunEntry[] = [];
  for (const d of await fs.readdir(base, { withFileTypes: true })) {
    if (!d.isDirectory() || !/^[A-Za-z0-9._-]+$/.test(d.name)) continue;
    let manifest: Manifest | null = null;
    try {
      const m = JSON.parse(await fs.readFile(path.join(base, d.name, 'manifest.json'), 'utf8')) as Manifest;
      if (m && typeof m === 'object' && m.endpoints && typeof m.endpoints === 'object' && typeof m.status === 'string') manifest = m;
    } catch {
      manifest = null;
    }
    let failuresBytes = 0;
    try {
      failuresBytes = (await fs.stat(path.join(base, d.name, 'failures.ndjson'))).size;
    } catch {
      failuresBytes = 0;
    }
    out.push({ runId: d.name, manifest, failuresBytes });
  }
  return out;
}

// ---- orchestration

function parseJson(text: string): unknown {
  const start = text.search(/[[{]/);
  if (start < 0) throw new LoadError(`expected JSON, got: ${text.slice(0, 120)}`);
  return JSON.parse(text.slice(start));
}

function table(rows: string[][]): string {
  const widths = rows[0]!.map((_, c) => Math.max(...rows.map((r) => (r[c] ?? '').length)));
  return rows.map((r) => r.map((cell, c) => cell.padEnd(widths[c]!)).join('  ').trimEnd()).join('\n');
}

function printCmd(log: (s: string) => void, c: Cmd): void {
  const shown = c.args.map((a) => (/[\s()]/.test(a) ? JSON.stringify(a) : a)).join(' ');
  log(`$ ${c.cmd} ${shown}${c.note ? `    # ${c.note}` : ''}`);
  if (c.input) {
    log('  <<SQL');
    for (const line of c.input.split('\n')) log(`  ${line}`);
    log('  SQL');
  }
}

async function buildConfig(args: Args, envCfg: EnvConfig, project: string, runId: string, rowFiles: string[]): Promise<LoadConfig> {
  const dataset = datasetFor(args.site);
  const runDir = fwd(path.resolve(args.jobs, args.site, 'snapshots', runId));
  const tmpDir = fwd(path.join(os.tmpdir(), `snapshot-load-${args.site}-${runId}`));
  const viewsPath = path.join(repoRoot, 'targets', `${args.site}.views.sql`);
  const views = existsSync(viewsPath) ? await fs.readFile(viewsPath, 'utf8') : null;
  const schemaDir = path.join(repoRoot, 'scripts', 'snapshot');
  return {
    site: args.site,
    dataset,
    project,
    location: envCfg.location,
    bucket: envCfg.bucket,
    consentDate: envCfg.consentDate,
    deleteAfter: envCfg.deleteAfter,
    viewers: envCfg.viewers,
    runId,
    runDir,
    tmpDir,
    rowFiles: rowFiles.map((f) => `${runDir}/${f}`),
    failuresFile: `${runDir}/failures.ndjson`,
    manifestFile: `${tmpDir}/manifest.ndjson`,
    schemaDir: fwd(schemaDir),
    ddl: await fs.readFile(path.join(schemaDir, 'ddl.sql'), 'utf8'),
    views,
    viewEndpoints: extractViewEndpoints(views),
    allowPartial: args.allowPartial,
    keepBucket: args.keepBucket,
  };
}

export async function main(argv: string[], deps: Deps = {}): Promise<number> {
  const log = deps.log ?? ((s: string) => console.log(s));
  const now = deps.now ?? (() => new Date());
  try {
    return await run(argv, deps, log, now);
  } catch (e) {
    if (e instanceof LoadError) {
      log(`error: ${e.message}`);
      return 1;
    }
    throw e;
  }
}

async function run(argv: string[], deps: Deps, log: (s: string) => void, now: () => Date): Promise<number> {
  const args = parseArgs(argv);
  if (!deps.env) loadEnv(ENV_KEYS);
  const env = deps.env ?? process.env;
  const envCfg = readEnvConfig(env);
  const exec = deps.exec ?? realExec;
  const dataset = datasetFor(args.site);

  // The run to load: read locally (also under --dry-run, which only reads).
  const entries = await readRunEntries(args.jobs, args.site);
  let runId = '';
  let manifest: Manifest | null = null;
  let runWarnings: string[] = [];
  if (!args.grant) {
    const picked = pickRun(entries, { run: args.run, allowPartial: args.allowPartial });
    runId = picked.entry.runId;
    manifest = picked.entry.manifest;
    runWarnings = picked.warnings;
  }

  let rowFiles: string[] = [];
  if (!args.grant) {
    const dirFiles = await fs.readdir(path.join(args.jobs, args.site, 'snapshots', runId));
    rowFiles = dirFiles.filter((f) => f.endsWith('.ndjson') && f !== 'failures.ndjson' && f !== 'manifest.ndjson').sort();
    if (rowFiles.length === 0) throw new LoadError(`run ${runId} has no endpoint .ndjson files`);
    if (!existsSync(path.join(args.jobs, args.site, 'snapshots', runId, 'failures.ndjson'))) throw new LoadError(`run ${runId} has no failures.ndjson (expected, possibly empty)`);
  }

  // ---- dry run: print the plan, spawn nothing, write nothing
  if (args.dryRun) {
    const project = envCfg.project ?? '<PROJECT>';
    const cfg = await buildConfig(args, envCfg, project, runId || '<RUN_ID>', rowFiles);
    log(`dry run: site=${args.site} run=${runId || '(none, --grant)'} dataset=${dataset} project=${project} location=${envCfg.location}`);
    log('toolchain (not run): gcloud info --format=value(installation.sdk_root); env CLOUDSDK_BQ_PYTHON=<sdk>/platform/bundledpython/python.exe PYTHONUTF8=1 PYTHONIOENCODING=utf-8 CLOUDSDK_CORE_DISABLE_PROMPTS=1; bq version; gcloud auth print-access-token');
    for (const w of runWarnings) log(`warning: ${w}`);
    if (args.grant) {
      if (cfg.viewers.length === 0) throw new LoadError('--grant needs SNAPSHOT_VIEWERS');
      log('');
      for (const c of grantCommands(cfg, '<tmp>/dataset-acl.json')) printCmd(log, c);
      return 0;
    }
    if (manifest) log(`write ${cfg.manifestFile} (${flattenManifest(manifest).length} manifest rows)`);
    log('');
    log('bucket (create by hand if absent; the loader never creates it):');
    for (const l of bucketCreateCommands(cfg)) log(`  ${l}`);
    log('');
    for (const c of buildCommands(cfg)) printCmd(log, c);
    log('');
    log(`write ${fwd(path.join(cfg.runDir, 'load-report.json'))}`);
    return 0;
  }

  // ---- (1) toolchain
  const info = await exec('gcloud', ['info', '--format=value(installation.sdk_root)'], {});
  if (info.code !== 0) throw new LoadError('gcloud not found or failing. Install the Google Cloud SDK and make sure `gcloud info` runs.');
  const sdk = info.stdout.trim().split(/\r?\n/)[0]!.trim();
  const childEnv: Record<string, string> = { PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8', CLOUDSDK_CORE_DISABLE_PROMPTS: '1' };
  if (sdk) childEnv.CLOUDSDK_BQ_PYTHON = `${fwd(sdk)}/platform/bundledpython/python.exe`;
  const sh = (cmd: string, a: string[], input?: string): Promise<ExecResult> => exec(cmd, a, { input, env: childEnv });
  const ver = await sh('bq', ['version']);
  if (ver.code !== 0 || !/BigQuery CLI/.test(ver.stdout + ver.stderr)) {
    throw new LoadError('`bq version` did not print "BigQuery CLI". Fix: set CLOUDSDK_BQ_PYTHON=<sdk>/platform/bundledpython/python.exe (sdk from `gcloud info --format="value(installation.sdk_root)"`) or run bq through bq.cmd; see docs/design/snapshot-landing.md.');
  }

  // ---- (2) auth, token never printed
  const tok = await sh('gcloud', ['auth', 'print-access-token']);
  if (tok.code !== 0 || !tok.stdout.trim()) throw new LoadError('not authenticated: run `gcloud auth login`, then retry.');

  // project
  const gp = await sh('gcloud', ['config', 'get-value', 'project']);
  const active = gp.stdout.trim().split(/\r?\n/).pop()?.trim() ?? '';
  if (gp.code !== 0 || !active || active === '(unset)') throw new LoadError('no active gcloud project: run `gcloud config set project <PROJECT>`.');
  if (envCfg.project && envCfg.project !== active) throw new LoadError(`SNAPSHOT_GCP_PROJECT (${envCfg.project}) differs from the active gcloud project (${active}); fix .env or run gcloud config set project.`);
  const project = envCfg.project ?? active;
  if (!/^[a-z0-9][a-z0-9.:-]{3,}$/.test(project)) throw new LoadError('active gcloud project id is not valid');

  const cfg = await buildConfig(args, envCfg, project, runId || 'grant', rowFiles);
  const jobIds: string[] = [];
  const auditWarnings: string[] = [];

  // ---- --grant
  if (args.grant) {
    if (cfg.viewers.length === 0) throw new LoadError('--grant needs SNAPSHOT_VIEWERS in .env');
    const show = await sh('bq', [...bqBase(cfg), 'show', '--format=prettyjson', bqId(cfg)]);
    if (show.code !== 0) throw new LoadError(`dataset ${cfg.dataset} not readable (${firstLine(show.stderr || show.stdout)}); run the preflight step first.`);
    const edited = editAcl(parseJson(show.stdout) as Row, cfg.viewers);
    await fs.mkdir(cfg.tmpDir, { recursive: true });
    const aclFile = `${cfg.tmpDir}/dataset-acl.json`;
    await fs.writeFile(aclFile, JSON.stringify(edited, null, 2), 'utf8');
    try {
      const cmds = grantCommands(cfg, aclFile);
      for (const c of cmds.slice(1)) {
        const r = await sh(c.cmd, c.args, c.input);
        if (r.code !== 0) throw new LoadError(`${c.note ?? c.args.join(' ')} failed: ${firstLine(r.stderr || r.stdout)}`);
      }
    } finally {
      await fs.rm(cfg.tmpDir, { recursive: true, force: true });
    }
    log(`ACL updated on ${cfg.dataset}: ${cfg.viewers.length} READER(s) added, project groups removed; jobUser granted.`);
    return 0;
  }

  // ---- (4) preflight
  log(`run ${cfg.runId} (${manifest!.status}) -> ${project}:${cfg.dataset} in ${cfg.location}`);
  for (const w of runWarnings) log(`warning: ${w}`);
  const show = await sh('bq', preflightCommands(cfg)[1]!.args);
  if (show.code === 0) {
    const loc = String((parseJson(show.stdout) as Row).location ?? '');
    if (loc.toLowerCase() !== cfg.location) throw new LoadError(`dataset ${cfg.dataset} is in ${loc}, expected ${cfg.location}`);
    log(`dataset ${cfg.dataset}: exists in ${loc}`);
  } else if (/not found/i.test(show.stderr + show.stdout)) {
    const mk = await sh('bq', preflightCommands(cfg)[2]!.args);
    if (mk.code !== 0) throw new LoadError(`bq mk failed: ${firstLine(mk.stderr || mk.stdout)}`);
    log(`dataset ${cfg.dataset}: created in ${cfg.location} (labels: ${datasetLabels(cfg).join(', ')})`);
  } else {
    throw new LoadError(`bq show failed: ${firstLine(show.stderr || show.stdout)}`);
  }

  const bk = await sh('gcloud', preflightCommands(cfg)[3]!.args);
  if (bk.code !== 0) {
    log(`bucket gs://${cfg.bucket} is missing or unreadable (${firstLine(bk.stderr || bk.stdout)}). Create it by hand, then rerun:`);
    for (const l of bucketCreateCommands(cfg)) log(`  ${l}`);
    return 1;
  }
  const bucket = parseJson(bk.stdout) as Row;
  const problems = bucketProblems(bucket, cfg.location);
  if (problems.length > 0) throw new LoadError(`bucket gs://${cfg.bucket}: ${problems.join('; ')}`);
  log(`bucket gs://${cfg.bucket}: ${cfg.location}, uniform access, public access prevention enforced`);

  const pol = await sh('gcloud', preflightCommands(cfg)[4]!.args);
  if (pol.code === 0) {
    for (const b of iamAudit(parseJson(pol.stdout) as Row)) auditWarnings.push(`inherited access: ${b.role} -> ${b.members.join(', ') || '(none)'}`);
    for (const w of auditWarnings) log(`audit: ${w}`);
  } else {
    auditWarnings.push('inherited access: could not read the project IAM policy; audit it by hand');
    log(`audit: ${auditWarnings[0]}`);
  }
  if (args.step === 'preflight') return 0;

  const wants = (s: Step): boolean => args.step === 'all' || args.step === s;

  // ---- (5)+(6) flatten and upload
  if (wants('upload')) {
    await fs.mkdir(cfg.tmpDir, { recursive: true });
    await fs.writeFile(cfg.manifestFile, flattenManifest(manifest!).map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
    for (const c of uploadCommands(cfg)) {
      const r = await sh(c.cmd, c.args);
      if (r.code !== 0) throw new LoadError(`upload failed: ${firstLine(r.stderr || r.stdout)}`);
    }
    log(`uploaded ${cfg.rowFiles.length} row files, failures and manifest to ${gsPrefix(cfg)}/`);
  }

  // ---- (7)+(8) load, DDL, views
  if (wants('load')) {
    for (const c of loadCommands(cfg)) {
      const r = await sh(c.cmd, c.args);
      if (r.code !== 0) throw new LoadError(`bq load failed (${c.args[c.args.length - 2]}): ${firstLine(r.stderr || r.stdout)}`);
      for (const m of (r.stdout + r.stderr).matchAll(/bqjob_[A-Za-z0-9_]+/g)) if (!jobIds.includes(m[0])) jobIds.push(m[0]);
    }
    for (const c of ddlCommands(cfg)) {
      const r = await sh(c.cmd, c.args, c.input);
      if (r.code !== 0) throw new LoadError(`${c.note} failed: ${firstLine(r.stderr || r.stdout)}`);
    }
    log(`loaded raw_rows, raw_failures, raw_manifest; DDL${cfg.views ? ' and views' : ''} applied (${jobIds.length} load jobs)`);
    if (!cfg.views) log(`warning: targets/${cfg.site}.views.sql not found; no entity views created`);
  }

  if (!wants('verify')) return 0;

  // ---- (9) verify
  const sql = checkSql(cfg);
  const results: CheckInput = { counts: [], integrity: [], ids: [], coverage: null, secrets: [] };
  const order: CheckName[] = cfg.site === 'roofr' ? ['counts', 'integrity', 'ids', 'coverage', 'secrets'] : ['counts', 'integrity', 'ids', 'secrets'];
  for (const name of order) {
    const r = await sh('bq', queryArgs(cfg, true), sql[name]);
    if (r.code !== 0) throw new LoadError(`check ${name} failed to run: ${firstLine(r.stderr || r.stdout)}`);
    const rows = parseJson(r.stdout) as Row[];
    if (name === 'coverage') results.coverage = rows;
    else results[name] = rows;
  }
  const evaluation = evaluateChecks(results, { site: cfg.site, allowPartial: cfg.allowPartial, viewEndpoints: cfg.viewEndpoints });

  log('');
  log(table([['endpoint', 'manifest', 'loaded', 'dup_slots', 'ok'], ...results.counts.map((r) => [String(r.endpoint_id), String(r.manifest_rows ?? '-'), String(r.loaded), String(r.dup_slots), num(r.manifest_rows) === num(r.loaded) && num(r.dup_slots) === 0 ? 'yes' : 'NO'])]));
  log('');
  for (const [name, c] of Object.entries(evaluation.checks)) log(`${c.pass ? 'PASS' : 'FAIL'}${c.skipped ? ' (skipped)' : ''}  ${name}: ${c.summary}`);
  for (const w of evaluation.warnings) log(`warning: ${w}`);

  // ---- (10) report
  const report = renderReport({ cfg, evaluation, jobIds, loadedAt: now().toISOString(), runWarnings, auditWarnings });
  const reportPath = path.join(cfg.runDir, 'load-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
  log(`verdict: ${evaluation.verdict}; report: ${reportPath}`);

  // ---- (11) cleanup
  if (evaluation.verdict === 'pass') {
    if (!cfg.keepBucket) {
      const rm = await sh('gcloud', cleanupCommands(cfg)[0]!.args);
      log(rm.code === 0 ? `removed ${gsPrefix(cfg)}/` : `warning: could not remove ${gsPrefix(cfg)}/ (${firstLine(rm.stderr)}); delete it by hand`);
    }
    await fs.rm(cfg.tmpDir, { recursive: true, force: true });
    return 0;
  }
  return 1;
}

const firstLine = (s: string): string => s.trim().split(/\r?\n/)[0]?.slice(0, 200) ?? '';

function dig(o: Row, ...paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = o;
    for (const k of p.split('.')) cur = cur && typeof cur === 'object' ? (cur as Row)[k] : undefined;
    if (cur !== undefined) return cur;
  }
  return undefined;
}

export function bucketProblems(bucket: Row, location: string): string[] {
  const problems: string[] = [];
  const loc = String(dig(bucket, 'location') ?? '').toLowerCase();
  if (loc !== location) problems.push(`location is ${loc || 'unknown'}, expected ${location}`);
  const uniform = dig(bucket, 'uniform_bucket_level_access', 'uniformBucketLevelAccess', 'iamConfiguration.uniformBucketLevelAccess.enabled');
  if (uniform !== true) problems.push('uniform bucket-level access is not enabled');
  const pap = dig(bucket, 'public_access_prevention', 'publicAccessPrevention', 'iamConfiguration.publicAccessPrevention');
  if (String(pap ?? '').toLowerCase() !== 'enforced') problems.push('public access prevention is not enforced');
  return problems;
}

const invokedDirectly = process.argv[1]?.endsWith('snapshot-load.ts') || process.argv[1]?.endsWith('snapshot-load.js');
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
