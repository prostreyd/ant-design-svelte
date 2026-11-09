<script lang="ts">
  import HtmlLang from '#docs/components/HtmlLang.svelte';
  import SiteFooter from '#docs/components/SiteFooter.svelte';
  import SiteHeader from '#docs/components/SiteHeader.svelte';
  import { useT } from '#docs/i18n/use-t';

  let { children } = $props();
  const t = useT();
</script>

<HtmlLang />
<a class="skip" href="#main">{t('skip')}</a>
<SiteHeader />
{@render children()}
<SiteFooter />
