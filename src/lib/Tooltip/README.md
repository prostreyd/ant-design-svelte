# Tooltip

A short text tip for an element, with Ant Design-inspired styles and a Svelte 5 API. It shows on hover and on
keyboard focus, never takes focus, and is placed next to its trigger by the popup primitive of the library (12
placements, flipping at the edge of the screen, an arrow, following scroll and resize).

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<Tooltip title="Saves the draft">
  <Button type="primary">Save</Button>
</Tooltip>
```

The child is **one element**. The tooltip wraps it in an element that has no box of its own (`display: contents`), so
the layout does not change; the tip is placed next to the first element inside. Text alone cannot be a trigger.

Control it from the parent with `bind:open`; `onopenchange` reports the changes the user causes:

```svelte
<script lang="ts">
  let open = $state(false);
</script>

<Tooltip bind:open title="Controlled" onopenchange={(next) => console.log(next)}>
  <Button>Hover, focus or press the other button</Button>
</Tooltip>
<Button onclick={() => (open = !open)}>Toggle</Button>
```

With no child, `anchor` places the tip at an element you hold:

```svelte
<Tooltip title="Here" anchor={element} open trigger={[]} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string \| number \| Snippet \| null` | — | The text or the content. A string is text, never HTML. Empty (`undefined`, `null`, `''`) means no tooltip: it never opens, even with `open`. `0` is shown. |
| `children` | `Snippet` | — | The trigger: one element. |
| `open` | `boolean` (`$bindable`) | `false` | Whether the tip is shown. `bind:open` for two-way use; a plain value is the initial state. |
| `onopenchange` | `(open: boolean) => void` | — | Called once per change the user causes (trigger, `Escape`, press outside), not for a change the parent makes. |
| `placement` | `'top' \| 'topLeft' \| 'topRight' \| 'bottom' \| 'bottomLeft' \| 'bottomRight' \| 'left' \| 'leftTop' \| 'leftBottom' \| 'right' \| 'rightTop' \| 'rightBottom'` | `'top'` | The side of the trigger plus the alignment. Mirrored in right-to-left layouts, flipped at the edge of the screen. |
| `trigger` | `'hover' \| 'focus' \| 'click' \| 'contextMenu'`, or an array of them | `['hover', 'focus']` | What opens it. An empty array means it is only controlled. |
| `mouseEnterDelay` | `number` | `0.1` | Seconds before it shows on hover. |
| `mouseLeaveDelay` | `number` | `0.1` | Seconds before it hides after the pointer left. The pointer may move into the tip and rest in it. |
| `arrow` | `boolean \| { pointAtCenter: boolean }` | `true` | Shows an arrow; `pointAtCenter` points it at the middle of the trigger. |
| `autoAdjustOverflow` | `boolean` | `true` | Flip to the opposite side when there is no room, and shift along the edge for an unaligned placement. |
| `color` | `string` | — | One of the 13 preset names or any CSS color for the background; the text color follows. |
| `zIndex` | `number` | — | Overrides the z-index of the tooltip layer (`--ads-tooltip-z-index`, 1070). |
| `container` | `HTMLElement \| ((anchor: HTMLElement \| null) => HTMLElement)` | `document.body` | Where the tip is moved to. |
| `destroyOnHidden` | `boolean` | `false` | Remove the content from the DOM on every close. |
| `classNames` | `Partial<Record<'root' \| 'container' \| 'arrow', string>>` | — | Extra classes for the parts. |
| `styles` | `Partial<Record<'root' \| 'container' \| 'arrow', Record<string, string \| number>>>` | — | Inline styles for the parts. Names are kebab-case or custom properties; numbers are written as they are. |
| `anchor` | `HTMLElement \| null` | — | The element to place the tip next to, instead of the first element of `children`. |

Invalid values: `placement` and every value of `trigger` are checked. While developing (and in tests) an invalid
value throws a `RangeError`; in a production build the tooltip uses `top` and `hover` instead.

The parts: `root` is the positioned element, `container` the visible box, `arrow` the little square that points at the
trigger. On `root` the `styles` are set one property at a time, so the placement is kept.

### Colors

`color` takes one of the 13 preset names of the palette (`pink`, `red`, `yellow`, `orange`, `cyan`, `green`, `blue`,
`purple`, `geekblue`, `magenta`, `volcano`, `gold`, `lime`) or any CSS color (`#hex`, `rgb()`, `hsl()`, `var(--x)`). A
name from the list is a preset, so write `#0000ff` for the CSS blue. The backgrounds of the presets are the ones of
Ant Design, in the light and the dark theme. **The text is black or white, whichever contrasts more with the
background** (Ant Design draws white on every preset, which is below 4.5:1 on 11 of the 13 in the light theme), so
every preset and every custom color reaches 4.5:1. The presets are the tokens `--ads-tooltip-preset-<name>` and
`--ads-tooltip-preset-<name>-text`; the arrow follows the background. A color the browser cannot parse leaves the
default box (white on `#262626`, which is the 85% black of Ant Design over a white page; `#424242` in the dark theme).

## Accessibility

- The tip has `role="tooltip"` and an `id`. While it is shown, the trigger has `aria-describedby` pointing at it, merged
  with a value you set yourself. When the trigger itself cannot take focus (a `<label>` around a checkbox, the box of a
  `Select`) the attribute goes to the first focusable element inside it, because that is the element a screen reader
  reads. The attribute is removed when the tip closes, so it never points at an id that is not on the page.
- It opens on keyboard focus as well as on hover (Ant Design for React: hover only), and closes when focus leaves.
  `Escape` closes it and focus stays on the trigger. The tip never takes focus and is not in the Tab order, and the
  pointer can move into it and rest there.
- **The trigger has to be focusable for the keyboard to reach the tip.** A `Button`, a link or a field is; a plain
  `<span>` needs `tabindex="0"`.
- **A tooltip describes; it does not name.** An icon-only button still needs `aria-label`.
- Do not put links, buttons or other controls in a tooltip: it closes when focus leaves the trigger.
- Contrast: the default box is 15.1:1 on a white page and 10.0:1 in the dark theme; the text of the presets and of a
  custom `color` reaches 4.5:1 (see Colors).
- In forced-colors modes such as Windows High Contrast the box and the arrow are drawn with a border in a system color.
- Under `prefers-reduced-motion: reduce` the animation is off. Positions use logical properties and the sides mirror in
  right-to-left layouts.
- A tooltip on a **disabled button** shows its tip: checked in Chromium, Firefox and WebKit, current and at the lowest
  supported versions (Chromium 90, Firefox 85, WebKit 15.4; not in a real Safari). A `<span>` around a control that
  swallows pointer events by itself is the safe form.
- On a touch screen a tap shows the tip and runs the action, and a tap elsewhere closes it. The mouse events that a
  browser sends after a tap (`mouseenter`, then at once `mouseleave`) do not close it.
- **Not checked:** with a real screen reader, and on a real touch device (touch is tested with emulated touch and a
  swipe in Chromium only).

## Scope decisions and differences from Ant Design

- The trigger defaults to hover and focus (React: hover only); the 13 preset colors get a contrasting text color, where
  Ant Design draws white.
- `defaultOpen`, `fresh`, `forceAlign`, `align` and the function form of `classNames` / `styles` (React), `arrowPointAtCenter`,
  `overlayClassName`, `overlayStyle`, `overlayInnerStyle` and `destroyTooltipOnHide` (Vue, and old React names) and the
  Angular methods `show()`, `hide()` and `updatePosition()` are not implemented: `bind:open`, `classNames` / `styles` as
  objects and the automatic following of the layout cover them.
- `anchor` takes the place of Angular's `nzTooltipOrigin`. The `ConfigProvider` settings and `tooltip.unique` come with a
  ConfigProvider component.
- See [`specs/tooltip.md`](../../../specs/tooltip.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API table, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/tooltip/).
