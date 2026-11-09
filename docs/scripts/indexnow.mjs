// Tells the search engines that support IndexNow (Bing, Yandex, Naver, Seznam; DuckDuckGo uses Bing's index) that the
// pages of the live site are new or changed. No account is needed: the key file in static/ proves that the site is ours
// (it is public on purpose). Google does not support IndexNow; submit sitemap.xml in Google Search Console instead.
//
//   node scripts/indexnow.mjs            submit every URL of the live sitemap (run it after a deploy)
//   node scripts/indexnow.mjs --dry-run  show what would be sent, send nothing
//
// SITE_URL overrides the address of the site (default: https://prostreyd.github.io/ant-design-svelte).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dryRun = process.argv.includes('--dry-run');
const siteUrl = (process.env.SITE_URL ?? 'https://prostreyd.github.io/ant-design-svelte').replace(/\/$/, '');
const staticDir = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'static');

const fail = (message) => {
  console.error(`IndexNow: ${message}`);
  process.exit(1);
};

const keyFile = readdirSync(staticDir).find((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) fail(`no key file (32 hex characters + .txt) in ${staticDir}`);
const key = keyFile.slice(0, -'.txt'.length);
if (readFileSync(join(staticDir, keyFile), 'utf8') !== key) fail(`${keyFile} must contain exactly its own name without .txt`);
const keyLocation = `${siteUrl}/${keyFile}`;

const sitemapResponse = await fetch(`${siteUrl}/sitemap.xml`);
if (!sitemapResponse.ok) fail(`${siteUrl}/sitemap.xml answered ${sitemapResponse.status}`);
const urlList = [...(await sitemapResponse.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) fail('the sitemap lists no URLs');
// The key file may only vouch for the URLs below its own directory.
const outside = urlList.filter((url) => !url.startsWith(`${siteUrl}/`));
if (outside.length) fail(`URLs outside ${siteUrl}/: ${outside.join(', ')}`);

const payload = { host: new URL(siteUrl).host, key, keyLocation, urlList };
const keyResponse = await fetch(keyLocation);
const keyReachable = keyResponse.ok && (await keyResponse.text()).trim() === key;

if (dryRun) {
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\nKey file ${keyReachable ? 'is reachable on the live site' : 'is NOT reachable yet (deploy the site first)'}; nothing was sent.`);
  process.exit(0);
}
if (!keyReachable) fail(`${keyLocation} is not reachable or does not contain the key; deploy the site first`);

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload)
});
const hints = { 400: 'bad request', 403: 'the key is not valid or not found at keyLocation', 422: 'the URLs do not belong to the host or the key does not match', 429: 'too many requests' };
console.log(`IndexNow answered ${response.status} ${response.statusText} for ${urlList.length} URLs` + (hints[response.status] ? ` (${hints[response.status]})` : ''));
process.exit(response.status === 200 || response.status === 202 ? 0 : 1);
