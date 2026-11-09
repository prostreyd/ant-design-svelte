<script lang="ts">
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { development } from '#docs/snippets';

  const t = useT();
</script>

<Seo path="/docs/contributing/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.contrib') }]} />
<h1><T k="d.contrib" /></h1>
<p class="lede"><T k="contrib.lead" /></p>

<h2 id="flow"><T k="contrib.h.flow" /></h2>
<ol>
  <li><T k="contrib.s1" /></li>
  <li><T k="contrib.s2" /></li>
  <li><T k="contrib.s3" /></li>
  <li><T k="contrib.s4" /></li>
  <li><T k="contrib.s5" /></li>
  <li><T k="contrib.s6" /></li>
</ol>

<h2 id="dev"><T k="contrib.h.dev" /></h2>
<CodeBlock code={development.code} kind={development.kind} />

<h2 id="ai"><T k="contrib.h.ai" /></h2>
<p><T k="contrib.ai" /></p>
