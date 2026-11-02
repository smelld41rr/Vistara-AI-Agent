import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
export async function startServer(dist, fixtures) {
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      const isFixture = path.startsWith('/fixtures/');
      const root = resolve(isFixture ? fixtures : dist);
      const relative = decodeURIComponent(isFixture ? path.slice('/fixtures/'.length) : path.slice(1));
      const file = resolve(root, relative || 'sidepanel.html');
      if (!file.startsWith(root + sep)) throw new Error('Outside static root');
      const extension = /\.[a-z]+$/.exec(file)?.[0];
      response.writeHead(200, { 'Content-Type': types[extension] ?? 'application/octet-stream' });
      response.end(await readFile(file));
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}
