<script lang="ts">
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import PackageTabs from '#docs/components/PackageTabs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { kitLayout, typesImport, usage } from '#docs/snippets';

  const t = useT();
</script>

<Seo title={t('d.start')} description={t('start.lead')} path="/docs/getting-started/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.start') }]} />
<h1><T k="d.start" /></h1>
<p class="lede"><T k="start.lead" /></p>

<h2 id="install"><T k="start.h.install" /></h2>
<p><T k="start.install" /></p>
<PackageTabs />

<h2 id="use"><T k="start.h.use" /></h2>
<p><T k="start.use" /></p>
<CodeBlock code={usage.code} kind={usage.kind} />

<h2 id="kit"><T k="start.h.kit" /></h2>
<p><T k="start.kit" /></p>
<CodeBlock code={kitLayout.code} kind={kitLayout.kind} />

<h2 id="ts"><T k="start.h.ts" /></h2>
<p><T k="start.ts" /></p>
<CodeBlock code={typesImport.code} kind={typesImport.kind} />
