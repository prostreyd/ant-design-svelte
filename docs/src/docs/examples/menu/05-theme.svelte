<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: '1', label: 'Navigation One', icon: '✉' },
    { key: '2', label: 'Navigation Two', icon: '▦', danger: true },
    {
      key: 'sub',
      label: 'Navigation Three',
      icon: '⚙',
      theme: 'dark',
      children: [{ key: '3', label: 'Option 3' }, { key: '4', label: 'Option 4' }]
    },
    { key: '5', label: 'Disabled', icon: '✕', disabled: true }
  ];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">theme="light" (the default); the submenu has theme="dark" for its popup</span>
    <div class="frame">
      <Menu aria-label="Light menu" {items} selectedKeys={['1']} />
    </div>
  </div>

  <div class="field">
    <span class="caption">theme="dark"</span>
    <div class="frame">
      <Menu aria-label="Dark menu" theme="dark" mode="inline" {items} selectedKeys={['1']} openKeys={['sub']} />
    </div>
  </div>

  <div class="field">
    <span class="caption">theme="dark", horizontal</span>
    <div class="bar">
      <Menu aria-label="Dark top navigation" theme="dark" mode="horizontal" {items} selectedKeys={['1']} />
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

  .frame {
    width: 256px;
    max-width: 100%;
  }

  .bar {
    width: 100%;
  }
</style>
