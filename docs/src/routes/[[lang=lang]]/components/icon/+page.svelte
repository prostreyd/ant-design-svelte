<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import IconGallery from '#docs/components/IconGallery.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { apiRows, demos, fnRows, tokenRows } from '#docs/data/icon';
  import { localHref } from '#docs/href';
  import { iconExamples } from '#docs/icon-examples';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.icon'));
</script>

<Seo path="/components/icon/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.general'), href: `${localHref('/components/')}#g-general` },
    { label: 'Icon' }
  ]}
/>
<div class="title-row">
  <h1>Icon{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="icn.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd>
    <code>{"import { StarOutlined } from 'svelte-ant-design/icons';"}</code>
    <code>{"import { Icon } from 'svelte-ant-design';"}</code>
  </dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Icon">src/lib/Icon</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Icon/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="icn.w1" /></li>
  <li><T k="icn.w2" /></li>
  <li><T k="icn.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = iconExamples.find((item) => item.slug === demo.slug)}
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

<h2 id="gallery"><T k="icn.h.gallery" /></h2>
<p><T k="icn.gallery.lead" /></p>
<IconGallery />

<h2 id="api">API</h2>
<p><T k="icn.ready" /></p>
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
<div class="callout"><T k="icn.diff" /></div>

<h2 id="functions"><T k="icn.h.fn" /></h2>
<TableWrap labelledby="functions">
  <table class="api" aria-labelledby="functions">
    <thead>
      <tr><th scope="col">{t('icn.th.fn')}</th><th scope="col">{t('th.desc')}</th><th scope="col">{t('th.type')}</th></tr>
    </thead>
    <tbody>
      {#each fnRows as row (row.name)}
        <tr>
          <th scope="row">{row.name}</th>
          <td><Html html={row.description[lang]} /></td>
          <td><span class="ty">{row.signature}</span></td>
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
  <li><T k="icn.a1" /></li>
  <li><T k="icn.a2" /></li>
  <li><T k="icn.a3" /></li>
  <li><T k="icn.a4" /></li>
  <li><T k="icn.a5" /></li>
  <li><T k="icn.a6" /></li>
  <li><T k="icn.a7" /></li>
</ul>
