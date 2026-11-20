<script lang="ts">
  /*
   * The gallery of the ready icons, in the six groups of the list of Ant Design and in the order of that list (data/icon-groups.ts),
   * for one theme at a time or for all of them (a name is then followed by its themes, as on that list). A search box narrows it by name. Clicking one copies the name of its component. The drawings come
   * from `svelte-ant-design/icons`. The server draws the first chunk and the page draws the rest as soon as it has loaded, so
   * the HTML of the page stays small while the whole list is there a moment later.
   */
  import { onMount, type Component } from 'svelte';
  import { page } from '$app/state';
  import { Input, Radio, RadioGroup } from 'svelte-ant-design';
  import * as icons from 'svelte-ant-design/icons';
  import { createCopier } from '#docs/copy.svelte';
  import T from '#docs/components/T.svelte';
  import { iconGroups } from '#docs/data/icon-groups';
  import { useT } from '#docs/i18n/use-t';

  const t = useT();
  const copier = createCopier();
  const lang = $derived(page.data.lang);

  const THEMES = ['Outlined', 'Filled', 'TwoTone'] as const;
  type Theme = 'all' | (typeof THEMES)[number];
  const FIRST_CHUNK = 96;
  const library = icons as unknown as Record<string, Component>;

  let query = $state('');
  let theme = $state<Theme>('all');
  let limit = $state(FIRST_CHUNK);
  let copiedName = $state('');

  onMount(() => {
    limit = Infinity;
  });

  // Every group with the icons of the chosen theme (of every theme for `all`) that match the search, in the order of the list.
  const found = $derived.by(() => {
    const needle = query.trim().toLowerCase().replace(/[-_\s]/g, '');
    return iconGroups
      .map((group) => ({
        group,
        items: group.names
          .flatMap((name) => (theme === 'all' ? THEMES : [theme]).map((one) => name + one))
          .filter((name) => name in library && name.toLowerCase().includes(needle))
          .map((name) => ({ name, component: library[name] }))
      }))
      .filter((entry) => entry.items.length > 0);
  });
  const total = $derived(found.reduce((sum, entry) => sum + entry.items.length, 0));

  // The part of the list that is drawn now: the first chunk on the server, all of it after the page has loaded.
  const drawn = $derived.by(() => {
    let room = limit;
    return found
      .map((entry) => {
        const take = Math.min(entry.items.length, room);
        room -= take;
        return { ...entry, shown: entry.items.slice(0, take) };
      })
      .filter((entry) => entry.shown.length > 0);
  });

  async function copy(name: string) {
    copiedName = name;
    await copier.copy(name);
  }
</script>

<div class="gallery">
  <div class="tools">
    <Input bind:value={query} placeholder={t('icn.search')} allowClear aria-label={t('icn.search')} />
    <RadioGroup bind:value={theme} aria-label={t('icn.theme')}>
      <Radio value="all">{t('icn.all')}</Radio>
      {#each THEMES as option (option)}
        <Radio value={option}>{option}</Radio>
      {/each}
    </RadioGroup>
  </div>

  <p class="count" role="status">{t('icn.count').replace('{n}', String(total))}</p>

  {#each drawn as entry (entry.group.id)}
    <section class="group" aria-labelledby="icons-{entry.group.id}" data-group={entry.group.id}>
      <h3 id="icons-{entry.group.id}">{entry.group.title[lang]}<span class="n">{entry.items.length}</span></h3>
      <ul class="grid" data-testid="icon-grid-{entry.group.id}">
        {#each entry.shown as icon (icon.name)}
          {@const Drawing = icon.component}
          <li>
            <button type="button" class="cell" title={icon.name} onclick={() => copy(icon.name)}>
              <span class="drawing"><Drawing label="" /></span>
              <span class="name">{icon.name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}

  {#if total === 0}
    <p class="none"><T k="icn.none" /></p>
  {/if}

  <span class="sr-only" role="status">{copier.copied ? `${t('copy.done')}: ${copiedName}` : copier.failed ? t('copy.failed') : ''}</span>
</div>

<style>
  .gallery {
    display: grid;
    gap: 12px;
  }

  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px 20px;
  }

  .tools :global(.ads-input) {
    min-width: 220px;
  }

  .count {
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 13px;
  }

  .group {
    display: grid;
    gap: 8px;
  }

  .group h3 {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 12px 0 0;
    font-size: 16px;
  }

  .n {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    font-weight: 400;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .cell {
    display: grid;
    justify-items: center;
    gap: 8px;
    width: 100%;
    padding: 14px 6px 10px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 8px;
    background: var(--ads-color-bg-container);
    color: var(--ads-color-text);
    font: inherit;
    cursor: pointer;
  }

  .cell:hover {
    border-color: var(--ads-color-primary);
    color: var(--ads-color-primary);
  }

  .cell:focus-visible {
    outline: 2px solid var(--ads-color-primary);
    outline-offset: 2px;
  }

  .drawing {
    font-size: 28px;
    line-height: 1;
  }

  .name {
    max-width: 100%;
    overflow: hidden;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .none {
    margin: 0;
  }
</style>
