# Menu specification

Status: **agreed, workflow stage 2 is done (2026-11-16).** D1 to D3 were answered by the maintainer (D1: `items` **and**
markup components; D2: APG menubar and menu with `menuitemradio` / `menuitemcheckbox`; D3: `classNames`, `styles` and
`popupRender`) and P1 to P15 were accepted in one answer (see "Решения для владельца"). Implemented, tested and given a
page on 2026-11-17 (see "Implementation notes"); the quality matrix is filled in. The component sits on the internal popup primitive ([popup.md](popup.md), released in 0.5.0):
placement, flip, shift, layers, Escape, outside press, hover bridge, motion and right-to-left are not repeated here.

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers, package manifests and black-box observation of the public demos
(CLAUDE.md sections 2, 4a and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/menu> (`components/menu/index.en-US.md`: documentation text) | 6.7.1 (changelog head), 2026-11-16 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/menu/en> (`components/menu/doc/index.en-US.md`: documentation text) | 22.2.0 (2026-11-04), 2026-11-16 |
| Ant Design Vue | `components/menu/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-16 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-16 |
| Issue trackers | React 10095, 32902, 53707, 58980 (read through the GitHub API, code removed from comments) | 2026-11-16 |
| Black-box | the public demos of React (Top Navigation, Inline, Collapsed inline, Vertical) and Angular (Inline), Chromium 158 under Playwright, 2026-11-16 (results below). The Vue demos did not render in the automated browser; only the site's own header menu was seen | |
| Token table, semantic parts | the "Design Token" table and the "Semantic DOM" list of the public React page | 2026-11-16 |

## What it is

A **Menu** is a list of choices for navigation: a top bar (`horizontal`), a side list (`vertical`, submenus open in a
popup) or a side list that expands in place (`inline`, optionally collapsed to icons). An item is a leaf the user
chooses, a submenu that holds more items, a group with a title, or a divider. It is **not** a Dropdown (a menu that opens
from a button; a later component that will put this Menu inside a popup), not Tabs and not a Select. All three Ant Design
pages describe the same job: site navigation, top and side.

## Parts and elements

DOM (the roles are decision D2, option A, taken). Popup submenus are created on the first opening and moved to
`document.body` by the primitive; inline submenus stay in place.

```
<ul class="ads-menu ads-menu-{mode} ads-menu-{theme}" role="menu | menubar" aria-orientation>   root (the consumer's rest props)
  <li role="none">
    <div class="ads-menu-item" role="menuitem | menuitemradio | menuitemcheckbox" tabindex="0 | -1">
      <span class="ads-menu-item-icon" aria-hidden="true">{icon}</span>
      <span class="ads-menu-item-content">{label}</span>
      <span class="ads-menu-item-extra">{extra}</span>                                          item
    </div>
  </li>
  <li role="none" class="ads-menu-submenu">
    <div class="ads-menu-submenu-title" role="menuitem" aria-haspopup="menu" aria-expanded aria-controls>   submenu title
      …icon, label, <span class="ads-menu-expand-icon" aria-hidden="true">…</span>
    </div>
    <ul role="menu" class="ads-menu-sub">…</ul>      inline: here, animated height. vertical, horizontal, collapsed: in the popup
  </li>
  <li role="none"><div class="ads-menu-group-title" id="…">{label}</div><ul role="group" aria-labelledby="…">…</ul></li>
  <li role="separator" class="ads-menu-divider"></li>
</ul>
<!-- popup submenus, in the container, after the first opening -->
<div class="ads-popup ads-popup-dropdown"><div class="ads-popup-frame ads-menu-popup ads-menu-{theme}"><ul role="menu">…</ul></div></div>
```

The named parts of `classNames` and `styles` (decision D3) are the ten of the React "Semantic DOM" list: `root`, `item`,
`itemIcon`, `itemContent`, `popup` (no effect in inline mode), `subMenu.itemTitle`, `subMenu.list`, `subMenu.item`,
`subMenu.itemIcon`, `subMenu.itemContent`.

## API

Names follow React (the reference, CLAUDE.md section 5a); callbacks are lower case as in Select and Tooltip. The Svelte
type is in the second column.

### Menu

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `items` | `MenuItems` (an array of `MenuItemType \| MenuSubMenuType \| MenuGroupType \| MenuDividerType`) | `[]` | The content. The markup components below write the same tree (D1, taken); with a non-empty `items` the markup children are ignored (P15, the Select rule). |
| `mode` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | |
| `theme` | `'light' \| 'dark'` | `'light'` | The page theme (`data-theme`) is separate: the light menu follows it, the dark menu is the dark blue of Ant Design in both. |
| `selectedKeys` | `string[]` (`$bindable`) | `[]` | `bind:selectedKeys` for controlled use; a plain `selectedKeys={x}` is the initial value (the Switch, Select and Tooltip rule). No `defaultSelectedKeys` (P3). |
| `openKeys` | `string[]` (`$bindable`) | `[]` | The submenus that are open: expanded in `inline`, a shown popup otherwise. No `defaultOpenKeys` (P3). |
| `multiple` | `boolean` | `false` | A click on a selected item deselects it. |
| `selectable` | `boolean` | `true` | `false`: nothing is ever selected (an action menu); `selectedKeys` is ignored. |
| `inlineCollapsed` | `boolean` | — | Only `mode="inline"`: the menu narrows to the collapsed width and shows icons only. Ignored in the other modes. |
| `inlineIndent` | `number` (px) | `24` | Indent of each level in `inline`. |
| `forceSubMenuRender` | `boolean` | `false` | Mounts popup submenus before the first opening (hidden). |
| `overflowedIndicator` | `string \| Snippet` | an ellipsis icon | The "…" item of a horizontal menu that does not fit. |
| `overflowLabel` | `string` | `'More'` | Accessible name of the "…" item. Ours, additive (P6). |
| `subMenuOpenDelay` | `number` (seconds) | `0` | |
| `subMenuCloseDelay` | `number` (seconds) | `0.1` | |
| `triggerSubMenuAction` | `'hover' \| 'click'` | `'hover'` | In popup modes. Keyboard and touch always work (see A11y). |
| `expandIcon` | `Snippet<[MenuExpandIconInfo]>` | an arrow | React 4.9.0. The info: `isSubMenu`, `open`, `disabled`, `key`. |
| `tooltip` | `false \| MenuTooltipProps` | — | React 6.3.0. The tip of a collapsed item; `false` turns it off. `MenuTooltipProps` takes the Tooltip props `placement`, `arrow`, `mouseEnterDelay`, `mouseLeaveDelay`, `autoAdjustOverflow`, `zIndex`, `classNames` and `styles` (`color` is not taken: the presets and the automatic text color belong to the Tooltip). P9. |
| `classNames` | nested object of strings | — | The ten parts of "Parts and elements" (D3, taken). |
| `styles` | nested object of style objects | — | The same parts; objects only (D3, taken). |
| `popupRender` | `Snippet<[MenuPopupInfo]>` | — | React. Wraps the content of a popup submenu; the info holds the submenu item, the key path and `children` (the node to wrap). Not used in `inline`. D3, taken. |
| `onclick` | `(info: MenuClickInfo) => void` | — | An item was chosen by a click or by Enter or Space. A disabled item never calls it. |
| `onselect` | `(info: MenuSelectInfo) => void` | — | A selected item was added to `selectedKeys` by the user. |
| `ondeselect` | `(info: MenuSelectInfo) => void` | — | Only with `multiple`. |
| `onopenchange` | `(openKeys: string[]) => void` | — | The user opened or closed submenus (not a change made by the parent). |
| rest | `HTMLAttributes<HTMLUListElement>` | — | `class`, `style`, `aria-label`, `aria-labelledby`, `id` and the rest go to the root. Menu needs a name: the page says so. |

`MenuClickInfo = { key, keyPath, domEvent, itemData }`: `keyPath` goes from the item up to the outermost submenu (React),
`domEvent` is the native `MouseEvent` or `KeyboardEvent`, `itemData` is the item object (React 6.5.0). `MenuSelectInfo` adds
`selectedKeys`. P4.

### Item types (React names, Svelte value forms)

| Type | Fields |
|---|---|
| `MenuItemType` | `key: string`, `label: string \| number \| Snippet`, `icon?: string \| Snippet`, `title?: string` (text of the tip of a collapsed item), `extra?: string \| number \| Snippet` (React 5.21.0), `disabled?`, `danger?`, `type?: 'item'` |
| `MenuSubMenuType` | `key`, `label`, `icon`, `children: MenuItems`, `disabled`, `popupClassName?: string`, `popupOffset?: [number, number]`, `theme?: 'light' \| 'dark'` (inherits), `ontitleclick?: (info: { key, domEvent }) => void`, `popupRender?` (D3, taken) |
| `MenuGroupType` | `type: 'group'`, `label`, `children: (MenuItemType \| MenuDividerType)[]`, `key?` |
| `MenuDividerType` | `type: 'divider'`, `dashed?: boolean` |

### Markup components (D1, taken)

Written as children of `Menu`; they give the same tree as `items` and are named like the Select ones (`SelectOption`,
`SelectOptGroup`). They register through a context while they are created (so a server render has them), in the order
of the markup, also after `{#each}` or `{#if}` inserts, removes or moves one (the Select rule, recorded in
`specs/select.md`); nested components register with the nearest `MenuSubMenu` or `MenuItemGroup`. Vue and Angular have
this form; React's API table does not.

| Component | Props |
|---|---|
| `MenuItem` | `key`, `label?: string \| number \| Snippet` (else `children`, a Snippet, is the label), `icon?`, `title?`, `extra?`, `disabled?`, `danger?`, `class?` |
| `MenuSubMenu` | `key`, `label`, `icon?`, `disabled?`, `popupClassName?`, `popupOffset?`, `theme?`, `ontitleclick?`, `popupRender?`, `class?`, `children: Snippet` (items, groups, dividers, submenus) |
| `MenuItemGroup` | `label`, `class?`, `children: Snippet` (items and dividers) |
| `MenuDivider` | `dashed?` |

The object types keep the names `MenuItemType`, `MenuSubMenuType`, `MenuGroupType`, `MenuDividerType`: a component and an
interface cannot share a name in one module (the reason Select's option type is `SelectOptionItem`).

Methods: none in v1.0. `focus()` (to put focus on the first item, which a Dropdown will need) is reserved for v1.1,
additive.

## Behavior

- **Modes.** `vertical`: a column; a submenu opens in a popup to the right (`rightTop`), nested ones too, flipping to
  the left at the edge. `horizontal`: a row; a top-level submenu opens below its item (`bottomLeft`), nested ones to
  the right. `inline`: a column; a submenu expands in place, each level indented by `inlineIndent`, the arrow turns,
  the height animates.
- **Selection.** A click on a selectable item adds its key to `selectedKeys`; without `multiple` it replaces the
  previous one and a second click keeps it; with `multiple` a click toggles. The title of a submenu that holds the
  selected item gets the selected color (React `subMenuItemSelectedColor`), and in `horizontal` the selected top-level item
  shows a 2 px bar below it. This is derived from `items` and `selectedKeys`, so items that load later update it
  (React 6.7.0 fixed exactly this). Keys that match no item are ignored and not removed from the bound array.
- **Opening a submenu.** In popup modes the popup opens on hover after `subMenuOpenDelay` and closes `subMenuCloseDelay`
  after the pointer leaves both the title and the popup (the hover bridge; React fixed the pointer crossing the gap in
  6.6.2, #59088). `triggerSubMenuAction="click"` opens it on a click on the title (a second click closes it). On touch a
  tap opens it. In `inline`, a click on the title toggles it. A disabled submenu does nothing.
- **Closing.** Choosing an item closes the whole chain of popups. Escape closes the topmost popup only and returns
  focus to its title (React fixed Escape closing the surrounding popup too, 6.7.0). A press outside closes all. Tab
  leaves the menu and closes the popups. Only one popup per level is open at a time.
- **Collapsed inline.** `inlineCollapsed` narrows the menu to the collapsed width (80 px; 256 → 80 measured on the React
  demo) and hides everything but the icons; a leaf item shows a tip with its `title` (or its label text) on hover and on
  focus (measured: React shows the label); a submenu opens as a popup like in `vertical` (measured). The expanded
  submenus are closed while collapsed and come back when the menu expands again (`openKeys` is emptied while collapsed
  and restored; the keys opened by popups while collapsed are not kept). An item without an icon shows the first
  character of its label in place of the label (a text or number label only; a snippet label shows nothing), which is
  what the Ant Design demos are believed to do (not measured: the public demos all have icons). The tips wait 350 ms
  after a change of `inlineCollapsed`, so a tip does not flash while the width is changing (React #58865).
- **Horizontal overflow.** Items that do not fit the width move into a "…" item at the end, which opens a popup with
  them (including their submenus, which open to the right). The measuring does not flicker (Vue changelog) and
  follows the container (a `ResizeObserver`), so the menu must be allowed to shrink in a flex row (`min-width: 0`;
  the React FAQ says the same). Items that are hidden are out of the tab order and the accessibility tree.
  The "…" popup opens at the "…" item with its right edges aligned (`bottomRight`), not left-aligned as a submenu of a
  bar does: it stands at the far end of the bar.
- **Disabled.** A disabled item or submenu cannot be chosen or opened, is skipped by the arrow keys (measured on the
  React demo) and has `aria-disabled="true"`.
- **Danger.** The danger color for text, hover, selected and pressed states.
- **Group.** A title that is not interactive, then its items; keyboard navigation passes through the group as if its
  items stood in the list. **Divider:** a line, solid or dashed, in every mode (React's page says "vertical popup only";
  its inline demo draws one too, measured).
- **Content changes.** Items added, removed or reordered while open: open popups follow, focus stays on the same key
  or moves to the title if its item is gone. Two items with the same `key` are a mistake: a development warning, the
  first one wins.
- **Empty `items`:** an empty `<ul>` without a role (an empty `menu` is an ARIA error).
- **Long labels** are cut with an ellipsis on one line (NG-ZORRO 8055). A popup taller than the screen scrolls
  (NG-ZORRO 4837).
- **Layout.** Selecting, hovering and focusing never change the size of an item or the position of its neighbors: the
  selected bar of `horizontal` is reserved as a transparent border, the font weight does not change. Opening a popup
  moves nothing (it is out of flow). Expanding an inline submenu and collapsing the menu do change the layout, and
  that is the point of them.
- **Motion.** An inline submenu expands and collapses its height; the collapse narrows the width; popups use the
  primitive's enter and leave. Nothing moves under `prefers-reduced-motion`. React has fixed icons jittering while the
  menu collapses (#59018, #59085, #58271) and a tip flashing when the menu collapses under a hovered item (#58865), so
  a test follows the icons frame by frame, and the tip is held back until the width has settled.
- **Server rendering:** the list renders with all items (no overflow measuring, no popups, no DOM access).
- **Right-to-left:** the arrows, the indent, the popup placement and the selected bar mirror.
- **Nesting:** a Menu inside a popup (a later Dropdown) or inside another Menu's popup works: a press inside counts as
  inside for the layer registry.

## A11y

Contract taken under decisions D2 (option A) and D2b (`menuitemradio` / `menuitemcheckbox`). The reference is the WAI-ARIA Authoring Practices "menubar" and "menu"
patterns plus the observed behavior of the React demo.

- **Roles.** The root is `role="menubar"` with `aria-orientation="horizontal"` for `horizontal` and `role="menu"`
  (vertical) for the other modes; popups and inline sub lists are `role="menu"`. Leaves and submenu titles are
  `menuitem` on a `div` inside `li role="none"` (the shape of the APG example; React issue 32902 shows an axe report on
  the intermediate `none`, the maintainer's answer is that the specification allows it; a test runs axe on it). A
  selectable item is `menuitemradio` (single) or `menuitemcheckbox` (`multiple`) with `aria-checked`, so the selected state
  is spoken; React exposes nothing (measured: the accessibility tree of its demos has no selected state, and the 2018
  issue 10095 explains that `aria-selected` is not allowed on `menuitem`). With `selectable={false}` the role is `menuitem`.
- **Submenus.** The title has `aria-haspopup="menu"`, `aria-expanded` and `aria-controls` with an id of the list. The
  ids come from `$props.id()`, so two menus on a page never share one (React issues 53707 and 53706, fixed in 2026).
- **Names.** Icons are `aria-hidden`: in React the icon's name joins the item's name ("mail Navigation One", measured).
  The "…" item has the name `overflowLabel` (React: "ellipsis", measured). The group title names its group
  (`aria-labelledby`). The root takes `aria-label` or `aria-labelledby` from the consumer.
- **Tab stop.** One for the whole menu, **on an item** (roving `tabindex`: the selected item, else the first enabled
  one, has `0`; the rest `-1`). React puts `tabindex="0"` on the `ul` itself, so Tab lands on "menu" and an arrow press is
  needed to reach the first item (measured on the Top Navigation, Inline and Vertical demos). Shift+Tab and Tab leave the menu from any item.
- **Keys.** Vertical and inline: Up and Down move, Home and End jump, Right opens a submenu and moves into it (vertical,
  popup) or expands it (inline), Left closes it and returns to the title (or from an inline child moves to its title).
  Horizontal: Left and Right move across the bar, Down (and Enter, Space) opens a submenu and focuses its first item,
  Escape closes it and returns to the title; inside the popup Left and Right move to the neighbor top-level item
  (APG menubar; React does nothing there, measured). Enter and Space choose an item or toggle an inline title (React
  toggles only on Enter, measured). A typed character moves to the next item that starts with it. Disabled items are
  skipped (as React). Focus is real focus on the item (as React: the focused element is the `menuitem`).
- **Hover-only popups are not a barrier.** The keyboard and touch open popups whatever `triggerSubMenuAction` says
  (React issue 58980 is about a Dropdown that a keyboard cannot open).
- **Focus visible:** `:focus-visible` outline from the focus tokens, with an offset that is not clipped by the
  scrolling or the `overflow: hidden` of the horizontal bar.
- **Collapsed tips:** a tip on a collapsed item is visual only. The label stays in the accessibility tree (measured in
  React), so the tip must not be read a second time as a description (open item O1).
- **Links in labels.** A `label` that holds an `<a>` makes the whole row the click target (the link stretches over the
  item). Whether a link is the item itself (`menuitem` on the `<a>`, an `href` field) is reserved for v1.1; see D2.
- **Contrast.** See "Colors, tokens and sizes": three Ant Design defaults do not reach 4.5:1 and are handled by
  `tokens-accessible.css` (P1).

## Colors, tokens and sizes

Defaults are the values of the public "Design Token" table of the React page (2026-11-16), written as `--ads-menu-*`
tokens that point at the global tokens where the value is the same, so `tokens-accessible.css` and the dark theme carry
through. Contrast measured on 2026-11-16 (WCAG, text on its background):

| Pair | Default | With `tokens-accessible.css` or the dark-page value |
|---|---|---|
| item text `rgba(0,0,0,0.88)` on white | 16.56 | same |
| item text on hover `rgba(0,0,0,0.06)` | 14.79 | same |
| selected `#1677ff` on `#e6f4ff` | **3.66** | `#1668dc`: 4.63 |
| horizontal selected `#1677ff` on white | **4.10** | `#1668dc`: 5.19 |
| group title `rgba(0,0,0,0.45)` on white | **3.35** | `rgba(0,0,0,0.65)`: 6.98 |
| danger `#ff4d4f` on white / on `#fff2f0` (selected) / on hover | **3.27 / 2.99 / 2.86** | `#cf1322`: 5.57 / 5.10 / 4.88 |
| dark menu item `rgba(255,255,255,0.65)` on `#001529` | 8.13 | same |
| dark menu selected `#fff` on `#1677ff` | **4.10** | `#1668dc`: 5.19 |
| dark menu danger selected `#fff` on `#ff4d4f` | **3.27** | `#d9363e`: 4.62 |
| disabled `rgba(0,0,0,0.25)` | exempt (inactive control) | |

| Token (ours) | Default | React token |
|---|---|---|
| `--ads-menu-item-height` | 40px | `itemHeight` |
| `--ads-menu-item-margin-block`, `-inline` | 4px, 4px | `itemMarginBlock`, `itemMarginInline` |
| `--ads-menu-item-padding-inline` | 16px | `itemPaddingInline` |
| `--ads-menu-group-item-indent` | 32px | not in the table; measured (2026-11-17): the text of an item of a group starts 32px from the edge of a vertical list or a popup, 16px after its title |
| `--ads-menu-item-radius`, `--ads-menu-submenu-item-radius` | 8px, 4px | `itemBorderRadius`, `subMenuItemBorderRadius` |
| `--ads-menu-icon-size`, `--ads-menu-icon-gap` | 14px, 10px | `iconSize`, `iconMarginInlineEnd` |
| `--ads-menu-collapsed-width`, `--ads-menu-collapsed-icon-size` | 80px, 16px | `collapsedWidth`, `collapsedIconSize` |
| `--ads-menu-bg`, `--ads-menu-popup-bg`, `--ads-menu-submenu-bg` | white, white, `rgba(0,0,0,0.02)` | `itemBg`, `popupBg`, `subMenuItemBg` |
| `--ads-menu-item-color`, `-hover-color`, `-selected-color`, `-disabled-color` | `rgba(0,0,0,0.88)`, same, `#1677ff` (`--ads-color-primary-text`), `rgba(0,0,0,0.25)` | `itemColor`, `itemHoverColor`, `itemSelectedColor`, `itemDisabledColor` |
| `--ads-menu-item-hover-bg`, `-active-bg`, `-selected-bg` | `rgba(0,0,0,0.06)`, `#e6f4ff`, `#e6f4ff` | `itemHoverBg`, `itemActiveBg`, `itemSelectedBg` |
| `--ads-menu-submenu-selected-color` | `#1677ff` | `subMenuItemSelectedColor` |
| `--ads-menu-group-title-color`, `-font-size`, `-line-height` | `rgba(0,0,0,0.45)`, 14px, 1.5714 | `groupTitleColor`, `groupTitleFontSize`, `groupTitleLineHeight` |
| `--ads-menu-danger-color`, `-hover-color`, `-selected-color`, `-selected-bg`, `-active-bg` | `#ff4d4f`, `#ff4d4f`, `#ff4d4f`, `#fff2f0`, `#fff2f0` | `dangerItem*` |
| `--ads-menu-horizontal-line-height`, `-hover-color`, `-selected-color`, `-hover-bg`, `-selected-bg`, `-radius` | 46px, `#1677ff`, `#1677ff`, transparent, transparent, 0 | `horizontal*` |
| `--ads-menu-active-bar-height`, `-width`, `-border-width` | 2px, 0, 1px | `activeBarHeight`, `activeBarWidth`, `activeBarBorderWidth` |
| `--ads-menu-popup-min-width` | 160px | `dropdownWidth` |
| `--ads-menu-dark-bg`, `-item-color`, `-item-hover-color`, `-item-selected-color`, `-item-selected-bg`, `-item-hover-bg`, `-item-disabled-color`, `-submenu-bg`, `-popup-bg`, `-group-title-color`, `-danger-*` | `#001529`, `rgba(255,255,255,0.65)`, `#fff`, `#fff`, `#1677ff`, transparent, `rgba(255,255,255,0.25)`, `#000c17`, `#001529`, `rgba(255,255,255,0.65)`, `#ff4d4f` family | `dark*` |
| z-index | the dropdown layer, 1050 | `zIndexPopup` |

The tokens are written as literal values (not as `var()` of the global tokens), the way Select and Tooltip do, so the
contrast tests can read them; `tokens-accessible.css` overrides the ones that missed. The light menu on a dark page
(`data-theme="dark"`) has values chosen from the dark tokens of Select (`#141414`, `#1f1f1f`, `#111a2c`, white at 88%,
55% and 30%): they are **not measured** on the React dark page (open item O4). Text of the item, group title and font:
14px, the global font tokens. The popups take the offset of 8 px from their title and have no padding of their own: the
items have the margin of 4 px (measured on the React demos, see below).

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue, same semantics):** `items` with items, submenus, groups, dividers; `mode`, `theme`; `selectedKeys`
  and `openKeys` with their change callbacks; `multiple`, `selectable`; `onclick`; `inlineCollapsed`, `inlineIndent`;
  `forceSubMenuRender`; `overflowedIndicator`; `subMenuOpenDelay`, `subMenuCloseDelay`, `triggerSubMenuAction`; the item
  fields `key`, `label`, `icon`, `title`, `disabled`, `danger`; the submenu fields `popupClassName`, `popupOffset`, `theme`,
  `ontitleclick`; the group `label`; the divider `dashed`. Angular has the modes, collapsing, indent, theme, selectable,
  danger, disabled, submenu theme and class, the title click, groups and dividers; it lacks `multiple`, `forceSubMenuRender`, the
  overflow indicator, the delays and the `title` of a collapsed item.
- **Дешёвые React-дополнения (≤ 1 день каждое, оценки):**
  - item `extra` (React 5.21.0): 0.2 day (a right-aligned slot; its ellipsis and tip padding were bugs, #57818, #57823).
  - `expandIcon` (4.9.0): 0.3 day.
  - `tooltip` for a collapsed item (6.3.0): 0.4 day on top of the default tip, which is core behavior of the collapsed
    menu (React and the Collapsed demo show it).
  - `itemData` in the callbacks (6.5.0): 0.1 day.
  - `classNames` and `styles` (6.0.0): on the border (about one day: ten named parts, two of them nested, a popup that
    is created later). **Taken in v1.0 by the maintainer (D3, 2026-11-16).**
  - `popupRender` (menu and submenu level, 6.0.0): on the border (about 0.4 day, but its contract with a Snippet is new:
    `children` is the node to wrap). **Taken in v1.0 by the maintainer (D3, 2026-11-16).**
- **Taken by the maintainer, not React (D1, 2026-11-16):** the markup components `MenuItem`, `MenuSubMenu`,
  `MenuItemGroup`, `MenuDivider` (Vue and Angular have them). About 1.5 days. The recommendation had been `items` only.
- **Зарезервировано на v1.1 (имя и контракт сейчас):**
  - An `href` on an item for navigation menus (the item becomes the link; `aria-current`), additive. See D2.
  - `focus(options)` method, for the Dropdown.
  - `ConfigProvider` settings for Menu (`expandIcon`, `tooltip`, `classNames`, `styles`; React global config); there is
    no ConfigProvider component yet.
  - The function form of `classNames` and `styles`: not planned (compute the object in `$derived`).
- **Не берём (React-only, не подходит для Svelte):** `defaultOpenKeys`, `defaultSelectedKeys` (`$bindable`, P3); the
  function form of `classNames`/`styles`; the twice-rendered children collection of the React FAQ (our items are data).
- **Не берём (Vue/Angular-only):**
  - Vue: numeric keys (`string \| number`; keys are strings here, `String(id)` converts, P2); the `icon` function
    `(item) => VNode` (a Snippet sees its scope); a `title` slot of `Menu.Item` (the label and `title` string cover it);
    the `item` instance in the events (React's `itemData`); `style` as a separate prop (the root takes `style` as any attribute).
  - Angular: `nzMatchRouter`, `nzMatchRouterExact` (router integration; with SvelteKit the consumer derives
    `selectedKeys` from `page.url`); `nzPlacement` of a submenu popup (React and Vue have no such prop; the placement
    is fixed by the mode); per-submenu `nzOpen`, `nzTriggerSubMenuAction` and `nzOpenChange` (`openKeys`, the menu-wide
    `triggerSubMenuAction` and `onopenchange`); `nzSelected` per item (`selectedKeys`); `nzIcon` as an icon name
    string (no icon set; `icon` takes a Snippet or text); `(nzClick)` (`onclick`).

## Расхождения React / Vue / Angular

| Level | React 6.7.1 | Vue (docs, `main`) | Angular 22.2.0 | Our decision |
|---|---|---|---|---|
| **Presence** | `Menu` (`Menu.Item` etc. are not in the API tables; the notes still mention them) | `a-menu` with `a-menu-item`, `a-sub-menu`, `a-menu-item-group`, `a-menu-divider` and `items` | `nz-menu` with `nz-menu-item`, `nz-submenu`, `nz-menu-group`, `nz-menu-divider`; no data form | `Menu` with `items` and the markup components `MenuItem`, `MenuSubMenu`, `MenuItemGroup`, `MenuDivider` (D1) |
| **API: content** | `items` | `items` or markup | markup only | `items` or markup (D1) |
| **API: selection** | `selectedKeys`, `defaultSelectedKeys`, `onSelect`, `onDeselect`, `multiple`, `selectable` | `selectedKeys` (`v-model`), events `select`, `deselect`, `multiple`, `selectable` (defaults removed in Vue 2.0) | `[nzSelected]` per item, `nzSelectable` | `bind:selectedKeys`, `onselect`, `ondeselect`, `multiple`, `selectable` |
| **API: open state** | `openKeys`, `defaultOpenKeys`, `onOpenChange` | `openKeys` (`v-model`), `openChange` | `[nzOpen]` per submenu, `(nzOpenChange)` | `bind:openKeys`, `onopenchange` |
| **API: callbacks** | `onClick({ key, keyPath, domEvent, itemData })` | `click({ item, key, keyPath })` | `(nzClick)`: the item component | React's info (P4) |
| **API: icons and extras** | `icon`, `extra` (5.21.0), `expandIcon` (4.9.0), `overflowedIndicator` | `icon`, `expandIcon` slot, `overflowedIndicator` slot | `nzIcon` name | React's set, as Snippets (P5) |
| **API: collapsed** | `inlineCollapsed`, `title`, `tooltip` (6.3.0) | `inlineCollapsed`, `title` | `nzInlineCollapsed` | React's set |
| **API: popups** | `popupClassName`, `popupOffset`, `popupRender`, delays, `triggerSubMenuAction`, `forceSubMenuRender` | `popupClassName`, `popupOffset`, delays, `triggerSubMenuAction`, `forceSubMenuRender` | `nzPlacement`, `nzMenuClassName`, `nzTriggerSubMenuAction` | React ∩ Vue, plus `popupRender` (D3) |
| **API: keys** | `string` | `string \| number` | — | `string` (P2) |
| **Behavior: horizontal overflow** | "…" item, responsive | the same (a flicker fix in the changelog) | an overflow fix only (menu overflow detection) | the "…" item |
| **Behavior: hover into the popup** | stays open (bug fixed in 6.6.2) | not measured | not measured | stays open |
| **Behavior: Escape** | closes a popup, returns focus (measured; nested bug fixed in 6.7.0) | not measured | not measured | closes the topmost, returns focus |
| **Behavior: collapsed** | 256 → 80, tips on leaves, popup submenus (measured) | not measured | `nzInlineCollapsed`; collapses with a Sider | the same as React |
| **a11y: roles** | `menu` root (all modes), `menuitem`; no selected state (measured) | `menu`, `menuitem` seen on the site header | none: `list`, `listitem` (measured on the Inline demo) | menubar / menu, `menuitemradio` and `menuitemcheckbox` for selectable items (D2) |
| **a11y: tab and arrows** | one stop on the `ul`, arrows move real focus (measured) | links are separate tab stops in the header menu (measured); demos not reached | none | one stop on an item (roving), arrows, Home, End, typeahead |
| **a11y: names** | icon name joins the item's name; "…" is named "ellipsis" (measured) | not measured | — | icons hidden; "…" named by `overflowLabel` |
| **Customization** | `classNames`, `styles` (6.0.0), objects or functions; global config | `popupClassName` | `nzMenuClassName` | `classNames`, `styles` (nested objects), `popupClassName` (D3) |

## Value forms per prop (CLAUDE.md section 5, item 4)

| Prop | React | Vue | Angular | Our type | Narrowing |
|---|---|---|---|---|---|
| `items` | `ItemType[]` | `ItemType[]` | — (markup) | `MenuItems`, or the markup components | none: both the data form (React, Vue) and the markup form (Vue, Angular) are taken (D1) |
| `key` | `string` | `string \| number` | — | `string` | numbers (Vue): not taken, P2 |
| `label` | `ReactNode` | `VueNode` | `nzTitle`: `string \| TemplateRef` | `string \| number \| Snippet` | none |
| `icon` | `ReactNode` | `VueNode \| (item) => VNode` | `nzIcon`: `string` (a name) | `string \| Snippet` | the function (Vue) and the icon name (Angular): not taken, no icon set |
| `extra` | `ReactNode` | — | — | `string \| number \| Snippet` | none |
| `title` | `string` | `string` (a slot on `Menu.Item`) | — | `string` | the slot: not taken |
| `expandIcon` | `ReactNode \| (props) => ReactNode` | a slot | — | `Snippet<[info]>` | the plain node form is covered by a Snippet |
| `overflowedIndicator` | `ReactNode` | slot | — | `string \| Snippet` | none |
| `selectedKeys`, `openKeys` | `string[]` | `(string \| number)[]` | booleans per item | `string[]` | numbers: P2 |
| delays | `number`, seconds | `number`, seconds | — | `number`, seconds | none |
| `popupOffset` | `[number, number]` | `[number, number]` | — | `[number, number]` | none |
| `tooltip` | `false \| TooltipProps` | — | — | `false \| MenuTooltipProps` (the Tooltip props that make sense without `title`, `children`, `open`, `anchor`) | none |
| `classNames`, `styles` | object or function | — | — | nested object | the function form: not taken |
| callbacks' info | object with `domEvent` | object with `item` | the component | `{ key, keyPath, domEvent, itemData }` | `item` instance: not taken |
| `mode`, `theme`, `triggerSubMenuAction` | string unions | the same | the same plus per submenu | the same | none |

## Deprecation check (rule 4a)

React 6.7.1 page and changelog, Vue docs and changelog, NG-ZORRO changelog. Names that are deprecated or renamed are
**not taken**; the current name is.

| Old name | Where | Current name | In our API |
|---|---|---|---|
| `Menu.Item`, `Menu.SubMenu`, `Menu.ItemGroup`, `Menu.Divider` as children | React: the API table documents `items` only (added in 4.20.0); the developer notes and the FAQ still mention markup children and the page has no deprecation mark, so this is **not** a recorded deprecation; Vue and Angular document markup | `items` | `items` and the markup components (D1, taken) |
| `defaultSelectedKeys`, `defaultOpenKeys` | React (listed), Vue (removed in the 2.0 refactor: "Menu removes `defaultOpenKeys` and `defaultSelectedKeys`") | `v-model` / `$bindable` | not taken (P3) |
| `popupClassName` | React and Vue, on the submenu: not flagged; React 6.0 adds `classNames.popup` for the whole menu | both live | `popupClassName` on a submenu; `classNames.popup` for the whole menu (D3) |
| `NzIsMenuInsideDropDownToken` and other renamed exports | Angular 22.1 (#9860), deprecated aliases | internal | nothing |

No chain of renames applies to Menu props.

## Public traces turned into items (rule 7a)

| Trace | What it says | Item here |
|---|---|---|
| React 10095, closed (2018) | `aria-selected` on `menuitem` is invalid; a role on the `li` instead of the link | no `aria-selected`; D2 on selected state and links |
| React 32902, closed (2021) | axe `aria-required-parent`: a `menuitem` inside `role="none"` inside a `menu` | the APG shape, axe test on every mode (A11y) |
| React 53707 and 53706, closed; fixed in 6.6.2 (#59048, 2026-08-28) | every Menu instance generated the same popup ids (`rc-menu-uuid-…-popup`) | ids from `$props.id()`; test with two menus |
| React 58980, open (2026-08) | focus never enters an open Dropdown menu; hover Dropdown cannot be opened by keyboard | the keyboard opens popups in any trigger mode; `focus()` reserved |
| React changelog 6.7.0 (#59786, with rc-menu 895 and 899) | selected styling of the parent did not update after items loaded dynamically; Escape in a submenu also closed the surrounding popup | derived selected state; Escape closes the topmost layer only |
| React changelog 6.6.2 (#59048, #59088, #59085) | duplicate popup ids; horizontal submenu closed when the pointer went from item to popup; icons kept moving after the collapse ended | see above; hover bridge test; icon frames test |
| React changelog 6.6.1 (#59018, #58865), 6.4.4 (#58271) | icons jittered while the inline menu expanded or collapsed; the tip flashed when the menu collapsed under a hovered item | frame-by-frame test; the tip waits for the width |
| React changelog (#57818, #57823, #57360, #57374) | `extra` layout with icons, `extra` ellipsis and tip padding; collapsed icon size and parent hover color customization | tests for `extra` next to an icon and a long label; tokens for the sizes |
| React changelog 6.5.0 (#58197), 6.0.0 (#53566) | `itemData` in the callbacks; `popupRender` | in the API, with `popupRender` (D3) |
| Vue changelog | "Menu lazy loading (SubMenu must have a key)"; "optimize animation after overflow to avoid flickering"; "Menu hidden animation loss"; dark theme lost after overflow | the key is required; no flicker test; the overflow popup keeps `theme` |
| NG-ZORRO 4837 and 5155 | a tall submenu popup is not scrollable | the popup scrolls (test) |
| NG-ZORRO 8055, 3412, 4227 | ellipsis for long titles; overflow detection | ellipsis test; overflow tests |
| NG-ZORRO 6408 | memory leak in menu (and others) | a test that unmounting removes the observers and the popups |
| NG-ZORRO 3455 | a submenu stayed highlighted | tests of the selected parent |

## Black-box observations (2026-11-16)

Public demos, Chromium 158 under Playwright, keyboard from a button placed before the demo. Not code: the accessibility
tree, attributes, focus and geometry, as the rules allow (section 2).

| What | React 6.7.1 | Angular 22.2.0 (Inline demo) |
|---|---|---|
| Accessibility tree | `menu` > `menuitem` (a submenu title has `[expanded]`, a disabled item `[disabled]`), `group`, `separator`; the icon is an `img` and its name joins the item's name; no selected state | `list` > `listitem`; icons are `img "mail"`; no menu roles |
| Tab | the first Tab lands on the root `ul` (`role=menu`, `tabindex=0`); items have `tabindex=-1`; a second Tab leaves (one stop). A link item adds a second stop for its `<a>` | the items were not reached in six Tab presses |
| Down, Up (inline, vertical) | focus moves to the next and previous item, entering expanded submenus | none |
| Right, Left (horizontal bar) | move across the top items; a disabled item is skipped | none |
| Down on a submenu title (bar) | opens the popup and focuses its first item | none |
| Right on a submenu title (vertical) | opens the popup and focuses its first item; Left closes it and returns to the title | none |
| Right inside a bar popup | nothing | none |
| Home, End | first and last item of the list the focus is in | none |
| Enter on an inline submenu title | toggles it (true, false, true) | none |
| Space on an inline submenu title | no change | none |
| Enter on an item | selects it (the selected class appears) | none |
| Escape | closes a popup and returns focus to its title; nothing in an inline menu | none |
| "…" item (overflow) | `menuitem "ellipsis"` in the tree; the fourth item of the Top Navigation demo moved into it at the demo's width | none |
| Collapsed inline | width 256 → 80; the leaf's hover tip is its label; a submenu opens a popup; the labels stay in the tree | `nzInlineCollapsed` not driven |

Vue: the antdv.com header menu is `menu` > `menuitem` > `link` and every link is a Tab stop (a different model from the
React demo); the demo menus did not render in the automated browser, so Vue's behavior beyond its documentation is **not
measured**.

## Black-box observations, geometry (2026-11-17)

Public React demos, Chromium 158 under Playwright, computed styles and rectangles (rule 2). Used for the sizes.

| What | React 6.7.1 | Ours |
|---|---|---|
| Inline item | 40px high, margin 4px, padding-left 24px (indent), 34px right (room for the arrow), radius 8px | the same sizes; the arrow is an icon in the row |
| Gap between two items | 4px (the margins of neighbors are one) | 4px |
| Root of `inline`, `vertical` | border at the end, 1px `rgba(5, 5, 5, 0.06)` | the same |
| Bar | 46px high with its 1px border; the items are 46px with `margin-top: -1px`, padding 16px, radius 0 | the same |
| Vertical popup | its box starts about 8px beside the title (7.3px measured), top aligned with the title; `min-width` 160px; no padding on the list, items have the margin 4px (first item 4px from the top) | offset 8px, `rightTop`, `min-width` 160px, no padding on the list |
| Bar popup | 8px below the title, left edges aligned, **as wide as the title at least** | offset 8px, `bottomLeft`, `matchWidth` of the primitive |
| Collapsed width | 80px | 80px |

### Groups: where the title and the items start (measured 2026-11-17, on the maintainer's remark)

The maintainer saw on the page that the title of a group stood left of its items ("Danger zone", "Beta"). Measured on the public
React demos (Chromium, geometry only):

| List | Title of the group | Items of the group |
|---|---|---|
| inline | margin 4px, padding of its level (36px in the demo with a custom indent) | margin 4px, padding of its level: **the same start as the title** |
| vertical list or popup | padding 16px, no margin | margin 4px, padding 28px: the text starts 32px from the edge, **16px after the title** |

Ours before this change: a title with a fixed padding of 16px and items at 4px plus the indent of their level inline (the title
12px left of the items at the first level, 36px at the second), and items at 4px plus 16px in a popup (4px after the title). Taken
(the maintainer, 2026-11-17, both points): **inline, the title takes the margin and the padding of the indent of its level**, as
the items do; **in a vertical list or a popup the items of a group start at `--ads-menu-group-item-indent` (32px) from the edge**
(the title keeps 16px). The items take the second as their start padding through `--ads-menu-pad-start`, so the bar of forced colors
(3px) still comes off the padding and choosing an item moves no text. A group in a bar (a row) is not changed. Tests:
`e2e/menu.spec.ts`, "groups: where the title and the items start" and the forced-colors one (each fails without the CSS).

## Dependencies

Added on 2026-11-17: rule 6b and step 0 of the workflow (`ai/dependencies.md`) were written while this component was already
built, so the analysis is done after the fact, against `origin/main` at `f1c68ba` (0.9.0).

- **Components: none.** The plan says Menu takes no component, and none is imported. The tip of a collapsed item is not the
  `Tooltip` component: it is `MenuTip.svelte`, built on the primitive `popup`, as the plan records. The reasons are in "Behavior":
  the tips wait 350 ms while the width is still changing, they take no `aria-describedby` (the label is the name of the item
  already), and the placement and the delays follow the Menu, not the props of a `Tooltip`.
- **Primitive `popup`: used, and extended.** `internal/popup/Popup.svelte` and `popupTriggers` carry every popup of the Menu
  (submenus, the "…" item, the tips). Two additive props were added for it, `shift` (the `popupOffset` of a submenu) and
  `forceMount` (`forceSubMenuRender`); they are described in `specs/popup.md` ("Added for the Menu") and change nothing for
  Select and Tooltip.
- **Primitive `portal`: not used as a module.** It lives inside `Popup.svelte`, which is where the Menu gets it.
- **Primitive `anim`: not available as a module, and not needed.** The Menu animates with CSS only: the height of an inline
  submenu (`grid-template-rows` from `0fr` to `1fr`) and the width of a collapsed menu (`width` as a length). There is no
  JavaScript animation to share.
- **Primitive `overflow`: not in `main`.** The plan lists it for the horizontal Menu, Tabs and the tags of Select. The measuring
  (a `ResizeObserver` on the bar and on each entry, the number of entries that fit, the hidden entries kept in the row so that
  their width is known, the "…" item) is written inside `Menu.svelte`. Nothing was copied: no other component measures like this
  (`Select` does not). Rule 6b says to stop and ask when a primitive is missing and not to create one silently in a branch;
  this was not asked in time, so it is recorded here and was raised with the maintainer. **Decision (the maintainer, 2026-11-17):
  A.** The measuring stays in `Menu.svelte`, and it is extracted to `internal/overflow` **before Tabs is written**, which is the
  second consumer (rule 6b, "extract before the second consumer"); the Dependencies section of Tabs must say so. B (extract now)
  was offered and not taken. Neither changes a public API.
- **Shared without copies:** `internal/semantic.ts` (`classList`, `styleText`), `internal/options.ts` (`resolveOption`),
  `internal/env.ts` (`isProduction`), and the tokens `--ads-motion-*` and `--ads-focus-*`.
- **What later components take from the Menu:** the recursive list (`MenuList.svelte`) is the "list of the menu, shared with
  the Menu" that the plan gives to Dropdown. It is inside `Menu/`; **it must be moved to `internal/` before Dropdown is
  written** (rule 6b, "extract before the second consumer"), and the Dropdown section of its specification must say so. Layout
  (`Sider`) will pass the collapse to the Menu through the existing `inlineCollapsed` prop; nothing is needed here until Layout
  exists.

## Requirements this puts on the popup primitive

The Menu uses the internal primitive (`src/lib/internal/popup/`, checked against its code on 2026-11-16) for every popup:
the submenus, the "…" overflow popup and the tip of a collapsed item. Nothing new is written for placement, layers,
flip, Escape, outside press, motion or right-to-left. The primitive is internal, so what is added is not public.

**Exists, used as is:** the trigger helper `popupTriggers` (hover, focus, click, context menu; delays in seconds; the
hover bridge between the anchor and the panel; the touch compatibility events; `Escape` and outside press are in the
primitive); the 12 placements with flipping; nested panels count as inside for an outside press (the layer registry);
`rootClass` and `rootStyle` for `classNames.popup` and `styles.popup`; the `dropdown` layer (1050, React `zIndexPopup`).

**Additive changes, small:**
- `offset` as a pair `[x, y]` for `popupOffset` (it takes one number now).
- Hover across nested panels: a child popup is in `document.body`, not inside the parent's panel, so the pointer moving
  from the parent panel into the child fires `mouseleave` on the parent and the helper would start closing it (and the
  child with it). The Menu keeps a parent open while a child of it is open; whether this lives in the Menu or as an
  option of the helper is decided in stage 3 (the Menu is the only user of nesting so far).

**Not in the primitive:** the minimum width (`--ads-menu-popup-min-width`) and the maximum height with scrolling are CSS of
the Menu's own frame class; the primitive does not move focus (Select's list never takes it), the Menu does it on a
keyboard opening and on Escape. The tip of a collapsed item is drawn on the primitive with the Tooltip look and without
the description link (P9); the released Tooltip component does not change.

## Requirements the Menu puts on later components

- **Dropdown:** a Menu inside a popup with `mode="vertical"`, `selectable={false}`; entry by `focus()` (reserved);
  a click on an item closes the Dropdown (the Dropdown reads `onclick`).
- **Layout.Sider:** an `inlineCollapsed` that follows the Sider (Angular does this itself; the Menu takes the prop).

## Решения для владельца

**D1 to D3 were put to the maintainer and answered on 2026-11-16 (answers under each table; the options stay as the
record). P1 to P15 were proposals and were accepted in one answer on 2026-11-17.**

1. **D1. The shape of the content API: `items` only, or `items` and markup components?**

   | | A. `items` only (recommended) | B. `items` and markup components |
   |---|---|---|
   | Usage | `<Menu items={[{ key: 'a', label: 'A' }]} bind:selectedKeys />` | also `<Menu><MenuItem key="a">A</MenuItem><MenuSubMenu key="s" label="S">…</MenuSubMenu></Menu>` |
   | React | the only form in the API table (`items`, 4.20.0); markup children are still mentioned in the developer notes and the FAQ, with no deprecation mark | its props are not documented |
   | Vue | one of two forms | one of two forms |
   | Angular | does not exist | the only form |
   | Precedent here | Button, Switch | Select takes `options` and `SelectOption` / `SelectOptGroup` (registered, then rendered from data) |
   | Extra cost | none | about 1.5 days: registration of nested items (submenus inside submenus, groups), keeping the keyboard order and the horizontal overflow working with items that exist only as markup, a second set of tests and page examples |
   | Reserved | `MenuItem`, `MenuSubMenu`, `MenuItemGroup`, `MenuDivider` for v1.1, additive | now |

   A recommendation: A. React, the reference, documents only the data form in its API table; the data form is the one that keyboard order,
   overflow and popups need anyway; B can be added later without a breaking change.

   **Taken: B, `items` and markup components (2026-11-16), against the recommendation.** Cost about 1.5 days more. The
   Select precedent decides the details: the markup registers in order; with a non-empty `items` the children are
   ignored (P15). Nothing is reserved for v1.1 on this point any more.

2. **D2. The ARIA and keyboard model.** The three libraries use the `menu` role for what is mostly site navigation. The
   WAI-ARIA Authoring Practices say a menu role is for application-style menus and offer "disclosure navigation" (links
   and buttons with `aria-expanded`, all in the Tab order) for site navigation.

   | | A. APG menubar and menu, roving tab stop (recommended) | B. As React | C. Navigation (disclosure) |
   |---|---|---|---|
   | Roles | `menubar` / `menu`, `menuitem`; `menuitemradio` / `menuitemcheckbox` with `aria-checked` for selectable items | `menu` and `menuitem`, nothing for the selected state | `ul` of `a` and `button aria-expanded`; `aria-current="page"` on the chosen link |
   | Tab | one stop, on an item | one stop, on the root (an arrow press needed) | every link and button |
   | Arrows | the APG set plus Home, End, typeahead | Up, Down, Left, Right, Home, End | none (Tab) |
   | Selected state spoken | yes | no (measured) | yes (`aria-current`) |
   | Fits a Dropdown later | yes | yes | no (actions are not links) |
   | Fits SvelteKit links | the `label` holds a link; `href` on an item is v1.1 | the same | native |
   | Cost | the base plan | a little less | a different component, not the Ant Design one |

   Recommendation: A for v1.0, with an `href` item and the navigation role set reserved for v1.1 (additive). Within A,
   the second question is how a selected item is exposed: (i) `menuitemradio` / `menuitemcheckbox` (recommended;
   announces "checked"), (ii) `aria-current="true"` on a plain `menuitem`, (iii) nothing, as React.

   **Taken: A (APG menubar and menu, roving tab stop), and (i) for the selected state (2026-11-16)**, as recommended. An
   `href` item and the navigation role set stay reserved for v1.1.

3. **D3. The customization set.** `classNames` / `styles` (React 6.0.0: ten parts, two nested) are on the border of the
   "cheap" rule (about one day); `popupRender` is about 0.4 day.

   | | Taken in v1.0 |
   |---|---|
   | (a) both, **recommended** | `classNames`, `styles`, `popupRender`; about 1.4 days |
   | (b) `classNames` and `styles` only | `popupRender` reserved for v1.1; about 1 day |
   | (c) neither | both reserved for v1.1 with the contract written; only `popupClassName` of a submenu and the tokens are there |

   **Taken: (a), `classNames`, `styles` and `popupRender` in v1.0 (2026-11-16)**, as recommended.

P1. **Colors.** Defaults as the Ant Design tokens (the table above); `tokens-accessible.css` replaces the five pairs that
   miss 4.5:1 (selected `#1668dc`, group title `-secondary`, danger `-text` and `-solid` of the accessible set, the dark
   menu's selected and danger fills), and the dark-page values are chosen to pass without an override. The visible change
   from React is none by default.
P2. **Keys are `string`.** Vue also takes numbers; `String(id)` converts. A narrowing recorded here.
P3. **No `defaultSelectedKeys` and `defaultOpenKeys`;** `selectedKeys` and `openKeys` are `$bindable`, a plain value is
   the initial one (Switch, Select, Tooltip).
P4. **Callbacks** `onclick`, `onselect`, `ondeselect`, `onopenchange`, `ontitleclick`, with the React info object
   (`{ key, keyPath, domEvent, itemData }`, plus `selectedKeys`); `domEvent` is the native event.
P5. **Value forms:** `label` `string | number | Snippet`; `icon` `string | Snippet`; `extra` the same as `label`;
   `expandIcon` and `overflowedIndicator` Snippets; no icon set in the library.
P6. **`overflowLabel`** (English default `'More'`), because React names the "…" item "ellipsis" and the library has no
   locale system (the pattern of `InputPassword`'s toggle label).
P7. **Disabled items are skipped by the arrows** (as React; the APG allows both); typeahead is included.
P8. **Escape closes the topmost popup and returns focus; Tab leaves and closes;** the keyboard and touch open popups
   whatever `triggerSubMenuAction` says.
P9. **The tip of a collapsed item** is drawn on the popup primitive with the Tooltip look, without a description link, so
   a screen reader does not read the label twice (open item O1); `tooltip` takes `false` or the Tooltip props that apply.
   No change to the released Tooltip.
P10. **Empty `items`** render an empty `ul` without a role.
P11. **Popups go to `document.body`** (React's default); `forceSubMenuRender` mounts them in advance, hidden.
P12. **One popup per level** is open at a time; `openKeys` holds several only in `inline`.
P13. **`inlineCollapsed`** acts in `inline` only; the expanded submenus are remembered and restored when the menu expands.
P14. **Right-to-left** mirrors everything (arrows, indent, popup side, selected bar).
P15. **`items` and markup:** a non-empty `items` wins and the markup children are ignored (the Select rule); a Menu with
   neither renders an empty list (P10). Markup components outside a `Menu` throw a development error.

Open items of stage 3 (not decisions for the maintainer), and what became of them on 2026-11-17: **O1** the tip is
`aria-hidden`, without a description link, and not measured with a real screen reader; **O2** answered in "Behavior"
(first character for a text label); **O3** `onselect` is called only when the selection changes (the React behavior was not
measured); **O4** dark-page values are chosen, not measured (see "Colors"); **O5** the delays are the documented defaults
of React (0 and 0.1 s), the exact timing of the React demo was not measured; **O6** the Vue demos were not measured (they
did not render in the automated browser). Original text: O1, the collapsed tip and the screen reader
(measure what Orca says for the React Menu tip and decide); O2, what an item without an icon shows in a collapsed menu; O3, whether a
second click on the selected item in single mode calls `onselect` in React; O4, dark-page values; O5, the exact hover delays
of the React demo; O6, the Vue demos (a headed browser or the Vue docs build).

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/MenuA11y.test.ts` (axe on every mode and on an open popup: no violations, roles and states of the menu and menubar patterns), `tests/MenuKeyboard.test.ts` (every key of the A11y list) and `e2e/menu.spec.ts` (focus ring, Tab order, real focus). Checked against the menu and menubar patterns of the WAI-ARIA Authoring Practices (read 2026-11-17: roles, `aria-haspopup`, `aria-expanded`, roving focus, arrows, Home, End, Escape, typing a character) |
| Forced colors | test | `e2e/menu.spec.ts` (the forced-colors cases, three engines): the selected item has a bar in a system color and choosing an item moves no text, a popup has a border, the line of a bar is in a system color |
| IME | n/a | a menu has no text input; typeahead ignores keys during a composition (`tests/MenuKeyboard.test.ts`) and a composition is not a menu key |
| Touch | test | `e2e/menu.spec.ts` (emulated touch, three engines: a tap opens a popup, a tap on an item chooses it, a tap outside closes) and `tests/MenuPopup.test.ts` (the compatibility mouse events of a tap). A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit) |
| Browser floor | test | `npm run test:floor`: six Menu checks in Chromium 90, Firefox 85 and WebKit 15.4 (`scripts/floor/smoke.cjs`), and the CSS audit of the page |
| Screen reader | manual pending | not checked with a real screen reader (no `screen-reader/` test for the Menu yet; Orca, NVDA, JAWS and VoiceOver by hand). The page and the README say "not checked" |

## Страница на сайте

`docs/src/routes/[[lang=lang]]/components/menu/+page.svelte`, en, ru, zh, in the standard pattern. The registry entry
`Menu` becomes `now`. Examples, one per item of the specification, each group on its own line with its own state
(rule 6a):

The page has 14 examples, in this order (`docs/src/docs/examples/menu/`, one file each, the same slugs in `data/menu.ts`):
`horizontal` (a bar, a submenu, a disabled item, the "…" overflow, `overflowLabel`), `inline` (`bind:openKeys`,
`bind:selectedKeys`, groups, a divider, `inlineIndent`), `collapsed` (`inlineCollapsed`, the toggle, `tooltip`), `vertical`
(popups, `popupOffset`, `popupClassName`, `ontitleclick`, `triggerSubMenuAction`, the delays, `onopenchange`), `theme`
(`light` and `dark`, a submenu with its own `theme`), `selection` (single, `multiple`, `selectable={false}`, `onselect`,
`ondeselect`, `onclick`), `control` (controlled `openKeys`, "open only the current submenu"), `items` (`extra`, `icon`,
`title`, `disabled`, `danger`, a group, dividers), `content` (snippet `label` and `icon`, `expandIcon`,
`overflowedIndicator`), `switch` (`mode` and `theme` at run time), `force` (`forceSubMenuRender`), `semantic` (`classNames`,
`styles`, `popupRender`), `keyboard`, `markup` (the components, `{#if}` and `{#each}`). The examples have their own state
each, and the three groups of the selection example are independent (a site test).

**Layout of the examples (the maintainer, 2026-11-17): every example takes a whole row** (`wide: true` in `data/menu.ts`, the
class `.demo.wide` of the grid of two columns). The reason: a bar needs the width of the page to show the "…" only when it
should, and a popup that opens to the side needs room beside the menu (in half a column the popup of a bar or of a vertical
menu has no room on its side). The recommendation was to take only the examples with a bar or a side popup and to pair the
others; the maintainer chose the simple rule. The price is empty space to the right of a 256 px menu. A unit test says that no
example of the page is without `wide`; the site test of the order reads the width of a column from the row when every example
is wide. On a phone one column holds them as before.

Honest notes on the page: not checked with a real screen reader; touch not checked on a real device; links inside labels
(v1.1 `href`).

## Implementation notes (2026-11-17)

- **Files.** `src/lib/Menu/`: `Menu.svelte` (state, hover timing, keyboard, overflow, collapsing), `MenuList.svelte` (one list,
  recursive: the root, an inline submenu, a popup; all the CSS), `MenuTip.svelte`, `MenuIcon.svelte`, the four markup components,
  `tree.ts` (items and markup to nodes, keys, focusable keys), `nav.ts` (navigable items, typeahead), `context.ts`, `types.ts`.
- **Attributes beyond the sketch.** `data-ads-key` on every item and title, `data-ads-top` on the entries of a bar, `data-ads-more` on
  the "…" entry. An entry that is hidden (not fitting a bar, a closed inline submenu) has `inert` **and** `data-ads-hidden`:
  `inert` is a property in jsdom and unknown in the browsers of the floor, so the keyboard code reads the attribute.
- **Inline submenus are always in the page**, closed ones hidden by `visibility` and `inert`; the height animates with
  `grid-template-rows` from `0fr` to `1fr` (no animation at Chromium 90, which does not know it; the state is right). So
  `forceSubMenuRender` concerns popups only, which are built at the first opening unless forced (primitive option `forceMount`).
  The inline root has `width: 100%`, so that its collapse to 80px is a transition between two lengths (`auto` cannot be animated).
- **Hover.** One `hovered` key and one timer: every entry or leaving of a title, a list or an item restarts the close delay, and
  when it runs, what the pointer is not in closes. This lets the pointer cross the gap, and go from a popup into a popup of its
  own (a child popup is not inside the parent in the DOM); a title that is open or disabled opens nothing. After a touch the
  compatibility mouse events are ignored for 800 ms (the helper of the primitive does the same for the Tooltip).
- **Direction** is read from the page when a popup opens and on every key, because it can change after the mount.
- **Choosing.** `onselect` is called only when the selection changes (a second click on the selected item in single mode
  calls nothing). An activation by the keyboard in a popup returns focus to the top-level item the popup came from.
- **Forced colors.** The item takes its colors from the system (`forced-color-adjust: none` and system color names): Chromium
  and WebKit paint even a transparent border in the text color when the adjustment is on, which would give every item the bar
  of the selected one (measured, three engines).
- **Not taken.** `color` of `tooltip` (see the API), `class` is accepted on item objects, submenus and groups (not in React;
  Select's options have it).
- **Primitive.** `shift` (the pair of `popupOffset`) and `forceMount` were added to the popup primitive, each with a test
  (`tests/Popup.test.ts`, 2 tests for `shift`). Hover across nested panels needed no change of the trigger helper.
- **Coverage and mutation.** `tests/Menu*.test.ts`: 311 tests, 100% of statements, branches, functions and lines of
  `src/lib/Menu`. Mutation run (2026-11-17, after the fix below): `MenuList.svelte` 129 of 129 mutants killed; `Menu.svelte`
  160 of 171 (94.1%, one more mutant does not compile). The first run, 76.6%, showed that the tests of the collapse used
  `rerender`, which puts the first props back, so they proved nothing, and that the keys the menu claims with `preventDefault`
  were not asserted: both fixed. The 10 survivors are equivalent changes (the first value of a state that an effect overwrites
  at once, the option of an observer that the DOM never needs) or `preventDefault` of secondary branches. `tree.ts` and
  `nav.ts` are plain TypeScript, which the runner does not mutate; they are covered at 100%.
- **A bar entry that did not fit has a twin (2026-11-17, found by the maintainer on the page).** The entries that do not fit
  stay in the row, hidden, to be measured, and the "…" popup shows them again. The hidden entry first opened its own popup
  whenever the same submenu was open from the "…" popup, so the page showed two identical lists, and it also repeated the
  `id` of the title and of the group (`aria-labelledby` and `aria-controls` point at ids). Now a hidden entry is never open,
  mounts no popup and takes no id. Tests: the unit tests "opens one popup, not two" and "the ids of the page stay unique" in
  `tests/MenuOverflow.test.ts` and the browser test in `e2e/menu.spec.ts` (each fails without the fix). The guard in
  `registerList` that was there for two lists with one key was removed: no two lists share a key any more.

## Список тестов

One test at least per item of the specification. The files: `tests/MenuTree.test.ts` (nodes, keys, typeahead, markup
registrations), `tests/Menu.test.ts` (rendering, props, selection, inline, semantic parts, right-to-left),
`tests/MenuPopup.test.ts` (popups, hover timing, touch, closing, popup parts), `tests/MenuKeyboard.test.ts`,
`tests/MenuCollapsed.test.ts`, `tests/MenuOverflow.test.ts`, `tests/MenuMarkup.test.ts`, `tests/MenuServer.test.ts`,
`tests/MenuA11y.test.ts`, `tests/tokens.test.ts` (Menu cases), `tests/docs/menu-page.test.ts`, `e2e/menu.spec.ts` (geometry,
real pointer and keyboard, layout rule, motion frames, right-to-left, forced colors, touch) and the site tests in
`docs/e2e/site.spec.ts`. The items below say what they cover.

- API: each prop and each item field (default, change, invalid), `$bindable` two-way and plain initial value, callbacks (when, arguments, count, not for a
  change made by the parent), snippets for `label`, `icon`, `extra`, `expandIcon`, `overflowedIndicator`, `popupRender`.
- Behavior: the three modes, selection (single, multiple, `selectable` false, derived parent state, unknown keys), opening
  (hover with delays and the bridge, click, touch, one popup per level), closing (item, Escape, outside, Tab), the collapsed menu and
  its tips and popups, horizontal overflow (fit, resize, nested submenus in the "…" popup, no flicker), disabled, danger,
  group, divider, changing items while open, duplicate keys, empty items, long labels, a tall popup, server rendering, right-to-left.
- Markup components (D1): `MenuItem`, `MenuSubMenu`, `MenuItemGroup`, `MenuDivider` give the same tree, keyboard order and
  roles as `items`; the order follows the markup after `{#each}` and `{#if}` insert, remove or move one; nested submenus and
  groups; `items` wins over children (P15); a component outside a `Menu` throws; server rendering has them.
- Layout: selecting, hovering and focusing move nothing (labels of different width, both themes); icons stay still while the menu collapses (frame by frame); no
  tip flash on collapse.
- A11y: roles and states in every mode, axe, unique ids for two menus, roving tab stop, every key of the A11y list, typeahead,
  focus return, focus after items change, icons hidden, the "…" name, forced colors, contrast on the accessible set and on the dark theme.
- Browser: Chromium, Firefox and WebKit; the browser floor.

## Решения и обоснование

Taken on 2026-11-16, one by one:

- **D1, `items` and markup components.** The maintainer chose the wider form. The recommendation was `items` only,
  because React's API table documents only the data form; the weights for the wider form are the Select precedent and
  that Vue and Angular both have the markup form. The cost (about 1.5 days, a second set of tests and a page example) is
  accepted. The order rule and the precedence of `items` follow Select (P15).
- **D2, APG menubar and menu with a roving tab stop; D2b, `menuitemradio` and `menuitemcheckbox`.** As recommended. Two
  measured facts carried it: the React demo puts the Tab stop on the root `ul` and does not expose the selected state
  in the accessibility tree. The navigation (disclosure) model and the `href` item stay reserved for v1.1.
- **D3, `classNames`, `styles` and `popupRender` in v1.0.** As recommended; the other components with semantic parts
  (Tooltip, Input, Select) already have them.

**P1 to P15 were accepted in one answer on 2026-11-17 («Принять все»)**, as written above.

Taken on 2026-11-17, after the page was built: all 14 examples take a whole row (see "Страница на сайте").

Taken on 2026-11-17, after the merge with `main` 0.9.0: the `overflow` primitive stays inside the Menu until Tabs (option A of "Dependencies").

Taken while implementing (2026-11-17), each recorded in "Implementation notes": the "…" popup is right-aligned; the inline
root has `width: 100%`; `onselect` only on a change; the popup offset is 8px with no padding on the list (measured); a bar
popup is as wide as its title; the forced-colors technique; `color` is not part of `MenuTooltipProps`.
