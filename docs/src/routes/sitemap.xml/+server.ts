import { allPages, localize } from '#docs/pages';
import { LANGS, LANG_INFO } from '#docs/i18n';
import { SITE_URL } from '#docs/site';
import type { RequestHandler } from './$types';

export const prerender = true;

const url = (path: string) => `${SITE_URL}${path}`;

/** One <url> per page and language, each listing all the language versions (hreflang). */
export const GET: RequestHandler = () => {
  const entries = allPages.flatMap((page) =>
    LANGS.map((lang) => {
      const alternates = LANGS.map(
        (l) => `    <xhtml:link rel="alternate" hreflang="${LANG_INFO[l].html}" href="${url(localize(page.path, l))}" />`
      ).join('\n');
      return `  <url>\n    <loc>${url(localize(page.path, lang))}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${url(page.path)}" />\n  </url>`;
    })
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
