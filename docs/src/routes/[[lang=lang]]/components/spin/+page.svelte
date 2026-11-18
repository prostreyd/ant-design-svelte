<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { apiRows, demos, partRows, tokenRows } from '#docs/data/spin';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';
  import { spinExamples } from '#docs/spin-examples';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.spin'));
</script>

<Seo path="/components/spin/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.feedback'), href: `${localHref('/components/')}#g-feedback` },
    { label: 'Spin' }
  ]}
/>
<div class="title-row">
  <h1>Spin{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="spn.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Spin } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Spin">src/lib/Spin</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Spin/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="spn.w1" /></li>
  <li><T k="spn.w2" /></li>
  <li><T k="spn.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = spinExamples.find((item) => item.slug === demo.slug)}
    {#if example}
      <Demo
        id={demo.slug}
        title={demo.title[lang]}
        description={demo.description[lang]}
        code={example.code}
        example={example.component}
        wide={demo.wide}
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
<div class="callout"><T k="spn.diff" /></div>

<h2 id="parts"><T k="spn.h.parts" /></h2>
<TableWrap labelledby="parts">
  <table class="api" aria-labelledby="parts">
    <thead>
      <tr><th scope="col">{t('th.part')}</th><th scope="col">{t('th.desc')}</th></tr>
    </thead>
    <tbody>
      {#each partRows as row (row.name)}
        <tr>
          <th scope="row">{row.name}</th>
          <td><Html html={row.description[lang]} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
</TableWrap>

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
  <li><T k="spn.a1" /></li>
  <li><T k="spn.a2" /></li>
  <li><T k="spn.a3" /></li>
  <li><T k="spn.a4" /></li>
  <li><T k="spn.a5" /></li>
  <li><T k="spn.a6" /></li>
  <li><T k="spn.a7" /></li>
</ul>
