<script lang="ts">
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';

  const t = useT();
  const questions = [1, 2, 3, 4, 5, 6] as const;
</script>

<Seo title={t('d.faq')} description={t('faq.lead')} path="/docs/faq/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.faq') }]} />
<h1><T k="d.faq" /></h1>
<p class="lede"><T k="faq.lead" /></p>

{#each questions as n (n)}
  <h2 id="q{n}"><T k={`faq.q${n}`} /></h2>
  <p><T k={`faq.a${n}`} /></p>
{/each}
