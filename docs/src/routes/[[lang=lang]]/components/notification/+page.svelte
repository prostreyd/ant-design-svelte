<script lang="ts">
  import { page } from '$app/state';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Demo from '#docs/components/Demo.svelte';
  import Html from '#docs/components/Html.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import TableWrap from '#docs/components/TableWrap.svelte';
  import { demos, methodRows, optionRows, settingRows, tokenRows } from '#docs/data/notification';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { notificationExamples } from '#docs/notification-examples';
  import { REPO } from '#docs/site';

  const t = useT();
  const lang = $derived(page.data.lang);
  const note = $derived(t('n.notification'));
  const tables = $derived([
    { id: 'api-options', heading: t('nt.h.options'), rows: optionRows },
    { id: 'api-methods', heading: t('nt.h.methods'), rows: methodRows },
    { id: 'api-settings', heading: t('nt.h.settings'), rows: settingRows }
  ]);
</script>

<Seo path="/components/notification/" />
<Crumbs
  items={[
    { label: t('nav.components'), href: localHref('/components/') },
    { label: t('g.feedback'), href: `${localHref('/components/')}#g-feedback` },
    { label: 'Notification' }
  ]}
/>
<div class="title-row">
  <h1>Notification{#if note}<small>{note}</small>{/if}</h1>
</div>
<p class="lede"><T k="nt.lead" /></p>
<dl class="meta">
  <dt>{t('b.import')}</dt>
  <dd><code>{"import { notification, NotificationHost } from 'svelte-ant-design';"}</code></dd>
  <dt>{t('b.source')}</dt>
  <dd>
    <a href="{REPO}/tree/main/src/lib/Notification">src/lib/Notification</a>
    <a href="{REPO}/issues">{t('b.issue')}</a>
    <a href="{REPO}/blob/main/src/lib/Notification/README.md">{t('b.edit')}</a>
  </dd>
</dl>

<h2 id="when"><T k="b.h.when" /></h2>
<ul>
  <li><T k="nt.w1" /></li>
  <li><T k="nt.w2" /></li>
  <li><T k="nt.w3" /></li>
</ul>

<h2 id="examples"><T k="b.h.ex" /></h2>
<div class="demos">
  {#each demos as demo (demo.slug)}
    {@const example = notificationExamples.find((item) => item.slug === demo.slug)}
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
<div class="callout"><T k="nt.diff" /></div>

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
  <li><T k="nt.a1" /></li>
  <li><T k="nt.a2" /></li>
  <li><T k="nt.a3" /></li>
  <li><T k="nt.a4" /></li>
  <li><T k="nt.a5" /></li>
  <li><T k="nt.a6" /></li>
  <li><T k="nt.a7" /></li>
  <li><T k="nt.a8" /></li>
</ul>
