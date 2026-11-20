# Icon

Icons for Svelte 5, with the drawings and the names of the Ant Design icon set. An icon is a small vector picture the size and the color
of the text around it. The set has 848 drawings, most of them in three themes (`Outlined`, `Filled`, `TwoTone`); each is a component you
import by name, and `Icon` draws your own.

The API is inspired by Ant Design (MIT); the implementation is original for Svelte. The drawings are not copied into this repository: they come
from the data package [`@ant-design/icons-svg`](https://www.npmjs.com/package/@ant-design/icons-svg) (MIT, the data that the Ant Design icon
packages for React and Vue use too), which is a dependency of this package, and the library wraps them in Svelte components.

## Usage

Import the design tokens once in the application entry point (two-tone icons use them):

```ts
import 'svelte-ant-design/tokens.css';
```

Import the icons you use from `svelte-ant-design/icons`; a build keeps those drawings and drops the others:

```svelte
<script lang="ts">
  import { HomeOutlined, LoadingOutlined, StarTwoTone } from 'svelte-ant-design/icons';
</script>

<HomeOutlined />
<StarTwoTone twoToneColor="#eb2f96" />
<LoadingOutlined />
```

The size and the color are those of the text: set `font-size` and `color` on the icon or on a parent. The component name is the name of the drawing and
its theme, as in `@ant-design/icons`; moving a React project is a change of the import path.

```svelte
<SyncOutlined spin />            <!-- turns once a second -->
<ArrowUpOutlined rotate={90} />  <!-- turns the drawing; spin and rotate work together -->
<StarOutlined label="Favourite" />
<BellOutlined label="" />        <!-- hidden from assistive technology, next to visible text -->
```

`Icon` draws a definition of your own (the shape of `@ant-design/icons-svg`), a Svelte component that renders an `<svg>`, or your own `<svg>` as its content:

```svelte
<script lang="ts">
  import { Icon } from 'svelte-ant-design';
  import { StarOutlined } from '@ant-design/icons-svg';
</script>

<Icon icon={StarOutlined} />
<Icon component={MySvg} label="Logo" />
<Icon label="Drop"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="..." /></svg></Icon>
```

Two-tone icons without a color of their own use the theme (`--ads-icon-twotone-primary` and `-secondary`); `setTwoToneColor('#fa8c16')` changes them all.
For an iconfont.cn project, `createFromIconfontCN({ scriptUrl })` loads its sprite script and returns an icon component with a `type` prop.

## Props

`Icon` and every ready icon take these; a ready icon has no `icon`, `component` or `children`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `IconDefinition` | — | `Icon` only. The data of one drawing: `{ name, theme, icon }`. |
| `component` | `Component<IconComponentProps>` | — | `Icon` only. A Svelte component that renders an `<svg>`; it gets `width`, `height` and `fill`. |
| `children` | `Snippet` | — | `Icon` only. Your own `<svg>`. Wins over `component` and `icon`. |
| `spin` | `boolean` | `false` (`true` for `loading`) | Turns the icon once a second, endlessly; slower under `prefers-reduced-motion`. |
| `rotate` | `number` | — | Degrees by which the drawing is turned. |
| `twoToneColor` | `string \| [string, string]` | the theme | One color (the second is its lightest palette shade) or `[primary, secondary]`. |
| `label` | `string` | the name of the drawing | The accessible name; `''` hides the icon. |
| `class`, `style` | `string` | — | Class and inline style of the wrapper. |

Native attributes (`onclick`, `tabindex`, `role`, `title`, `data-*`, `aria-*`) go to the wrapper `<span>`.

## Accessibility

An icon is a `<span role="img">` named by its drawing in English (`aria-label="star"`); the `<svg>` inside is hidden. Give `label` a text in your own language, or
`label=""` for an icon next to visible text. A custom drawing has no name and is hidden until it gets a `label`. An icon is not focusable; to click one, use a
`Button` (it names the button) or add `role="button"`, `tabindex` and the keys yourself.

**Not checked:** how a real screen reader (Orca, NVDA, JAWS, VoiceOver) reads an icon. The names follow WAI-ARIA and are covered by automated tests.

## Differences from Ant Design

The wrapper class is `ads-icon`, not `anticon`. `spin` is slower under reduced motion and `spin={false}` stops the `loading` drawing. A custom drawing with no `label` is
hidden. The default two-tone colors follow the theme tokens. String names with loading over the network (Angular) and a provider for icon defaults are not taken.
A few drawings look uneven at some sizes on a pixel grid (`ShareAltOutlined` at 12 px is one): that is the drawing, not the component. The brand marks in the set belong to their owners.
