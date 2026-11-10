<script lang="ts">
  import { page } from '$app/state';
  import { VERSION } from 'svelte-ant-design';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentGroups, componentPages, docsPages, logicalPath } from '#docs/pages';
  import { CHANGELOG } from '#docs/site';

  /** The documentation and the component reference have separate menus. */
  let { section }: { section: 'docs' | 'components' } = $props();
  const t = useT();
  const current = $derived(logicalPath(page.route.id));
</script>

<nav class="side" aria-label={t(section === 'docs' ? 'side.docs.aria' : 'side.comp.aria')}>
  <div class="side-title">{t(section === 'docs' ? 'nav.docs' : 'nav.components')}</div>
  {#if section === 'docs'}
    {#each docsPages as p (p.path)}
      <a href={localHref(p.path)} class:active={p.path === current} aria-current={p.path === current ? 'page' : undefined}>
        <span>{t(p.title)}</span>
      </a>
    {/each}
    <a href={CHANGELOG}><span>{t('d.changelog')}</span><span class="ver">{VERSION}</span></a>
  {:else}
    <a
      href={localHref(componentPages[0].path)}
      class:active={current === componentPages[0].path}
      aria-current={current === componentPages[0].path ? 'page' : undefined}
    >
      <span>{t('c.overview')}</span>
    </a>
    <a href={CHANGELOG}><span>{t('d.changelog')}</span><span class="ver">{VERSION}</span></a>
    {#each componentGroups as group (group.title)}
      <div class="grp">{t(group.title)}</div>
      {#each group.items as item (item.name)}
        {#if item.path}
          <a href={localHref(item.path)} class:active={item.path === current} aria-current={item.path === current ? 'page' : undefined}>
            <span>{item.name} <span class="nm">{t(item.note)}</span></span>
          </a>
        {:else}
          <span class="item soon">
            <span>{item.name} <span class="nm">{t(item.note)}</span></span><span class="pillsoon">{t('soon')}</span>
          </span>
        {/if}
      {/each}
    {/each}
  {/if}
</nav>
