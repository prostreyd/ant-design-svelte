<script lang="ts">
  import { onMount } from 'svelte';
  import { Menu, MenuDivider, MenuItem, MenuItemGroup, MenuSubMenu, type MenuItems, type MenuMode, type MenuTheme } from '$lib';

  // The lab of the Menu (specs/menu.md). `window.__menuLab.set(patch)` changes the state of the page.
  let state = $state({
    mode: 'vertical' as MenuMode,
    theme: 'light' as MenuTheme,
    rtl: false,
    boxWidth: 700,
    boxLeft: 0,
    collapsed: false,
    multiple: false,
    selectable: true,
    selectedKeys: ['home'] as string[],
    openKeys: [] as string[],
    triggerSubMenuAction: 'hover' as 'hover' | 'click',
    subMenuOpenDelay: 0,
    subMenuCloseDelay: 0.1,
    forceSubMenuRender: false,
    markup: false,
    inlineIndent: 24,
    extraItems: 0,
    // A group with a title inside the submenu `products` (the groups of the geometry tests).
    groupInSub: false
  });
  let log = $state<string[]>([]);

  const entries = (extra: number, groupInSub: boolean): MenuItems => [
    { key: 'home', label: 'Home', icon: '★' },
    { key: 'docs', label: 'Documentation', icon: '☰', disabled: true },
    {
      key: 'products',
      label: 'Products',
      icon: '◆',
      children: [
        { key: 'p1', label: 'Product one' },
        { key: 'p2', label: 'Product two', danger: true },
        { type: 'divider' },
        { key: 'p3', label: 'Product three', extra: '⌘3' },
        { key: 'more', label: 'More', children: [{ key: 'm1', label: 'Deep one' }, { key: 'm2', label: 'Deep two' }] },
        ...(groupInSub
          ? [{ type: 'group' as const, label: 'Reports', children: [{ key: 'r1', label: 'Daily' }, { key: 'r2', label: 'Weekly' }] }]
          : [])
      ]
    },
    {
      type: 'group',
      label: 'Account',
      children: [
        { key: 'profile', label: 'Profile', icon: '☺' },
        { key: 'settings', label: 'Settings', icon: '⚙' }
      ]
    },
    { type: 'divider', dashed: true },
    { key: 'plain', label: 'No icon item' },
    ...Array.from({ length: extra }, (_, n) => ({ key: `x${n}`, label: `Extra ${n + 1}` }))
  ];

  const items = $derived(entries(state.extraItems, state.groupInSub));

  onMount(() => {
    (window as unknown as { __menuLab: unknown }).__menuLab = {
      set(patch: Partial<typeof state>) {
        Object.assign(state, patch);
      },
      get: () => $state.snapshot(state),
      log: () => [...log],
      clear: () => (log = [])
    };
  });

  const note = (text: string) => (log = [...log, text]);
</script>

<main dir={state.rtl ? 'rtl' : 'ltr'} style="padding: 24px; font-family: sans-serif">
  <div id="box" style="width: {state.boxWidth}px; margin-inline-start: {state.boxLeft}px">
    {#if state.markup}
      <Menu
        id="menu"
        aria-label="Lab menu"
        mode={state.mode}
        theme={state.theme}
        multiple={state.multiple}
        selectable={state.selectable}
        inlineCollapsed={state.collapsed}
        inlineIndent={state.inlineIndent}
        forceSubMenuRender={state.forceSubMenuRender}
        triggerSubMenuAction={state.triggerSubMenuAction}
        subMenuOpenDelay={state.subMenuOpenDelay}
        subMenuCloseDelay={state.subMenuCloseDelay}
        bind:selectedKeys={state.selectedKeys}
        bind:openKeys={state.openKeys}
        onclick={(info) => note(`click:${info.key}`)}
        onselect={(info) => note(`select:${info.key}`)}
        ondeselect={(info) => note(`deselect:${info.key}`)}
        onopenchange={(keys) => note(`open:${keys.join('>')}`)}
      >
        <MenuItem key="home" icon="★">Home</MenuItem>
        <MenuItem key="docs" icon="☰" disabled>Documentation</MenuItem>
        <MenuSubMenu key="products" label="Products" icon="◆">
          <MenuItem key="p1">Product one</MenuItem>
          <MenuItem key="p2" danger>Product two</MenuItem>
          <MenuDivider />
          <MenuItem key="p3" extra="⌘3">Product three</MenuItem>
        </MenuSubMenu>
        <MenuItemGroup label="Account">
          <MenuItem key="profile" icon="☺">Profile</MenuItem>
          <MenuItem key="settings" icon="⚙">Settings</MenuItem>
        </MenuItemGroup>
      </Menu>
    {:else}
      <Menu
        id="menu"
        aria-label="Lab menu"
        {items}
        mode={state.mode}
        theme={state.theme}
        multiple={state.multiple}
        selectable={state.selectable}
        inlineCollapsed={state.collapsed}
        inlineIndent={state.inlineIndent}
        forceSubMenuRender={state.forceSubMenuRender}
        triggerSubMenuAction={state.triggerSubMenuAction}
        subMenuOpenDelay={state.subMenuOpenDelay}
        subMenuCloseDelay={state.subMenuCloseDelay}
        bind:selectedKeys={state.selectedKeys}
        bind:openKeys={state.openKeys}
        onclick={(info) => note(`click:${info.key}`)}
        onselect={(info) => note(`select:${info.key}`)}
        ondeselect={(info) => note(`deselect:${info.key}`)}
        onopenchange={(keys) => note(`open:${keys.join('>')}`)}
      />
    {/if}
  </div>
  <button type="button" id="before">before</button>
  <button type="button" id="after">after</button>
  <p id="state">selected={state.selectedKeys.join(',')} open={state.openKeys.join('>')}</p>
</main>
