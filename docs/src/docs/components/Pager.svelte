<script lang="ts">
  import { page } from '$app/state';
  import { localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { componentPages, docsPages, logicalPath } from '#docs/pages';

  let { section }: { section: 'docs' | 'components' } = $props();
  const t = useT();
  const pages = $derived(section === 'docs' ? docsPages : componentPages);
  const index = $derived(pages.findIndex((p) => p.path === logicalPath(page.route.id)));
  const previous = $derived(index > 0 ? pages[index - 1] : undefined);
  const next = $derived(index >= 0 && index < pages.length - 1 ? pages[index + 1] : undefined);
</script>

{#if previous || next}
  <nav class="pager" aria-label={t('pager.next')}>
    {#if previous}
      <a href={localHref(previous.path)} rel="prev"><small>← {t('pager.prev')}</small>{t(previous.title)}</a>
    {:else}
      <span></span>
    {/if}
    {#if next}
      <a class="next" href={localHref(next.path)} rel="next"><small>{t('pager.next')} →</small>{t(next.title)}</a>
    {/if}
  </nav>
{/if}
