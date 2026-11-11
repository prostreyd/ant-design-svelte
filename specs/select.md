# Select specification

Status: **agreed, workflow stage 2 is done** (2026-11-11). Decisions 1, 2, 3 and 5 were answered one by
one; 4 and 6 to 10 were accepted with "давай" to the proposals shown. Implementation waits for the popup
primitive. Nothing is implemented. Prerequisite: the popup primitive of [popup.md](popup.md) (approach B
chosen on 2026-11-11, not built yet). Select is its first consumer, so this document also checks the
contract of that primitive.

The comparison below uses public documentation, not implementation source code.

| Library | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/select> | 6.7.0 (site navigation), 2026-11-11 |
| Ant Design Vue | <https://antdv.com/components/select>; the site renders client-side, so the API tables were read from the documentation markdown of the repository (`components/select/index.en-US.md`, docs text only, no component code; standing permission) | `main` branch docs, 2026-11-11; npm release 4.2.6 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/select/en> | 22.2.0 (site header), 2026-11-11. The demo code did not load in the fetched page, so demos are known by title and description only. |
| WAI-ARIA Authoring Practices | the combobox pattern, the "select-only" and "list autocomplete" combobox examples (both updated 12 August 2025) and the listbox pattern, <https://www.w3.org/WAI/ARIA/apg/patterns/combobox/> | 2026-11-11 |
| Deprecation and change records (rule 4a) | React: <https://ant.design/changelog> and <https://ant.design/docs/react/migration-v6> (the v5 migration page returned 404); Vue: `CHANGELOG.en-US.md` of the repository (docs text); Angular: <https://ng.ant.design/docs/changelog/en>. Coverage limits are in "Deprecation check". | 2026-11-11 |

None of the three Ant Design pages has an accessibility or keyboard section. React has one FAQ item
(the a11y helper node exists only while the list is open; add `aria-label` yourself), Vue and Angular
have none. The a11y contract below is therefore our own, based on the WAI-ARIA combobox and listbox
patterns, not copied from Ant Design. Not documented anywhere, and decided by us below: what happens to
the search text on blur, which keys do what, how a value that matches no option is shown.

## Parts and elements

Three components: `Select`, for the three modes (single by default, `multiple` and `tags`), and
`SelectOption` and `SelectOptGroup`, which are written as children of `Select` and give the same options
as the `options` prop (decision 1: both ways are in v1.0).

DOM (our own; the React part list has `root`, `prefix`, `content`, `placeholder`, `clear`, `input`,
`suffix`, `popup.root`, `popup.list`, `popup.listItem`):

- `root`: `<div class="ads-select">`, the bordered box. Children in this order: `prefix`, `content`,
  `clear`, `suffix`. It is **one element for the whole life of the field**, so showing or hiding the
  prefix, the clear button or the loading icon never re-creates the focused element (the Input rule).
- `content`: holds the selection (one `item` in single mode, one per tag in `multiple`/`tags`), the
  `placeholder` while nothing is selected, and the `input` while searching.
- The focused element, **always inside `content`**, has `role="combobox"`:
  - not searchable: a `<div tabindex="0">` (the select-only pattern);
  - searchable (`showSearch`, and by default in `multiple`/`tags`): a native `<input type="text">`
    (the editable pattern). Switching between the two at run time re-creates the element; this is
    accepted because `showSearch` is a static choice in practice.
- The panel (`popup`) is the `Popup` of popup.md in a portal: `popup` (frame) > `list` (`role="listbox"`)
  > `listItem` (`role="option"`), with `role="group"` wrappers for option groups.

Icons (arrow, clear, check, remove, spinner, search) are drawn from scratch as small inline SVGs, as in
Input.

## API

Exported types: `SelectValue = string | number`, `SelectOption`, `SelectOptionGroup`,
`SelectMode = 'multiple' | 'tags' | 'default'`, `SelectSize = 'large' | 'medium' | 'middle' | 'small' |
'default'`, `SelectStatus = 'error' | 'warning'`, `SelectVariant = 'outlined' | 'filled' | 'borderless' |
'underlined'`.

`SelectOption = { value: SelectValue; label?: string | Snippet; disabled?: boolean; title?: string;
class?: string }`. `SelectOptionGroup = { label: string | Snippet; options: SelectOption[]; title?: string;
class?: string }`. A bare `string` or `number` in `options` is both the value and the label (the Checkbox
rule; React, Vue and Angular take only objects, so this is additive).

**Option text.** Search, type-ahead and the accessible-name fallback need plain text. The text of an
option is its `label` when that is a string, otherwise its `title`, otherwise `String(value)`. A snippet
`label` is only drawn.

**`SelectOption`** (child of `Select` or `SelectOptGroup`) has the props of the `SelectOption` object:
`value` (required), `label?: string | Snippet`, `disabled?: boolean`, `title?: string`, `class?: string`,
plus `children?: Snippet` (the content of the item in the list; when both `label` and `children` are given,
`children` is drawn and `label` is still the text). **`SelectOptGroup`**: `label: string | Snippet`,
`title?: string`, `class?: string`, `children: Snippet` (the `SelectOption`s of the group). Both render
nothing where they are written; they register with the closest `Select`. Outside a `Select` they throw in
development. With a non-empty `options` the children of `Select` are ignored (the Checkbox rule).

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `value` | `SelectValue \| SelectValue[] \| undefined` (`$bindable`) | `undefined` | Single mode: one value; `multiple`/`tags`: an array, and `undefined` means `[]`. `undefined` and `null` mean "nothing selected": the placeholder shows. `bind:value` for two-way use; plain `value={x}` is an initial value (no `defaultValue`, the Switch rule). A function binding can refuse or delay a change. A value that matches no option is shown as its own text (ours). |
| `mode` | `SelectMode` | single | `multiple` and `tags` take an array value; in `tags` a text that matches no option can be added as a value. `'default'` is the Angular name for single, accepted as an alias. |
| `options` | `ReadonlyArray<SelectValue \| SelectOption \| SelectOptionGroup>` | `[]` | Values must be unique. Groups are entries with an `options` array. |
| `fieldNames` | `{ label?: string; value?: string; options?: string; groupLabel?: string }` | `label`, `value`, `options`, `label` | Maps the keys of the objects in `options` (React 4.17.0, `groupLabel` 5.6.0; Vue the first three). |
| `placeholder` | `string \| Snippet` | — | Shown while nothing is selected. Not a label: the field still needs an accessible name. |
| `disabled` | `boolean` | `false` | Not focusable, does not open; the clear button and the icons use the disabled colors. |
| `loading` | `boolean` | `false` | A spinner replaces the arrow (the width does not change). `aria-busy="true"` (ours). The list stays usable. |
| `size` | `SelectSize` | `'medium'` | As Input: `medium` is the React name, `middle` (Vue) and `default` (Vue, Angular) are aliases. Heights: large 40px, medium 32px, small 24px. |
| `variant` | `SelectVariant` | `'outlined'` | As Input. Vue's `bordered` is not taken (React deprecated it for `variant`). |
| `status` | `SelectStatus` | — | `error` red, `warning` yellow. `error` also sets `aria-invalid="true"` (as Input). |
| `prefix` | `string \| Snippet` | — | Before the content, inside the field (React 5.22.0, Angular). |
| `suffix` | `string \| Snippet \| null` | the arrow | Replaces the arrow; `null` hides it (React 6.7.0; replaces the old `showArrow` and `suffixIcon`). A click on it opens the list like the rest of the field (React documents the opposite for a custom suffix and a workaround; ours is simpler, decision 9). |
| `allowClear` | `boolean \| { clearIcon?: string \| Snippet; label?: string; tabIndex?: number }` | `false` | As Input: a button shown when there is a selection and the field is neither disabled nor read-only. A click empties the value (`undefined`, or `[]` in `multiple`/`tags`), keeps focus in the field, and calls `onchange` then `onclear`. `label` is its accessible name (`Clear`, English). |
| `removeIcon`, `menuItemSelectedIcon`, `loadingIcon` | `string \| Snippet` | built-in | Custom icons: the remove button of a tag, the mark on a selected option in the list, the spinner (React 6.4.0 for the last; the first two are in all three libraries). |
| `showSearch` | `boolean` | single `false`; `multiple`/`tags` `true` | Makes the focused element a text input. Flat search props, decision 3. |
| `searchValue` | `string` (`$bindable`) | `''` | The current search text. |
| `onsearch` | `(value: string) => void` | — | Called on every edit of the search text, also for a change made by a token separator. |
| `filterOption` | `boolean \| ((input: string, option: SelectOption) => boolean)` | `true` | `true` filters by `optionFilterProp`; `false` leaves the list as given (server-side search; Angular `nzServerSearch`). |
| `filterSort` | `(a: SelectOption, b: SelectOption) => number` | — | Orders the filtered options (React and Vue). |
| `optionFilterProp` | `string \| string[]` | `'label'` | Which fields of an option the text is matched against (React `string[]` since 6.1.0). Default is decision 8. |
| `autoClearSearchValue` | `boolean` | `true` | `multiple`/`tags` only: clear the search text after a selection. |
| `maxTagCount` | `number` | — | `multiple`/`tags`: show this many tags, the rest collapse into a `+ N ...` tag. `'responsive'` is decision 2. |
| `maxTagPlaceholder` | `string \| Snippet<[omitted: SelectOption[]]>` | `+ N ...` | Content of the collapsed tag. |
| `maxTagTextLength` | `number` | — | Longer tag text is cut with an ellipsis. |
| `maxCount` | `number` | — | `multiple`/`tags`: at most this many values; the rest of the options become disabled while it is reached (React 5.13.0, Angular `nzMaxMultipleCount`). |
| `tokenSeparators` | `string[]` | `[]` | `multiple`/`tags`: typed or pasted text is split at these characters into values. Values beyond `maxCount` are dropped (Angular 19.2.2). The function form of React 6.5.0 is not taken (its meaning is not on the page). |
| `tagRender` | `Snippet<[tag: { value: SelectValue; label: string \| Snippet; closable: boolean; onclose: () => void }]>` | — | Custom tag (React, Vue). Decision 6. |
| `optionRender` | `Snippet<[option: SelectOption, index: number]>` | — | Custom content of an option in the list (React 5.11.0, Vue `option` slot, Angular `nzCustomContent`). The selection keeps the plain label. |
| `labelRender` | `Snippet<[option: SelectOption]>` | — | Custom content of the selected value in the field (React 5.15.0, Angular `nzCustomTemplate`). |
| `notFoundContent` | `string \| Snippet` | `No data` | Shown in the panel when no option remains (the React text; Vue and Angular say `Not Found`: React is the reference). |
| `open` | `boolean` (`$bindable`) | `false` | The list is shown. `bind:open` for controlled use. |
| `onopenchange` | `(open: boolean) => void` | — | Called once per change of the open state caused by the user, not for a change made by the parent. |
| `placement` | `'bottomLeft' \| 'bottomRight' \| 'topLeft' \| 'topRight'` | `'bottomLeft'` | Preferred side of the panel; it flips at the edge (popup R2). |
| `popupMatchSelectWidth` | `boolean \| number` | `true` | `true`: the panel is at least as wide as the field (popup R5, a minimum); a number: that width in px, but never narrower than the field; `false`: the width of its content. |
| `listHeight` | `number` | `256` | Maximum height of the list in px; it scrolls beyond that. |
| `container` | `HTMLElement \| ((anchor: HTMLElement \| null) => HTMLElement)` | `document.body` | Passed to the popup (popup R10). A Select inside another popup passes the parent of its field. React and Vue name it `getPopupContainer`. |
| `popupRender` | `Snippet<[list: Snippet]>` | — | Wraps the list with custom content (React 5.25.0, Vue `dropdownRender`). Clicks in the added content must not blur the field (popup R12): the panel stops that by default. |
| `defaultActiveFirstOption` | `boolean` | `true` | Highlight the first option when the list opens or the filter changes. |
| `onchange` | `(value: SelectValue \| SelectValue[] \| undefined, option: SelectOption \| SelectOption[] \| undefined) => void` | — | Called once per user change with the new value and the option object(s); not for a change made by the parent. After a clear, both are `undefined` (single) or `[]`. A new tag has `{ value: text, label: text }`. |
| `onselect` | `(value: SelectValue, option: SelectOption) => void` | — | A value was selected (React, Vue). |
| `ondeselect` | `(value: SelectValue, option: SelectOption) => void` | — | `multiple`/`tags` only: a value was removed. |
| `onclear` | `() => void` | — | After the clear button emptied the value (React 4.6.0, Angular `nzOnClear`). |
| `onfocus`, `onblur` | `(event: FocusEvent) => void` | — | Focus entered or left the field. Moving focus between the field and its own panel does not count (the panel never takes focus). |
| `onpopupscroll` | `(event: Event) => void` | — | The list scrolled (React, Vue; Angular `nzScrollToBottom` is this event plus a check). |
| `oninputkeydown` | `(event: KeyboardEvent) => void` | — | A key went down in the focused element (React `onInputKeyDown`). |
| `classNames` | `Partial<Record<'root' \| 'prefix' \| 'content' \| 'placeholder' \| 'item' \| 'clear' \| 'input' \| 'suffix' \| 'popup' \| 'list' \| 'listItem', string>>` | — | Decision 7. `item` is a selected value or tag (ours); `popup`, `list`, `listItem` are React's `popup.root`, `popup.list`, `popup.listItem`, written flat. |
| `styles` | the same keys, `Record<string, string \| number>` | — | The Switch contract (kebab-case, numbers as-is, written after our own). |
| `class`, `style` | `string` | — | Root element. |
| Native attributes | `HTMLAttributes<HTMLElement>` | — | Forwarded to the focused `role="combobox"` element: `id` (so `<label for>` works), `aria-label`, `aria-labelledby`, `aria-describedby`, `tabindex`, `data-*`, `autocomplete` (default `new-password`, the React default, so browsers do not offer saved values in the search box), handlers. The component owns `role`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete`, `aria-multiselectable` and `aria-invalid`. |

**Methods** (through `bind:this`): `focus(options?: FocusOptions)` and `blur()` (all three libraries; none
has `scrollTo`).

Enum props (`mode`, `size`, `variant`, `status`, `placement`) follow the Button rule: outside the contract
they throw a `RangeError` in development and tests and fall back to the default in production.

## Поведение / Behavior

- **Opening.** A click (press) on the field, except on the clear button and the remove button of a tag,
  opens the list, and a second click closes it; in a searchable field a click on the text only opens it, so
  that the caret can be placed. Focus alone does not open it. The keys that open it are in the A11y table.
- **Selecting.** A click or Enter on an option selects it. Single mode: the value changes, the list
  closes, the field keeps focus. `multiple`/`tags`: the value is added (or removed if already selected),
  the list stays open, and the search text is cleared when `autoClearSearchValue` is on. The callbacks
  run in this order: `onselect` (or `ondeselect`), then `onchange`. Selecting the already selected value
  in single mode closes the list and changes nothing (no callbacks).
- **Search.** With `showSearch`, typing filters the list live; the first match is active (when
  `defaultActiveFirstOption`). The default filter is a case-insensitive "contains" on the fields named by
  `optionFilterProp`. When nothing matches, the panel shows `notFoundContent` (in a `role="status"`
  element, so it is announced). **On close or blur the search text is cleared and the selected label
  shows again** (single mode) (ours; no library documents it). In `tags` mode, Enter on text that
  matches no option adds it as a value.
- **`tokenSeparators`.** `multiple`/`tags` only: typing or pasting `Lucy,Jack` with `,` as a separator
  turns each part into a value (an existing option's value, or a new tag in `tags`; in `multiple` a part
  that matches no option is dropped).
- **Tags.** Each selected value is a tag with a remove button. The remove button is not in the Tab order
  and has an accessible name (`Remove <label>`, English); with the field focused, Backspace on an empty
  search text removes the last tag (ours; common, not documented by Ant Design). A press on a remove
  button does not open the list (React documents that a custom close icon opens it unless the press is
  stopped: ours stops it).
- **Groups.** A group label is not an option: it is not focusable, not selectable, and is skipped by the
  arrow keys. While searching, a group with no matching option is hidden.
- **Children markup.** `SelectOption` and `SelectOptGroup` register with the `Select` through a context
  (the Checkbox group mechanism) and give the same options as `options`. Their order is their position in
  the markup, also after `{#each}` or `{#if}` inserts or moves one: mount order alone is not enough (an
  option inserted in the middle mounts last), so each option leaves an invisible placeholder and the
  `Select` sorts by document position. The `Select` renders its `children` once in a hidden area written
  **before** the field, so the options exist while the list is closed and the field can show the label of
  the selected value, also in a server render; a test covers that.
- **Disabled options** are skipped by the arrow keys and cannot be selected; they are visible and
  `aria-disabled="true"`. With `maxCount` reached, the unselected options are in this state too.
- **Value that matches no option** is shown as its own text. In `multiple` it is a tag that can be
  removed.
- **Focus** stays in the field the whole time: the panel never takes it, and a press inside the panel is
  stopped from blurring the field (popup R12). The active option is shown by `aria-activedescendant`. It
  is scrolled into view when the arrow keys move it (browsers do not do this for
  `aria-activedescendant`).
- **Closing.** Outside press, Escape, Tab, selecting in single mode, and blur close the list. `onopenchange`
  is called once per change.
- **Clear.** The button keeps its place in the layout and is hidden with `visibility` while there is
  nothing to clear, so the field does not change size when it appears (the Input rule).
- **Layout.** The field never changes size when it opens, closes or selects. Single mode: a long label is
  cut with an ellipsis, it never widens the field. `multiple`/`tags`: the field grows in height as tags
  wrap, never below the height of its size, and neighbours move only for that reason.
- **Reactivity.** Changing `options`, `value`, `mode`, `size`, `disabled`, `loading` or a snippet
  re-renders correctly; changing `options` while the list is open keeps the active option when it still
  exists.
- **RTL.** The layout mirrors (logical properties); `placement` mirrors with it (popup R15).

## A11y

Our own contract from the WAI-ARIA combobox and listbox patterns. Notes where the pages disagree with
each other are marked.

- **Roles.** The focused element is `role="combobox"` with `aria-expanded` (`true`/`false`),
  `aria-controls` (the id of the listbox, popup R14, set while open) and `aria-activedescendant` (the id
  of the active option, while open and one is active). `aria-haspopup` is implicit (`listbox`). A
  searchable field adds `aria-autocomplete="list"`. The panel's list is `role="listbox"`, with
  `aria-multiselectable="true"` in `multiple`/`tags`; options are `role="option"`, groups are
  `role="group"` named by their label (`aria-labelledby`).
- **Selected state.** Selected options have `aria-selected="true"`, the others `aria-selected="false"`
  (the listbox pattern). The combobox examples put `aria-selected` on the *active* option only; that
  works for a single list where selection follows focus, but not for a list with several selections, so
  we follow the listbox page and mark the **selected** ones. This divergence is tested with axe.
- **Name.** An accessible name is **required** and comes from the consumer: `<label for={id}>`,
  `aria-labelledby` or `aria-label` (the `id` is forwarded to the combobox element). The placeholder is not
  a name. A group's name is its label.
- **`status="error"`** sets `aria-invalid="true"`; `loading` sets `aria-busy="true"`; `disabled` is native
  on the `<input>` and `aria-disabled="true"` plus no `tabindex` on the `<div>`.
- The arrow, search and loading icons are decorative (`aria-hidden`; React 6.7.0). The clear and remove
  buttons are native buttons: Enter and Space activate them (React 6.6.1), they show a focus ring, and
  they are named (`allowClear.label`, `Remove <label>`).
- **Keyboard**, DOM focus stays on the field; "active" is the highlighted option:

| Key | List closed | List open |
|---|---|---|
| Down | opens, active = the selected option or the first | active = next option (stops at the end) |
| Up | opens, active = the last option | active = previous option (stops at the start) |
| Alt+Down / Alt+Up | opens, active unchanged (Alt+Up: nothing) | Alt+Up: selects the active option and closes (APG) |
| Enter, Space (not searchable) | opens | selects the active option; Space and Enter in `multiple` toggle it and keep the list open |
| Enter (searchable) | `tags`: adds the text; otherwise nothing | selects the active option (`tags`: or adds the text) |
| Space (searchable) | types a space | types a space |
| Escape | nothing | closes, keeps the value, focus stays |
| Home / End | opens, active = first / last | active = first / last (searchable: moves the text caret instead) |
| PageUp / PageDown | nothing | active moves 10 options, or to the first / last |
| Tab / Shift+Tab | moves focus on | closes the list, keeps the value, moves focus on (decision 5) |
| Printable character (not searchable) | opens, active = first option starting with the typed text; repeating one character cycles | same type-ahead |
| Printable character (searchable) | opens and types | types and filters |
| Backspace (empty search, `multiple`/`tags`) | removes the last tag | removes the last tag |

- **Live region.** The empty-result text is `role="status"`; selecting a value does not need an extra
  announcement (the combobox value changes).
- `:focus-visible` ring from the tokens, at least 3:1 against the page background (on the root while the
  focused element is inside it).
- **Contrast.** As in Input: the default light set is Ant Design's and may not reach WCAG AA; the border,
  placeholder, arrow, clear and remove icons, the selected-option mark and the selected-option background
  are checked on `tokens-accessible.css` and the dark theme; the `color-contrast` rule is not applied to
  the library's own components in the site's e2e, but is applied to everything else.
- `prefers-reduced-motion: reduce` removes the panel animation and the spinner speed-up (popup R11).
- Axe checks every state: closed, open, searching, multiple with tags, groups, disabled, loading, error;
  an unnamed Select is reported (negative check).

## Colors, tokens and sizes

Our own token names `--ads-select-*` (the field reuses the Input tokens where the look is the same), with
values from the public Ant Design token table checked **at implementation time**: field background,
hover and active border, outline, tag background/border/height (three sizes), disabled colors, option
height, font size, padding, hover (active) background, selected background, color and weight, the clear
background, the arrow reserve and the layer `--ads-dropdown-z-index` (1050, popup.md). Not fixed here:
the option height (Angular documents 32px; a React FAQ item mentions 24px for the virtual list item,
and the token's value was not read). Colors for the accessible set are our own, chosen for contrast.

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue ∩ Angular, or React ∩ Vue with the same semantics):** the value and its change
  callback with the option(s); `mode` (single, `multiple`, `tags`); `options` with groups, and the `SelectOption` / `SelectOptGroup` children (decision 1); `disabled`;
  `loading`; `allowClear`; `placeholder`; search (`showSearch`, filtering, `onsearch`, `searchValue`,
  `autoClearSearchValue`); `maxTagCount` (a number), `maxTagPlaceholder`, `tokenSeparators`;
  `notFoundContent`; `size`; `status`; `placement`; `popupMatchSelectWidth`; `listHeight`; `open` and its
  callback; `container`; custom icons (`suffix`, `removeIcon`, `menuItemSelectedIcon`, `clearIcon`);
  `optionRender`; `popupRender`; `fieldNames`; `optionFilterProp`; `defaultActiveFirstOption`; the
  callbacks `onselect`, `ondeselect`, `onclear`, `onfocus`, `onblur`, `onpopupscroll`; `focus()`, `blur()`;
  `variant` (React and Angular; Vue has the older `bordered`).
- **Дешёвые React-дополнения (≤ 1 день):** `prefix` (React 5.22.0, Angular); `maxCount` (React 5.13.0,
  Angular); `labelRender` (React 5.15.0, Angular); `maxTagTextLength` (React, Vue); `oninputkeydown`;
  `filterSort` (React, Vue); `loadingIcon` (React 6.4.0); `autoComplete` default. Each is a few lines
  over the core. `classNames`/`styles` are **not assumed cheap**: about a day, decision 7. `tagRender` is
  medium (the tag, its remove button and the press handling): decision 6.
- **Отложено на v1.1 (name and contract reserved now, additive later):** see decisions 2 to 5:
  `virtual` (`boolean`, default `true`) with
  `listItemHeight`; `maxTagCount="responsive"`; `labelInValue` (the value becomes
  `{ value, label }`); `showSearch` as an object (the keys of React 6: `filterOption`, `filterSort`,
  `onSearch`, `searchValue`, `optionFilterProp`, `autoClearSearchValue`, `searchIcon`), which would
  accept the flat props as aliases; a locale mechanism for the built-in texts (`No data`, `Clear`,
  `Remove`), as in Input; `selectOnTab` (Tab selects the active option, Angular
  `nzSelectOnTab`).
- **Не берём (Vue-only):** `autofocus` (call `focus()` after mount, the Switch rule); `bordered`
  (`variant`); `firstActiveValue` (set `value` or use `defaultActiveFirstOption`); `dropdownMenuStyle`
  (`styles.list`); the `mouseenter` and `mouseleave` events (native handlers are forwarded);
  `showArrow` and `suffixIcon` (React replaced them with `suffix`).
- **Не берём (Angular-only):** `nzServerSearch` (`filterOption={false}`); `compareWith` and object
  values (values are `string | number`, a consumer maps ids; decision of the Checkbox rule); `nzHide`
  (filter the `options` array); `nzBackdrop` (a backdrop is not part of a popup); `nzOptionHeightPx` and
  `nzOptionOverflowSize` (belong to the virtual list); `nzScrollToBottom` (`onpopupscroll`);
  `nzAutoFocus` (`focus()`); `nzSelectOnTab` (decision 5; reserved as `selectOnTab`); `nzKey` (not needed).
- **Не берём (React-only, не подходит для Svelte):** `defaultValue`, `defaultOpen` (`$bindable` covers the
  initial and the controlled cases); the function forms of `classNames`/`styles`; `onActive` (marginal:
  it can be added later); the deprecated names `bordered`, `showArrow`, `suffixIcon`, `dropdownClassName`,
  `popupClassName`, `dropdownStyle`, `dropdownRender`, `dropdownMatchSelectWidth`,
  `onDropdownVisibleChange`, and the flat `filterOption` family that React moved into `showSearch`
  (decision 3 says which form we start with); the `listItemHeight` internals (a FAQ item, not a prop);
  `AllowClearConfig.disabled` (the same as `allowClear={false}`).

## Расхождения React / Vue / Angular

| Level | Item | React 6.7.0 | Vue (docs markdown) | Angular 22.2.0 | Decision |
|---|---|---|---|---|---|
| **Presence** | component | `Select`, `Select.Option`, `Select.OptGroup` | `a-select`, `a-select-option`, `a-select-opt-group` | `nz-select`, `nz-option`, `nz-option-group` | `Select`, `SelectOption`, `SelectOptGroup` (decision 1) |
| **Presence** | modes | `multiple`, `tags` (single when unset) | same | `default`, `multiple`, `tags` | React values, `'default'` accepted |
| **API** | options data | `options` (`{label, value}`), children | `options`, children | `nzOptions`, children | `options` and the children (decision 1) |
| **API** | value | `string \| number \| LabeledValue` or arrays; `labelInValue` | `string \| number` or arrays; `labelInValue` | `any` (`ngModel`), `compareWith` | `SelectValue \| SelectValue[]`; `labelInValue` decision 4 |
| **API** | change | `onChange(value, option \| options)`; `onSelect`, `onDeselect` | `change`, `select`, `deselect` | `ngModelChange(value)` only | the React shape |
| **API** | open state | `open`, `onOpenChange` | `open`, event `dropdownVisibleChange` | `nzOpen`, `nzOpenChange` | `open`, `onopenchange` |
| **API** | search | `showSearch` (`boolean \| object`, object 6.0.0; single `false`, multiple `true`); flat names deprecated | flat: `showSearch`, `filterOption`, `filterSort`, `searchValue`, `optionFilterProp` (default `value`), `search` event | `nzShowSearch` ("for single mode"), `nzFilterOption`, `nzServerSearch`, `nzOnSearch` | flat props (decision 3, an exception to rule 4a) |
| **API** | size | `large`, `medium`, `small`; `medium` | `middle`, `large`, `small`; `middle` | `large`, `small`, `default`; `default` | React names, aliases (as Input) |
| **API** | `notFoundContent` default | `No data` | `Not Found` | `Not Found` | React: `No data` |
| **API** | popup width | `popupMatchSelectWidth` `boolean \| number`, `false` disables virtual scroll | `dropdownMatchSelectWidth`, same | `nzDropdownMatchSelectWidth` boolean | React name; the virtual-scroll note waits for decision 2 |
| **API** | list size | `listHeight` 256 (px) | `listHeight` 256 | `nzOptionHeightPx` 32, `nzOptionOverflowSize` 8 | `listHeight` |
| **API** | `placement` | 4 values | 4 values (3.3.0) | in a demo, not in the API table | 4 values |
| **API** | arrow / suffix | `suffix` (6.7.0), old `showArrow`, `suffixIcon` | `showArrow`, `suffixIcon` | `nzShowArrow`, `nzSuffixIcon` | `suffix` (`null` hides) |
| **API** | `variant` | 4 values (5.13.0, `underlined` 5.24.0) | `bordered` boolean | 4 values (20.0.0) | React |
| **API** | tags overflow | `maxTagCount` number or `responsive`, `maxTagPlaceholder`, `maxTagTextLength` | `maxTagCount` number, `maxTagPlaceholder`, `maxTagTextLength` | `nzMaxTagCount`, `nzMaxTagPlaceholder` | number in v1.0; decision 2 |
| **API** | `maxCount` | 5.13.0 | — | `nzMaxMultipleCount` | taken (cheap) |
| **API** | `prefix` | 5.22.0 | — | `nzPrefix` | taken (cheap) |
| **API** | virtual scroll | `virtual` (4.1.0), `listHeight` | `virtual` (3.0) | built in (`nzOptionHeightPx`) | v1.1 (decision 2) |
| **Behavior** | `onChange` after clear | `undefined` | not documented | not documented | `undefined` or `[]` |
| **Behavior** | closing | "closes when it loses focus"; a press in custom popup content blurs it | the same FAQ (click in `dropdownRender` closes) | not documented | ours: the panel never takes focus (popup R12) |
| **Behavior** | Tab with the list open | not documented | not documented | `nzSelectOnTab` (default `false`) | Tab only closes (decision 5) |
| **Behavior** | `defaultActiveFirstOption` | `true` | `true` | — | `true` |
| **a11y** | keyboard, ARIA | none documented | none | none | ours, from the WAI-ARIA patterns |
| **Customization** | semantic styling | `classNames`/`styles` (5.25.0) with 10 parts | — (`dropdownStyle`, `dropdownMenuStyle`, `popupClassName`) | `nzDropdownClassName`, `nzDropdownStyle` | decision 7 |
| **Customization** | render | `optionRender`, `labelRender`, `tagRender`, `popupRender`, icons | `option` slot, `tagRender`, `dropdownRender`, icons | `nzCustomContent`, `nzCustomTemplate`, `nzMaxTagPlaceholder`, icons | snippets for the same places |

## Value forms per prop (CLAUDE.md section 5, item 4)

| Prop | React | Vue | Angular | Our type | Narrowing |
|---|---|---|---|---|---|
| `value` | `string \| number \| LabeledValue`, arrays | `string \| number`, arrays | `any`, `any[]` | `SelectValue \| SelectValue[]` | Objects and `LabeledValue` not taken (Checkbox rule; `labelInValue` decision 4). `null` is read as "nothing". |
| option `label` | `ReactNode` | vNodes | `string \| number \| TemplateRef` | `string \| Snippet` | `number` not taken: write `String(n)` (as in Switch and Input). Widening it costs nothing; say so if you want it. |
| `placeholder` | `ReactNode` | `string \| slot` | `string` | `string \| Snippet` | none |
| `notFoundContent` | `ReactNode` | `string \| slot` | `string \| TemplateRef` | `string \| Snippet` | none |
| `prefix` | `ReactNode` | — | `TemplateRef \| string` | `string \| Snippet` | none |
| `suffix` | `ReactNode \| function(props)` | `suffixIcon`: `VNode \| slot` | `nzSuffixIcon`: `TemplateRef \| string` | `string \| Snippet \| null` | React's function form receives props; ours is a plain snippet, a parameter can be added later (additive) |
| icons | `ReactNode` | `VNode \| slot` | `TemplateRef` | `string \| Snippet` | none |
| `allowClear` | `boolean \| object` | `boolean` | `boolean` | `boolean \| object` | `AllowClearConfig.disabled` not taken (same as `false`) |
| `showSearch` | `boolean \| object` | `boolean` | `boolean` | `boolean` | the object form is reserved (decision 3) |
| `filterOption` | `boolean \| function` | `boolean \| function` | function (+ `nzServerSearch`) | `boolean \| function` | none |
| `optionFilterProp` | `string \| string[]` | `string` | — | `string \| string[]` | none |
| `maxTagCount` | `number \| 'responsive'` | `number` | `number` | `number` | `'responsive'` reserved (decision 2) |
| `maxTagPlaceholder` | `ReactNode \| function(omitted)` | `slot \| function` | `TemplateRef` | `string \| Snippet<[omitted]>` | none |
| `tokenSeparators` | `string[] \| function(input)` | `string[]` | `string[]` | `string[]` | the function form is not taken (meaning not on the page) |
| `popupMatchSelectWidth` | `boolean \| number` | `boolean \| number` | `boolean` | `boolean \| number` | none |
| `container` | function | function | not documented | `HTMLElement \| function` | wider |
| `size`, `status`, `variant`, `placement` | string unions | string unions / boolean | string unions | string unions | `size` aliases as Input |
| `fieldNames` | object | object | — | object | none |
| `classNames` / `styles` | object or function | — | — | object | the function form not taken (the Switch rule) |

## Deprecation check (rule 4a)

Method: the struck-through rows of the React Select page, the React v6 migration page, the React changelog,
the Vue docs page and the changelog file of its repository, the NG-ZORRO page and changelog. The source
code and the issue tracker were not read. **Coverage limits:** the React changelog was read verbatim for
6.7.0 to 6.6.4 and 6.1.4 to 6.0.0, and from a summary for 6.6.3 to 6.2.x (unverified); 5.x and older are not on
that page. The NG-ZORRO changelog was read verbatim for 22.2.0 to 20.4.4 and from a summary for 20.4.3 to
16.2 (unverified). The Vue changelog file is short and covers few versions; it has two Select entries (4.0.4,
bug fixes), no deprecation.

| Deprecated in | Old name | Final name (React) | Ours |
|---|---|---|---|
| React 6 | `dropdownMatchSelectWidth` (Vue's current name) | `popupMatchSelectWidth` (5.5.0) | `popupMatchSelectWidth` |
| React 6 | `dropdownClassName` (Vue and Angular: `popupClassName`, `nzDropdownClassName`) and `popupClassName` (4.23.0) | `classNames.popup.root` | `classNames.popup` |
| React 6 | `dropdownStyle` | `styles.popup.root` | `styles.popup` |
| React 6 | `dropdownRender` (4.24.0; Vue's current name) | `popupRender` (5.25.0) | `popupRender` |
| React 6 | `onDropdownVisibleChange` (Vue: event `dropdownVisibleChange`) | `onOpenChange` | `onopenchange` |
| React 6 | `bordered` (Vue's current name) | `variant` | `variant` |
| React 6, 6.7.0 | `showArrow`, then `suffixIcon` (Vue and Angular's current names) | `suffix`; `null` hides the arrow | `suffix` |
| React 6.0.0 | flat `filterOption`, `filterSort`, `searchValue`, `onSearch`, `optionFilterProp`, `autoClearSearchValue` | keys of the `showSearch` object | flat names, **an exception**, decision 3 |
| React 6.6.4 | the `Select` `OptionProps` type | derived types | not applicable |

Rename chains: the migration page maps both `dropdownClassName` and `popupClassName` directly to
`classNames.popup.root`; it shows no chain through `popupClassName`. `dropdownRender` to `popupRender` is a
single step. `showArrow` and `suffixIcon` are two steps toward `suffix`; the final name is taken at once.

Angular: `nzBorderless` was removed in 21.0.0 (the changelog summary names `nzVariant` as the
replacement; that line was not read verbatim). No deprecation was found for `nzDropdownRender`,
`nzDropdownClassName` or `nzDropdownStyle`; `nzDropdownRender` is named in a demo but not in the API table.
Vue: no deprecation marks on the page; the names above that React deprecated are still Vue's current ones,
and we do not take them (React's final names are the reference).

Behavior changes found in the records and taken into the contract: `maxCount` has no effect in single mode
and a paste is cut at the limit (Angular 19.2.0 and 19.2.2); `autoClearSearchValue` has no effect in
single mode (Angular 21.0.0); a long label is cut with an ellipsis (Angular 20.1.2); disabled options carry
`aria-disabled` (React 6.3.1); decorative icons are hidden from screen readers (React 6.7.0); the clear
button works with Enter and Space (React 6.6.1); `optionFilterProp` takes several fields (React 6.1.0); a tag
created from typed text is never disabled (React 6.5.0).

## Decisions (all taken on 2026-11-11)

Decisions 1, 2, 3 and 5 were taken by the maintainer on 2026-11-11, as answers to four questions. The
others (4 and 6 to 10) were proposals, accepted with "давай" the same day, as in the Input specification.

1. **Options as children: TAKEN, both ways in v1.0.** The maintainer chose `options` **and**
   `SelectOption` / `SelectOptGroup`, not the proposal to defer the components. The estimate stays
   **expensive**. What makes it workable: the text of an option comes from its `label` (a string), then
   its `title`, then `String(value)`, so search, type-ahead and the accessible name never need the text of
   a snippet; options register through a context (the Checkbox group mechanism) and are ordered by their
   position in the markup (Behavior, "Children markup"); with `options` given, the children are ignored.
2. **Expensive helpers: TAKEN, both to v1.1.** v1.0 has `listHeight` with a scrolling list and a numeric
   `maxTagCount`. Reserved names: `virtual`, `listItemHeight`, `maxTagCount="responsive"`. A long list in
   v1.0 renders all its options; the site page says so.
3. **Search props: TAKEN, flat props.** `showSearch: boolean` plus `filterOption`, `filterSort`,
   `optionFilterProp`, `searchValue` (`bind:`), `onsearch`, `autoClearSearchValue`; the React 6 object form
   is reserved and will accept these as aliases. **This is an exception to rule 4a**, which says to take
   the current name and not the deprecated one: React deprecated the flat names for the `showSearch`
   object. The maintainer chose flat after being told they are deprecated in React; they are current in
   Vue and Angular, and `bind:searchValue` cannot live inside an object. If 4a should win, switching to the
   object form is a contained change before implementation.
4. **`labelInValue`** (React and Vue; the value becomes `{ value, label }`, so the type of `value` would
   depend on a flag). `onchange` already passes the option, with its label. Options: (a) reserved for
   v1.1 (**proposed**); (b) taken in v1.0; (c) not taken. **TAKEN, as proposed.**
5. **Tab with the list open: TAKEN, it only closes** the list and leaves the value (no accidental
   selection when tabbing through a form). A `selectOnTab` prop is reserved for v1.1 (Angular
   `nzSelectOnTab`; the WAI-ARIA select-only example selects on Tab).
6. **`tagRender`** (React, Vue): taken in v1.0 (**proposed**) or reserved for v1.1. It needs the tag's
   `closable`/`onclose` contract; the remove press must not open the list. **TAKEN, as proposed.**
7. **`classNames` / `styles`** with 11 parts, three of them inside the portal: taken in v1.0
   (**proposed**, as for Switch and Input; about a day) or reserved. **TAKEN, as proposed.**
8. **Defaults that differ or are not documented:** `optionFilterProp` is `label` here (Vue documents
   `value`; the React page does not state its default and says it "should be `label`" when `options` is
   used, which suggests `value`): matching the visible text is what users expect, so **proposed `label`**.
   `notFoundContent` is `No data` (React). `autocomplete` defaults to `new-password` (React). The
   search text is cleared on close (ours). A value that matches no option is shown as its own text
   (ours). **TAKEN, as proposed.**
9. **A click on a custom `suffix` opens the list** (React documents the opposite and a
   `pointer-events: none` workaround): proposed to open it, one rule for the whole field. **TAKEN, as proposed.**
10. **Built-in texts** (`No data`, `Clear`, `Remove <label>`) are English. `notFoundContent` and
    `allowClear.label` override two of them; the remove button's name has no override in v1.0. A locale
    mechanism for all of them is reserved for v1.1, as in Input (proposed). **TAKEN, as proposed.**

Also still open in popup.md: decision 4 (point anchor, RTL mirroring) and decision 5 (internal, not
exported). Select does not need the point anchor.

## Requirements this puts on the popup primitive

Checked against popup.md: R1 and R2 (4 placements, flip), R5 (`popupMatchSelectWidth`, minimum width),
R7 (`open`, `onopenchange`), R9 (outside press, Escape, field blur; a press in the panel is not outside),
R10 (`container`, layer 1050), R12 (focus stays in the field; presses in the panel do not blur it), R13
(a Select inside a Popover or a Select inside a Select's `popupRender`), R14 (the listbox id), R15 (RTL).
The primitive's `matchWidth` is used with the Select's `popupMatchSelectWidth`. Nothing new is needed,
with one addition: the primitive must tell the Select which side it ended up on (for the panel's
border-radius and a flipped arrow), or expose the final placement as a data attribute. Added to the
popup open questions.

## Страница на сайте

`docs/` page at `/components/select/` (en, ru, zh). The API, methods and tokens tables are compared with
the source by a test, as for the other components; every prop appears in an example.

| Example | Spec items |
|---|---|
| `01-basic` | `value` (`bind:`), `options` (strings and objects), `placeholder`, `onchange` |
| `02-search` | `showSearch`, `filterOption`, `filterSort`, `optionFilterProp`, `searchValue`, `onsearch`, server-side search with `filterOption={false}` and `loading`, `notFoundContent` |
| `03-multiple` | `mode="multiple"`, `maxTagCount`, `maxTagPlaceholder`, `maxTagTextLength`, `maxCount`, `autoClearSearchValue`, `ondeselect` |
| `04-tags` | `mode="tags"`, `tokenSeparators`, adding a value |
| `05-appearance` | `size` (and the aliases), `variant`, `status`, `disabled`, `prefix`, `suffix`, `loading`, `allowClear`, custom icons |
| `06-groups` | `SelectOptionGroup`, group search behavior, disabled options, `fieldNames` |
| `07-custom` | `optionRender`, `labelRender`, `tagRender`, `popupRender` |
| `08-popup` | `placement`, `popupMatchSelectWidth`, `listHeight`, `container` (a Select in a popover), `open` and `onopenchange`, `onpopupscroll` |
| `09-control` | a function binding that refuses a change, `onselect`, `onclear`, `onfocus`, `onblur`, `oninputkeydown` |
| `10-methods` ("Focus and blur") | `focus()`, `blur()` |
| `11-labels` | accessible name: `<label for>`, `aria-label`, `aria-labelledby`, `aria-describedby` |
| `12-semantic` | `classNames`, `styles`, `class`, `style` |
| `13-children` | `SelectOption` and `SelectOptGroup` as children, options inserted by `{#each}` and `{#if}`, `options` taking precedence |

## Список тестов (planned, final after the decisions)

Each item is at least one test; the test name is the item. Vitest + Testing Library in jsdom; geometry
and the visual states in Playwright (`e2e/select.spec.ts`).

- Render: `role="combobox"`, `aria-expanded="false"`, the placeholder, no listbox before opening;
  `value` initial, `bind:value`, a later change by the parent, a function binding that refuses; `null`
  and `undefined` mean nothing selected; a value without an option is shown as text.
- `options`: strings, numbers, objects, groups, `fieldNames`, `label` as string and as snippet, `title`,
  `class`, `disabled`; duplicates are not required to work; changed `options` re-render.
- Single: click selects and closes; callbacks run in order (`onselect`, `onchange`); selecting the
  selected value changes nothing; `onchange` receives the option; not called for a parent change.
- `multiple`: toggling, the list stays open, `ondeselect`, tags with remove buttons (named, not in the
  Tab order), Backspace removes the last tag, `maxCount` disables the rest, `maxTagCount` and
  `maxTagPlaceholder`, `maxTagTextLength`, `aria-multiselectable`.
- `tags`: Enter adds a value, `tokenSeparators` on type and on paste, `autoClearSearchValue` on and off,
  duplicates are not added.
- Search: the input appears with `showSearch` and by default in `multiple`/`tags`; filtering by
  `optionFilterProp`, a custom `filterOption`, `filterOption={false}`, `filterSort`; the first match is
  active; `notFoundContent` is `role="status"`; the text is cleared on close and blur; `searchValue`
  binding; `onsearch` per edit.
- Open state: `open` and `bind:open`, `onopenchange` once per user change, not for a parent change;
  click, outside press, Escape, Tab, blur close it; a press on the clear or remove button does not open
  it; a press inside the panel keeps focus in the field.
- Keyboard: every row of the table above for closed and open, searchable and not; the type-ahead and its
  cycling; disabled options and group labels are skipped; the active option is scrolled into view;
  `aria-activedescendant` follows; Home/End in the input move the caret.
- ARIA: `aria-controls` points to the listbox, `aria-selected` marks the selected options, groups are
  named, `aria-invalid`, `aria-busy`, `aria-disabled`; the name from `<label for>`, `aria-label` and
  `aria-labelledby`.
- `allowClear`: shown only with a selection; clears to `undefined` or `[]`; `onchange` then `onclear`;
  `label` and `tabIndex`; keeps focus; not shown when disabled.
- `loading`, `disabled`, `status`, `variant`, `size` and its aliases (invalid value: `RangeError` outside
  production, default in production), `prefix`, `suffix` and `null`, custom icons.
- Children markup: `SelectOption` and `SelectOptGroup` register and give options and groups; the order is
  the markup order, also for options inserted, removed and moved by `{#each}` and `{#if}`; non-empty
  `options` makes the children ignored; `label` string, snippet `children`, and the option text (label,
  then title, then value) used by search and type-ahead; an option outside a `Select` throws in
  development; the label of an initial `value` shows from children, also in a server render.
- Tab with the list open closes it and leaves the value (single and `multiple`); `maxCount` has no effect in
  single mode, and a paste beyond it is cut; the decorative icons are `aria-hidden`; the clear and remove
  buttons activate with Enter and Space.
- Popup: `placement` and the flip at the edge, `popupMatchSelectWidth` (true, number, false, narrower
  number), `listHeight` scrolling, `container`, `popupRender` (a click in it does not blur), a Select
  inside a popover stays open while used, RTL.
- Custom renders: `optionRender`, `labelRender`, `tagRender`, `maxTagPlaceholder`, `notFoundContent` as a
  string and as a snippet.
- `classNames` and `styles`: each part, appended and not replacing, kebab-case and custom properties,
  the parts inside the portal.
- Native attributes: `id`, `aria-*`, `data-*`, `tabindex`, `autocomplete` default `new-password`;
  `role`, `aria-expanded`, `aria-controls` are not overridable.
- `focus()` and `blur()`.
- Reactivity: changing `mode`, `options`, `size`, `disabled`, `loading` and the snippets re-renders
  correctly; `options` changed while open keeps the active option.
- Layout (e2e, labels of different width such as "Happy" and "Sad", in all three sizes): the field does
  not change size on open, close, select, loading and clear; a long label is cut; `multiple` grows only
  by wrapped tags; the panel is at least as wide as the field.
- Visual states (e2e): hover, active, `:focus-visible`, open, disabled, error, warning, in light and dark
  themes; the contrast matrix on `tokens-accessible.css` and the dark theme.
- Axe: closed, open, searching, multiple, groups, disabled, loading, error; an unnamed Select is reported.
- Mutation testing: `npm run test:mutation -- --target=Select` once the component exists.

## Решения и обоснование

- Select depends on no other component, but on the popup primitive; its other helpers (virtual list,
  overflow measuring) are decision 2.
- One focused element with `role="combobox"` (a `<div>` or an `<input>`) inside a root that never
  changes, instead of a native `<select>`: a native select cannot show a custom panel, tags or search.
- The panel never takes focus, so the field keeps the caret and `aria-activedescendant` drives the
  highlight: the APG approach for a combobox with a list popup.
- **Both ways of giving options** (decision 1): React, Vue and Angular all have both, so a consumer
  coming from any of them finds the form they know. The price (a registration mechanism, ordering by
  document position) is accepted and has a precedent in the Checkbox group.
- All code is independently authored for Svelte. Ant Design implementation source was not used, and no
  documentation text is copied. API inspired by Ant Design (MIT); the implementation is original for
  Svelte.
