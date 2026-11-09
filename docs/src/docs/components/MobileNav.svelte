<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { VERSION } from 'svelte-ant-design';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentGroups, componentPages, docsPages, logicalPath, sectionOf } from '#docs/pages';
  import { CHANGELOG } from '#docs/site';
  import Icon from './Icon.svelte';

  const t = useT();
  let open = $state(false);
  const current = $derived(logicalPath(page.route.id));
  const section = $derived(sectionOf(current));

  afterNavigate(() => (open = false));
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && (open = false)} />

<button
  class="icon-btn menu-btn"
  type="button"
  aria-expanded={open}
  aria-controls="mobile-nav"
  aria-label={t('hdr.menu')}
  onclick={() => (open = !open)}
>
  <Icon name={open ? 'close' : 'menu'} />
</button>

<nav class="mnav" id="mobile-nav" aria-label={t('hdr.nav')} hidden={!open}>
  <div class="primary-links">
    <a href={localHref('/docs/')} class:active={section === 'docs'}>{t('nav.docs')}</a>
    <a href={localHref('/components/')} class:active={section === 'components'}>{t('nav.components')}</a>
    <a href={CHANGELOG}>{t('nav.changelog')}<span class="ver">{VERSION}</span></a>
  </div>
  {#if section === 'docs'}
    <div class="side-title">{t('nav.docs')}</div>
    {#each docsPages as p (p.path)}
      <a href={localHref(p.path)} class:active={p.path === current}>{t(p.title)}</a>
    {/each}
  {:else if section === 'components'}
    <div class="side-title">{t('nav.components')}</div>
    <a href={localHref(componentPages[0].path)} class:active={current === componentPages[0].path}>{t('c.overview')}</a>
    {#each componentGroups as group (group.title)}
      <div class="grp">{t(group.title)}</div>
      {#each group.items as item (item.name)}
        {#if item.path}
          <a href={localHref(item.path)} class:active={item.path === current}>{item.name} <span class="nm">{t(item.note)}</span></a>
        {:else}
          <span class="item soon">{item.name} <span class="nm">{t(item.note)}</span><span class="pillsoon">{t('soon')}</span></span>
        {/if}
      {/each}
    {/each}
  {/if}
</nav>
