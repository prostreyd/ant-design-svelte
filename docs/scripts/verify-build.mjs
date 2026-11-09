// Checks the built site (docs/build) the way a visitor and a crawler would meet it:
//   - every internal link, script, stylesheet and image points to a file that exists
//   - every #fragment points to an element that exists on the target page
//   - every page has a title, one <h1>, a description of a sensible length, a canonical URL, hreflang alternates,
//     Open Graph locale/image tags and structured data (JSON-LD) that points to pages that exist
//   - every language version is listed in sitemap.xml, and the sitemap lists nothing that is missing
//   - the IndexNow key file is in the build
// Run after `npm run build`, with the same BASE_PATH / SITE_ORIGIN the build used.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const base = process.env.BASE_PATH ?? '';
const origin = process.env.SITE_ORIGIN ?? 'https://prostreyd.github.io';
const siteUrl = origin + base;

if (!existsSync(root)) {
  console.error(`No build found at ${root}. Run "npm run build" first.`);
  process.exit(1);
}

const errors = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const files = [...walk(root)];
const pages = files.filter((f) => f.endsWith('.html'));
/** '/ru/docs/faq/' for build/ru/docs/faq/index.html */
const urlOf = (file) => '/' + relative(root, file).split(sep).join('/').replace(/index\.html$/, '');
const htmlCache = new Map();
const read = (file) => htmlCache.get(file) ?? (htmlCache.set(file, readFileSync(file, 'utf8')), htmlCache.get(file));

/** Maps a URL path (without base) to the file that serves it, or null. */
function fileFor(path) {
  const clean = decodeURIComponent(path);
  if (clean.endsWith('/')) {
    const index = join(root, clean, 'index.html');
    return existsSync(index) ? index : null;
  }
  const direct = join(root, clean);
  return existsSync(direct) && statSync(direct).isFile() ? direct : null;
}

function idsOf(file) {
  const ids = new Set();
  for (const m of read(file).matchAll(/\s(?:id|name)=(?:"([^"]*)"|'([^']*)')/g)) ids.add(m[1] ?? m[2]);
  return ids;
}

/** Search engines cut titles at about 60 and descriptions at about 160 characters; Chinese characters count double. */
const width = (text) => [...text].reduce((total, ch) => total + (/[\u2e80-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
const unescapeHtml = (text) => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const attribute = /\s(href|src)=("([^"]*)"|'([^']*)')/g;
const checked = new Set();

for (const page of pages) {
  const pageUrl = urlOf(page);
  const name = pageUrl === '/404.html' ? '404.html' : pageUrl;
  const html = read(page);
  // The fallback page is served for any unknown URL, so relative links in it make no sense to check.
  if (pageUrl === '/404.html') continue;

  // --- links and assets
  for (const m of html.matchAll(attribute)) {
    const raw = (m[3] ?? m[4]).replace(/&amp;/g, '&');
    if (!raw || /^(mailto:|tel:|javascript:|data:)/.test(raw)) continue;

    let url;
    try {
      url = new URL(raw, `${origin}${base}${pageUrl}`);
    } catch {
      fail(name, `malformed URL "${raw}"`);
      continue;
    }
    if (url.origin !== origin) continue; // external
    if (!url.pathname.startsWith(`${base}/`) && url.pathname !== base) {
      fail(name, `"${raw}" leaves the base path ${base || '/'}`);
      continue;
    }
    const path = url.pathname.slice(base.length) || '/';
    const target = fileFor(path);
    if (!target) {
      fail(name, `"${raw}" -> ${path} does not exist`);
      continue;
    }
    if (url.hash.length > 1) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!idsOf(target).has(id)) fail(name, `"${raw}": no element with id "${id}" on ${path}`);
    }
    checked.add(`${path}${url.hash}`);
  }

  // --- document structure and SEO
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  if (!title) fail(name, 'no <title>');
  else if (width(unescapeHtml(title)) > 65) fail(name, `<title> is ${width(unescapeHtml(title))} wide (limit 65): "${title}"`);
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (description === undefined) fail(name, 'no meta description');
  else if (width(unescapeHtml(description)) < 70 || width(unescapeHtml(description)) > 160) fail(name, `meta description is ${width(unescapeHtml(description))} wide (allowed 70 to 160)`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) fail(name, `${h1} <h1> elements (expected 1)`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const expected = `${siteUrl}${pageUrl}`;
  if (canonical !== expected) fail(name, `canonical is ${canonical}, expected ${expected}`);
  for (const lang of ['en', 'ru', 'zh-CN', 'x-default']) {
    if (!html.includes(`hreflang="${lang}"`)) fail(name, `no hreflang="${lang}" alternate`);
  }
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  const wanted = pageUrl.startsWith('/ru/') ? 'ru' : pageUrl.startsWith('/zh/') ? 'zh-CN' : 'en';
  if (lang !== wanted) fail(name, `<html lang="${lang}">, expected "${wanted}"`);

  const ogLocale = html.match(/<meta property="og:locale" content="([^"]+)"/)?.[1];
  const wantedLocale = { en: 'en_US', ru: 'ru_RU', 'zh-CN': 'zh_CN' }[wanted];
  if (ogLocale !== wantedLocale) fail(name, `og:locale is ${ogLocale}, expected ${wantedLocale}`);
  if ((html.match(/<meta property="og:locale:alternate"/g) ?? []).length !== 2) fail(name, 'expected two og:locale:alternate tags');
  for (const tag of ['og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:title', 'og:description', 'og:url']) {
    if (!html.includes(`<meta property="${tag}"`)) fail(name, `no ${tag} tag`);
  }

  // Structured data must parse, say what the page is, and point only to pages that exist.
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  if (blocks.length === 0) fail(name, 'no structured data (JSON-LD)');
  const documents = [];
  for (const block of blocks) {
    try {
      const json = JSON.parse(block);
      documents.push(...(Array.isArray(json) ? json : [json]));
    } catch (error) {
      fail(name, `structured data is not valid JSON: ${error.message}`);
    }
  }
  const types = documents.map((d) => d['@type']);
  const isHome = pageUrl === '/' || pageUrl === '/ru/' || pageUrl === '/zh/';
  if (isHome) {
    for (const type of ['WebSite', 'SoftwareSourceCode']) if (!types.includes(type)) fail(name, `structured data has no ${type}`);
  } else {
    const crumbs = documents.find((d) => d['@type'] === 'BreadcrumbList');
    if (!crumbs) fail(name, 'structured data has no BreadcrumbList');
    else {
      const items = crumbs.itemListElement ?? [];
      if (items.length < 2) fail(name, 'the breadcrumb list has fewer than two items');
      items.forEach((item, i) => {
        if (item.position !== i + 1) fail(name, `breadcrumb ${i + 1} has position ${item.position}`);
        if (!item.name) fail(name, `breadcrumb ${i + 1} has no name`);
        const target = typeof item.item === 'string' && item.item.startsWith(siteUrl) ? fileFor(item.item.slice(siteUrl.length) || '/') : null;
        if (!target) fail(name, `breadcrumb ${i + 1} points to ${item.item}, which does not exist`);
      });
      const section = ['/docs/', '/components/'].map((p) => `${siteUrl}${pageUrl.startsWith('/ru/') ? '/ru' : pageUrl.startsWith('/zh/') ? '/zh' : ''}${p}`);
      const last = items.at(-1)?.item;
      if (last !== expected && !section.includes(last)) fail(name, `the last breadcrumb is ${last}, expected this page`);
    }
  }

  // --- leftovers of a broken template
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const bad of ['{@html', '[object ', 'NaN', '$$']) {
    if (text.includes(bad)) fail(name, `contains "${bad}"`);
  }
  // The word may appear in prose ("the variables are undefined"); an element or attribute that is only it may not.
  if (/>\s*undefined\s*</.test(text) || /="undefined"/.test(text)) fail(name, 'an element or attribute shows "undefined"');
}

// --- unique titles per language
const titles = new Map();
for (const page of pages) {
  const url = urlOf(page);
  if (url === '/404.html') continue;
  const title = read(page).match(/<title>([^<]*)<\/title>/)?.[1];
  const group = url.startsWith('/ru/') ? 'ru' : url.startsWith('/zh/') ? 'zh' : 'en';
  const key = `${group}: ${title}`;
  if (titles.has(key)) fail(url, `same <title> as ${titles.get(key)}`);
  else titles.set(key, url);
}

// --- sitemap <-> pages
const sitemapFile = join(root, 'sitemap.xml');
if (!existsSync(sitemapFile)) {
  fail('sitemap.xml', 'missing');
} else {
  const listed = new Set([...read(sitemapFile).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const built = new Set(pages.map(urlOf).filter((u) => u !== '/404.html').map((u) => `${siteUrl}${u}`));
  for (const url of built) if (!listed.has(url)) fail('sitemap.xml', `does not list ${url}`);
  for (const url of listed) if (!built.has(url)) fail('sitemap.xml', `lists ${url}, which was not built`);
}

for (const required of ['robots.txt', 'og.png', 'favicon.svg', '404.html']) {
  if (!existsSync(join(root, required))) fail(required, 'missing from the build');
}

// IndexNow: the key file (name = key, content = key) must be served from the root of the site.
const keyFiles = readdirSync(root).filter((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (keyFiles.length !== 1) fail('IndexNow key file', `expected exactly one <32 hex characters>.txt in the build, found ${keyFiles.length}`);
else if (readFileSync(join(root, keyFiles[0]), 'utf8') !== keyFiles[0].slice(0, -'.txt'.length)) fail(keyFiles[0], 'must contain exactly its own name without .txt');

if (errors.length) {
  console.error(`\n${errors.length} problem(s) in the built site:\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`Built site OK: ${pages.length} HTML files, ${checked.size} distinct internal targets checked.`);
