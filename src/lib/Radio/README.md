# Radio

A radio picks one option out of several that are all visible, with Ant Design-inspired styles and a Svelte 5 API.
`Radio` renders a native `<input type="radio">` inside a `<label>`, `RadioButton` draws the same choice as a button, and
`RadioGroup` owns the selected value, the shared `name` and the layout.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

A group renders one radio per entry of `options` and holds the selected value:

```svelte
<script lang="ts">
  import { RadioGroup } from 'svelte-ant-design';

  let fruit = $state<string | undefined>('Apple');
</script>

<RadioGroup bind:value={fruit} options={['Apple', 'Pear', 'Orange']} aria-label="Fruit" />
```

Strings, numbers and booleans are both the value and the label. Objects add a label that is text or a snippet, `disabled`,
`title`, `id`, `required`, `class`, `style` and an `onchange`:

```svelte
{#snippet cherry()}<strong>Cherry</strong>{/snippet}

<RadioGroup
  bind:value={extra}
  aria-label="Extras"
  options={[{ label: cherry, value: 'cherry' }, { label: 'Plum', value: 'plum', disabled: true }]}
/>
```

For your own layout put `Radio` elements in the group instead of `options`; each one needs a `value`:

```svelte
<RadioGroup bind:value={day} aria-label="Day">
  <div class="grid">
    <Radio value="mon">Monday</Radio>
    <Radio value="tue">Tuesday</Radio>
  </div>
</RadioGroup>
```

`optionType="button"` renders the options as buttons, and `RadioButton` elements can be placed in a group yourself;
`buttonStyle="solid"` fills the checked button and `size` sets its height:

```svelte
<RadioGroup bind:value={city} optionType="button" buttonStyle="solid" size="large" options={['Hangzhou', 'Shanghai']} aria-label="City" />
```

When the parent has to decide whether a choice goes through (for example after a request), use a function binding
(Svelte 5.9 or newer); a refused choice puts the previous radio back:

```svelte
<RadioGroup
  bind:value={
    () => plan,
    (next) => {
      if (accepted) plan = next;
    }
  }
  options={['free', 'team']}
  aria-label="Plan"
/>
```

## Radio and RadioButton props

`RadioButton` takes the same props as `Radio`; it has no `icon` part.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` (`$bindable`) | `false` | Whether the radio is selected. Use `bind:checked`; a plain value is the initial state. Inside a `RadioGroup` the state comes from the group's `value` and this prop is ignored. |
| `disabled` | `boolean` | `false` | Native `disabled` on the input. A group's `disabled` applies as well. |
| `value` | `string \| number \| boolean` | — | The identity inside a `RadioGroup` and the native `value` of the input, written as text (`false` becomes `"false"`). `false` and `0` are values like any other. Required inside a group. |
| `name` | `string` | — | Native `name` of the input. Inside a group the group's name wins. Standalone radios that share a name are not kept in step: use a group. |
| `children` | `Snippet` | — | The label. It is the accessible name. |
| `onchange` | `(checked: boolean, event: Event) => void` | — | Called once when the user selects the radio, after the state changed, with `true` (a user cannot unselect a radio) and the native `change` event. Not called when the parent changes `checked`, nor while disabled. |
| `classNames` | `Partial<Record<'root' \| 'icon' \| 'label', string>>` | — | Extra classes for the parts (`root` and `label` for a `RadioButton`). |
| `styles` | `Partial<Record<'root' \| 'icon' \| 'label', Record<string, string \| number>>>` | — | Inline styles for the parts. Names are kebab-case or custom properties; numbers are written as they are. |
| `class` | `string` | — | Additional CSS class appended to the root classes. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it. |
| `title` | `string` | — | Native `title` of the root label, so the tooltip covers the mark and the text. |
| Native attributes | `HTMLInputAttributes` | — | Forwarded to the `<input>` (`id`, `required`, `autofocus`, `tabindex`, `aria-*`, `data-*`, `onfocus`, `onblur`, `onclick`, other handlers). `type`, `checked`, `value`, `disabled`, `name` and `onchange` belong to the component. |

The parts: `root` is the `<label>`, `icon` is the mark (the dot is drawn inside it), `label` holds the text and exists only
with `children`. Inline `styles` win over the component's styles. Classes from `classNames` and `class` have the same
specificity as the component's own rules, so use `styles` (or a more specific selector) when you need to override a
property the component already sets.

## RadioGroup props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| number \| boolean \| null` (`$bindable`) | — | The selected value; `undefined` and `null` mean nothing is selected, and setting it back to `undefined` clears the selection. Use `bind:value`; a plain value is the initial selection. A value that matches no radio checks nothing and is kept. |
| `options` | `ReadonlyArray<string \| number \| boolean \| RadioOption>` | `[]` | One radio per entry. A string, a number or a boolean is both the value and the label. An object is `{ label, value, disabled?, title?, id?, required?, class?, style?, onchange? }` with `label` as text or a snippet. Values must be unique. When it has entries, `children` is ignored. |
| `optionType` | `'default' \| 'button'` | `'default'` | What `options` render: plain radios or buttons. Children keep the type their author chose. |
| `buttonStyle` | `'outline' \| 'solid'` | `'outline'` | How a checked button is drawn, for every `RadioButton` inside. |
| `size` | `'large' \| 'medium' \| 'middle' \| 'small' \| 'default'` | `'medium'` | The height of the buttons (24, 32 and 40 px); plain radios ignore it. `middle` and `default` are aliases of `medium`. |
| `orientation` | `'horizontal' \| 'vertical'` | — | The direction of the items; horizontal unless `vertical` is set. When it is set it wins over `vertical`. |
| `vertical` | `boolean` | `false` | A shorthand for `orientation="vertical"`. |
| `block` | `boolean` | `false` | The group fills the width of its parent and its items share it equally. |
| `disabled` | `boolean` | `false` | Disables every radio of the group; the own `disabled` of an option disables that one alone. |
| `name` | `string` | — | Native `name` of every input; it wins over the own name of a radio. Without one the group makes a unique name of its own and is never submitted with a form. |
| `children` | `Snippet` | — | Your own markup with `Radio` and `RadioButton` elements anywhere inside. Each one needs a `value`; outside production a missing one throws a `TypeError`. |
| `onchange` | `(value: string \| number \| boolean, event: Event) => void` | — | Called once per user selection with the new value and the `change` event of the selected input. The `onchange` of the radio or option runs first. Not called when the parent changes `value`. |
| `classNames` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', string>>` | — | `root` is the group; `item`, `itemIcon` and `itemLabel` are appended to the `root`, `icon` and `label` parts of every radio inside (`itemIcon` does nothing for buttons). |
| `styles` | `Partial<Record<'root' \| 'item' \| 'itemIcon' \| 'itemLabel', Record<string, string \| number>>>` | — | The same for inline styles; the own `styles` of a radio are written after the group's, so they win. |
| `class`, `style` | `string` | — | Root element (`styles.root` is written after `style`). |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the `<div>` (`id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-required`, ...). `role="radiogroup"` belongs to the component. |

## Methods

`Radio` and `RadioButton` have `focus(options?: FocusOptions)` and `blur()`, available through `bind:this`. The group has no
methods; focus a radio inside it.

## Keyboard

The inputs of a group share one name (your `name`, or one the group makes), so the browser itself gives the group the
keyboard behavior of a radio group: one Tab stop, on the selected radio (on the first when none is selected, though some
browsers use the last one when you tab backwards), arrow keys that move the focus and select, and Space to select the
focused radio. At the ends of the group Chromium and Firefox wrap around and WebKit stops. Two groups never trade focus.

## Forms

The input is native, so `name`, `value`, `required` and `form` work and only the selected radio is submitted. A group
without a `name` is not submitted: its inputs have no form owner, so a surrounding `<form>` does not send a made-up
key. A native form reset does not change the state of the components (the state is `checked` or the group's `value`): the
view is put back to the state after the reset, so reset the state of the parent in the form's `onreset`.

## Colors

In the light theme the default tokens are the values of the Ant Design token documentation and of measurements of its
public demo: border `#d9d9d9` (`#1677ff` on hover), selected fill `#1677ff` (`#4096ff` on hover) with a 6 px white dot,
disabled fill `rgba(0, 0, 0, 0.04)`; a button has a `#d9d9d9` border, the checked outline button `#1677ff` text and border,
the solid one a `#1677ff` fill. They do **not** keep the contrast of the accessible set: the unchecked border is 1.41:1
against a white page and the hover fill 2.99:1 (3:1 is needed for a part of a control). For a contrast guarantee import the
optional file after the tokens:

```ts
import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';
```

It darkens the unchecked border (`#737373`) and the selected hover fill (`#0958d9`), and the buttons follow the darker
`primary` tokens. The dark theme needs no extra file.

## Accessibility

- A native `<input type="radio">` in a `<label>`: the role and the checked state come from the browser, a click on the text works, and the keyboard behavior is the one of the [WAI-ARIA radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) (see Keyboard).
- The group is `role="radiogroup"`. **Name it** with `aria-label` or `aria-labelledby` (or wrap it in a `<fieldset>` with a `<legend>`), and **name every radio**: its text (`children`), `aria-label`, `aria-labelledby` or an external `<label for>` that points at its `id`.
- A visible `:focus-visible` outline from the design tokens around the mark or the whole button, at least 3:1 against the page.
- The border, the dot, the button border and the focus ring keep at least 3:1 contrast, and the text of a button 4.5:1, in every state: in the dark theme, and in the light theme when `tokens-accessible.css` is imported (see Colors).
- In forced-colors modes such as Windows High Contrast a selected radio keeps its dot, a selected button is drawn in the selection colors, and disabled controls use the disabled color.
- Under `prefers-reduced-motion: reduce` the transitions are disabled.
- Positions and corners use logical properties, so the radios and the button groups mirror in right-to-left layouts. Selecting a radio never changes the size of the control or moves its neighbours.
- **Not checked yet:** NVDA, JAWS, VoiceOver and a real touch device. A public report against Ant Design's own radio says VoiceOver may stop twice on a label that wraps the control and its text; this component has the same shape. Orca (with Firefox) is checked by an automated test (`screen-reader/radio.spec.ts`).

## Scope decisions and differences from Ant Design

- `onchange` receives `(checked, event)` with the native `change` event, and `checked` is always `true`; React passes an object with `target` and Vue the event. The group's `onchange` receives `(value, event)`; React passes an event object, Angular the value.
- `defaultChecked` and `defaultValue` (React) are not implemented: `bind:checked` and `bind:value` cover them. The function form of `classNames` / `styles` (React) is not implemented: compute the object in `$derived`. The ripple (`wave`) is not implemented.
- `value` is `string | number | boolean`; React, Vue and Angular allow any type.
- `Radio.Group` and `Radio.Button` are separate components, `RadioGroup` and `RadioButton`; `optionType` only asks `options` for buttons.
- An unnamed group makes a unique name and is never submitted; in React the random name is submitted with the form.
- Standalone radios that share a `name` are not kept in step (Angular emits `false` to the radio that was deselected); use a group.
- `size` also accepts `middle` and `default`; `orientation` and `vertical` are both there, and `orientation` wins.
- The global configuration of `classNames` and `styles` comes with the `ConfigProvider` component.
- See [`specs/radio.md`](../../../specs/radio.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/radio/).
