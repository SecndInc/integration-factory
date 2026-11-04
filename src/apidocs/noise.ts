// What a SaaS app sends that is not its API: analytics cookies and asset, locale, challenge and tracker
// paths. One list, used by derive (auth is the session, not the trackers), by the review scan (noise
// endpoints are not a defect) and by the renderers. Pure. Design: docs/design/teardown-parity.md §2.

/** Cookie names (exact or by prefix) set by analytics, consent, chat and ad SDKs rather than the app. */
const trackerCookiePrefixes = [
  '_ga',
  '_gid',
  '_gat',
  '_gcl_',
  '_fbp',
  '_fbc',
  '_tt_',
  '_ttp',
  'ttcsid',
  '_uetsid',
  '_uetvid',
  '_hj',
  '_clck',
  '_clsk',
  '__hs',
  'hubspotutk',
  'ajs_',
  'amplitude_',
  'analytics_session_id',
  'intercom-',
  'osano_',
  'mp_',
  'optimizely',
  '_pendo',
  '_sprig',
  'ln_or',
  'li_',
  '_rdt_',
  '__rf_pulse',
] as const;

export function isTrackerCookie(name: string): boolean {
  const lower = name.toLowerCase();
  return trackerCookiePrefixes.some((p) => lower === p || lower.startsWith(p));
}

/** Request paths that are assets, locale bundles, bot challenges, realtime auth or tracker proxies. */
export const noisePathPattern = /^\/(locales|cdn-cgi|broadcasting|sanctum|_next|static|assets|build)\/|\/ag\/g\/c$|\/ccm\/form-data\/|\.(json|js|css|map|png|jpe?g|gif|svg|ico|woff2?|ttf)$/i;

export function isNoisePath(pathTemplate: string): boolean {
  return noisePathPattern.test(pathTemplate);
}
