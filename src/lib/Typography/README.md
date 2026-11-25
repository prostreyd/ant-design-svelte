# Typography

Text for articles and interfaces: titles, paragraphs, inline text and links with Ant Design-inspired styles and a Svelte 5 API. The text
parts can be copied, edited in place and cut to a number of rows.

The API is inspired by Ant Design (MIT); the implementation is original for Svelte.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Typography, TypographyTitle, TypographyParagraph, TypographyText, TypographyLink } from 'svelte-ant-design';

  let name = $state('Release notes');
</script>

<Typography>
  <TypographyTitle bind:content={name} editable />
  <TypographyParagraph copyable>
    Press <TypographyText keyboard>Esc</TypographyText> to leave. See the
    <TypographyLink href="/docs" target="_blank">documentation</TypographyLink>.
  </TypographyParagraph>
  <TypographyParagraph ellipsis={{ rows: 2, expandable: 'collapsible' }}>
    A long text that is cut to two rows, with a button that shows all of it.
  </TypographyParagraph>
</Typography>
```

- `Typography` is an `<article>` that also styles the plain tags inside it: `h1` to `h5`, paragraphs, links, lists, `blockquote`, `pre`,
  `code`, `kbd`, `mark` and `strong` (tables are left to the browser and your own CSS). Use it for HTML that comes ready, from Markdown or a
  CMS, and insert only HTML you trust or have sanitized. Only plain tags are styled: a component of this library inside the article keeps its
  own look.
- A plain `<a href>` inside the article or inside any of the four parts looks like a `TypographyLink`.
- `TypographyTitle` is `h1` to `h5` (`level`, default 1); `TypographyParagraph` a `<div>`; `TypographyText` a `<span>`; `TypographyLink` an `<a>`.

## Props of the text parts

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'secondary' \| 'success' \| 'warning' \| 'danger'` | — | Colour of the text. |
| `disabled` | `boolean` | `false` | Disabled colour. The buttons stay usable; a link loses its `href`. |
| `code`, `mark`, `underline`, `delete`, `strong`, `italic`, `keyboard` | `boolean` | `false` | Decorations; they combine. A title has no `strong` and `keyboard`, a paragraph no `keyboard`. |
| `content` | `string` (`bind:`) | — | The text as a value, for edit, copy and the cut; wins over the child content. |
| `copyable` | `boolean \| TypographyCopyable` | `false` | A copy button. |
| `editable` | `boolean \| TypographyEditable` | `false` | An edit button and a field in place of the text. |
| `editing` | `boolean` (`bind:`) | `false` | Whether the field is open. |
| `ellipsis` | `boolean \| TypographyEllipsis` | `false` | Cuts the text. A `Text` and a `Link` are one row: no `rows`, `expandable`, `onexpand`. |
| `expanded` | `boolean` (`bind:`) | `false` | Whether the cut text is expanded (title and paragraph). |
| `actions` | `{ placement?: 'start' \| 'end' }` | `{ placement: 'end' }` | Where the buttons stand. |
| `shimmer` | `boolean \| { duration?: number \| [number, number] }` | `false` | Animated text; seconds, or `[motion, pause]`. |
| `onclick` | `(event: MouseEvent) => void` | — | Click on the part, its buttons included. |
| `classNames`, `styles` | parts `root`, `actions`, `action`, `textarea` | — | Classes and inline styles of the parts. |
| `class`, `style` | `string` | — | The root. Other attributes go to the element. |
| `level` (title) | `1 \| 2 \| 3 \| 4 \| 5` | `1` | The heading level. |

### `copyable`

`text` (a string, or a function that returns a string or a promise; default `content`, else the shown text; while the promise is awaited the button
shows a spinner and further clicks do nothing), `oncopy(event)` (only after a successful copy), `icon` (a snippet
that gets `copied`), `tooltips` (`[before, after]` or `false`; a string is also the button's name), `tabIndex`. The Clipboard API is used,
with a fallback that also works on plain HTTP. When both fail nothing changes. A browser accepts a write only for a few seconds after the click,
so a promised text is handed to the clipboard at once (`ClipboardItem`) and may take longer. Where that cannot be done (Firefox before 127, plain
HTTP) a promise slower than a few seconds fails to copy.

### `editable`

`text`, `maxLength`, `autoSize` (default `true`), `icon`, `tooltip` (or `false`), `enterIcon` (or `null`), `triggerType` (`['icon']` by
default, add `'text'`), `tabIndex`, `onstart`, `onchange(text)` (only when the text changed), `onend`, `oncancel`. Enter, Tab and a click
elsewhere keep the text, Escape discards it; the text is one line.

### `ellipsis`

`rows` (default 1), `expandable` (`true` or `'collapsible'`), `suffix` (always shown), `symbol` (a string for the expand text, or a snippet that
gets `expanded`), `tooltip` (`true`, a text, a snippet or the props of `Tooltip`), `onexpand(event, { expanded })`, `onellipsis(cut)`.

One row, and several rows without buttons, are cut by CSS. A `suffix`, an expand button, or several rows with buttons are cut by a script that
measures once per change of width or text; a text cut that way shows plain text, without its inner markup, until it is expanded.

## Accessibility

- Copy, edit and expand are real buttons in the Tab order. The expand button is named by its visible content and says with `aria-expanded` whether
  the text is open. A successful copy is announced by a polite status.
- A text cut by script keeps the whole text for assistive technology; the visible pieces are hidden from it.
- The edit field has a name; Enter during an IME composition does nothing.
- Limits: a text that starts the editing without the pencil, and a text with a tooltip, cannot be focused. Keep `'icon'` in `triggerType`; give a
  keyboard way to the full text with `expandable`.
- `type` only changes the colour: add a word or an icon where it carries meaning.
- The default colours are Ant Design's own and some do not reach 4.5:1; `tokens-accessible.css` and the dark theme do.
- In the dark theme a link is only 1.75:1 from the text around it, so links are underlined there (`--ads-typography-link-decoration`;
  `none` in the light theme, set it to `underline` or `none` as you need).
- Checked with a real screen reader (Orca with Firefox, `screen-reader/typography.spec.ts`): the buttons, the `Copied` status, the edit field, the
  expanded state, the whole cut text, the level of a title and plain links. Orca says "expanded" but nothing when a button closes again, as with
  any `aria-expanded` button. **Not checked:** the `Copied` of a promised text that takes seconds (the test setup does not speak so late a change
  of a status), NVDA, JAWS, VoiceOver and a phone screen reader; touch on a real phone.

## Differences from Ant Design

`bind:content`, `bind:editing` and `bind:expanded` are props, not fields of the objects (no `defaultExpanded`); `copyable.icon` is one
snippet that gets `copied`; `classNames` and `styles` take objects; `format: 'text/html'` and table styles are reserved for v1.1; the labels are English
until ConfigProvider (v1.1).
