<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'file', label: 'File', children: [{ key: 'new', label: 'New' }, { key: 'open', label: 'Open' }, { key: 'save', label: 'Save' }] },
    { key: 'edit', label: 'Edit', children: [{ key: 'cut', label: 'Cut' }, { key: 'copy', label: 'Copy' }] },
    { key: 'view', label: 'View' },
    { key: 'help', label: 'Help', disabled: true }
  ];

  let bar = $state(['view']);
  let column = $state(['view']);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">Tab enters the menu once, on the selected item. Left and Right move, Down opens a submenu, Escape closes it</span>
    <div class="wide">
      <Menu mode="horizontal" aria-label="Application menu" {items} bind:selectedKeys={bar} />
    </div>
    <span role="status">selectedKeys: {bar.join(', ')}</span>
  </div>

  <div class="field">
    <span class="caption">Up, Down, Home, End move; Right opens a submenu; typing a letter finds an item; Enter or Space chooses</span>
    <div class="frame">
      <Menu aria-label="Application menu, vertical" {items} bind:selectedKeys={column} />
    </div>
    <span role="status">selectedKeys: {column.join(', ')}</span>
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

  .wide {
    width: 100%;
  }
</style>
