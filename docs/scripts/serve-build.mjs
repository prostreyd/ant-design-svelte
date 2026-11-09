// Serves docs/build the way GitHub Pages does, so the site can be tested before it is deployed:
//   - under the base path (BASE_PATH, '' by default)
//   - /dir answers with a redirect to /dir/
//   - an unknown URL gets 404.html with status 404
// Used by the end-to-end tests and by `npm run serve`. Usage: BASE_PATH=/ant-design-svelte PORT=4175 node scripts/serve-build.mjs
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const base = process.env.BASE_PATH ?? '';
const port = Number(process.env.PORT ?? 4175);

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No build found at ${root}. Run "npm run build" first (with the same BASE_PATH).`);
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const send = (res, file, status = 200) => {
  res.writeHead(status, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
};
const notFound = (res) => send(res, join(root, '404.html'), 404);
const redirect = (res, location) => {
  res.writeHead(301, { Location: location });
  res.end();
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  let path;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    return notFound(res);
  }
  if (base && path === base) return redirect(res, `${base}/`);
  if (base && !path.startsWith(`${base}/`)) return notFound(res);
  path = path.slice(base.length) || '/';

  const file = normalize(join(root, path));
  if (file !== root && !file.startsWith(root + sep)) return notFound(res);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith('/')) return redirect(res, `${base}${path}/`);
    const index = join(file, 'index.html');
    return existsSync(index) ? send(res, index) : notFound(res);
  }
  return existsSync(file) ? send(res, file) : notFound(res);
}).listen(port, () => console.log(`Serving ${root} at http://localhost:${port}${base}/`));
