<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { href, localHref } from '#docs/href';
  import { useT } from '#docs/i18n/use-t';
  import { plain, translate } from '#docs/i18n';
  import { componentPages, docsPages, localize, type PageDef } from '#docs/pages';
  import Icon from './Icon.svelte';

  const t = useT();
  let query = $state('');
  let input: HTMLInputElement | undefined = $state();

  interface Entry {
    page: PageDef;
    label: string;
  }

  const entries = $derived<Entry[]>(
    [...docsPages, ...componentPages].map((p) => ({ page: p, label: plain(translate(page.data.lang, p.title)) }))
  );
  const term = $derived(query.trim().toLowerCase());
  const results = $derived(
    term
      ? entries
          .filter((e) => e.label.toLowerCase().includes(term))
          .sort((a, b) => Number(b.label.toLowerCase().startsWith(term)) - Number(a.label.toLowerCase().startsWith(term)))
      : []
  );

  function go(entry: Entry) {
    query = '';
    void goto(href(localize(entry.page.path, page.data.lang)));
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && results[0]) go(results[0]);
    if (event.key === 'Escape') query = '';
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      document.querySelector<HTMLElement>('.sres a')?.focus();
    }
  }

  function onResultKeydown(event: KeyboardEvent) {
    const links = [...document.querySelectorAll<HTMLElement>('.sres a')];
    const i = links.indexOf(event.currentTarget as HTMLElement);
    if (event.key === 'ArrowDown') (links[i + 1] ?? links[i])?.focus();
    if (event.key === 'ArrowUp') (i > 0 ? links[i - 1] : input)?.focus();
    if (event.key === 'Escape') input?.focus();
    if (['ArrowDown', 'ArrowUp', 'Escape'].includes(event.key)) event.preventDefault();
  }

  function onWindowKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(target.tagName)) {
      event.preventDefault();
      input?.focus();
    }
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="search" role="search">
  <label class="search-box">
    <Icon name="search" />
    <span class="sr-only">{t('search.label')}</span>
    <input
      bind:this={input}
      bind:value={query}
      type="search"
      placeholder={t('search.ph')}
      autocomplete="off"
      onkeydown={onInputKeydown}
    />
    <kbd aria-hidden="true">/</kbd>
  </label>
  {#if term}
    <div class="sres" role="region" aria-label={t('search.label')}>
      {#if results.length}
        <ul>
          {#each results as entry (entry.page.path)}
            <li>
              <a
                href={localHref(entry.page.path)}
                onkeydown={onResultKeydown}
                onclick={(event) => {
                  event.preventDefault();
                  go(entry);
                }}
              >
                <span>{entry.label}</span>
                <small>{t(entry.page.section === 'docs' ? 'nav.docs' : 'nav.components')}</small>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none" role="status">{t('search.none')}</p>
      {/if}
    </div>
  {/if}
</div>
