<script lang="ts">
  /*
   * The Menu (specs/menu.md). This component owns the state (what is selected, what is open), the hover timing of popup
   * submenus, the keyboard, the overflow of a horizontal bar and the collapsing of an inline menu; the lists (`MenuList`)
   * draw and report. The tree comes from `items`, or from the markup components written inside.
   */
  import { flushSync, tick, untrack } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';
  import {
    OVERFLOW_KEY,
    setMenuRegistry,
    setMenuRuntime,
    type MenuRuntime,
    type Registration
  } from './context.js';
  import MenuList from './MenuList.svelte';
  import { itemText, matchTypeahead, navigableItems } from './nav.js';
  import {
    buildIndex,
    focusableKeys,
    keyPathOf,
    nodesFromRegistrations,
    normalizeItems,
    selectedAncestors,
    type MenuItemNode,
    type MenuSubMenuNode
  } from './tree.js';
  import {
    MENU_MODES,
    MENU_THEMES,
    MENU_TRIGGER_ACTIONS,
    type MenuClickInfo,
    type MenuProps,
    type MenuSelectInfo
  } from './types.js';

  const uid = $props.id();

  let {
    items = [],
    mode = 'vertical',
    theme = 'light',
    selectedKeys = $bindable([]),
    openKeys = $bindable([]),
    multiple = false,
    selectable = true,
    inlineCollapsed = undefined,
    inlineIndent = 24,
    forceSubMenuRender = false,
    overflowedIndicator = undefined,
    overflowLabel = 'More',
    subMenuOpenDelay = 0,
    subMenuCloseDelay = 0.1,
    triggerSubMenuAction = 'hover',
    expandIcon = undefined,
    tooltip = undefined,
    classNames = undefined,
    styles = undefined,
    popupRender = undefined,
    onclick = undefined,
    onselect = undefined,
    ondeselect = undefined,
    onopenchange = undefined,
    children = undefined,
    class: customClass = undefined,
    style: customStyle = undefined,
    ...rest
  }: MenuProps = $props();

  const resolvedMode = $derived(resolveOption('Menu', 'mode', mode, MENU_MODES, 'vertical'));
  const resolvedTheme = $derived(resolveOption('Menu', 'theme', theme, MENU_THEMES, 'light'));
  const trigger = $derived(resolveOption('Menu', 'triggerSubMenuAction', triggerSubMenuAction, MENU_TRIGGER_ACTIONS, 'hover'));
  // A value outside the contract is reported when the menu is created, not at the first hover.
  untrack(() => trigger);

  // ---- The tree --------------------------------------------------------------------------------------------

  // Components written as markup register while they are created; the order of the markup is read from the invisible
  // marker each one leaves, and again when the markup changes. The list is a plain array and only a counter is state
  // (the reason is in specs/select.md: a read of state in the teardown of a removed item does not see a creation of
  // the same update).
  const registered: Registration[] = [];
  let registryChanges = 0;
  let registryVersion = $state(0);
  let registry: HTMLElement | undefined = $state();
  const registryChanged = () => untrack(() => (registryVersion = ++registryChanges));

  setMenuRegistry({
    register(registration) {
      registered.push(registration);
      registryChanged();
      return () => {
        registered.splice(registered.indexOf(registration), 1);
        registryChanged();
      };
    }
  });

  $effect(() => {
    const element = registry;
    if (!element) return;
    const observer = new MutationObserver(registryChanged);
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  });

  const hasItems = $derived(items.length > 0);
  const nodes = $derived.by(() => {
    if (hasItems) return normalizeItems(items);
    void registryVersion;
    return nodesFromRegistrations(registered);
  });
  const index = $derived(buildIndex(nodes));

  // ---- Selection and open state ----------------------------------------------------------------------------

  const collapsed = $derived(resolvedMode === 'inline' && inlineCollapsed === true);
  /** Submenus open in popups: always but in an expanded inline menu. */
  const popupMode = $derived(resolvedMode !== 'inline' || collapsed);

  const selectedSet = $derived(new Set(selectable ? selectedKeys : []));
  const selectedParents = $derived(selectedAncestors(index, selectedSet));
  const openSet = $derived(new Set(openKeys));
  let overflowOpen = $state(false);

  const sameKeys = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((key, at) => key === b[at]);

  /** The user changed what is open: the parent hears of it (a change made by the parent is not reported). */
  function commitOpen(next: string[]): void {
    if (sameKeys(next, openKeys)) return;
    openKeys = next;
    onopenchange?.(next);
  }

  // A collapsed menu opens its submenus in popups. The submenus that were expanded are remembered and expand again with the menu.
  let savedOpenKeys: string[] | null = null;
  $effect(() => {
    const isCollapsed = collapsed;
    untrack(() => {
      if (isCollapsed && savedOpenKeys === null) {
        savedOpenKeys = [...openKeys];
        openKeys = [];
      } else if (!isCollapsed && savedOpenKeys !== null) {
        openKeys = savedOpenKeys;
        savedOpenKeys = null;
      }
    });
  });

  // The "…" popup belongs to a bar: another mode has none, and a bar that comes back starts with it closed.
  $effect(() => {
    if (resolvedMode !== 'horizontal') overflowOpen = false;
  });

  /** The tips of a collapsed menu wait until the width has settled. */
  let tipsReady = $state(true);
  let tipsStarted = false;
  $effect(() => {
    void collapsed;
    if (!tipsStarted) {
      tipsStarted = true;
      return;
    }
    tipsReady = false;
    const timer = setTimeout(() => (tipsReady = true), 350);
    return () => clearTimeout(timer);
  });

  // ---- The root list, the lists of the popups, direction ---------------------------------------------------

  let rootElement = $state<HTMLElement | null>(null);
  let rtl = $state(false);
  // Plain maps on purpose: they are read when a key or a hover needs them, and only the counters that follow them are state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const lists = new Map<string | null, HTMLElement>();
  let listVersion = $state(0);

  /** The direction is the one of the page where the menu is. It can change at any time, so it is read when it matters. */
  function readDirection(): void {
    rtl = getComputedStyle(rootElement as HTMLElement).direction === 'rtl';
  }

  $effect(() => {
    void resolvedMode;
    // The element is bound before the effects run.
    readDirection();
  });

  // ---- Horizontal overflow ---------------------------------------------------------------------------------

  /** How many top-level nodes of a horizontal bar fit; `null`: all of them. */
  let visibleCount = $state<number | null>(null);

  function outerWidth(element: HTMLElement): number {
    const style = getComputedStyle(element);
    return element.getBoundingClientRect().width + (parseFloat(style.marginLeft) || 0) + (parseFloat(style.marginRight) || 0);
  }

  function measure(): void {
    // Called only for a bar: the effect below stops the observer when the mode changes.
    const root = rootElement as HTMLElement;
    const entries = Array.from(root.querySelectorAll<HTMLElement>(':scope > li[data-ads-top]'));
    const widths = entries.map(outerWidth);
    const available = root.clientWidth;
    if (widths.reduce((sum, width) => sum + width, 0) <= available) {
      visibleCount = null;
      return;
    }
    const more = root.querySelector<HTMLElement>(':scope > li[data-ads-more]');
    let used = outerWidth(more as HTMLElement);
    let count = 0;
    for (const width of widths) {
      if (used + width > available) break;
      used += width;
      count++;
    }
    visibleCount = count;
  }

  // Measured on every change of the bar's size or of the size of one of its entries (also the hidden ones, which keep their
  // width). The measuring runs inside the observer callback, so the bar is drawn once, in its final shape.
  $effect(() => {
    void nodes;
    const root = rootElement as HTMLElement;
    if (resolvedMode !== 'horizontal') {
      visibleCount = null;
      return;
    }
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(root);
    for (const entry of root.querySelectorAll(':scope > li')) observer.observe(entry);
    return () => observer.disconnect();
  });

  // ---- What can take focus ---------------------------------------------------------------------------------

  let rovingKey = $state<string | undefined>();
  const focusKeys = $derived.by(() => {
    const keys = focusableKeys(nodes, (key) => !popupMode && openSet.has(key), visibleCount);
    if (resolvedMode === 'horizontal' && visibleCount !== null) keys.push(OVERFLOW_KEY);
    return keys;
  });
  /** The one item with `tabindex="0"`: the last one that had focus, else a selected item, else the first. */
  const tabKey = $derived(
    rovingKey !== undefined && focusKeys.includes(rovingKey)
      ? rovingKey
      : (focusKeys.find((key) => selectedSet.has(key)) ?? focusKeys.find((key) => selectedParents.has(key)) ?? focusKeys[0])
  );

  /** The row of an item or a title, in the root list or in a popup. The key belongs to an item that is on the page. */
  function elementOf(key: string): HTMLElement {
    const candidates = [...lists.values()].flatMap((list) => [...list.querySelectorAll<HTMLElement>('[data-ads-key]')]);
    return candidates.find((candidate) => candidate.dataset.adsKey === key) as HTMLElement;
  }

  /** The key is in a top-level node that is hidden in the overflow popup of a bar. */
  const inOverflow = (key: string) => visibleCount !== null && (index.topIndexOf.get(key) as number) >= visibleCount;

  /** The outermost submenu a key is in (or the key itself); the "…" item for what waits in the overflow popup. */
  function topOf(key: string): string {
    if (key === OVERFLOW_KEY) return key;
    const path = keyPathOf(index, key);
    return inOverflow(key) ? OVERFLOW_KEY : path[path.length - 1];
  }

  function focusKey(key: string): void {
    elementOf(key).focus();
  }

  // ---- Opening and closing popups --------------------------------------------------------------------------

  const isWithin = (key: string, ancestor: string) => keyPathOf(index, key).includes(ancestor);

  function openChain(key: string): void {
    readDirection();
    if (key === OVERFLOW_KEY) {
      commitOpen([]);
      overflowOpen = true;
      return;
    }
    commitOpen(keyPathOf(index, key).reverse());
    overflowOpen = inOverflow(key);
  }

  /** Closes a submenu and what is open inside it. */
  function closeFrom(key: string): void {
    if (key === OVERFLOW_KEY) {
      overflowOpen = false;
      commitOpen(openKeys.filter((open) => !inOverflow(open)));
    } else {
      commitOpen(openKeys.filter((open) => !isWithin(open, key)));
    }
  }

  function closeAll(): void {
    commitOpen([]);
    overflowOpen = false;
  }

  function toggleInline(key: string): void {
    commitOpen(openSet.has(key) ? openKeys.filter((open) => open !== key) : [...openKeys, key]);
  }

  // ---- Hover (popup submenus) ------------------------------------------------------------------------------

  // `hovered` is the submenu whose title or popup holds the pointer (`null`: none, or the root list). One timer closes
  // what the pointer is not in once it has been away for the close delay, so the pointer may cross the gap between a title
  // and its popup, or go from a popup into a popup of its own.
  let hovered: string | null = null;
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let touchedAt = -Infinity;
  const afterTouch = () => performance.now() - touchedAt < 800;
  const hoverActive = () => popupMode && trigger === 'hover' && !afterTouch();

  function settleHover(): void {
    // Nothing is kept when the pointer is in no submenu or on the "…" item itself (its own popup is the one that stays).
    const keep = hovered === null || hovered === OVERFLOW_KEY ? [] : keyPathOf(index, hovered);
    commitOpen(openKeys.filter((key) => keep.includes(key)));
    if (hovered === null || (hovered !== OVERFLOW_KEY && !inOverflow(hovered))) overflowOpen = false;
  }

  /** After the close delay, what the pointer is not in closes. Every entry and every leaving starts the delay again. */
  function scheduleSettle(): void {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(settleHover, subMenuCloseDelay * 1000);
  }

  function hoverTitle(key: string): void {
    if (!hoverActive()) return;
    hovered = key;
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    const node = index.nodeOf.get(key);
    // A title that is disabled or already open opens nothing; what is open below it, or beside it, closes after the delay.
    if (node?.data.disabled || (key === OVERFLOW_KEY ? overflowOpen : openSet.has(key))) {
      scheduleSettle();
      return;
    }
    if (subMenuOpenDelay <= 0) openChain(key);
    else openTimer = setTimeout(() => openChain(key), subMenuOpenDelay * 1000);
  }

  function hoverList(owner: string | null): void {
    if (!hoverActive()) return;
    hovered = owner;
    clearTimeout(openTimer);
    scheduleSettle();
  }

  function hoverOut(): void {
    if (!hoverActive()) return;
    hovered = null;
    clearTimeout(openTimer);
    scheduleSettle();
  }

  $effect(() => () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
  });

  // ---- Choosing --------------------------------------------------------------------------------------------

  function select(node: MenuItemNode, event: MouseEvent | KeyboardEvent): void {
    const key = node.key;
    const base = { key, keyPath: keyPathOf(index, key), domEvent: event, itemData: node.data };
    if (multiple) {
      const was = selectedSet.has(key);
      const next = was ? selectedKeys.filter((selected) => selected !== key) : [...selectedKeys, key];
      selectedKeys = next;
      const info: MenuSelectInfo = { ...base, selectedKeys: next };
      (was ? ondeselect : onselect)?.(info);
    } else if (!selectedSet.has(key)) {
      selectedKeys = [key];
      onselect?.({ ...base, selectedKeys: [key] });
    }
  }

  function activateItem(node: MenuItemNode, event: MouseEvent | KeyboardEvent): void {
    if (node.data.disabled) return;
    const info: MenuClickInfo = { key: node.key, keyPath: keyPathOf(index, node.key), domEvent: event, itemData: node.data };
    onclick?.(info);
    if (selectable) select(node, event);
    if (popupMode && (openKeys.length > 0 || overflowOpen)) {
      const inPopup = [...lists].some(([key, list]) => key !== null && list.contains(document.activeElement));
      closeAll();
      // The element that had focus is going away with the popup: focus goes back to the item the popup came from.
      if (inPopup || event.type === 'keydown') focusKey(topOf(node.key));
    }
  }

  function activateTitle(node: MenuSubMenuNode, event: MouseEvent | KeyboardEvent): void {
    if (node.data.disabled) return;
    node.data.ontitleclick?.({ key: node.key, domEvent: event });
    if (!popupMode) {
      toggleInline(node.key);
      return;
    }
    const open = openSet.has(node.key);
    // The mouse opens a popup by hovering: a click on a title that is open leaves it open. A tap and the click trigger toggle.
    if (trigger === 'hover' && !afterTouch()) {
      if (!open) openChain(node.key);
    } else if (open) closeFrom(node.key);
    else openChain(node.key);
  }

  function activateOverflow(event: MouseEvent | KeyboardEvent): void {
    void event;
    if (trigger === 'hover' && !afterTouch()) {
      if (!overflowOpen) openChain(OVERFLOW_KEY);
    } else if (overflowOpen) closeFrom(OVERFLOW_KEY);
    else openChain(OVERFLOW_KEY);
  }

  // ---- Keyboard --------------------------------------------------------------------------------------------

  async function focusWhenReady(key: string, where: 'first' | 'last'): Promise<void> {
    for (let attempt = 0; attempt < 6; attempt++) {
      await tick();
      const list = lists.get(key);
      // The popup may not exist: a parent that holds `openKeys` can refuse to open it.
      const entries = list ? navigableItems(list) : [];
      const target = where === 'first' ? entries[0] : entries[entries.length - 1];
      target?.focus();
      if (target && document.activeElement === target) return;
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  }

  function openAndFocus(key: string, where: 'first' | 'last'): void {
    openChain(key);
    void focusWhenReady(key, where);
  }

  let typed = '';
  let typedTimer: ReturnType<typeof setTimeout> | undefined;

  function typeahead(character: string, entries: HTMLElement[], at: number): boolean {
    clearTimeout(typedTimer);
    typed += character.toLowerCase();
    typedTimer = setTimeout(() => (typed = ''), 500);
    const match = matchTypeahead(entries.map(itemText), at, typed);
    if (match < 0) return false;
    entries[match].focus();
    return true;
  }

  /** Moves focus along the bar; a popup that is open is closed. */
  function moveInBar(from: string, delta: number, open: boolean): void {
    const root = lists.get(null) as HTMLElement;
    const entries = navigableItems(root);
    const current = entries.findIndex((entry) => entry.dataset.adsKey === from);
    const next = entries[(current + delta + entries.length) % entries.length];
    closeAll();
    next.focus();
    const key = next.dataset.adsKey as string;
    if (open && next.getAttribute('aria-haspopup')) openAndFocus(key, 'first');
  }

  /** A top-level popup of a horizontal bar: the arrows Left and Right go to the neighbor on the bar. */
  const barOwns = (listKey: string) =>
    resolvedMode === 'horizontal' && (listKey === OVERFLOW_KEY || index.parentOf.get(listKey) === null);

  function keydown(event: KeyboardEvent, key: string, kind: 'item' | 'submenu' | 'overflow', listKey: string | null): void {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    // The list of an item is registered before the item can be reached by a key.
    const list = lists.get(listKey) as HTMLElement;
    readDirection();
    const target = event.currentTarget as HTMLElement;
    const entries = navigableItems(list);
    const at = entries.indexOf(target);
    const inBar = resolvedMode === 'horizontal' && listKey === null;
    const holdsPopup = kind !== 'item';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const focusAt = (position: number) => entries[(position + entries.length) % entries.length].focus();

    switch (event.key) {
      case 'ArrowDown':
        if (inBar) {
          if (holdsPopup) {
            event.preventDefault();
            openAndFocus(key, 'first');
          }
        } else {
          event.preventDefault();
          focusAt(at + 1);
        }
        break;
      case 'ArrowUp':
        if (inBar) {
          if (holdsPopup) {
            event.preventDefault();
            openAndFocus(key, 'last');
          }
        } else {
          event.preventDefault();
          focusAt(at - 1);
        }
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(-1);
        break;
      case forward:
        if (inBar) {
          event.preventDefault();
          moveInBar(key, 1, false);
        } else if (holdsPopup) {
          event.preventDefault();
          if (popupMode) openAndFocus(key, 'first');
          else if (!openSet.has(key)) toggleInline(key);
          else focusAt(at + 1);
        } else if (listKey !== null && barOwns(listKey)) {
          event.preventDefault();
          moveInBar(topOf(listKey), 1, true);
        }
        break;
      case backward:
        if (inBar) {
          event.preventDefault();
          moveInBar(key, -1, false);
        } else if (listKey !== null) {
          event.preventDefault();
          if (barOwns(listKey)) moveInBar(topOf(listKey), -1, true);
          else {
            closeFrom(listKey);
            focusKey(listKey);
          }
        } else if (resolvedMode === 'inline') {
          const parent = index.parentOf.get(key);
          if (holdsPopup && openSet.has(key)) {
            event.preventDefault();
            toggleInline(key);
          } else if (parent != null) {
            event.preventDefault();
            focusKey(parent);
          }
        }
        break;
      case 'Enter':
      case ' ':
        if (event.key === ' ' && typed !== '') {
          typeahead(' ', entries, at);
          event.preventDefault();
          break;
        }
        event.preventDefault();
        if (kind === 'item') activateItem(index.nodeOf.get(key) as MenuItemNode, event);
        else if (kind === 'overflow') openAndFocus(key, 'first');
        else {
          const node = index.nodeOf.get(key) as MenuSubMenuNode;
          if (node.data.disabled) break;
          node.data.ontitleclick?.({ key, domEvent: event });
          if (popupMode) openAndFocus(key, 'first');
          else toggleInline(key);
        }
        break;
      case 'Escape':
        if (listKey !== null) {
          // The key is used here: the registry of popups leaves a key that was handled alone.
          event.preventDefault();
          closeFrom(listKey);
          focusKey(listKey);
        }
        break;
      case 'Tab':
        if (listKey !== null) {
          // Focus goes back to the bar or the list the popup came from, and Tab goes on from there.
          const top = topOf(listKey);
          closeAll();
          rovingKey = top;
          flushSync();
          focusKey(top);
        }
        break;
      default:
        if (event.key.length === 1 && typeahead(event.key, entries, at)) event.preventDefault();
    }
  }

  // ---- What the lists read ---------------------------------------------------------------------------------

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const ids = new Map<string, number>();
  const runtime: MenuRuntime = {
    get mode() {
      return resolvedMode;
    },
    get collapsed() {
      return collapsed;
    },
    get popupMode() {
      return popupMode;
    },
    get indent() {
      return inlineIndent;
    },
    get selectable() {
      return selectable;
    },
    get multiple() {
      return multiple;
    },
    get forceSubMenuRender() {
      return forceSubMenuRender;
    },
    get rtl() {
      return rtl;
    },
    get classNames() {
      return classNames;
    },
    get styles() {
      return styles;
    },
    get expandIcon() {
      return expandIcon;
    },
    get popupRender() {
      return popupRender;
    },
    get overflowedIndicator() {
      return overflowedIndicator;
    },
    get overflowLabel() {
      return overflowLabel;
    },
    get tooltip() {
      return tooltip;
    },
    get tipsReady() {
      return tipsReady;
    },
    get visibleCount() {
      return visibleCount;
    },
    get tabKey() {
      return tabKey;
    },
    get overflowOpen() {
      return overflowOpen;
    },
    idOf(key, part) {
      let number = ids.get(key);
      if (number === undefined) ids.set(key, (number = ids.size));
      return `ads-menu-${uid}-${part}-${number}`;
    },
    isSelected: (key) => selectedSet.has(key),
    hasSelectedDescendant: (key) => selectedParents.has(key),
    isOpen: (key) => openSet.has(key),
    hasList(key) {
      void listVersion;
      return lists.has(key);
    },
    keyPath: (key) => keyPathOf(index, key),
    setTabKey(key) {
      rovingKey = key;
    },
    activateItem,
    activateTitle,
    activateOverflow,
    keydown,
    hoverTitle,
    hoverList,
    hoverOut,
    noteTouch(event) {
      if (event.pointerType === 'touch') touchedAt = performance.now();
    },
    dismiss: closeFrom,
    registerList(listKey, element) {
      lists.set(listKey, element);
      untrack(() => listVersion++);
      return () => {
        lists.delete(listKey);
        untrack(() => listVersion++);
      };
    }
  };
  setMenuRuntime(runtime);

  if (!isProduction()) {
    $effect(() => {
      if (items.length > 0 && children) console.warn('Menu: `items` and markup children are both given; the children are ignored.');
    });
  }
</script>

<!--
  The markup components draw nothing where they are written: they register with the Menu, which draws them in its lists. They
  are rendered before the lists, so the items exist in a server render.
-->
{#if !hasItems && children}
  <div hidden class="ads-menu-registry" bind:this={registry}>{@render children()}</div>
{/if}

<MenuList
  {...rest}
  {nodes}
  kind="root"
  level={1}
  parentKey={null}
  theme={resolvedTheme}
  bind:element={rootElement}
  class={customClass}
  style={customStyle}
/>
