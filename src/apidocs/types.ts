// The shared schema for src/apidocs. Every record that crosses a file boundary or a process
// boundary is declared here with Zod and parsed on read. Design: docs/design/api-docs.md §3.
//
// Three groups:
//   1. Workflow specs      what a person or the navigator is asked to do (committed JSON)
//   2. Trace lines         the durable event log the recorder appends (private job area)
//   3. Assembled trace     the tree `assemble()` folds from the lines, and the doc derived from it
//
// Rules: ids are branded; CDP params stay `unknown` in the line schema and are parsed by the
// narrow schemas in trace.ts; renderers accept only `ApiDoc`, whose examples are `Redacted`.

import { z } from 'zod';
import type { Redacted } from './redact.js';

// ---------------------------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------------------------

declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

/** kebab-case of the target name; safe in a file name. */
export type SiteId = Brand<string, 'SiteId'>;
export type WorkflowId = Brand<string, 'WorkflowId'>;
export type StepId = Brand<string, 'StepId'>;
/** `<iso-compact>-<hex4>`; sorts by start time. */
export type RunId = Brand<string, 'RunId'>;
/** CDP session id as the browser issued it. */
export type SessionId = Brand<string, 'SessionId'>;
/** `<sessionId>:<requestId>:<hop>`; stable across re-assembly. */
export type ExchangeId = Brand<string, 'ExchangeId'>;
/** `<METHOD> <host><pathTemplate>` or `<METHOD> <host>/graphql#<operation>`. */
export type EndpointId = Brand<string, 'EndpointId'>;

const slug = z.string().regex(/^[a-z][a-z0-9-]{0,47}$/, 'slug: lowercase letters, digits, dashes');

// ---------------------------------------------------------------------------------------------
// 1. Workflow specs
// ---------------------------------------------------------------------------------------------

export const InputSpecSchema = z.object({
  name: slug,
  kind: z.enum(['text', 'number', 'file', 'choice']),
  example: z.string().optional(),
  /** Never shown; its value is redacted wherever it appears. */
  secret: z.boolean().default(false),
});
export type InputSpec = z.infer<typeof InputSpecSchema>;

export const StepSpecSchema = z.object({
  id: slug.transform((s) => s as StepId),
  /** The instruction a person reads, and the goal the navigator pursues. */
  do: z.string().min(1),
  hints: z.array(z.string()).default([]),
  /** `network` steps with zero exchanges are flagged on the page. */
  expect: z.enum(['url', 'network', 'ui']).default('network'),
  /** Names of declared inputs this step uses. */
  uses: z.array(slug).default([]),
  /** Confirmation buttons this step presses, for write workflows. Labelled on the page. */
  confirms: z.array(z.string()).default([]),
});
export type StepSpec = z.infer<typeof StepSpecSchema>;

export const WorkflowSchema = z
  .object({
    workflowVersion: z.literal(1),
    id: slug.transform((s) => s as WorkflowId),
    name: z.string().min(1),
    goal: z.string().min(1),
    effect: z.enum(['read', 'write']),
    /** Workflow that undoes this one. Required before a write workflow is derived. */
    inverse: slug.optional(),
    preconditions: z.array(z.string()).default([]),
    inputs: z.array(InputSpecSchema).default([]),
    /** Only on a `login` workflow: how the session is established. */
    verification: z.enum(['password', 'code', 'passkey', 'sso']).optional(),
    steps: z.array(StepSpecSchema).min(1),
  })
  .refine((w) => new Set(w.steps.map((s) => s.id)).size === w.steps.length, {
    message: 'step ids must be unique',
    path: ['steps'],
  });
export type Workflow = z.infer<typeof WorkflowSchema>;

// ---------------------------------------------------------------------------------------------
// 2. Trace lines (the durable record; one JSON object per line; `seq` from the single writer)
// ---------------------------------------------------------------------------------------------

export const driverKinds = ['human', 'playwright', 'navigator'] as const;
export type DriverKind = (typeof driverKinds)[number];

export const browserKinds = ['local', 'browserbase', 'attached'] as const;
export type BrowserKind = (typeof browserKinds)[number];

export const runOutcomes = [
  'completed',
  'failed',
  'interrupted',
  'sign_in_failed',
  'challenge_unresolved',
  'site_unavailable',
  'rate_limited',
  'owner_ended',
] as const;
export type RunOutcome = (typeof runOutcomes)[number];

export const stepOutcomes = ['ok', 'failed', 'skipped', 'interrupted'] as const;
export type StepOutcome = (typeof stepOutcomes)[number];

const isoDate = z.string().datetime({ offset: true });

export const RunLineSchema = z.object({
  kind: z.literal('run'),
  traceVersion: z.literal(1),
  runId: z.string().transform((s) => s as RunId),
  site: z.string().transform((s) => s as SiteId),
  driver: z.enum(driverKinds),
  workflowId: z.string().transform((s) => s as WorkflowId).optional(),
  startedAt: isoDate,
  browser: z.object({ kind: z.enum(browserKinds), version: z.string() }),
  scope: z.object({ hosts: z.array(z.string()).min(1) }),
  bodies: z.object({ maxBytes: z.number().int().positive(), hold: z.boolean() }),
});

export const TargetLineSchema = z.object({
  kind: z.literal('target'),
  seq: z.number().int(),
  at: isoDate,
  event: z.enum(['attached', 'detached']),
  sessionId: z.string().transform((s) => s as SessionId),
  targetId: z.string(),
  type: z.string(),
  url: z.string(),
  openerId: z.string().optional(),
});

export const StepLineSchema = z.object({
  kind: z.literal('step'),
  seq: z.number().int(),
  at: isoDate,
  phase: z.enum(['begin', 'end']),
  id: z.string().transform((s) => s as StepId),
  index: z.number().int().nonnegative(),
  text: z.string().optional(),
  outcome: z.enum(['ok', 'failed', 'skipped']).optional(),
  note: z.string().optional(),
});

export const ActionLineSchema = z.object({
  kind: z.literal('action'),
  seq: z.number().int(),
  at: isoDate,
  stepId: z.string().transform((s) => s as StepId),
  action: z.string(),
  detail: z.string(),
  url: z.string().optional(),
});

export const CookieSchema = z.object({
  name: z.string(),
  value: z.string(),
  domain: z.string(),
  path: z.string(),
  httpOnly: z.boolean(),
  secure: z.boolean(),
  sameSite: z.string().optional(),
});
export type Cookie = z.infer<typeof CookieSchema>;

export const SnapshotLineSchema = z.object({
  kind: z.literal('snapshot'),
  seq: z.number().int(),
  at: isoDate,
  stepId: z.string().transform((s) => s as StepId),
  cookies: z.array(CookieSchema),
  storage: z.array(
    z.object({
      origin: z.string(),
      local: z.record(z.string(), z.string()),
      session: z.record(z.string(), z.string()),
    }),
  ),
});

/** A raw `Network.*` or `Fetch.*` event, verbatim. `params` is parsed by trace.ts, never here. */
export const CdpLineSchema = z.object({
  kind: z.literal('cdp'),
  seq: z.number().int(),
  at: isoDate,
  sessionId: z.string().transform((s) => s as SessionId),
  method: z.string(),
  params: z.unknown(),
});

export const bodyStates = ['ok', 'evicted', 'too-large', 'error'] as const;

export const BodyLineSchema = z.object({
  kind: z.literal('body'),
  seq: z.number().int(),
  at: isoDate,
  sessionId: z.string().transform((s) => s as SessionId),
  requestId: z.string(),
  side: z.enum(['request', 'response']),
  source: z.enum(['network', 'fetch']),
  state: z.enum(bodyStates),
  /** Exactly one of text, base64, entries is present when state is `ok`. */
  text: z.string().optional(),
  base64: z.string().optional(),
  /** `postDataEntries` as CDP gave them; an entry without `bytes` is a file element. */
  entries: z.array(z.object({ bytes: z.string().optional() })).optional(),
  bytes: z.number().int().nonnegative(),
  truncated: z.boolean().optional(),
  error: z.string().optional(),
});

export const CountsSchema = z.object({
  targets: z.number().int(),
  exchanges: z.number().int(),
  inScope: z.number().int(),
  bodies: z.object({
    ok: z.number().int(),
    skipped: z.number().int(),
    evicted: z.number().int(),
    tooLarge: z.number().int(),
    error: z.number().int(),
  }),
  attribution: z.object({
    inStep: z.number().int(),
    betweenSteps: z.number().int(),
    beforeFirstStep: z.number().int(),
    orphanEvents: z.number().int(),
  }),
  inflightAtEnd: z.number().int(),
});
export type Counts = z.infer<typeof CountsSchema>;

export const EndLineSchema = z.object({
  kind: z.literal('end'),
  seq: z.number().int(),
  at: isoDate,
  reason: z.enum(['closed', 'browser-closed', 'error']),
  outcome: z.enum(runOutcomes),
  counts: CountsSchema,
});

export const TraceLineSchema = z.discriminatedUnion('kind', [
  RunLineSchema,
  TargetLineSchema,
  StepLineSchema,
  ActionLineSchema,
  SnapshotLineSchema,
  CdpLineSchema,
  BodyLineSchema,
  EndLineSchema,
]);
export type TraceLine = z.infer<typeof TraceLineSchema>;
export type RunLine = z.infer<typeof RunLineSchema>;
export type TargetLine = z.infer<typeof TargetLineSchema>;
export type StepLine = z.infer<typeof StepLineSchema>;
export type ActionLine = z.infer<typeof ActionLineSchema>;
export type SnapshotLine = z.infer<typeof SnapshotLineSchema>;
export type CdpLine = z.infer<typeof CdpLineSchema>;
export type BodyLine = z.infer<typeof BodyLineSchema>;
export type EndLine = z.infer<typeof EndLineSchema>;

/** A line that failed its schema is kept, so counts stay honest. */
export interface BadLine {
  kind: 'bad';
  seq: number;
  raw: string;
  error: string;
}

// ---------------------------------------------------------------------------------------------
// 3. Assembled trace (pure output of assemble()) and the derived doc
// ---------------------------------------------------------------------------------------------

export type Header = readonly [name: string, value: string];
/** Wire order, duplicates kept, names as sent. */
export type Headers = readonly Header[];

export type Body =
  | { encoding: 'text'; text: string; bytes: number; truncated: boolean }
  | { encoding: 'base64'; base64: string; bytes: number; truncated: boolean }
  | { encoding: 'multipart'; boundary: string; parts: readonly MultipartPart[]; bytes: number };

export interface MultipartPart {
  headers: Headers;
  name?: string;
  filename?: string;
  contentType?: string;
  /** CDP never carries the bytes of a file-backed part. */
  content: { text: string } | { base64: string } | { omitted: 'file' };
}

export interface Initiator {
  type: string; // parser | script | preflight | redirect | other
  url?: string;
  lineNumber?: number;
  /** Top frame of the stack when CDP gave one. */
  stackTop?: { url: string; functionName: string; lineNumber: number };
}

export interface WebSocketFrame {
  direction: 'sent' | 'received';
  opcode: number;
  payload: string; // text for opcode 1, base64 for 2
  at: string;
}

export type ExchangeOutcome = 'completed' | 'failed' | 'inflight' | 'aborted';
export type BodyState = 'ok' | 'skipped' | 'evicted' | 'too-large' | 'lost';

export interface Exchange {
  id: ExchangeId;
  seq: number;
  stepId?: StepId;
  actionSeq?: number;
  target: { sessionId: SessionId; type: string; url: string; openerId?: string };
  resourceType: string; // CDP ResourceType: Document, XHR, Fetch, Script, ... , WebSocket, EventSource
  initiator: Initiator;
  request: {
    method: string;
    url: string;
    host: string;
    path: string;
    query: readonly (readonly [string, string])[];
    headers: Headers;
    headersSource: 'wire' | 'renderer';
    cookies: readonly Cookie[];
    body?: Body;
    at: string;
  };
  response?: {
    status: number;
    headers: Headers;
    setCookies: readonly string[];
    mimeType: string;
    fromCache: boolean;
    fromServiceWorker: boolean;
    protocol?: string;
    body?: Body;
    bodyState: BodyState;
    at: string;
  };
  outcome: ExchangeOutcome;
  error?: string;
  redirectTo?: string;
  ws?: { frames: readonly WebSocketFrame[]; framesDropped: number };
  timing: { startMs: number; endMs?: number };
}

export interface Action {
  seq: number;
  at: string;
  action: string;
  detail: string;
  url?: string;
}

export interface StepRun {
  id: StepId;
  index: number;
  text?: string;
  startedAt: string;
  endedAt?: string;
  outcome: StepOutcome;
  note?: string;
  exchangeIds: readonly ExchangeId[];
  actions: readonly Action[];
}

export interface Snapshot {
  seq: number;
  at: string;
  stepId: StepId;
  cookies: readonly Cookie[];
  storage: readonly { origin: string; local: Record<string, string>; session: Record<string, string> }[];
}

export interface TargetInfo {
  sessionId: SessionId;
  targetId: string;
  type: string;
  url: string;
  openerId?: string;
  attachedAt: string;
  detachedAt?: string;
}

export interface Trace {
  traceVersion: 1;
  runId: RunId;
  site: SiteId;
  driver: DriverKind;
  workflowId?: WorkflowId;
  startedAt: string;
  finishedAt?: string;
  /** False when the end line is missing or the file was cut mid-line. */
  complete: boolean;
  outcome: RunOutcome;
  browser: { kind: BrowserKind; version: string };
  scope: { hosts: readonly string[] };
  steps: readonly StepRun[];
  exchanges: readonly Exchange[];
  /** Exchanges whose request started before the first step. */
  setupExchangeIds: readonly ExchangeId[];
  /** Exchanges whose request started between an end and the next begin, or after the last end. */
  outsideExchangeIds: readonly ExchangeId[];
  snapshots: readonly Snapshot[];
  targets: readonly TargetInfo[];
  counts: Counts;
  /** Lines that failed their schema, by seq. */
  badLines: readonly BadLine[];
}

// ---- ApiDoc. Declared once as a Zod schema so api.json validates on write and read.

export const JsonSchemaSchema: z.ZodType<Record<string, unknown>> = z.record(z.string(), z.unknown());
export type JsonSchema = Record<string, unknown>;

export const paramSources = ['binding', 'input', 'literal', 'computed'] as const;
export type ParamSource = (typeof paramSources)[number];

export const ParamSchema = z.object({
  name: z.string(),
  example: z.string(),
  required: z.union([z.boolean(), z.literal('unknown')]),
  source: z.enum(paramSources),
});
export type Param = z.infer<typeof ParamSchema>;

export const HeaderUseSchema = z.object({
  name: z.string(),
  required: z.union([z.boolean(), z.literal('unknown')]),
  valueKind: z.enum(['static', 'token', 'redacted']),
});
export type HeaderUse = z.infer<typeof HeaderUseSchema>;

export const BindingSchema = z.object({
  from: z.object({
    endpointId: z.string().transform((s) => s as EndpointId),
    location: z.enum(['response.body', 'response.header', 'set-cookie', 'storage']),
    path: z.string(),
  }),
  to: z.object({
    location: z.enum(['path', 'query', 'header', 'body', 'cookie']),
    path: z.string(),
  }),
  seen: z.number().int().positive(),
});
export type Binding = z.infer<typeof BindingSchema>;

export const EvidenceSchema = z.object({
  runId: z.string().transform((s) => s as RunId),
  workflowId: z.string().transform((s) => s as WorkflowId).optional(),
  stepId: z.union([z.string().transform((s) => s as StepId), z.literal('setup'), z.null()]),
  exchangeId: z.string().transform((s) => s as ExchangeId),
  at: isoDate,
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const BodyDocSchema = z.object({
  mediaType: z.string(),
  schema: JsonSchemaSchema.nullable(),
  example: z.unknown().nullable(),
  undecoded: z.string().nullable(),
});
export type BodyDoc = z.infer<typeof BodyDocSchema>;

export const EndpointSchema = z.object({
  id: z.string().transform((s) => s as EndpointId),
  /** `page` = text/html navigations: shown in workflows, left out of the reference. */
  kind: z.enum(['api', 'page']),
  method: z.string(),
  host: z.string(),
  pathTemplate: z.string(),
  /** GraphQL operationName when the endpoint is split by operation. */
  operation: z.string().nullable(),
  pathParams: z.array(ParamSchema),
  queryParams: z.array(ParamSchema),
  headers: z.array(HeaderUseSchema),
  auth: z.object({ cookies: z.array(z.string()), headers: z.array(z.string()), contextHeaders: z.array(z.string()).default([]) }),
  request: BodyDocSchema.nullable(),
  responses: z.record(z.string(), BodyDocSchema),
  bindings: z.array(BindingSchema),
  ambient: z.boolean(),
  /** An asset, locale bundle, challenge or tracker proxy: listed by path, bodies not documented. */
  noise: z.boolean().default(false),
  cors: z.boolean(),
  observedIn: z.array(EvidenceSchema),
});
export type Endpoint = z.infer<typeof EndpointSchema>;

export const CaseSchema = z.object({
  runId: z.string().transform((s) => s as RunId),
  inputs: z.record(z.string(), z.string()),
  expect: z.array(z.object({ stepId: z.string().transform((s) => s as StepId), status: z.array(z.number().int()) })),
});
export type Case = z.infer<typeof CaseSchema>;

export const WorkflowDocSchema = z.object({
  id: z.string().transform((s) => s as WorkflowId),
  name: z.string(),
  goal: z.string(),
  effect: z.enum(['read', 'write']),
  inverse: z.string().optional(),
  preconditions: z.array(z.string()),
  inputs: z.array(InputSpecSchema),
  latestRun: z.object({ runId: z.string().transform((s) => s as RunId), outcome: z.enum(runOutcomes), at: isoDate }).nullable(),
  cases: z.array(CaseSchema),
  steps: z.array(
    z.object({
      id: z.string().transform((s) => s as StepId),
      do: z.string(),
      expect: z.enum(['url', 'network', 'ui']),
      confirms: z.array(z.string()),
      outcome: z.enum(stepOutcomes).nullable(),
      calls: z.array(
        z.object({
          endpointId: z.string().transform((s) => s as EndpointId),
          exchangeId: z.string().transform((s) => s as ExchangeId),
          status: z.number().int().nullable(),
        }),
      ),
    }),
  ),
  sequence: z.array(
    z.object({
      stepId: z.string().transform((s) => s as StepId),
      endpointId: z.string().transform((s) => s as EndpointId),
      exchangeId: z.string().transform((s) => s as ExchangeId),
    }),
  ),
});
export type WorkflowDoc = z.infer<typeof WorkflowDocSchema>;

export const CoverageSchema = z.object({
  steps: z.number().int(),
  stepsWithExchanges: z.number().int(),
  endpoints: z.number().int(),
  endpointsWithExample: z.number().int(),
  bindings: z.number().int(),
  inputsBound: z.number().int(),
  computedValues: z.number().int(),
  bodiesEvicted: z.number().int(),
  betweenSteps: z.number().int(),
  /** Endpoints listed as noise (assets, locale bundles, trackers), bodies left out. */
  noise: z.number().int().default(0),
});
export type Coverage = z.infer<typeof CoverageSchema>;

// ---- Mined code (apidocs mine) --------------------------------------------------------------

export const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
export type HttpMethod = (typeof httpMethods)[number];

/** `jobs/<site>/mined.json`: what src/apidocs/mine.ts extracted from the bundles `apidocs mine` fetched. */
export const MinedCodeSchema = z.object({
  minedVersion: z.literal(1),
  site: z.string(),
  minedAt: z.string(),
  /** API path templates found as string literals; `methods` is empty when no call site showed one. */
  routes: z.array(z.object({ path: z.string(), methods: z.array(z.enum(httpMethods)) })),
  /** Object literals whose keys are UPPER_SNAKE and whose values are lowercase strings. */
  enums: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
  bundles: z.object({ fetched: z.number().int(), failed: z.number().int() }),
});
export type MinedCode = z.infer<typeof MinedCodeSchema>;

/** The doc's view of the same: each route says whether a trace also observed it. */
export const CodeDocSchema = z.object({
  routes: z.array(z.object({ path: z.string(), methods: z.array(z.enum(httpMethods)), observed: z.boolean() })),
  enums: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
  bundles: z.object({ fetched: z.number().int(), failed: z.number().int() }),
});
export type CodeDoc = z.infer<typeof CodeDocSchema>;

export const ApiDocSchema = z.object({
  docVersion: z.literal(1),
  site: z.object({
    id: z.string().transform((s) => s as SiteId),
    name: z.string(),
    startUrl: z.string(),
    hosts: z.array(z.string()),
  }),
  /** Latest run end among the runs used, not build time, so rebuilds are byte-stable. */
  generatedAt: isoDate,
  source: z.object({
    traces: z.array(
      z.object({
        runId: z.string().transform((s) => s as RunId),
        path: z.string(),
        complete: z.boolean(),
        outcome: z.enum(runOutcomes),
        usedForDerive: z.boolean(),
      }),
    ),
  }),
  auth: z.object({
    cookies: z.array(z.string()),
    headers: z.array(z.string()),
    /** Custom headers sent with one constant value on most API requests (a tenant id, `x-requested-with`): not secrets, but omitted means 403. */
    contextHeaders: z.array(z.string()).default([]),
    /** Cookies sent on most requests that belong to analytics and chat SDKs, not the app; listed so a reader knows they are not needed. */
    trackerCookies: z.array(z.string()).default([]),
    loginWorkflowId: z.string().transform((s) => s as WorkflowId).optional(),
    verification: z.enum(['password', 'code', 'passkey', 'sso']).optional(),
  }),
  workflows: z.array(WorkflowDocSchema),
  endpoints: z.array(EndpointSchema),
  outside: z.array(EvidenceSchema),
  coverage: CoverageSchema,
  /** What `apidocs mine` read out of the app's own JavaScript, when it ran. Routes carry `observed` when a trace also saw them. */
  code: CodeDocSchema.optional(),
});
export type ApiDoc = z.infer<typeof ApiDocSchema>;

/**
 * What renderers accept. Structurally an ApiDoc whose examples went through redact();
 * only derive.ts can produce one, because only redact.ts constructs `Redacted`.
 */
export type RedactedApiDoc = Redacted<ApiDoc>;
