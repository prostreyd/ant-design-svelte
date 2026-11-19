# Notification

A box with a title, a text and, if you want, buttons, at a corner or at the top or bottom edge of the window, with Ant
Design-inspired styles and a Svelte 5 API. It closes itself after a time, takes no focus, and is opened by a **call from
code**, from anywhere, not by writing an element in a template. It is heavier than a [`Message`](../Message/README.md):
it says more, and it stays at the window edge and not above the content.

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<Button
  onclick={() =>
    notification.success({ title: 'Saved', description: 'Your changes are on the server.' })}
>
  Save
</Button>
```

That is all: with nothing else on the page the library makes a layer on `document.body` when the first notification opens
and removes it when the last one has gone. On a server every call does nothing (module state there is shared by all
requests, so nothing is kept) and returns a function that does nothing.

Four kinds with an icon, each with a method, and `notification.open(options)` for a notification with no type icon:

```ts
notification.info({ title: 'New version' });
notification.success({ title: 'Saved', description: 'The text under the title.' });
notification.error({ title: 'Upload failed', duration: 0 });
notification.warning({ title: 'Almost full' });
notification.open({ title: 'No icon' });
```

### The returned function

Every call returns a function that closes the notification. It is **not thenable** (the one of `message` is):

```ts
const close = notification.warning({ title: 'Syncing…', duration: 0 });
close(); // close it
```

### Updating a notification

A call with the `key` of an open notification updates it in place: the box keeps its place, the timer starts again with the
new `duration`, and a screen reader reads the new text.

```ts
notification.info({ title: 'Uploading', key: 'upload', duration: 0 });
// later
notification.success({ title: 'Uploaded', key: 'upload' });
```

### `NotificationHost`

`<NotificationHost />` draws the notifications where you put it (near the root of the app) and takes them over from the
library's own layer while it is mounted. Its props are the settings and win over `notification.config()`:

```svelte
<script lang="ts">
  import { NotificationHost } from 'svelte-ant-design';
</script>

<NotificationHost placement="bottomRight" bottom={48} maxCount={4} labels={{ error: 'Ошибка', close: 'Закрыть' }} />
```

Only one host is active at a time: the one mounted last. Another renders nothing and warns while developing.
Resolution order: the notification's own option, then the host's props, then `notification.config()`, then the defaults.

## Places

Six: `topLeft`, `top`, `topRight` (the default), `bottomLeft`, `bottom` and `bottomRight`. Each is its own list. **The newest
notification stands nearest the window edge** and the older ones are pushed away from it (at a top place the newest is the
first row, at a bottom place the last). A notification comes in from the side of its place and leaves the same way; there
is no motion under `prefers-reduced-motion`. A list that is taller than the window scrolls.

## Options of a notification

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | `string \| number \| Snippet` | — | The first line. Required. `0` is shown. |
| `description` | `string \| number \| Snippet` | — | The text under the title. |
| `actions` | `string \| number \| Snippet` | — | Under the text, at the inline end: usually buttons. They are your elements, so the keyboard reaches them after the text and before the close button. |
| `icon` | `string \| Snippet \| false` | the icon of the type | Replaces the icon; `false` removes it. `open` has none unless one is given. |
| `duration` | `number \| false` | `4.5` | Seconds before the notification goes. `0` and `false` keep it until it is closed. A negative or not finite value falls back to the default (with a warning while developing). |
| `key` | `string \| number` | generated | The same key as an open notification updates that notification in place. |
| `placement` | `'top' \| 'topLeft' \| 'topRight' \| 'bottom' \| 'bottomLeft' \| 'bottomRight'` | `'topRight'` | Where it stands. |
| `closable` | `boolean` | `true` | Shows the close button. |
| `closeIcon` | `string \| Snippet \| false` | the cross | Replaces the cross; `false` removes the button. |
| `showProgress` | `boolean` | `false` | A strip at the bottom that runs down with the time left; it stands still whenever the timer does. |
| `pauseOnHover` | `boolean` | `true` | Holds the timer while the pointer (a mouse or a pen, not a touch) is over the box. |
| `role` | `'alert' \| 'status'` | by type | Overrides the role. |
| `class`, `style` | `string`, `string \| Record<string, string \| number>` | — | On the box. |
| `classNames`, `styles` | `{ root?, icon?, section?, title?, description?, actions?, close?, progress? }` | — | Classes and inline styles of the parts. A value here wins over the host's and `config()`'s. |
| `props` | `Record<` `` `data-${string}` `` `\|` `` `aria-${string}` `, string>` | — | Attributes of the box. |
| `onclick` | `(event: MouseEvent) => void` | — | Called when the box is clicked (not its close button). |
| `onclose` | `(reason: 'timeout' \| 'user' \| 'replaced' \| 'destroy') => void` | — | Called once, when the notification starts to close: its time ran out, the user closed it (the button or Escape), the limit pushed it out, or code closed it. |

## Settings: `notification.config()` and the props of `NotificationHost`

| Setting | Type | Default | Description |
|---|---|---|---|
| `top`, `bottom` | `number \| string` | `24` | Distance of the top and of the bottom places from the window edge; a number is pixels. |
| `placement` | the six places | `'topRight'` | The place of every notification that does not name one. |
| `duration` | `number \| false` | `4.5` | Default duration, in seconds. |
| `maxCount` | `number` | — | At most this many open notifications, **in all places together**; the oldest closes to make room (`onclose('replaced')`). A value below 1 is ignored. |
| `container` | `HTMLElement \| (() => HTMLElement)` | `document.body` | Where the layer is moved to. |
| `closable`, `closeIcon`, `showProgress`, `pauseOnHover` | as above | as above | Defaults of the options with these names. |
| `labels` | `Partial<Record<'open' \| 'info' \| 'success' \| 'error' \| 'warning' \| 'close', string>>` | English | The hidden word read before the title, and the name of the close button. `''` removes a type word (the default of `open`). |
| `classNames`, `styles` | the eight parts, plus `list` and `listContent` | — | Defaults for every notification; `list` is the scrolling column of a place and `listContent` its rows. |
| `stack` | `boolean \| { threshold?: number }` | `true` | See below. |

Methods: `notification.open(options)`, `notification.info | success | error | warning(options)`,
`notification.destroy(key?)` (one by key, or all), `notification.config(options)` (`undefined` takes a setting back to its default).

### Stack

**On by default**, as in Ant Design React. Past the threshold (3) in a place the older notifications lie behind the newest
one as a pile: each 8px further from the edge and smaller by 6%, and the ones past the third cannot be seen. The pointer or
focus opens the pile into a plain list, and every timer waits while it is open. Each place has its own pile. The older
notifications of a closed pile are `inert` (an attribute that Chromium 90 and Firefox 85, the lowest supported versions, do
not know: there only their close button is kept out of the Tab order). `stack: false` turns it off, `{ threshold }` changes
the number.

### Container

`container` is the element the layer is put in (the `body` by default; an element or a function that returns one). It changes where
the layer sits in the page, not where it is drawn: the layer is `position: fixed`, so the notifications are still shown at the
window, as with `getContainer` in Ant Design. It is a setting of `notification.config()` or of a `NotificationHost`, so it applies
to every call on the page while it is in force; there is one active host, and `notification.*` has no instances of its own (an
instance bound to a host is reserved for a later version, see `specs/notification.md`).

Where it helps: a native modal `<dialog>` (`showModal()`) is shown in the top layer of the browser, over everything outside of it,
and nothing outside it can be reached. A layer in the `body` is then covered, and a layer in the dialog stands above it:

```ts
notification.config({ container: dialogElement }); // while the dialog is open
notification.config({ container: undefined }); // back to the body when it closes
```

The `Modal` of this library does not need it: its layer keeps the notification layer reachable.

## Accessibility

- `error` and `warning` are `role="alert"` and are read out at once; `info`, `success` and `open` are `role="status"` and
  wait for the reader. (Ant Design React gives `role="alert"` to all, which interrupts a reader for a plain "Saved".) The
  `role` option overrides it.
- The icon is decorative (`aria-hidden`). A hidden word before the title names the type ("Error: Upload failed"). The
  default is English: pass translations in `labels`, the library has no locale system yet.
- A notification never takes focus. What can take focus in it is the close button (a 24px native `<button>` named by
  `labels.close`) and the elements you put in `actions`. Enter and Space press the button, and `Escape` closes the
  notification that has focus inside it.
- The timer waits while the pointer is over the box, while focus is inside it, while a pile is open and while the page is
  hidden, and goes on with the time that was left. A touch does not hold it and does not open a pile. A notification that
  must stay needs `duration: 0`; the close button lets the user dismiss it (WCAG 2.2.1).
- `onclick` is for a mouse or a finger: the box cannot be reached with the keyboard. Put a button in `actions`.
- **The layer is the last element of its container**, so the keyboard reaches the buttons only after the rest of the page,
  and there is no shortcut that moves focus to the notifications. In a pile the older ones are `inert` and hidden from a
  screen reader; the pile opens when focus comes into it.
- Contrast: the text is about 15:1 on the box; the type icons are held to 3:1 and the close button to 4.5:1 (in the dark
  theme, and in the light theme with `tokens-accessible.css`, which darkens the green, the amber and the close button).
- In forced-colors modes such as Windows High Contrast the box, the close button and the strip are drawn with a border.
- Positions use logical properties, so the order of icon and text mirrors in right-to-left layouts.
- **Not checked:** a real screen reader (there is no Orca test for Notification yet; `Message` has one), NVDA, JAWS,
  VoiceOver, a phone screen reader, a real touch device (touch is tested with emulated touch in Chromium) and a real Safari.

## Scope decisions and differences from Ant Design

- The layer is made by the library; the React `notification.useNotification()` with `contextHolder` and the `App` component
  are replaced by `<NotificationHost>` placed in the tree. `title` and `actions` are the current React names (`message` and
  `btn` are deprecated there). `prefixCls` and `rtl` are not implemented (the direction is inherited), nor the Vue `warn`
  alias and the Angular `nzAnimate`. `duration` is in seconds as in React and Vue (Angular: milliseconds). The object form
  of the React `closable` is `closeIcon` and `onclose` here.
- A role per type and a hidden type word, the pauses for focus, an open pile and a hidden page, a close function that is not
  thenable, and the reason of `onclose` are new.
- The `ConfigProvider` settings come with a ConfigProvider component.
- See [`specs/notification.md`](../../../specs/notification.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/notification/).
