<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { apiRows, demos, itemTables, tokenRows } from '#docs/data/menu';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { menuExamples } from '#docs/menu-examples';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.menu'));
</script>

<Seo path="/components/menu/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.nav'), href: `${localHref('/components/')}#g-nav` },
    { label: 'Menu' }
  ]}
/>
<div class="title-row">
  <h1>Menu{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="mn.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Menu, MenuItem, MenuSubMenu, MenuItemGroup, MenuDivider } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Menu">src/lib/Menu</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Menu/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="mn.w1" /></li>
  <li><T k="mn.w2" /></li>
  <li><T k="mn.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = menuExamples.find((item) => item.slug === demo.slug)}
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
<div class="callout"><T k="mn.diff" /></div>

{#each itemTables as table (table.id)}
  <h3 id="api-{table.id}">{table.title[lang]}</h3>
  <TableWrap labelledby="api-{table.id}">
    <table class="api" aria-labelledby="api-{table.id}">
      <thead>
        <tr>
          <th scope="col">{t('th.prop')}</th><th scope="col">{t('th.desc')}</th>
          <th scope="col">{t('th.type')}</th>
        </tr>
      </thead>
      <tbody>
        {#each table.rows as row (row.name)}
          <tr>
            <th scope="row">{row.name}</th>
            <td><Html html={row.description[lang]} /></td>
            <td><span class="ty">{row.type}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </TableWrap>
{/each}

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
  <li><T k="mn.a1" /></li>
  <li><T k="mn.a2" /></li>
  <li><T k="mn.a3" /></li>
  <li><T k="mn.a4" /></li>
  <li><T k="mn.a5" /></li>
  <li><T k="mn.a6" /></li>
  <li><T k="mn.a7" /></li>
  <li><T k="mn.a8" /></li>
</ul>
