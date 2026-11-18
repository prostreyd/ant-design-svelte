<script lang="ts">
  import { Button, Menu, type MenuItems, type MenuMode, type MenuTheme } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: '1', label: 'Navigation One', icon: '✉' },
    { key: 'sub', label: 'Navigation Two', icon: '▦', children: [{ key: '2', label: 'Option 2' }, { key: '3', label: 'Option 3' }] },
    { key: '4', label: 'Navigation Three', icon: '⚙' }
  ];

  let mode = $state<MenuMode>('inline');
  let theme = $state<MenuTheme>('light');
</script>

<div class="stack">
  <div class="row">
    <Button onclick={() => (mode = mode === 'inline' ? 'vertical' : mode === 'vertical' ? 'horizontal' : 'inline')}>
      Change the mode
    </Button>
    <Button onclick={() => (theme = theme === 'light' ? 'dark' : 'light')}>Change the theme</Button>
    <span role="status">mode: {mode}, theme: {theme}</span>
  </div>

  <div class="field">
    <span class="caption">The same items in every mode; the state of the menu is kept while the type changes</span>
    <div class="frame" class:wide={mode === 'horizontal'}>
      <Menu aria-label="Switchable menu" {mode} {theme} {items} selectedKeys={['1']} />
    </div>
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

  .frame.wide {
    width: 100%;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
</style>
