<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  let hoverLog = $state('');
  let clickLog = $state('');

  const items: MenuItems = [
    { key: 'one', label: 'Navigation One', icon: '✉' },
    {
      key: 'two',
      label: 'Navigation Two',
      icon: '▦',
      popupClassName: 'custom-popup',
      popupOffset: [4, 0],
      ontitleclick: ({ key }) => (clickLog = `title click: ${key}`),
      children: [
        { key: 'two:1', label: 'Option 5' },
        { key: 'two:2', label: 'Option 6' },
        { key: 'deep', label: 'Submenu', children: [{ key: 'deep:1', label: 'Option 7' }, { key: 'deep:2', label: 'Option 8' }] }
      ]
    },
    { key: 'three', label: 'Navigation Three', icon: '⚙', children: [{ key: 'three:1', label: 'Option 9' }] }
  ];
</script>

<div class="stack">
  <div class="field">
    <span class="caption">mode="vertical": submenus open in popups; popupOffset moves one of them by [4, 0]</span>
    <div class="frame">
      <Menu aria-label="Vertical menu" {items} onopenchange={(keys) => (hoverLog = `onopenchange: ${JSON.stringify(keys)}`)} />
    </div>
    <span role="status">{hoverLog || 'Point at a submenu'}</span>
  </div>

  <div class="field">
    <span class="caption">triggerSubMenuAction="click", subMenuOpenDelay=&#123;0.4&#125; and subMenuCloseDelay=&#123;0.5&#125; (seconds)</span>
    <div class="frame">
      <Menu
        aria-label="Click to open"
        {items}
        triggerSubMenuAction="click"
        subMenuOpenDelay={0.4}
        subMenuCloseDelay={0.5}
      />
    </div>
    <span role="status">{clickLog || 'Click a title'}</span>
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
