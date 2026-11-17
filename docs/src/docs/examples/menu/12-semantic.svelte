<script lang="ts">
  import { Menu, type MenuItems, type MenuPopupInfo } from 'svelte-ant-design';

  const items: MenuItems = [
    { key: 'a', label: 'Dashboard', icon: '▦' },
    { key: 'sub', label: 'Reports', icon: '▤', children: [{ key: 's1', label: 'Weekly' }, { key: 's2', label: 'Monthly' }] }
  ];
</script>

{#snippet wrap(info: MenuPopupInfo)}
  <div class="popup-shell">
    <div class="popup-title">{info.item?.key}: {info.keys.join(' › ')}</div>
    {@render info.children()}
  </div>
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">classNames and styles address root, item, itemIcon, itemContent, popup and subMenu.*</span>
    <div class="frame">
      <Menu
        aria-label="Styled menu"
        {items}
        selectedKeys={['a']}
        classNames={{ root: 'mine', item: 'mine-item', popup: 'mine-popup', subMenu: { itemTitle: 'mine-title' } }}
        styles={{ root: { 'border-radius': '12px' }, itemIcon: { color: 'var(--ads-color-primary-text)' }, subMenu: { itemContent: { 'font-style': 'italic' } } }}
      />
    </div>
  </div>

  <div class="field">
    <span class="caption">popupRender wraps the content of a popup: it gets the submenu, its keys and the content to put inside</span>
    <div class="frame">
      <Menu aria-label="Wrapped popups" {items} popupRender={wrap} />
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

  :global(.mine-popup) {
    outline: 1px dashed var(--ads-color-primary);
    border-radius: 8px;
  }

  .popup-shell {
    background: var(--ads-color-bg-container);
    border-radius: 8px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }

  .popup-title {
    padding: 8px 16px 0;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
