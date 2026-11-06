// The committed per-site snapshot plans: they parse, they cross-check against the api doc when it is on disk,
// they send GET only, every path param has an id source, and they carry no account data.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { describePlan, selectEndpoints, validatePlan } from '../../src/apidocs/snapshot/plan.js';
import type { SnapshotPlan } from '../../src/apidocs/snapshot/types.js';

const root = new URL('../../', import.meta.url);
const read = (rel: string): unknown => JSON.parse(readFileSync(new URL(rel, root), 'utf8'));

const sites = [
  // BigQuery views (targets/<site>.views.sql) select on these exact endpoint ids.
  { site: 'roofr', requiredSlugs: ['jobs', 'contacts', 'proposals'] },
  { site: 'yp-for-business', requiredSlugs: ['leads', 'dash-leads'] },
];

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v !== null && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    out.push(k);
    strings(x, out);
  }
  return out;
}

for (const { site, requiredSlugs } of sites) {
  const planJson = read(`snapshots/${site}.json`);
  const docPath = `docs/apis/${site}/api.json`;
  const docOnDisk = existsSync(new URL(docPath, root));

  test(`${site}: the plan parses and passes the cross-checks`, () => {
    const plan = validatePlan(planJson);
    assert.equal(plan.site, site);
  });

  test(`${site}: every docId is a GET in the api doc (skipped when the doc is not on disk)`, { skip: !docOnDisk }, () => {
    const doc = read(docPath) as { endpoints: { id: string; method: string }[] };
    validatePlan(planJson, doc);
  });

  test(`${site}: the endpoint ids the BigQuery views need are present and not skipped`, () => {
    const plan = validatePlan(planJson);
    for (const slug of requiredSlugs) {
      const ep = plan.endpoints.find((e) => e.id === slug);
      assert.ok(ep, `missing endpoint "${slug}"`);
      assert.equal(ep.skip, undefined, `endpoint "${slug}" must not be skipped`);
    }
  });

  test(`${site}: GET only, with a docId on every endpoint`, () => {
    const plan = validatePlan(planJson);
    for (const ep of plan.endpoints) {
      assert.equal(ep.method, 'GET', ep.id);
      assert.ok(ep.docId, `${ep.id} has no docId`);
    }
  });

  test(`${site}: every {param} in a fetched path has an id source`, () => {
    const plan: SnapshotPlan = validatePlan(planJson);
    for (const ep of plan.endpoints) {
      if (ep.skip) continue; // a skipped endpoint is documented, never fetched
      for (const m of ep.path.matchAll(/\{([A-Za-z0-9_]+)\}/g)) {
        const param = m[1]!;
        const idName = ep.pathParams?.[param]?.fromId ?? param;
        assert.ok(plan.ids[idName], `${ep.id}: {${param}} has no id source "${idName}"`);
      }
    }
  });

  test(`${site}: per-job endpoints carry {jobId}, and a perId implies a path param`, () => {
    const plan = validatePlan(planJson);
    for (const ep of plan.endpoints) {
      if (ep.group === 'per-job-core' || ep.group === 'per-job-full') {
        assert.ok(ep.path.includes('{jobId}'), `${ep.id} is per-job but its path has no {jobId}`);
        assert.equal(ep.perId, ep.group === 'per-job-core' ? 'core' : 'full', ep.id);
      }
      if (ep.perId) assert.ok(/\{[A-Za-z0-9_]+\}/.test(ep.path), `${ep.id} has perId but no path param`);
    }
  });

  test(`${site}: widget rules name plan endpoints`, () => {
    const plan = validatePlan(planJson);
    if (!plan.widgetRules) return;
    const ids = new Set(plan.endpoints.map((e) => e.id));
    for (const [kind, id] of Object.entries(plan.widgetRules.endpointTemplate)) assert.ok(ids.has(id), `widgetRules.endpointTemplate.${kind} -> "${id}" is not an endpoint`);
  });

  test(`${site}: the dry-run text renders for the core tier`, () => {
    const plan = validatePlan(planJson);
    const text = describePlan(plan, selectEndpoints(plan, { perId: 'core' }), { perId: 'core', months: 24 });
    assert.match(text, new RegExp(`snapshot plan ${site}:`));
  });

  test(`${site}: no string in the plan looks like an email, phone number or street address`, () => {
    const email = /[^\s@"']+@[^\s@"']+\.[A-Za-z]{2,}/;
    const phone = /(?:\+\d[\d\s().-]{8,}\d|\(?\b\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b)/;
    const street = /\b\d{1,6}\s+(?:[A-Za-z]+\s+){1,3}(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|way|ct|court|crescent|cres|pl|place)\b\.?/i;
    for (const s of strings(planJson)) {
      assert.ok(!email.test(s), 'plan string looks like an email address');
      assert.ok(!phone.test(s), 'plan string looks like a phone number');
      assert.ok(!street.test(s), 'plan string looks like a street address');
    }
  });
}
