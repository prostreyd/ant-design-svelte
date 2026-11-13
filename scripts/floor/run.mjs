// `npm run test:floor`: runs the smoke of the library (scripts/floor/smoke.cjs) in the engines of the lowest
// supported browser versions (specs/popup.md, "browser floor"), which the Playwright of the project cannot start.
//
// Every Playwright release carries its own engines, so the old versions come from the official Docker images of
// the old releases:
//
//   Chrome 89   Chromium 90.0.4392.0   Playwright 1.8.0   (the nearest build at or above 89: the one of Playwright
//                                       1.7.0, Chromium 89.0.4344.0, is an early build of the 89 branch that still lacks
//                                       what shipped in 89, e.g. the logical border radii and `forced-colors`)
//   Firefox 85  Firefox 85.0b5         Playwright 1.8.0
//   Safari 15.4 WebKit 15.4            Playwright 1.22.0   (WebKit of Linux: the engine of that version, not Safari)
//
// The e2e fixtures are built once for the floor (vite.floor.config.ts), served from this process and driven from
// inside a container on the host network. Needs Docker; the first run downloads the images (about 1.5 GB each)
// and installs the matching `playwright` package into tmp/floor/pw/<version>.
//
//   node scripts/floor/run.mjs [chromium] [firefox] [webkit]     (no argument: all three)
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const TARGETS = [
  { floor: 'Chrome 89 (Chromium 90.0.4392.0)', engine: 'chromium', playwright: '1.8.0' },
  { floor: 'Firefox 85', engine: 'firefox', playwright: '1.8.0' },
  { floor: 'Safari 15.4 (WebKit)', engine: 'webkit', playwright: '1.22.0' }
];

const root = resolve(import.meta.dirname, '../..');
const site = join(root, 'tmp/floor/site');
const out = join(root, 'tmp/floor/out');
const port = Number(process.env.FLOOR_PORT ?? 4181);
const wanted = process.argv.slice(2);
const targets = wanted.length ? TARGETS.filter((target) => wanted.includes(target.engine)) : TARGETS;

if (!targets.length) {
  console.error(`No such engine: ${wanted.join(', ')}. Use chromium, firefox or webkit.`);
  process.exit(2);
}

const imageOf = (target) => `mcr.microsoft.com/playwright:v${target.playwright}-focal`;
// Asynchronous on purpose: a blocking spawn would stop this process from answering the requests of the page that the
// container is loading from the server below.
const run = (command, args, options = {}) =>
  new Promise((done) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd: root, ...options });
    child.on('error', () => done({ status: 127 }));
    child.on('close', (status) => done({ status }));
  });

if ((await run('docker', ['version', '--format', '{{.Server.Version}}'], { stdio: 'ignore' })).status !== 0) {
  console.error('Docker is not available. test:floor needs it for the old Playwright images.');
  process.exit(2);
}

console.log('== build for the floor');
if ((await run('npx', ['vite', 'build', '--config', 'vite.floor.config.ts'], { env: { ...process.env, VITE_CONFIG_NATIVE_IGNORE_WARNING: 'true' } })).status !== 0) {
  process.exit(2);
}
mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  let file = normalize(join(site, pathname));
  if (!file.startsWith(site)) file = join(site, 'index.html');
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(site, 'index.html');
  response.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
  // With a length: the WebKit of the oldest release waits for the end of a chunked answer that never comes.
  response.setHeader('content-length', statSync(file).size);
  response.setHeader('connection', 'close');
  createReadStream(file).pipe(response);
});
await new Promise((done) => server.listen(port, '127.0.0.1', done));

const uid = process.getuid?.() ?? 1000;
const gid = process.getgid?.() ?? 1000;
// The old images keep their browsers in the home of root, so the container runs as root and gives what it wrote
// back to the user of the host (`own`), so that nothing in tmp/ belongs to root.
const docker = (target, args) => ['run', '--rm', '--network', 'host', '--ipc=host', ...args, imageOf(target)];
const own = (dir) => `code=$?; chown -R ${uid}:${gid} ${dir}; exit $code`;

const summary = [];
for (const target of targets) {
  console.log(`\n== ${target.floor}: ${target.engine}, Playwright ${target.playwright}`);
  const image = imageOf(target);
  if ((await run('docker', ['image', 'inspect', image], { stdio: 'ignore' })).status !== 0) {
    console.log(`pulling ${image}`);
    if ((await run('docker', ['pull', image])).status !== 0) {
      summary.push({ ...target, status: 'no image' });
      continue;
    }
  }
  const pw = join(root, 'tmp/floor/pw', target.playwright);
  if (!existsSync(join(pw, 'node_modules/playwright'))) {
    mkdirSync(pw, { recursive: true });
    const install = await run(
      'docker',
      docker(target, ['-v', `${pw}:/pw`, '-w', '/pw', '-e', 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1']).concat([
        'sh', '-c', `npm init -y >/dev/null && npm install --no-audit --no-fund playwright@${target.playwright}; ${own('/pw')}`
      ])
    );
    if (install.status !== 0) {
      summary.push({ ...target, status: 'install failed' });
      continue;
    }
  }
  const result = await run(
    'docker',
    docker(target, [
      '-v', `${join(root, 'scripts/floor')}:/smoke:ro`,
      '-v', `${join(pw, 'node_modules')}:/pw/node_modules:ro`,
      '-v', `${out}:/out`,
      '-e', 'NODE_PATH=/pw/node_modules'
    ]).concat(['sh', '-c', `node /smoke/smoke.cjs ${target.engine} http://127.0.0.1:${port} /out; ${own('/out')}`])
  );
  summary.push({ ...target, status: result.status === 0 ? 'pass' : 'FAIL' });
}
server.close();

console.log('\n== summary');
for (const entry of summary) {
  const file = join(out, `${entry.engine}.json`);
  const version = entry.status !== 'no image' && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).version : '';
  console.log(`${entry.status.padEnd(15)} ${entry.floor.padEnd(22)} ${version}`);
}
process.exit(summary.every((entry) => entry.status === 'pass') ? 0 : 1);
