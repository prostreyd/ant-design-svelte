<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  let selectedKeys = $state(['11']);
  let openKeys = $state(['sub1']);

  const items: MenuItems = [
    {
      key: 'sub1',
      label: 'Navigation One',
      icon: '✉',
      children: [
        {
          type: 'group',
          label: 'Item 1',
          children: [
            { key: '11', label: 'Option 1' },
            { key: '12', label: 'Option 2' }
          ]
        },
        { key: '13', label: 'Option 3' }
      ]
    },
    {
      key: 'sub2',
      label: 'Navigation Two',
      icon: '▦',
      children: [
        { key: '21', label: 'Option 4' },
        { key: 'sub21', label: 'Submenu', children: [{ key: '211', label: 'Option 5' }, { key: '212', label: 'Option 6' }] }
      ]
    },
    { type: 'divider' },
    { key: 'link', label: 'Navigation Three', icon: '⚙' }
  ];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">mode="inline": submenus expand in place</span>
    <div class="frame">
      <Menu mode="inline" aria-label="Inline menu" {items} bind:selectedKeys bind:openKeys />
    </div>
    <span role="status">selectedKeys: {selectedKeys.join(', ')}; openKeys: {openKeys.join(', ') || '(none)'}</span>
  </div>

  <div class="field">
    <span class="caption">inlineIndent=&#123;12&#125;</span>
    <div class="frame">
      <Menu mode="inline" aria-label="Narrow indent" {items} inlineIndent={12} openKeys={['sub2', 'sub21']} />
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
</style>
