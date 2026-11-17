<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'sub1', label: 'Navigation One', icon: '✉', children: [{ key: '1', label: 'Option 1' }, { key: '2', label: 'Option 2' }] },
    { key: 'sub2', label: 'Navigation Two', icon: '▦', children: [{ key: '5', label: 'Option 5' }, { key: '6', label: 'Option 6' }] },
    { key: 'sub4', label: 'Navigation Three', icon: '⚙', children: [{ key: '9', label: 'Option 9' }, { key: '10', label: 'Option 10' }] }
  ];
  const rootKeys = ['sub1', 'sub2', 'sub4'];

  let openKeys = $state(['sub1']);
  let log = $state('');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">Open only the current submenu: onopenchange keeps the last one that was opened</span>
    <div class="frame">
      <Menu
        mode="inline"
        aria-label="Accordion"
        {items}
        {openKeys}
        onopenchange={(keys) => {
          const latest = keys.find((key) => !openKeys.includes(key));
          openKeys = latest && rootKeys.includes(latest) ? [latest] : keys;
          log = `onopenchange: ${JSON.stringify(keys)}`;
        }}
      />
    </div>
    <span role="status">openKeys: {openKeys.join(', ') || '(none)'}; {log || 'no change yet'}</span>
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
