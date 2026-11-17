# Spin

A loading indicator with Ant Design-inspired styles and a Svelte 5 API: four turning dots, on their own, over content that is
waiting, or over the whole page. It is not interactive and never takes focus.

The API is inspired by Ant Design (MIT); the implementation is original for Svelte.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

A Spin with no children is only the indicator. Give it a `description`: that text is what a screen reader announces.

```svelte
<script lang="ts">
  import { Spin } from 'svelte-ant-design';
</script>

<Spin description="Loading the report" />
```

Put content inside it and the content is dimmed while `spinning` is true:

```svelte
<Spin spinning={loading} description="Loading the table">
  <Table />
</Spin>
```

`delay` holds the indicator back so a quick load does not flash it. `fullscreen` draws a dimmed backdrop over the viewport,
and `percent` a progress ring.

```svelte
<Spin spinning={loading} delay={500} description="Loading" />
<Spin fullscreen spinning={loading} description="Loading the page" />
<Spin percent={42} description="Uploading" />
<Spin percent="auto" description="Preparing" />
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `spinning` | `boolean` | `true` | Whether the Spin is active. Standalone, not spinning (or still in the delay) renders nothing. |
| `delay` | `number` | — | Milliseconds to wait, every time `spinning` becomes true, before the indicator appears. Turning it off hides at once. |
| `size` | `'small' \| 'medium' \| 'large' \| 'default'` | `'medium'` | The box of the dots: 14, 20 or 32 px. `default` is an alias of `medium`. |
| `description` | `string \| Snippet` | — | Text under the indicator, announced by a screen reader. |
| `indicator` | `Snippet` | — | Replaces the dots. Drawn in a box of the dot size; the component does not turn it. |
| `percent` | `number \| 'auto'` | — | A progress ring in place of the dots. `'auto'` is an indeterminate ring with no value. |
| `fullscreen` | `boolean` | `false` | A backdrop over the viewport, drawn in place with `position: fixed`. |
| `children` | `Snippet` | — | The content the Spin covers. |
| `classNames` | `Partial<Record<'root' \| 'section' \| 'indicator' \| 'description' \| 'container', string>>` | — | Extra classes for the parts. |
| `styles` | `Partial<Record<'root' \| 'section' \| 'indicator' \| 'description' \| 'container', Record<string, string \| number>>>` | — | Inline styles for the parts. |
| `class`, `style` | `string` | — | Class and inline style of the root. |

Native attributes go to the root `<div>`; `aria-label` and `aria-labelledby` go to the status element.

## Accessibility

- The dots, the drawing of the ring and a custom indicator are hidden from assistive technology. A screen reader hears the
  status element, `role="status"`, with the text of `description`. A Spin with no description is silent: name it with
  `aria-label` or `aria-labelledby` (in development a spinning Spin with neither logs one warning).
- Embedded, the covered content gets `aria-busy="true"` while spinning. It is not `inert`: the mouse and the text selection are
  blocked, the keyboard is not, so an action that must not run twice has to guard itself.
- The ring is `role="progressbar"` with `aria-valuenow`, named by the description or by `aria-label`.
- `fullscreen` blocks the pointer but has no focus trap and does not lock the scroll. Because it is `position: fixed` where the
  component stands, put it near the root of the application, not inside an element with a `transform`, `filter` or `contain`.
- `prefers-reduced-motion` slows the turn instead of stopping it. In forced-colors modes the dots and the ring use system colors.
- Not yet checked with a real screen reader (Orca, NVDA, JAWS, VoiceOver).

## Tokens

The `--ads-spin-*` tokens are in `tokens.css`: the dot sizes, the gap to the description, the colors, the opacity of the covered
content, the turn and pulse times, and the fullscreen mask. `tokens-accessible.css` darkens the description color and the
fullscreen mask so the text keeps 4.5:1.

## Differences from Ant Design

`description` replaces the deprecated `tip`, `classNames.root` replaces `wrapperClassName`, and `size="default"` is only an alias of
`medium`. `percent="auto"` is an indeterminate ring that turns, not a progress simulated in script. `indicator` is a snippet and
`classNames` and `styles` take objects. There is no `Spin.setDefaultIndicator`; a default indicator and size are reserved for
ConfigProvider in v1.1.
