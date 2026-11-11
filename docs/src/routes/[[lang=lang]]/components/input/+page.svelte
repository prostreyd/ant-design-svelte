<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import {
    apiRows,
    demos,
    methodRows,
    otpApiRows,
    passwordApiRows,
    searchApiRows,
    textAreaApiRows,
    tokenRows
  } from '#docs/data/input';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { inputExamples } from '#docs/input-examples';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.input'));

  /** The API tables in the order of the page; the first has no heading of its own (it is "API"). */
  const tables = [
    { id: 'api-textarea', title: 'in.h.textarea', rows: textAreaApiRows, lead: undefined },
    { id: 'api-password', title: 'in.h.password', rows: passwordApiRows, lead: 'in.inherit.pw' },
    { id: 'api-search', title: 'in.h.search', rows: searchApiRows, lead: 'in.inherit.search' },
    { id: 'api-otp', title: 'in.h.otp', rows: otpApiRows, lead: undefined }
  ] as const;
</script>

<Seo path="/components/input/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.entry'), href: `${localHref('/components/')}#g-entry` },
    { label: 'Input' }
  ]}
/>
<div class="title-row">
  <h1>Input{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="in.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd>
    <code>{"import { Input, InputTextArea, InputPassword, InputSearch, InputOTP } from 'svelte-ant-design';"}</code>
  </dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Input">src/lib/Input</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Input/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="in.w1" /></li>
  <li><T k="in.w2" /></li>
  <li><T k="in.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = inputExamples.find((item) => item.slug === demo.slug)}
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
<div class="callout"><T k="in.diff" /></div>

{#each tables as table (table.id)}
  <h2 id={table.id}><T k={table.title} /></h2>
  {#if table.lead}<p><T k={table.lead} /></p>{/if}
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
            <th scope="row">{row.name}</th>
            <td><Html html={row.description[lang]} /></td>
            <td><span class="ty">{row.type}</span></td>
            <td class="df">{row.default}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </TableWrap>
{/each}

<h2 id="methods"><T k="in.h.methods" /></h2>
<p><T k="in.methods.note" /></p>
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
  <li><T k="in.a1" /></li>
  <li><T k="in.a2" /></li>
  <li><T k="in.a3" /></li>
  <li><T k="in.a4" /></li>
  <li><T k="in.a5" /></li>
  <li><T k="in.a6" /></li>
</ul>
