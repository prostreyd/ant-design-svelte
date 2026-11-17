# Radio specification

Status: **agreed (stage 2, 2026-11-15) and implemented (stages 3 to 6, 2026-11-15)**. Q1 and Q2 were put to the maintainer, who chose
`string | number | boolean` for `value` and both `orientation` and `vertical`; P1 to P11 were accepted in one answer (see
"Решения для владельца"). What implementation found out is in "Implementation notes".

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers, package manifests, the WAI-ARIA Authoring Practices and black-box
observation of the public demos (CLAUDE.md sections 2, 4a and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/radio> | 6.7.0 (site navigation), 2026-11-15 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/radio/en> | 22.2.0 (site header), 2026-11-15 |
| Ant Design Vue | `components/radio/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-15 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-15 |
| Issue trackers | React 43306, 6698, 56116, 59194, 59741; Vue 6964; NG-ZORRO 7451, 8184 (read through the GitHub API, code removed from comments) | 2026-11-15 |
| WAI-ARIA Authoring Practices | <https://www.w3.org/WAI/ARIA/apg/patterns/radio/> (Radio Group pattern) | read 2026-11-15 |
| Black-box | the public demos of the three libraries, Chromium under Playwright 1.65, 2026-11-15 (results below) | |

## What it is

A **Radio** picks one option out of several that are all **visible** at once, so the user can compare them. All three
documentations say the same: it differs from Select in that the options are on the page, so there should not be many of
them. There are three components, exported separately (Svelte has no `Radio.Group` namespace):

- **`Radio`**: a round mark and a text. Used alone or inside a group.
- **`RadioButton`**: the same choice drawn as a button (the "Radio.Button" of React, `a-radio-button`, `[nz-radio-button]`).
- **`RadioGroup`**: owns the selected value, the shared `name` and the layout. Builds its items from `options`
  (the React documentation recommends this form) or holds `Radio` and `RadioButton` children.

## Parts and elements

`Radio`: a native `<label>` that wraps a native `<input type="radio">`, so the role, the checked state, Space, the arrow
keys, the Tab order, forms and the click on the text all come from the platform (the same choice as `Checkbox`).

```
<label class="ads-radio">                                  root
  <span class="ads-radio-control">                         the 16px box that holds the input and the mark
    <input type="radio" class="ads-radio-input">           visually hidden, laid over the mark
    <span class="ads-radio-icon" aria-hidden="true"></span>  icon: the circle and the dot
  </span>
  <span class="ads-radio-label">{children}</span>          label: only when `children` is given
</label>
```

`RadioButton`: no mark, so no `icon`. The input covers the whole button and draws nothing but its own focus ring (it has no
native look and no background), so the ring needs no `:has()`, which the browser floor does not have. The border, the
fill and the corners are the root's.

```
<label class="ads-radio-button">                           root
  <input type="radio" class="ads-radio-button-input">
  <span class="ads-radio-button-label">{children}</span>   label
</label>
```

`RadioGroup`: `<div role="radiogroup" class="ads-radio-group">`.

Semantic parts (`classNames`, `styles`): `Radio` has `root`, `icon`, `label` (React 6.0.0); `RadioButton` has `root`, `label`;
`RadioGroup` has `root`, `item`, `itemIcon`, `itemLabel` (React 6.7.0). The `item*` parts reach the matching part of every
radio inside; `itemIcon` does nothing for button items (P7).

## API: Radio and RadioButton

`RadioValue = string | number | boolean` (Q1, taken). `RadioButton` takes the same props as `Radio`.

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `checked` | `boolean` (`$bindable`) | `false` | Current state. `bind:checked` for two-way use; plain `checked={x}` is an initial value (no `defaultChecked`, P3). Inside a `RadioGroup` the state comes from the group's `value` and this prop is ignored. |
| `disabled` | `boolean` | `false` | Native `disabled` on the input. A group's `disabled` applies as well. |
| `value` | `RadioValue` | — | Identity inside a `RadioGroup` and the native `value` of the input (a number or a boolean is written as its text: `1` becomes `"1"`, `false` becomes `"false"`). `false` and `0` are values like any other. Required inside a group. |
| `name` | `string` | — | Native `name`. Inside a group the group's name wins. Standalone radios that share a `name` are **not** coordinated (P6): use a group. |
| `children` | `Snippet` | — | Label content; it is the accessible name. Without it, name the radio (see A11y). |
| `onchange` | `(checked: boolean, event: Event) => void` | — | Called once when the user selects the radio, after the state changed, with `true` and the native `change` event (a radio cannot be unchecked by the user, so `checked` is always `true`; the argument keeps the `Checkbox` and `Switch` shape, P2). Not called for a change of the prop made by the parent, nor while disabled. |
| `classNames`, `styles` | per part (see above) | — | Classes appended, inline styles written after the component's own; kebab-case keys or custom properties; numbers as-is, no automatic `px`. |
| `class`, `style` | `string` | — | Root. `styles.root` is written after `style`. |
| `title` | `string` | — | Native `title` of the root label, so the tooltip covers the mark and the text. |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>`: `id`, `required`, `autofocus`, `tabindex`, `form`, `aria-*`, `data-*`, `onclick`, `onfocus`, `onblur` and the other handlers. The component owns `type`, `checked`, `value`, `disabled`, `name` and `onchange`. |

**Methods** (`bind:this`): `focus(options?: FocusOptions)` and `blur()`.

## API: RadioGroup

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `value` | `RadioValue \| null` (`$bindable`) | `undefined` | The selected value. `undefined` and `null` both mean "nothing selected" (P8). `bind:value` for two-way use; plain `value={x}` is an initial value (no `defaultValue`). A value that matches no radio is kept and checks nothing. Setting it back to `undefined` clears the selection. |
| `options` | `ReadonlyArray<RadioValue \| RadioOption>` | `[]` | Renders one radio per entry. A string or a number is both the value and the label. `RadioOption = { label: string \| Snippet; value: RadioValue; disabled?: boolean; title?: string; id?: string; required?: boolean; class?: string; style?: string; onchange?: (checked: boolean, event: Event) => void }`. Values must be unique. When `options` has entries, `children` is ignored. |
| `optionType` | `'default' \| 'button'` | `'default'` | What `options` render: `Radio` or `RadioButton`. Children keep the type their author chose. |
| `buttonStyle` | `'outline' \| 'solid'` | `'outline'` | The look of the checked button, for every `RadioButton` inside. |
| `size` | `'large' \| 'medium' \| 'middle' \| 'small' \| 'default'` | `'medium'` | The size of the buttons (24, 32 and 40 px high). Has no effect on plain radios. `middle` and `default` are aliases of `medium` (the `Button`, `Input` and `Select` precedent, P9). |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` (when `vertical` is not set) | The direction of the items (React). |
| `vertical` | `boolean` | `false` | A shorthand for `orientation: 'vertical'` (React 6.0.0, Q2 taken). When both are given, `orientation` wins, as in React; so `orientation` has no default of its own and `undefined` means "as `vertical` says". |
| `block` | `boolean` | `false` | The group fills the width of its parent and its items share it equally (React 5.21.0). |
| `disabled` | `boolean` | `false` | Disables every radio; an item's own `disabled` disables that item alone. |
| `name` | `string` | generated | Native `name` of every input; it wins over an item's own `name`. Without it the group makes a unique name of its own (see Behavior). |
| `children` | `Snippet` | — | Custom markup with `Radio` / `RadioButton` anywhere inside. Each needs a `value`. |
| `onchange` | `(value: RadioValue, event: Event) => void` | — | Called once per user selection with the new value and the native `change` event of the selected input (the event is our addition; React passes an event object, Vue an event, Angular the value). Not called when the parent changes `value`, nor when the user selects the radio that is already checked (the browser sends no `change`). |
| `classNames`, `styles` | `root`, `item`, `itemIcon`, `itemLabel` | — | As for `CheckboxGroup`: `item*` are appended to the matching part of every radio inside, after the item's own; the item's own `styles` win. |
| `class`, `style` | `string` | — | Root. |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the root `<div>` (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-required`, `data-*`, handlers). The component owns `role`. |

No methods: focus a radio inside the group.

Exported types: `RadioValue`, `RadioOption`, `RadioSize`, `RadioButtonStyle`, `RadioOptionType`, `RadioOrientation`,
`RadioSemanticName`, `RadioClassNames`, `RadioStyles`, `RadioButtonSemanticName`, `RadioButtonClassNames`,
`RadioButtonStyles`, `RadioGroupSemanticName`, `RadioGroupClassNames`, `RadioGroupStyles`.

## Поведение / Behavior

Radio and RadioButton:

- Selection is native: a click on the mark or on the text, Space on a focused unchecked radio, or an arrow key (see the group
  below) checks the input and fires `change`; the component copies the new state into `checked` and calls
  `onchange(true, event)`. Clicking a radio that is already checked sends no `change`: nothing is called. Enter does nothing
  (native; inside a form it is the browser's own implicit submit).
- A forwarded `onclick` that calls `event.preventDefault()` cancels the selection (synchronous veto); a function binding is
  the asynchronous one. A forwarded `onclick` runs **once** per user click, on the mark and on the text (Vue changelog: two
  `click` events for one click).
- A change of the `checked` prop by the parent updates the input and calls nothing.
- Fully controlled use: `bind:checked={() => on, (next) => confirm(next)}`. After a user selection the component reads the
  state back and writes it to the input, so a refused selection is reverted in the view.
- **Native form reset.** `form.reset()` puts the input back to its default checkedness behind the state's back. One task
  later the component writes the state back (the state is the truth; the parent resets it in `onreset`), as in `Checkbox`.
- `disabled`: native; no `onchange`; a click on the text does nothing; `not-allowed` cursor on the whole label; out of the
  Tab order and skipped by the arrow keys (native).
- Without `children` the `label` part is not rendered.
- **Layout does not move.** The mark has a fixed size and the dot is drawn inside it (scale and opacity); a button keeps the
  same 1 px border in every state and only changes colors. Toggling `checked`, `disabled` or the group's `value` never changes
  the size of a control or the place of its neighbours (checked in the browser with labels of different width).
- Motion: the dot grows in 0.3 s and the colors change in 0.2 s (measured in React); `prefers-reduced-motion: reduce`
  turns both off.

RadioGroup:

- A radio finds the nearest group through Svelte context. Its checkedness is "the group's `value` equals its `value`"
  (strict equality, so `1` and `'1'` differ; `false` and `0` are values, so nothing in the code tests a value for truthiness), its `name` is the group's and it is disabled when the group or it is disabled.
  A radio inside a group without a `value` throws outside production (the invalid-option rule); in production it stays a
  standalone radio.
- **One native group.** Every input of a group gets the same `name`. With no `name` prop the group makes a unique one
  (`$props.id()`, stable between the server and the client). So the browser itself gives the keyboard behavior of a radio
  group (APG): **one Tab stop**, on the checked radio, or on the first (last when tabbing backwards in some engines) when
  none is checked; **arrow keys** move to the previous or next enabled radio and **check** it (at the ends **Chromium and
  Firefox wrap around, WebKit stops**: measured on plain inputs of one name, so it is the platform, and the library adds
  nothing); two groups on a page never trade focus. Without a shared name every radio would be its own Tab stop (what Vue and Angular do, see the
  observations) and the arrow keys would not stay inside the group (React 6698).
- **An unnamed group is not submitted** (P4): its inputs get a generated name and no form owner (a `form` attribute that
  names no form), so a surrounding `<form>` does not send a random key. With an own `name` the inputs belong to the
  surrounding form and are submitted as usual.
- A user selection calls the item's `onchange(true, event)` first, then the group sets `value` and calls
  `onchange(value, event)`. With `options`, the option's `onchange` runs where the item's would.
- **The view is the state.** After every selection the group writes its state to the inputs of **all** its radios, not only
  the selected one. The browser unchecks the previous radio on its own, so a refused change (function binding
  `bind:value={() => v, (next) => confirm(next)}`) would otherwise leave no radio checked. The same writes restore the
  group after a native form reset.
- `value = undefined` (or `null`) from the parent unchecks the checked radio (React 6.6.3: a group that ignored `undefined`).
- `options`, `disabled`, `name`, `size`, `buttonStyle` and `orientation` may change at any time; `value` is untouched.
- Items of `options` are keyed by `value`; a changed `options` array re-renders the radios that changed.
- Button style: the buttons touch, share one 1 px border, and the checked one is raised above its neighbours so that its
  border and the neighbours' borders do not mix. Only the first and the last button have rounded outer corners (at the inline
  start and end, or at the top and bottom when vertical; React 6.4.4: a vertical group had the wrong corners).
- `block`: the group is `display: flex` as wide as its parent and the items share the width equally (`flex: 1 1 0%`); the
  text of a button, and the mark with the text of a plain radio, are centered in each item. Measured on the React demo
  (2026-11-15): three plain radios 108.9 px each with the 8 px between them, three buttons 114.9 px each with the 1 px
  overlap, in a 342.7 px parent. For a vertical group `block` only makes it as wide as the parent.
- `orientation: 'vertical'`: one item per line, 8 px apart for plain radios, touching for buttons.
- RTL: positions use logical properties; the mark is at the inline start and the button group mirrors (e2e).

## A11y

- Native `<input type="radio">` inside a `<label>`: role `radio`, the checked state, Space and the click on the text come
  from the platform. The group is `role="radiogroup"` (React renders it; Vue and Angular render no role, see the observations),
  which is what the APG pattern asks for and which lets `aria-required` and `aria-invalid` be valid on it (React 56116: an
  `aria-required` on a plain `div` failed an accessibility check; there the fix asked for a settable role, here the role is
  right to begin with).
- **Checked against the APG Radio Group pattern (read 2026-11-15).** Roles: `radiogroup` and `radio`: yes. `aria-checked`:
  the native checkedness is exposed as the checked state (no attribute is written). Each radio named by its content, an
  `aria-label` or an `aria-labelledby`: yes (see below). The group named by `aria-label` or `aria-labelledby`: the consumer
  does it. Description by `aria-describedby`: forwarded. Keyboard: Tab into the checked radio, or the first when none is
  checked; Space checks; Right and Down Arrow move to the next and check it; Left and Up Arrow the reverse. The pattern says
  the focus wraps from the last radio to the first; **WebKit stops at the ends** (plain inputs of one name, Playwright's
  WebKit, 2026-11-15), Chromium and Firefox wrap. The pattern also notes that some browsers put Shift+Tab on the last radio
  when none is checked. Both are the platform: the library adds no key handling, and the e2e test compares the group with
  native radios of one name in the same engine instead of asserting the wrap. The variant "radio group in a toolbar" (arrows do not check) is not supported: the
  library has no toolbar.
- **An accessible name is required** for the radio and for the group. The `children` text names a radio; without it give
  `aria-label` or `aria-labelledby` (forwarded to the input) or an external `<label for={id}>`. Name the group with
  `aria-label` or `aria-labelledby` on `RadioGroup`, or wrap it in a `<fieldset>` with a `<legend>`.
- Focus: `:focus-visible` on the input draws the outline from the design tokens around the mark (`icon` part) or around the
  whole button, at least 3:1 against the page; keyboard focus only.
- Disabled: native, out of the Tab order; WCAG exempts it from contrast.
- **Forced colors.** The dot and the fill are backgrounds, which the system replaces, so a checked radio would look
  unchecked. In `forced-colors: active` the checked circle and its dot take system colors that the user's theme
  sets (`Highlight` for the circle and `HighlightText` or `Canvas` for the dot; the exact pair is chosen at stage 3 and tested);
  the rule is that checked, unchecked and disabled stay apart. A checked button takes
  `Highlight` / `HighlightText`, an unchecked one `ButtonFace` / `ButtonText`, a disabled one `GrayText`.
- Non-text contrast (WCAG 1.4.11) and text contrast: with `tokens-accessible.css` in the light theme, and without it in the dark
  theme, the mark border, the dot against the fill, the button border, the focus ring and every text reach their ratios in the
  rest, hover and pressed states (the matrix is in e2e, as for `Checkbox`). The default light set is Ant Design's own and
  does not reach them (see the colors).
- Hover after a tap: a touch screen may keep the hover color on the tapped control until the next tap elsewhere (the
  engines of the e2e keep it). Every component of the library, and Ant Design, draws hover without `@media (hover: hover)`;
  Radio does the same, and the e2e does not assert either way.
- Hit area: the whole label (mark, padding and text) is the target. The label is 22 px high at the 14 px font (React: the same),
  below the 24 px of WCAG 2.5.8; the radios of a group are at least 8 px apart, which meets the spacing exception. The e2e
  test measures the target and the distance.
- Positions and the arrow of the layout use logical properties.

## Colors, tokens and sizes

Light defaults take the Ant Design values, **measured on the public React demo (6.7.0)** where the token table is silent or
stale; the accessible set and the dark theme are ours (the decision of 2026-11-10 for Button and Switch).

Plain radio, measured: mark 16 px, 1 px border `#d9d9d9`, radius 50 %, background `#ffffff`; hover: border `#1677ff`;
checked: fill and border `#1677ff` with a **6 px** white dot (the token table lists `dotSize` 8; the rendered dot is 6, so
6 is the default here); checked hover: fill `#4096ff`; pressed: the hover color; disabled: background `rgba(0,0,0,0.04)`,
border `#d9d9d9`, dot `rgba(0,0,0,0.25)`, text `rgba(0,0,0,0.25)`; label font 14 px / 22 px, padding 8 px on both inline
sides, 8 px between the radios of a row; dot motion 0.3 s `cubic-bezier(0.78, 0.14, 0.15, 0.86)`, colors 0.2 s.

Button, measured: height 24 / 32 / 40 px (small / medium / large), font 14 / 14 / 16 px, inline padding 7 / 15 / 15 px, outer
radius 4 / 6 / 8 px, 1 px border, line height equal to the height minus 2 px. Outline: rest `#ffffff` with a `#d9d9d9` border and
`rgba(0,0,0,0.88)` text; hover: text `#1677ff`; checked: border and text `#1677ff`; checked hover: `#4096ff` for both.
Solid: checked fill and border `#1677ff` with white text; hover `#4096ff`; pressed `#0958d9`. Disabled: text
`rgba(0,0,0,0.25)`, border `#d9d9d9`, background `rgba(0,0,0,0.04)`; disabled and checked: background `rgba(0,0,0,0.15)`.
The pressed color of an outline button and the hover of a disabled one are measured at stage 3.

Focus ring: the library's own (`--ads-color-focus-outline`, 2 px, offset 2 px) as in `Checkbox`; Ant Design draws a 3 px
`#91caff` ring, 1.74:1 against white, which does not reach 3:1.

Accessible and dark sets (to be confirmed by the contrast matrix, as for `Checkbox`): the unchecked border `#737373`
(4.74:1 on white), checked hover fill `#0958d9`, outline text `#1668dc` (the Switch value), the dark theme chosen to reach
the same ratios without a file. The numbers go into this section when they are measured.

Tokens are `--ads-radio-*` and `--ads-radio-button-*` in `tokens.css`, each consumed by the component; the group gap is
`--ads-radio-group-gap` (8 px).

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue ∩ Angular):** `Radio` with `checked`, `disabled`, `value`, label content, change callback, `focus()` /
  `blur()`; `RadioButton`; `RadioGroup` with `value`, `disabled`, `name`, `buttonStyle`, `size` (button style), change
  callback, custom markup with radios inside. React ∩ Vue: `options` and `optionType` (Angular's API table has no
  `options`; its page has an example titled "group - optional", not checked).
- **Дешёвые React-дополнения (≤ 1 день, обязательны по правилу 5a):**
  - `orientation` (6.0.0): about an hour (a flex direction and the corners of buttons).
  - `block` (5.21.0): about two hours.
  - `classNames` / `styles` of `Radio`, `RadioButton` (6.0.0) and `RadioGroup` (6.7.0): half a day with the helper of
    `Checkbox`; the `item*` values travel to the items through the same context.
  - Option fields `title`, `id`, `required`, `class` (React `className`), `style`, `onchange`: about an hour.
  - The generated group `name` (the React documentation: "if not set, it will fall back to a randomly generated name").
  - `onFocus` / `onBlur`: not in the Radio table of React; the native handlers are forwarded, nothing to build.
  - `vertical` (6.0.0, a spelling of `orientation: 'vertical'`): about ten minutes; taken by Q2.
- **Зарезервировано на v1.1:** the `ConfigProvider` global config of `classNames` / `styles` (the React table has a "Global
  Config" column marked 6.0.0): additive when the `ConfigProvider` component exists; no name changes.
- **Не берём (Vue / Angular-only):** `autofocus` / `nzAutoFocus` as a prop (the native `autofocus` is forwarded); Angular's
  `ngModel`, `ngModelChange` and `nzValue` naming (Svelte has `bind:`); `v-model`.
- **Не берём (React-only, не подходит для Svelte):** `defaultChecked` and `defaultValue` (`$bindable` covers the initial and
  the controlled cases); the function form of `classNames` / `styles` (a Svelte consumer computes the object in `$derived`);
  the `RadioChangeEvent` wrapper (the native event is passed); `wave` (the ripple around the mark: tied to the React runtime,
  the same reason as for `Button`).

## Расхождения React / Vue / Angular

| Уровень | React (6.7.0) | Vue (docs markdown) | Angular (22.2.0) | Расхождение | Решение для Svelte |
|---|---|---|---|---|---|
| **Наличие** | `Radio`, `Radio.Button`, `Radio.Group` | `a-radio`, `a-radio-button`, `a-radio-group` | `[nz-radio]`, `[nz-radio-button]`, `nz-radio-group` | In all three | **Ядро:** `Radio`, `RadioButton`, `RadioGroup` |
| **API: radio** | `checked`, `defaultChecked`, `disabled`, `value`, `classNames`, `styles`; `onChange` | `autofocus`, `checked` (v-model), `disabled`, `value` | `nzAutoFocus`, `nzDisabled`, `ngModel`, `nzValue`, `ngModelChange(boolean)` | Names by framework convention | React names; one `$bindable` state prop |
| **API: group** | `value`, `defaultValue`, `options`, `optionType` (4.4.0), `buttonStyle`, `size`, `name`, `disabled`, `block`, `orientation`, `vertical`, `classNames`, `styles`, `onChange(e)` | `value` (v-model), `options`, `optionType` (3.0.0), `buttonStyle`, `size`, `name`, `disabled`; `change(e)` | `ngModel`, `nzName`, `nzDisabled`, `nzSize`, `nzButtonStyle`; `ngModelChange(value)` | `size`: `medium` (React) against `default` (Vue, Angular); `block`, `orientation`, `classNames` React-only; no `options` in the Angular table | React names; `size` takes both spellings (P9); React-only items are cheap additions |
| **API: option** | `label`, `value` (`string \| number \| boolean`), `disabled`, `title`, `id`, `required`, `className`, `style`, `onChange` | `label`, `value`, `disabled` | — | React has the richest option | All React fields; `label: string \| Snippet` |
| **Поведение** | group renders `role="radiogroup"` and a generated unique `name`: one Tab stop, arrows move and select | no role, no `name` unless given: every radio is a Tab stop | no role, no `name` unless given: every radio is a Tab stop; arrows moved the focus only (observed) | React is the only one with native radio-group behavior out of the box | React behavior, made explicit and tested |
| **a11y** | not documented; the group has a role | not documented | not documented | — | APG pattern, native input, `radiogroup` (see A11y) |
| **Кастомизация** | `classNames` / `styles` (objects or functions) on radio (6.0.0) and group (6.7.0); component tokens | — | — | React is the richest | Objects only; tokens `--ads-radio-*` |

## Формы значений по пропсам / Value forms per prop

Radio and RadioButton:

| Prop | React | Vue (docs markdown) | Angular | Svelte | Note |
|---|---|---|---|---|---|
| State | `checked: boolean`, `defaultChecked: boolean` | `checked` (v-model) `boolean` | `[ngModel]: boolean` | `checked: boolean` (`$bindable`) | Same forms |
| `disabled` | `boolean` | `boolean` | `nzDisabled: boolean` | `boolean` | Same |
| `value` | `any` | `any` | `nzValue: any` | `string \| number \| boolean` | **Narrowing** to the three primitives (objects and `null` are not values), Q1 (b), taken |
| Label content | `children: ReactNode` | default slot | content projection | `children: Snippet` | Same forms: text between the tags is the string form |
| Change | `onChange(e)`, read `e.target.checked` | the group's `change(e)` | `(ngModelChange)(boolean)`, which also emits `false` when another radio takes over | `onchange(checked, event)` | Nothing lost; no `false` on deselect (P6) |
| Focus / blur callbacks | not in the Radio table (common props) | — (native) | — | native handlers forwarded | — |
| Autofocus | not on the page | `autofocus: boolean` | `nzAutoFocus: boolean` | native `autofocus` forwarded | Not a component prop |
| `classNames` / `styles` | objects or functions | — | — | objects | Function form not taken |
| Methods | `focus()`, `blur()` | `focus()`, `blur()` | `focus()`, `blur()` | `focus()`, `blur()` | Same |

RadioGroup:

| Prop | React | Vue (docs markdown) | Angular | Svelte | Note |
|---|---|---|---|---|---|
| State | `value: any`, `defaultValue: any` | `value` (v-model) `any` | `[ngModel]: any` | `value: RadioValue \| null` (`$bindable`) | **Narrowing** to the three primitives, Q1 (b), taken; `null` accepted as "none" |
| `options` | `string[] \| number[] \| Option[]`; `Option` has `label: string`, `value: string \| number \| boolean`, `disabled`, `title`, `id`, `required`, `className`, `style`, `onChange` | `string[] \| number[] \| { label: string, value: string, disabled?: boolean }[]` | not in the API table | `(string \| number \| RadioOption)[]`; `label: string \| Snippet` | `label` wider (a string in all three, plus a snippet); `value` has the three forms of React's option type |
| `optionType` | `'default' \| 'button'` | `'default' \| 'button'` | — (use `nz-radio-button`) | `'default' \| 'button'` | Same |
| `buttonStyle` | `'outline' \| 'solid'` | `'outline' \| 'solid'` | `'outline' \| 'solid'` | `'outline' \| 'solid'` | Same |
| `size` | `'large' \| 'medium' \| 'small'` | `'large' \| 'default' \| 'small'` | `'large' \| 'default' \| 'small'` | `'large' \| 'medium' \| 'middle' \| 'small' \| 'default'` | A superset, the precedent of `Button`, `Input` and `Select` (P9); no form lost |
| `orientation`, `vertical` | `'horizontal' \| 'vertical'`; `boolean` (`orientation` wins) | — | — | both, `orientation` wins (Q2 (b), taken) | React-only, cheap |
| `block` | `boolean` | — | — | `boolean` | React-only, cheap |
| `name` | `string`, random when absent | `string` | `nzName: string` | `string`, generated when absent | React behavior |
| Change | `onChange(e)` | `change(e: Event)` | `(ngModelChange)(value)` | `onchange(value, event)` | The value and the event: nothing lost |
| Custom markup | `<Radio value>` as children | `<a-radio value>` | `[nz-radio]` inside the group | `Radio` / `RadioButton` in `children` | Same |

## Deprecation check (rule 4a)

React 6.7.0 page and 6.x changelog, Vue docs and `next` changelog, NG-ZORRO page and changelog.

| Name | Where | Status | In our API |
|---|---|---|---|
| strikethrough rows | React page | none: the page has no struck-through row for Radio | — |
| `vertical` | React 6.0.0 ("`vertical` layout syntax sugar", PR 54727) | not deprecated; the page says "orientation takes priority" when both are given | taken, with `orientation` winning (Q2 (b)) |
| `size: 'middle'` | React (before 6.0.0: `default`/`middle`, now `medium`), Vue and Angular `default` | renamed by React | `medium`, with `middle` and `default` as aliases (P9) |
| `dropdownClassName`-style chains | — | none found for Radio | — |
| deprecations in Vue and Angular | Vue docs markdown and changelog, NG-ZORRO page | none found for Radio | — |

## Public traces turned into items (rule 7a)

| Trace | What it says | Item here |
|---|---|---|
| React 6698 / 6697 (2017), closed | arrow keys left the group and went to the next one; the fix was a shared `name` | the group always has a native name; test: two groups, arrows stay in the group |
| React 43306 (5.6.3), closed; a maintainer linked it to 40703 | tabbing into a group with item 2 checked put the focus on item 1 | test: Tab and Shift+Tab land on the checked radio, in the three engines |
| NG-ZORRO 8184, open since 2023 | after an arrow key changed the value, Shift+Tab back into the group focused an unchecked radio | test: arrow, Tab away, Shift+Tab back: focus is on the checked radio |
| Vue 6964 (4.0.1), closed | "tab does not move through the radios, only arrows"; with none checked Shift+Tab put the focus on another radio | the platform behavior is the contract (APG); test accepts the first or the last radio when none is checked; a note on the page |
| NG-ZORRO 7451, closed | a user asked for Tab between radios; a maintainer: it is browser behavior | same: native |
| React 56116 / 56126 (2025), closed | `aria-required` on the group's plain `div` broke an accessibility check; they asked for a `role` prop | the group is `role="radiogroup"`; axe test with `aria-required` and `aria-invalid` on it |
| React 59194, open PR (reported with VoiceOver on 6.6.2, first filed against 5.24.7) | a label that wraps the input and a separate text node gives two screen reader stops per option and reads each twice | **risk we share** (the `Checkbox` has the same shape); not checkable with the tools here: a `manual pending` note on the page and in the README, the Orca test asserts the name and state |
| React 59741, open PR | two groups with the same relative field name got the same native `name`, so selecting in one unchecked the other | the generated name is unique per instance; an own `name` shared by two groups merges them (documented) |
| React changelog 6.6.3, PR 59162 | `Radio.Group` ignored `value` going to `undefined` | test: `value = undefined` clears the selection |
| React changelog 6.6.1, PR 59010 | an option's `onChange` was not called | test: the option's `onchange` runs |
| React changelog 6.4.4, PR 57917 | an uncontrolled radio did not show the click | test: plain `checked={x}` selects locally |
| React changelog 6.4.4 (58317), 6.3.0 (56909), 6.3.2 (57171) | wrong corners in a vertical button group; an extra end margin in a vertical group; button widths with texts of different length | layout items in e2e: corners, no trailing margin, widths |
| React changelog 6.3.1 (56902) | `prefers-reduced-motion` for Radio | the item in Behavior |
| React changelog 6.7.0 (59701, 59699) | moving from a Radio to its text closed a tooltip; `onMouseEnter` / `onMouseLeave` fired wrongly | e2e: a `mouseenter` listener on the root fires once while the pointer moves between the mark and the text; a `Tooltip` around a `Radio` stays open (the `Tooltip` spec tried a plain label: no extra `mouseleave`) |
| Vue changelog | "Checkbox, Radio triggering two click events for one click" (5363, 5389) | test: a forwarded `onclick` runs once per click |
| NG-ZORRO changelog 7270 | a radio emitted `false` on deselect | not taken (P6): `onchange` is called for the selection only |

## Black-box observations (2026-11-15)

Public demos, Chromium under Playwright, desktop pointer, the first plain group of each page ("Radio Group", four
radios, the second selected by a click). Not code: attributes, geometry and events, as the rules allow (section 2).

| What | React 6.7.0 | Vue | Angular 22.2.0 |
|---|---|---|---|
| Group element | `div role="radiogroup"` | `div`, no role | `nz-radio-group`, no role |
| `name` of the inputs without a `name` prop | one generated name per group, unique between groups | empty | empty |
| Extra ARIA or `tabindex` on the inputs | none | none | none |
| Tab into the group (second selected) | stops once, on the checked radio | every radio is a Tab stop | every radio is a Tab stop |
| Right / Left arrow | moves the focus and checks | moves the focus and checks | moves the focus, selection unchanged |
| Space on the checked radio | nothing | nothing | nothing |
| Wrapper | `label` > `span` (box with the input) + `span` (label, padding 8 px both sides) | `label` > `span` (input and mark) + `span` | `label` > `span` (input and mark) + `span` |

Geometry and states of React 6.7.0 are in "Colors, tokens and sizes". Two more facts: in React the plain radio has no
extra mark element (the dot is a pseudo-element, the `-inner` node was removed in 6.3.0, changelog 56783), and the group is
`display: inline-block` (a column with an 8 px gap when vertical).

## Решения для владельца

Two questions were put to the maintainer on 2026-11-15, with a recommendation each; P1 to P11 were proposals written into the
contract. The answers: **Q1 (b)**, **Q2 (b)**, and **"Принять все P1–P11"**. Changing one of them is a new decision. The tables
below stay as the record of what was weighed; the contract above follows the answers.

**Q1. The type of `value` (a narrowing, CLAUDE.md section 5 item 4): (b) `string | number | boolean`, taken.** React, Vue and Angular take
`any` (React's option type is `string | number | boolean`). The recommendation was (a); the maintainer chose (b), so a yes / no
choice needs no conversion. Consequences recorded: the group's `value` and an option's `value` are the same three forms as React's
option; `false` and `0` are values (no truthiness tests; `null` and `undefined` are the only "none"); the native `value` of the
input is the text of the value, so `true` and the string `"true"` submit alike (the group compares the originals, so they stay
different values inside it).

| | (a) `string \| number`, **recommended** | (b) `string \| number \| boolean` | (c) any type (a generic) |
|---|---|---|---|
| Native `value` of the input | the text of the value | the text of the value (`true` becomes `"true"`) | needs a rule for objects |
| Same as `Checkbox` (decision 3 of 2026-11-10) | yes | no | no |
| A yes / no choice | write `'yes'` / `'no'` | `true` / `false` as in React | yes |
| Cost | none | about an hour | about half a day (a generic over the group and the items, the context) |
| Later widening | to (b) or (c): additive | to (c): additive | — |

Widening to any type later is additive. `Checkbox` keeps `string | number` (its decision 3 is unchanged; widening it to
`boolean` would be a separate, additive decision).

**Q2. `vertical`: (b) both, taken.** React has `orientation: 'horizontal' | 'vertical'` and `vertical: boolean` (6.0.0, "syntax sugar"; the page says
`orientation` wins when both are given). Vue and Angular have neither. Rule 5a makes cheap React additions mandatory, so
leaving one out needs the maintainer's word. The recommendation was (a); the maintainer chose (b).

| | (a) `orientation` only, **recommended** | (b) both |
|---|---|---|
| API | one way to do it | two ways, the second one is a shorthand |
| Cost | none | about ten minutes, plus a page row and a test of the priority |
| Later | adding `vertical` later is additive | removing it later would be breaking |

Proposals (all accepted in one answer, 2026-11-15):

- **P1. Scope of the release:** `Radio`, `RadioButton` and `RadioGroup` together; the button style is in all three libraries.
- **P2. Callback shapes:** `Radio` / `RadioButton` `onchange(checked, event)` (`checked` is always `true`; the type stays `boolean` so
  a later way to deselect is not breaking); `RadioGroup` `onchange(value, event)`; an option's `onchange(checked, event)`.
- **P3. State props:** `checked` and `value` are `$bindable`, plain props are initial values, no `defaultChecked` / `defaultValue`
  (the `Switch` and `Checkbox` decision).
- **P4. Names:** an unnamed group gets a generated name **and no form owner**, so it is never submitted. This differs from
  React, where the random name is submitted with the form. If you want React's behavior, the form owner part is dropped
  (about an hour less, one test fewer).
- **P5. The group role:** `role="radiogroup"` on the group (React; Vue and Angular have none).
- **P6. Standalone radios:** a set of standalone `Radio`s with the same `name` is not coordinated (the browser unchecks the
  other, but its `checked` prop is not told); the documentation and the page say "use a group". Angular emits `false` to
  the deselected radio; we do not. Coordinating them would need a registry per name and form, about half a day, and the group
  already does the job.
- **P7. `RadioButton` has no `icon` part:** it has no mark; the group's `itemIcon` does nothing for buttons.
- **P8. `null` and `undefined`** both mean "nothing selected" in `RadioGroup`'s `value`.
- **P9. `size`:** `large`, `medium`, `small`, with `middle` and `default` accepted as aliases, applied to buttons only (the
  precedent of `Button`, `Input`, `Select`). Invalid values throw outside production and fall back to `medium` in production.
- **P10. Colors:** the light defaults are Ant Design's (measured, with the 6 px dot); the accessible set, the dark theme and the
  focus ring are ours, as for `Checkbox` and `Switch`.
- **P11. Deferred:** the `ConfigProvider` global config of `classNames` / `styles` with the component that owns it; `wave` is
  not taken.

Estimate of the whole component under the recommendations: `Radio` and `RadioButton` about a day, `RadioGroup` about one and a
half days (context, the group sync, options, layout), `classNames` / `styles` half a day, the tokens and the contrast set half
a day, the page and its examples one day, tests alongside (the e2e and Orca ones about a day).

## Dependencies

Rule 6b of the rules for AI assistants: what this component uses besides its own files.

None. Radio, RadioButton and RadioGroup draw everything themselves (the group shares state through its own context). Shared helpers from `src/lib/internal/` (`env`, `options`, `semantic`): small functions with no stable API; they are not dependencies in the sense of rule 6b.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Radio.test.ts`, `tests/RadioGroup.test.ts` and `e2e/radio.spec.ts`: checked against the Radio Group pattern of the WAI-ARIA Authoring Practices (read on 2026-11-15, see A11y): roles, name, Tab into the checked radio, Space and the four arrows (the ends of a group are the platform's, see A11y) |
| Forced colors | test | `e2e/forced-colors.spec.ts` (the Radio cases, three engines): checked, unchecked and disabled radios and buttons stay apart |
| IME | n/a | a radio has no text input |
| Touch | test | `e2e/radio.spec.ts` (emulated touch, three engines): a tap on the mark, on the text and on a button selects; the hover color after a tap is not asserted (see A11y). A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit) |
| Browser floor | test | `npm run test:floor`: Radio checks (selection, arrows, group behavior, the button corners) in Chromium 90, Firefox 85 and WebKit 15.4, added to `scripts/floor/smoke.cjs` |
| Screen reader | test | `screen-reader/radio.spec.ts`: Orca with Firefox through Guidepup (one walk through the Radio lab at the address /#radio, run in Docker on 2026-11-15, twice) asserts what Orca says: "Newsletter. not selected" for a radio, "Fruit. panel. Pear. selected" when Tab enters a group (the name of the group, then the selected radio, one Tab stop), the same for a group of buttons, the first radio of a group with none selected, and the new radio after an arrow key. NVDA, JAWS, VoiceOver and a phone are **not checked** (and React 59194 reports a VoiceOver problem with this shape); the page and the README say so |

## Страница на сайте

`docs/src/routes/[[lang=lang]]/components/radio/+page.svelte`, en, ru, zh, in the standard pattern (live example, "show
code", API table). The registry entry `Radio` (phase `next`) becomes `now`, and its card on the overview page gets its
silhouette. Tables of props, methods and tokens are compared with the sources by `tests/docs/radio-page.test.ts`, which also
checks that every prop appears in at least one example (the methods are in the API table only).

| Example | Spec items |
|---|---|
| `01-basic` | `Radio`: `checked` (`bind:`), `children`, `onchange` |
| `02-disabled` | `disabled`: a radio, a checked one, a group, an option |
| `03-group` | `RadioGroup` with `bind:value`, `onchange`, `name`; a children-markup version |
| `04-options` | `options` as strings, numbers and objects (`disabled`, `title`, `id`, `required`, snippet `label`, option `onchange`) |
| `05-button` | `RadioButton`; `optionType: 'button'`; `buttonStyle`: outline and solid |
| `06-size` | `size` on button groups (large, medium, small and the aliases) |
| `07-layout` | `orientation`, `vertical` (and which one wins), `block`, a group in a grid |
| `08-controlled` | function binding (a refused selection puts the previous radio back), `preventDefault()` in a forwarded `onclick`, `value = undefined` |
| `09-semantic` | `classNames`, `styles`, `class`, `style` of the three components |
| `10-labels` | accessible name: `children`, `aria-label`, `aria-labelledby`, external `<label for>`, naming a group, `aria-describedby`, `title` |
| `11-native` | `name`, `value`, `required` in a `<form>`; the submitted `FormData`; an unnamed group sends nothing; the state reset in `onreset` |
| `12-keyboard` | Tab, the arrows and Space in a group (a note on the platform differences) |

The methods `focus()` and `blur()` are in the API table of the page and have no example of their own (the rule of 2026-11-16: a method with no visible result is not a demo); the unit tests and the browser tests of the methods stay.

## Implementation notes (2026-11-15)

Files: `src/lib/Radio/` (`Radio.svelte`, `RadioButton.svelte`, `RadioGroup.svelte`, `context.ts`, `options.ts`, `types.ts`, `README.md`),
the `--ads-radio-*` tokens in `tokens.css` (light, dark) and the three overrides of `tokens-accessible.css`. The three components
are written from this specification and the public sources named above; nothing of the implementation of Ant Design was read.

What the work found out (each is now a test or a rule):

- **The group writes the state to every radio.** A function binding that refuses a change must put the previous radio back, and the
  browser has already unchecked it. The loop in `RadioGroup.select()` that calls every radio's `sync()` does it; the three tests of
  a refused change fail when the loop is removed (tried).
- **A button draws its own focus ring through its input.** The root has the border and the fill, the transparent input with
  `appearance: none` covers the border box and has the outline, so no `:has()` is needed (the floor engines do not know it).
- **WebKit does not wrap the arrow keys at the ends** of a group of native radios; Chromium and Firefox do. The e2e compares the group
  with native radios of one name in the same engine. Text and spec say "platform", not "wrap".
- **The documentation site's own CSS** had `.demo-pre input:not([type='checkbox'])`, which gave the hidden radio input a height, a
  padding and a border; it now excludes radios as well. `verify-build.mjs` also fails on a lone `<code>undefined</code>` in a text.
- **Touch emulation keeps the hover color after a tap** in Firefox and WebKit, as for every component; not asserted.
- **Orca says nothing for a one-letter name**: the buttons "S", "M", "L" were read as just "selected" (in a minimal page too, whatever
  the markup), "Small", "Medium", "Large" are read in full. A quirk of Orca, not of the component; the lab uses words. `xvfb-run` hung in
  the container once (the test never started); starting Xvfb by hand works (noted in `screen-reader/README.md`).
- **Wrapping (2026-11-16, the maintainer's remark):** the group is `display: inline-flex` with `flex-wrap: wrap`, as the group of Ant Design is an
  inline box: items that do not fit go to the next line (plain radios and buttons; `e2e/radio.spec.ts`, "a group that does not fit"). What was
  wrong was the page of the site: its examples put several groups into the one flex row of a demo, so they stood side by side. Each example
  is now a `stack` (a grid with the items at the start): every group and every separate control on its own line, a control with its status in
  a `row`.
- The label is 21.98 px high (14 px at a line height of 1.5714), not 22; the target-size test allows 21.9.
- Measured on the React demo and used: the dot is 6 px, the label has 8 px on both sides, the buttons are 24, 32 and 40 px high with
  7, 15 and 15 px of padding and a 4, 6 and 8 px radius, the hover, pressed and disabled colors in the "Colors" section, and `block`.

Tests (this branch): unit `tests/Radio.test.ts` (100, run for `Radio` and `RadioButton`), `tests/RadioGroup.test.ts` (77), the Radio rows
of `tests/tokens.test.ts` and `tests/docs/radio-page.test.ts`; coverage of `src/lib/Radio` is 100 % of statements, branches and
functions. Browser: `e2e/radio.spec.ts` (62 tests, three engines), the five Radio cases of `e2e/forced-colors.spec.ts` (three engines;
shown to fail without the `forced-colors` CSS), the Radio page tests of `docs/e2e/site.spec.ts` (13).

Checks run on 2026-11-15 and 2026-11-16, in the worktree of the branch: `npm run test:affected` without `--quick` (the plan was "everything", because
`tokens.css` changed): lint, types, `check:docs` with the quality matrix, 2717 unit tests with the coverage thresholds, the package, the library e2e
(1186) and the site e2e (1161), in Chromium, Firefox and WebKit, all green. `npm run test:floor` (Chromium 90, Firefox 85, WebKit 15.4):
25 of 25 in each engine, seven of them the Radio checks, and the CSS audit finds no rule that the floor engines do not know. Mutation testing,
`npm run test:mutation -- --target=Radio --file=<file>`: `Radio.svelte` 100 % (36 killed, 1 invalid), `RadioButton.svelte` 100 % (39, 1 invalid),
`RadioGroup.svelte` 100 % (23); no survivor. Orca: see the matrix. **Not checked:** NVDA, JAWS, VoiceOver, a real touch device and a real Safari.

## Список тестов

Each item is at least one test; the test name is the item. Unit tests are `tests/Radio.test.ts`,
`tests/RadioButton.test.ts`, `tests/RadioGroup.test.ts`.

Radio and RadioButton:

- Default render: a `<label>` root with an `<input type="radio">`, unchecked, no `label` part without `children`; a button has
  no `icon`.
- `checked`: initial `true` / `false`; `bind:checked` updates the parent; plain `checked={x}` selects locally; a later change
  of the prop by the parent updates the input without `onchange`.
- `disabled`: native `disabled`; no `onchange` on a click on the mark or the text; not in the Tab order; the class.
- `value`: a string, a number and a boolean are written to the input as text (`"1"`, `"false"`); `0` and `false` count as values; absent keeps the native `on`.
- `children`: rendered in the `label` part and is the accessible name; absent renders none.
- `onchange`: once per selection with `(true, event)` and `event.target` the input; via a click on the text; via Space; not
  when a checked radio is clicked again; once each for rapid clicks on different radios; not while disabled; not on a prop change.
- Function binding: a parent that refuses keeps the input unchecked; one that accepts it checks.
- A forwarded `onclick` with `preventDefault()` cancels the selection and `onchange`; a forwarded `onclick` runs once per
  click on the mark and on the text.
- `classNames` and `styles`: each part gets its class and style; appended; kebab-case keys, custom properties, numbers as-is;
  override the token value; update reactively; removed when cleared. `title` is on the root label.
- Native attributes: `id`, `required`, `aria-label`, `aria-labelledby`, `data-*`, `tabindex`, `onfocus` / `onblur`; `type`, `checked`
  and `onchange` are not overridable. An external `<label for>` names the radio and a click on it selects.
- Native form reset: after `form.reset()` the input is put back to the state; a parent that resets in `onreset` gets a
  matching radio; a reset after removal does nothing and does not throw.
- `focus()` and `blur()`.
- Reactivity: `disabled` and `children` re-render.
- Axe: named by `children`, `aria-label`, `aria-labelledby`, `<label for>`; checked, disabled; an unnamed radio is reported.

RadioGroup:

- `value`: initial; `bind:value` updates the parent; plain `value={x}` selects locally; a parent change re-renders without
  `onchange`; an unknown value checks nothing and is kept; `undefined` and `null` clear the selection; `1` and `'1'` differ;
  `false` and `0` select their radios and come back unchanged in `onchange` (a yes / no group with `true` and `false`).
- `options`: strings, numbers, objects; `label` as a string and as a snippet; a disabled option; `title`, `id`, `required`, `class`,
  `style` and `onchange` of an option; changed options re-render; empty `options` renders `children`; non-empty `options`
  ignores `children`.
- `optionType`: `'button'` renders `RadioButton`s; children keep their type; an invalid value throws outside production and
  falls back in production.
- `buttonStyle`, `size`, `orientation`, `vertical`, `block`: the classes and the computed look (heights 24 / 32 / 40, the
  aliases, invalid values), plain radios ignore `size`; `vertical` alone lays the items out in a column; `orientation` wins
  over `vertical` in both directions (`orientation: 'horizontal'` with `vertical` stays horizontal); changed at runtime.
- Children mode: a `Radio` with `value` reads its state from the group, its own `checked` is ignored, nested radios (a grid)
  take part; a radio without `value` throws outside production and stays standalone in production.
- `disabled` and `name`: the group disables every item, an item's own `disabled` disables that item; the group's `name` wins;
  with no `name` the generated name is the same for all inputs, differs between two groups and is stable between server and
  client rendering.
- `onchange`: once per selection with the value and the event; the item's `onchange` runs first; the option's in `options`
  mode; not on a parent change; not when the checked radio is selected again; a function binding that refuses puts the
  **previous** radio back and leaves exactly one checked.
- `classNames` and `styles`: `root`, `item`, `itemIcon`, `itemLabel` reach every radio in both modes and combine with the
  item's own; `itemIcon` does nothing for buttons; `class` / `style` and native attributes reach the root; `role` is not
  overridable.
- Forms: a named group submits the `name` / `value` pair of the checked radio; an unnamed group submits nothing, yet its
  arrow keys work inside a `<form>`; a native reset restores the group's `value`.
- Group integration: an example with `bind:value`, a button group and a disabled option.
- Axe: a group named with `aria-labelledby`, `aria-required` and `aria-invalid` on it, a checked and a disabled item, a button
  group.

Browser (Playwright, `e2e/radio.spec.ts`, three engines):

- Visual states compared with the design tokens: rest, hover on the mark and on the text, checked, checked hover,
  `:focus-visible` ring (keyboard only), disabled (unchecked, checked); buttons: outline and solid, hover, checked,
  checked hover, pressed, focus, disabled, the three sizes, vertical corners; `prefers-reduced-motion`.
- A contrast matrix (state x light with `tokens-accessible.css` / dark): the mark border against the page, the dot against the
  fill, the button border, the text of buttons, the focus ring; and a check that with `tokens.css` alone the default colors are
  Ant Design's own.
- Keyboard (the traces): Tab into a group lands on the checked radio and Shift+Tab leaves and returns to it; with none checked
  Tab lands on the first and Shift+Tab on the first or the last (both accepted); the four arrows move and check; disabled
  radios are skipped; arrows stay in their group when two groups are side by side; after an arrow, Tab away and Shift+Tab back
  the focus is on the checked radio; the group is one Tab stop; at the ends of a group the arrow keys do what native radios of
  one name do in the same engine (a probe of plain inputs in the page is compared with the group).
- The accessibility tree reports a `radiogroup` with `radio`s, `checked: true` on the selected one, and the name of each.
- Layout: toggling `checked` and `disabled` and changing the group's `value` change neither the size of a control nor the
  position of its neighbours, with labels of different width and without a label, in both sizes of a button; the items of a
  group keep their positions; no trailing margin in a vertical group; button widths with texts of different length.
- Events: a `mouseenter` listener on the root fires once while the pointer moves from the mark to the text; a `Tooltip` around a
  `Radio` stays open.
- Target size: the label is a target of at least 22 px, and the radios of a group are at least 8 px apart.
- Right-to-left: the mark is at the inline start; a button group mirrors its corners.
- Forced colors (`e2e/forced-colors.spec.ts`, three engines): checked, unchecked and disabled radios and buttons stay apart.
- Touch (emulated, three engines): a tap on the mark, on the text and on a button selects.
- Orca (`screen-reader/radio.spec.ts`): the name and the state of a radio, the group, an arrow key moving and announcing.
- Floor (`npm run test:floor`): selection, arrows and the one Tab stop in the old engines; the CSS audit for the new rules.
- Mutation testing: `npm run test:mutation -- --target=Radio` for each of the three component files; the score and the files
  are recorded here when it has run.

## Решения и обоснование

- A native `<input type="radio">`, not `<button role="radio">`: the platform gives the role, the state, Space, the arrow keys
  (with the platform's own rule at the ends) and the skip of disabled radios, one Tab stop, forms, and the click on the label. The APG note that some browsers differ on
  the empty-group Shift+Tab is accepted: it is the platform and every user of the browser knows it.
- The hidden input is laid over the mark (not `display: none`), so the focus, the hit area and the mouse events are those of a real
  control; `:focus-visible` is read from the input and drawn on the mark or the button, as in `Checkbox`.
- A shared native name is the whole keyboard story. React 6698 (2017) and the Vue and Angular behavior (every radio a Tab stop) are the
  proof of what is lost without it.
- The group writes its state to every input after a selection because the browser unchecks the previous radio on its own;
  without the write a refused change leaves nothing checked (found while designing; to be shown by a test that fails without it).
- `RadioButton` is its own component and not a mode of `Radio`: its DOM, its states and its tokens differ (no mark, borders that
  collapse, a size), and `optionType` is only a way to ask a group for them.
- `block`, `orientation` and `classNames` / `styles` are cheap and React-only; Vue and Angular lose nothing by their presence.
- Design tokens follow the React documentation and the measurements; the accessible set and the dark theme are ours.
- All code is independently authored for Svelte. Ant Design implementation source was not read.
