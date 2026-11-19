<script lang="ts">
  import { page } from '$app/state';
  import CodeBlock from '#docs/components/CodeBlock.svelte';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import type { ApiRow } from '#docs/data/button';
  import { apiRows, demos, fieldRows, helperRows, itemApiRows, methodRows, modelSnippet, ruleRows, tokenRows, typedSnippet } from '#docs/data/form';
  import { formExamples } from '#docs/form-examples';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.form'));
  const titleOf = (slug: string) => demos.find((demo) => demo.slug === slug)?.title[lang] ?? slug;
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

{#snippet nameTable(id: string, rows: { name: string; description: Record<'en' | 'ru' | 'zh', string>; type: string }[], first: string)}
  <TableWrap labelledby={id}>
    <table class="api" aria-labelledby={id}>
      <thead>
        <tr><th scope="col">{first}</th><th scope="col">{t('th.desc')}</th><th scope="col">{t('th.type')}</th></tr>
      </thead>
      <tbody>
        {#each rows as row (row.name)}
          <tr>
            <th scope="row">{row.name}</th>
            <td><Html html={row.description[lang]} /></td>
            <td><span class="ty">{row.type}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </TableWrap>
{/snippet}

<Seo path="/components/form/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.entry'), href: `${localHref('/components/')}#g-entry` },
    { label: 'Form' }
  ]}
/>
<div class="title-row">
  <h1>Form{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="fm.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { Form, FormItem, createForm } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Form">src/lib/Form</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Form/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="fm.w1" /></li>
  <li><T k="fm.w2" /></li>
  <li><T k="fm.w3" /></li>
</ul>

<h2 id="values"><T k="fm.h.values" /></h2>
<p><T k="fm.v.type" /></p>
<CodeBlock code={typedSnippet.code} kind={typedSnippet.kind} />
<p><T k="fm.v.see" /> <a href="#demo-typed">{titleOf('typed')}</a></p>
<p><T k="fm.v.model" /></p>
<CodeBlock code={modelSnippet.code} kind={modelSnippet.kind} />
<p><T k="fm.v.see" /> <a href="#demo-model">{titleOf('model')}</a></p>
<div class="callout"><T k="fm.v.note" /></div>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = formExamples.find((item) => item.slug === demo.slug)}
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

<h2 id="api">Form API</h2>
{@render propTable('api', apiRows)}
<div class="callout"><T k="fm.diff" /></div>

<h2 id="api-item"><T k="fm.h.item" /></h2>
{@render propTable('api-item', itemApiRows)}

<h2 id="api-field"><T k="fm.h.field" /></h2>
{@render nameTable('api-field', fieldRows, t('th.prop'))}

<h2 id="api-methods"><T k="fm.h.methods" /></h2>
{@render nameTable('api-methods', methodRows, t('th.method'))}

<h2 id="api-rules"><T k="fm.h.rules" /></h2>
{@render nameTable('api-rules', ruleRows, t('th.prop'))}

<h2 id="api-helpers"><T k="fm.h.helpers" /></h2>
{@render nameTable('api-helpers', helperRows, t('th.method'))}

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
  <li><T k="fm.a1" /></li>
  <li><T k="fm.a2" /></li>
  <li><T k="fm.a3" /></li>
  <li><T k="fm.a4" /></li>
  <li><T k="fm.a5" /></li>
  <li><T k="fm.a6" /></li>
  <li><T k="fm.a7" /></li>
</ul>
