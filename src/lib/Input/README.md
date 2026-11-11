# Input

A text field with Ant Design-inspired styles and a Svelte 5 API. Five components share one family:

| Component | What it renders |
|---|---|
| `Input` | a native `<input>` |
| `InputTextArea` | a native `<textarea>`, optionally growing with its text |
| `InputPassword` | an `Input` with a button that shows and hides the text |
| `InputSearch` | an `Input` with a search button |
| `InputOTP` | a group of single-character inputs for a one-time code |

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Input } from 'svelte-ant-design';

  let name = $state('');
</script>

<Input bind:value={name} aria-label="Name" placeholder="Your name" allowClear showCount maxlength={40} />
```

A field has no label of its own: name it with an external `<label for>` (and the `id` of the field), `aria-label`
or `aria-labelledby`.

`onchange` is called on every edit with the new text and the native `input` event, as `onChange` in React:

```svelte
<Input onchange={(value, event) => console.log(value, event.type)} aria-label="Query" />
```

`prefix`, `suffix`, `addonBefore` and `addonAfter` take plain text or a snippet:

```svelte
{#snippet unit()}<em>kg</em>{/snippet}

<Input prefix="$" suffix={unit} addonBefore="https://" addonAfter=".com" aria-label="Site" />
```

When the parent has to decide whether an edit goes through, use a function binding (Svelte 5.9 or newer); a refused
edit puts the old text back:

```svelte
<Input bind:value={() => digits, (next) => (/^\d*$/.test(next) ? (digits = next) : undefined)} aria-label="Digits" />
```

The other four components:

```svelte
<InputTextArea bind:value={notes} autoSize={{ minRows: 2, maxRows: 6 }} showCount aria-label="Notes" />
<InputPassword bind:value={password} bind:visible={shown} aria-label="Password" />
<InputSearch onsearch={(value, event, { source }) => search(value)} enterButton aria-label="Search" />
<InputOTP bind:value={code} length={6} onchange={(value) => verify(value)} aria-label="Verification code" />
```

## Input props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` (`$bindable`) | `''` | The text. Use `bind:value`; a plain value is the initial text. A function binding can refuse an edit. |
| `type` | `string` | `'text'` | Native `type` (`text`, `search`, `email`, `tel`, `url`, `number`). Use `InputPassword` for a password. |
| `disabled`, `readonly` | `boolean` | `false` | Native attributes; a read-only field has no clear button. |
| `size` | `'large' \| 'medium' \| 'middle' \| 'small' \| 'default'` | `'medium'` | 40, 32 or 24px high. `middle` and `default` are aliases of `medium`. |
| `variant` | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | Visual variant. |
| `status` | `'error' \| 'warning'` | — | `error` also sets `aria-invalid="true"`. |
| `prefix`, `suffix` | `string \| Snippet` | — | Inside the border, before and after the text. |
| `addonBefore`, `addonAfter` | `string \| Snippet` | — | Cells outside the border. |
| `allowClear` | `boolean \| { clearIcon?: string \| Snippet; label?: string; tabIndex?: number }` | `false` | A clear button while there is text. A press keeps focus in the field. The default name is `Clear`. |
| `showCount` | `boolean \| { formatter: (info: CountInfo) => string }` | `false` | The length of the text (`n`, or `n / max` with `maxlength`). |
| `count` | `{ max?, strategy?, show?, exceedFormatter? }` | — | `max` is a soft limit (the text is kept, the count turns red and `aria-invalid` is set); `strategy` replaces the count (the default counts code points); `show` is `showCount` (and wins over it); `exceedFormatter` cuts the text past `max`. |
| `maxlength` | `number` | — | Native limit: the browser stops the input. |
| `onchange` | `(value: string, event: Event) => void` | — | Once per user edit. Not called when the parent changes `value`. |
| `onpressenter` | `(event: KeyboardEvent) => void` | — | On Enter, not while an IME composition is open. |
| `onclear` | `(event: MouseEvent) => void` | — | After the clear button emptied the text. |
| `classNames`, `styles` | parts `root`, `prefix`, `input`, `suffix`, `clear`, `count` | — | Extra classes and inline styles (kebab-case or custom properties; numbers are written as they are). |
| `class`, `style` | `string` | — | The root. |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>`: `id`, `name`, `placeholder`, `required`, `autocomplete`, `aria-*`, `data-*`, handlers. |

## Other components

- **`InputTextArea`**: the props of `Input` that make sense for a textarea, and `autoSize: boolean | { minRows?, maxRows? }`.
  The height follows the content (a minimum of one line) and is measured again when the text, the width or the font
  changes; past `maxRows` the field scrolls. Parts: `root`, `textarea`, `clear`, `count`.
- **`InputPassword`**: the props of `Input` except `type`, and `visible` (`$bindable`), `onvisiblechange`,
  `visibilityToggle: boolean | { tabIndex?, label? }` and `iconRender: Snippet<[visible: boolean]>`. The toggle is a native
  button named `Show password` with `aria-pressed`.
- **`InputSearch`**: the props of `Input`, and `enterButton: boolean | string | Snippet` (a primary button after the field),
  `loading` (a spinner; the search action is ignored), `onsearch(value, event, { source })` (`source` is `'clear'` for the clear
  button, `'input'` otherwise) and `searchIcon`. `classNames` and `styles` have one more part, `button`. `enterButton` and
  `addonAfter` cannot be used together.
- **`InputOTP`**: `value` (`$bindable`, no gaps), `length` (6), `mask: boolean | string`, `formatter`, `separator: string | Snippet<[index]>`,
  `disabled`, `size`, `variant`, `status`, `autocomplete`, `onchange(value)` (when every cell is filled), `oninput(values)`,
  `classNames` and `styles` (parts `root`, `input`, `separator`). Typing moves on, Backspace goes back, the arrow keys move between
  cells (mirrored in right-to-left layouts), a paste fills the cells.

The full API tables of all five components, with live examples, are on the documentation site.

## Methods

All five components have `focus(options?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' })` and `blur()`,
available through `bind:this`. `cursor` places the caret or selects the text; an input type without a selection
(`email`, `number`) ignores it. `InputOTP.focus()` goes to the first empty cell.

## Forms

The fields are native, so `name`, `required`, `type` and `form` work and the form submits their text. A native form reset
does not change the state of the components: the view is put back to the state after the reset, so reset the state of the
parent in the form's `onreset`.

## Colors

In the light theme the default tokens are the values of the Ant Design token documentation (border `#d9d9d9`, `#4096ff` on hover,
`#1677ff` when focused). They do **not** keep the contrast of the accessible set: the border is 1.41:1 against a white page and the
placeholder 1.83:1 (3:1 and 4.5:1 are needed). For a contrast guarantee import the optional file after the tokens:

```ts
import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';
```

The `filled` and `borderless` variants have no boundary by design: use `outlined` or `underlined` where the boundary has to reach 3:1.
The dark theme needs no extra file.

## Accessibility

- Native `<input>` and `<textarea>`: Tab, selection, autofill and forms come from the browser. **A field needs an accessible name** (see Usage).
- `status="error"` and a count past `count.max` set `aria-invalid="true"`. The count is joined to the field by `aria-describedby`
  (after your own ids) and is not a live region.
- The clear, show-password and search buttons are native buttons with an accessible name (`Clear`, `Show password`, `Search`; English, change
  them with the `label` options); a press does not take focus from the field; icons are decorative.
- IME: `onpressenter` and `onsearch` do not fire on the Enter that confirms a candidate; `count.exceedFormatter` cuts the text only when
  the composition ends; a refused edit is put back when it ends.
- `InputOTP` is a `role="group"` of cells named `Character i of n`; a cell past the first empty one cannot take focus.
- A visible focus: the border takes the active colour (a borderless field draws an outline), at least 3:1 against the page.
- Under `prefers-reduced-motion: reduce` the transitions are disabled. Positions use logical properties, so the fields mirror in
  right-to-left layouts. Changing the text, the status, the visibility or the loading never changes the size of a field or moves its neighbours.

## Scope decisions and differences from Ant Design

- `onchange` receives `(value, event)` on every edit; React passes the event. The native `change` event (on commit) is not exposed.
- `defaultValue` (React, Vue) is not implemented: `bind:value` covers it. The function form of `classNames` / `styles` (React) is not
  implemented: compute the object in `$derived`. `bordered` (Vue, deprecated in React) is not implemented: use `variant="borderless"`.
  `Input.Group` and `compact` are not implemented.
- The formatters of `showCount` and `count.show` return a string; React returns a node. The `visible` and `onvisiblechange` of the password
  are props of their own; React nests them in `visibilityToggle`.
- The parts are separate components (`InputTextArea`, `InputPassword`, `InputSearch`, `InputOTP`), as Svelte has no `Input.TextArea`.
- The markup is one `<span class="ads-input">` around the native control, which holds the prefix, the clear button, the count and the
  suffix as siblings of the input (so they never cost the input its focus). `addonBefore` / `addonAfter` add one more element, a
  `<span class="ads-input-group">` around it, and `class`, `style`, `classNames.root` and `styles.root` go to the outermost one.
  Adding the first addon or removing the last one creates the input again (it loses focus); the other changes do not.
- See [`specs/input.md`](../../../specs/input.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/input/).
