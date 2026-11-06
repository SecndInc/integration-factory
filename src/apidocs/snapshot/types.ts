// Schemas for the snapshot stage: the per-site plan, the NDJSON rows, progress and manifest.
// Pure: no I/O. The plan is committed (no account values); the rest lives under jobs/.
import { z } from 'zod';

const slug = /^[a-z0-9][a-z0-9-]*$/;
const sha256Hex = /^[0-9a-f]{64}$/;
const headerNameRe = /^[a-z0-9][a-z0-9-]*$/;
const valueNameRe = /^[A-Za-z][A-Za-z0-9_-]*$/;

/** Literal text put before a resolved value, e.g. "Bearer " for a page that stores a bare token. */
const prefix = z.string().min(1).optional();

export const HeaderRuleSchema = z.union([
  z.strictObject({ literal: z.string() }),
  z.strictObject({ fromCookie: z.string().min(1), origin: z.string().min(1), decode: z.literal('uri').optional(), prefix }),
  z.strictObject({ fromResponse: z.strictObject({ endpoint: z.string().min(1), path: z.string().min(1) }), prefix }),
  z.strictObject({ fromPageResponse: z.strictObject({ origin: z.string().min(1), urlPattern: z.string().min(1), path: z.string().min(1) }), prefix }),
  z.strictObject({ fromStorage: z.strictObject({ origin: z.string().min(1), area: z.enum(['local', 'session']), keyPattern: z.string().min(1) }), prefix }),
]);
export type HeaderRule = z.infer<typeof HeaderRuleSchema>;

export const PaginatorSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('none') }),
  z.strictObject({ kind: z.literal('laravel-meta'), pageParam: z.string().min(1), perPageParam: z.string().optional(), perPage: z.number().int().positive().optional() }),
  z.strictObject({ kind: z.literal('laravel-flat'), pageParam: z.string().min(1), perPageParam: z.string().optional(), perPage: z.number().int().positive().optional() }),
  z.strictObject({ kind: z.literal('cursor'), cursorParam: z.string().min(1), nextPath: z.string().min(1), perPageParam: z.string().optional(), perPage: z.number().int().positive().optional() }),
  z.strictObject({ kind: z.literal('datatables'), pageParam: z.string().min(1), length: z.number().int().positive().optional(), totalPath: z.string().min(1), recordsPath: z.string().min(1) }),
]);
export type Paginator = z.infer<typeof PaginatorSchema>;

export const QueryValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.strictObject({ fromId: z.string().min(1) }),
  z.strictObject({ fromRange: z.enum(['start', 'end', 'pipe']) }),
  z.strictObject({ computed: z.literal('uuid') }),
  /** A named value from `plan.values`, resolved lazily per run like a header; it reaches only the request URL. */
  z.strictObject({ fromValue: z.string().min(1) }),
]);
export type QueryValue = z.infer<typeof QueryValueSchema>;

export const RangeSchema = z.strictObject({
  months: z.number().int().positive().optional(),
  param: z.string().optional(),
  startParam: z.string().optional(),
  endParam: z.string().optional(),
  format: z.enum(['iso-date', 'iso-datetime', 'daterange-pipe']),
});
export type RangeSpec = z.infer<typeof RangeSchema>;

export const EndpointPlanSchema = z.strictObject({
  id: z.string().regex(slug, 'id must match /^[a-z0-9][a-z0-9-]*$/'),
  docId: z.string().optional(),
  origin: z.string().min(1),
  method: z.literal('GET'),
  path: z.string().startsWith('/'),
  query: z.record(z.string(), QueryValueSchema).optional(),
  pathParams: z.record(z.string(), z.strictObject({ fromId: z.string().min(1) })).optional(),
  headers: z.array(z.string()).optional(),
  paginator: PaginatorSchema,
  records: z.string().optional(),
  total: z.string().optional(),
  range: RangeSchema.optional(),
  group: z.string().min(1),
  perId: z.enum(['core', 'full']).optional(),
  expect404: z.boolean().optional(),
  skip: z.string().optional(),
  yields: z.record(z.string(), z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
});
export type EndpointPlan = z.infer<typeof EndpointPlanSchema>;

/** A query value read from a widget definition: a JSON path relative to the definition (`$.metadata.x`). */
export const WidgetQuerySourceSchema = z.strictObject({
  path: z.string().min(1),
  /** The path selects several scalars (an array of strings): join them with this. Absent: the first scalar. */
  join: z.string().optional(),
});
export type WidgetQuerySource = z.infer<typeof WidgetQuerySourceSchema>;

export const WidgetRulesSchema = z.strictObject({
  /** Id name (in `plan.ids`) of the dashboards the widgets belong to. */
  dashIdsFrom: z.string().min(1),
  /** `widget` takes every widget. `service` / `category` are optional routes, used only when the matching id path is set and finds a value. */
  endpointTemplate: z.strictObject({ widget: z.string().min(1), service: z.string().min(1).optional(), category: z.string().min(1).optional() }),
  /** Definition-relative paths that select the service / category route (optional, see `endpointTemplate`). */
  serviceIdPath: z.string().min(1).optional(),
  categoryIdPath: z.string().min(1).optional(),
  /** Query parameter that carries the widget id, and the one that carries the dashboard id. */
  widgetIdParam: z.string().min(1),
  pageIdParam: z.string().min(1),
  literals: z.record(z.string(), z.string()),
  /** Query parameter name to where in the widget definition its value lives. Applied over `literals`; a path that finds nothing leaves the parameter out. */
  queryFromWidget: z.record(z.string(), WidgetQuerySourceSchema).optional(),
});
export type WidgetRules = z.infer<typeof WidgetRulesSchema>;

const IdSourceSchema = z.strictObject({
  endpoint: z.string().min(1),
  path: z.string().min(1),
  fallbackLiterals: z.array(z.union([z.string(), z.number()])).optional(),
});

export const SnapshotPlanSchema = z
  .strictObject({
    planVersion: z.literal(1),
    site: z.string().min(1),
    origins: z.record(z.string(), z.string().url()),
    tabFor: z.record(z.string(), z.string().min(1)),
    loginPaths: z.array(z.string()),
    probe: z.record(z.string(), z.string().startsWith('/')),
    headers: z.record(z.string(), HeaderRuleSchema),
    /** Named values for query parameters (`{ fromValue }`); same rule kinds as headers. */
    values: z.record(z.string(), HeaderRuleSchema).optional(),
    ids: z.record(z.string(), IdSourceSchema),
    widgetRules: WidgetRulesSchema.optional(),
    endpoints: z.array(EndpointPlanSchema).min(1),
  })
  .superRefine((plan, ctx) => {
    const issue = (message: string, path: (string | number)[] = []) => ctx.addIssue({ code: 'custom', message, path });
    const origins = new Set(Object.keys(plan.origins));
    const headerNames = new Set(Object.keys(plan.headers));
    const valueNames = new Set(Object.keys(plan.values ?? {}));
    const idNames = new Set(Object.keys(plan.ids));
    const endpointIds = new Set(plan.endpoints.map((e) => e.id));
    const seen = new Set<string>();
    const used = new Set<string>();
    plan.endpoints.forEach((ep, i) => {
      if (seen.has(ep.id)) issue(`duplicate endpoint id "${ep.id}"`, ['endpoints', i, 'id']);
      seen.add(ep.id);
      if (!origins.has(ep.origin)) issue(`endpoint "${ep.id}" uses unknown origin "${ep.origin}"`, ['endpoints', i, 'origin']);
      used.add(ep.origin);
      for (const h of ep.headers ?? []) if (!headerNames.has(h)) issue(`endpoint "${ep.id}" uses header "${h}" not in plan.headers`, ['endpoints', i, 'headers']);
      for (const [k, v] of Object.entries(ep.query ?? {})) {
        if (typeof v === 'object' && 'fromId' in v && !idNames.has(v.fromId)) issue(`endpoint "${ep.id}" query "${k}" uses unknown id "${v.fromId}"`, ['endpoints', i, 'query', k]);
        if (typeof v === 'object' && 'fromValue' in v && !valueNames.has(v.fromValue)) issue(`endpoint "${ep.id}" query "${k}" uses unknown value "${v.fromValue}"`, ['endpoints', i, 'query', k]);
      }
      for (const [k, v] of Object.entries(ep.pathParams ?? {})) {
        if (!idNames.has(v.fromId)) issue(`endpoint "${ep.id}" pathParam "${k}" uses unknown id "${v.fromId}"`, ['endpoints', i, 'pathParams', k]);
      }
      for (const d of ep.dependsOn ?? []) if (!endpointIds.has(d)) issue(`endpoint "${ep.id}" dependsOn unknown endpoint "${d}"`, ['endpoints', i, 'dependsOn']);
    });
    for (const o of used) if (origins.has(o) && !plan.probe[o]) issue(`origin "${o}" is used but has no probe`, ['probe']);
    for (const o of Object.keys(plan.probe)) if (!origins.has(o)) issue(`probe names unknown origin "${o}"`, ['probe', o]);
    for (const o of Object.keys(plan.tabFor)) if (!origins.has(o)) issue(`tabFor names unknown origin "${o}"`, ['tabFor', o]);
    for (const [name, src] of Object.entries(plan.ids)) {
      if (!endpointIds.has(src.endpoint)) issue(`id "${name}" comes from unknown endpoint "${src.endpoint}"`, ['ids', name, 'endpoint']);
    }
    const checkRule = (kind: 'headers' | 'values', name: string, rule: HeaderRule) => {
      const what = kind === 'headers' ? 'header' : 'value';
      if ('fromResponse' in rule && !endpointIds.has(rule.fromResponse.endpoint)) issue(`${what} "${name}" comes from unknown endpoint "${rule.fromResponse.endpoint}"`, [kind, name]);
      if ('fromCookie' in rule && !origins.has(rule.origin)) issue(`${what} "${name}" reads a cookie on unknown origin "${rule.origin}"`, [kind, name]);
      if ('fromPageResponse' in rule && !origins.has(rule.fromPageResponse.origin)) issue(`${what} "${name}" captures from unknown origin "${rule.fromPageResponse.origin}"`, [kind, name]);
      if ('fromStorage' in rule && !origins.has(rule.fromStorage.origin)) issue(`${what} "${name}" reads storage on unknown origin "${rule.fromStorage.origin}"`, [kind, name]);
    };
    for (const [name, rule] of Object.entries(plan.headers)) {
      // The key is the HTTP header name the runner sends.
      if (!headerNameRe.test(name)) issue(`header name "${name}" must be lowercase letters, digits and hyphens (it is sent as the HTTP header name)`, ['headers', name]);
      checkRule('headers', name, rule);
    }
    for (const [name, rule] of Object.entries(plan.values ?? {})) {
      if (!valueNameRe.test(name)) issue(`value name "${name}" must match ${valueNameRe}`, ['values', name]);
      checkRule('values', name, rule);
    }
    const wr = plan.widgetRules;
    if (wr) {
      if (!idNames.has(wr.dashIdsFrom)) issue(`widgetRules.dashIdsFrom names unknown id "${wr.dashIdsFrom}"`, ['widgetRules']);
      for (const [kind, id] of Object.entries(wr.endpointTemplate)) {
        if (id !== undefined && !endpointIds.has(id)) issue(`widgetRules.endpointTemplate.${kind} names unknown endpoint "${id}"`, ['widgetRules', 'endpointTemplate', kind]);
      }
      if (wr.endpointTemplate.service && !wr.serviceIdPath) issue('widgetRules.endpointTemplate.service needs widgetRules.serviceIdPath', ['widgetRules']);
      if (wr.endpointTemplate.category && !wr.categoryIdPath) issue('widgetRules.endpointTemplate.category needs widgetRules.categoryIdPath', ['widgetRules']);
    }
  });
export type SnapshotPlan = z.infer<typeof SnapshotPlanSchema>;

export const SnapshotRowSchema = z.strictObject({
  run_id: z.string().min(1),
  site: z.string().min(1),
  endpoint_id: z.string().min(1),
  method: z.string().min(1),
  path_template: z.string(),
  url: z.string(),
  fetched_at: z.string().datetime(),
  status: z.number().int(),
  page_key: z.string(),
  record_index: z.number().int().min(-1),
  payload: z.string(),
  payload_sha256: z.string().regex(sha256Hex),
});
export type SnapshotRow = z.infer<typeof SnapshotRowSchema>;

export const FailureRowSchema = z.strictObject({
  run_id: z.string().min(1),
  site: z.string().min(1),
  endpoint_id: z.string().min(1),
  method: z.string().min(1),
  path_template: z.string(),
  url: z.string(),
  fetched_at: z.string().datetime(),
  status: z.number().int(),
  page_key: z.string(),
  record_index: z.null(),
  payload_sha256: z.null(),
  error: z.string(),
});
export type FailureRow = z.infer<typeof FailureRowSchema>;

export const endpointStates = ['pending', 'running', 'complete', 'partial', 'failed', 'skipped', 'expected-404'] as const;
export type EndpointState = (typeof endpointStates)[number];

export const ProgressSchema = z.strictObject({
  progressVersion: z.literal(1),
  runId: z.string().min(1),
  endpoints: z.record(
    z.string(),
    z.strictObject({
      status: z.enum(endpointStates),
      acked: z.array(z.string()),
      rows: z.number().int().min(0),
      total: z.number().optional(),
      cursor: z.string().nullable().optional(),
      /** Series of this endpoint that stated a total, and how many matched; replaced (not added to) whenever the endpoint reruns. */
      totals: z.strictObject({ stated: z.number().int().min(0), matched: z.number().int().min(0) }).optional(),
    }),
  ),
  ids: z.record(z.string(), z.array(z.string())),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const ManifestSchema = z.strictObject({
  manifestVersion: z.literal(1),
  runId: z.string().min(1),
  site: z.string().min(1),
  planSha256: z.string().regex(sha256Hex),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: z.enum(['running', 'complete', 'partial', 'aborted']),
  reason: z.string().optional(),
  counts: z.strictObject({
    endpointsPlanned: z.number().int(),
    complete: z.number().int(),
    partial: z.number().int(),
    failed: z.number().int(),
    skipped: z.number().int(),
    requests: z.number().int(),
    retries: z.number().int(),
    http429: z.number().int(),
    rows: z.number().int(),
    bytes: z.number().int(),
    totalsMatched: z.number().int(),
    totalsStated: z.number().int(),
    probeAliveAtEnd: z.boolean(),
  }),
  endpoints: z.record(
    z.string(),
    z.strictObject({
      state: z.enum(endpointStates),
      rows: z.number().int(),
      bytes: z.number().int(),
      pages: z.number().int(),
      total: z.number().optional(),
    }),
  ),
});
export type Manifest = z.infer<typeof ManifestSchema>;
