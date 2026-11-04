// A small deterministic site for the recorder tests. Loopback only; it never contacts the internet.
//
//   /                     buttons that fire each kind of request; each sets window.done[<name>] when answered
//   /popup                a page opened with window.open; fetches /api/popup-data on load
//   /api/items            GET -> JSON list; POST (JSON body) -> JSON with a new id
//   /api/xhr-data         JSON, called through XMLHttpRequest
//   /api/upload           multipart/form-data with a text field and a Blob file part
//   /redirect             302 -> /api/after-redirect
//   /api/set-cookie       sets `fixture_session`
//   /slow                 answers after slowMs
//   /api/popup-data       JSON for the popup

import http from 'node:http';
import type { AddressInfo } from 'node:net';

export const slowMs = 300;

const indexHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>fixture</title></head>
<body>
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

const popupHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>popup</title></head>
<body><script>
fetch('/api/popup-data').then((r) => r.json()).then(() => { document.title = 'popup-done'; });
</script></body></html>`;

export interface FixtureSite {
  url: string;
  close(): Promise<void>;
}

export async function startFixtureSite(): Promise<FixtureSite> {
  let nextId = 1;
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

    switch (`${req.method} ${url.pathname}`) {
      case 'GET /':
        return send(200, 'text/html; charset=utf-8', indexHtml);
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
