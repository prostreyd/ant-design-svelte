<script lang="ts">
  import { Button, Menu, type MenuItems } from 'svelte-ant-design';

  let collapsed = $state(false);
  let selectedKeys = $state(['1']);

  const items: MenuItems = [
    { key: '1', label: 'Option 1', icon: '◉' },
    { key: '2', label: 'Option 2', icon: '▭', title: 'The second option' },
    { key: '3', label: 'Option 3', icon: '▤' },
    {
      key: 'sub1',
      label: 'Navigation One',
      icon: '✉',
      children: [
        { key: '5', label: 'Option 5' },
        { key: '6', label: 'Option 6' }
      ]
    },
    { key: '9', label: 'No icon' }
  ];
</script>

<div class="stack">
  <Button onclick={() => (collapsed = !collapsed)} aria-pressed={collapsed}>{collapsed ? 'Expand' : 'Collapse'}</Button>

  <div class="field">
    <span class="caption">inlineCollapsed: icons only, a tip with the label (or title) on hover and focus, submenus in popups</span>
    <div class="frame">
      <Menu mode="inline" aria-label="Collapsible menu" {items} inlineCollapsed={collapsed} bind:selectedKeys />
    </div>
  </div>

  <div class="field">
    <span class="caption">tooltip=&#123;false&#125; turns the tips off; tooltip=&#123;&#123; placement: 'bottom' &#125;&#125; sets them</span>
    <div class="frame small">
      <Menu mode="inline" aria-label="No tips" {items} inlineCollapsed tooltip={false} />
    </div>
    <div class="frame small">
      <Menu mode="inline" aria-label="Tips below" {items} inlineCollapsed tooltip={{ placement: 'bottom', mouseEnterDelay: 0.3 }} />
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
    transition: width 0.2s;
  }

  .frame.small {
    width: 80px;
  }
</style>
