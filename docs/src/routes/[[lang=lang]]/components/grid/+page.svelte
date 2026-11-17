<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import type { ApiRow } from '#docs/data/button';
  import { breakpointsRows, colApiRows, constantRows, demos, rowApiRows, sizeRows } from '#docs/data/grid';
  import { gridExamples } from '#docs/grid-examples';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.grid'));
</script>

{#snippet propTable(id: string, rows: ApiRow[])}
  <TableWrap labelledby={id}>
    <table class="api" aria-labelledby={id}>
      <thead>
        <tr>
          <th scope="col">{t('th.prop')}</th><th scope="col">{t('th.desc')}</th>
          <th scope="col">{t('th.type')}</th><th scope="col">{t('th.default')}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.name)}
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
{/snippet}

<Seo path="/components/grid/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.layout'), href: `${localHref('/components/')}#g-layout` },
    { label: 'Grid' }
  ]}
/>
<div class="title-row">
  <h1>Grid{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="gr.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Row, Col, Breakpoints } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Grid">src/lib/Grid</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Grid/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="gr.w1" /></li>
  <li><T k="gr.w2" /></li>
  <li><T k="gr.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = gridExamples.find((item) => item.slug === demo.slug)}
    {#if example}
      <Demo
        id={demo.slug}
        title={demo.title[lang]}
        description={demo.description[lang]}
        code={example.code}
        example={example.component}
        wide={demo.wide}
        column={demo.column}
      />
    {/if}
  {/each}
</div>

<h2 id="api">Row API</h2>
{@render propTable('api', rowApiRows)}
<div class="callout"><T k="gr.diff" /></div>

<h2 id="api-col"><T k="gr.h.col" /></h2>
{@render propTable('api-col', colApiRows)}

<h2 id="api-size"><T k="gr.h.size" /></h2>
{@render propTable('api-size', sizeRows)}

<h2 id="api-breakpoints"><T k="gr.h.screens" /></h2>
{@render propTable('api-breakpoints', breakpointsRows)}

<h2 id="breakpoints-const"><T k="gr.h.const" /></h2>
<TableWrap labelledby="breakpoints-const">
  <table class="api" aria-labelledby="breakpoints-const">
    <thead>
      <tr><th scope="col">{t('th.prop')}</th><th scope="col">{t('th.default')}</th></tr>
    </thead>
    <tbody>
      {#each constantRows as row (row.name)}
        <tr><th scope="row">{row.name}</th><td class="df">{row.value}</td></tr>
      {/each}
    </tbody>
  </table>
</TableWrap>

<h2 id="a11y-b"><T k="b.h.a11y" /></h2>
<ul>
  <li><T k="gr.a1" /></li>
  <li><T k="gr.a2" /></li>
  <li><T k="gr.a3" /></li>
  <li><T k="gr.a4" /></li>
</ul>
