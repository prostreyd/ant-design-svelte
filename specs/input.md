# Input specification

Status: scope and open points agreed with the maintainer on 2026-11-11 (workflow stage 2 done); implemented as
written here, with the decisions taken on the way listed under "Decisions taken without a question". Points 1, 3, 4 and 5 were answered one by one, points 2 and 6 to 9 with "давай" to the
proposals that were shown (see "Agreed so far").

The comparison below uses public documentation, not implementation source code.

| Library | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/input> | newest version marker on the page is 6.7.0, 2026-11-10 |
| Ant Design Vue | <https://antdv.com/components/input> | The site returns an empty application shell, so the API tables were read from the documentation markdown file of the repository (`components/input/index.en-US.md`; docs only, no component code) with the maintainer's OK on 2026-11-11. No version is shown there. The Vue page documents `Input`, `TextArea`, `Input.Search`, `Input.Group` and `Input.Password`; there is **no OTP**. |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/input/en> | 22.2.0 (site header), 2026-11-10 |

None of the three pages has an accessibility section, and none says anything about IME composition or
controlled versus uncontrolled behavior beyond the prop tables. The a11y and IME contracts below are
our own, based on the native `<input>` / `<textarea>` and WAI-ARIA, not copied from Ant Design.

## Agreed so far

1. **Vue documentation:** read from the docs markdown on GitHub (docs text only), maintainer's OK, 2026-11-11.
2. **Release scope: all five parts** (maintainer's answer, 2026-11-10): `Input`, `InputTextArea`,
   `InputPassword`, `InputSearch`, `InputOTP`. This overrides the rule 5a default: OTP exists in React and
   Angular only (not in Vue) and its estimate is "expensive" (several cells, focus movement, paste), so by 5a
   it would have gone to v1.1. It is in v1.0 by the maintainer's decision. `InputNumber` is a separate
   component and is not part of this release.
3. **Change callback (open point 1):** `onchange(value, event)` with the React meaning, on every edit, as in
   Switch and Checkbox. The native `oninput` is also forwarded; the native commit `change` is not exposed
   (`onblur` covers the need; an `oncommit` can be added additively). Maintainer's answer, 2026-11-11.
4. **`variant` (open point 3):** taken in v1.0 with the four values; `bordered` is not taken. Answer, 2026-11-11.
5. **`addonBefore` / `addonAfter` (open point 4):** taken as `string | Snippet`. Answer, 2026-11-11.
6. **`count` config (open point 5):** taken in v1.0 (`max`, `strategy`, `show`, `exceedFormatter`). Answer,
   2026-11-11.

7. **Open points 2, 6, 7, 8 and 9:** the maintainer answered "давай" to the proposals shown, 2026-11-11, so they
   are accepted as written: `size` is `medium` with the aliases `middle` and `default`; `showCount.formatter` and
   `count.show` return `string` (the **narrowing** of React's `ReactNode` is accepted; a `count` snippet for markup
   can be added later without a breaking change); the built-in texts are English with `label` overrides, a locale
   mechanism is reserved for v1.1; `visible` and `onvisiblechange` are top-level props of `InputPassword`;
   `classNames` / `styles` exist for all five components, `InputSearch` with one `button` part, the nested button
   parts reserved for v1.1.

Status line above: stage 2 is complete; the draft is the agreed spec.

## Elements

Five components, exported separately (Svelte has no `Input.TextArea` namespace, the Checkbox decision, so the
part name follows the parent name):

| Component | React / Vue / Angular name | Root element |
|---|---|---|
| `Input` | `Input` / `a-input` / `[nz-input]` | `<span class="ads-input">` around a native `<input>` (one element; a group span only with an addon) |
| `InputTextArea` | `Input.TextArea` / `a-textarea` / `[nz-input]` on `<textarea>` | `<span class="ads-input">` around a native `<textarea>` |
| `InputPassword` | `Input.Password` / `a-input-password` / `nz-input-password` | `Input` plus a toggle button |
| `InputSearch` | `Input.Search` / `a-input-search` / `nz-input-search` | `Input` plus a search button |
| `InputOTP` | `Input.OTP` / — / `nz-input-otp` | a group of single-character inputs |

**DOM of `Input` (one element; decision of 2026-11-11).** The field is one element, `<span class="ads-input">` (the `root`
part): the bordered box that holds the `prefix` span, the native `<input class="ads-input-input">`, the clear button, the
`count` span and the `suffix` span, in that order. A plain `<Input />` is `<span class="ads-input"><input></span>`. The
`prefix`, the clear button, the count and the suffix are siblings of the `<input>`, so showing or hiding one adds or removes a
sibling and never re-creates the input: it keeps focus and the caret (React documents a focus loss when its structure
changes; this is avoided for these four). The clear button keeps its place in the layout and is hidden with `visibility` while
there is nothing to clear, so the size of the control and the neighbours do not move when it appears.

The addons need a second element. While at least one of `addonBefore` / `addonAfter` is set, the field is wrapped in
`<span class="ads-input-group">` holding the addon cells and the field; the group is then the `root` part (`class`, `style`,
`classNames.root` and `styles.root` go to it) and carries the same look classes as the field (size, variant, status, disabled),
so the cells read the same colours. Going from no addon to one, or from the last addon to none, adds or removes the group, so
the `<input>` is created again and loses focus; changing between one and two addons keeps it. This is a deliberate trade-off:
addons are a static decoration in practice (`https://` and `.com`), while a prefix, a suffix, a clear button and a count do
come and go while the user types. A bare `<input>` with no element around it was rejected: it would re-create the field every
time one of those four comes and goes (the Ant Design React behavior).

Semantic parts (our own DOM, not a copy of the React lists, whose part-to-component mapping the page leaves
unclear): `Input` and `InputPassword`: `root`, `prefix`, `input`, `suffix`, `clear`, `count`;
`InputTextArea`: `root`, `textarea`, `clear`, `count`; `InputSearch`: the `Input` parts plus `button`
(open point 9); `InputOTP`: `root`, `input`, `separator`.

**The other DOMs.** `InputTextArea`: `<span class="ads-input ads-input-multiline">` (root, the bordered box) > the `<textarea>`, the clear button
(in a corner holder) and the count row. `InputPassword` and
`InputSearch` render an `Input` and pass it a `suffix` snippet with their button; `InputSearch` wraps it in
`<span class="ads-input-search">` (its root), next to the `enterButton` (a primary `Button` joined to the field, whose start
radii are 0). `InputOTP`: `<div role="group" class="ads-input-otp">` with one `Input` per cell and the separators between.

Icons (clear, eye, eye-off, search, spinner) are drawn from scratch as small inline SVGs with plain geometry,
not the Ant Design icon paths.

## API: Input

`InputSize = 'large' | 'medium' | 'middle' | 'small' | 'default'`, `InputStatus = 'error' | 'warning'`,
`InputVariant = 'outlined' | 'filled' | 'borderless' | 'underlined'` are exported types.

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `value` | `string` (`$bindable`) | `''` | Current text. `bind:value` for two-way use; plain `value={x}` is an initial value (there is no `defaultValue`, the Switch and Checkbox decision). `undefined` and `null` are treated as `''`. A function binding `bind:value={() => v, (next) => ...}` can refuse a change: after every user edit the component reads the prop back and writes it to the input (the caret moves to the end, as for any programmatic write). |
| `type` | `string` | `'text'` | Native `type`. Supported and tested: `text`, `search`, `email`, `tel`, `url`, `number`. `password` is the `InputPassword` job. Types that do not hold text (`file`, `checkbox`, `radio`, `range`, `color`, buttons) are outside the contract. With `number` the value is still the string the input reports. |
| `disabled` | `boolean` | `false` | Native `disabled`: not focusable, no edit; the clear icon and the affixes use the disabled colors. |
| `size` | `InputSize` | `'medium'` | `medium` is the React name; `middle` (Vue) and `default` (Vue, Angular) are compatibility aliases (open point 2). Heights from the React page: large 40px, medium 32px, small 24px. |
| `variant` | `InputVariant` | `'outlined'` | Visual variant (open point 3). |
| `status` | `InputStatus` | — | Validation look: `error` red, `warning` yellow. `error` also sets `aria-invalid="true"` (our contract; `warning` has no ARIA state). |
| `prefix` | `string \| Snippet` | — | Content before the text, inside the field. |
| `suffix` | `string \| Snippet` | — | Content after the text, inside the field, after the clear icon and the count. |
| `addonBefore` | `string \| Snippet` | — | Cell before the field, outside its border (open point 4). |
| `addonAfter` | `string \| Snippet` | — | Cell after the field (open point 4). |
| `allowClear` | `boolean \| { clearIcon?: string \| Snippet; label?: string; tabIndex?: number }` | `false` | Shows a clear button when there is text and the input is neither disabled nor read-only. A click empties the value, keeps focus in the input, and calls `onchange('', event)` then `onclear()`. `label` is the accessible name of the button (default `Clear`, English; open point 7); `tabIndex: -1` removes it from the Tab order (default 0). |
| `showCount` | `boolean \| { formatter: (info: CountInfo) => string }` | `false` | Shows the length of the value in the `count` part. `CountInfo = { value: string; count: number; maxLength?: number }`. Default text is `count` or `count / max` (open point 6 for the formatter type). |
| `count` | `{ max?: number; strategy?: (value: string) => number; show?: boolean \| ((info: CountInfo) => string); exceedFormatter?: (value: string, config: { max: number }) => string }` | — | Custom counting (open point 5). `max` is a soft limit: past it the count turns red and `aria-invalid` is set, the text is not cut. `strategy` replaces the length function (for example one emoji counts 1). `exceedFormatter` cuts the value when it passes `max`; without it nothing is cut. |
| `maxlength` | `number` | — | The native attribute (React `maxLength`, Vue `maxlength`): the browser stops the input at the limit. For a limit that only warns use `count.max`. |
| `onchange` | `(value: string, event: Event) => void` | — | Called once per user edit with the new text and the event of the edit: the native `input` event, or `compositionend` when the browser ends an IME composition before its last `input` event (see "IME composition") (open point 1). Not called for a change of `value` made by the parent. Not called while disabled. |
| `onpressenter` | `(event: KeyboardEvent) => void` | — | Called on Enter (`keydown`), not while an IME composition is open. |
| `onclear` | `(event: MouseEvent) => void` | — | Called after the clear button emptied the value (React 5.20.0, Angular `nzClear`). The click event is passed (React and Angular pass nothing: a function that takes no arguments still fits); `InputSearch` needs it for `onsearch`. |
| `classNames` | `Partial<Record<'root' \| 'prefix' \| 'input' \| 'suffix' \| 'clear' \| 'count', string>>` | — | Classes appended to the part (open point 9). |
| `styles` | `Partial<Record<…the same parts…, Record<string, string \| number>>>` | — | Inline styles of the part, written after the component's own (the Switch contract: kebab-case keys or custom properties, numbers as-is). |
| `class`, `style` | `string` | — | Root element, as in Switch. |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>`: `id`, `name`, `placeholder`, `readonly`, `required`, `autocomplete`, `autofocus`, `tabindex`, `form`, `inputmode`, `aria-*`, `data-*`, `onfocus`, `onblur`, `onkeydown`, `oninput` and other handlers. The component owns `value`, `disabled`, `maxlength` (passed through) and `onchange`, which has the `(value, event)` shape. |

**Methods** (through `bind:this`): `focus(options?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' })`
and `blur()`. `select()` and `setSelectionRange()` are in none of the three pages and are not taken (a method
can be added additively later).

## API: InputTextArea

Everything of `Input` that makes sense for a multi-line field: `value`, `disabled`, `size`, `variant`, `status`,
`allowClear` (the button sits at the top end), `showCount`, `count`, `maxlength`, `onchange`, `onpressenter`,
`onclear`, `classNames` / `styles` (parts `root`, `textarea`, `clear`, `count`), `class`, `style`, native
attributes (`HTMLTextareaAttributes`: `rows`, `cols`, `placeholder`, `readonly`, `name`, ...), `focus()`,
`blur()`. No `type`, `prefix`, `suffix`, `addonBefore`, `addonAfter` (none of the versions has them on the
textarea). Extra:

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `autoSize` | `boolean \| { minRows?: number; maxRows?: number }` | `false` | The height follows the content: set to the measured content height after every change of the value, of the width (`ResizeObserver`) and of the font load, clamped to `minRows` and `maxRows` lines of the current line height. With a `maxRows` the field then scrolls. It replaces manual resizing (`resize: none` while on). `true` has no clamp. |

## API: InputPassword

All of `Input` except `type` (the component owns it: `password` or `text` by `visible`). `prefix`, `suffix` and the
addons stay (React supports `suffix` on the password from 5.27.0). Extra:

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `visible` | `boolean` (`$bindable`) | `false` | Whether the text is shown (`type="text"`) or hidden (`type="password"`). |
| `visibilityToggle` | `boolean \| { tabIndex?: number; label?: string }` | `true` | Shows the toggle button. `false` hides it, so `visible` is the only control (the Vue and React meaning). `label` is its accessible name (default `Show password`; the button has `aria-pressed` that follows `visible`, so the name does not change). `tabIndex` as for the clear button (React 6.5.0). |
| `onvisiblechange` | `(visible: boolean) => void` | — | Called once per user toggle (React `onVisibleChange`, Angular `nzVisibleChange`). |
| `iconRender` | `Snippet<[visible: boolean]>` | — | Custom toggle content (React function, Vue slot). |

## API: InputSearch

All of `Input` stays. Extra:

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `enterButton` | `boolean \| string \| Snippet` | `false` | A button after the field. `false`: only the search icon inside the field, as a button; `true`: a primary button with the search icon; a string or a snippet: a primary button with that content. Conflicts with `addonAfter`: when both are given the button wins and, outside production, it throws (the invalid-option rule of Button and Switch). |
| `loading` | `boolean` | `false` | Shows the spinner in place of the search icon; the search action is ignored while it is on (our contract: no page documents it, and it avoids a double request). |
| `onsearch` | `(value: string, event: Event, info: { source: 'input' \| 'clear' }) => void` | — | Called on a click of the search icon or button, on Enter (not while composing) and on the clear button. `source` is `'clear'` for the clear button and `'input'` otherwise (React and Angular; Vue passes `(value, event)`). |
| `searchIcon` | `string \| Snippet` | — | Custom search icon (React 6.4.0; cheap: a replaced child). |

## API: InputOTP

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `value` | `string` (`$bindable`) | `''` | The characters entered so far (no gaps; at most `length`). |
| `length` | `number` | `6` | Number of cells. |
| `mask` | `boolean \| string` | `false` | Hides the characters; `true` shows a bullet, a string is the single character shown instead. The value is not changed. A string of more than one character is outside the contract (React warns; outside production we throw, in production the first character is used). |
| `formatter` | `(value: string) => string` | — | Maps the whole text to the displayed text; cell `i` shows the `i`-th character of the result (a shorter result leaves the rest empty, a longer one is cut to the cells). The pages of React and Angular only say that the display is formatted and blank cells get a placeholder; this is our reading. The mask wins over it. |
| `separator` | `string \| Snippet<[index: number]>` | — | Rendered after the cell at `index`; the snippet form covers the static and the function form of React. |
| `disabled`, `size`, `variant`, `status` | as in `Input` | | Applied to every cell. |
| `autocomplete` | `string` | — | Forwarded to the cells (React 6.3.0); `one-time-code` enables autofill. |
| `onchange` | `(value: string) => void` | — | Called when every cell is filled (React: "all fields filled"). |
| `oninput` | `(values: string[]) => void` | — | Called on each change, with one entry per cell (React 5.22.0). |
| `classNames`, `styles` | parts `root`, `input`, `separator` | — | As for `Input`. |

Behavior: each cell is an `Input` (so the sizes, variants and statuses are those of the input) and the characters
live in one string, so there are never gaps. Typing a character fills the cell and moves focus to the next one (the
focused cell is selected, so a typed character replaces the one it holds); Backspace on a filled cell removes its
character and the rest move left, on an empty cell it removes the previous character and goes back; Delete removes the
character of the focused cell; ArrowLeft and ArrowRight move between cells (mirrored in right-to-left); pasting text
fills the cells from the current one, dropping what does not fit (an empty paste changes nothing); a whole code arriving
in one cell (autofill) is spread the same way; one character per cell (an emoji is one); a cell past the first empty one
hands focus to the first empty cell; an IME composition in a cell is ignored until it ends. `separator` is rendered
after every cell but the last. The group is `role="group"`; the `aria-label` / `aria-labelledby` of the component name
the group (they reach the `<div>`); each cell is named `Character i of n` (English; a locale mechanism is reserved for
v1.1). `focus()` goes to the first empty cell (the last one when all are filled) and `blur()` to whichever cell has focus.

## Поведение / Behavior (shared)

- **Edits.** A user edit copies the native `value` into `value`, then calls `onchange(value, event)`. A change
  of the prop by the parent updates the input and calls nothing. Rapid repeated edits each call once.
- **IME composition.** `onchange` is called during composition as the native `input` event is (the value follows
  the text on screen). At the end of a composition it is still called once per edit, with the event that carried
  the text: Chromium fires its last `input` before `compositionend`, so `onchange` gets that `input` event and
  `compositionend` changes nothing; Firefox fires `compositionend` before the last `input` (seen with the commit of
  a composition in the browser tests), so `onchange` gets the `compositionend` event and the `input` after it
  changes nothing. The text and the number of calls are the same; only `event.type` differs. (Clarified on
  2026-11-11 after the first run of the browser tests in Firefox; the behavior of the component did not change.) `onpressenter` and `onsearch` by Enter are not called while `event.isComposing` is true
  (the Enter that confirms a candidate must not submit). `count.exceedFormatter` and `count.max` clipping are
  applied at `compositionend`, not in the middle of a composition. The browser's own `maxlength` is native and
  untouched. Checked in the browser with composition events, since jsdom has no IME.
- **Controlled refusal.** `bind:value` with a function binding can refuse an edit; the input is written back from
  the prop after every edit. The `InputOTP` cells behave the same.
- **Form reset.** `form.reset()` is followed one task later by writing the state back to the input; the state is
  the truth and the parent resets it in `onreset` (the Checkbox rule).
- **Clear button.** Shown only while `value` is non-empty, not disabled, not read-only. `mousedown` on it does not
  take focus from the input; after the click the input is focused. Enter or Space on the focused button clicks it.
  Hidden with `visibility`, so it is out of the Tab order and the accessibility tree while hidden and the layout
  does not move.
- **Count.** The default count is the length of the string in Unicode code points (an emoji outside the Basic
  Multilingual Plane counts 1, a combined emoji sequence counts as several); `count.strategy` replaces it. Over a
  soft `count.max` the count part gets the error class.
  The count is linked to the input by `aria-describedby` and is not a live region (it would announce every key).
- **Layout stability.** Toggling `status`, `loading`, `visible`, `disabled`, the clear icon and the count never
  changes the size of the control or the position of its neighbours; the `InputSearch` button and the password
  toggle have a fixed size (checked in the browser with text of different widths, in all sizes).
- **No native spinner confusion:** `type="number"` keeps the native steppers; `nzStepperless` (Angular) is not taken.
- `styles` values are applied after the component's own, so a consumer value wins.

## A11y

- Native `<input>` / `<textarea>`: role, Tab order, selection, autofill, form participation, spellcheck and the
  `disabled` / `readonly` states come from the platform.
- **An accessible name is required** and is the consumer's job (`<label for>` and `id`, `aria-label`,
  `aria-labelledby`); the component has no label of its own. Axe reports an unnamed input (negative check).
- `status="error"` and a soft `count.max` overflow set `aria-invalid="true"`; the count and any consumer hint are
  joined to the input by `aria-describedby` (the consumer's own ids are kept).
- The clear, toggle and search buttons are native `<button type="button">` with an accessible name; they stay in
  the Tab order unless `tabIndex` says otherwise; their icons are `aria-hidden`.
- Focus: `:focus-visible` on the input (and on the buttons) draws the outline from the design tokens, at least
  3:1 against the page. The focused look of a mouse click on the field (border color and ring) is the "active"
  state of the React page and is not a keyboard-only cue.
- Non-text contrast (WCAG 1.4.11) and text contrast: on `tokens-accessible.css` in the light theme and on the
  dark theme the border of the field against the page, the placeholder against the field (4.5:1), the clear icon
  and the focus ring reach their ratios in the rest, hover and focus states; the default light set is Ant Design's
  own and does not reach them (see "Colors"). Disabled is exempt (WCAG).
- `prefers-reduced-motion: reduce` disables the border transition and the textarea height animation.
- Logical properties throughout: the prefix at the inline start, the clear button and the suffix at the inline
  end, the addons mirror; e2e in right-to-left.
- Keyboard of `InputOTP` as in Behavior; `InputSearch`: Enter searches; `InputPassword`: the toggle is a button
  (Enter and Space).

## Colors and dimensions

The default light values are those of the React token tables (read 2026-11-11):

| Token | Value | Token | Value |
|---|---|---|---|
| `activeBg` / `hoverBg` | `#ffffff` | `inputFontSize` / `LG` / `SM` | 14 / 16 / 14 px |
| `activeBorderColor` | `#1677ff` | `paddingBlock` / `LG` / `SM` | 4 / 7 / 0 px |
| `hoverBorderColor` | `#4096ff` | `paddingInline` / `LG` / `SM` | 11 / 11 / 7 px |
| `activeShadow` | `0 0 0 2px rgba(5,145,255,0.1)` | `addonBg` | `rgba(0,0,0,0.02)` |
| `errorActiveShadow` | `0 0 0 2px rgba(255,38,5,0.06)` | `warningActiveShadow` | `0 0 0 2px rgba(255,215,5,0.1)` |

Global tokens it uses: border `colorBorder` `#d9d9d9` (disabled `colorBorderDisabled` `#d9d9d9`), disabled
background `colorBgContainerDisabled` `rgba(0,0,0,0.04)`, `filled` background `colorFillTertiary`
`rgba(0,0,0,0.04)`, error `colorError` `#ff4d4f` (background `colorErrorBg` `#fff2f0`), warning `colorWarning`
`#faad14` (background `colorWarningBg` `#fffbe6`), text `colorText` `rgba(0,0,0,0.88)`, disabled text
`colorTextDisabled` `rgba(0,0,0,0.25)`, radius `borderRadius` 6 / `borderRadiusLG` 8 / `borderRadiusSM` 4 px,
heights `controlHeightLG` 40 / 32 / `controlHeightSM` 24 px, `fontSize` 14 px, `lineHeight` 1.5714285714285714 (the exact value matters: the rounded 1.5714 makes a medium field 31.98px high, not 32),
`lineHeightLG` 1.5, `lineWidth` 1 px, `paddingXS` 8 px, `paddingXXS` 4 px, `motionDurationSlow` 0.3s. The tokens
are `--ads-input-*` in `tokens.css`, each consumed by a component. Heights are 40 / 32 / 24 px as in the demo
titles of the React page; the radius is 6 px for medium, 8 px for large and 4 px for small (`borderRadius`,
`borderRadiusLG` and `borderRadiusSM`). The error and warning shadows and the `filled` look are taken from these tables; the
`underlined` look (a bottom border only, no radius) is ours: the page gives no values for it.

Ours, as for Checkbox: the default placeholder (`rgba(0,0,0,0.25)`, the page gives no placeholder token) is 1.83:1
against white and `tokens-accessible.css` darkens it to reach 4.5:1; the default border is 1.41:1, so the accessible
set darkens it to `#737373` (4.74:1, 3:1 is needed for a control's boundary), as for Checkbox and Switch; the dark
theme is set separately. The disabled colors are exempt (WCAG).

## Scope v1.0

- **Ядро (React ∩ Vue):** `Input` (`value`, `type`, `disabled`, `size`, `status`, `prefix`, `suffix`,
  `allowClear`, `showCount`, `maxlength`, change callback, `onpressenter`); `InputTextArea` (`autoSize`,
  `allowClear`, `showCount`); `InputPassword` (`visible`, `visibilityToggle`, `iconRender`); `InputSearch`
  (`enterButton`, `loading`, `onsearch`). Vue's `addonBefore` / `addonAfter` exist in React too (deprecated
  there): open point 4.
- **Дешёвые React-дополнения (≤ 1 дня, обязательны по правилу 5a):**
  - `onclear` (React 5.20.0, also Angular): minutes.
  - `focus({ preventScroll, cursor })` (React 4.10.0, also Angular): about an hour.
  - `allowClear` object form: `clearIcon`, `label`, `tabIndex` (`label` and `tabIndex` 6.7.0): a few hours.
  - `visibilityToggle` object form `tabIndex` (6.5.0), `onvisiblechange`: about an hour.
  - `searchIcon` (6.4.0): minutes.
  - `variant` (React 5.13.0, also Angular): open point 3.
  - `count` config (React 5.10.0, also Angular 21.2.0): open point 5.
  - `classNames` / `styles`: open point 9.
- **Expensive, but in v1.0 by the maintainer's decision:** `InputOTP` (React 5.16.0 and Angular; not in Vue).
- **Зарезервировано на v1.1:** the nested `classNames` / `styles` of the `InputSearch` button (`button.root`,
  `button.icon`, `button.content` in React 6.0.0): reserved as the keys `button` with the same shape
  (`{ root?, icon?, content? }`); v1.0 has the plain string / style for `button` (open point 9). A locale
  mechanism for the built-in texts (`Clear`, `Show password`, `Search`, `Character n of m`): reserved, the
  `label` options below are the v1.0 way.
- **Не берём (Vue-only):** `bordered` (Vue 4.5.0; deprecated in React; `variant="borderless"` is the same look);
  the `Input.Group` `compact` prop (deprecated in React, removed in NG-ZORRO 22; the compact grouping belongs
  to a future `Space.Compact`); `iconRender` as a "slot" name (it is a snippet prop).
- **Не берём (Angular-only):** `nzStepperless`; `nz-textarea-count` with `nzMaxCharacterCount` and
  `nzComputeCharacterCount` (covered by `count.max` / `count.strategy`); the deprecated `nz-input-group`
  (`nzAddOnBefore` / `nzAddOnAfter` spelled with a capital O, replaced by the wrapper's `nzAddonBefore`).
- **Не берём (React-only, не подходит для Svelte):** `defaultValue` (`$bindable` covers it); the function form of
  `classNames` / `styles` (a Svelte consumer computes the object in `$derived`); the `allowClear.disabled` field
  (6.4.0; the same as `allowClear={false}`); `Form.Item` auto-wiring of `value` / `id` (there is no form wrapper
  in this library; the inner "medium inside a Form" size rule does not apply); the focus-loss workaround of the
  React FAQ (the structure is stable, see "Elements"); `nativeElement`-style access (use `id` or a wrapper).

## Таблица различий по уровням

| Уровень | React (6.7.0) | Vue (docs markdown) | Angular (22.2.0) | Расхождение | Решение для Svelte |
|---|---|---|---|---|---|
| **Наличие** | `Input`, `.TextArea`, `.Search`, `.Password`, `.OTP`; `Input.Group` deprecated | `a-input`, `a-textarea`, `a-input-search`, `a-input-password`, `a-input-group`; **no OTP** | `[nz-input]` (input and textarea), `nz-input-wrapper`, `nz-input-search`, `nz-input-password`, `nz-input-otp`; `nz-input-group` deprecated | OTP in two of three; Group is going away | Five components; Group not taken |
| **API** | `value`, `defaultValue`, `type`, `size`, `variant`, `status`, `prefix`, `suffix`, `addonBefore/After` (deprecated), `allowClear`, `showCount`, `count`, `maxLength`, `onChange`, `onPressEnter`, `onClear`, `classNames`, `styles` | `value` (v-model), `defaultValue`, `type`, `size`, `bordered`, `status`, `prefix`, `suffix`, `addonBefore/After`, `allowClear` + `clearIcon` slot, `showCount`, `maxlength`, `change`, `pressEnter` | `nzSize`, `nzVariant`, `nzStatus`, `nzStepperless`; wrapper: `nzAddonBefore/After`, `nzPrefix`, `nzSuffix`, `nzAllowClear`, `nzShowCount`, `nzCount`, `(nzClear)` | `size` names; `variant` vs `bordered`; `onChange` timing vs native (open points 1, 2, 3) | React names, lower-case callbacks, table above |
| **Поведение** | `onChange` per edit; `onSearch` on icon, Enter and clear (with `source`); `count.max` warns, `maxLength` cuts; autoSize `{minRows, maxRows}`; OTP `onChange` when full, `onInput` per change; clear shown when non-empty | `change` per edit; `search(value, event)`; `autosize`; Vue `maxlength` | `nzSearch` emits `{value, event, source}`; count over max in red, not cut; `nzAutosize` | `source` argument is not in Vue | React semantics; written in Behavior |
| **a11y** | not documented; only `allowClear.label` and `tabIndex` options (6.7.0) | not documented | not documented | — | Native elements; `aria-invalid`; named buttons; contract above |
| **Кастомизация** | `classNames` / `styles` (object or function), `clearIcon`, `iconRender`, `searchIcon`, `separator`, `enterButton` node | `clearIcon`, `iconRender`, `enterButton` slots | `nzAddonBefore/After`, `nzPrefix`, `nzSuffix` strings (templates only in the deprecated group) | React is the richest | Snippets (and strings where all three accept one), `classNames` / `styles` objects |

## Формы значений по пропсам / Value forms per prop

| Prop | React | Vue (docs markdown) | Angular | Svelte | Note |
|---|---|---|---|---|---|
| `value` | `string` (+ `defaultValue`) | `string` (v-model, + `defaultValue`) | `[ngModel]` | `string` (`$bindable`) | Same form |
| `type` | `string` | `string` | native | `string` | Same |
| `size` | `large \| medium \| small` | `large \| middle \| small` (Group: `default`) | `large \| default \| small` | `medium` + aliases | Semantics differ, open point 2 |
| `variant` | 4 strings | — (`bordered: boolean`) | 4 strings | 4 strings | Open point 3 |
| `status` | `'error' \| 'warning'` | same | same | same | Same |
| `prefix`, `suffix` | `ReactNode` | `string \| slot` | `string` (wrapper), `string \| TemplateRef` (group) | `string \| Snippet` | Every form covered |
| `addonBefore/After` | `ReactNode` (deprecated) | `string \| slot` | `string` (wrapper), `string \| TemplateRef` (group) | `string \| Snippet` | Open point 4 |
| `allowClear` | `boolean \| { clearIcon: ReactNode; disabled: boolean; label: string; tabIndex: number }` | `boolean` (+ `clearIcon` slot, 3.3.0) | `boolean` | `boolean \| { clearIcon: string \| Snippet; label; tabIndex }` | `disabled` not taken; `clearIcon` covers the string and the node forms |
| `showCount` | `boolean \| { formatter(info): ReactNode }` | `boolean \| { formatter(info): string }` | `boolean` | `boolean \| { formatter(info): string }` | **Narrowing** of the formatter result (open point 6) |
| `count` | object; `show: boolean \| function` | — | object (`max`, `strategy`, `exceedFormatter`) | same keys | Open point 5 |
| `maxLength` | `number` | `number` (`maxlength`) | native | `number` (`maxlength`) | Native name |
| Change | `onChange(e)` | `change(e)` | — (forms / native) | `onchange(value, event)` | Open point 1 |
| Enter | `onPressEnter(e)` | `pressEnter(e)` | — (native `keydown.enter`) | `onpressenter(event)` | Same |
| Clear callback | `onClear()` | — | `(nzClear)` | `onclear()` | Same |
| `focus` | `focus({ preventScroll, cursor })`, `blur()` | — (not on the page) | same as React | same as React | Same |
| `classNames` / `styles` | objects or functions | — | — | objects | Function form not taken |
| TextArea `autoSize` | `boolean \| { minRows, maxRows }` | `boolean \| object` (`autosize`) | `boolean \| { minRows, maxRows }` | `boolean \| { minRows?, maxRows? }` | Same |
| Password `visible` | in `visibilityToggle` object (`visible`, `onVisibleChange`, `tabIndex`) | `visible` (v-model), `visibilityToggle: boolean` | `nzVisible` (two-way), `(nzVisibleChange)`, `nzVisibilityToggle` | top-level `visible` (`$bindable`), `onvisiblechange`, object `{ tabIndex, label }` | React keeps the controlled state inside the object; we take the Vue / Angular top-level form (open point 8) |
| Password `iconRender` | `(visible) => ReactNode` | slot | — | `Snippet<[boolean]>` | Same |
| Search `enterButton` | `ReactNode` (`false` / `true` / node) | `boolean \| slot` | `boolean \| string` | `boolean \| string \| Snippet` | Every form covered |
| Search `onSearch` | `(value, event, { source })` | `(value, event)` | `{ value, event, source }` | `(value, event, { source })` | React's three arguments |
| OTP `mask` | `boolean \| string` | — | `boolean \| null` | `boolean \| string` | Angular accepts less |
| OTP `separator` | `ReactNode \| ((i) => ReactNode)` | — | — | `string \| Snippet<[number]>` | Same forms |
| OTP `formatter` | `(value) => string` | — | `(value) => string` | `(value) => string` | Same |

## Open points (each has a proposal; 1, 3, 4 and 5 are answered, see "Agreed so far")

1. **(Answered: the proposal.)** **The change callback.** React and Vue call `onChange` / `change` on every edit (the native `input` event); in
   Svelte the native `change` event fires on commit (blur), and `oninput` is the per-edit one. *Proposal:*
   `onchange(value, event)` with the React meaning (per edit), as in Switch and Checkbox `(value, event)`;
   the native `oninput` is also forwarded; the native commit `change` is not exposed (`onblur` covers the need;
   an `oncommit` can be added additively). The alternative is to forward the native pair only (`oninput` per
   edit, `onchange` on commit) and have no value-first callback.
2. **`size`.** `medium` (React) against `middle` (Vue) and `default` (Vue, Angular). *Proposal:* `medium` is the
   name; `middle` and `default` are compatibility aliases, the Button and Switch decision.
3. **(Answered: the proposal.)** **`variant`.** React and Angular have four looks; Vue has only `bordered`. Rule 5a lists "full variant
   semantics" as v1.1 for Button, but here it is four static CSS looks (about half a day for the family).
   *Proposal:* take `variant` in v1.0; `bordered` is not taken.
4. **(Answered: the proposal.)** **`addonBefore` / `addonAfter`.** Deprecated in React in favor of `Space.Compact`, present in Vue and Angular.
   This library has no `Space.Compact`, and the addon is the way to build "https://" plus ".com". *Proposal:*
   take them as `string | Snippet`; they stay additive and cost about half a day.
5. **(Answered: the proposal.)** **`count` config** (`max`, `strategy`, `show`, `exceedFormatter`): React and Angular, not Vue; the IME-safe
   clipping makes it about a day, on the edge of "cheap". *Proposal:* take it in v1.0. The alternative is
   v1.1 with the contract above reserved.
6. **`showCount.formatter` result type.** React returns `ReactNode`, Vue `string`. A Svelte function cannot
   return markup without `createRawSnippet`. *Proposal:* `string` (Vue's type) and the `count` part can be
   styled; this is a **narrowing** of React, listed here for your decision. The alternative is a `count`
   snippet prop for markup (`Snippet<[CountInfo]>`), additive and cheap.
7. **Built-in texts** (`Clear`, `Show password`, `Search`, `Character n of m`). There is no locale mechanism
   in the library. *Proposal:* English defaults, overridable per button through the `label` options
   (`allowClear.label`, `visibilityToggle.label`; `enterButton` text for the search button; `aria-label` on
   `InputOTP`); a locale mechanism is reserved for v1.1.
8. **Password state.** React keeps `visible` / `onVisibleChange` inside the `visibilityToggle` object; Vue and
   Angular have them as top-level props. *Proposal:* top-level `visible` (`$bindable`) and `onvisiblechange`; the
   object form keeps `tabIndex` and `label`.
9. **`classNames` / `styles`.** Cheap by the Switch and Checkbox precedent for one component, but the family has
   five components and about 15 parts (rule 5a: estimate per component: `Input` half a day, the others share the
   helper, `InputOTP` a few hours). *Proposal:* take them for all five; `InputSearch` gets one `button` part
   (a string / a style) now, and the nested `button.root` / `button.icon` / `button.content` of React are reserved
   for v1.1 with the key `button` extended to `{ root?, icon?, content? }`.

Decisions taken without a question (a documented convention, cheap and additive, or forced by the rules):
no `defaultValue`; exported names `Input`, `InputTextArea`, `InputPassword`, `InputSearch`, `InputOTP` (the Checkbox
rule); `title` and native attributes go to the `<input>`; an invalid `enterButton` / `addonAfter` pair, an invalid
`mask`, an invalid `length` and an invalid `size`, `variant` or `status` throw outside production; `aria-invalid` for
`error` and for an overflowing soft limit; the clear button keeps focus in the input; `loading` ignores the search
action; the default count is in Unicode code points; one site page for all five parts (the React site does the same);
`onclear` passes the click event; `InputSearch` is `type="search"` unless another type is given; `InputPassword` disables
its toggle together with the field; `InputTextArea` with `autoSize` has one row as its least height (the CSS minimum
is the height of a one-line field) and no manual resize handle; the textarea's count has its own row inside the border and
its clear button sits at the top corner; the `filled` and `borderless` variants have no 3:1 boundary by design (as in Ant
Design), so the contrast tests of the boundary cover `outlined` and `underlined`, and the borderless field draws the
focus outline of the other controls (it has no border to change); the borderless and underlined looks of the focus
state and the `filled` hover background are ours (the React page gives no values).

**`InputSearch` and the loading width (forced by the layout rule).** `Button` adds a spinner before its content when
it loads, which makes the button wider. The search button therefore never gets the `loading` of `Button`: it gets
`aria-busy`, the spinner replaces the icon of an icon-only button, and over a text or snippet content the spinner is
laid on top while the content stays (invisible, so the name and the width do not change). The search action is ignored
while `loading` either way. Checked in the browser, frame by frame.

## Решения и обоснование

- Native `<input>` and `<textarea>` as the root control: forms (`name`, `required`, `FormData`), autofill,
  selection and IME come from the platform. The field is one element around the control, and the prefix, suffix, clear button and count are its siblings, so focus is kept when they change.
- The password and search components wrap `Input` (composition), so every `Input` prop works on them.
- `onchange` carries `(value, event)` like Switch and Checkbox, so a consumer learns one shape.
- Design tokens follow the React token tables; default light colors are Ant Design's, the accessible set and
  the dark theme are ours (Button, Switch, Checkbox).
- All code is independently authored for Svelte. Ant Design implementation source was not used; the Vue column
  comes from its documentation markdown only.

## Страница на сайте

`docs/` page at `/components/input/` (en, ru, zh), one page for all five parts. One live example per spec item; the API,
methods and design tokens tables are compared with the sources by `tests/docs/input-page.test.ts`, which also checks that
every prop of every table is used on its own component in an example and that every example renders with named fields.

| Example | Spec items |
|---|---|
| `01-basic` | `value` (`bind:`), `onchange`, native attributes |
| `02-sizes` | `size`: `large`, `medium`, `small`, the aliases `middle` and `default` |
| `03-variants` | `variant`: all four |
| `04-status` | `status` with every variant |
| `05-disabled` | `disabled`, `readonly` |
| `06-affixes` | `prefix`, `suffix` (text and snippet) |
| `07-addons` | `addonBefore`, `addonAfter` (text and snippet) |
| `08-clear` | `allowClear` (boolean, object with `label`, `tabIndex`, `clearIcon` as text and snippet), `onclear` |
| `09-count` | `showCount` (boolean and formatter), `maxlength` |
| `10-count-config` | `count`: `max`, `strategy`, `show`, `exceedFormatter` |
| `11-controlled` | function binding that refuses an edit, `onpressenter` |
| `12-textarea` | `InputTextArea`: `value`, `allowClear`, `showCount`, `count`, `maxlength`, `status`, `size`, `variant`, `disabled`, `readonly`, `onchange`, `onpressenter`, `onclear` |
| `13-autosize` | `autoSize`: `true`, `minRows`, `maxRows` |
| `14-password` | `InputPassword`: `visible` (`bind:`), `onvisiblechange`, `visibilityToggle` (`false`, object), `iconRender` |
| `15-search` | `InputSearch`: `onsearch` (both sources), `enterButton` (`true`, text, snippet), `loading`, `searchIcon` |
| `16-otp` | `InputOTP`: `value`, `length`, `onchange`, `oninput` |
| `17-otp-options` | `mask`, `formatter`, `separator` (text, snippet), `size`, `variant`, `status`, `disabled`, `autocomplete` |
| `18-semantic` | `classNames`, `styles`, `class`, `style` of all four visible families |
| `19-methods` | `focus()` with `preventScroll` and each `cursor`, `blur()` |
| `20-labels` | accessible names: `<label for>`, `aria-label`, `aria-labelledby`, `aria-describedby`, `title`, count and `aria-describedby` |
| `21-native` | `name`, `required`, `type` in a `<form>`; the submitted `FormData`; the state reset in `onreset` |

## Список тестов

Each item is at least one test; the test name is the item. The unit tests are `tests/Input.test.ts`,
`tests/InputTextArea.test.ts`, `tests/InputPassword.test.ts`, `tests/InputSearch.test.ts`, `tests/InputOTP.test.ts` and
`tests/inputField.test.ts` (the shared logic); the token tests are in `tests/tokens.test.ts`; the browser tests are
`e2e/input.spec.ts`.

Input (and what InputTextArea shares with it, each repeated in the textarea file):

- Default render: a native text input in one element, medium, outlined, no extras, no `aria-invalid`.
- `value`: initial; `null` is empty; `bind:value`; a plain value is initial and changes locally; a parent change updates the
  field without `onchange`; a function binding that refuses an edit puts the text back, one that accepts takes it.
- `type`, `disabled` (no typing, no `onchange`, no Tab stop), `readonly`.
- `size` (the five names, an invalid one throws / falls back), `variant`, `status` (classes, `aria-invalid` for `error` only,
  a consumer `aria-invalid` kept, an invalid one throws / is none in production).
- `prefix`, `suffix`, `addonBefore`, `addonAfter`: text and snippet, order, absent when empty. With an addon: the group around the
  field, the look classes on both, `class` / `style` / `classNames.root` / `styles.root` on the group only.
- `allowClear`: off by default; named native button hidden but in place while empty; a click empties, keeps focus, calls
  `onchange` then `onclear`; a press does not take focus; Enter and Space; not while disabled or read-only; the object form;
  a refused clear keeps the text; Tab order.
- `showCount`, `maxlength`, `count` (`max` soft limit, `strategy`, `show`, `exceedFormatter`) and `aria-describedby`.
- `onchange` (once per edit, value and event, a paste is one edit, `oninput` first), `onpressenter`, native handlers.
- IME: edits reported as they come; Enter not taken while composing; cutting and write-back at the end of a composition;
  composition handlers forwarded.
- Structure: a plain field is one element around the input and its parent is the consumer's container; turning prefix, suffix,
  clear, count and a second addon on and off keeps the same input and its focus; the first addon adds the group (the input is
  created again), the last one removes it.
- Reactivity, native attributes, `classNames` (every part), `styles` (every part, numbers, custom properties, reactive,
  removed), `class` / `style`, `focus()`, `blur()`, `focus({ cursor })`, `focus({ preventScroll })`, an input type without a
  selection, forms (`FormData`, native reset, reset in `onreset`, no leak of the listener), axe (named by `aria-label` and by
  `<label for>`, a negative check for an unnamed field, states and variants).

The wrappers also test what they forward to `Input` (`onchange`, `onpressenter`, `readonly`, `maxlength`, the object form of
`allowClear`, the native attributes and handlers, `focus({ preventScroll })`): an audit of 2026-11-11 found these untested for
`InputPassword`, `InputSearch`, `InputTextArea` and `InputOTP`, and each test was shown to fail when the forwarding is broken. A second pass, sentence by sentence through the contracts above, found
a code defect and four more untested statements: `autoSize` did not measure again when a web font arrived (the spec promised it;
now a `loadingdone` listener, tested with a stand-in for `document.fonts`, not in a real browser), and the code point count of a
combined emoji sequence, rapid edits, the native `tabindex` / `autofocus` / `form`, the count not being a live region, the hidden
clear button leaving the Tab order and the accessibility tree, the native number steppers and `resize: none` under `autoSize`
had no test. Each new test was shown to fail when its behaviour is broken.

InputTextArea additionally: `autoSize` (off by default, `true`, `minRows`, `maxRows` with scrolling, within the limits,
turning it off, a change of the width, the fallbacks for a line height the browser does not report), the count in its own row,
the clear button at the top corner. InputPassword: type and toggle, `aria-pressed`, `visible` (initial, parent change,
`bind:`), `onvisiblechange`, `visibilityToggle` (`false`, object), `iconRender`, suffix order, focus kept on a press,
`disabled`, props of `Input`, methods, axe. InputSearch: `type`, icon button, `onsearch` for click, Enter, clear and IME,
`loading` (icon, busy, ignored, ends), `disabled`, `enterButton` (`true`, text, snippet, `false`, sizes, loading in both
forms, `addonAfter` conflict), `searchIcon`, parts (`button`), methods, axe. InputOTP: cells and names, `length` and its
errors, `value` (initial, extra, emoji, `bind:`, plain, refusal), typing, replacing, autofill, focus redirect, Backspace and
Delete, arrows (also right-to-left), paste (every case), `onchange`, `oninput`, `mask`, `formatter`, `separator`, `disabled`,
`size` / `variant` / `status`, `autocomplete`, IME, parts, group attributes, reactivity, methods, axe.

Tokens: the documented defaults of the `--ads-input-*` tokens; the accessible file changes only the listed input tokens; the
boundary, the placeholder, the count, the over-limit count and the icons reach their ratios on every background (the page,
filled, filled on hover, error, warning) in the light theme with the accessible file and in the dark theme; the defaults are
below the ratios (the reason for the file); the dark theme defines the input colours again. The two copies of the shared style
block are equal (`tests/internal.test.ts`).

Browser (Playwright, `e2e/input.spec.ts`): visual states against the tokens (rest, hover, focus, borderless outline, variants,
status, disabled, read-only, placeholder and count colours, addons, reduced motion, right-to-left); the clear button with the mouse
and from the keyboard; the password toggle; search; the one-time code with the keyboard, the focus redirect, the arrows in
right-to-left; IME through the DevTools protocol; `autoSize` (growing and shrinking, limits, scrolling, wrapping on a narrower
field, off without the prop, the count row and the clear corner); layout (the text empty, narrow, wide and long; status, disabled,
visibility and loading; frame by frame for the spinner; the search button widths; the field and its caret while typing); a contrast
matrix in both themes; the default colours with `tokens.css` alone.

Mutation testing: `npm run test:mutation -- --target=Input` mutates `Input.svelte` and runs every `tests/Input*.test.ts`;
`-- --target=Input --file=InputTextArea` (and `InputPassword`, `InputSearch`, `InputOTP`) mutate the other components. The score
depends on the code around each mutation, so re-run it after editing a component.

## Verification (2026-11-11)

- Unit and accessibility tests (Vitest, jsdom, axe): 1417 tests in 20 files, coverage 100% of statements, branches, functions
  and lines. A negative axe check for an unnamed field in each of the five components.
- Mutation testing: `Input` 60 of 60 mutants killed, `InputTextArea` 79 of 79, `InputPassword` 13 of 13, `InputSearch` 31 of 31,
  `InputOTP` 48 of 48 (100% each). `Input` and `InputTextArea` were run again after the change to one element (2026-11-11).
- Browser tests (Playwright): `e2e/input.spec.ts` 53 tests (visual states, behavior, IME through the DevTools protocol, `autoSize`,
  layout, a contrast matrix in both themes, the default colours); the whole library suite 169 tests.
- Site: `npm run check:docs`, the build with `BASE_PATH=/ant-design-svelte`, `npm run test:docs` (the page in three languages,
  three widths and two themes: no console errors, no axe violations, no horizontal overflow; the Input page tests).
- The browser found two defects that the unit tests could not: a focused field under the pointer showed the hover colour (the hover
  rule was more specific than the focus rule), and the rounded line height 1.5714 made a medium field 31.98px high (the exact
  value 1.5714285714285714 is used now); it also showed the `ResizeObserver loop` error of `autoSize` (the height is set in the next
  frame now; the e2e test fails without that). The unit tests found an empty paste that removed a character of `InputOTP`.
- Not covered by an automatic test: a real screen reader and a real IME keyboard (the composition is simulated with the DevTools
  protocol and with composition events); only Chromium is run (as for the other components).
