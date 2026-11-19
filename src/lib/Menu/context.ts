import { getContext, setContext, type Snippet } from 'svelte';
import type {
  MenuClassNames,
  MenuContent,
  MenuExpandIconInfo,
  MenuMode,
  MenuPopupInfo,
  MenuStyles,
  MenuSubMenuType,
  MenuTheme,
  MenuTitleClickInfo,
  MenuTooltipProps
} from './types.js';
import type { MenuItemNode, MenuNode, MenuSubMenuNode } from './tree.js';

// ---- Markup components ----------------------------------------------------------------------------------

/** What a `MenuItem` written as markup tells its Menu. The members are getters over its props. */
export interface ItemRegistration {
  kind: 'item';
  /** The invisible element the component leaves in the markup; its position is the position of the item. */
  node: () => Element | null;
  parent: ContainerRegistration | undefined;
  props: () => {
    key: string;
    label: MenuContent | undefined;
    icon: string | Snippet | undefined;
    title: string | undefined;
    extra: MenuContent | undefined;
    disabled: boolean | undefined;
    danger: boolean | undefined;
    class: string | undefined;
    children: Snippet | undefined;
  };
}

export interface SubMenuRegistration {
  kind: 'submenu';
  node: () => Element | null;
  parent: ContainerRegistration | undefined;
  props: () => {
    key: string;
    label: MenuContent | undefined;
    icon: string | Snippet | undefined;
    disabled: boolean | undefined;
    popupClassName: string | undefined;
    popupOffset: readonly [number, number] | undefined;
    theme: MenuTheme | undefined;
    ontitleclick: ((info: MenuTitleClickInfo) => void) | undefined;
    popupRender: Snippet<[MenuPopupInfo]> | undefined;
    class: string | undefined;
  };
}

export interface GroupRegistration {
  kind: 'group';
  node: () => Element | null;
  parent: ContainerRegistration | undefined;
  props: () => { label: MenuContent | undefined; class: string | undefined };
}

export interface DividerRegistration {
  kind: 'divider';
  node: () => Element | null;
  parent: ContainerRegistration | undefined;
  props: () => { dashed: boolean | undefined };
}

/** A registration whose children are written inside it. */
export type ContainerRegistration = SubMenuRegistration | GroupRegistration;

export type Registration = ItemRegistration | SubMenuRegistration | GroupRegistration | DividerRegistration;

/** The Menu that the components written inside it register with. */
export interface MenuRegistry {
  /** Adds a component; returns the function that removes it. */
  register(registration: Registration): () => void;
}

const REGISTRY_KEY = Symbol('ads-menu-registry');
const PARENT_KEY = Symbol('ads-menu-parent');

export function setMenuRegistry(registry: MenuRegistry): void {
  setContext(REGISTRY_KEY, registry);
}

/** The nearest Menu, or `undefined` outside of one. */
export function getMenuRegistry(): MenuRegistry | undefined {
  return getContext<MenuRegistry | undefined>(REGISTRY_KEY);
}

export function setParentRegistration(parent: ContainerRegistration): void {
  setContext(PARENT_KEY, parent);
}

/** The nearest `MenuSubMenu` or `MenuItemGroup` between here and the Menu, or `undefined`. */
export function getParentRegistration(): ContainerRegistration | undefined {
  return getContext<ContainerRegistration | undefined>(PARENT_KEY);
}

// ---- What the lists of the menu read from it ------------------------------------------------------------

/** The key of the "…" item of a horizontal menu: it behaves like a submenu that holds the items that did not fit. */
export const OVERFLOW_KEY = '\u0000ads-menu-overflow';

/** The part of a Menu that its lists use. Created by `Menu.svelte`; every member is read when it is needed, so it is reactive. */
export interface MenuRuntime {
  readonly mode: MenuMode;
  /** Inline and collapsed: icons only, submenus as popups. */
  readonly collapsed: boolean;
  /** Submenus open in popups (everything but expanded inline). */
  readonly popupMode: boolean;
  readonly indent: number;
  readonly selectable: boolean;
  readonly multiple: boolean;
  readonly forceSubMenuRender: boolean;
  readonly rtl: boolean;
  readonly classNames: MenuClassNames | undefined;
  readonly styles: MenuStyles | undefined;
  readonly expandIcon: Snippet<[MenuExpandIconInfo]> | undefined;
  readonly popupRender: Snippet<[MenuPopupInfo]> | undefined;
  readonly overflowedIndicator: string | Snippet | undefined;
  readonly overflowLabel: string;
  readonly tooltip: false | MenuTooltipProps | undefined;
  /** The tips of a collapsed menu are held back while the width is still changing. */
  readonly tipsReady: boolean;
  /** How many top-level nodes of a horizontal bar are shown; `null`: all. */
  readonly visibleCount: number | null;
  /** The key that has `tabindex="0"`. */
  readonly tabKey: string | undefined;
  /** The popup of the "…" item is open. */
  readonly overflowOpen: boolean;
  /** An element id for a key and a part (`title`, `list`, `group`). Unique among the menus of a page. */
  idOf(key: string, part: string): string;
  isSelected(key: string): boolean;
  /** A submenu that holds a selected item. */
  hasSelectedDescendant(key: string): boolean;
  isOpen(key: string): boolean;
  /** The list of this submenu exists in the page (so `aria-controls` may name it). */
  hasList(key: string): boolean;
  /** The keys from the item up to the outermost submenu. */
  keyPath(key: string): string[];
  setTabKey(key: string): void;
  // Pointer and keyboard.
  activateItem(node: MenuItemNode, event: MouseEvent | KeyboardEvent): void;
  /** A click or a tap on a title. */
  activateTitle(node: MenuSubMenuNode, event: MouseEvent | KeyboardEvent): void;
  activateOverflow(event: MouseEvent | KeyboardEvent): void;
  /** `listKey`: the popup list the key went to (`null`: the root list, which covers the inline submenus). */
  keydown(event: KeyboardEvent, key: string, kind: 'item' | 'submenu' | 'overflow', listKey: string | null): void;
  /** The pointer entered a title (hover trigger): its popup opens after the delay. */
  hoverTitle(key: string): void;
  /** The pointer entered a list or an item of `owner` (`null`: the root list). */
  hoverList(owner: string | null): void;
  hoverOut(): void;
  noteTouch(event: PointerEvent): void;
  /** A popup asked to close (outside press, Escape). */
  dismiss(key: string): void;
  /** A list tells the menu its element, so that focus can be moved into it. Returns the function that forgets it. */
  registerList(listKey: string | null, element: HTMLElement): () => void;
}

const RUNTIME_KEY = Symbol('ads-menu-runtime');

export function setMenuRuntime(runtime: MenuRuntime): void {
  setContext(RUNTIME_KEY, runtime);
}

export function getMenuRuntime(): MenuRuntime {
  return getContext<MenuRuntime>(RUNTIME_KEY);
}

/** Used by the tree for `popupRender` and the keys of a submenu. */
export type { MenuNode, MenuSubMenuType };
