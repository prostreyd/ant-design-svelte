<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { demos, funcRows, methodRows, propRows, tokenRows } from '#docs/data/modal';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { modalExamples } from '#docs/modal-examples';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.modal'));
  const tables = $derived([
    { id: 'api-props', heading: t('mod.h.props'), rows: propRows },
    { id: 'api-func', heading: t('mod.h.func'), rows: funcRows },
    { id: 'api-methods', heading: t('mod.h.methods'), rows: methodRows }
  ]);
</script>

<Seo path="/components/modal/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.feedback'), href: `${localHref('/components/')}#g-feedback` },
    { label: 'Modal' }
  ]}
/>
<div class="title-row">
  <h1>Modal{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="mod.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Modal, modal, ModalHost } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Modal">src/lib/Modal</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Modal/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="mod.w1" /></li>
  <li><T k="mod.w2" /></li>
  <li><T k="mod.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = modalExamples.find((item) => item.slug === demo.slug)}
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
{#each tables as table (table.id)}
  <h3 id={table.id}>{table.heading}</h3>
  <TableWrap labelledby={table.id}>
    <table class="api" aria-labelledby={table.id}>
      <thead>
        <tr>
          <th scope="col">{t('th.prop')}</th><th scope="col">{t('th.desc')}</th>
          <th scope="col">{t('th.type')}</th><th scope="col">{t('th.default')}</th>
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row (row.name)}
          <tr>
            <th scope="row"><Html html={row.name} /></th>
            <td><Html html={row.description[lang]} /></td>
            <td><span class="ty">{row.type}</span></td>
            <td class="df">{row.default}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </TableWrap>
{/each}
<div class="callout"><T k="mod.diff" /></div>

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
  <li><T k="mod.a1" /></li>
  <li><T k="mod.a2" /></li>
  <li><T k="mod.a3" /></li>
  <li><T k="mod.a4" /></li>
  <li><T k="mod.a5" /></li>
  <li><T k="mod.a6" /></li>
  <li><T k="mod.a7" /></li>
  <li><T k="mod.a8" /></li>
</ul>
