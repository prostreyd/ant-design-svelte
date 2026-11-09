<script lang="ts">
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { darkAttribute, darkSystem } from '#docs/snippets';

  const t = useT();
</script>

<Seo title={t('d.dark')} description={t('dark.lead')} path="/docs/dark-mode/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.dark') }]} />
<h1><T k="d.dark" /></h1>
<p class="lede"><T k="dark.lead" /></p>
<CodeBlock code={darkAttribute.code} kind={darkAttribute.kind} />

<h2 id="system"><T k="dark.h.system" /></h2>
<p><T k="dark.system" /></p>
<CodeBlock code={darkSystem.code} kind={darkSystem.kind} />

<h2 id="scheme"><T k="dark.h.scheme" /></h2>
<p><T k="dark.scheme" /></p>
