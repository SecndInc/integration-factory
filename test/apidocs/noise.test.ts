import assert from 'node:assert/strict';
import test from 'node:test';
import { isNoisePath, isTrackerCookie } from '../../src/apidocs/noise.js';

test('tracker cookies are recognised by prefix, session cookies are not', () => {
  for (const name of ['_ga', '_ga_ABC123', '_gid', '_fbp', 'hubspotutk', '__hstc', 'ajs_anonymous_id', 'intercom-session-x', 'amplitude_id_abc', 'mp_123_mixpanel', '_hjSessionUser_1'])
    assert.ok(isTrackerCookie(name), name);
  for (const name of ['roofr_session', 'XSRF-TOKEN', 'sid', 'laravel_session', 'device_cid', 'session_id']) assert.ok(!isTrackerCookie(name), name);
});

test('noise paths are assets, locale bundles, challenges and tracker proxies', () => {
  for (const p of ['/locales/en/app.json', '/cdn-cgi/challenge-platform/x', '/build/js/app-abc.js', '/static/logo.png', '/sanctum/csrf-cookie', '/x/ag/g/c'])
    assert.ok(isNoisePath(p), p);
  for (const p of ['/api/jobs', '/api/job/{jobId}', '/api/user/me', '/jobs']) assert.ok(!isNoisePath(p), p);
});
