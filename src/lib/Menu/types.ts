import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { PopupArrow, PopupPlacement } from '../internal/popup/types.js';
import type { SemanticStyle } from '../internal/semantic.js';

/** `vertical`: submenus open in a popup beside the item. `horizontal`: a bar, submenus open below. `inline`: submenus expand in place. */
export type MenuMode = 'vertical' | 'horizontal' | 'inline';

export const MENU_MODES = ['vertical', 'horizontal', 'inline'] as const;

export type MenuTheme = 'light' | 'dark';

export const MENU_THEMES = ['light', 'dark'] as const;

/** What opens a popup submenu with the pointer. The keyboard and touch always work. */
export type MenuTriggerAction = 'hover' | 'click';

export const MENU_TRIGGER_ACTIONS = ['hover', 'click'] as const;

/** Text, a number, or a snippet. */
export type MenuContent = string | number | Snippet;

/** A leaf the user chooses. */
export interface MenuItemType {
  type?: 'item';
  /** Unique among all items and submenus of the menu. */
  key: string;
  label?: MenuContent;
  /** An icon: a snippet, or text such as an emoji. Hidden from assistive technology. */
  icon?: string | Snippet;
  /** The text of the tip of a collapsed item. Default: the text of the label. */
  title?: string;
  /** Content shown at the end of the row. */
  extra?: MenuContent;
  disabled?: boolean;
  danger?: boolean;
  /** Extra class of the row. */
  class?: string;
}

/** An item that holds more items. */
export interface MenuSubMenuType {
  type?: 'submenu';
  key: string;
  label?: MenuContent;
  icon?: string | Snippet;
  children: MenuItems;
  disabled?: boolean;
  /** Extra class of the popup. Not used in `inline`. */
  popupClassName?: string;
  /** Moves the popup by `[x, y]` px. Not used in `inline`. */
  popupOffset?: readonly [number, number];
  /** Color theme of the popup of this submenu. Default: the theme of the menu. */
  theme?: MenuTheme;
  /** Called when the title is clicked or activated by the keyboard. */
  ontitleclick?: (info: MenuTitleClickInfo) => void;
  /** Replaces the content of the popup of this submenu (the menu-level `popupRender` is the default). */
  popupRender?: Snippet<[MenuPopupInfo]>;
  class?: string;
}

/** A title with items under it. It is not interactive. */
export interface MenuGroupType {
  type: 'group';
  key?: string;
  label?: MenuContent;
  children: ReadonlyArray<MenuItemType | MenuDividerType>;
  class?: string;
}

/** A line between items. */
export interface MenuDividerType {
  type: 'divider';
  key?: string;
  dashed?: boolean;
}

export type MenuItemEntry = MenuItemType | MenuSubMenuType | MenuGroupType | MenuDividerType;

export type MenuItems = ReadonlyArray<MenuItemEntry>;

/** What the click callback gets. `keyPath` goes from the item up to the outermost submenu. */
export interface MenuClickInfo {
  key: string;
  keyPath: string[];
  /** The native event: a click, or the key press that chose the item. */
  domEvent: MouseEvent | KeyboardEvent;
  /** The item object, or the one made from the props of a `MenuItem`. */
  itemData: MenuItemType;
}

/** What the select and deselect callbacks get. */
export interface MenuSelectInfo extends MenuClickInfo {
  selectedKeys: string[];
}

export interface MenuTitleClickInfo {
  key: string;
  domEvent: MouseEvent | KeyboardEvent;
}

/** What the `expandIcon` snippet gets. */
export interface MenuExpandIconInfo {
  isSubMenu: boolean;
  /** The submenu is open (expanded, or its popup is shown). */
  open: boolean;
  disabled: boolean;
  key: string;
}

/** What the `popupRender` snippet gets. `children` is the content of the popup: render it where it should go. */
export interface MenuPopupInfo {
  /** The submenu the popup belongs to, or `null` for the popup of the "…" item of a horizontal menu. */
  item: MenuSubMenuType | null;
  /** The keys from the outermost submenu to this one (empty for the "…" popup). */
  keys: string[];
  children: Snippet;
}

/** The tip of an item of a collapsed menu. The Tooltip props that make sense without a `title`. */
export interface MenuTooltipProps {
  placement?: PopupPlacement;
  arrow?: PopupArrow;
  /** Delay before it shows, in seconds. */
  mouseEnterDelay?: number;
  /** Delay before it hides, in seconds. */
  mouseLeaveDelay?: number;
  autoAdjustOverflow?: boolean;
  zIndex?: number;
  classNames?: Partial<Record<'root' | 'container' | 'arrow', string>>;
  styles?: Partial<Record<'root' | 'container' | 'arrow', SemanticStyle>>;
}

/** The named parts of a submenu. */
export type MenuSubMenuSemanticName = 'itemTitle' | 'list' | 'item' | 'itemIcon' | 'itemContent';

/** The named parts that `classNames` and `styles` address (the "Semantic DOM" of Ant Design). */
export type MenuSemanticName = 'root' | 'item' | 'itemIcon' | 'itemContent' | 'popup';

export type MenuClassNames = Partial<Record<MenuSemanticName, string>> & {
  subMenu?: Partial<Record<MenuSubMenuSemanticName, string>>;
};

export type MenuStyles = Partial<Record<MenuSemanticName, SemanticStyle>> & {
  subMenu?: Partial<Record<MenuSubMenuSemanticName, SemanticStyle>>;
};

export interface MenuProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children' | 'onclick' | 'onselect' | 'class' | 'style'> {
  items?: MenuItems;
  mode?: MenuMode;
  theme?: MenuTheme;
  selectedKeys?: string[];
  openKeys?: string[];
  multiple?: boolean;
  selectable?: boolean;
  inlineCollapsed?: boolean;
  inlineIndent?: number;
  forceSubMenuRender?: boolean;
  overflowedIndicator?: string | Snippet;
  overflowLabel?: string;
  subMenuOpenDelay?: number;
  subMenuCloseDelay?: number;
  triggerSubMenuAction?: MenuTriggerAction;
  expandIcon?: Snippet<[MenuExpandIconInfo]>;
  tooltip?: false | MenuTooltipProps;
  classNames?: MenuClassNames;
  styles?: MenuStyles;
  popupRender?: Snippet<[MenuPopupInfo]>;
  onclick?: (info: MenuClickInfo) => void;
  onselect?: (info: MenuSelectInfo) => void;
  ondeselect?: (info: MenuSelectInfo) => void;
  onopenchange?: (openKeys: string[]) => void;
  /** The markup components (`MenuItem`, `MenuSubMenu`, `MenuItemGroup`, `MenuDivider`). Ignored when `items` is not empty. */
  children?: Snippet;
  class?: string;
  style?: string;
}

export interface MenuItemProps {
  key: string;
  label?: MenuContent;
  icon?: string | Snippet;
  title?: string;
  extra?: MenuContent;
  disabled?: boolean;
  danger?: boolean;
  class?: string;
  /** The label, when `label` is not given. */
  children?: Snippet;
}

export interface MenuSubMenuProps {
  key: string;
  label?: MenuContent;
  icon?: string | Snippet;
  disabled?: boolean;
  popupClassName?: string;
  popupOffset?: readonly [number, number];
  theme?: MenuTheme;
  ontitleclick?: (info: MenuTitleClickInfo) => void;
  popupRender?: Snippet<[MenuPopupInfo]>;
  class?: string;
  children?: Snippet;
}

export interface MenuItemGroupProps {
  label?: MenuContent;
  class?: string;
  children?: Snippet;
}

export interface MenuDividerProps {
  dashed?: boolean;
}
