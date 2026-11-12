# Checkbox

A checkbox marks a value as chosen, with Ant Design-inspired styles and a Svelte 5 API. `Checkbox` renders a
native `<input type="checkbox">` inside a `<label>`; `CheckboxGroup` manages a list of them.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Checkbox } from 'svelte-ant-design';

  let remember = $state(true);
</script>

<Checkbox bind:checked={remember}>Remember me</Checkbox>
```

A group renders one checkbox per entry of `options` and holds the selected values:

```svelte
<script lang="ts">
  import { CheckboxGroup } from 'svelte-ant-design';

  let fruits = $state(['Apple']);
</script>

<CheckboxGroup bind:value={fruits} options={['Apple', 'Pear', 'Orange']} aria-label="Fruits" />
```

Objects add a `disabled` flag, a `title`, a `class`, a `style`, an `onchange` and a label that is text or a snippet:

```svelte
{#snippet cherry()}<strong>Cherry</strong>{/snippet}

<CheckboxGroup
  bind:value={fruits}
  aria-label="Fruits"
  options={[{ label: cherry, value: 'cherry' }, { label: 'Plum', value: 'plum', disabled: true }]}
/>
```

For your own layout put `Checkbox` elements in the group instead of `options`; each one needs a `value`:

```svelte
<CheckboxGroup bind:value={days} aria-label="Days">
  <div class="grid">
    <Checkbox value="mon">Monday</Checkbox>
    <Checkbox value="tue">Tuesday</Checkbox>
  </div>
</CheckboxGroup>
```

A "check all" control uses `indeterminate`, which changes only the look and the announced state:

```svelte
<Checkbox
  checked={all}
  indeterminate={some}
  onchange={(checked) => (selected = checked ? [...options] : [])}
>
  Check all
</Checkbox>
```

When the parent has to decide whether a change goes through (for example after a request), use a function
binding (Svelte 5.9 or newer); a refused change puts the box back:

```svelte
<Checkbox
  bind:checked={
    () => enabled,
    (next) => {
      if (accepted) enabled = next;
    }
  }
>
  Enable the feature
</Checkbox>
```

## Checkbox props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` (`$bindable`) | `false` | Whether the checkbox is checked. Use `bind:checked` for two-way binding; a plain value is the initial state. Inside a `CheckboxGroup` the state comes from the group's `value` and this prop is ignored. |
| `indeterminate` | `boolean` | `false` | The "partly checked" look of a "check all" control. It changes only the appearance and the announced state (`mixed`); `checked` stays the value that is reported and submitted. |
| `disabled` | `boolean` | `false` | Native `disabled` on the input. A group's `disabled` applies as well. |
| `value` | `string \| number` | — | The identity inside a `CheckboxGroup` and the native `value` of the input. Without it the input keeps the native `on`. |
| `name` | `string` | — | Native `name` of the input. Inside a group the group's `name` wins. |
| `children` | `Snippet` | — | The label. It is the accessible name. |
| `onchange` | `(checked: boolean, event: Event) => void` | — | Called once per user toggle, after the state changed, with the new value and the native `change` event (`event.target` is the input). Not called when the parent changes `checked`, nor while disabled. |
| `classNames` | `Partial<Record<'root' \| 'icon' \| 'label', string>>` | — | Extra classes for the parts of the checkbox. |
| `styles` | `Partial<Record<'root' \| 'icon' \| 'label', Record<string, string \| number>>>` | — | Inline styles for the parts. Names are kebab-case or custom properties; numbers are written as they are. |
| `class` | `string` | — | Additional CSS class appended to the root classes. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it. |
| `title` | `string` | — | Native `title` of the root label, so the tooltip covers the box and the text. |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>` (`id`, `required`, `form`, `tabindex`, `aria-*`, `data-*`, `onfocus`, `onblur`, `onclick`, other handlers). `type`, `checked`, `indeterminate`, `value`, `disabled` and `onchange` belong to the component. |

The parts: `root` is the `<label>`, `icon` is the box (the check mark and the bar are drawn inside it), `label` holds the
text and exists only with `children`. Inline `styles` win over the component's styles. Classes from `classNames` and
`class` have the same specificity as the component's own rules, so use `styles` (or a more specific selector) when you
need to override a property the component already sets.

## CheckboxGroup props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `CheckboxValue[]` (`$bindable`) | `[]` | The selected values. Use `bind:value`; a plain value is the initial selection. The array follows the order of the options (or of the checkboxes in your markup); values that match nothing are kept after the known ones. |
| `options` | `ReadonlyArray<CheckboxValue \| CheckboxOption>` | `[]` | One checkbox per entry. A string or a number is both the value and the label. An object is `{ label, value, disabled?, title?, class?, style?, onchange? }` with `label` as text or a snippet. Values must be unique. When it has entries, `children` is ignored. |
| `children` | `Snippet` | — | Your own markup with `Checkbox` elements anywhere inside. Each one needs a `value`; outside production a missing one throws a `TypeError`. |
| `disabled` | `boolean` | `false` | Disables every checkbox of the group; the own `disabled` of an option disables that one alone. |
| `name` | `string` | — | Native `name` of every input of the group; it wins over the own `name` of a checkbox. |
| `onchange` | `(value: CheckboxValue[], event: Event) => void` | — | Called once per user toggle with a new array and the `change` event of the toggled input. The `onchange` of the checkbox or option runs first. Not called when the parent changes `value`. |
| `classNames` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', string>>` | — | `root` is the group; `item`, `itemIcon` and `itemLabel` are appended to the `root`, `icon` and `label` parts of every checkbox inside. |
| `styles` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', Record<string, string \| number>>>` | — | The same for inline styles; the own `styles` of a checkbox are written after the group's, so they win. |
| `class`, `style` | `string` | — | Root element (`styles.root` is written after `style`). |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the `<div>`. `role="group"` belongs to the component. |

The group has no methods; focus a checkbox inside it.

## Methods

`Checkbox` has `focus(options?: FocusOptions)` and `blur()`, available through `bind:this`.

## Forms

The input is native, so `name`, `value`, `required` and `form` work and only the checked boxes are submitted. A native
form reset does not change the state of the components (the state is `checked` or the group's `value`): the view is
put back to the state after the reset, so reset the state of the parent in the form's `onreset`.

## Colors

In the light theme the default tokens are the values of the Ant Design token documentation: border `#d9d9d9`
(`#1677ff` on hover), checked fill `#1677ff` (`#4096ff` on hover), white check mark, disabled fill
`rgba(0, 0, 0, 0.04)`. They do **not** keep the contrast of the accessible set: the unchecked border is 1.41:1 against a
white page and the hover fill 2.99:1 (3:1 is needed for a part of a control). For a contrast guarantee import the
optional file after the tokens:

```ts
import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';
```

It darkens the unchecked border (`#737373`) and the checked hover fill (`#0958d9`). The dark theme needs no extra file.

## Accessibility

- A native `<input type="checkbox">` in a `<label>`: Space toggles it, a click on the text works, the role and the checked state come from the browser, and an `indeterminate` checkbox is announced as mixed. Enter and the arrow keys do nothing.
- **A checkbox needs an accessible name:** its text (`children`), `aria-label`, `aria-labelledby` or an external `<label for>` that points at its `id` (forwarded to the input).
- A group has `role="group"`; name it with `aria-label` or `aria-labelledby`, or wrap it in a `<fieldset>` with a `<legend>`.
- A visible `:focus-visible` outline from the design tokens around the box, at least 3:1 against the page.
- The border, the check mark, the bar and the focus ring keep at least 3:1 contrast, and the label text 4.5:1, in every state: in the dark theme, and in the light theme when `tokens-accessible.css` is imported (see Colors).
- In forced-colors modes such as Windows High Contrast the bar of an indeterminate box is drawn in the text color, so it still differs from an unchecked box, and a disabled checkbox uses the disabled color.
- Under `prefers-reduced-motion: reduce` the transitions are disabled.
- Positions use logical properties, so the checkbox mirrors in right-to-left layouts. Toggling `checked`, `indeterminate` or `disabled` never changes the size of the control or moves its neighbours.

## Scope decisions and differences from Ant Design

- `onchange` receives `(checked, event)` with the native `change` event; React passes an object with `target` and Vue the event. The group's `onchange` receives `(value, event)`; React and Vue pass only the array.
- `defaultChecked` and `defaultValue` (React) are not implemented: `bind:checked` and `bind:value` cover them. The function form of `classNames` / `styles` (React) is not implemented: compute the object in `$derived`. `nativeElement` (React) is not implemented.
- `value` is `string | number`; React and Vue also allow `boolean`, and React and Angular `any`. The Vue-only `indeterminate` of an option and the `label` slot are not implemented (a `label` snippet covers it).
- `Checkbox.Group` is a separate component, `CheckboxGroup`.
- See [`specs/checkbox.md`](../../../specs/checkbox.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/checkbox/).
