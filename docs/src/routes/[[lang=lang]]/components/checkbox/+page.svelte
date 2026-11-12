<script lang="ts">
  import { page } from '$app/state';
  import { checkboxExamples } from '#docs/checkbox-examples';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { apiRows, demos, groupApiRows, methodRows, tokenRows } from '#docs/data/checkbox';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.checkbox'));
</script>

<Seo path="/components/checkbox/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.entry'), href: `${localHref('/components/')}#g-entry` },
    { label: 'Checkbox' }
  ]}
/>
<div class="title-row">
  <h1>Checkbox{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="cb.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Checkbox, CheckboxGroup } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Checkbox">src/lib/Checkbox</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Checkbox/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="cb.w1" /></li>
  <li><T k="cb.w2" /></li>
  <li><T k="cb.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = checkboxExamples.find((item) => item.slug === demo.slug)}
    {#if example}
      <Demo
        id={demo.slug}
        title={demo.title[lang]}
        description={demo.description[lang]}
        code={example.code}
        example={example.component}
        column={demo.column}
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
<div class="callout"><T k="cb.diff" /></div>

<h2 id="api-group"><T k="cb.h.group" /></h2>
<TableWrap labelledby="api-group">
  <table class="api" aria-labelledby="api-group">
    <thead>
      <tr>
        <th scope="col">{t('th.prop')}</th><th scope="col">{t('th.desc')}</th>
        <th scope="col">{t('th.type')}</th><th scope="col">{t('th.default')}</th>
      </tr>
    </thead>
    <tbody>
      {#each groupApiRows as row (row.name)}
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

<h2 id="methods"><T k="cb.h.methods" /></h2>
<TableWrap labelledby="methods">
  <table class="api" aria-labelledby="methods">
    <thead>
      <tr>
        <th scope="col">{t('th.method')}</th><th scope="col">{t('th.desc')}</th><th scope="col">{t('th.type')}</th>
      </tr>
    </thead>
    <tbody>
      {#each methodRows as row (row.name)}
        <tr>
          <th scope="row">{row.name}</th>
          <td><Html html={row.description[lang]} /></td>
          <td><span class="ty">{row.type}</span></td>
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
  <li><T k="cb.a1" /></li>
  <li><T k="cb.a2" /></li>
  <li><T k="cb.a3" /></li>
  <li><T k="cb.a4" /></li>
  <li><T k="cb.a5" /></li>
</ul>
