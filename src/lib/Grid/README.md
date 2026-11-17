# Grid

A 24-column layout with Ant Design-inspired names and a Svelte 5 API. A `Row` lays out its `Col` children; a column takes
`span` of the 24 and moves to the next line as a whole when it does not fit. `Breakpoints` tells your code which breakpoints
the screen matches.

The API is inspired by Ant Design (MIT); the implementation is original for Svelte.

## Usage

```svelte
<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<Row gutter={16}>
  <Col span={8}>one</Col>
  <Col span={8}>two</Col>
  <Col span={8}>three</Col>
</Row>
```

The grid draws nothing, so it needs no design tokens.

## Row

| Prop | Type | Default |
|---|---|---|
| `align` | `'top' \| 'middle' \| 'bottom' \| 'stretch'` or an object per breakpoint | `'top'` |
| `justify` | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` or an object per breakpoint | `'start'` |
| `gutter` | number (px), CSS length string, object per breakpoint, or `[horizontal, vertical]` | `0` |
| `wrap` | `boolean` | `true` |

## Col

| Prop | Type | Default |
|---|---|---|
| `span` | `number` (`0` hides the column) | unset |
| `offset`, `push`, `pull`, `order` | `number` | `0` |
| `flex` | `string \| number` | unset |
| `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl` | `number` (a span) or `{ span, offset, push, pull, order, flex }` | unset |

The breakpoints are 576, 768, 992, 1200, 1600 and 1920 px (`BREAKPOINTS` is exported). `xs` is the base of every width; a
breakpoint that is not given keeps the value of the next smaller one, and each key (`span`, `offset`, ...) cascades on its own.

## Breakpoints

```svelte
<script lang="ts">
  import { Breakpoints } from 'svelte-ant-design';

  const screens = new Breakpoints(); // options: { fallback: 'lg' } for a server render
</script>

{#if screens.md}...{/if}
{screens.current}
```

`xs` is true below 576 px; every other flag is true from its width up. The values are right on the first render in a browser.

## How it differs from Ant Design

- `gutter` is a flex `gap`. A `Row` is exactly as wide as its parent, so it never makes a page scroll sideways (the Ant Design
  `Row` is wider than its parent by the gutter). The boxes of the content are in the same places.
- The responsive values are resolved in CSS, so the server and the browser render the same page and nothing flashes on
  hydration. The breakpoints are fixed; a theme cannot change them.
- `Breakpoints` is a class, not a hook, and it is right on the first render.
- There is no `classNames` or `styles`: none of the three Ant Design libraries has them for the grid.

## Accessibility

Row and Col are plain `<div>`s with no role, name or state. The reading order is the DOM order: `order`, `push` and `pull`
change only how the columns are drawn, so write the columns in the order they should be read.

See [`specs/grid.md`](../../../specs/grid.md) for the full contract.
