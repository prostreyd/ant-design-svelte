# Documentation site

The site of **svelte-ant-design**, published on GitHub Pages: <https://prostreyd.github.io/ant-design-svelte/>.
It is a SvelteKit app (an npm workspace of this repository) that is prerendered to static files. It imports the
library from `../src/lib`, so every example runs the code that is in the repository.

```sh
npm run dev          # from the repository root: the site with live reload
npm run check:docs   # type check
BASE_PATH=/ant-design-svelte npm run build   # static site in docs/build (leave BASE_PATH unset to serve from /)
BASE_PATH=/ant-design-svelte npm run test:docs   # link/SEO check of the build, then browser tests
```

`npm run serve -w docs` serves `docs/build` the way GitHub Pages does (base path, redirect to a trailing slash, `404.html`).

## Layout

| Path | What it holds |
|------|---------------|
| `src/routes/[[lang=lang]]/` | The pages. English is served from the root, Russian and Chinese under `/ru/` and `/zh/`. |
| `src/docs/pages.ts` | The page registry and the component list with its roadmap phase. Menus, search, the sitemap and the prerender list are built from it. |
| `src/docs/i18n/strings.ts` | Every text of the site in `en`, `ru` and `zh`. |
| `src/docs/data/` | API and design-token tables of a component. |
| `src/docs/examples/<component>/` | One runnable `.svelte` file per example. The code shown on the page is this file. |
| `src/docs/components/` | Site components (header, sidebar, code blocks, ...). |
| `src/docs/styles/site.css` | Site styles. They use the library tokens plus a few `--s-*` variables. |
| `scripts/` | `verify-build.mjs` (checks the build), `serve-build.mjs`, `make-og-image.mjs`. |
| `e2e/` | Playwright tests of the built site. |

The tests in `../tests/docs/` keep the content honest: the API table must match `Button.svelte`, the token table must
match `tokens.css`, every example must render, all texts must exist in three languages, and every route must be in the
registry.

## Adding a component page

1. Write the data (`src/docs/data/<component>.ts`: demos, API rows, token rows) and one example file per demo in
   `src/docs/examples/<component>/` (`01-name.svelte`, ...). Copy the Button files as a starting point.
2. Add the route `src/routes/[[lang=lang]]/components/<component>/+page.svelte` and an entry in `componentPages` of
   `pages.ts`; in `componentGroups` set the component's `phase` to `'now'` and give it a `path`.
3. Add the texts to `strings.ts` in all three languages.
4. Add `tests/docs/<component>-page.test.ts` (compare the tables with the sources, as the Button test does) and run
   `npm test`, `npm run check:docs`, the build and `npm run test:docs`.

Texts may contain `<code>` only (they are rendered as HTML). Use `useT()` and `<T k="..." />` in components.

## Search engines and link previews

- `Seo.svelte` writes the title, description, canonical URL, hreflang links, Open Graph tags and JSON-LD of every
  page. The title and the description come from the page registry (`pages.ts` -> `strings.ts`, the `seo.*` texts), so
  a new page only needs its registry entry. Keep titles within 65 and descriptions within 70 to 160 characters
  (Chinese characters count double); `tests/docs/content.test.ts` and `scripts/verify-build.mjs` enforce it.
- The home page carries `WebSite` and `SoftwareSourceCode` data, every other page a `BreadcrumbList`.
- `robots.txt` and `sitemap.xml` are generated from the registry. Crawlers read `robots.txt` only at the root of the host,
  and `prostreyd.github.io` has no root site, so the sitemap has to be submitted in Google Search Console and Bing
  Webmaster Tools; it is not discovered on its own.
- `npm run indexnow -w docs` tells Bing, Yandex and the other IndexNow search engines about every URL of the live
  sitemap (run it after a deploy that changed pages; `-- --dry-run` shows what would be sent). It needs no account:
  the key file `static/<key>.txt` proves that the site is ours and is public on purpose. Google ignores IndexNow;
  for Google use Search Console.
