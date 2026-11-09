<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { useT } from '#docs/i18n/use-t';

  const t = useT();
  let items = $state<{ id: string; text: string }[]>([]);
  let active = $state('');
  let observer: IntersectionObserver | undefined;

  /** The table of contents is built from the headings that are on the page. */
  function rebuild() {
    observer?.disconnect();
    const headings = [...document.querySelectorAll<HTMLElement>('.art h2[id]')];
    items = headings.map((h) => ({ id: h.id, text: h.textContent ?? '' }));
    active = items[0]?.id ?? '';
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) active = entry.target.id;
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );
    headings.forEach((h) => observer?.observe(h));
  }

  onMount(() => {
    rebuild();
    return () => observer?.disconnect();
  });
  afterNavigate(rebuild);
</script>

<nav class="toc" aria-label={t('toc.title')} hidden={!items.length}>
  <b>{t('toc.title')}</b>
  {#each items as item (item.id)}
    <a href="#{item.id}" class:active={active === item.id}>{item.text}</a>
  {/each}
</nav>
