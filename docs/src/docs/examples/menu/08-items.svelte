<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'open', label: 'Open', icon: '▤', extra: '⌘O' },
    { key: 'save', label: 'Save', icon: '▥', extra: '⌘S', title: 'Save the document' },
    { key: 'busy', label: 'Disabled', icon: '✕', disabled: true },
    { type: 'divider' },
    {
      type: 'group',
      label: 'Danger zone',
      children: [
        { key: 'archive', label: 'Archive' },
        { key: 'delete', label: 'Delete', danger: true }
      ]
    },
    { type: 'divider', dashed: true },
    { key: 'last', label: 'The last item' }
  ];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">extra, icon, title, disabled, danger, a group, a divider and a dashed one</span>
    <div class="frame">
      <Menu aria-label="Kinds of items" mode="inline" {items} selectedKeys={['save']} />
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
