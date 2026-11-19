# Modal

A dialog over the page that the user has to deal with before going on: a form, a confirmation, a piece of information.
Ant Design-inspired styles and a Svelte 5 API. It is used in two ways: written into the markup (`<Modal bind:open>`, the
content is yours), or called from code (`modal.confirm({ ... })`, a ready-made dialog with an icon, a title, a text and
buttons).

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
</script>

<Button type="primary" onclick={() => (open = true)}>Open Modal</Button>

<Modal bind:open title="Basic Modal" onok={() => (open = false)}>
  <p>Some contents...</p>
</Modal>
```

While it is open the page does not scroll (and does not jump sideways when the scrollbar goes), the page behind it is out
of reach of the keyboard, the pointer and assistive technology, focus goes in, Tab and Shift+Tab stay inside, and Escape
closes it. When it closes, focus goes back to what had it.

### Who closes it

The **close button, Cancel, Escape and a press on the mask** call `oncancel(event)` and then close the Modal, unless the
handler calls `event.preventDefault()`. With `bind:open` the Modal sets `open` to `false` itself.

**OK does not close the Modal by itself**, as in React, Vue and Angular: the app checks or saves first. Close it in `onok`
by setting `open = false`, and show the wait with `confirmLoading`. Or set **`closeOnOk`**: the Modal then closes after
`onok` returns, and if `onok` returned a Promise it waits for it, with the OK button loading; a resolve closes, a
rejection keeps it open.

```svelte
<Modal bind:open title="Send the form" closeOnOk onok={() => fetch('/api/send', { method: 'POST' })}>
  …
</Modal>
```

### Static dialogs

```ts
import { modal } from 'svelte-ant-design';

if (await modal.confirm({ title: 'Delete the file?', content: 'This cannot be undone.' })) remove();
```

`modal.confirm` has Cancel and OK; `modal.info`, `modal.success`, `modal.warning` and `modal.error` have OK only
(`okCancel: true` adds Cancel). `modal.destroyAll()` closes every static dialog (never a `Modal` written in the markup),
for example on a route change.

A call returns a handle: `destroy()`, `update(patch)` (an object is merged, a function gets the previous options) and a
promise. **`await modal.confirm(...)` waits until the dialog is closed** (and so does returning the handle from an `async`
function): `true` for OK, `false` for Cancel, Escape and `destroy()`. `onok` and `oncancel` of a static dialog may return a
Promise; the button loads while it is pending, a resolve closes the dialog and a rejection (or `event.preventDefault()`)
keeps it open.

A static dialog differs from a `Modal`: 416 px wide, no close button, a press on the mask does not close it, `closeOnOk`
is on, focus starts on OK, and it is an alert dialog (`role="alertdialog"`, described by its text).

### `ModalHost`

With no setup the library makes a layer in the body when the first static dialog opens and removes it with the last one.
`<ModalHost />` draws them where you put it (near the root of the app), so they see the context of that place:

```svelte
<script lang="ts">
  import { ModalHost } from 'svelte-ant-design';
</script>

<ModalHost />
```

Only one host is active at a time. On a server every `modal` call does nothing and returns a handle that resolves `false`.

## Props of `Modal`

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` (`bind:`) | `false` | Whether the Modal is shown. A way to close sets it to `false`. |
| `title` | `string \| number \| Snippet \| null` | — | The title. No title, no header; name the dialog with `aria-label`. `0` is shown. |
| `children` | `Snippet` | — | The body. |
| `footer` | `string \| number \| Snippet<[{ origin, ok, cancel }]> \| null` | Cancel and OK | `null` removes the footer. A snippet may place `origin` (both buttons) or `ok` and `cancel` apart. |
| `okText`, `cancelText` | `string \| number \| Snippet` | `OK`, `Cancel` | Left out, the default is used; `''` and `0` are shown. |
| `okType` | `ButtonType` | `'primary'` | The `type` of the OK button. |
| `okButtonProps`, `cancelButtonProps` | `ComponentProps<typeof Button>` | — | Props of the buttons themselves; their `onclick` runs first and does not stop `onok` or `oncancel`. |
| `confirmLoading` | `boolean` | `false` | The OK button is loading. |
| `onok` | `(event: MouseEvent) => unknown` | — | OK was pressed. |
| `closeOnOk` | `boolean` | `false` | Close after `onok`, waiting for a Promise it returned. |
| `oncancel` | `(event: MouseEvent \| KeyboardEvent) => void` | — | The close button, Cancel, Escape or the mask asked to close. `event.preventDefault()` keeps it open. |
| `closable` | `boolean \| { closeIcon?, disabled?, 'aria-label'? }` | `true` | The close button. `disabled` shows it but it does nothing. |
| `closeIcon` | `Snippet` | a cross | Replaces the cross. |
| `mask` | `boolean \| { enabled?, closable? }` | `true` | `false` draws no mask (the Modal is still modal). `closable: false` keeps a press on the mask from closing. |
| `keyboard` | `boolean` | `true` | Escape closes. |
| `centered` | `boolean` | `false` | Centered vertically instead of 100 px from the top. |
| `width` | `string \| number` | `520` | A number is pixels. At most the window width minus 32 px. |
| `zIndex` | `number` | `1000` | The layer, below the layers of a `Select` or a `Tooltip`, so a `Select` in a Modal opens above it. |
| `container` | `HTMLElement \| (() => HTMLElement) \| string \| false` | `document.body` | Where the layer is moved to; a string is a selector; `false` leaves it where it is written. |
| `destroyOnHidden` | `boolean` | `false` | Remove the content on every close. |
| `forceRender` | `boolean` | `false` | Put the Modal in the page, hidden, before the first opening. |
| `focusable` | `{ trap?, focusTriggerAfterClose?, autoFocusButton? }` | `{ trap: true, focusTriggerAfterClose: true }` | Tab stays inside; focus goes back after a close; `autoFocusButton` is `'ok'`, `'cancel'` or `null` (the dialog itself). |
| `scrollLock` | `boolean` | `true` | The page does not scroll while the Modal is open. |
| `zoomFromClick` | `boolean` | `false` | Zoom in and out from the place of the last click, as in Ant Design, instead of around the center of the dialog. |
| `modalRender` | `Snippet<[Snippet]>` | — | Gets the card and may wrap it. |
| `class`, `style`, `wrapClassName` | `string` | — | On the dialog box, and on the scroll area. |
| `classNames`, `styles` | the ten parts | — | `root`, `mask`, `wrapper`, `dialog`, `content`, `close`, `header`, `title`, `body`, `footer`. |
| `onafteropenchange` | `(open: boolean) => void` | — | After the enter or the leave animation ends. |
| `onafterclose` | `() => void` | — | After the leave animation, when the Modal is gone. |

Other attributes (`id`, `aria-label`, `data-*`) go on the dialog box.

Options of a static dialog (`ModalFuncOptions`): the same ones that make sense for a dialog called from code, plus `content`
(the text under the title), `icon` (`Snippet | string | false`) and `okCancel`; `classNames` and `styles` also take
`confirmBody`, `icon` and `description`. The tables of the documentation site list them all.

## Accessibility

- A `Modal` is `role="dialog"`, `aria-modal="true"`, named by its title (`aria-labelledby`). With no title give it an
  `aria-label`.
- Focus goes to the first element Tab reaches (the close button), or to the dialog if there is none; `focusable.autoFocusButton`
  chooses a button. Tab and Shift+Tab stay inside, Escape closes the topmost layer (an open `Select` inside closes its list
  first), and focus returns to what had it, without scrolling the page.
- The page behind is `inert` (and `aria-hidden` where the browser does not know `inert`). A message that is already on the page
  stays reachable.
- A Modal opened over another one draws no second mask: only the lowest open one dims the page (specs/modal.md, P21).
- A static dialog is an **alert dialog**: `role="alertdialog"`, `aria-describedby` to its text, focus on OK. React, Vue and Angular
  give it the plain dialog role.
- The icons are decorative. The close button is a native `<button>` named `Close` by default (`closable['aria-label']`). The texts
  of the buttons are English until the locale of a later version; pass your own words in `okText`, `cancelText` and
  `closable['aria-label']`.
- Contrast: the text and the buttons are held to 4.5:1 and the status icons of a static dialog to 3:1 (on the dark theme, and on
  the light theme with `tokens-accessible.css`, which darkens the green and the amber).
- In forced-colors modes such as Windows High Contrast the card is drawn with a border. Under `prefers-reduced-motion: reduce` the
  motion is off. Positions use logical properties, so the close button and the footer mirror in right-to-left layouts.
- Checked with a real screen reader: Orca with Firefox reads the title and the body of an open dialog first (the page behind is not
  read), Tab stays inside, a static dialog is read from its title with its text and buttons (`screen-reader/modal.spec.ts`).
- **Not checked:** whether a screen reader *announces* a dialog at the moment it opens (the Orca harness does not speak a focus
  move made by a script), NVDA, JAWS, VoiceOver, a phone screen reader, a real touch device (touch is tested with emulated touch in
  Chromium) and a real Safari.

## Known limits

- **A Modal opened from inside a popup** (the "not found" area of a `Select`, an option of a menu popup) is not supported: a press in
  the Modal is outside that popup, so the popup closes and takes the Modal with it. Open it from a button outside the popup, or
  put the Modal in another `container`.
- **iOS before 16** can scroll the page under the Modal with a swipe on the mask; the scroll lock is `overflow: hidden`.
- **The layer is `position: fixed`.** Inside a container with a `transform`, a `filter` or `contain: layout` it is fixed to that
  container.

## Scope decisions and differences from Ant Design

- `Modal.useModal` and `contextHolder` are replaced by `<ModalHost />` placed in the tree. `getContainer` is `container`.
  `ConfigProvider` defaults and locale, `mask.blur`, `width` by breakpoint and `loading` are planned for a later version.
- `closeOnOk` is new. The plain `Modal` takes `focusable.autoFocusButton` too (in React only the static methods have it), and
  a static dialog is an alert dialog.
- Not taken: the Vue and Angular `bodyStyle`, `maskStyle`, `nzDraggable`, `nzCloseOnNavigation`, a list of footer buttons, and
  the function form of `classNames` and `styles` (compute the object in a `$derived`).
- See [`specs/modal.md`](../../../specs/modal.md) for the full comparison and the reasoning.

## Live examples

Interactive examples of every option, with their code and the API tables, are on the
[documentation site](https://prostreyd.github.io/ant-design-svelte/components/modal/).
