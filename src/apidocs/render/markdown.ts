// README.md: the Markdown form of the same sections as index.html, for the PR and for agents.
// Headings carry the facts ("3 workflows, 27 endpoints, 2 bindings"), not labels. Pure.
// Design: docs/design/api-docs.md §6.

import { bindingsMaxRows, observedInMaxRows } from '../limits.js';
import type { Redacted } from '../redact.js';
import type { ApiDoc, BodyDoc, Endpoint, Evidence } from '../types.js';
import { bindingsOut, endpointTitle, plural, prettyValue, requiredText, sortedEndpoints, stableJson, statusByExchange } from './shared.js';

export function toMarkdown(doc: Redacted<ApiDoc>): string {
  const endpoints = sortedEndpoints(doc);
  const byId = new Map(endpoints.map((ep) => [ep.id as string, ep]));
  const api = endpoints.filter((ep) => ep.kind === 'api');
  const noise = api.filter((ep) => ep.noise);
  const foreground = api.filter((ep) => !ep.ambient && !ep.noise);
  const ambient = api.filter((ep) => ep.ambient && !ep.noise);
  const wfNames = new Map(doc.workflows.map((wf) => [wf.id as string, wf.name]));
  const out: string[] = [];

  out.push(`# ${text(doc.site.name)}`, '');
  out.push(`${plural(doc.workflows.length, 'workflow')}, ${plural(api.length, 'endpoint')}, ${plural(doc.coverage.bindings, 'binding')}.`, '');
  out.push(`Start URL: ${code(doc.site.startUrl)}  `, `Generated: ${code(doc.generatedAt)}`, '');
  out.push('> Values in this document are redacted. Examples keep structure and drop secrets, tokens, emails and identifiers that look like them.', '');

  const c = doc.coverage;
  out.push('## Coverage', '');
  out.push(
    ...table(
      ['Measure', 'Value'],
      [
        ['Steps that triggered requests', `${c.stepsWithExchanges} of ${c.steps}`],
        ['Endpoints with a response example', `${c.endpointsWithExample} of ${c.endpoints}`],
        ['Bindings between endpoints', String(c.bindings)],
        ['Workflow inputs found in requests', String(c.inputsBound)],
        ['Computed values', String(c.computedValues)],
        ['Bodies evicted before they could be read', String(c.bodiesEvicted)],
        ['Requests between steps', String(c.betweenSteps)],
      ],
    ),
    '',
  );
  if (doc.source.traces.length > 0) {
    out.push(
      ...table(
        ['Run', 'Outcome', 'Trace', 'Derive'],
        doc.source.traces.map((t) => [code(t.runId), t.outcome, t.complete ? 'complete' : 'incomplete', t.usedForDerive ? 'used' : 'not used']),
      ),
      '',
    );
  }

  out.push('## Auth', '');
  out.push(`- Cookies: ${list(doc.auth.cookies)}`, `- Headers: ${list(doc.auth.headers)}`);
  out.push(`- Context headers (constant on most requests, not credentials): ${list(doc.auth.contextHeaders)}`);
  if (doc.auth.trackerCookies.length > 0) out.push(`- Also sent, not needed (analytics and chat SDKs): ${list(doc.auth.trackerCookies)}`);
  out.push(`- Established by: ${doc.auth.loginWorkflowId === undefined ? 'not declared' : text(wfNames.get(doc.auth.loginWorkflowId) ?? doc.auth.loginWorkflowId)}`);
  out.push(`- Verification: ${doc.auth.verification ?? 'not declared'}`, '');

  out.push(`## ${plural(doc.workflows.length, 'workflow')}`, '');
  for (const wf of doc.workflows) {
    const statuses = statusByExchange(wf);
    out.push(`### ${text(wf.name)}`, '');
    out.push(`${text(wf.goal)}`, '');
    out.push(`- Effect: ${wf.effect}${wf.inverse === undefined ? '' : `, inverse ${code(wf.inverse)}`}`);
    out.push(
      wf.latestRun === null ? '- Latest run: none recorded' : `- Latest run: ${code(wf.latestRun.runId)}, ${wf.latestRun.outcome}, ${wf.latestRun.at}`,
    );
    for (const p of wf.preconditions) out.push(`- Precondition: ${text(p)}`);
    out.push('');
    if (wf.inputs.length > 0) {
      out.push(
        ...table(
          ['Input', 'Kind', 'Example'],
          wf.inputs.map((i) => [code(i.name), i.kind, i.secret ? 'secret, never shown' : i.example === undefined ? '' : code(i.example)]),
        ),
        '',
      );
    }
    wf.steps.forEach((step, i) => {
      const outcome = step.outcome === null ? 'not run' : step.outcome;
      out.push(`${i + 1}. ${code(step.id)} ${text(step.do)} (${outcome})${step.confirms.length === 0 ? '' : ` presses ${step.confirms.map(code).join(', ')}`}`);
      if (step.expect === 'network' && step.calls.length === 0) out.push('   - No network traffic captured for a step that expected it.');
      for (const call of step.calls) {
        const ep = byId.get(call.endpointId);
        const status = statuses.get(call.exchangeId) ?? call.status;
        out.push(`   - ${code(ep === undefined ? call.endpointId : endpointTitle(ep))} → ${status === null ? '?' : status}`);
      }
    });
    out.push('');
  }

  out.push(`## ${plural(foreground.length, 'endpoint')}`, '');
  for (const ep of foreground) out.push(...endpointSection(doc, ep, byId, wfNames));

  if (noise.length > 0) {
    out.push(`## Assets, locale bundles and trackers (${noise.length})`, '', 'Requests the app makes for itself, not an API: listed so the count is accounted for, bodies not documented.', '');
    for (const ep of noise) out.push(`- ${code(`${ep.method} ${ep.pathTemplate}`)}`);
    out.push('');
  }
  if (ambient.length > 0) {
    out.push(`## Background traffic (${ambient.length})`, '');
    for (const ep of ambient) out.push(...endpointSection(doc, ep, byId, wfNames));
  }

  if (doc.outside.length > 0) {
    out.push(`## Seen outside any step (${doc.outside.length})`, '');
    for (const ev of doc.outside) out.push(`- ${evidenceText(ev, wfNames)}`);
    out.push('');
  }

  if (doc.code !== undefined) {
    const unseen = doc.code.routes.filter((r) => !r.observed);
    const seen = doc.code.routes.length - unseen.length;
    out.push(`## Routes in code, not observed (${unseen.length})`, '');
    out.push(
      `Read from ${plural(doc.code.bundles.fetched, 'script bundle')} the app loads (${doc.code.bundles.failed} failed to fetch). ${seen} of the ${doc.code.routes.length} routes in code were also observed in a trace and are documented above. The rest were never called while recording: no schema, no example, and the method is the call site's when it showed one.`,
      '',
    );
    if (unseen.length > 0) out.push(...table(['Path', 'Methods'], unseen.map((r) => [code(r.path), r.methods.length === 0 ? 'unknown' : r.methods.join(', ')])), '');
    if (doc.code.enums.length > 0) {
      out.push(`## Enums in code (${doc.code.enums.length})`, '');
      out.push(...table(['Name', 'Values'], doc.code.enums.map((en) => [code(en.name), en.values.map(code).join(', ')])), '');
    }
  }

  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

function endpointSection(doc: ApiDoc, ep: Endpoint, byId: Map<string, Endpoint>, wfNames: Map<string, string>): string[] {
  const out: string[] = [`### ${code(endpointTitle(ep))}`, ''];
  out.push(`Host: ${code(ep.host)}${ep.ambient ? ' (background)' : ''}${ep.cors ? ' (CORS)' : ''}`, '');
  if (ep.auth.cookies.length + ep.auth.headers.length + ep.auth.contextHeaders.length > 0) {
    out.push(
      `Auth: ${[...ep.auth.cookies.map((n) => `cookie ${code(n)}`), ...ep.auth.headers.map((n) => `header ${code(n)}`), ...ep.auth.contextHeaders.map((n) => `context header ${code(n)}`)].join(', ')}`,
      '',
    );
  }
  const params = [...ep.pathParams.map((p) => ['path', p] as const), ...ep.queryParams.map((p) => ['query', p] as const)];
  if (params.length > 0) {
    out.push(...table(['Name', 'In', 'Source', 'Example', 'Required'], params.map(([where, p]) => [code(p.name), where, p.source, code(p.example), requiredText(p.required)])), '');
  }
  if (ep.headers.length > 0) {
    out.push(...table(['Header', 'Value', 'Required'], ep.headers.map((h) => [code(h.name), h.valueKind, requiredText(h.required)])), '');
  }
  if (ep.request !== null) out.push('**Request**', '', ...bodyLines(ep.request), '');
  for (const status of Object.keys(ep.responses).sort()) out.push(`**Response ${status}**`, '', ...bodyLines(ep.responses[status]!), '');

  const bindings: string[] = [];
  for (const b of ep.bindings) {
    const from = byId.get(b.from.endpointId);
    bindings.push(`- ${code(`${b.to.location} ${b.to.path}`)} comes from ${code(from === undefined ? b.from.endpointId : endpointTitle(from))} ${code(`${b.from.location} ${b.from.path}`)} (seen ${b.seen}x)`);
  }
  for (const { endpoint, binding } of bindingsOut(doc, ep.id)) {
    bindings.push(`- ${code(`${binding.from.location} ${binding.from.path}`)} feeds ${code(endpointTitle(endpoint))} ${code(`${binding.to.location} ${binding.to.path}`)}`);
  }
  if (bindings.length > 0) {
    out.push(`**Bindings** (${bindings.length})`, '', ...bindings.slice(0, bindingsMaxRows), ...(bindings.length > bindingsMaxRows ? [`- and ${bindings.length - bindingsMaxRows} more`] : []), '');
  }
  if (ep.observedIn.length > 0) {
    const shown = ep.observedIn.slice(0, observedInMaxRows);
    const more = ep.observedIn.length - shown.length;
    out.push(`**Observed in** (${ep.observedIn.length})`, '', ...shown.map((ev) => `- ${evidenceText(ev, wfNames)}`), ...(more > 0 ? [`- and ${more} more`] : []), '');
  }
  return out;
}

function bodyLines(body: BodyDoc): string[] {
  const out: string[] = [`Media type: ${code(body.mediaType === '' ? 'none' : body.mediaType)}`, ''];
  if (body.undecoded !== null) out.push(`Body not decoded: ${text(body.undecoded)}`, '');
  if (body.schema !== null) out.push('Schema:', '', ...fence(stableJson(body.schema).trimEnd(), 'json'), '');
  if (body.example !== null && body.example !== undefined) {
    const isString = typeof body.example === 'string';
    out.push('Example:', '', ...fence(prettyValue(body.example), isString ? 'text' : 'json'), '');
  }
  return out;
}

function evidenceText(ev: Evidence, wfNames: Map<string, string>): string {
  const wf = ev.workflowId === undefined ? 'no workflow' : text(wfNames.get(ev.workflowId) ?? ev.workflowId);
  const step = ev.stepId === null ? 'outside any step' : ev.stepId === 'setup' ? 'setup' : `step ${code(ev.stepId)}`;
  return `${wf}, ${step}, run ${code(ev.runId)}, ${ev.at}, exchange ${code(ev.exchangeId)}`;
}

// ---- Markdown primitives ---------------------------------------------------------------------

/** Plain text on one line, with the characters that start Markdown or HTML constructs escaped. */
function text(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/([\\`*_[\]<>|#])/g, '\\$1').trim();
}

/** Inline code; the delimiter is longer than any backtick run inside. */
function code(value: string): string {
  const flat = value.replace(/\s+/g, ' ');
  const longest = Math.max(0, ...(flat.match(/`+/g) ?? []).map((run) => run.length));
  const tick = '`'.repeat(longest + 1);
  const pad = flat.startsWith('`') || flat.endsWith('`') ? ' ' : '';
  return `${tick}${pad}${flat.replace(/\|/g, '\\|')}${pad}${tick}`;
}

function list(names: readonly string[]): string {
  return names.length === 0 ? 'none' : names.map(code).join(', ');
}

/** Fenced block; the fence is longer than any backtick run inside the content. */
function fence(content: string, lang: string): string[] {
  const longest = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = '`'.repeat(longest + 1);
  return [`${ticks}${lang}`, content, ticks];
}

function table(head: readonly string[], rows: readonly (readonly string[])[]): string[] {
  const cell = (value: string): string => value.replace(/\r?\n/g, ' ');
  return [
    `| ${head.map(cell).join(' | ')} |`,
    `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(cell).join(' | ')} |`),
  ];
}
