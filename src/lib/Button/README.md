# Button

An action button or navigation link with Ant Design-inspired styles and a
Svelte 5 API.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button } from 'svelte-ant-design';

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
| `disabled` | `boolean` | `false` | Prevents activation. A disabled link is rendered without `href`. |
| `loading` | `boolean \| { delay: number }` | `false` | Shows a spinner immediately or after a non-negative delay in milliseconds; clicks are blocked once loading is shown, but the button stays focusable. |
| `danger` | `boolean` | `false` | Danger color scheme. |
| `block` | `boolean` | `false` | Full width. |
| `ghost` | `boolean` | `false` | Transparent background for `default`, `dashed`, and `primary`; the text and border colors come from the type and `danger`. It has no visual effect on `text` and `link`. Contrast is guaranteed on the page background only: choose a surface the button color reads on. |
| `href` | `string` | — | Renders an `<a>` instead of a `<button>`. An empty string still renders an anchor. |
| `target` | `string` | — | Anchor target; used only when `href` is provided. |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button `type`; ignored for anchors. |
| `icon` | `Snippet` | — | Icon snippet. It is hidden from assistive technology; provide an accessible name for icon-only buttons. |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Position of the icon snippet. |
| `children` | `Snippet` | — | Button label/content snippet. |
| `class` | `string` | — | Additional CSS class appended to the component classes. |
| Native attributes | `HTMLButtonAttributes` or `HTMLAnchorAttributes` | — | Other native attributes, including `tabindex`, `aria-*`, `name`, `form`, `rel`, and `download`, are forwarded to the rendered element. The `loading` and `disabled` states take priority over a consumer `aria-busy`, `aria-disabled`, or `tabindex`. |

Invalid values: `type`, `size`, `shape`, `htmlType`, `iconPlacement`, and `loading.delay` are
checked. While developing (and in tests) an invalid value throws a `RangeError`; in a production
build the button uses the default instead (`loading.delay` falls back to showing loading
immediately), so a bad runtime value cannot break the page.

`loading.delay` must be a finite, non-negative number of milliseconds. A delayed loading state
does not block the control until the delay expires. Changing `loading` before
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

## Colors

In the light theme the default tokens are the values of the Ant Design token documentation, so the button
looks like Ant Design: primary `#1677ff` (hover `#4096ff`, pressed `#0958d9`), danger `#ff4d4f`, links
`#1677ff` (hover `#69b1ff`). A text button keeps its text color on hover and gets the background
`rgba(0, 0, 0, 0.04)`. These colors do **not** reach WCAG AA for text: white on `#1677ff` is 4.10:1 and on the
danger fill 3.27:1 (4.5:1 is needed). For a contrast guarantee import the optional file after the tokens:

```ts
import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';
```

It darkens the `-solid`, `-text` and link tokens (white on the primary fill becomes 5.19:1). The dark theme
needs no extra file.

## Accessibility

- Uses native `<button>` and `<a>` elements and forwards their supported attributes.
- Native buttons support keyboard activation. A `disabled` button uses the native `disabled` attribute.
- A loading button is not natively disabled: it keeps keyboard focus when loading starts, exposes `aria-disabled="true"`, and ignores clicks, Enter, and Space (including form submission).
- Disabled/loading anchors are rendered without `href`, with `role="link"`, `aria-disabled="true"`, and `tabindex="-1"`, so they cannot be opened by click, middle click, or the context menu.
- Both element types expose `aria-busy="true"` while loading.
- The spinner and icon snippet are hidden from assistive technology. An icon-only button must receive an accessible name, for example `aria-label="Close"`.
- A visible `:focus-visible` outline is provided using design tokens. The outline has at least 3:1 contrast against the page. Text in every type, `danger`, and `ghost` combination keeps at least 4.5:1 in the dark theme, and in the light theme when `tokens-accessible.css` is imported (see Colors), including hover, focus, and pressed states.
- Under `prefers-reduced-motion: reduce`, color transitions are disabled and the spinner turns more slowly.

## Scope decisions and limitations

- `iconPlacement` is included as a low-cost React-only addition.
- `autoInsertSpace` is not implemented: inspecting arbitrary Svelte snippet output would be fragile; provide the desired whitespace explicitly in the snippet.
- `color`, `variant`, `classNames`, and `styles` are reserved for a future additive release; see [`specs/button.md`](../../../specs/button.md).
- Loading delay is supported, but a custom loading-icon prop is not. Use an icon snippet where appropriate.

## Live examples

Interactive examples of every option, with their code and the API table, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/button/).
