# Checkbox specification

Status: scope and open points agreed with the maintainer on 2026-11-10 (workflow stage 2 done);
implementation follows this document. The three open points of the draft were answered with "давай"
to the proposal that was shown (see "Agreed decisions").

The comparison below uses public documentation, not implementation source code.

| Library | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/checkbox> | 6.7.0 (site navigation), 2026-11-10 |
| Ant Design Vue | <https://antdv.com/components/checkbox> | The site (also `www.antdv.com` and `antdv-next.com`) returns an empty application shell, so the API tables were read from the documentation markdown file of the repository (`components/checkbox/index.en-US.md`; docs only, no component code) with the maintainer's OK on 2026-11-10. No version is shown there. |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/checkbox/en> | 22.2.0 (site header), 2026-11-10 |

None of the three pages has an accessibility or keyboard section. The a11y contract below is
our own, based on the native `<input type="checkbox">` and the WAI-ARIA checkbox pattern
(`mixed` for the indeterminate state), not copied from Ant Design.

## Elements

Two components, exported separately (`Checkbox` and `CheckboxGroup`; Svelte has no
`Checkbox.Group` namespace):

- **`Checkbox`**: a native `<label class="ads-checkbox">` that wraps a native
  `<input type="checkbox" class="ads-checkbox-input">` (visually hidden, laid over the box, so
  focus, keyboard, forms and the accessibility tree stay native), `<span class="ads-checkbox-icon">`
  (the box with the check mark or the indeterminate bar, `aria-hidden`) and
  `<span class="ads-checkbox-label">` (the content; rendered only when `children` is given).
  Semantic parts: `root`, `icon`, `label` (the React 6.0.0 names).
- **`CheckboxGroup`**: a `<div role="group" class="ads-checkbox-group">` that holds either the
  checkboxes generated from `options` or the `children` markup. Semantic parts: `root`, `item`,
  `itemIcon`, `itemLabel` (React 6.7.0); the `item*` parts reach the `root`, `icon` and `label`
  of every checkbox inside.

## API: Checkbox

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `checked` | `boolean` (`$bindable`) | `false` | Current state. `bind:checked` for two-way use; plain `checked={x}` is an initial value, as in Switch (there is no `defaultChecked`). Inside a `CheckboxGroup` the state comes from the group's `value` and this prop is ignored. |
| `indeterminate` | `boolean` | `false` | The "partly checked" look of the "check all" pattern. It changes only the appearance and the accessibility state (`mixed`, through the native `indeterminate` property); `checked` stays the value that is reported and submitted (Angular: "only affects the style"). The browser clears the native flag on a click; the component writes the prop back after every toggle, so the view always follows the prop and the parent decides when the state ends, as in React, Vue and Angular. |
| `disabled` | `boolean` | `false` | Native `disabled` on the input: not focusable, not activatable; the box and the text use the disabled colors. A group's `disabled` applies as well. |
| `value` | `string \| number` | — | Identity inside a `CheckboxGroup` and the native `value` of the input (a number is written as its decimal text). Narrower than the originals, see open point 3. |
| `children` | `Snippet` | — | Label content, rendered in the `label` part; it is the accessible name. Without it the consumer has to name the checkbox (see A11y). |
| `onchange` | `(checked: boolean, event: Event) => void` | — | Called once per user toggle, after the state changed, with the new value and the native `change` event. `event.target` is the input, so `.checked`, `.value`, `.name` and `.indeterminate` are there, as on React's `e.target`. Not called for a change of the `checked` prop made by the parent, nor while disabled. |
| `classNames` | `Partial<Record<'root' \| 'icon' \| 'label', string>>` | — | Classes appended to the semantic part. |
| `styles` | `Partial<Record<'root' \| 'icon' \| 'label', Record<string, string \| number>>>` | — | Inline styles of the semantic part. Keys are kebab-case CSS property names or custom properties; numbers are written as-is, no automatic `px` (the Switch contract). |
| `class` | `string` | — | Appended to the root classes, together with `classNames.root`. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it, so it wins on the same property. |
| `title` | `string` | — | Native `title` of the root label, so the tooltip covers the box and the text (React puts it on the wrapper too). |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>`: `id` (so an external `<label for>` and `aria-labelledby` work), `name`, `required`, `autofocus`, `tabindex`, `form`, `aria-*`, `data-*`, `onclick`, `onfocus`, `onblur`, `oninput` and other handlers. The component owns `type`, `checked`, `indeterminate`, `value`, `disabled` and `onchange`. |

**Methods** (on the component instance, through `bind:this`): `focus(options?: FocusOptions)`
and `blur()`.

## API: CheckboxGroup

`CheckboxValue = string | number` and `CheckboxOption` are exported types.

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `value` | `CheckboxValue[]` (`$bindable`) | `[]` | Selected values. `bind:value` for two-way use; plain `value={x}` is an initial value (there is no `defaultValue`). Values that match no option or item are kept. The order of the array follows the options or the markup (see Behavior). |
| `options` | `ReadonlyArray<CheckboxValue \| CheckboxOption>` | `[]` | Renders one `Checkbox` per entry. A string or a number is both the value and the label. `CheckboxOption = { label: string \| Snippet; value: CheckboxValue; disabled?: boolean; title?: string; class?: string; style?: string; onchange?: (checked: boolean, event: Event) => void }`. Values must be unique. When `options` has entries, `children` is ignored. |
| `children` | `Snippet` | — | Custom markup with `Checkbox` elements anywhere inside (the "Use with Grid" case). Each `Checkbox` needs a `value`. |
| `disabled` | `boolean` | `false` | Disables every checkbox of the group; an item's own `disabled` disables that item alone. |
| `name` | `string` | — | Native `name` of every input of the group; it wins over an item's own `name`. |
| `onchange` | `(value: CheckboxValue[], event: Event) => void` | — | Called once per user toggle with the new array (a new array, never the mutated one). The second argument is the `change` event of the toggled input; it is our addition, React passes the array only. Not called when the parent changes `value`. |
| `classNames` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', string>>` | — | `root` is the group element; `item`, `itemIcon` and `itemLabel` are appended to the `root`, `icon` and `label` parts of every checkbox inside (generated from `options` or placed in `children`), after the item's own `classNames`. |
| `styles` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', Record<string, string \| number>>>` | — | The same mapping for inline styles. The item's own `styles` are written after the group's, so the item wins. |
| `class`, `style` | `string` | — | Root element. |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the root `<div>` (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `data-*`, handlers). The component owns `role`. |

No methods: the group has no focus of its own; focus a checkbox inside it.

## Поведение / Behavior

Checkbox:

- Activation is native: a click on the box or on the text, or Space on the focused input, toggles
  the input and fires `change`; the component copies the new checkedness into `checked` and calls
  `onchange(checked, event)`. Enter does nothing (native).
- A forwarded `onclick` that calls `event.preventDefault()` cancels the toggle: the browser
  restores the checkedness and fires no `change`, so `onchange` is not called. This is the
  synchronous veto; the function binding below is the asynchronous one.
- A change of the `checked` prop by the parent updates the input and does not call `onchange`.
- **Native form reset.** `form.reset()` puts the input back to its default checkedness behind the state's back
  (the native algorithm leaves `indeterminate` alone). The component listens for `reset` on the input's form and,
  one task later (after the reset has run), writes the state back to the input. The state (`checked`, or the
  group's `value`) is the truth: a reset does not clear a checkbox by itself, and the parent resets its state in
  `onreset`. This keeps the view and the state from drifting apart; the alternative (making the DOM the truth, as
  `bind:checked` on a plain input does) would need the group to take its `value` from the DOM.
- A fully controlled checkbox (the parent may refuse or delay a change) uses a function binding:
  `bind:checked={() => on, (next) => confirm(next)}`. After every user toggle the component
  reads the prop back and writes it to the input, so a refused change is reverted in the view
  (unlike the `<button>` of Switch, a native input has a state of its own).
- `indeterminate` sets the native property; the box shows the bar instead of the check mark,
  whatever `checked` is (the style wins, as in Ant Design). It is written back after every user
  toggle, because the browser clears it. A change of the prop re-renders.
- `disabled`: native `disabled`, no `onchange`, a click on the text does nothing; the cursor is
  `not-allowed` on the whole label.
- Without `children` the `label` part is not rendered, so the control is just the box with no
  padding beside it.
- Rapid repeated clicks: each toggles once and calls `onchange` once.
- The box has a fixed size and the check mark and the bar are absolutely positioned inside it, so
  toggling `checked`, `indeterminate` or `disabled` never changes the size of the control or
  moves its neighbours (checked in the browser with labels of different lengths).
- `styles` values are applied after the component's own, so a consumer value wins.

Inside a `CheckboxGroup`:

- A `Checkbox` finds the nearest `CheckboxGroup` through Svelte context. Its checkedness is
  "the group's `value` contains its `value`", its `name` is the group's, and it is disabled when
  the group or itself is disabled. Its own `checked` prop is ignored: the group owns the state.
- A user toggle calls the item's `onchange(checked, event)` first, then the group adds or removes
  the value, updates `value` and calls its `onchange(value, event)`. With `options`, the option's
  `onchange` runs where the item's would.
- Order of `value`: with `options`, the order of the options (a value toggled off and on again
  goes back to its place); with `children`, the order in which the items mounted (the markup
  order for static markup). Values that match no option or item keep their relative order after
  the known ones.
- A `Checkbox` inside a group without a `value` cannot take part. Outside a production build it
  throws (the invalid-option rule of Button and Switch); in production it behaves as a standalone
  checkbox.
- The group's function binding `bind:value={() => v, (next) => ...}` can refuse a change; the
  toggled input is reverted in the view, as for a single checkbox.
- Changing `options`, `disabled` or `name` later re-renders the items; `value` is untouched.

## A11y

- Native `<input type="checkbox">` inside a `<label>`: the role, the checked state (`mixed` through
  the native `indeterminate` property, which is how the ARIA in HTML specification wants it
  exposed), Space, the Tab order, the click on the text, external `<label for>` and form
  participation all come from the platform. No ARIA attribute is written for the state.
- **An accessible name is required.** The `children` text is the name. Without `children`, give
  `aria-label` or `aria-labelledby` (forwarded to the input) or an external `<label for={id}>`.
  Axe reports an unnamed checkbox (negative check).
- Focus: `:focus-visible` on the input draws the outline from the design tokens around the box
  (`icon` part), at least 3:1 against the page; keyboard focus only, as the native pseudo-class.
- Disabled: native `disabled`, out of the Tab order; WCAG exempts it from contrast.
- Group: `role="group"`; the consumer names it with `aria-label` or `aria-labelledby`, or wraps it
  in a `<fieldset>` with a `<legend>`. Tab moves between the checkboxes; arrow keys are not part
  of the checkbox pattern and none of the three libraries documents them, so they do nothing.
- Non-text contrast (WCAG 1.4.11): with `tokens-accessible.css` in the light theme, and without it
  in the dark theme, the box border against the page, the check mark against the checked fill, the
  indeterminate bar against the box and the focus ring reach 3:1 in the rest, hover and pressed
  states. The label text keeps 4.5:1 (`--ads-color-text`). The default light set is Ant Design's
  own and its unchecked border does not reach 3:1 (see "Colors").
- `prefers-reduced-motion: reduce` disables the border transition and the check mark animation.
- Positions use logical properties: the box is at the inline start and the text after it, so the
  control mirrors in right-to-left layouts (e2e).

## Colors and dimensions

The React page has no component tokens for Checkbox; it lists the global tokens it uses. The
**default** light tokens take those values: box background `colorBgContainer` `#ffffff`, border
`colorBorder` `#d9d9d9`, hover border and checked fill `colorPrimary` `#1677ff`, checked hover
fill `colorPrimaryHover` `#4096ff`, check mark `colorWhite` `#fff`, disabled background
`colorBgContainerDisabled` `rgba(0,0,0,0.04)`, disabled border `colorBorder`, disabled check mark
and disabled text `colorTextDisabled` `rgba(0,0,0,0.25)`, text `colorText` `rgba(0,0,0,0.88)`.

The default unchecked border is 1.41:1 against a white page (3:1 is needed for a part of a
control), so `tokens-accessible.css` darkens it to `#737373` (4.74:1, the value of the Switch off
track). The checked hover fill `#4096ff` is 2.99:1 against the page and behind the white check
mark, just under 3:1, so `tokens-accessible.css` darkens it to `#0958d9` (6.16:1). The check mark
on the checked fill (`#fff` on `#1677ff`) is 4.10:1, above the 3:1 for a graphic, so the rest
state needs no override. The dark theme is our own: border `#737373` (3.89:1 on `#141414`),
check mark `#141414` on the fill `#3a8aff` (5.49:1), chosen to reach 3:1 without the file; the
disabled colors are exempt, as in WCAG.

Dimensions from the global token table: box 16px (`controlInteractiveSize`), radius 4px
(`borderRadiusSM`), border 1px (`lineWidth`), check mark stroke 2px (`lineWidthBold`), text
padding 8px (`paddingXS`), gap between the items of a group 8px (`marginXS`), font 14px with
line-height 1.5714 (`fontSize`, `lineHeight`), durations 0.1s / 0.2s / 0.3s
(`motionDurationFast` / `Mid` / `Slow`) and `motionEaseOutBack` / `motionEaseInBack` for the
check mark zoom. The indeterminate bar is an 8px square (half the box): our own value, the
documentation gives none. The check mark is drawn with CSS borders (a rotated corner), no SVG
asset. The tokens are `--ads-checkbox-*` in `tokens.css`, each consumed by the component.

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular):** `checked` state, `indeterminate`, `disabled`, `value`,
  label content, change callback, `focus()` / `blur()`; group: `value`, `options` (strings,
  numbers, objects with `label`, `value`, `disabled`), `disabled`, `name`, change callback, custom
  markup with checkboxes inside.
- **Дешёвые React-дополнения (≤ 1 дня, обязательны по правилу 5a):**
  - `classNames` / `styles` of Checkbox (`root`, `icon`, `label`, React 6.0.0): a few hours with
    the helper from Switch.
  - `classNames` / `styles` of CheckboxGroup (`root`, `item`, `itemIcon`, `itemLabel`, React
    6.7.0): about half a day; the `item*` values travel to the items through the same context as
    `value`, `disabled` and `name`.
  - Option fields `title`, `class` (React `className`, 5.25.0), `style`, `onchange` (React;
    Vue has the option `onChange` too): about an hour.
  - `onFocus` / `onBlur` (React): the native handlers are forwarded, nothing to build.
- **Зарезервировано на v1.1:** nothing identified.
- **Не берём (Vue-only):** the option field `indeterminate` (an option is not a "check all"
  control; the standalone `Checkbox` has the prop); the scoped `label` slot of the group (a
  per-option `label` snippet covers it); `autofocus` as a documented prop (also Angular
  `nzAutoFocus`): the native `autofocus` attribute is forwarded to the input.
- **Не берём (Angular-only):** `nzId` (the native `id` is forwarded); `nzValue: any` (see open
  point 3).
- **Не берём (React-only, не подходит для Svelte):** `defaultChecked` and `defaultValue`
  (`$bindable` covers the initial and the controlled cases, as in Switch); the function form of
  `classNames` / `styles` (a Svelte consumer computes the object in `$derived`); `nativeElement`
  (5.17.3; `bind:this` on a Svelte component is the instance, so use `id` or a wrapper element; a
  method can be added additively later if asked); the `CheckboxChangeEvent` wrapper object (the
  native event is passed instead, with the same fields on `target`); the `Form.Item`
  `valuePropName` FAQ (there is no form wrapper in this library).

## Таблица различий по уровням

| Уровень | React (6.7.0) | Vue (docs markdown) | Angular (22.2.0) | Расхождение | Решение для Svelte |
|---|---|---|---|---|---|
| **Наличие** | `Checkbox`, `Checkbox.Group` | `a-checkbox`, `a-checkbox-group` | `[nz-checkbox]`, `nz-checkbox-group` | In all three | **Ядро:** `Checkbox` and `CheckboxGroup` |
| **API** | `checked`, `defaultChecked`, `indeterminate`, `disabled`, `onChange(e)`, `onFocus`, `onBlur`, `classNames`, `styles`; group `value`, `defaultValue`, `options`, `disabled`, `name`, `onChange(values)`, `classNames`, `styles` | `checked` (v-model), `indeterminate`, `disabled`, `value`, `autofocus`, `change(e)`; group `value` (v-model), `options`, `disabled`, `name`, `change(values)` | `ngModel`, `nzIndeterminate`, `nzDisabled`, `nzValue`, `nzId`, `nzName`, `nzAutoFocus`, `ngModelChange(boolean)`; group `ngModel`, `nzOptions`, `nzDisabled`, `nzName`, `ngModelChange(values)` | Names differ by framework convention; `value` is `any` in React and Angular | React names; one `$bindable` state prop per component; `value: string \| number` (open point 3) |
| **Поведение** | `indeterminate` is visual only; the group overrides the item's `checked`; `value` ordered as the options | same | same ("only affects the style") | None documented | Same; the order rule is written down (Behavior) |
| **a11y** | not documented | not documented | not documented | — | Native input in a label; `mixed` through `indeterminate`; name required |
| **Кастомизация** | `classNames` / `styles` (objects or functions), per-option `className` / `style` / `title` | `label` slot of the group | — | React is the richest | Objects only, per-option `class` / `style` / `title`, `label: string \| Snippet` |

## Формы значений по пропсам / Value forms per prop

Checkbox:

| Prop | React | Vue (docs markdown) | Angular | Svelte | Note |
|---|---|---|---|---|---|
| State | `checked: boolean`, `defaultChecked: boolean` | `checked` (v-model) `boolean` | `[ngModel]: boolean` | `checked: boolean` (`$bindable`) | Same forms |
| `indeterminate` | `boolean` | `boolean` | `nzIndeterminate: boolean` | `boolean` | Same |
| `disabled` | `boolean` | `boolean` | `nzDisabled: boolean` | `boolean` | Same |
| `value` | `any` (the group's `value` is `(string \| number \| boolean)[]`) | `boolean \| string \| number` | `nzValue: any` | `string \| number` | **Narrowing**, open point 3 |
| Label content | `children: ReactNode` | default slot | content projection | `children: Snippet` | Same forms: text between the tags is the string form; markup is the node form |
| Change | `onChange(e: CheckboxChangeEvent)`, read `e.target.checked` | `change(e: Event)`, read `e.target.checked` | `(ngModelChange)(boolean)` | `onchange(checked, event)` | Nothing lost: the value and the event, Switch convention |
| Focus / blur callbacks | `onFocus()`, `onBlur()` | — (native) | — | native `onfocus` / `onblur` forwarded | — |
| Autofocus | not on the 6.7.0 page | `autofocus: boolean` | `nzAutoFocus: boolean` | native `autofocus` forwarded | Not a component prop |
| `id`, `name` | common props, on the input | — | `nzId`, `nzName` | native `id`, `name` forwarded to the input | — |
| `title` | common prop, on the wrapper | — | — | `title` on the root label | — |
| `classNames` / `styles` | objects or functions, parts `root`, `icon`, `label` (6.0.0) | — | — | objects, same parts | Function form not taken |
| Methods | `focus()`, `blur()`, `nativeElement` (5.17.3) | `focus()`, `blur()` | `focus()`, `blur()` | `focus()`, `blur()` | `nativeElement` not taken |

CheckboxGroup:

| Prop | React | Vue (docs markdown) | Angular | Svelte | Note |
|---|---|---|---|---|---|
| State | `value: (string \| number \| boolean)[]`, `defaultValue: (string \| number)[]` | `value` (v-model) `(boolean \| string \| number)[]` | `[ngModel]: string[] \| number[]` | `value: (string \| number)[]` (`$bindable`) | **Narrowing** of `boolean`, open point 3 |
| `options` | `string[] \| number[] \| Option[]`; `Option { label: string; value: string; disabled? }` plus `title`, `className` (5.25.0), `style`, `onChange` | `string[] \| { label, value, disabled?, indeterminate?, onChange? }[]`, plus the `label` slot | `string[] \| number[] \| NzCheckboxOption[]`; `{ label: string; value: string \| number; disabled? }` | `(string \| number \| CheckboxOption)[]`; `label: string \| Snippet`, `value`, `disabled`, `title`, `class`, `style`, `onchange` | `label`: every library accepts a string; the snippet is the node / slot form. Vue-only `indeterminate` not taken |
| `disabled` | `boolean` | `boolean` | `nzDisabled: boolean` | `boolean` | Same |
| `name` | `string` | `string` | `nzName: string` | `string` | Same |
| Change | `onChange(checkedValue: T[])` | `change(checkedValue)` | `(ngModelChange)(string[] \| number[])` | `onchange(value, event)` | The event is our addition (additive) |
| Custom markup | `<Checkbox value>` as children | `<a-checkbox value>` in the default slot | `[nz-checkbox]` inside `nz-checkbox-group` | `Checkbox` inside `children` | Same |
| `classNames` / `styles` | objects or functions, parts `root`, `item`, `itemIcon`, `itemLabel` (6.7.0) | — | — | objects, same parts | Cheap React addition |

## Agreed decisions (2026-11-10)

The draft asked three questions and proposed an answer to each. The maintainer answered "давай", which
is recorded here as accepting the proposals; changing one of them is a new decision.

1. **Vue documentation:** the Vue API was read from the documentation markdown on GitHub (docs text only), as for
   Switch. Result: it matched the table of the draft, which had been written from memory: Vue has `autofocus`,
   `checked` (v-model), `disabled`, `indeterminate`, `value` (`boolean | string | number`) and the event
   `change(e: Event)`; the group has `disabled`, `name` (1.5.0), `options` (`string[]` or `{ label, value,
   disabled?, indeterminate?, onChange? }[]`, with a `label` slot) and `value` (v-model,
   `(boolean | string | number)[]`) with the event `change(checkedValue)`; methods `focus()` and `blur()`.
2. **Scope of the release:** `Checkbox` and `CheckboxGroup` together. The "check all" pattern and `options` are the
   main uses and the group exists in all three libraries.
3. **`value` type:** `string | number`. This is a narrowing of React (`any`; `boolean` in the group), Vue (`boolean`)
   and Angular (`any`), accepted by the maintainer: a boolean cannot be written to a native `value` attribute
   meaningfully, and the group's array stays comparable. Widening it later to `boolean` is additive.

Decisions taken without a question (cheap, additive or a documented convention): the group `classNames` /
`styles` parts are in v1.0 (rule 5a, estimate half a day); the group's `onchange` gets the event as a second
argument; `title` goes to the root label; an item without `value` in a group throws outside production; the
native form reset restores the view to the state (see Behavior); the label of an option is `string | Snippet`;
`Boolean(checked)` and the `indeterminate` write-back after a reset were dropped as unobservable (the native reset
leaves `indeterminate` alone).

## Решения и обоснование

- A native input, not a `<button role="checkbox">`: checkboxes take part in forms (`name`,
  `value`, `required`, `FormData`), which Switch does not; the native element also gives
  `mixed` for free and keeps the "click on the label text" behavior.
- The hidden input is laid over the box (not `display: none`), so the focus ring, the hit area and
  the mouse events are those of a real control; `:focus-visible` is read from the input and drawn
  on the box.
- `indeterminate` is not `$bindable`: all three libraries treat it as a parent-owned style, and a
  binding would hide the fact that the browser clears it on every click.
- One `$bindable` state prop per component (no `defaultChecked` / `defaultValue`), the Switch
  decision, kept for consistency.
- Group communication through Svelte context (`setContext` / `getContext`) with reactive getters:
  the idiomatic replacement of React's `Checkbox.Group` context and Vue's provide/inject.
- The group `role="group"` is our own choice (React renders a plain `div`): it lets the consumer
  attach a name with `aria-labelledby`, and axe accepts an unnamed group.
- `value` order follows the options or the markup, so the "check all" pattern and a round trip of
  toggles give a stable array; appending would reorder the values after each toggle.
- Design tokens follow the global token table of the React documentation; the colors of the
  default light set are Ant Design's, the accessible set and the dark theme are ours, as decided
  for Button and Switch on 2026-11-10.
- All code is independently authored for Svelte. Ant Design implementation source was not used.

## Страница на сайте

`docs/` page at `/components/checkbox/` (en, ru, zh). One live example per item; the API, methods
and design tokens tables are compared with the sources by `tests/docs/checkbox-page.test.ts`,
which also checks that every prop and method appears in at least one example.

| Example | Spec items |
|---|---|
| `01-basic` | `checked` (`bind:`), `children`, `onchange` |
| `02-disabled` | `disabled`: unchecked, checked and indeterminate |
| `03-controlled` | function binding (a refused change puts the box back), `preventDefault()` in a forwarded `onclick` |
| `04-check-all` | `indeterminate` with a `CheckboxGroup` ("check all") |
| `05-group` | `options` as strings, numbers and objects (`disabled`, `title`, snippet `label`, option `onchange`), `name`, `bind:value`, group `onchange`, group `disabled` |
| `06-layout` ("Custom layout") | `children` markup with a grid inside `CheckboxGroup` |
| `07-semantic` | `classNames`, `styles` of both components, `class`, `style` |
| `08-methods` ("Focus and blur") | `focus()`, `blur()` |
| `09-labels` | accessible name: `children`, `aria-label`, `aria-labelledby`, external `<label for>`, `aria-describedby`, `title` |
| `10-native` | `name`, `value`, `required` in a `<form>`; the submitted `FormData`; the state reset in `onreset` |

## Список тестов

Each item is at least one test; the test name is the item.

Checkbox:

- Default render: a `<label>` root with an `<input type="checkbox">`, unchecked, not
  indeterminate, no `label` part without `children`.
- `checked`: initial `true` / `false`; `bind:checked` updates the parent; plain `checked={x}`
  toggles locally; a later change of the prop by the parent updates the input without `onchange`.
- `indeterminate`: the native property is set; it is written back after a click; a prop change
  re-renders; `checked` is not affected; the class for styling is present.
- `disabled`: native `disabled`; no `onchange` on a click on the box or on the text; not in the
  Tab order; the disabled class is present.
- `value`: a string and a number are written to the input; absent keeps the native default `on`, also after a
  value was removed (a form never submits an empty value).
- `children`: rendered in the `label` part; absent renders no `label` part; the text is the
  accessible name.
- `onchange`: once per click with `(true, event)` where `event.target` is the input; via a click on
  the text; via Space; once each for rapid clicks; not while disabled; not on a prop change.
- Function binding: a parent that refuses a change keeps the input unchecked; one that accepts it
  changes.
- A forwarded `onclick` with `preventDefault()` cancels the toggle and `onchange`.
- Keyboard: Space toggles; Enter does not; Tab reaches it; disabled is not in the Tab order.
- `classNames`: each of the three parts gets its class; classes are appended; `class` and
  `classNames.root` both reach the root.
- `styles`: each part gets its style; kebab-case keys and custom properties; numbers as-is;
  override the token-based value; update reactively; removed when the prop is cleared.
- `title` is on the root label. Native attributes: `id`, `name`, `required`, `aria-label`,
  `aria-labelledby`, `data-*`, `tabindex`, `onfocus` / `onblur` forwarded to the input; `type`,
  `checked` and `onchange` are not overridable.
- An external `<label for={id}>` names the checkbox and a click on it toggles; inside a `<form>`
  the `name` / `value` pair is in `FormData` when checked and absent when not.
- Native form reset: after `form.reset()` the input is put back to the state (checked, with
  `indeterminate` untouched); a parent that resets its state in `onreset` gets a matching box; a reset after the
  checkbox was removed does nothing and does not throw; the listener is removed with the checkbox.
- `focus()` and `blur()` move and remove focus.
- Reactivity: changing `disabled`, `indeterminate` and `children` re-renders correctly.
- Axe: named by `children`, by `aria-label`, by `aria-labelledby` and by `<label for>`; checked,
  indeterminate, disabled; a negative check that an unnamed checkbox is reported.

CheckboxGroup:

- `value`: initial; `bind:value` updates the parent; plain `value={x}` toggles locally; a parent
  change re-renders the items without `onchange`; unknown values are kept; the order follows the
  options; in `children` mode the mount order.
- `options`: strings, numbers, objects; `label` as a string and as a snippet; a disabled option;
  `title`, `class`, `style` and `onchange` of an option; changed options re-render; empty
  `options` renders `children`; non-empty `options` ignores `children`.
- `children` mode: a `Checkbox` with `value` reads its state from the group; its own `checked` is
  ignored; checkboxes nested in other elements (a grid) take part; a `Checkbox` without `value`
  throws outside production and stays standalone in production.
- `disabled`: disables every item; an item's own `disabled` disables that item; `name` is applied to
  every input and wins over the item's own.
- `onchange`: once per toggle with a new array and the event; the item's `onchange` runs first; the
  option's `onchange` runs in `options` mode; not on a parent change; a function binding that
  refuses a change reverts the toggled input.
- `classNames` / `styles`: `root`; `item`, `itemIcon`, `itemLabel` reach every checkbox in both
  modes and combine with the item's own; `class` / `style` and native attributes reach the root;
  `role="group"` is not overridable.
- Forms: the `name` / `value` pairs of the checked options are submitted; a native reset restores the
  checkboxes to the group's `value`.
- "Check all": an integration test with `indeterminate` and the group, as in the demo.
- Axe: a group named with `aria-labelledby`, with checked, disabled and indeterminate items.

Browser (Playwright, `e2e/checkbox.spec.ts`):

- Visual states compared with the design tokens: rest, hover on the box and on the text, checked,
  checked hover, `:focus-visible` ring around the box (keyboard only), disabled (unchecked,
  checked, indeterminate), indeterminate, `prefers-reduced-motion`.
- A contrast matrix (state x light with `tokens-accessible.css` / dark): the border against the
  page, the check mark against the fill, the bar against the box and the focus ring, all 3:1; and a check
  that with `tokens.css` alone the default colors are Ant Design's own.
- The accessibility tree reports `checked: mixed` for an indeterminate checkbox.
- Layout: toggling `checked`, `indeterminate` and `disabled` changes neither the size of the
  control nor the position of the next sibling, with labels of different lengths and without a
  label; the items of a group keep their positions when one toggles.
- Right-to-left: the box is at the inline start and the text after it.
- Mutation testing: `npm run test:mutation -- --target=Checkbox` mutates `Checkbox.svelte` and runs
  `tests/Checkbox.test.ts` and `tests/CheckboxGroup.test.ts`; `-- --target=Checkbox --file=CheckboxGroup` does the
  same for `CheckboxGroup.svelte`. Current result: Checkbox 100% (54 of 54 killed), CheckboxGroup 100% (24 of 24).
  The score depends on the code around each mutation, so re-run it after editing a component.
