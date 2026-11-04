// index.html: one self-contained file, no build step, no network, inline CSS and inline SVG for the
// sequence diagram. Sections in order: header + coverage line + run list; Auth; Workflows (inputs,
// latest run, steps with calls, sequence diagram, zero-exchange `network` steps flagged); Endpoints
// grouped by host and first path segment (params with source, request schema + example, responses per
// status, bindings, evidence); Background traffic (ambient); Seen outside any step.
// Reference, not tutorial: no prose the data cannot back. Pure. Design: docs/design/api-docs.md §6.

import type { Redacted } from '../redact.js';
import type { ApiDoc, BodyDoc, Endpoint, Evidence, WorkflowDoc } from '../types.js';
import { bindingsOut, endpointTitle, firstSegment, plural, prettyValue, requiredText, sortedEndpoints, stableJson, statusByExchange } from './shared.js';

type Doc = Redacted<ApiDoc>;

interface Ctx {
  doc: Doc;
  byId: Map<string, Endpoint>;
  anchors: Map<string, string>;
  wfAnchors: Map<string, string>;
  wfNames: Map<string, string>;
}

const e = (text: string): string => escapeHtml(text);

export function toHtml(doc: Redacted<ApiDoc>): string {
  const endpoints = sortedEndpoints(doc);
  const ctx: Ctx = {
    doc,
    byId: new Map(endpoints.map((ep) => [ep.id, ep])),
    anchors: new Map(endpoints.map((ep, i) => [ep.id, `ep-${i}`])),
    wfAnchors: new Map(doc.workflows.map((wf, i) => [wf.id, `wf-${i}`])),
    wfNames: new Map(doc.workflows.map((wf) => [wf.id, wf.name])),
  };
  const api = endpoints.filter((ep) => ep.kind === 'api');
  const foreground = api.filter((ep) => !ep.ambient);
  const ambient = api.filter((ep) => ep.ambient);
  const headline = `${plural(doc.workflows.length, 'workflow')}, ${plural(api.length, 'endpoint')}, ${plural(doc.coverage.bindings, 'binding')}`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${e(doc.site.name)} API</title>`,
    `<style>${css}</style>`,
    '</head>',
    '<body>',
    '<main>',
    header(ctx, headline),
    coverageBlock(doc),
    authSection(ctx),
    `<section id="workflows"><h2>Workflows (${doc.workflows.length})</h2>`,
    doc.workflows.map((wf) => workflowBlock(ctx, wf)).join('\n') || '<p class="muted">No workflows.</p>',
    '</section>',
    `<section id="endpoints"><h2>Endpoints (${foreground.length})</h2>`,
    endpointGroups(ctx, foreground),
    '</section>',
    ambient.length > 0 ? `<section id="background"><h2>Background traffic (${ambient.length})</h2>${endpointGroups(ctx, ambient)}</section>` : '',
    outsideSection(ctx),
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** Inline SVG of `sequence[]` for one workflow: one lane per host, one arrow per call, labelled METHOD path -> status. */
export function sequenceSvg(workflow: Redacted<ApiDoc>['workflows'][number], endpoints: Redacted<ApiDoc>['endpoints']): string {
  const byId = new Map(endpoints.map((ep) => [ep.id as string, ep]));
  const statuses = statusByExchange(workflow);
  const hostOf = (id: string): string => byId.get(id)?.host ?? 'unknown host';

  const hosts: string[] = [];
  for (const item of workflow.sequence) {
    const host = hostOf(item.endpointId);
    if (!hosts.includes(host)) hosts.push(host);
  }

  const laneGap = 230;
  const gutter = 120;
  const clientX = gutter + 20;
  const top = 40;
  const rowH = 34;
  const laneX = (lane: number): number => clientX + lane * laneGap;
  const width = laneX(hosts.length) + 90;
  const rows = Math.max(workflow.sequence.length, 1);
  const height = top + rows * rowH + 16;
  const marker = `arrow-${slug(workflow.id)}`;

  const parts: string[] = [];
  parts.push(
    `<svg class="seq" role="img" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-label="${e(`Sequence of ${workflow.name}`)}">`,
    `<title>${e(`Sequence of ${workflow.name}`)}</title>`,
    `<defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="seq-head"/></marker></defs>`,
  );
  const lanes = ['Browser', ...hosts];
  lanes.forEach((label, lane) => {
    const x = laneX(lane);
    parts.push(
      `<text class="seq-lane-label" x="${x}" y="18" text-anchor="middle">${e(clip(label, 30))}</text>`,
      `<line class="seq-lane" x1="${x}" y1="26" x2="${x}" y2="${height - 8}"/>`,
    );
  });

  if (workflow.sequence.length === 0) {
    parts.push(`<text class="seq-note" x="${clientX + 12}" y="${top + 20}">No requests captured for this workflow</text>`);
  }

  let previousStep: string | null = null;
  workflow.sequence.forEach((item, i) => {
    const y = top + i * rowH + 20;
    const lane = hosts.indexOf(hostOf(item.endpointId)) + 1;
    const ep = byId.get(item.endpointId);
    const status = statuses.get(item.exchangeId);
    const statusText = status === null || status === undefined ? '?' : String(status);
    const label = `${ep === undefined ? item.endpointId : endpointTitle(ep)} → ${statusText}`;
    const failed = typeof status === 'number' && status >= 400;
    if (item.stepId !== previousStep) {
      parts.push(`<text class="seq-step" x="4" y="${y + 4}">${e(clip(item.stepId, 16))}</text>`);
      previousStep = item.stepId;
    }
    const length = lane * laneGap - 16;
    const chars = Math.max(Math.floor(length / 7), 12);
    parts.push(
      `<g><title>${e(label)}</title>`,
      `<line class="seq-arrow${failed ? ' seq-fail' : ''}" x1="${clientX}" y1="${y}" x2="${laneX(lane)}" y2="${y}" marker-end="url(#${marker})"/>`,
      `<text class="seq-label${failed ? ' seq-fail-text' : ''}" x="${clientX + 8}" y="${y - 5}">${e(clip(label, chars))}</text></g>`,
    );
  });
  parts.push('</svg>');
  return parts.join('');
}

/** HTML-escapes text. Every string from the doc goes through this before it lands in markup. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---- sections --------------------------------------------------------------------------------

function header(ctx: Ctx, headline: string): string {
  const { doc } = ctx;
  return [
    '<header>',
    `<h1>${e(doc.site.name)}</h1>`,
    `<p class="lede">${e(headline)}</p>`,
    `<p class="meta">Start URL <a href="${e(doc.site.startUrl)}">${e(doc.site.startUrl)}</a><br>Generated <time datetime="${e(doc.generatedAt)}">${e(doc.generatedAt)}</time></p>`,
    '<p class="notice">Values on this page are redacted. Examples keep structure and drop secrets, tokens, emails and identifiers that look like them.</p>',
    '</header>',
  ].join('\n');
}

function coverageBlock(doc: Doc): string {
  const c = doc.coverage;
  const rows: Array<[string, string]> = [
    ['Steps that triggered requests', `${c.stepsWithExchanges} of ${c.steps}`],
    ['Endpoints with a response example', `${c.endpointsWithExample} of ${c.endpoints}`],
    ['Bindings between endpoints', String(c.bindings)],
    ['Workflow inputs found in requests', String(c.inputsBound)],
    ['Computed values', String(c.computedValues)],
    ['Bodies evicted before they could be read', String(c.bodiesEvicted)],
    ['Requests between steps', String(c.betweenSteps)],
  ];
  const runs = doc.source.traces
    .map(
      (t) =>
        `<tr><td><code>${e(t.runId)}</code></td><td>${e(t.outcome)}</td><td>${t.complete ? 'complete' : 'incomplete'}</td><td>${t.usedForDerive ? 'used' : 'not used'}</td></tr>`,
    )
    .join('');
  return [
    '<section id="coverage"><h2>Coverage</h2>',
    `<dl class="cov">${rows.map(([k, v]) => `<div><dt>${e(k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl>`,
    runs.length > 0
      ? `<h3>Runs</h3><div class="scroll"><table><thead><tr><th>Run</th><th>Outcome</th><th>Trace</th><th>Derive</th></tr></thead><tbody>${runs}</tbody></table></div>`
      : '',
    '</section>',
  ].join('\n');
}

function authSection(ctx: Ctx): string {
  const { auth } = ctx.doc;
  const list = (names: readonly string[]): string => (names.length === 0 ? '<span class="muted">none</span>' : names.map((n) => `<code>${e(n)}</code>`).join(' '));
  const login = auth.loginWorkflowId === undefined ? undefined : auth.loginWorkflowId;
  const loginLink =
    login === undefined
      ? '<span class="muted">not declared</span>'
      : `<a href="#${e(ctx.wfAnchors.get(login) ?? 'workflows')}">${e(ctx.wfNames.get(login) ?? login)}</a>`;
  return [
    '<section id="auth"><h2>Auth</h2>',
    '<dl class="kv">',
    `<dt>Cookies</dt><dd>${list(auth.cookies)}</dd>`,
    `<dt>Headers</dt><dd>${list(auth.headers)}</dd>`,
    `<dt>Established by</dt><dd>${loginLink}</dd>`,
    `<dt>Verification</dt><dd>${auth.verification === undefined ? '<span class="muted">not declared</span>' : e(auth.verification)}</dd>`,
    '</dl>',
    '</section>',
  ].join('\n');
}

function workflowBlock(ctx: Ctx, wf: WorkflowDoc): string {
  const statuses = statusByExchange(wf);
  const anchor = ctx.wfAnchors.get(wf.id) ?? '';
  const inputs =
    wf.inputs.length === 0
      ? ''
      : `<h4>Inputs</h4><div class="scroll"><table><thead><tr><th>Name</th><th>Kind</th><th>Example</th></tr></thead><tbody>${wf.inputs
          .map(
            (i) =>
              `<tr><td><code>${e(i.name)}</code></td><td>${e(i.kind)}</td><td>${i.secret ? '<span class="muted">secret, never shown</span>' : i.example === undefined ? '<span class="muted">none</span>' : `<code>${e(i.example)}</code>`}</td></tr>`,
          )
          .join('')}</tbody></table></div>`;
  const steps = wf.steps
    .map((step) => {
      const calls = step.calls
        .map((call) => {
          const ep = ctx.byId.get(call.endpointId);
          const status = statuses.get(call.exchangeId) ?? call.status;
          const text = `${ep === undefined ? call.endpointId : endpointTitle(ep)} → ${status === null ? '?' : status}`;
          const target = ctx.anchors.get(call.endpointId);
          return ep !== undefined && ep.kind === 'api' && target !== undefined ? `<li><a href="#${target}">${e(text)}</a></li>` : `<li>${e(text)}</li>`;
        })
        .join('');
      const flag =
        step.expect === 'network' && step.calls.length === 0 ? '<p class="flag">Expected network traffic, none was captured for this step.</p>' : '';
      const confirms = step.confirms.length === 0 ? '' : `<p class="confirm">Presses: ${step.confirms.map((c) => `<code>${e(c)}</code>`).join(' ')}</p>`;
      return `<li><span class="stepid"><code>${e(step.id)}</code></span> ${e(step.do)} <span class="badge">${step.outcome === null ? 'not run' : e(step.outcome)}</span>${confirms}${flag}${calls === '' ? '' : `<ul class="calls">${calls}</ul>`}</li>`;
    })
    .join('');
  const latest =
    wf.latestRun === null
      ? 'No run recorded'
      : `Latest run <code>${e(wf.latestRun.runId)}</code>: ${e(wf.latestRun.outcome)} at <time datetime="${e(wf.latestRun.at)}">${e(wf.latestRun.at)}</time>`;
  return [
    `<article class="wf" id="${anchor}">`,
    `<h3>${e(wf.name)} <span class="badge badge-${wf.effect}">${e(wf.effect)}</span></h3>`,
    `<p>${e(wf.goal)}</p>`,
    `<p class="meta">${latest}${wf.inverse === undefined ? '' : `<br>Inverse workflow <code>${e(wf.inverse)}</code>`}<br>${plural(wf.cases.length, 'recorded case')}</p>`,
    wf.preconditions.length === 0 ? '' : `<h4>Preconditions</h4><ul>${wf.preconditions.map((p) => `<li>${e(p)}</li>`).join('')}</ul>`,
    inputs,
    `<h4>Steps</h4><ol class="steps">${steps}</ol>`,
    `<h4>Sequence</h4><div class="scroll">${sequenceSvg(wf, ctx.doc.endpoints)}</div>`,
    '</article>',
  ].join('\n');
}

function endpointGroups(ctx: Ctx, endpoints: readonly Endpoint[]): string {
  if (endpoints.length === 0) return '<p class="muted">None.</p>';
  const hosts = new Map<string, Map<string, Endpoint[]>>();
  for (const ep of endpoints) {
    const segments = hosts.get(ep.host) ?? new Map<string, Endpoint[]>();
    const seg = firstSegment(ep.pathTemplate);
    segments.set(seg, [...(segments.get(seg) ?? []), ep]);
    hosts.set(ep.host, segments);
  }
  return [...hosts]
    .map(
      ([host, segments]) =>
        `<div class="host"><h3>${e(host)}</h3>${[...segments]
          .map(([seg, eps]) => `<h4 class="seg">${e(seg)}</h4>${eps.map((ep) => endpointArticle(ctx, ep)).join('\n')}`)
          .join('\n')}</div>`,
    )
    .join('\n');
}

function endpointArticle(ctx: Ctx, ep: Endpoint): string {
  const anchor = ctx.anchors.get(ep.id) ?? '';
  const method = ep.method.toUpperCase();
  const params = [
    ...ep.pathParams.map((p) => ({ ...p, where: 'path' })),
    ...ep.queryParams.map((p) => ({ ...p, where: 'query' })),
  ];
  const paramTable =
    params.length === 0
      ? ''
      : `<h5>Parameters</h5><div class="scroll"><table><thead><tr><th>Name</th><th>In</th><th>Source</th><th>Example</th><th>Required</th></tr></thead><tbody>${params
          .map(
            (p) =>
              `<tr><td><code>${e(p.name)}</code></td><td>${p.where}</td><td>${e(p.source)}</td><td><code>${e(p.example)}</code></td><td>${requiredText(p.required)}</td></tr>`,
          )
          .join('')}</tbody></table></div>`;
  const headerTable =
    ep.headers.length === 0
      ? ''
      : `<h5>Headers</h5><div class="scroll"><table><thead><tr><th>Name</th><th>Value</th><th>Required</th></tr></thead><tbody>${ep.headers
          .map((h) => `<tr><td><code>${e(h.name)}</code></td><td>${e(h.valueKind)}</td><td>${requiredText(h.required)}</td></tr>`)
          .join('')}</tbody></table></div>`;
  const authLine =
    ep.auth.cookies.length + ep.auth.headers.length === 0
      ? ''
      : `<p class="meta">Auth: ${[...ep.auth.cookies.map((c) => `cookie <code>${e(c)}</code>`), ...ep.auth.headers.map((h) => `header <code>${e(h)}</code>`)].join(', ')}</p>`;
  const request = ep.request === null ? '' : `<h5>Request</h5>${bodyBlock(ep.request)}`;
  const responses = Object.keys(ep.responses)
    .sort()
    .map((status) => `<h5>Response ${e(status)}</h5>${bodyBlock(ep.responses[status]!)}`)
    .join('');

  const incoming = ep.bindings.map((b) => {
    const from = ctx.byId.get(b.from.endpointId);
    const fromText = from === undefined ? b.from.endpointId : endpointTitle(from);
    const fromAnchor = ctx.anchors.get(b.from.endpointId);
    const link = from !== undefined && fromAnchor !== undefined ? `<a href="#${fromAnchor}">${e(fromText)}</a>` : e(fromText);
    return `<li><code>${e(b.to.location)} ${e(b.to.path)}</code> comes from ${link} <code>${e(b.from.location)} ${e(b.from.path)}</code> (seen ${b.seen}x)</li>`;
  });
  const outgoing = bindingsOut(ctx.doc, ep.id).map(({ endpoint, binding }) => {
    const target = ctx.anchors.get(endpoint.id);
    const text = endpointTitle(endpoint);
    const link = target === undefined ? e(text) : `<a href="#${target}">${e(text)}</a>`;
    return `<li><code>${e(binding.from.location)} ${e(binding.from.path)}</code> feeds ${link} <code>${e(binding.to.location)} ${e(binding.to.path)}</code></li>`;
  });
  const bindings = incoming.length + outgoing.length === 0 ? '' : `<h5>Bindings</h5><ul>${[...incoming, ...outgoing].join('')}</ul>`;

  const evidence =
    ep.observedIn.length === 0
      ? ''
      : `<details><summary>Observed ${ep.observedIn.length} ${ep.observedIn.length === 1 ? 'time' : 'times'}</summary><ul>${ep.observedIn.map((ev) => `<li>${evidenceItem(ctx, ev)}</li>`).join('')}</ul></details>`;

  return [
    `<article class="ep" id="${anchor}">`,
    `<h5 class="ep-title"><span class="method method-${slug(method)}">${e(method)}</span> <code>${e(ep.pathTemplate)}</code>${ep.operation === null ? '' : ` <span class="badge">GraphQL ${e(ep.operation)}</span>`}${ep.ambient ? ' <span class="badge">background</span>' : ''}${ep.cors ? ' <span class="badge">CORS</span>' : ''}</h5>`,
    authLine,
    paramTable,
    headerTable,
    request,
    responses,
    bindings,
    evidence,
    '</article>',
  ].join('\n');
}

function bodyBlock(body: BodyDoc): string {
  const parts = [`<p class="meta"><code>${e(body.mediaType === '' ? 'no media type' : body.mediaType)}</code></p>`];
  if (body.undecoded !== null) parts.push(`<p class="muted">Body not decoded: ${e(body.undecoded)}</p>`);
  if (body.schema !== null) parts.push(`<details><summary>Schema</summary><pre><code>${e(stableJson(body.schema).trimEnd())}</code></pre></details>`);
  if (body.example !== null && body.example !== undefined) parts.push(`<p class="label">Example</p><pre><code>${e(prettyValue(body.example))}</code></pre>`);
  return parts.join('');
}

function evidenceItem(ctx: Ctx, ev: Evidence): string {
  const wfAnchor = ev.workflowId === undefined ? undefined : ctx.wfAnchors.get(ev.workflowId);
  const wfName = ev.workflowId === undefined ? undefined : (ctx.wfNames.get(ev.workflowId) ?? ev.workflowId);
  const wf = wfName === undefined ? 'no workflow' : wfAnchor === undefined ? e(wfName) : `<a href="#${wfAnchor}">${e(wfName)}</a>`;
  const step = ev.stepId === null ? 'outside any step' : ev.stepId === 'setup' ? 'setup' : `step <code>${e(ev.stepId)}</code>`;
  return `${wf}, ${step}, run <code>${e(ev.runId)}</code>, <time datetime="${e(ev.at)}">${e(ev.at)}</time>, exchange <code>${e(ev.exchangeId)}</code>`;
}

function outsideSection(ctx: Ctx): string {
  const { outside } = ctx.doc;
  if (outside.length === 0) return '';
  return `<section id="outside"><h2>Seen outside any step (${outside.length})</h2><ul>${outside.map((ev) => `<li>${evidenceItem(ctx, ev)}</li>`).join('')}</ul></section>`;
}

// ---- small helpers ---------------------------------------------------------------------------

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(max - 1, 1))}…`;
}

const css = `
:root{--bg:#fbfbfa;--panel:#fff;--ink:#1b1f23;--soft:#5b6570;--line:#d9dee3;--accent:#1f6feb;--ok:#1a7f37;--warn:#9a6700;--bad:#cf222e;--code:#f2f4f6}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0f1317;--panel:#171c22;--ink:#e6e9ec;--soft:#9aa5b1;--line:#2b333b;--accent:#5aa2ff;--ok:#3fb950;--warn:#d29922;--bad:#ff7b72;--code:#1f262d}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:64rem;margin:0 auto;padding:1rem}
h1{font-size:1.75rem;margin:.5rem 0}h2{font-size:1.3rem;margin:2rem 0 .75rem;border-bottom:1px solid var(--line);padding-bottom:.25rem}
h3{font-size:1.1rem;margin:1rem 0 .5rem}h4{font-size:1rem;margin:1rem 0 .4rem}h5{font-size:.95rem;margin:.9rem 0 .3rem}
a{color:var(--accent)}code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.85rem}
code{background:var(--code);padding:.05rem .3rem;border-radius:4px;overflow-wrap:anywhere}
pre{background:var(--code);padding:.75rem;border-radius:6px;overflow-x:auto;margin:.3rem 0}pre code{background:none;padding:0;overflow-wrap:normal}
.lede{font-size:1.05rem;margin:.2rem 0}.meta,.muted,.label{color:var(--soft);font-size:.9rem;margin:.3rem 0}
.notice{border-left:4px solid var(--warn);background:var(--panel);padding:.5rem .75rem;margin:.75rem 0}
.flag{color:var(--warn);font-size:.9rem;margin:.2rem 0}.confirm{font-size:.9rem;margin:.2rem 0}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:.35rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--soft);font-weight:600}
.cov{display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:.6rem;margin:0}
.cov div{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:.5rem .75rem}
.cov dt{color:var(--soft);font-size:.85rem}.cov dd{margin:0;font-size:1.2rem;font-weight:600}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:.3rem 1rem}.kv dt{color:var(--soft)}.kv dd{margin:0}
.wf,.ep{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:.5rem 1rem 1rem;margin:1rem 0}
.ep{padding:.25rem 1rem .75rem}.steps{padding-left:1.4rem}.steps li{margin:.5rem 0}.calls{margin:.2rem 0;padding-left:1.2rem;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.85rem}
.badge{display:inline-block;font-size:.75rem;border:1px solid var(--line);border-radius:999px;padding:0 .5rem;color:var(--soft);vertical-align:middle}
.badge-write{color:var(--warn);border-color:var(--warn)}.badge-read{color:var(--ok);border-color:var(--ok)}
.method{display:inline-block;min-width:3.6rem;text-align:center;color:#fff;background:var(--soft);border-radius:4px;font-size:.75rem;font-weight:700;padding:.1rem .4rem}
.method-get{background:#1a7f37}.method-post{background:#1f6feb}.method-put,.method-patch{background:#9a6700}.method-delete{background:#cf222e}
.seg{color:var(--soft)}details{margin:.3rem 0}summary{cursor:pointer;color:var(--soft)}
.seq{max-width:none;display:block}.seq-lane{stroke:var(--line);stroke-dasharray:4 4}.seq-lane-label{fill:var(--ink);font-size:12px;font-weight:600}
.seq-arrow{stroke:var(--accent);stroke-width:1.5}.seq-head{fill:var(--accent)}.seq-label{fill:var(--ink);font-size:11px}
.seq-step{fill:var(--soft);font-size:11px}.seq-note{fill:var(--soft);font-size:12px}.seq-fail{stroke:var(--bad)}.seq-fail-text{fill:var(--bad)}
@media (max-width:40rem){main{padding:.75rem}.kv{grid-template-columns:1fr}}
`;
