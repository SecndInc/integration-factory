// A small deterministic site for the recorder tests. Loopback only; it never contacts the internet.
//
//   /                     buttons that fire each kind of request; each sets window.done[<name>] when answered
//   /popup                a page opened with window.open; fetches /api/popup-data on load
//   /items                a list page: a table of rows linking to /items/<id>; fetches /api/items?page=1 on load
//   /items/<id>           a detail page; fetches /api/items/<id> on load
//   /rows                 a list page with no links: a covered card, a row the tour clicks, a row whose hover
//                         popover covers it (the click times out, the row is skipped) and a row with no pointer cursor
//   /api/items            GET -> JSON list; POST (JSON body) -> JSON with a new id
//   /api/items/<id>       GET -> one item, ids 1001-1004 (the tour's detail step lands here)
//   /api/xhr-data         JSON, called through XMLHttpRequest
//   /api/upload           multipart/form-data with a text field and a Blob file part
//   /redirect             302 -> /api/after-redirect
//   /api/set-cookie       sets `fixture_session`
//   /slow                 answers after slowMs
//   /api/popup-data       JSON for the popup
//   /api/big              a bigBodyBytes JSON body, larger than a write stream's buffer, so the trace writer drains
//
// Snapshot routes (per-server state; see snapshotRoute below):
//   /api/paged            Laravel meta paginator, 57 items            /api/paged-notot   meta without last_page or total, 23 items
//   /api/flat             Laravel flat paginator, 31 items            /api/cursor        3 pages, meta.next_cursor, 10 items
//   /api/dt               DataTables, page=start,length, 135 rows     /api/things/<id>   detail for the ids of /api/paged
//   /api/flaky            429 once (Retry-After 0), then 200          /api/err           500
//   /api/xsrf             sets a readable XSRF-TOKEN cookie           /api/team          { team: { id } }
//   /api/need-headers     403 unless x-xsrf-token matches the cookie and team-id is sent
//   /api/probe            200 JSON                                    /api/range         echoes start and end
//   /api/expire-arm?after=N, /api/expire-reset: after N more /api/* requests every /api/* answers 401 and /api/probe redirects to /login
//   /login                an HTML sign-in page

import http from 'node:http';
import type { AddressInfo } from 'node:net';

export const slowMs = 300;
export const bigBodyBytes = 200 * 1024;
const bigBody = JSON.stringify({ filler: 'x'.repeat(bigBodyBytes - '{"filler":""}'.length) });

const indexHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>fixture</title></head>
<body>
<nav><a href="/items">Items</a> <a href="/items/new">New item</a> <a href="/rows">Rows</a></nav>
<p>Featured: <a href="/items/1001">first</a></p>
<button id="get">get</button>
<button id="post">post</button>
<button id="xhr">xhr</button>
<button id="upload">upload</button>
<button id="popup">popup</button>
<button id="redirect">redirect</button>
<button id="cookie">cookie</button>
<button id="slow">slow</button>
<script>
window.done = {};
const ITEM_STATUS = { DRAFT: 'draft', LIVE: 'live', ARCHIVED: 'archived' };
window.archiveItem = (id) => fetch(\`/api/items/\${id}/archive\`, { method: 'POST' });
window.renameItem = (id, name) => fetch('/api/items/' + id, { method: 'PATCH', body: JSON.stringify({ name, status: ITEM_STATUS.LIVE }) });
localStorage.setItem('fixture-key', 'fixture-value');
const mark = (name) => (value) => { window.done[name] = value ?? true; };
document.getElementById('get').onclick = () =>
  fetch('/api/items?page=1').then((r) => r.json()).then(mark('get'));
document.getElementById('post').onclick = () =>
  fetch('/api/items', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'widget', qty: 3 }) })
    .then((r) => r.json()).then(mark('post'));
document.getElementById('xhr').onclick = () => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/xhr-data');
  xhr.onload = () => mark('xhr')(JSON.parse(xhr.responseText));
  xhr.send();
};
document.getElementById('upload').onclick = () => {
  const form = new FormData();
  form.append('title', 'holiday');
  form.append('photo', new Blob([new Uint8Array(512)], { type: 'image/png' }), 'photo.png');
  fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json()).then(mark('upload'));
};
document.getElementById('popup').onclick = () => { window.open('/popup'); };
document.getElementById('redirect').onclick = () =>
  fetch('/redirect').then((r) => r.json()).then(mark('redirect'));
document.getElementById('cookie').onclick = () =>
  fetch('/api/set-cookie').then((r) => r.json()).then(mark('cookie'));
document.getElementById('slow').onclick = () =>
  fetch('/slow').then((r) => r.json()).then(mark('slow'));
</script>
</body></html>`;

const itemsHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>items</title></head>
<body>
<table><thead><tr><th>Name</th></tr></thead><tbody>
<tr><td><a href="/items/1001">first</a></td></tr>
<tr><td><a href="/items/1002">second</a></td></tr>
<tr><td><a href="/items/1003">third</a></td></tr>
<tr><td><a href="/items/1004">fourth</a></td></tr>
</tbody></table>
<script>fetch('/api/items?page=1').then((r) => r.json()).then(() => { document.title = 'items-done'; });</script>
</body></html>`;

const rowsHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>rows</title></head>
<body>
<div class="card" style="cursor:pointer;position:relative;height:40px">a card an overlay covers</div>
<div style="position:absolute;left:0;top:0;width:100%;height:40px"></div>
<table style="position:absolute;top:60px;left:0;width:600px"><thead><tr><th>#</th><th>Name</th></tr></thead><tbody>
<tr style="cursor:pointer"><td>1</td><td>plain row: the tour clicks it</td></tr>
<tr style="cursor:pointer" onmouseenter="document.getElementById('hover-cover').style.display='block'"><td>2</td><td>hovering it shows a popover over the table: the click times out and the row is skipped</td></tr>
<tr><td>3</td><td>no pointer cursor: not an item</td></tr>
</tbody></table>
<div id="hover-cover" style="display:none;position:absolute;left:0;top:60px;width:600px;height:200px"></div>
<script>fetch('/api/rows').then((r) => r.json()).then(() => { document.title = 'rows-done'; });</script>
</body></html>`;

const itemHtml = (id: string): string => `<!doctype html>
<html><head><meta charset="utf-8"><title>item</title></head>
<body><h1>${id}</h1>
<script>fetch('/api/items/${id}').then((r) => r.json()).then(() => { document.title = 'item-done'; });</script>
</body></html>`;

const popupHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>popup</title></head>
<body><script>
fetch('/api/popup-data').then((r) => r.json()).then(() => { document.title = 'popup-done'; });
</script></body></html>`;

// ---- snapshot routes: pagination shapes, per-id details, retry and header behaviour, and an armable session expiry.

/** Per-server state, so tests are independent. */
interface SnapshotState {
  flakyServed: boolean;
  expireIn: number | null;
  expired: boolean;
}

export const pagedTotal = 57;
export const pagedNototTotal = 23;
export const flatTotal = 31;
export const cursorTotal = 10;
export const dtTotal = 135;

const rowsOf = (from: number, to: number): { id: number; name: string }[] => {
  const out: { id: number; name: string }[] = [];
  for (let id = from; id <= to; id++) out.push({ id, name: `item ${id}` });
  return out;
};
const pageOf = (url: URL, total: number): { page: number; per: number; data: { id: number; name: string }[] } => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const per = Math.max(1, Number(url.searchParams.get('per_page') ?? 15));
  return { page, per, data: rowsOf((page - 1) * per + 1, Math.min(page * per, total)) };
};
const cursorPages: Record<string, { from: number; to: number; next: string | null }> = {
  '': { from: 1, to: 4, next: 'c1' },
  c1: { from: 5, to: 8, next: 'c2' },
  c2: { from: 9, to: 10, next: null },
};

type Send = (status: number, type: string, body: string, headers?: Record<string, string>) => void;

/** True when the request was answered here. */
function snapshotRoute(st: SnapshotState, url: URL, requestHeaders: http.IncomingHttpHeaders, send: Send, res: http.ServerResponse): boolean {
  const p = url.pathname;
  const json = (value: unknown, headers: Record<string, string> = {}) => send(200, 'application/json', JSON.stringify(value), headers);
  if (p === '/login') {
    send(200, 'text/html; charset=utf-8', '<!doctype html><html><head><meta charset="utf-8"><title>login</title></head><body><h1>Sign in</h1></body></html>');
    return true;
  }
  if (!p.startsWith('/api/')) return false;
  if (p === '/api/expire-arm') {
    st.expireIn = Number(url.searchParams.get('after') ?? 0);
    st.expired = false;
    json({ armed: st.expireIn });
    return true;
  }
  if (p === '/api/expire-reset') {
    st.expireIn = null;
    st.expired = false;
    json({ reset: true });
    return true;
  }
  if (st.expireIn !== null || st.expired) {
    if (!st.expired) {
      if ((st.expireIn ?? 0) <= 0) st.expired = true;
      else st.expireIn = (st.expireIn ?? 0) - 1;
    }
    if (st.expired) {
      if (p === '/api/probe') {
        res.writeHead(302, { location: '/login', 'cache-control': 'no-store' });
        res.end();
      } else {
        send(401, 'application/json', JSON.stringify({ error: 'session expired' }));
      }
      return true;
    }
  }
  const thing = /^\/api\/things\/(\d+)$/.exec(p);
  if (thing) {
    const id = Number(thing[1]);
    if (id < 1 || id > pagedTotal) send(404, 'application/json', JSON.stringify({ error: 'no such thing' }));
    else json({ id, name: `item ${id}`, detail: true });
    return true;
  }
  switch (p) {
    case '/api/paged': {
      const { page, per, data } = pageOf(url, pagedTotal);
      json({ data, meta: { current_page: page, last_page: Math.ceil(pagedTotal / per), per_page: per, total: pagedTotal } });
      return true;
    }
    case '/api/paged-notot': {
      const { page, per, data } = pageOf(url, pagedNototTotal);
      json({ data, meta: { current_page: page, per_page: per } });
      return true;
    }
    case '/api/flat': {
      const { page, per, data } = pageOf(url, flatTotal);
      json({ current_page: page, last_page: Math.ceil(flatTotal / per), per_page: per, total: flatTotal, data });
      return true;
    }
    case '/api/cursor': {
      const c = cursorPages[url.searchParams.get('cursor') ?? ''];
      if (!c) send(400, 'application/json', JSON.stringify({ error: 'bad cursor' }));
      else json({ data: rowsOf(c.from, c.to), meta: { next_cursor: c.next } });
      return true;
    }
    case '/api/dt': {
      const [startText, lengthText] = (url.searchParams.get('page') ?? '0,50').split(',');
      const start = Number(startText);
      const length = Number(lengthText);
      json({ data: { aaData: rowsOf(start + 1, Math.min(start + length, dtTotal)), iTotalRecords: dtTotal, iTotalDisplayRecords: dtTotal } });
      return true;
    }
    case '/api/flaky':
      if (!st.flakyServed) {
        st.flakyServed = true;
        send(429, 'application/json', JSON.stringify({ error: 'slow down' }), { 'retry-after': '0' });
      } else {
        json({ ok: true });
      }
      return true;
    case '/api/need-headers': {
      const cookie = /(?:^|;\s*)XSRF-TOKEN=([^;]*)/.exec(requestHeaders.cookie ?? '');
      const expected = cookie ? decodeURIComponent(cookie[1]!) : undefined;
      if (expected !== undefined && requestHeaders['x-xsrf-token'] === expected && requestHeaders['team-id']) json({ data: [{ id: 1, team: requestHeaders['team-id'] }] });
      else send(403, 'application/json', JSON.stringify({ error: 'missing headers' }));
      return true;
    }
    case '/api/xsrf':
      json({ ok: true }, { 'set-cookie': `XSRF-TOKEN=${encodeURIComponent('tok/+=abc')}; Path=/; SameSite=Lax` });
      return true;
    case '/api/team':
      json({ team: { id: 'team_1' } });
      return true;
    case '/api/probe':
      json({ ok: true });
      return true;
    case '/api/range':
      json({ data: [{ start: url.searchParams.get('start'), end: url.searchParams.get('end') }] });
      return true;
    case '/api/err':
      send(500, 'application/json', JSON.stringify({ error: 'boom' }));
      return true;
    default:
      return false;
  }
}

export interface FixtureSite {
  url: string;
  close(): Promise<void>;
}

export async function startFixtureSite(): Promise<FixtureSite> {
  let nextId = 1;
  const snapshotState: SnapshotState = { flakyServed: false, expireIn: null, expired: false };
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://fixture.invalid');
    const send = (status: number, type: string, body: string, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', ...headers });
      res.end(body);
    };
    const json = (value: unknown, headers: Record<string, string> = {}) =>
      send(200, 'application/json', JSON.stringify(value), headers);
    const readBody = (then: (body: Buffer) => void) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => then(Buffer.concat(chunks)));
    };

    if (req.method === 'GET' && snapshotRoute(snapshotState, url, req.headers, send, res)) return;

    const itemPage = /^\/items\/(\d{4})$/.exec(url.pathname);
    if (req.method === 'GET' && itemPage) return send(200, 'text/html; charset=utf-8', itemHtml(itemPage[1]!));
    const itemApi = /^\/api\/items\/(\d{4})$/.exec(url.pathname);
    if (req.method === 'GET' && itemApi) return json({ id: itemApi[1], name: `item ${itemApi[1]}`, status: 'live' });

    switch (`${req.method} ${url.pathname}`) {
      case 'GET /':
        return send(200, 'text/html; charset=utf-8', indexHtml);
      case 'GET /items':
        return send(200, 'text/html; charset=utf-8', itemsHtml);
      case 'GET /rows':
        return send(200, 'text/html; charset=utf-8', rowsHtml);
      case 'GET /api/rows':
        return json({ rows: 2 });
      case 'GET /popup':
        return send(200, 'text/html; charset=utf-8', popupHtml);
      case 'GET /api/items':
        return json({ items: [{ id: 'itm_1', name: 'first' }], page: Number(url.searchParams.get('page') ?? 1) });
      case 'POST /api/items':
        return readBody((body) => {
          const input = JSON.parse(body.toString('utf8') || '{}') as Record<string, unknown>;
          json({ id: `itm_${100 + nextId++}`, ...input });
        });
      case 'GET /api/xhr-data':
        return json({ via: 'xhr', ok: true });
      case 'POST /api/upload':
        return readBody((body) => json({ received: body.length }));
      case 'GET /redirect':
        res.writeHead(302, { location: '/api/after-redirect', 'cache-control': 'no-store' });
        return res.end();
      case 'GET /api/after-redirect':
        return json({ redirected: true });
      case 'GET /api/set-cookie':
        return json({ cookie: 'set' }, { 'set-cookie': 'fixture_session=s3ss10n; Path=/; HttpOnly; SameSite=Lax' });
      case 'GET /slow':
        setTimeout(() => json({ slow: true }), slowMs);
        return;
      case 'GET /api/popup-data':
        return json({ popup: true });
      case 'GET /api/big':
        return send(200, 'application/json', bigBody);
      default:
        return send(404, 'text/plain', 'not found');
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
