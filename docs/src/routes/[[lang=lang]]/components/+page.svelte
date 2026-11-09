<script lang="ts">
  import { Button } from 'svelte-ant-design';
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentGroups } from '#docs/pages';

  const t = useT();
</script>

<Seo title={t('c.overview')} description={t('ov.lead')} path="/components/" />
<Crumbs items={[{ label: t('nav.components'), href: localHref('/components/') }, { label: t('c.overview') }]} />
<h1><T k="c.overview" /></h1>
<p class="lede"><T k="ov.lead" /></p>

{#each componentGroups as group (group.title)}
  <h2 id={group.title.replace('.', '-')}><T k={group.title} /></h2>
  <div class="ov">
    {#each group.items as item (item.name)}
      {#if item.path}
        <a class="card" href={localHref(item.path)}>
          <h3>{item.name}<small>{t(item.note)}</small></h3>
          <p class="tag ok">{t('tag.ready')}</p>
          <div class="prev" aria-hidden="true" inert>
            <Button type="primary" tabindex={-1}>Primary</Button>
            <Button tabindex={-1}>Default</Button>
          </div>
        </a>
      {:else}
        <div class="card soon">
          <h3>{item.name}<small>{t(item.note)}</small></h3>
          <p class="tag plan">{t('tag.plan')}</p>
        </div>
      {/if}
    {/each}
  </div>
{/each}
