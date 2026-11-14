<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { apiRows, demos, tokenRows } from '#docs/data/tooltip';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';
  import { tooltipExamples } from '#docs/tooltip-examples';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.tooltip'));
</script>

<Seo path="/components/tooltip/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.display'), href: `${localHref('/components/')}#g-display` },
    { label: 'Tooltip' }
  ]}
/>
<div class="title-row">
  <h1>Tooltip{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="tt.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Tooltip } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Tooltip">src/lib/Tooltip</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Tooltip/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="tt.w1" /></li>
  <li><T k="tt.w2" /></li>
  <li><T k="tt.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = tooltipExamples.find((item) => item.slug === demo.slug)}
    {#if example}
      <Demo
        id={demo.slug}
        title={demo.title[lang]}
        description={demo.description[lang]}
        code={example.code}
        example={example.component}
      />
    {/if}
  {/each}
</div>

<h2 id="api">API</h2>
<TableWrap labelledby="api">
  <table class="api" aria-labelledby="api">
    <thead>
      <tr>
        <th scope="col">{t('th.prop')}</th><th scope="col">{t('th.desc')}</th>
        <th scope="col">{t('th.type')}</th><th scope="col">{t('th.default')}</th>
      </tr>
    </thead>
    <tbody>
      {#each apiRows as row (row.name)}
        <tr>
          <th scope="row">{row.name}</th>
          <td><Html html={row.description[lang]} /></td>
          <td><span class="ty">{row.type}</span></td>
          <td class="df">{row.default}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</TableWrap>
<div class="callout"><T k="tt.diff" /></div>

<h2 id="tokens"><T k="b.h.tok" /></h2>
<TableWrap labelledby="tokens">
  <table class="api" aria-labelledby="tokens">
    <thead>
      <tr><th scope="col">{t('th.token')}</th><th scope="col">{t('th.desc')}</th><th scope="col">{t('th.default')}</th></tr>
    </thead>
    <tbody>
      {#each tokenRows as row (row.name)}
        <tr><th scope="row">{row.name}</th><td><Html html={row.description[lang]} /></td><td class="df">{row.value}</td></tr>
      {/each}
    </tbody>
  </table>
</TableWrap>

<h2 id="a11y-b"><T k="b.h.a11y" /></h2>
<ul>
  <li><T k="tt.a1" /></li>
  <li><T k="tt.a2" /></li>
  <li><T k="tt.a3" /></li>
  <li><T k="tt.a4" /></li>
  <li><T k="tt.a5" /></li>
  <li><T k="tt.a6" /></li>
  <li><T k="tt.a7" /></li>
</ul>
