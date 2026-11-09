<script lang="ts">
  import { page } from '$app/state';
  import { LANG_INFO, LANGS, plain } from '#docs/i18n';
  import { localize, type SitePath } from '#docs/pages';
  import { SITE_URL } from '#docs/site';

  /** Title, description, canonical and language alternates of a page. `path` has no language prefix. */
  let { title, description, path, home = false }: { title: string; description: string; path: SitePath; home?: boolean } = $props();

  const fullTitle = $derived(home ? title : `${title} · svelte-ant-design`);
  const text = $derived(plain(description));
  const url = (lang: (typeof LANGS)[number]) => `${SITE_URL}${localize(path, lang)}`;
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={text} />
  <link rel="canonical" href={url(page.data.lang)} />
  {#each LANGS as lang (lang)}
    <link rel="alternate" hreflang={LANG_INFO[lang].html} href={url(lang)} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={url('en')} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="svelte-ant-design" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={text} />
  <meta property="og:url" content={url(page.data.lang)} />
  <meta property="og:image" content="{SITE_URL}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>
