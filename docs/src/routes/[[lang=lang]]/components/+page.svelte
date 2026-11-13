<script lang="ts">
  import Crumbs from '#docs/components/Crumbs.svelte';
  import Seo from '#docs/components/Seo.svelte';
  import T from '#docs/components/T.svelte';
  import Wireframe from '#docs/components/Wireframe.svelte';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentGroups } from '#docs/pages';

  const t = useT();
</script>

<Seo path="/components/" />
<Crumbs items={[{ label: t('nav.components'), href: localHref('/components/') }, { label: t('c.overview') }]} />
<h1><T k="c.overview" /></h1>
<p class="lede"><T k="ov.lead" /></p>

{#each componentGroups as group (group.title)}
  <h2 id={group.title.replace('.', '-')}><T k={group.title} /></h2>
  <div class="ov">
    {#each group.items as item (item.name)}
      {#if item.path}
        <!-- The whole card is the link. Only the name and a silhouette are drawn; the state is told to a screen reader. -->
        <a class="card" href={localHref(item.path)} data-component={item.name}>
          <span class="pic" aria-hidden="true"><Wireframe name={item.name} tone="ready" /></span>
          <span class="foot"><span class="nm">{item.name}</span><span class="go" aria-hidden="true">→</span></span>
          <span class="sr">{t('tag.ready')}</span>
        </a>
      {:else}
        <div class="card soon" data-component={item.name}>
          <span class="pic" aria-hidden="true"><Wireframe name={item.name} tone="planned" /></span>
          <span class="foot"><span class="nm">{item.name}</span></span>
          <span class="sr">{t('tag.plan')}</span>
        </div>
      {/if}
    {/each}
  </div>
{/each}
