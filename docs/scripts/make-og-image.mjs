// Renders static/og.png (1200x630), the preview image shown when a link to the site is shared.
// Uses the logo paths of the site and the browser from Playwright. Run it when the branding changes:
//   node scripts/make-og-image.mjs
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logoSource = readFileSync(join(docs, 'src/docs/logo-paths.ts'), 'utf8');
const css = readFileSync(join(docs, 'src/docs/styles/site.css'), 'utf8');

const path = (name) => JSON.parse(new RegExp(`export const ${name} = (".*?");`, 's').exec(logoSource)[1]);
const color = (name) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)[1];
const red = color('logo-red');
const blue = color('logo-blue');

const pill = 'padding:7px 20px;border-radius:8px;font-size:24px;border:1px solid #d9d9d9;color:#434343';
const html = `<!doctype html><html><body style="margin:0;width:1200px;height:630px;box-sizing:border-box;display:flex;align-items:center;gap:56px;padding:0 88px;
background:linear-gradient(135deg,#ffffff 0%,#f0f6ff 100%);font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif;color:#1f1f1f">
<svg viewBox="60 90 860 840" width="290" height="283" style="flex:none">
  <path fill="${red}" fill-rule="evenodd" d="${path('LOGO_RED')}"/><path fill="${red}" fill-rule="evenodd" d="${path('LOGO_S')}"/>
  <path fill="${blue}" fill-rule="evenodd" d="${path('LOGO_BLUE')}"/>
</svg>
<div>
  <div style="font-size:68px;font-weight:700;letter-spacing:-1.5px;line-height:1.05;white-space:nowrap">svelte-ant-design</div>
  <div style="font-size:34px;color:#595959;margin-top:22px;line-height:1.35">Ant Design–style components<br>for Svelte 5</div>
  <div style="margin-top:36px;display:flex;gap:14px">
    <span style="${pill};background:#1677ff;border-color:#1677ff;color:#fff">TypeScript</span>
    <span style="${pill}">Runes</span><span style="${pill}">Accessible</span>
  </div>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: join(docs, 'static/og.png') });
await browser.close();
console.log('static/og.png written');
