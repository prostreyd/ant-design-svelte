# Message

A short, light notice at the top of the page ("Saved", "Upload failed", "Loading…") that goes away by itself, with
Ant Design-inspired styles and a Svelte 5 API. It is opened by a **call from code**, from anywhere, not by writing an
element in a template. It takes no focus and does not stop the user.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<Button onclick={() => message.success('Saved')}>Save</Button>
```

That is all: with nothing else on the page the library makes a layer on `document.body` when the first message opens and
removes it when the last one has gone. On a server every call does nothing (module state there is shared by all
requests, so nothing is kept) and returns an inert handle.

Five kinds, each with a method, and `message.open({ type })` for a kind that is only known at run time:

```ts
message.info('A note');
message.success('Saved', 2); // content, duration in seconds, onclose
message.error({ content: 'Upload failed', duration: 0, closable: true });
message.warning('Careful');
message.loading('Working…', 0);
```

### The returned function

Every call returns a function that closes the message. It is **also thenable**: the promise resolves when the message
**starts** to close, so the next one comes in as the first one goes:

```ts
const hide = message.loading('Action in progress…', 0);
hide(); // close it

message
  .loading('Action in progress…', 2.5)
  .then(() => message.success('Loading finished', 2.5));
```

Because it is thenable, **`await message.info('x')` waits until the message closes** (and so does returning it from an
`async` function). This matches React and Vue.

### Updating a message

A call with the `key` of an open message updates it in place: the box keeps its place and its height, the timer starts
again with the new `duration`, and a screen reader reads the new text.

```ts
message.loading({ content: 'Loading…', key: 'save', duration: 0 });
// later
message.success({ content: 'Saved', key: 'save', duration: 2 });
```

### `MessageHost`

`<MessageHost />` draws the messages where you put it (near the root of the app) and takes them over from the library's
own layer while it is mounted. Its props are the settings and win over `message.config()`:

```svelte
<script lang="ts">
  import { MessageHost } from 'svelte-ant-design';
</script>

<MessageHost top={72} maxCount={3} labels={{ error: 'Ошибка', close: 'Закрыть' }} />
```

Only one host is active at a time: the one mounted last. Another renders nothing and warns while developing.
Resolution order: the message's own option, then the host's props, then `message.config()`, then the defaults.

## Options of a message

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | `'info' \| 'success' \| 'error' \| 'warning' \| 'loading'` | `'info'` | The kind. Only for `message.open`; the typed methods fix it. |
| `content` | `string \| number \| Snippet` | — | The text or the content. `0` is shown. A snippet is drawn in the layer, so it reads the context of the place where the host is. |
| `duration` | `number` | `3` | Seconds before the message goes. `0` keeps it until it is closed. A negative or not finite value falls back to the default (with a warning while developing). |
| `icon` | `string \| Snippet \| false` | the icon of the type | Replaces the icon; a string is shown as text; `false` removes it. |
| `key` | `string \| number` | generated | The same key as an open message updates that message in place. |
| `pauseOnHover` | `boolean` | `true` | Holds the timer while the pointer (a mouse or a pen, not a touch) is over the box. |
| `closable` | `boolean` | `false` | Shows a close button. |
| `class`, `style` | `string`, `string \| Record<string, string \| number>` | — | On the box. |
| `classNames`, `styles` | `{ root?, wrapper?, icon?, title?, close? }` | — | Classes and inline styles of the parts. A value here wins over the host's and `config()`'s. |
| `onclick` | `(event: MouseEvent) => void` | — | Called when the box is clicked (not its close button). |
| `onclose` | `() => void` | — | Called once, when the message starts to close, however it was closed. |

## Settings: `message.config()` and the props of `MessageHost`

| Setting | Type | Default | Description |
|---|---|---|---|
| `top` | `number \| string` | `8` | Distance of the first message from the top of the window; a number is pixels. |
| `duration` | `number` | `3` | Default duration, in seconds. |
| `maxCount` | `number` | — | At most this many open messages; the oldest closes to make room. A value below 1 is ignored. |
| `container` | `HTMLElement \| (() => HTMLElement)` | `document.body` | Where the layer is moved to. |
| `closable` | `boolean` | `false` | Default of `closable`. |
| `labels` | `Partial<Record<'info' \| 'success' \| 'error' \| 'warning' \| 'loading' \| 'close', string>>` | English | The hidden word read before the text, and the name of the close button. `''` removes a type word. |
| `classNames`, `styles` | the five parts, plus `list` and `listContent` | — | Defaults for every message; `list` is the fixed layer and `listContent` the column of rows. |
| `stack` | `boolean \| { threshold?: number }` | `false` | See below. |

Methods: `message.open(options)`, `message.info | success | error | warning | loading(content, duration?, onclose?)` or
`(options)`, `message.destroy(key?)` (one message by key, or all), `message.config(options)` (`undefined` takes a setting
back to its default).

### Stack

With `stack: true` (or `{ threshold }`) the **newest message is the first row**. Past the threshold (3) the others lie
behind it as a pile with a strip peeking out below; the pointer or focus opens the pile into a plain list, and every
timer waits while it is open. The older messages of a closed pile are `inert` (an attribute that Chromium 90 and
Firefox 85, the lowest supported versions, do not know: there only their close button is kept out of the Tab order).

### Container

The layer is `position: fixed`. Inside a container with a `transform`, a `filter` or `contain: layout` it is fixed to that
container, which gives a message region inside a part of the page.

## Accessibility

- `error` and `warning` are `role="alert"` and are read out at once; `info`, `success` and `loading` are
  `role="status"` and wait for the reader. (Ant Design React gives `role="alert"` to all five, Vue and Angular give none.)
- The icon is decorative (`aria-hidden`). A hidden word before the text names the type ("Error: Upload failed"). The
  default is English: pass translations in `labels`, the library has no locale system yet.
- A message never takes focus. Without `closable` nothing in it can take focus; with it, only the close button can, a
  24px native `<button>` named by `labels.close`. Enter and Space press it, and `Escape` closes the message that has
  focus inside it.
- The timer waits while the pointer is over the box, while focus is inside it, and while the page is hidden, and goes on
  with the time that was left. A touch does not hold it. A message that must stay needs `duration: 0` and `closable`.
- `onclick` is for a mouse or a finger: the box cannot be reached with the keyboard. Put a button in the content for an
  action.
- **The layer is the last element of its container**, so the keyboard reaches a close button only after the rest of the
  page, and there is no shortcut that moves focus to the messages.
- Contrast: the text is about 15:1 on the box; the type icons are held to 3:1 (in the dark theme, and in the light theme
  with `tokens-accessible.css`, which darkens the green and the amber). The close button is 4.5:1 in both themes.
- In forced-colors modes such as Windows High Contrast the box and the close button are drawn with a border.
- Under `prefers-reduced-motion: reduce` the motion is off; the timer is the same. Positions use logical properties, so
  the order of icon and text mirrors in right-to-left layouts.
- Checked with a real screen reader: Orca with Firefox reads the role, the type word, the text, the new text after an
  update and the name of the close button (`screen-reader/message.spec.ts`).
- **Not checked:** whether a screen reader *announces* a message when it opens (the Orca harness does not speak even a
  plain `role="alert"` inserted with the DOM, so it cannot show it), NVDA, JAWS, VoiceOver, a phone screen reader, a real
  touch device (touch is tested with emulated touch in Chromium) and a real Safari.

## Scope decisions and differences from Ant Design

- The layer is made by the library; the React `message.useMessage()` with `contextHolder` and the `App` component are
  replaced by `<MessageHost>` placed in the tree. `prefixCls` and `rtl` are not implemented (the prefix is fixed; the
  direction is inherited), nor the Vue `warn` alias and the Angular `nzAnimate` (the motion follows
  `prefers-reduced-motion`). `duration` is in seconds as in React and Vue (Angular: milliseconds).
- A role per type and a hidden type word (see Accessibility), `closable`, and the pauses for focus and for a hidden page are
  new. `stack` is in React 6.4.0 only.
- The `ConfigProvider` settings come with a ConfigProvider component.
- See [`specs/message.md`](../../../specs/message.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/message/).
