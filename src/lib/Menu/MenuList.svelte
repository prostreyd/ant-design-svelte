<script lang="ts">
  /*
   * One list of the menu: the root, the list of an expanded inline submenu, or the list in the popup of a submenu. It draws
   * its nodes, and a submenu draws its own list again (this component, recursively). The state and the keyboard are the
   * menu's (`MenuRuntime`); a list only reports what happened to it.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Popup from '../internal/popup/Popup.svelte';
  import { classList, styleText } from '../internal/semantic.js';
  import { getMenuRuntime, OVERFLOW_KEY } from './context.js';
  import MenuIcon from './MenuIcon.svelte';
  import MenuList from './MenuList.svelte';
  import MenuTip from './MenuTip.svelte';
  import { labelText, type MenuItemNode, type MenuNode, type MenuSubMenuNode } from './tree.js';
  import type { MenuContent, MenuTheme } from './types.js';

  type Props = Omit<HTMLAttributes<HTMLUListElement>, 'class' | 'style' | 'children'> & {
    nodes: readonly MenuNode[];
    /** `root`: the list of the menu. `sub`: an inline submenu. `popup`: the list in a popup. */
    kind: 'root' | 'sub' | 'popup';
    /** 1 for the root, one more for each inline submenu (the indent). */
    level: number;
    /** The submenu the list belongs to (`OVERFLOW_KEY` for the "…" popup); `null` for the root. */
    parentKey: string | null;
    /** The theme of the items of this list. */
    theme: MenuTheme;
    element?: HTMLElement | null;
    class?: string;
    style?: string;
  };

  let {
    nodes,
    kind,
    level,
    parentKey,
    theme,
    element = $bindable(null),
    class: customClass,
    style: customStyle,
    ...rest
  }: Props = $props();

  const rt = getMenuRuntime();

  /** The list the arrow keys move in: the root list covers the inline submenus too. */
  const scope = $derived(kind === 'popup' ? parentKey : null);
  const bar = $derived(kind === 'root' && rt.mode === 'horizontal');
  /** How many nodes of a horizontal bar are shown; the others wait in the "…" popup. */
  const limit = $derived(rt.visibleCount);
  const overflowNodes = $derived(limit === null ? [] : nodes.slice(limit));
  const inSubMenu = $derived(kind !== 'root');
  const listMode = $derived(kind === 'popup' ? 'vertical' : kind === 'sub' ? 'inline' : rt.mode);

  let itemElements = $state<Record<string, HTMLElement | null>>({});
  let titleElements = $state<Record<string, HTMLElement | null>>({});
  let moreElement = $state<HTMLElement | null>(null);

  // The element is bound before the effects run.
  $effect(() => rt.registerList(parentKey, element as HTMLElement));

  const role = $derived(nodes.length === 0 ? undefined : bar ? 'menubar' : 'menu');
  const padStart = $derived(listMode === 'inline' ? `${level * rt.indent}px` : undefined);

  const rootClass = $derived(
    classList(
      'ads-menu',
      `ads-menu-${listMode}`,
      `ads-menu-${theme}`,
      kind === 'root' && 'ads-menu-root',
      kind === 'root' && rt.collapsed && 'ads-menu-inline-collapsed',
      kind === 'sub' && 'ads-menu-sub',
      kind === 'popup' && 'ads-menu-popup-list',
      rt.rtl && 'ads-menu-rtl',
      customClass,
      kind === 'root' && rt.classNames?.root,
      inSubMenu && rt.classNames?.subMenu?.list
    )
  );
  const rootStyle = $derived(
    styleText(
      padStart && `--ads-menu-pad-start: ${padStart}`,
      customStyle,
      kind === 'root' && rt.styles?.root,
      inSubMenu && rt.styles?.subMenu?.list
    )
  );

  const tabindexOf = (key: string) => (kind !== 'popup' && rt.tabKey === key ? 0 : -1);

  function containsSelected(node: MenuNode): boolean {
    if (node.kind === 'item') return rt.isSelected(node.key);
    if (node.kind === 'submenu' || node.kind === 'group') return node.children.some(containsSelected);
    return false;
  }
  const overflowSelected = $derived(overflowNodes.some(containsSelected));

  const partClass = (part: 'item' | 'itemIcon' | 'itemContent') =>
    classList(rt.classNames?.[part], inSubMenu && rt.classNames?.subMenu?.[part]);
  const partStyle = (part: 'item' | 'itemIcon' | 'itemContent') =>
    styleText(rt.styles?.[part], inSubMenu && rt.styles?.subMenu?.[part]);

  /** The first character of a label that has no icon, shown in a collapsed menu (in place of the label). */
  const firstLetter = (label: MenuContent | undefined, icon: unknown) => {
    if (!rt.collapsed || kind !== 'root' || icon) return undefined;
    const text = labelText(label);
    return text ? [...text][0] : undefined;
  };
</script>

{#snippet content(value: MenuContent | undefined)}
  {#if typeof value === 'function'}{@render value()}{:else if value !== undefined && value !== null}{value}{/if}
{/snippet}

{#snippet icon(value: string | Snippet | undefined, letter: string | undefined)}
  {#if value}
    <span class={classList('ads-menu-item-icon', partClass('itemIcon'))} style={partStyle('itemIcon')} aria-hidden="true">
      {#if typeof value === 'function'}{@render value()}{:else}{value}{/if}
    </span>
  {:else if letter}
    <span class={classList('ads-menu-item-icon ads-menu-item-letter', partClass('itemIcon'))} style={partStyle('itemIcon')} aria-hidden="true">{letter}</span>
  {/if}
{/snippet}

{#snippet expandIcon(node: MenuSubMenuNode)}
  {#if !(kind === 'root' && (bar || rt.collapsed))}
    <span class="ads-menu-expand" aria-hidden="true">
      {#if rt.expandIcon}
        {@render rt.expandIcon({ isSubMenu: true, open: rt.isOpen(node.key), disabled: node.data.disabled === true, key: node.key })}
      {:else}
        <MenuIcon name="arrow" />
      {/if}
    </span>
  {/if}
{/snippet}

<!-- An entry of the bar that did not fit (`hidden`) stays in the row to be measured, and the "…" popup shows it again. So it must not
     open a popup or take an id: the page would have two of each. A group holds items and dividers only, never a submenu. -->
{#snippet entries(list: readonly MenuNode[], top: boolean)}
  {#each list as node, position (node.key)}
    {@const hidden = top && limit !== null && position >= limit}
    {#if node.kind === 'item'}
      {@render itemEntry(node, top ? position : -1, hidden)}
    {:else if node.kind === 'submenu'}
      {@render subMenuEntry(node, top ? position : -1, hidden)}
    {:else if node.kind === 'group'}
      <li
        role="none"
        class={classList('ads-menu-entry ads-menu-group', node.class, hidden && 'ads-menu-overflowed')}
        data-ads-top={top ? position : undefined}
        inert={hidden}
        data-ads-hidden={hidden ? '' : undefined}
      >
        <div class="ads-menu-group-title" id={hidden ? undefined : rt.idOf(node.key, 'group')}>{@render content(node.label)}</div>
        <ul role="group" class="ads-menu-group-list" aria-labelledby={hidden ? undefined : rt.idOf(node.key, 'group')}>
          {@render entries(node.children, false)}
        </ul>
      </li>
    {:else}
      <li
        role="separator"
        class={classList('ads-menu-divider', node.dashed && 'ads-menu-divider-dashed', hidden && 'ads-menu-overflowed')}
        data-ads-top={top ? position : undefined}
        inert={hidden}
        data-ads-hidden={hidden ? '' : undefined}
      ></li>
    {/if}
  {/each}
{/snippet}

{#snippet itemEntry(node: MenuItemNode, position: number, hidden: boolean)}
  {@const data = node.data}
  {@const selected = rt.isSelected(node.key)}
  <li
    role="none"
    class={classList('ads-menu-entry', hidden && 'ads-menu-overflowed')}
    data-ads-top={position >= 0 ? position : undefined}
    inert={hidden}
    data-ads-hidden={hidden ? '' : undefined}
  >
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
      bind:this={itemElements[node.key]}
      class={classList(
        'ads-menu-item',
        selected && 'ads-menu-item-selected',
        data.danger && 'ads-menu-item-danger',
        data.disabled && 'ads-menu-item-disabled',
        data.class,
        partClass('item')
      )}
      style={partStyle('item')}
      role={rt.selectable ? (rt.multiple ? 'menuitemcheckbox' : 'menuitemradio') : 'menuitem'}
      aria-checked={rt.selectable ? selected : undefined}
      aria-disabled={data.disabled ? 'true' : undefined}
      tabindex={tabindexOf(node.key)}
      data-ads-key={node.key}
      onclick={(event) => rt.activateItem(node, event)}
      onkeydown={(event) => rt.keydown(event, node.key, 'item', scope)}
      onfocus={() => kind !== 'popup' && rt.setTabKey(node.key)}
      onmouseenter={() => rt.hoverList(scope)}
    >
      {@render icon(data.icon, firstLetter(data.label, data.icon))}
      <span class={classList('ads-menu-item-content', partClass('itemContent'))} style={partStyle('itemContent')}>{@render content(data.label)}</span>
      {#if data.extra !== undefined && data.extra !== null && data.extra !== ''}
        <span class="ads-menu-item-extra">{@render content(data.extra)}</span>
      {/if}
    </div>
    {#if rt.collapsed && kind === 'root' && rt.tooltip !== false}
      <MenuTip anchor={itemElements[node.key] ?? null} title={data.title} ready={rt.tipsReady} config={rt.tooltip} />
    {/if}
  </li>
{/snippet}

{#snippet subMenuEntry(node: MenuSubMenuNode, position: number, hidden: boolean)}
  {@const data = node.data}
  {@const open = rt.isOpen(node.key) && !hidden}
  {@const path = rt.keyPath(node.key).reverse()}
  {#snippet inner()}
    <MenuList nodes={node.children} kind="popup" level={1} parentKey={node.key} theme={data.theme ?? theme} />
  {/snippet}
  <li
    role="none"
    class={classList('ads-menu-entry ads-menu-submenu', hidden && 'ads-menu-overflowed')}
    data-ads-top={position >= 0 ? position : undefined}
    inert={hidden}
    data-ads-hidden={hidden ? '' : undefined}
  >
    <div
      bind:this={titleElements[node.key]}
      id={hidden ? undefined : rt.idOf(node.key, 'title')}
      class={classList(
        'ads-menu-item ads-menu-submenu-title',
        open && 'ads-menu-submenu-open',
        rt.hasSelectedDescendant(node.key) && 'ads-menu-submenu-selected',
        data.disabled && 'ads-menu-item-disabled',
        data.class,
        rt.classNames?.subMenu?.itemTitle
      )}
      style={styleText(rt.styles?.subMenu?.itemTitle)}
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={!hidden && rt.hasList(node.key) ? rt.idOf(node.key, 'list') : undefined}
      aria-disabled={data.disabled ? 'true' : undefined}
      tabindex={tabindexOf(node.key)}
      data-ads-key={node.key}
      onclick={(event) => rt.activateTitle(node, event)}
      onkeydown={(event) => rt.keydown(event, node.key, 'submenu', scope)}
      onfocus={() => kind !== 'popup' && rt.setTabKey(node.key)}
      onpointerdown={(event) => rt.noteTouch(event)}
      onmouseenter={() => rt.hoverTitle(node.key)}
      onmouseleave={() => rt.hoverOut()}
    >
      {@render icon(data.icon, firstLetter(data.label, data.icon))}
      <span class={classList('ads-menu-item-content', rt.classNames?.subMenu?.itemContent)} style={styleText(rt.styles?.subMenu?.itemContent)}>{@render content(data.label)}</span>
      {@render expandIcon(node)}
    </div>
    {#if rt.popupMode}
      {#if !hidden}
        <Popup
          open={open}
          anchor={titleElements[node.key] ?? null}
          placement={bar ? 'bottomLeft' : 'rightTop'}
          offset={8}
          matchWidth={bar}
          shift={data.popupOffset}
          layer="dropdown"
          forceMount={rt.forceSubMenuRender}
          class={classList('ads-menu-popup', `ads-menu-popup-${data.theme ?? theme}`, data.popupClassName, rt.classNames?.popup)}
          style={styleText(rt.styles?.popup)}
          onopenchange={() => rt.dismiss(node.key)}
        >
          {#if data.popupRender ?? rt.popupRender}
            {@const render = (data.popupRender ?? rt.popupRender)!}
            {@render render({ item: data, keys: path, children: inner })}
          {:else}
            {@render inner()}
          {/if}
        </Popup>
      {/if}
    {:else}
      <div class="ads-menu-sub-wrap" data-open={open ? '' : undefined} inert={!open} data-ads-hidden={open ? undefined : ''}>
        <div class="ads-menu-sub-inner">
          <MenuList nodes={node.children} kind="sub" level={level + 1} parentKey={node.key} {theme} />
        </div>
      </div>
    {/if}
  </li>
{/snippet}

<ul
  {...rest}
  bind:this={element}
  class={rootClass}
  style={rootStyle}
  {role}
  id={parentKey === null ? rest.id : rt.idOf(parentKey, 'list')}
  dir={kind === 'popup' && rt.rtl ? 'rtl' : undefined}
  aria-orientation={bar ? 'horizontal' : undefined}
  aria-labelledby={parentKey === null ? rest['aria-labelledby'] : rt.idOf(parentKey, 'title')}
  onmouseenter={() => rt.hoverList(scope)}
  onmouseleave={() => rt.hoverOut()}
>
  {@render entries(nodes, kind === 'root')}
  {#if bar}
    <li
      role="none"
      class={classList('ads-menu-entry ads-menu-more', limit === null && 'ads-menu-more-hidden')}
      data-ads-more=""
      inert={limit === null}
      data-ads-hidden={limit === null ? '' : undefined}
    >
      <div
        bind:this={moreElement}
        id={rt.idOf(OVERFLOW_KEY, 'title')}
        class={classList(
          'ads-menu-item ads-menu-submenu-title ads-menu-more-title',
          rt.overflowOpen && 'ads-menu-submenu-open',
          overflowSelected && 'ads-menu-submenu-selected'
        )}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={rt.overflowOpen}
        aria-controls={rt.hasList(OVERFLOW_KEY) ? rt.idOf(OVERFLOW_KEY, 'list') : undefined}
        aria-label={rt.overflowLabel}
        tabindex={rt.tabKey === OVERFLOW_KEY ? 0 : -1}
        data-ads-key={OVERFLOW_KEY}
        onclick={(event) => rt.activateOverflow(event)}
        onkeydown={(event) => rt.keydown(event, OVERFLOW_KEY, 'overflow', null)}
        onfocus={() => rt.setTabKey(OVERFLOW_KEY)}
        onpointerdown={(event) => rt.noteTouch(event)}
        onmouseenter={() => rt.hoverTitle(OVERFLOW_KEY)}
        onmouseleave={() => rt.hoverOut()}
      >
        {#if typeof rt.overflowedIndicator === 'function'}
          {@render rt.overflowedIndicator()}
        {:else if rt.overflowedIndicator}
          {rt.overflowedIndicator}
        {:else}
          <MenuIcon name="ellipsis" />
        {/if}
      </div>
      {#if limit !== null}
        {#snippet overflowInner()}
          <MenuList nodes={overflowNodes} kind="popup" level={1} parentKey={OVERFLOW_KEY} {theme} />
        {/snippet}
        <Popup
          open={rt.overflowOpen}
          anchor={moreElement}
          placement="bottomRight"
          offset={8}
          layer="dropdown"
          class={classList('ads-menu-popup', `ads-menu-popup-${theme}`, rt.classNames?.popup)}
          style={styleText(rt.styles?.popup)}
          onopenchange={() => rt.dismiss(OVERFLOW_KEY)}
        >
          {#if rt.popupRender}
            {@render rt.popupRender({ item: null, keys: [], children: overflowInner })}
          {:else}
            {@render overflowInner()}
          {/if}
        </Popup>
      {/if}
    </li>
  {/if}
</ul>

<style>
  /*
   * Colors and sizes are private variables set by the theme class; the rules below read them. A list in a popup sets
   * them again, because its element is not inside the root.
   */
  .ads-menu {
    --_color: var(--ads-menu-item-color);
    --_hover-color: var(--ads-menu-item-hover-color);
    --_hover-bg: var(--ads-menu-item-hover-bg);
    --_active-bg: var(--ads-menu-item-active-bg);
    --_selected-color: var(--ads-menu-item-selected-color);
    --_selected-bg: var(--ads-menu-item-selected-bg);
    --_submenu-selected-color: var(--ads-menu-submenu-selected-color);
    --_disabled-color: var(--ads-menu-item-disabled-color);
    --_danger-color: var(--ads-menu-danger-color);
    --_danger-hover-color: var(--ads-menu-danger-hover-color);
    --_danger-selected-color: var(--ads-menu-danger-selected-color);
    --_danger-selected-bg: var(--ads-menu-danger-selected-bg);
    --_danger-active-bg: var(--ads-menu-danger-active-bg);
    --_group-color: var(--ads-menu-group-title-color);
    --_sub-bg: var(--ads-menu-submenu-bg);
    --_bg: var(--ads-menu-bg);
    --_split: var(--ads-menu-split);
    --_horizontal-hover-color: var(--ads-menu-horizontal-hover-color);
    --_horizontal-selected-color: var(--ads-menu-horizontal-selected-color);
    --_horizontal-hover-bg: var(--ads-menu-horizontal-hover-bg);
    --_horizontal-selected-bg: var(--ads-menu-horizontal-selected-bg);
  }

  .ads-menu-dark {
    --_color: var(--ads-menu-dark-item-color);
    --_hover-color: var(--ads-menu-dark-item-hover-color);
    --_hover-bg: var(--ads-menu-dark-item-hover-bg);
    --_active-bg: var(--ads-menu-dark-item-hover-bg);
    --_selected-color: var(--ads-menu-dark-item-selected-color);
    --_selected-bg: var(--ads-menu-dark-item-selected-bg);
    --_submenu-selected-color: var(--ads-menu-dark-item-selected-color);
    --_disabled-color: var(--ads-menu-dark-item-disabled-color);
    --_danger-color: var(--ads-menu-dark-danger-color);
    --_danger-hover-color: var(--ads-menu-dark-danger-hover-color);
    --_danger-selected-color: var(--ads-menu-dark-danger-selected-color);
    --_danger-selected-bg: var(--ads-menu-dark-danger-selected-bg);
    --_danger-active-bg: var(--ads-menu-dark-danger-active-bg);
    --_group-color: var(--ads-menu-dark-group-title-color);
    --_sub-bg: var(--ads-menu-dark-submenu-bg);
    --_bg: var(--ads-menu-dark-bg);
    --_split: transparent;
    --_horizontal-hover-color: var(--ads-menu-dark-item-hover-color);
    --_horizontal-selected-color: var(--ads-menu-dark-item-selected-color);
    --_horizontal-hover-bg: transparent;
    --_horizontal-selected-bg: transparent;
  }

  .ads-menu-popup-list {
    --_bg: var(--ads-menu-popup-bg);
  }

  .ads-menu-popup-list.ads-menu-dark {
    --_bg: var(--ads-menu-dark-popup-bg);
  }

  .ads-menu {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--_color);
    background: var(--_bg);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: 1.5714285714285714;
    text-align: start;
    outline: none;
  }

  .ads-menu-root {
    min-width: 0;
  }

  .ads-menu-root.ads-menu-vertical,
  .ads-menu-root.ads-menu-inline {
    border-inline-end: 1px solid var(--_split);
  }

  .ads-menu-root.ads-menu-horizontal {
    position: relative;
    display: flex;
    flex-wrap: nowrap;
    overflow: hidden;
    border-bottom: 1px solid var(--_split);
    line-height: var(--ads-menu-horizontal-line-height);
    white-space: nowrap;
  }

  /* A width that is a length can be animated: `auto` cannot, so the inline menu has `100%` and the collapsed one 80px. */
  .ads-menu-root.ads-menu-inline {
    width: 100%;
    transition: width var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-menu-root.ads-menu-inline-collapsed {
    width: var(--ads-menu-collapsed-width);
  }

  .ads-menu-popup-list {
    min-width: var(--ads-menu-popup-min-width);
    border-radius: var(--ads-menu-item-radius);
    box-shadow: var(--ads-menu-popup-shadow);
    max-height: calc(100vh - 16px);
    overflow-y: auto;
  }

  .ads-menu-sub {
    background: var(--_sub-bg);
    border-radius: var(--ads-menu-item-radius);
  }

  .ads-menu-entry {
    display: block;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ads-menu-horizontal.ads-menu-root > .ads-menu-entry {
    flex: none;
  }

  .ads-menu-overflowed,
  .ads-menu-more-hidden {
    position: absolute;
    visibility: hidden;
    pointer-events: none;
  }

  /* The item is the box: a row with an icon, the label and what comes after it. */
  .ads-menu-item {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: var(--ads-menu-item-height);
    margin: var(--ads-menu-item-margin-block) var(--ads-menu-item-margin-inline);
    padding-block: 0;
    padding-inline: var(--ads-menu-pad-start, var(--ads-menu-item-padding-inline)) var(--ads-menu-item-padding-inline);
    border-radius: var(--ads-menu-item-radius);
    color: var(--_color);
    line-height: var(--ads-menu-item-height);
    white-space: nowrap;
    cursor: pointer;
    outline: none;
    transition:
      color var(--ads-motion-duration-slow),
      background-color var(--ads-motion-duration-slow),
      padding var(--ads-motion-duration-slow) var(--ads-motion-ease);
  }

  .ads-menu-sub .ads-menu-item,
  .ads-menu-popup-list .ads-menu-item {
    border-radius: var(--ads-menu-submenu-item-radius);
  }

  .ads-menu-item:hover {
    color: var(--_hover-color);
    background: var(--_hover-bg);
  }

  .ads-menu-item:active {
    background: var(--_active-bg);
  }

  .ads-menu-item:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: -2px;
  }

  .ads-menu-item-selected {
    color: var(--_selected-color);
    background: var(--_selected-bg);
  }

  .ads-menu-submenu-selected {
    color: var(--_submenu-selected-color);
  }

  .ads-menu-item-danger {
    color: var(--_danger-color);
  }

  .ads-menu-item-danger:hover {
    color: var(--_danger-hover-color);
  }

  .ads-menu-item-danger:active {
    background: var(--_danger-active-bg);
  }

  .ads-menu-item-danger.ads-menu-item-selected {
    color: var(--_danger-selected-color);
    background: var(--_danger-selected-bg);
  }

  .ads-menu-item-disabled,
  .ads-menu-item-disabled:hover,
  .ads-menu-item-disabled:active {
    color: var(--_disabled-color);
    background: transparent;
    cursor: not-allowed;
  }

  .ads-menu-item-icon {
    display: inline-flex;
    flex: none;
    align-items: center;
    min-width: var(--ads-menu-icon-size);
    margin-inline-end: var(--ads-menu-icon-gap);
    font-size: var(--ads-menu-icon-size);
    transition:
      font-size var(--ads-motion-duration-slow),
      margin var(--ads-motion-duration-slow);
  }

  .ads-menu-item-content {
    flex: auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity var(--ads-motion-duration-slow);
  }

  .ads-menu-item-extra {
    flex: none;
    margin-inline-start: 8px;
    color: var(--_group-color);
  }

  .ads-menu-expand {
    display: inline-flex;
    flex: none;
    margin-inline-start: 8px;
    font-size: 12px;
    transition: transform var(--ads-motion-duration-slow) var(--ads-motion-ease);
  }

  /* The arrow of a popup submenu points to the side the popup opens to; an open inline submenu turns it up. */
  .ads-menu-vertical .ads-menu-expand,
  .ads-menu-popup-list .ads-menu-expand {
    transform: rotate(-90deg);
  }

  .ads-menu-inline .ads-menu-submenu-open > .ads-menu-expand {
    transform: rotate(180deg);
  }

  .ads-menu-rtl.ads-menu-vertical .ads-menu-expand,
  .ads-menu-rtl.ads-menu-popup-list .ads-menu-expand {
    transform: rotate(90deg);
  }

  /* Horizontal bar: the item is a tab with a bar under it. */
  .ads-menu-horizontal.ads-menu-root .ads-menu-item {
    height: var(--ads-menu-horizontal-line-height);
    /* The item overlaps the border of the bar by a pixel, so the bar is 46px high with it, as in Ant Design. */
    margin: -1px 0 0;
    padding-inline: var(--ads-menu-item-padding-inline);
    border-radius: var(--ads-menu-horizontal-radius);
    line-height: var(--ads-menu-horizontal-line-height);
  }

  .ads-menu-horizontal.ads-menu-root .ads-menu-item:hover {
    color: var(--_horizontal-hover-color);
    background: var(--_horizontal-hover-bg);
  }

  .ads-menu-horizontal.ads-menu-root .ads-menu-item-selected,
  .ads-menu-horizontal.ads-menu-root .ads-menu-submenu-selected {
    color: var(--_horizontal-selected-color);
    background: var(--_horizontal-selected-bg);
  }

  .ads-menu-horizontal.ads-menu-root .ads-menu-item::after {
    content: '';
    position: absolute;
    inset-inline: var(--ads-menu-item-padding-inline);
    bottom: 0;
    height: var(--ads-menu-active-bar-height);
    background: currentColor;
    opacity: 0;
    transition: opacity var(--ads-motion-duration-slow);
  }

  .ads-menu-horizontal.ads-menu-root .ads-menu-item-selected::after,
  .ads-menu-horizontal.ads-menu-root .ads-menu-submenu-selected::after,
  .ads-menu-horizontal.ads-menu-root .ads-menu-submenu-open::after {
    opacity: 1;
  }

  .ads-menu-horizontal.ads-menu-root .ads-menu-item-disabled::after {
    opacity: 0;
  }

  .ads-menu-more-title {
    justify-content: center;
  }

  /* Groups and dividers. */
  .ads-menu-group-title {
    padding: 8px var(--ads-menu-item-padding-inline);
    color: var(--_group-color);
    font-size: var(--ads-menu-group-title-font-size);
    line-height: var(--ads-menu-group-title-line-height);
    transition: none;
  }

  /* An inline list gives the title the margin and the indent of its level, so the title and the items of a group start at the same place. */
  .ads-menu-inline .ads-menu-group-title {
    margin-inline: var(--ads-menu-item-margin-inline);
    padding-inline: var(--ads-menu-pad-start) var(--ads-menu-item-padding-inline);
  }

  .ads-menu-group-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* In a vertical list or a popup the items of a group stand in from their title (as the indent of a level does inline). The items take
     it as their start padding, like the indent of an inline level, so the bar of forced colors can take its width off it. */
  .ads-menu-vertical .ads-menu-group-list {
    --ads-menu-pad-start: calc(var(--ads-menu-group-item-indent) - var(--ads-menu-item-margin-inline));
  }

  .ads-menu-divider {
    height: 1px;
    margin-block: 4px;
    margin-inline: 0;
    list-style: none;
    background: var(--_split);
  }

  .ads-menu-dark .ads-menu-divider {
    background: rgba(255, 255, 255, 0.12);
  }

  .ads-menu-divider-dashed {
    height: 0;
    border-top: 1px dashed var(--_split);
    background: none;
  }

  /* An inline submenu opens by growing its height from 0 to its content. Closed, it is invisible and out of the Tab order. */
  .ads-menu-sub-wrap {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows var(--ads-motion-duration-slow) var(--ads-motion-ease),
      visibility 0s linear var(--ads-motion-duration-slow);
  }

  .ads-menu-sub-wrap[data-open] {
    grid-template-rows: 1fr;
    visibility: visible;
    transition:
      grid-template-rows var(--ads-motion-duration-slow) var(--ads-motion-ease),
      visibility 0s;
  }

  .ads-menu-sub-inner {
    min-height: 0;
    overflow: hidden;
  }

  /* A collapsed menu shows icons only; the labels stay in the page for assistive technology. */
  .ads-menu-inline-collapsed .ads-menu-item {
    padding-inline: calc((var(--ads-menu-collapsed-width) - 2 * var(--ads-menu-item-margin-inline) - var(--ads-menu-collapsed-icon-size)) / 2);
  }

  .ads-menu-inline-collapsed .ads-menu-item > .ads-menu-item-icon {
    margin-inline-end: 0;
    font-size: var(--ads-menu-collapsed-icon-size);
  }

  .ads-menu-inline-collapsed .ads-menu-item > .ads-menu-item-content,
  .ads-menu-inline-collapsed .ads-menu-item > .ads-menu-item-extra {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    opacity: 0;
  }

  .ads-menu-inline-collapsed .ads-menu-group-title {
    display: none;
  }

  /* A group in a bar lies in the row, its title and its items one after the other. */
  .ads-menu-horizontal.ads-menu-root > .ads-menu-group,
  .ads-menu-horizontal.ads-menu-root > .ads-menu-group > .ads-menu-group-list {
    display: flex;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-menu-item,
    .ads-menu-item-icon,
    .ads-menu-item-content,
    .ads-menu-expand,
    .ads-menu-sub-wrap,
    .ads-menu-sub-wrap[data-open],
    .ads-menu-root.ads-menu-inline {
      transition: none;
    }

    .ads-menu-horizontal.ads-menu-root .ads-menu-item::after {
      transition: none;
    }
  }

  /*
   * System colors replace the colors. An item takes its colors from the system itself (`forced-color-adjust: none` and the
   * system color names): Chromium and WebKit paint even a transparent border in the text color when the adjustment is on, and
   * then every item would show the bar of the selected one. The selected item has a bar at its start; every item has the bar
   * (transparent) and a padding smaller by its width, so selecting one never moves its text. A popup gets a border.
   */
  @media (forced-colors: active) {
    .ads-menu-item {
      forced-color-adjust: none;
      border-inline-start: 3px solid transparent;
      padding-inline-start: calc(var(--ads-menu-pad-start, var(--ads-menu-item-padding-inline)) - 3px);
      color: CanvasText;
      background: transparent;
    }

    .ads-menu-inline-collapsed .ads-menu-item {
      padding-inline-start: calc((var(--ads-menu-collapsed-width) - 2 * var(--ads-menu-item-margin-inline) - var(--ads-menu-collapsed-icon-size)) / 2 - 3px);
    }

    .ads-menu-item:hover,
    .ads-menu-item:active,
    .ads-menu-item-danger:hover,
    .ads-menu-item-danger:active {
      color: HighlightText;
      background: Highlight;
    }

    .ads-menu-item-selected,
    .ads-menu-submenu-selected,
    .ads-menu-item-danger,
    .ads-menu-item-danger.ads-menu-item-selected {
      color: CanvasText;
      background: transparent;
    }

    .ads-menu-item-selected,
    .ads-menu-submenu-selected {
      border-inline-start-color: CanvasText;
    }

    .ads-menu-item-selected:hover,
    .ads-menu-submenu-selected:hover {
      border-inline-start-color: HighlightText;
      color: HighlightText;
      background: Highlight;
    }

    .ads-menu-item-disabled,
    .ads-menu-item-disabled:hover,
    .ads-menu-item-disabled:active {
      color: GrayText;
      background: transparent;
    }

    /* A bar has the line under the selected item instead. */
    .ads-menu-horizontal.ads-menu-root .ads-menu-item {
      border-inline-start: 0;
      padding-inline-start: var(--ads-menu-item-padding-inline);
    }

    .ads-menu-horizontal.ads-menu-root .ads-menu-item::after {
      background: CanvasText;
    }

    .ads-menu-item:focus-visible {
      outline-color: Highlight;
    }

    .ads-menu-popup-list {
      border: 1px solid CanvasText;
    }
  }
</style>
