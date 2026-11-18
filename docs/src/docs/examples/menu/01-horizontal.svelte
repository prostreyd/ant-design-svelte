<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  let selectedKeys = $state(['mail']);

  const items: MenuItems = [
    { key: 'mail', label: 'Navigation One', icon: '✉' },
    { key: 'app', label: 'Navigation Two', icon: '▦', disabled: true },
    {
      key: 'setting',
      label: 'Navigation Three - Submenu',
      icon: '⚙',
      children: [
        {
          type: 'group',
          label: 'Item 1',
          children: [
            { key: 'setting:1', label: 'Option 1' },
            { key: 'setting:2', label: 'Option 2' }
          ]
        },
        {
          type: 'group',
          label: 'Item 2',
          children: [
            { key: 'setting:3', label: 'Option 3' },
            { key: 'setting:4', label: 'Option 4' }
          ]
        }
      ]
    },
    { key: 'docs', label: 'Navigation Four' },
    { key: 'blog', label: 'Navigation Five' },
    { key: 'about', label: 'Navigation Six' }
  ];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">mode="horizontal", with a submenu and a disabled item</span>
    <div class="bar">
      <Menu mode="horizontal" aria-label="Top navigation" {items} bind:selectedKeys />
    </div>
    <span role="status">selectedKeys: {selectedKeys.join(', ')}</span>
  </div>

  <div class="field">
    <span class="caption">A narrow container: what does not fit waits in the "…" item (overflowLabel)</span>
    <div class="narrow">
      <Menu mode="horizontal" aria-label="Narrow navigation" overflowLabel="More sections" {items} selectedKeys={['docs']} />
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

  .bar {
    width: 100%;
  }

  .narrow {
    width: 360px;
    max-width: 100%;
  }
</style>
