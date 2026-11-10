# Switch

A switch that turns one setting on or off, with Ant Design-inspired styles and a
Svelte 5 API. It renders a native `<button role="switch">`.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Switch } from 'svelte-ant-design';

  let notifications = $state(true);
</script>

<Switch bind:checked={notifications} aria-label="Notifications" />
```

Text for the two states is a plain string; use a snippet for icons and other markup:

```svelte
<Switch checkedChildren="On" unCheckedChildren="Off" aria-label="Power" />

{#snippet check()}<svg aria-hidden="true">…</svg>{/snippet}
{#snippet cross()}<svg aria-hidden="true">…</svg>{/snippet}

<Switch checkedChildren={check} unCheckedChildren={cross} aria-label="Approved" />
```

When the parent has to decide whether a change goes through (for example after a request),
use a function binding (Svelte 5.9 or newer):

```svelte
<Switch
  aria-label="Enable the feature"
  bind:checked={
    () => enabled,
    (next) => {
      if (accepted) enabled = next;
    }
  }
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` (`$bindable`) | `false` | Whether the switch is on. Use `bind:checked` for two-way binding; a plain value is the initial state. |
| `disabled` | `boolean` | `false` | Native `disabled`: not focusable, ignores clicks and keys. |
| `loading` | `boolean` | `false` | Shows a spinner in the handle and ignores activation. The switch stays focusable. |
| `size` | `'medium' \| 'small' \| 'default'` | `'medium'` | Size. `default` is a compatibility alias of `medium`. |
| `checkedChildren` | `string \| Snippet` | — | Content shown while on: text, or a snippet for icons and markup. Hidden from assistive technology. Stays mounted while off (see below). |
| `unCheckedChildren` | `string \| Snippet` | — | Content shown while off: text, or a snippet for icons and markup. Hidden from assistive technology. Stays mounted while on (see below). |
| `classNames` | `Partial<Record<'root' \| 'content' \| 'indicator', string>>` | — | Extra classes for the parts of the switch. |
| `styles` | `Partial<Record<'root' \| 'content' \| 'indicator', Record<string, string \| number>>>` | — | Inline styles for the parts. Names are kebab-case or custom properties; numbers are written as they are. |
| `class` | `string` | — | Additional CSS class appended to the root classes. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it. |
| Native attributes | `HTMLAttributes<HTMLButtonElement>` | — | Forwarded to the `<button>` (`id`, `title`, `tabindex`, `aria-*`, `data-*`, other handlers). `type`, `role` and `aria-checked` belong to the component. The `loading` state takes priority over a consumer `aria-busy` and `aria-disabled`. |

Both contents stay mounted: the one of the other state is `visibility: hidden` in the same grid cell, so the switch always has the width of the longer one and nothing around it moves when it toggles (the shorter content is centered). A string is shown as text, never as HTML; an empty string counts as not given. Because both contents are mounted at once, avoid `id`s, `bind:`s and side effects inside a snippet.

Invalid values: `size` is checked. While developing (and in tests) an invalid value throws a
`RangeError`; in a production build the switch uses `medium` instead.

The parts: `root` is the `<button>`, `content` holds the on/off text, `indicator` is the handle
(it also holds the spinner). Inline `styles` win over the component's styles. Classes from
`classNames` and `class` have the same specificity as the component's own rules, so use `styles`
(or a more specific selector) when you need to override a property the component already sets.

## Events

| Callback | Payload | Description |
|-----------|---------|-------------|
| `onchange` | `(checked: boolean, event: MouseEvent)` | Called once per user toggle, after the state flips, with the new value. Not called when the parent changes `checked`, nor while disabled or loading. |
| `onclick` | `MouseEvent` | Native click callback. Runs before the state flips; `event.preventDefault()` cancels the toggle and `onchange`. Suppressed while disabled or loading. |

## Methods

`focus(options?: FocusOptions)` and `blur()`, available through `bind:this`.

## Accessibility

- A native `<button>` with `role="switch"` and `aria-checked`. Enter and Space toggle it. Arrow keys are not part of the pattern and do nothing.
- **A switch needs an accessible name:** `aria-label`, `aria-labelledby` or a `<label for>` that points at its `id`. The on/off text is `aria-hidden`, because as a name it would only repeat the state.
- A loading switch is not natively disabled: it keeps keyboard focus when loading starts, exposes `aria-busy="true"` and `aria-disabled="true"`, and ignores clicks, Enter and Space. A disabled switch is natively disabled.
- A visible `:focus-visible` outline from the design tokens, at least 3:1 against the page.
- The track and the handle keep at least 3:1 contrast, and the on/off text 4.5:1, in the light and dark themes and in the rest, hover, focus and pressed states. For that reason the off track is darker than in the Ant Design design, and a loading switch is not dimmed.
- Under `prefers-reduced-motion: reduce`, transitions are disabled and the spinner turns more slowly.
- Positions use logical properties, so the switch mirrors in right-to-left layouts.

## Scope decisions and differences from Ant Design

- `onclick` receives only the event (the React and Vue versions pass `(checked, event)`); read the new value in `onchange`.
- `defaultChecked`, `value` and `defaultValue` (React) and `checkedValue` / `unCheckedValue` (Vue) are not implemented: `bind:checked` covers them. `nzControl` (Angular) is replaced by a function binding. `autofocus` (Vue): call `focus()` after mount.
- The function form of `classNames` / `styles` (React) is not implemented: compute the object in `$derived`.
- See [`specs/switch.md`](../../../specs/switch.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API table, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/switch/).
