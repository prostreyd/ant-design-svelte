# Button

A button that triggers an action or navigation, matching Ant Design's Button
API adapted to idiomatic Svelte 5.

## Usage

Import the design tokens once (in your app entry), then use the components:

```ts
// app entry (e.g. main.ts)
import 'ant-design-svelte/tokens.css';
```

```svelte
<script>
  import { Button } from 'ant-design-svelte';
</script>

<Button type="primary">Primary</Button>
<Button>Default</Button>
<Button type="dashed">Dashed</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>
```

With an icon (Svelte snippet) and a click handler:

```svelte
<script>
  import { Button } from 'ant-design-svelte';

  function handleClick(event) {
    console.log('clicked', event);
  }
</script>

<Button type="primary" onclick={handleClick}>Submit</Button>
```

Rendering a link:

```svelte
<Button href="https://example.com" target="_blank">Open</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'primary' \| 'default' \| 'dashed' \| 'text' \| 'link'` | `'default'` | Visual style. |
| `size` | `'large' \| 'middle' \| 'small'` | `'middle'` | Size. |
| `shape` | `'default' \| 'circle' \| 'round'` | `'default'` | Shape. |
| `disabled` | `boolean` | `false` | Disabled state. |
| `loading` | `boolean` | `false` | Shows a spinner and disables the button. |
| `danger` | `boolean` | `false` | Danger color scheme. |
| `block` | `boolean` | `false` | Full width. |
| `ghost` | `boolean` | `false` | Transparent background (primary). |
| `href` | `string` | — | Renders an `<a>` instead of a `<button>`. |
| `target` | `string` | — | Anchor target (with `href`). |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button `type`. |
| `icon` | `Snippet` | — | Leading icon snippet. |
| `children` | `Snippet` | — | Button label (default slot). |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onclick` | `MouseEvent` | Fired on click; suppressed when `disabled` or `loading`. |

## Variants & states

- Types: `primary`, `default`, `dashed`, `text`, `link`.
- Sizes: `large`, `middle`, `small`.
- Shapes: `default`, `circle`, `round`.
- States: `disabled`, `loading`, `danger`, `block`, `ghost`.

## Accessibility

- Renders a native `<button>` (respecting `htmlType`) or a native `<a>` when
  `href` is set.
- `disabled`/`loading` set the native `disabled` attribute on `<button>`, and
  `aria-disabled` + `tabindex="-1"` on `<a>`.
- `loading` sets `aria-busy="true"`; the spinner is `aria-hidden`.
- Icon-only buttons need an accessible name from the consumer (not currently
  supported via a dedicated prop — see Known limitations).

## Known limitations

- Arbitrary DOM attribute passthrough (e.g. `aria-label`, `name`, `form`) is not
  yet supported; only the explicit props above are accepted.
- `loading` with a delay (Ant Design's `{ delay: number }`) is not implemented.

## Playground

See `demo/src/App.svelte` for working examples.
