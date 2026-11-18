# Modal specification

Status: **implemented on `feat/modal` (2026-11-18): decisions D1 to D7 answered, proposals P1 to P20 accepted by the maintainer, tests, the page on the site and the Orca test done; nothing is pushed yet**. The
Modal is built on the branch `feat/modal`, stacked on `feat/overlay-primitives` (`specs/overlay.md`) and `feat/internal-icons` (`specs/icons.md`); that is a conscious exception to rule 6b, recorded under
"Dependencies". The answers: **D1** the cancel ways close the Modal unless the handler vetoes (C), and a new prop `closeOnOk`; **D2 A**, the static family (`modal.confirm`, `info`, `success`, `warning`,
`error`) is in v1.0; **D3 B**, the icons are extracted first; **D4 B**, the Message layer carries `data-ads-overlay-keep`; **D5** to **D7** as recommended (the host as in Message, a handle that
can be awaited, `alertdialog`).

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses the
documentation, the changelog and trackers, and black-box observation of the public demos (CLAUDE.md sections 2, 4a and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | `components/modal/index.en-US.md` in the repository (docs text only), and the public demos | docs of 6.7.x; site 6.7.1, 2026-11-18 |
| NG-ZORRO (Angular) | `components/modal/doc/index.en-US.md` (docs text only), <https://ng.ant.design/components/modal/en> | `master`, 2026-11-18 |
| Ant Design Vue | `components/modal/index.en-US.md` (docs text only; the site renders on the client; standing permission) | `main`, 2026-11-18 |
| Changelog | `ant-design/ant-design` `CHANGELOG.en-US.md` (the 6.x line: 38 lines mention Modal) | 2026-11-18 |
| Trackers | GitHub search of the three repositories (titles and counts; the text of one issue with code removed) | 2026-11-18 |
| Black-box | the demos of the three libraries, Chromium under Playwright (results below) | 2026-11-18 |

## What it is

A **Modal** is a dialog drawn over the page that the user has to deal with before going on: a form, a confirmation, a piece of
information. It is used in two ways, as all three libraries do: written into the markup (`<Modal bind:open>`, the content is yours), or called from code (`modal.confirm({ ... })`, a
ready-made dialog with an icon, a title, a text and buttons; D2). It has a title, a body, a footer with OK and Cancel, a close button and a dimmed mask. It is **not** a Drawer (an
edge panel), a Popover or a Popconfirm (small and anchored to an element, not blocking) and not a Message. Its parts of the
mechanism (the layer in the body, the leave animation, the scroll lock, the page behind it, focus) are the shared parts
`internal/portal`, `internal/anim/leave` and `internal/overlay` (`specs/overlay.md`); the Modal is their first user.

## Parts and elements

```
<div class="ads-modal-root">                       root: the fixed layer in the container, z-index 1000 (a portal)
  <div class="ads-modal-mask">                     mask: the dimmed backdrop
  <div class="ads-modal-wrapper">                  wrapper: the scroll area, the whole layer (a press on it, outside the dialog, is a press on the mask)
    <div class="ads-modal" role="dialog">          dialog: the positioned box (width, top), role, aria-modal, aria-labelledby, tabindex="-1"
      <div class="ads-modal-content">              content: the card (background, radius, shadow, padding 20px 24px)
        <button class="ads-modal-close">           close: 32px, at 12px from the corner (the end side in right-to-left)
        <div class="ads-modal-header">             header: only when there is a title
          <div class="ads-modal-title" id>         title
        <div class="ads-modal-body">               body: the content
        <div class="ads-modal-footer">             footer: OK and Cancel (Button), or what `footer` says
```

The ten names (`root`, `mask`, `wrapper`, `dialog`, `content`, `close`, `header`, `title`, `body`, `footer`) are the semantic parts that
`classNames` and `styles` address. The semantic names of Ant Design 6 were not verified (its list is a demo, not text); these are ours.

A **static dialog** (`modal.confirm` and the others) is the same box with no header and no close button, and with this inside the `content` card, in the place of the `body`:

```
<div class="ads-modal-confirm-body">                 confirmBody: the row of the icon and the text
  <span class="ads-modal-confirm-icon">              icon: 22 px, the type's icon (the shared Icon)
  <div class="ads-modal-title" id>                   title: as in the header
  <div class="ads-modal-description" id>             description: the text under the title, aligned with it
<div class="ads-modal-footer">                       footer: Cancel and OK (only OK for info, success, warning, error)
```

Its three more parts are `confirmBody`, `icon` and `description` (13 parts in all).

## What the three libraries do (black-box, 2026-11-18)

Chromium under Playwright, the first demo of each page ("Open Modal"), a classic 15 px scrollbar (10 px in the React page).

| | React 6.7.1 | Vue (antdv.com) | Angular (ng.ant.design) |
|---|---|---|---|
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to the title, `tabindex="-1"` | `role="dialog"` on the full-screen wrapper, `aria-labelledby`, `tabindex="-1"`, **no** `aria-modal` | `role="dialog"` on `nz-modal-container`, `tabindex="-1"`, **no** `aria-modal` and no label |
| Close button | `aria-label` (the demo sets it), 32 px at 12 px from the corner | `aria-label="Close"` | `aria-label="Close"` |
| Focus on open | the **close button** (the first tabbable) | the **dialog** itself | the **close button** |
| Tab | Cancel, OK, then **one stop on the page body** (no element), then the close button again | not measured | not measured |
| Page behind | not `inert`, not `aria-hidden` (the layer covers it: a press at a point outside the dialog hits the layer) | two body-level elements carry `aria-hidden="true"` (which ones was not identified) | not hidden |
| Scroll | locked (the scrollbar goes away, the wheel does nothing) | locked (the scrollbar goes away) | **not locked** (the scrollbar stays; their tracker has "modal component block scroll implement") |
| Escape | closes; focus goes back to the button that opened it | the same | the same |
| Enter | mask: fade 0.2 s linear; dialog: `antZoomIn` 0.3 s `cubic-bezier(0.08, 0.82, 0.17, 1)` with the **transform origin at the click** | not measured | not measured |
| `mask` off (React demo "No mask") | no mask drawn, but the layer still covers the page, the scroll is still locked, `aria-modal` stays `true` | not measured | not measured |

**Geometry of the React dialog** (desktop, 1280 px): width 520, top 100 (not centered), `max-width: calc(100vw - 32px)`; content
`padding: 20px 24px`, radius 8, shadow `0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05)`,
white; header 24 px high (title 16 px / 24 px, weight 600, color `rgba(0,0,0,.88)`), `margin-bottom: 8px`; body 14 px / 22 px; footer
`margin-top: 12px`, buttons at the end, 32 px high, 8 px apart; close 32 x 32, radius 4, color `rgba(0,0,0,.45)`; mask
`rgba(0,0,0,.45)`, no blur; the wrapper scrolls (`overflow: auto`), `z-index: 1000`. On a phone (390 px) the margin is 8 px, so the
dialog is `100vw - 16px` wide, and the top is 100 + 8.

**The static dialog (React 6.7.1, demo "Static confirmation", Chromium, 2026-11-18).** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to the title, **no** `aria-describedby`; 416 px wide,
top 100; the card `padding: 20px 24px`, radius 8; **no close button**; an icon 22 px at the start, the title 16 px / 24 px weight 600 at 34 px from the start (the icon and a 12 px gap), the text 14 px / 22 px under the
title (8 px) and in line with it, the buttons 12 px under the text, at the end; focus on the **OK button**; a press outside does **not** close it; Escape closes it. The React and Vue docs say the same: `closable`
and `maskClosable` default to `false` for the methods, and `autoFocusButton` is `ok` (Angular: `nzMaskClosable` `false` and `nzWidth` 416 in the confirm mode).

## Public record (changelogs and trackers)

Turned into requirements below (rule 7a: only public traces).

| Trace | What it says | Where it goes |
|---|---|---|
| React 6.0.0, PR 52753 | opening and closing quickly froze the screen | R2: open, close, open inside the leave animation leaves the page free |
| React 6.2.0, 56142, 56500 | focus capture rewritten so that focus does not escape; `focusable.trap` added | R9 |
| React 6.2.0, 56386 | an Image nested in a Modal could not be closed in order with Esc | R9: Escape goes to the topmost layer |
| React 6.0.0, 53289; 6.6.1, 58953; tracker 49554 | `aria-*` on the close button; the name of the close button was not translated | R6: `closable['aria-label']`, a default |
| React 6.5.0, 58256 | `scrollLock` | R10 |
| React 6.3.0, 56781; tracker 56707 | the mask blur was slow, worse with nested Modals, and is off by default since 6.3 | `mask.blur` is not in v1.0 (P8) |
| React 6.6.3, 59233 | closing by the mask misbehaved when the same `mask` object was reused | R3: the mask options are read each time, never changed |
| React 6.6.4, 59254, 59255 | falsy `okText`, `cancelText` fell back to the default; `cancelButtonProps.onClick` stopped `onCancel` | R4, R5: a user's handler on a button does not stop the Modal's own |
| React 6.6.5, 59153; 6.6.8, 59294 | numeric `0` content was not shown; a custom button `onClick` stopped the confirm callbacks | R4, R6 |
| React 6.4.4, 58120; 6.3.1, 57024 | footer buttons misaligned with `confirmLoading`; empty icon left a gap | R4: `confirmLoading` does not change the size or the place of a button |
| Tracker (React) 50170, (Vue) 7838 | "Blocked aria-hidden on an element because the element that just received focus must not be hidden": the page behind was hidden while the focus was still in it | **a fix in the primitive** (`openOverlay` moves focus in first): see "Findings for the primitives" |
| Tracker (React) 51503, 43327 (open) | the scroll lock does not work on a page that scrolls on `html` | already handled in the primitive (`html` is locked too) |
| Tracker (React) 23202; 27243 | iOS scrolls the page under a Modal; the browser Back button leaves the page locked | R10: the iOS limit is said on the page; a destroyed Modal always lets the page go |
| Tracker (Vue) 2162; 1319 | the page jumped when the scrollbar went away; the focus state of the page moved the scroll after close | R10 (padding), R9 (focus returns without scrolling) |
| Tracker (Vue) 2182; (Angular) 7865, 7430 | a Select list inside a scrolled Modal did not follow it | R9: a Select inside a scrolling Modal (browser test) |
| Tracker (Angular) 5376 | the Modal closed when a press started inside it and ended on the mask (selecting text) | R3: the mask closes only when the press **started** on the mask |
| Tracker (React) 48520 (open) | Escape did not close the Modal when focus was in a search Select inside it | R9: Escape with focus in a closed Select closes the Modal (the lab of the primitives already does it) |
| Tracker (React) 22031, 18453 | a Modal opened from a popup (the not-found area of a Select, a Cascader option) could not be focused: the popup closed on the press | R14: a known limit, tested and said on the page (P12) |
| Tracker (React) 40380, 51306 | an audit: a focusable element with no interactive content in the Modal | R9: no sentinel `tabindex="0"` elements; the only `tabindex` is `-1` on the dialog |

## Differences React / Vue / Angular (CLAUDE.md section 5)

| Level | React 6.7 | Vue | Angular | Ours |
|---|---|---|---|---|
| Presence | `Modal`, static `Modal.info/success/error/warning/confirm`, `Modal.useModal`, `Modal.destroyAll` | the same (`Modal.useModal`, `Modal.confirm`...) | `nz-modal`, `NzModalService.create/info/success/error/warning/confirm`, `NzModalRef` | `Modal`, and the static family `modal.confirm/info/success/warning/error`, `modal.destroyAll` (D2 A); `ModalHost` takes the place of `useModal` and `contextHolder` |
| Open state | `open`, controlled: the Modal calls `onCancel`, the parent closes it | `v-model:open`, closes itself | `[(nzVisible)]`, closes itself | D1 |
| Mask | `mask: boolean \| { enabled, blur, closable }` (`maskClosable` deprecated) | `mask`, `maskClosable` | `nzMask`, `nzMaskClosable` | `mask: boolean \| { enabled, closable }` (P8) |
| Closing | `closable: boolean \| { closeIcon, disabled, onClose, afterClose, aria-* }`, `closeIcon` | `closable`, `closeIcon` | `nzClosable`, `nzCloseIcon` | `closable: boolean \| { closeIcon, disabled, 'aria-label' }`, `closeIcon` |
| Footer | `footer`: node, `null`, or a render function `(origin, { OkBtn, CancelBtn })` | `footer`: string, slot, `null` | `nzFooter`: string, template, `ModalButtonOptions[]`, `null` | `footer`: string, snippet with `{ origin, ok, cancel }`, `null` |
| Buttons | `okText`, `cancelText`, `okType`, `okButtonProps`, `cancelButtonProps`, `confirmLoading` | the same | `nzOkText`, `nzCancelText`, `nzOkType`, `nzOkDanger`, `nzOkLoading`, `nzCancelLoading`, `nzOkDisabled`, `nzCancelDisabled` | the React set; the Angular ones through the button props |
| Content | `children` | slot | `nzContent` (text, template, component) | `children` |
| Position | `centered`, `width` (also by breakpoint), `style`, `zIndex` | `centered`, `width`, `zIndex` | `nzCentered`, `nzWidth`, `nzStyle`, `nzZIndex`, `nzDraggable` | `centered`, `width` (string, number), `style`, `zIndex` |
| Lifecycle | `destroyOnHidden` (`destroyOnClose` deprecated), `forceRender`, `afterClose`, `afterOpenChange`, `loading` (skeleton) | `destroyOnClose`, `forceRender`, `afterClose` | `nzAfterOpen`, `nzAfterClose`, `nzCloseOnNavigation` | `destroyOnHidden`, `forceRender`, `onafterclose`, `onafteropenchange` |
| Container | `getContainer`: element, function, selector, `false` | `getContainer`: function | none | `container`: element, function, selector, `false` |
| Focus | `focusable: { trap, focusTriggerAfterClose }`, `autoFocusButton` (methods) | `autoFocusButton` (methods) | `nzAutofocus: 'ok' \| 'cancel' \| 'auto' \| null` | `focusable: { trap, focusTriggerAfterClose }` |
| Scroll | `scrollLock` | locked | not locked | `scrollLock` |
| Customization | `classNames`, `styles` (object or function), `wrapClassName`, `modalRender` | `bodyStyle`, `maskStyle`, `wrapClassName` | `nzBodyStyle`, `nzMaskStyle`, `nzClassName`, `nzWrapClassName` | `class`, `style`, `wrapClassName`, `classNames`, `styles`, `modalRender` |

Not taken, with the reason:

- **Vue and Angular only:** `bodyStyle`, `maskStyle` (React replaced them by `styles.body` and `styles.mask`); Angular `nzDraggable`,
  `nzCloseOnNavigation`, `nzDirection`, `nzData`, `nzContent` as a component, `NzModalRef`, `ModalButtonOptions[]`, `nzOkText=null` to hide a button
  (a `footer` snippet does it), `nzOkDanger`, `nzOkLoading`, `nzCancelLoading`, `nzOkDisabled`, `nzCancelDisabled` (all are `okButtonProps` and
  `cancelButtonProps`); Vue `appContext`; `afterOpen` as an event emitter.
- **React, deprecated, replaced:** `destroyOnClose` -> `destroyOnHidden` (5.25); `maskClosable` -> `mask.closable` (6.3.0);
  `focusTriggerAfterClose` -> `focusable.focusTriggerAfterClose` (6.2.0); `autoFocusButton` -> `focusable.autoFocusButton` (6.2.0, for the static
  methods). The names of the chain are taken at their last link, as rule 4a says. `visible` (old) -> `open`.
- **React, not suited to Svelte:** the function form of `classNames` and `styles` (compute the object in `$derived`, as in Message);
  `ConfigProvider` (v1.1); `getContainer` as a name (the library says `container`, as Popup and Message do).

## API (proposed)

`import { Modal } from 'svelte-ant-design'`. The text of the buttons is English by default; a locale arrives with `ConfigProvider` in v1.1, and
until then `okText`, `cancelText` and `closable['aria-label']` take the words of the app.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | `boolean`, `bind:open` | `false` | D1 |
| `title` | `string \| number \| Snippet` | none | no title: no header; `0` is shown |
| `children` | `Snippet` | none | the body |
| `footer` | `string \| number \| Snippet<[{ origin: Snippet; ok: Snippet; cancel: Snippet }]> \| null` | the two buttons | `null` removes the footer; the snippet may place `origin` (both buttons), or `ok` and `cancel` apart |
| `okText`, `cancelText` | `string \| number \| Snippet` | `OK`, `Cancel` | only `undefined` falls back to the default: `''` and `0` are shown (React 6.6.4) |
| `okType` | `ButtonType` | `primary` | the `type` of the OK button |
| `okButtonProps`, `cancelButtonProps` | `ComponentProps<typeof Button>` | none | rule 6b; their `onclick` runs **and then** the Modal's own `onok`, `oncancel` (React 6.6.4, 6.6.8) |
| `confirmLoading` | `boolean` | `false` | `loading` of the OK button; no change of its size |
| `onok` | `(event: MouseEvent) => unknown` | none | the OK button was pressed; a Promise it returns keeps the OK button loading (with `closeOnOk`); the Modal closes only with `closeOnOk`. The type is `unknown` so that `onok={() => (open = false)}` type-checks |
| `closeOnOk` | `boolean` | `false` | D1. `false`: as in all three libraries, the app closes the Modal after it checked or saved. `true`: the confirm behavior, R4 |
| `oncancel` | `(event: MouseEvent \| KeyboardEvent) => void` | none | D1: close button, Cancel, Escape, the mask |
| `closable` | `boolean \| { closeIcon?: Snippet; disabled?: boolean; 'aria-label'?: string }` | `true` | `disabled` shows the button but it does nothing |
| `closeIcon` | `Snippet` | a cross | hiding is `closable={false}` (narrowing of React's `false`/`null`: P3) |
| `mask` | `boolean \| { enabled?: boolean; closable?: boolean }` | `true` | `closable` default `true`; `blur` reserved (P8) |
| `keyboard` | `boolean` | `true` | Escape closes (R3) |
| `centered` | `boolean` | `false` | |
| `width` | `string \| number` | `520` | number is px; `{ xs, sm, ... }` reserved (P8) |
| `zIndex` | `number` | `1000` (`--ads-modal-z-index`) | |
| `container` | `HTMLElement \| (() => HTMLElement) \| string \| false` | `document.body` | `string` is a selector; `false` leaves the Modal in place (React `getContainer`) |
| `destroyOnHidden` | `boolean` | `false` | the content is removed on every close |
| `forceRender` | `boolean` | `false` | the Modal is in the page, hidden, before the first opening |
| `focusable` | `{ trap?: boolean; focusTriggerAfterClose?: boolean; autoFocusButton?: 'ok' \| 'cancel' \| null }` | `{ trap: true, focusTriggerAfterClose: true }`, no `autoFocusButton` | R9. `autoFocusButton` is a widening of React, where only the static methods have it: here the plain Modal takes it too (cheap, same code); without it focus goes to the first element Tab reaches |
| `scrollLock` | `boolean` | `true` | R10 |
| `modalRender` | `Snippet<[Snippet]>` | none | gets the card and may wrap it (P7) |
| `class`, `style` | `string` | none | on the `dialog` box |
| `wrapClassName` | `string` | none | on the `wrapper` (the same part as `classNames.wrapper`) |
| `classNames`, `styles` | `Partial<Record<ModalPart, string>>`, `Partial<Record<ModalPart, SemanticStyle>>` | none | the ten parts above (and `confirmBody`, `icon`, `description` of a static dialog); the object form only |
| `onafteropenchange` | `(open: boolean) => void` | none | after the enter or the leave animation ends |
| `onafterclose` | `() => void` | none | after the leave animation, when the Modal is gone |
| `...rest` | HTML attributes of the `dialog` box | | `id`, `aria-label` (needed when there is no title), `data-*` |

### Value forms per prop (rule 5, item 4)

| Prop | React | Vue | Angular | Ours | Narrowing |
|---|---|---|---|---|---|
| `title` | `ReactNode` | `string \| slot` | `string \| TemplateRef` | `string \| number \| Snippet` | none (`0` shown) |
| `footer` | `ReactNode`, function, `null` | `string \| slot`, `null` | `string`, template, `ModalButtonOptions[]`, `null` | `string \| number \| Snippet \| null` | `ModalButtonOptions[]` is Angular only |
| `okText`, `cancelText` | `ReactNode` | `string \| slot` | `string`, `null` hides | `string \| number \| Snippet` | Angular's `null` is not taken |
| `closeIcon` | `ReactNode`; `null` or `false` hides | `VNode \| slot` | `string \| TemplateRef` | `Snippet` | `false` and `null` (P3) |
| `closable` | `boolean \| ClosableType` | `boolean` | `boolean` | `boolean \| { closeIcon, disabled, 'aria-label' }` | `onClose`, `afterClose` of `ClosableType` (they repeat `oncancel` and `onafterclose`) |
| `width` | `string \| number \| Breakpoint` | `string \| number` | `string \| number` | `string \| number` | `Breakpoint` reserved (P8) |
| `container` | element, function, selector, `false` | function | none | element, function, selector, `false` | none |

### The static family (D2 A, D5, D6, D7)

```ts
import { modal, ModalHost } from 'svelte-ant-design';

const handle = modal.confirm({ title: 'Delete the file?', content: 'This cannot be undone.', okText: 'Delete', okButtonProps: { danger: true } });
if (await handle) remove();            // true for OK, false for Cancel, the close and Escape
handle.update({ content: 'Deleting...' });
handle.destroy();
```

| Member | Meaning |
|---|---|
| `modal.confirm(options)` | Cancel and OK; the icon is the `warning` disc, in the warning color (as React's `ExclamationCircleFilled`) |
| `modal.info`, `modal.success`, `modal.warning`, `modal.error` `(options)` | OK only; the icon is of its type |
| `modal.destroyAll()` | closes every static dialog (a route change, as the three libraries advise) |
| the returned handle | an object `{ destroy(), update(patch \| (previous) => patch), then }`: `await handle` is `true` for OK and `false` for every other way to close; `destroy()` closes it and resolves `false` |
| `<ModalHost />` | D5: optional, in the tree of the app (like `MessageHost`): the static dialogs are drawn where it stands, so they see the context of the app (theme, locale of later versions); with none, the library makes its layer on first call in the body and removes it with the last dialog; one host is active |

`ModalFuncOptions` is `ModalProps` without `open`, `children`, `footer` (a text or a snippet is still allowed: it is `footer`), `closeOnOk` and `modalRender`, plus: `title`, `content` (`string \| number \| Snippet`), `icon`
(`Snippet \| string \| false`; `false` removes it), `okCancel` (a `confirm` has Cancel; `info`, `success`, `warning`, `error` have not, and `okCancel: true` adds it), `focusable.autoFocusButton` (`'ok' \| 'cancel' \| null`, default `'ok'`). Its defaults differ from
the `Modal`'s as in React (P15): `width` 416, `closable` `false`, `mask.closable` `false`, `keyboard` `true`, `centered` `false`, `closeOnOk` **`true`** (a static dialog always did that). `onok` and `oncancel` of a static
dialog may return a Promise: while it is pending the OK button is loading, a resolve closes, a reject or `event.preventDefault()` keeps it open (R15).

## Behavior

**R1. Rendering.** Nothing is in the page until the first opening (unless `forceRender`); then the layer is in the container and stays, hidden, after a
close, unless `destroyOnHidden` removes the content. The server renders nothing. The portal places the layer when it mounts (`specs/overlay.md`, P1).
**R2. Opening and closing.** The mask fades in (0.2 s, linear) and the dialog zooms in (0.3 s, `cubic-bezier(0.08, 0.82, 0.17, 1)`) from the
point of the last press (the transform origin), as React does; leaving is the reverse, and the layer is hidden when the animation ends
(`waitForLeave`), at once under `prefers-reduced-motion`. `onafteropenchange(true)` after the enter, `onafteropenchange(false)` and `onafterclose` after the leave.
Opening again during the leave cancels the hiding. Opening, closing and opening again quickly leaves the page scrollable, reachable and with one lock held.
**R3. Dismissal.** Four ways: the close button, Cancel, Escape (`keyboard`), the mask (`mask.closable`). Each calls `oncancel(event)` (a mouse event, or the
keyboard event for Escape); after it the Modal closes unless the handler called `event.preventDefault()` (D1). A mask press counts only when the press **started** and
**ended** on the mask: selecting text inside and releasing outside does not close. `closable.disabled` stops the close button and nothing else. The mask options
are read each time and never changed.
**R4. OK.** `onok(event)`. With `closeOnOk` **false** (the default, as in all three libraries) the Modal does not close: the app checks or saves, and closes it by setting `open = false`, with `confirmLoading` on the button meanwhile. With
`closeOnOk` **true**: after `onok` returns the Modal closes; if `onok` returned a Promise, the OK button is in its loading state until it settles, a resolve closes the Modal, a reject keeps it open; `event.preventDefault()` in `onok` keeps it open
in both modes. `confirmLoading` puts the OK button into its loading state: the footer keeps its height and the buttons keep their rows (the OK button may grow by its spinner towards the start side, as a loading `Button` does, and is still 32 px high). A user's `onclick` in `okButtonProps` or `cancelButtonProps` runs first and does not stop `onok` or `oncancel`.
**R5. Footer.** `undefined`: Cancel then OK, at the end, 8 px apart. `null`: no footer and no gap. A string or number: that text. A snippet gets `{ origin, ok, cancel }`.
**R6. Title and close.** The header exists only with a title; the title is what the dialog is named by. The close button is 32 px, in the corner of the
end side, with an accessible name (default `Close`) and a cross that is hidden from assistive technology. `closable={false}` removes it.
**R7. Layout.** Width 520, at most `100vw - 32px`; the top is 100 px, or the dialog is centered; a long body scrolls the wrapper, not the page; on a narrow screen the
margin is 8 px. Right-to-left mirrors the close button and the footer. `.ads-modal-body` is `display: flow-root`, so the margins of the content (a first paragraph) do not collapse through the card. Opening or closing does not move anything behind the layer.
**R8. Layers.** `z-index` 1000 (`--ads-modal-z-index`), below the popover, dropdown and tooltip layers of `Popup` (1030, 1050, 1070), so a Select in a Modal opens above it. A
second Modal opened later is above the first; `container` puts the layer elsewhere (`false`: where the Modal is written). The layer is always `position: fixed`: inside a container with a `transform`, a `filter` or `contain: layout` it is fixed to that container (as the layer of the Message).
**R9. Focus and keyboard** (all of it comes from `openOverlay`). On open focus goes to the first element that Tab reaches (the close button), or to the dialog if there is none; Tab and
Shift+Tab stay inside (`focusable.trap`); on close focus goes back to what had it (`focusable.focusTriggerAfterClose`), without scrolling. Escape closes the topmost layer; an
open Select inside closes its list first. No `tabindex="0"` sentinel elements. A Select inside a scrolling Modal keeps its list under the field.
**R10. Scroll and the page behind.** `scrollLock`: the page does not scroll and does not jump sideways; the page behind is `inert` (and `aria-hidden` where the engine
does not know `inert`); `aria-modal="true"`. A mask-less Modal (`mask: false` or `{ enabled: false }`) only draws no mask: it is modal in every other way, as React's is (P6).
**R11. Customization.** `class` and `style` on the box; `wrapClassName`; `classNames` and `styles` on the ten parts; `modalRender` wraps the card; the rest of the attributes on the box.
**R12. Server.** Nothing is rendered and the DOM is not touched.
**R13. Looks.** Light, dark and accessible tokens; forced colors: the card has a border (the shadow is gone), the cross and the buttons stay visible; `prefers-reduced-motion`: no animation.
**R14. Edge cases.** Open at mount; destroyed while open (the page is let go and the layer is removed); two Modals, closed in either order; a Modal inside a Modal; a Modal opened from a
popup (a known limit, P12); a long title; no title; no footer; many lines of body.

**R15. Static dialogs.** A call opens a dialog and returns its handle at once. The dialog is `role="alertdialog"` (D7), named by its title and described by its text (`aria-describedby`); focus goes to the OK button (or the Cancel button, or the dialog, by
`focusable.autoFocusButton`); there is no close button; a press outside does not close it; Escape does (it is a cancel). `update(patch)` changes the dialog in place (no new animation, the focus stays); `destroy()` and `modal.destroyAll()` close with the leave
animation and the layer goes with the last one. Calling on the server does nothing (no DOM): it returns a handle that resolves `false`. Dialogs opened one after another are stacked (the last one on top, Escape and Tab for it). A host that unmounts hands the open dialogs to the
layer of the library (as `MessageHost` does). `await` on a handle waits for the close: the page warns about it, as the Message page does.
## A11y (the contract is ours; the pages of the three libraries do not describe it)

Against the WAI-ARIA Authoring Practices "Dialog (Modal)": `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to the title (when there is one; otherwise
the app gives `aria-label`), focus moves in and returns, Tab and Shift+Tab stay inside, Escape closes, the page behind is out of reach. This is more than the three
libraries do (only React has `aria-modal`, none hides the page). The close button has a name; the title is a `div`, as in React (no heading level is imposed).
A static dialog is an **alert dialog** (the APG pattern for a message that needs an answer): `role="alertdialog"`, `aria-describedby` to its text, focus on the safe-to-press OK button by default
(`autoFocusButton`). React, Vue and Angular give it the plain `dialog` role (observed for React); the difference is deliberate and said on the page. The icons are decorative; the type is said by the title and the text, not by the icon.

## Colors, tokens and sizes

New tokens `--ads-modal-*` in `tokens.css` (light and dark; `tokens-accessible.css` only where a color is below 4.5:1): `z-index`, `mask-bg`, `content-bg`, `radius`, `shadow`, `padding`,
`title-color`, `title-font-size`, `title-line-height`, `title-font-weight`, `body-color`, `close-size`, `close-color`, `close-hover-color`, `close-hover-bg`, `footer-gap`, `width`, `top`, `motion-ease`, and for the static dialogs
`confirm-width` (416), `confirm-icon-size` (22), `confirm-icon-gap` (12) and the four icon colors `confirm-icon-info`, `-success`, `-warning`, `-error`.
The default widths are the tokens: a `Modal` without `width` is `var(--ads-modal-width)` wide, a static dialog without `width` is `var(--ads-modal-confirm-width)`; a `width` prop wins. Ant Design's `motionEaseOutCirc` (`cubic-bezier(0.08, 0.82, 0.17, 1)`) is not among our motion tokens yet: it is `--ads-modal-motion-ease`, not a new global one.

## Scope v1.0 (CLAUDE.md section 5a)

- **Core (in all three or in React and Vue with the same meaning):** `open`, `title`, `children`, `footer`, `okText`, `cancelText`, `okType`, `okButtonProps`, `cancelButtonProps`, `confirmLoading`, `closable`, `closeIcon`, `mask` and
  its `closable`, `keyboard`, `centered`, `width`, `zIndex`, `container`, `destroyOnHidden`, `forceRender`, `wrapClassName`, `onok`, `oncancel`, `onafterclose`; **and the static family** `modal.confirm`, `info`, `success`, `warning`, `error`, `destroyAll`,
  the handle with `update` and `destroy` (D2 A: it is in all three libraries).
- **Cheap React additions (<= 1 day each):** `classNames`, `styles`, `class`, `style`, `focusable`, `scrollLock`, `onafteropenchange`, the render form of `footer`, `modalRender`, the zoom from the click, `focusable.autoFocusButton`.
- **Ours, additive:** `closeOnOk` (D1), the `await` on a handle (React has it only on the hook form), the alert-dialog role (D7).
- **Deferred to v1.1+ (names and contracts reserved, additive):** `mask.blur` (`backdrop-filter` is prefixed in Safari before 18, and React turned it off by default for speed); `width` as `{ xs, sm, md, lg, xl, xxl }` (the Grid `Breakpoints` exist, so it is cheap
  later); `loading` (React 5.18; it draws a Skeleton, which the library does not have yet); `ConfigProvider` defaults and locale; `modal.config(defaults)`.
- **Not taken:** the list above under "Not taken", and `Modal.useModal` with `contextHolder` (a `<ModalHost />` in the tree gives the same context; there is no hook to make), `Modal.config({ rootPrefixCls })` (the prefix `ads-` is fixed).

## Dependencies

Rule 6b, step 0 of the workflow, done on 2026-11-18 against the stack `feat/overlay-primitives` -> `feat/internal-icons` -> `feat/modal` (`origin/main` f7c9823 merged into the first).

- **Component, whole: `Button`** (public file `src/lib/Button/Button.svelte`): the OK and Cancel buttons are the same element the user sees elsewhere and take the same props
  (`okButtonProps: ComponentProps<typeof Button>`). The plan (`ai/dependencies.md`) lists it for the Modal and it is in all three libraries, so rule 6b takes it without a question; it
  goes into `DEPENDENCIES` of `scripts/check-architecture.mjs` with the reason when the component is written.
- **Primitives (`src/lib/internal/`):** `portal` (the layer in the body), `anim` (`leave.ts`: hide when the leave animation ends), `overlay` (scroll lock, the page behind, focus, Escape and Tab) and `icons` (the cross of the close button and
  the four status icons of the static dialogs). None is in `origin/main`: they are on the two branches under this one. Rule 6b says to stop and ask; the maintainer decided on 2026-11-18 to build the Modal over the primitives branch (and, with D3 B,
  over a branch of the icons) and to push all of them together when the Modal is done. Helpers: `semantic`, `options`, `env`.
- **Not taken as components:** `Popup` (the Modal is not anchored), `Spin` (`confirmLoading` is the loading of `Button`), `Skeleton` (not in the library; `loading` is deferred).
- **A released component is touched, once (D4 B):** the layer of `Message` (`MessageLayer.svelte`) gets the attribute `data-ads-overlay-keep`, so that a message opened or still on the page while a Modal is open stays readable (`specs/overlay.md`, O2). One line,
  no change for a user; a test in `tests/Message.test.ts`. The icons branch also changes `MessageIcon.svelte` (an adapter), with no change in what it draws.
- **Between components:** the plan expects only `Button`; `ModalHost` and `modal` are part of the Modal; no cycle (`Button` does not use `Modal`).

## Findings for the primitives (fixed in the primitives worktree, then merged here)

- **F1 (fixed, commit 581c58a on `feat/overlay-primitives`).** `openOverlay` put the page behind the layer out of reach **before** it moved focus in. Where the engine does not know
  `inert`, that is `aria-hidden` on an ancestor of the element that still has focus, which Chrome reports and ignores (React tracker 50170, Vue 7838). Now focus goes in first, then the page is
  hidden. Tests: the order of the steps (they fail without the fix), `specs/overlay.md` O5.
- **F2 (test added, no fault found).** A quick open, close, open leaves one lock, no stale `inert` and a working layer (React 6.0.0, PR 52753): a unit test and a browser test in three engines.

- **F3 (fixed on `feat/overlay-primitives`).** The stack of layers cancelled the Escape key **before** it asked the layer to close, so a handler that vetoed the close (`event.preventDefault()` in `oncancel`) could not be told from the stack's own cancel. Now the stack passes the uncancelled event to the layer and cancels it after (in a `finally`). Test: a veto keeps the Modal open and Escape still does not reach the page.

## Decisions (answered by the maintainer on 2026-11-18)

### D1. Who closes the Modal: **C, and a new prop `closeOnOk`** (the recommended option, with the maintainer's addition)

The cancel ways (the close button, Cancel, Escape, the mask) call `oncancel(event)` and then close, unless the handler called `event.preventDefault()`; `bind:open` works as in `Popup`; React code ports (setting `open = false` in `oncancel` is harmless).
OK is the other question: in all three libraries it does **not** close the Modal by itself, because the app checks or saves first (`confirmLoading` shows it; a validation error keeps the form). The maintainer asked for a setting: **`closeOnOk`**, default `false`
(as the libraries), `true` for the confirm behavior (R4); the static dialogs use `true`. No library has it on the plain Modal: it is our addition, cheap and additive.

### D2. The static family: **A, in v1.0 now** (the maintainer's choice against the recommendation B)

About as much work as the Message was: the host, the handle, the four status icons, the confirm layout. The design follows the Message where the libraries agree (D5, D6) and React where they differ (the options). The release is one (all branches together).

### D3. The icons: **B, extract `internal/icons` first**

A branch of its own, stacked under the Modal (`specs/icons.md`): the four private icon files become thin adapters over one shared `Icon`; no change in what any component draws (checked pixel for pixel in three engines).

### D4. The layer of Message above a Modal: **B, one line in this stack**

A message already in the page when a Modal opens would be put out of reach with the page and a screen reader would not read the next one added to it. None of the three libraries has the problem (none hides the page: React has `aria-modal` and a
covering layer, Vue puts `aria-hidden` on two body-level elements, Angular does nothing; the message layers of Vue and Angular are `position: fixed` at `z-index` 1010, above the Modal's 1000). Ours is stricter (`inert`), so the Message layer carries
`data-ads-overlay-keep`. (The recommendation was B because the icons branch touches Message anyway.)

### D5, D6, D7. The static family (recommended, confirmed with the rest)

| | Decision | Why |
|---|---|---|
| D5 | The host is as in Message: no setup, the first call makes a layer in the body, and a `<ModalHost />` in the tree takes over; one active host | the same two paths as `message.*`; the host gives the context of the app |
| D6 | The call returns an object `{ destroy, update, then }`; `await handle` is `true` for OK, `false` otherwise | React's confirm returns an object with `destroy` and `update` and, on its hook form, `then`; here there is no hook form, so `then` is always there. The `await` trap is said on the page (as in Message) |
| D7 | Static dialogs are `role="alertdialog"`, described by their text | the APG pattern for a dialog that needs an answer; the libraries use `dialog` |

## Proposals P1 to P20 (cheap or settled; to be accepted as written or changed)

- **P1.** `open` is `$bindable`; `bind:open` as in Popup (D1 C).
- **P2.** `onok`, `oncancel`, `onafterclose`, `onafteropenchange`: lowercase callbacks, as `onselect` and `onopenchange` elsewhere. `oncancel` gets the event; the veto is `preventDefault`.
- **P3.** Narrowings: `closeIcon` is a `Snippet` (React also takes `null` and `false` to hide the button: use `closable={false}`); `closable` takes no `onClose` or `afterClose`; `footer` takes no list of buttons.
- **P4.** Defaults as React: width 520, top 100, `centered` false, mask on and closing, `keyboard` true, z-index 1000.
- **P5.** The initial focus is the first tabbable (the close button), as React and Angular do; with no tabbable it is the dialog. (Vue focuses the dialog.)
- **P6.** `mask: false` draws no mask and keeps every other modal behavior (observed in the React demo "No mask").
- **P7.** `modalRender` is a snippet that gets the card as a snippet and may wrap it (for a draggable Modal, which the library does not provide).
- **P8.** Reserved, not in v1.0: `mask.blur`, `width` by breakpoint, `loading`, `ConfigProvider` defaults and locale, `modal.config`.
- **P9.** The zoom starts at the point of the last press, kept by one document listener that exists only while a Modal exists; a keyboard open starts at the center. A press belongs to a Modal that opens in the same task as the click (see "Решения и обоснование") or within 300 ms of it; a Modal opened later (a timer, a request) zooms from the middle.
- **P10.** The title is a `div` and carries the id of `aria-labelledby`, as in React.
- **P11.** `wrapClassName` stays although `classNames.wrapper` is the same part (all of React, Vue and Angular have it).
- **P12.** A Modal opened from inside a popup is a known limit (the press in the Modal is outside the popup and closes it); the page says so and a test shows it; `container` is the remedy.
- **P13.** The OK and Cancel texts are English until the locale of v1.1; the page shows them translated through the props.
- **P14.** The compensation for the scrollbar is measured in Chromium, WebKit and (headed) Firefox as for the primitives; iOS before 16 is a documented limit.
- **P15.** The defaults of a static dialog are React's: width 416, no close button, the mask does not close it, Escape closes it, focus on OK, `closeOnOk` true.
- **P16.** `info`, `success`, `warning` and `error` have only OK; `confirm` has Cancel and OK; `okCancel` changes that.
- **P17.** `update(patch)` merges the patch into the options and re-renders in place; a function gets the previous options (React 4.8). `update` after `destroy` does nothing.
- **P18.** The `icon` of a static dialog is the shared `Icon` of its type; a `Snippet` or a `string` replaces it, `false` removes it; the colors are tokens (info blue, success green, warning amber, error red).
- **P19.** `modal.destroyAll()` closes the static dialogs only, never a `Modal` written in markup.
- **P20.** A static dialog called on the server does nothing and returns a handle that resolves `false`; the library keeps no module state on the server (as Message).
- **P21 (the maintainer's request on 2026-11-18, after the examples were checked in a browser; React and Vue do not do it).** Only the lowest open Modal draws its mask. A Modal opened over another one is still modal (its layer covers the page, the page is locked, Escape and Tab go to it) but adds no second dimming layer, so the page behind is as dark as with one Modal. The order of the open masks is one reactive list (`masks.svelte.ts`); a Modal joins it while it is shown and leaves it when its leave animation ends. Test: `tests/ModalMask.test.ts` (fails without the rule: two masks), `docs/e2e/site.spec.ts` (nested example: one visible mask, and still one after the upper one closes). A decision of the owner that differs from the three libraries, stated on the page of the nested example.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/ModalA11y.test.ts` (axe-core: no critical or serious violation for an open Modal, a Modal with no title and an `aria-label`, no footer, a custom footer, a loading OK button, and the five static dialogs; a guard test shows that an unnamed dialog is reported) and `tests/ModalBehavior.test.ts`, `e2e/modal.spec.ts`: compared with the APG pattern Dialog (Modal): `role="dialog"` (`alertdialog` for a static one), `aria-modal`, `aria-labelledby`, `aria-describedby` of an alert dialog, focus in and back, Tab and Shift+Tab that wrap, Escape, the page behind `inert` (`aria-hidden` where `inert` is unknown) |
| Forced colors | test | `e2e/modal.spec.ts` (the forced-colors case, three engines): the card has a border because the shadow is gone, the buttons and the cross stay visible |
| IME | n/a | the Modal has no text input of its own; Escape during a composition in an input inside it is ignored by the stack of layers (`tests/overlayStack.test.ts`, `event.isComposing`) |
| Touch | test | `e2e/modal-touch.chromium.spec.ts` (emulated touch, Chromium): a tap on the mask closes it and a tap inside does not, the close button and the footer buttons are targets of at least 32 px, a swipe on the layer does not scroll the page and a swipe that ends on the mask does not close. A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit): `e2e/modal.spec.ts` and `e2e/overlay.spec.ts` |
| Browser floor | test | `npm run test:floor`: five Modal checks (`modalPage` in `scripts/floor/smoke.cjs`: the layer and the geometry, focus and Tab, the scroll lock, the page behind, a static dialog) and the checks of the primitives (`overlayPage`) in Chromium 90, Firefox 85 and WebKit 15.4. WebKit 15.4 on Linux gives a `button` a 2 px margin, so the gap between the footer buttons is measured between their margin boxes |
| Screen reader | test | `screen-reader/modal.spec.ts`: Orca with Firefox through Guidepup (run in Docker on 2026-11-18, four runs in a row passed): with a Modal open the document starts inside it (the title and the close button, then the body lines, the field, Cancel and OK), nothing of the page behind is read, Tab goes around inside it and never reaches the page, Escape closes it and the page is read again from its heading; a static dialog is read from its title with its text and its two buttons, and has no close button. Whether Orca **announces a dialog when it opens** is not shown (this setup does not speak a focus move made by a script); NVDA, JAWS, VoiceOver and a phone are **not checked**; the page and the README say so |

## Список тестов

Each item is at least one test. Unit in jsdom (`tests/Modal.test.ts`, `ModalBehavior.test.ts`, `ModalStatic.test.ts`, `ModalStore.test.ts`, `ModalMessage.test.ts`, `ModalA11y.test.ts`); geometry, focus, scroll and the engines in `e2e/modal.spec.ts`; touch in `e2e/modal-touch.chromium.spec.ts`; the page of the site in `tests/docs/modal-page.test.ts` and `docs/e2e/site.spec.ts`.

- R1: nothing before the first open; stays after a close; `destroyOnHidden`; `forceRender`; the server renders nothing; the layer is in the container, `false` leaves it in place.
- R2: enter and leave play, `onafteropenchange` and `onafterclose` fire once with the right argument after the animation; reduced motion; open during the leave; open, close, open quickly (F2).
- R3: each way calls `oncancel` with the right event; `preventDefault` keeps it open; `keyboard` false; `mask.closable` false and `mask` false; a press that starts inside and ends on the mask does not close; `closable.disabled`; the options object is not changed.
- R4: `onok` and no close; `confirmLoading` (no change of size or place); a handler in `okButtonProps` and `cancelButtonProps` runs and so does the Modal's; `okType`; falsy `okText`.
- R5: default, `null`, text, a snippet with `origin`, `ok` and `cancel`.
- R6: title forms (`0` shown), no title, `closable` false, `closeIcon`, the name of the close button.
- R7: 520 px, the top 100 px, `centered`, `max-width`, a phone, a long body scrolls the wrapper, right-to-left (e2e).
- R8: the layer order against Popup layers (a Select in a Modal), two Modals, `zIndex`, `container`.
- R9: focus in on open, Tab and Shift+Tab, return, `focusable.trap` false, `focusable.focusTriggerAfterClose` false, Escape in a closed Select, Escape order, a Select in a scrolling Modal, no sentinels (e2e, three engines).
- R10: the scroll lock and the compensation, `scrollLock` false, the page `inert`, `aria-modal`, `aria-hidden` where `inert` is missing (floor), focus before hiding (F1).
- R11: `class`, `style`, `wrapClassName`, `classNames`, `styles`, `modalRender`, the rest attributes.
- R13: tokens (light, dark, accessible), forced colors, reduced motion.
- R14: open at mount; destroyed while open; two Modals closed in either order; a Modal in a Modal; a Modal in a popup (the limit).
- R4 `closeOnOk`: false keeps it open after `onok`; true closes after a sync `onok`; a Promise puts the OK button into loading and a resolve closes it, a reject keeps it open; `preventDefault` keeps it open in both; the OK button is not clickable twice while pending.
- R15: each of the five calls opens the right dialog (icon, buttons, role `alertdialog`, `aria-describedby`); `await` gives `true` for OK and `false` for Cancel, Escape, `destroy` and `destroyAll`; `update` (an object and a function) changes it in place and keeps focus; `destroy` after
  `destroy`; the defaults of P15; the host and the layer of the library (a host mounted later takes the open dialogs over; an unmounted one hands them back); two dialogs stacked; the server returns a handle that resolves `false`; the Message layer carries `data-ads-overlay-keep` and
  a message opened by the OK button of a Modal stays reachable (`tests/Message.test.ts`, e2e).
- Layout: opening and closing do not move anything behind the layer; `confirmLoading` does not move the buttons; a long title and a short one.
- Mutation testing: `npm run test:mutation -- --target=Modal`.

## Страница на сайте (done, stage 6)

Twenty examples in the two-column order (`docs/src/docs/examples/modal/`): basic; asynchronous close (`confirmLoading` and `closeOnOk`); footer and its render form; texts and props of the buttons; mask and keyboard; position and width; title and close button; long
content; nested Modals; `destroyOnHidden` and `forceRender`; `container`; `classNames` and `styles`; `focusable` and `scrollLock`; `modalRender`; a Select inside; the five static calls (and `okCancel`); the awaited answer; an OK and a Cancel that wait for a Promise; `update`, `destroy` and `destroyAll`; a `ModalHost`. Tables of props, static options, methods and tokens in
English, Russian and Chinese. The page names the limits: iOS before 16, a Modal inside a popup, a message that is already on the page (D4), the English default texts.

## Решения и обоснование

The decisions D1 to D7 and the proposals P1 to P20 above are the maintainer's answers of 2026-11-18 and are final for v1.0. Things that were settled while implementing, each with its test:

- **The zoom starts at the last press (P9).** The origin is computed from the layout offsets of the wrapper after the scroll lock is in place, not from a rectangle read while the card is scaled; the press counts for 300 ms and a click with `detail === 0` (a key) is ignored, so a keyboard open starts at the center. Which press counts is decided by the order of tasks first and by the clock second: the effects of a flush run as microtasks before the next task, so a Modal that opens in the task of the click was opened by it however long a slow page or a busy machine takes (a click was dropped after 300 ms of a starved WebKit, 0.3 to 1.2 s measured with 24 busy loops; 28 of 40 runs of the browser test failed, 40 of 40 pass after the change); a press that is older counts for 300 ms. Tests: `tests/Modal.test.ts` (it fails on the version that only read the clock) and `e2e/modal.spec.ts`.
- **A handle always resolves.** `closeEntry` is called when the dialog's `open` turns false and again in `onafterclose`, before the entry is removed (and by `destroy` and `destroyAll`); it is idempotent, so the handle resolves with or without a leave animation (`prefers-reduced-motion`).
- **`oncancel` is not the HTML `oncancel`.** The prop is removed from the inherited attribute type of `ModalProps` and typed as ours.
- **The widths are tokens** (see "Colors, tokens and sizes"), so a theme changes them without a prop.
- **A static dialog changes only what its role needs:** `alertdialog`, `aria-describedby`, focus on OK (D7).
- **Source of Ant Design:** not read for this component, so there is no section "Исходник, консультации"; the public record above is the only trace used.
