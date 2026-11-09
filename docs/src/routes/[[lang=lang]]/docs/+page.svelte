<script lang="ts">
  import { Button } from 'svelte-ant-design';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';

  const t = useT();
</script>

<Seo title={t('d.intro')} description={t('intro.lead')} path="/docs/" />
<Crumbs items={[{ label: t('nav.docs'), href: localHref('/docs/') }, { label: t('d.intro') }]} />
<h1><T k="d.intro" /></h1>
<p class="lede"><T k="intro.lead" /></p>
<div class="callout"><T k="intro.callout" /></div>

<h2 id="features"><T k="intro.h.feat" /></h2>
<ul>
  <li><T k="intro.f1" /></li>
  <li><T k="intro.f2" /></li>
  <li><T k="intro.f3" /></li>
  <li><T k="intro.f4" /></li>
  <li><T k="intro.f5" /></li>
</ul>

<h2 id="env"><T k="intro.h.env" /></h2>
<ul>
  <li><T k="intro.e1" /></li>
  <li><T k="intro.e2" /></li>
  <li><T k="intro.e3" /></li>
</ul>

<h2 id="status"><T k="intro.h.status" /></h2>
<p><T k="intro.status" /></p>
<div class="cta" style="margin-top: 20px">
  <Button type="primary" href={localHref('/docs/getting-started/')}>{t('intro.cta')}</Button>
</div>
