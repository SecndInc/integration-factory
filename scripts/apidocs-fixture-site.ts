// Run the recorder's fixture site on its own so a person or an agent can drill the pipeline offline.
//
//   npx tsx scripts/apidocs-fixture-site.ts
//
// Prints `fixture: http://127.0.0.1:<port>` and writes the same URL to jobs/fixture-site.url, then stays up
// until Ctrl+C. The site is loopback only and deterministic (test/apidocs/fixtures/site.ts documents its
// routes). It is a stand-in for a staging environment: nothing on it is real, so write workflows are fine.

import { promises as fs } from 'node:fs';
import { startFixtureSite } from '../test/apidocs/fixtures/site.js';

const site = await startFixtureSite();
await fs.mkdir('jobs', { recursive: true });
await fs.writeFile('jobs/fixture-site.url', `${site.url}\n`);
process.stdout.write(`fixture: ${site.url}\n`);
process.stdout.write('url file: jobs/fixture-site.url (Ctrl+C stops the site)\n');

const stop = async () => {
  await site.close();
  await fs.rm('jobs/fixture-site.url', { force: true });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
