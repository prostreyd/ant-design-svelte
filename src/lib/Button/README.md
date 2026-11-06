# Button

An action button or navigation link with Ant Design-inspired styles and a
Svelte 5 API.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'ant-design-svelte/tokens.css';
```

```svelte
<script lang="ts">
  import { Button } from 'ant-design-svelte';

  function handleClick(event: MouseEvent) {
    console.log('clicked', event);
  }
</script>

<Button type="primary" onclick={handleClick}>Save</Button>
<Button type="dashed" size="small">Add</Button>
<Button href="https://example.com" target="_blank" rel="noreferrer">Open</Button>
```

Icons use Svelte snippets. `iconPlacement` controls whether the icon appears
before or after the label:

```svelte
{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

<Button icon={uploadIcon} iconPlacement="end">Upload</Button>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'primary' \| 'default' \| 'dashed' \| 'text' \| 'link'` | `'default'` | Visual style. |
| `size` | `'large' \| 'medium' \| 'middle' \| 'small'` | `'medium'` | Size. `middle` is a compatibility alias for `medium`. |
| `shape` | `'default' \| 'circle' \| 'round'` | `'default'` | Shape. |
| `disabled` | `boolean` | `false` | Prevents activation. |
| `loading` | `boolean \| { delay: number }` | `false` | Shows a spinner immediately or after a non-negative delay in milliseconds; the button becomes disabled when loading is shown. |
| `danger` | `boolean` | `false` | Danger color scheme. |
| `block` | `boolean` | `false` | Full width. |
| `ghost` | `boolean` | `false` | Transparent background, mainly for primary buttons on colored surfaces. |
| `href` | `string` | — | Renders an `<a>` instead of a `<button>`. An empty string still renders an anchor. |
| `target` | `string` | — | Anchor target; used only when `href` is provided. |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button `type`; ignored for anchors. |
| `icon` | `Snippet` | — | Icon snippet. It is hidden from assistive technology; provide an accessible name for icon-only buttons. |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Position of the icon snippet. |
| `children` | `Snippet` | — | Button label/content snippet. |
| `class` | `string` | — | Additional CSS class appended to the component classes. |
| Native attributes | `HTMLButtonAttributes` or `HTMLAnchorAttributes` | — | Other native attributes, including `aria-*`, `name`, `form`, `rel`, and `download`, are forwarded to the rendered element. |

`loading.delay` must be a finite, non-negative number of milliseconds. A delayed loading state
does not disable the control until the delay expires. Changing `loading` before
the delay expires cancels the pending timer.

## Events

| Callback | Payload | Description |
|-----------|---------|-------------|
| `onclick` | `MouseEvent` | Called once for an enabled click. Suppressed when disabled or loading. |

## Variants and states

- Types: `primary`, `default`, `dashed`, `text`, `link`.
- Sizes: `large`, `medium`, `small`; `middle` is a deprecated compatibility alias.
- Shapes: `default`, `circle`, `round`.
- States/modifiers: `disabled`, `loading`, `danger`, `block`, `ghost`.
- Loading supports immediate and delayed presentation.

## Accessibility

- Uses native `<button>` and `<a>` elements and forwards their supported attributes.
- Native buttons support keyboard activation. Disabled/loading buttons use the native `disabled` attribute.
- Disabled/loading anchors get `aria-disabled="true"`, `tabindex="-1"` and suppress navigation.
- Both element types expose `aria-busy="true"` while loading.
- The spinner and icon snippet are hidden from assistive technology. An icon-only button must receive an accessible name, for example `aria-label="Close"`.
- A visible `:focus-visible` outline is provided using design tokens.

## Scope decisions and limitations

- `iconPlacement` is included as a low-cost React-only addition.
- `autoInsertSpace` is not implemented: inspecting arbitrary Svelte snippet output would be fragile; provide the desired whitespace explicitly in the snippet.
- `color`, `variant`, `classNames`, and `styles` are reserved for a future additive release; see [`specs/button.md`](../../../specs/button.md).
- Loading delay is supported, but a custom loading-icon prop is not. Use an icon snippet where appropriate.

## Playground

See `demo/src/App.svelte` for interactive examples.
