<script lang="ts">
  import { page } from '$app/state';
  import { VERSION } from 'svelte-ant-design';
  import { LANG_INFO, LANGS, plain, translate, type Lang } from '#docs/i18n';
  import { allPages, localize, sectionOf, type SitePath } from '#docs/pages';
  import { BRAND, REPO, SITE_URL } from '#docs/site';

  /**
   * What a search engine or a link preview needs to know about a page: title, description, canonical URL,
   * language alternates, Open Graph tags and structured data. The title and the description come from the
   * page registry (pages.ts), so they cannot drift from the menus and the sitemap. `path` has no language prefix.
   */
  let { path }: { path: SitePath } = $props();

  const lang = $derived(page.data.lang);
  const def = $derived.by(() => {
    const found = allPages.find((p) => p.path === path);
    if (!found) throw new Error(`Seo: ${path} is not in the page registry (docs/src/docs/pages.ts)`);
    return found;
  });
  const home = $derived(path === '/');
  const title = $derived(plain(translate(lang, def.title)));
  const fullTitle = $derived(home ? title : `${title} · ${BRAND}`);
  const description = $derived(plain(translate(lang, def.description)));
  const url = (l: Lang) => `${SITE_URL}${localize(path, l)}`;
  const here = $derived(url(lang));
  const imageAlt = $derived(translate(lang, 'seo.ogalt'));

  /** Structured data: the site and the library on the home page, a breadcrumb trail on every other page. */
  const structured = $derived.by(() => {
    const inLanguage = LANG_INFO[lang].html;
    const homeUrl = `${SITE_URL}${localize('/', lang)}`;
    if (home) {
      return [
        { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: homeUrl, inLanguage },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: BRAND,
          description,
          url: here,
          codeRepository: REPO,
          programmingLanguage: ['TypeScript', 'Svelte'],
          license: 'https://opensource.org/licenses/MIT',
          version: VERSION,
          inLanguage
        }
      ];
    }
    const section = sectionOf(path);
    const sectionPath: SitePath = section === 'docs' ? '/docs/' : '/components/';
    const trail = [
      { name: BRAND, item: homeUrl },
      { name: translate(lang, section === 'docs' ? 'nav.docs' : 'nav.components'), item: `${SITE_URL}${localize(sectionPath, lang)}` },
      ...(path === sectionPath ? [] : [{ name: title, item: here }])
    ];
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: trail.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, ...crumb }))
    };
  });
  // "<" is escaped so that no text can close the script element.
  const structuredScript = $derived(`<script type="application/ld+json">${JSON.stringify(structured).replace(/</g, '\\u003c')}</${'script'}>`);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={here} />
  {#each LANGS as l (l)}
    <link rel="alternate" hreflang={LANG_INFO[l].html} href={url(l)} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={url('en')} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={BRAND} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={here} />
  <meta property="og:locale" content={LANG_INFO[lang].og} />
  {#each LANGS.filter((l) => l !== lang) as other (other)}
    <meta property="og:locale:alternate" content={LANG_INFO[other].og} />
  {/each}
  <meta property="og:image" content="{SITE_URL}/og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={imageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image:alt" content={imageAlt} />
  <!-- The JSON is built from the static registry and strings of this repository, never from user input. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html structuredScript}
</svelte:head>
