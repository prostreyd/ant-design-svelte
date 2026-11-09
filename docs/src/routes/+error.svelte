<script lang="ts">
  import { page } from '$app/state';
  import { href } from '#docs/href';
  import { currentLang } from '#docs/i18n/use-t';
  import { translate } from '#docs/i18n';
  import { Button } from 'svelte-ant-design';
  import HtmlLang from '#docs/components/HtmlLang.svelte';
  import Logo from '#docs/components/Logo.svelte';

  const lang = $derived(currentLang());
</script>

<HtmlLang />

<svelte:head>
  <title>{translate(lang, 'e404.title')} · svelte-ant-design</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="err">
  <a class="logo" href={href(lang === 'en' ? '/' : `/${lang}/`)}><Logo /><span>svelte-ant-design</span></a>
  <h1>{page.status === 404 ? translate(lang, 'e404.title') : page.status}</h1>
  <p>{page.status === 404 ? translate(lang, 'e404.text') : page.error?.message}</p>
  <Button type="primary" href={href(lang === 'en' ? '/' : `/${lang}/`)}>{translate(lang, 'e404.home')}</Button>
</main>
