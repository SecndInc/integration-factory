---
name: apidocs-target
description: Stage 1 of site-to-API: write targets/<site>.json, start a dedicated Chrome with remote debugging, and wait for the person to sign in.
disable-model-invocation: true
---

# Target and signed-in browser

Outcome of this stage: `targets/<site>.json` exists, a Chrome on `jobs/<site>/chrome-profile` answers on `127.0.0.1:9222`, and a tab is signed in to the app. Nothing has been recorded yet.

## 1. Write the target

```json
{
  "name": "Roofr",
  "startUrl": "https://app.roofr.com/",
  "host": "roofr.com",
  "environment": "production"
}
```

- `name` becomes the site id (kebab-case): `Roofr` is `roofr`, which names `jobs/roofr`, `workflows/roofr`, `docs/apis/roofr`.
- `startUrl` is the signed-in landing page, not the marketing site. The tour starts there and reads its navigation links.
- `host` is the registrable domain, so `api.` and `app.` subdomains both count as first party. Leave it out only when `startUrl` is already on the bare domain.
- `environment` is `production` unless the account is yours: `staging`, `test` or `sandbox` unlock write workflows. Writing it explicitly is the point, even for production.

The fixture (`npm run apidocs:fixture`) prints its URL; a fixture target uses that URL and `"environment": "test"`.

## 2. Start Chrome and wait for sign-in

Run in the background, because it blocks until the person is in:

```
npm run apidocs:chrome -- <site> --wait-signin
```

It finds Chrome, starts it on the dedicated profile with the start URL open, prints `cdp:` and `attach:`, then polls until a tab is on the host and off a login-looking path and prints `signed-in: <url>`. Tell the person, in one line, to sign in in that window. The profile persists, so a second session usually prints `signed-in:` at once.

Branches:
- `chrome not found`: set `CHROME_PATH` to the executable and rerun.
- `chrome already answering`: a previous session's Chrome is up; it is reused, which is what you want.
- exit 4 (timed out): the person has not signed in; rerun with `--wait-signin` when they say they are in. Never type credentials or read `TARGET_PASSWORD` to shortcut this.
- `signed-in:` prints a URL you did not expect (an onboarding page, a team picker): that is still signed in; set `startUrl` to the page the tour should start from if it differs.

## 3. Done check

```
curl -s http://127.0.0.1:9222/json | grep -E '"(type|url)"'
```

One `page` entry is on the host and not on `/login`. Report the signed-in URL without its query string, then go to `/apidocs-record` for the tour or `/apidocs-workflow` for a specific goal.
