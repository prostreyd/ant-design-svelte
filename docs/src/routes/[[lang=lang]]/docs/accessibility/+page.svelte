<script lang="ts">
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { iconOnly } from '#docs/snippets';

  const t = useT();
</script>

<Seo path="/docs/accessibility/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.a11y') }]} />
<h1><T k="d.a11y" /></h1>
<p class="lede"><T k="a11y.lead" /></p>

<h2 id="rules"><T k="a11y.h.rules" /></h2>
<ul>
  <li><T k="a11y.r1" /></li>
  <li><T k="a11y.r2" /></li>
  <li><T k="a11y.r3" /></li>
  <li><T k="a11y.r4" /></li>
  <li><T k="a11y.r5" /></li>
</ul>

<h2 id="icononly"><T k="a11y.h.icon" /></h2>
<p><T k="a11y.icon" /></p>
<CodeBlock code={iconOnly.code} kind={iconOnly.kind} />

<h2 id="tests"><T k="a11y.h.tests" /></h2>
<p><T k="a11y.tests" /></p>
