<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'a', label: 'First', children: [{ key: 'a1', label: 'First one' }, { key: 'a2', label: 'First two' }] },
    { key: 'b', label: 'Second', children: [{ key: 'b1', label: 'Second one' }] }
  ];

  let lazy = $state<HTMLElement>();
  let forced = $state<HTMLElement>();
  let counts = $state({ lazy: 0, forced: 0 });

  // Counts the items that are in the page, in the popups too (a popup is moved to the end of the page when it is shown).
  $effect(() => {
    const count = (host: HTMLElement | undefined) => host?.querySelectorAll('[role^="menuitem"]').length ?? 0;
    counts = { lazy: count(lazy), forced: count(forced) };
  });
</script>

<div class="stack">
  <div class="field">
    <span class="caption">By default a popup is built when it is first shown</span>
    <div class="frame" bind:this={lazy}>
      <Menu aria-label="Lazy popups" {items} />
    </div>
    <span role="status">Items in the page, before any popup was opened: {counts.lazy}</span>
  </div>

  <div class="field">
    <span class="caption">forceSubMenuRender builds them at once, hidden (useful for a test, or to measure)</span>
    <div class="frame" bind:this={forced}>
      <Menu aria-label="Forced popups" {items} forceSubMenuRender />
    </div>
    <span role="status">Items in the page, before any popup was opened: {counts.forced}</span>
  </div>
</div>

<style>
  .stack {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: 16px;
    width: 100%;
  }

  .field {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
    gap: 6px;
    width: 100%;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  /* A submenu opens beside the menu, so on a phone the menu stays narrower than the screen less the room of its popup. */
  .frame {
    width: clamp(140px, calc(100vw - 220px), 256px);
    max-width: 100%;
  }
</style>
