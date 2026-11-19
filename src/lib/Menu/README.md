# Menu

A list of choices for navigation, with Ant Design-inspired styles and a Svelte 5 API: a top bar, a side list whose
submenus open in popups, or a side list that expands in place and collapses to icons. Items are written as data
(`items`) or as markup (`MenuItem`, `MenuSubMenu`, `MenuItemGroup`, `MenuDivider`). Popups use the popup primitive of the
library; the keyboard follows the menu and menubar patterns of the WAI-ARIA Authoring Practices.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Menu, type MenuItems } from 'svelte-ant-design';

  let selectedKeys = $state(['home']);
  const items: MenuItems = [
    { key: 'home', label: 'Home' },
    { key: 'products', label: 'Products', children: [{ key: 'p1', label: 'Product one' }] },
    { type: 'divider' },
    { key: 'help', label: 'Help', disabled: true }
  ];
</script>

<Menu aria-label="Main" mode="inline" {items} bind:selectedKeys />
```

The same menu as markup:

```svelte
<Menu aria-label="Main" mode="inline" bind:selectedKeys>
  <MenuItem key="home">Home</MenuItem>
  <MenuSubMenu key="products" label="Products">
    <MenuItem key="p1">Product one</MenuItem>
  </MenuSubMenu>
  <MenuDivider />
  <MenuItem key="help" disabled>Help</MenuItem>
</Menu>
```

Give the menu a name with `aria-label` or `aria-labelledby`. Icons are text or snippets (the library has no icon set). A
bar follows the width of its container; in a flex row or a grid give the element that holds it `min-width: 0`, so that the
items that do not fit can move into the "…" item. A collapsed inline menu animates when its width is a length: give the
menu a container with a width.

## Props of Menu

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `MenuItems` | `[]` | Items, submenus (an item with `children`), groups (`type: 'group'`) and dividers (`type: 'divider'`). A non-empty `items` wins over markup children. |
| `mode` | `'vertical' \| 'horizontal' \| 'inline'` | `'vertical'` | The type of the menu. A popup that does not fit is flipped to the other side, not moved inside the window: on a very narrow screen use `inline`. |
| `theme` | `'light' \| 'dark'` | `'light'` | The light menu follows the theme of the page; the dark one is the dark blue menu of Ant Design. |
| `selectedKeys` | `string[]` (`$bindable`) | `[]` | Selected items. `bind:selectedKeys`; a plain value is the initial one. |
| `openKeys` | `string[]` (`$bindable`) | `[]` | Open submenus. `bind:openKeys`; a plain value is the initial one. |
| `multiple` | `boolean` | `false` | A click toggles an item. |
| `selectable` | `boolean` | `true` | `false`: nothing is selected (a menu of actions). |
| `inlineCollapsed` | `boolean` | — | Only `inline`: icons only, tips on the items, submenus in popups. |
| `inlineIndent` | `number` | `24` | Indent of each level of an inline menu, in px. |
| `forceSubMenuRender` | `boolean` | `false` | Build the popups before they are first shown (hidden). |
| `overflowedIndicator` | `string \| Snippet` | — | Content of the "…" item of a bar that does not fit. |
| `overflowLabel` | `string` | `'More'` | The accessible name of the "…" item. If the indicator shows text, the name must contain it. |
| `subMenuOpenDelay` | `number` | `0` | Seconds before a popup shows on hover. |
| `subMenuCloseDelay` | `number` | `0.1` | Seconds before a popup closes after the pointer left. |
| `triggerSubMenuAction` | `'hover' \| 'click'` | `'hover'` | What opens a popup with the pointer. The keyboard and touch always work. |
| `expandIcon` | `Snippet<[MenuExpandIconInfo]>` | — | Replaces the arrow of a submenu. |
| `tooltip` | `false \| MenuTooltipProps` | — | The tips of a collapsed menu; `false` turns them off. |
| `classNames`, `styles` | nested objects | — | The parts `root`, `item`, `itemIcon`, `itemContent`, `popup` and `subMenu` (`itemTitle`, `list`, `item`, `itemIcon`, `itemContent`). |
| `popupRender` | `Snippet<[MenuPopupInfo]>` | — | Wraps the content of a popup; a submenu may have its own. |
| `onclick` | `(info: MenuClickInfo) => void` | — | An item was chosen: `{ key, keyPath, domEvent, itemData }`. |
| `onselect`, `ondeselect` | `(info: MenuSelectInfo) => void` | — | The user changed the selection (`ondeselect` only with `multiple`). |
| `onopenchange` | `(openKeys: string[]) => void` | — | The user opened or closed submenus; not called for a change the parent makes. |

The page of the documentation site has the tables of the item fields, of the arguments of the callbacks and of the markup
components, and the design tokens.

## Accessibility

- Roles: the root is `menu` (`menubar` for `horizontal`), items are `menuitem`; a selectable item is `menuitemradio` (`menuitemcheckbox`
  with `multiple`) with `aria-checked`. A submenu title has `aria-haspopup`, `aria-expanded` and `aria-controls`.
- One Tab stop on an item. Arrows, `Home`, `End`, `Enter`, `Space`, `Escape` and typing a letter as in the WAI-ARIA menu and
  menubar patterns. The keyboard and a tap open a popup whatever `triggerSubMenuAction` says.
- Icons are hidden from assistive technology. The labels of a collapsed menu stay in the page; its tips are visual only.
- Three colors of the Ant Design token table are below 4.5:1 (the selected item, the group title, the danger item), and so are two
  fills of the dark menu. `tokens-accessible.css` darkens them; the dark theme of the page needs no file.
- Not checked with a real screen reader or on a real touch device.
