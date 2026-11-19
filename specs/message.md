# Message specification

Status: **agreed (stage 2, 2026-11-16) and implemented (stages 3 to 6, 2026-11-16)**: the maintainer answered D1 to D4 (see
"Decisions for the owner") and accepted P1 to P12 as written in one answer ("принимаю"). Tests, the page of the
documentation site, the README and the CHANGELOG are written (see "Implementation notes" and the matrix); not released. The component is the first one of the project that is called from code
(`message.success('Saved')`) and not written into markup, so decision D1 shapes everything else.

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers, package manifests and black-box observation of the public demos
(CLAUDE.md sections 2, 4a and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/message> | 6.7.1 (site navigation), 2026-11-16 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/message/en> | 22.2.0 (site header), 2026-11-16 |
| Ant Design Vue | `components/message/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-16 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-16 |
| Issue trackers | React PR 53785 and 59622 (read through the GitHub API, code removed from the text); a search of the React tracker for accessibility of Message (8 hits, none about Message). **The Vue and Angular trackers were not searched**: the unauthenticated GitHub API ran out of its hourly limit | 2026-11-16 |
| Black-box | the public demos of the three libraries, Chromium under Playwright, 2026-11-16 (results below) | |

## What it is

A **Message** is a short, light, **non-blocking** notice that appears at the top and centre of the page after a user
action ("Saved", "Upload failed", "Loading...") and goes away by itself. It takes no focus and does not stop the user;
none of the three libraries gives it a button, ours has an optional close button (`closable`, D4). It is **not** a Notification (a card in a corner with a title, a description and a close
button), not an Alert (an inline banner in the page flow) and not a Modal. All three Ant Design documentations describe
the same intent: feedback such as success, warning, error; top and centre; dismissed automatically.

The difference from every component of the library so far is the **entry point**: a message is opened by a call from
code (an event handler, a request callback, a service), from anywhere, not by rendering an element in a template. The
three libraries solve it three ways (see the table), and the choice is decision D1.

## Parts and elements

The DOM as implemented. The layer (`list`) is made when the first message opens and moved to the container.

```
<div class="ads-message-list">                                    list: the fixed layer, z-index 2010; pointer-events: none
  <div class="ads-message-list-content">                          listContent: the column of rows (a grid while a pile is closed)
    <div class="ads-message-slot" data-message-id>                one row per message: takes the gap, animated in and out
      <div class="ads-message-item">                              animated box; `inert` and the pile transform live here
        <div class="ads-message ads-message-{type}" role="status | alert">   root: the visible box (made again on an update)
          <span class="ads-message-wrapper">                                 wrapper: icon and text
            <span class="ads-message-icon" aria-hidden="true">…</span>       icon
            <span class="ads-message-title">                                 title: the text
              <span class="ads-message-word">Error: </span>{content}         the hidden type word, then the content
            </span>
          </span>
          <button class="ads-message-close" aria-label="Close">…</button>    close: only with `closable`
        </div>
      </div>
    </div>
  </div>
</div>
```

The semantic parts for `classNames` and `styles` follow the React 6.x list (it names six): `root`, `wrapper`, `icon`,
`title` per message, and `list`, `listContent` for the layer. `wrapper` is the element around icon and title (React
6.4.0). A seventh, `close`, is ours (the close button). P3.

## What the three libraries do (black-box, 2026-11-16)

Measured in Chromium, light theme, page 1280 x 800, after the page was hydrated.

| | React 6.7.1 | Vue (antdv.com) | Angular 22.2.0 |
|---|---|---|---|
| Box | white, padding 9px 12px, radius 8px, 3-layer shadow | the same look | white, padding 10px 16px, radius 2px (older look) |
| Position | `top: 8px` to the box, centred, fixed; z-index 2010 | top 16 px to the box (8 + 8), z-index 1010 | top 32 px to the box, z-index 1010 |
| Icon | 16 px, `role="img"` with `aria-label` of the **icon file name** ("check-circle", "close-circle", "exclamation-circle", "loading", "info-circle"), the svg inside is `aria-hidden` | the same label | the same label |
| Text | 14 px, line height 22 px, `rgba(0,0,0,0.88)`; box height 40 px | the same | 22 px line, box 42 px |
| **Live region** | the box has **`role="alert"`** for every type, including info and success | **none**: no role, no `aria-live` | **none** |
| Focus | stays on the button that opened it | stays | stays |
| Layer and clicks | the layer ignores pointer events, only the box takes them (a regression of 6.0 was fixed: React PR 59622) | the same | the same |
| Default life | 3 s from the start of the enter motion, then the exit | 3 s (the docs contradict themselves: 1.5 and 3) | 3 s (the docs) |
| Several | the next box goes **below** (y 8, 64, 120: a 16 px gap); when one leaves, the others slide up | not measured | not measured |
| Click, Escape | a click on the box does not close it; Escape does nothing | not measured | not measured |
| Hover | **pauses** the timer; leaving resumes with the **remaining** time (measured: hover at 1 s, stay 5 s, leave: gone 2.2 s later, which is 2 s left and the exit motion) | not in the docs; not measured | docs: `nzPauseOnHover`, default `true`; not measured |
| Enter and exit | 0.2 s: from 64 px above and transparent to place and opaque; the exit is the same backwards | not measured | not measured (`nzAnimate` toggles it) |
| Dark theme | box `#1f1f1f`, text `rgba(255,255,255,0.85)`, a very faint shadow | not measured | not measured |
| Sequence (`.then`) | the next message starts **when the first one starts to leave** (the two cross-fade), not after the exit | | |

Two facts matter most for the contract of this component:

1. **Vue and Angular messages are silent for a screen reader** (no role, no live region); React announces **every** one
   as an assertive alert, including "Saved". The icon name read out ("check-circle") is not a type.
2. A message with `duration: 0` has **no way to be closed by the user** in any of the three (a click and Escape do
   nothing); only code closes it.

## Public record (changelogs and trackers)

Only what the documentation, changelogs and the one tracker pass show. Each line is a behavior that becomes a test.

- React, the 6.0.0 section of the changelog: `pauseOnHover` (PR 53785, "keep the timer running or not on hover");
  `classNames` and `styles` for the component and ConfigProvider (PR 52793) and the semantic parts of Message (PR 55054,
  55199). Later fixes: the Message list **blocked clicks on the page** outside the box (6.6.8, PR 59622) -> a test: a
  click next to a message reaches the page; the number `0` as content rendered wrongly for message and notification
  (6.6.5, PR 59153) -> a test with `0`; semantic style precedence with global settings (PR 58550); a build error in
  strict ESM toolchains (PR 57976, not applicable).
- React 6.4.0: `stack` (the version labels of the API table and of the demo). The demo list calls the static methods
  "Static method (deprecated)": they cannot consume the Context of ConfigProvider, which is why the hook form is
  recommended.
- Vue: `useMessage` did not honour `getContainer` (issue 6942) and removed the `body` (issue 6880), an offset problem
  (issue 7093), a hook-mode console warning (issue 7281) -> tests for the container option and for leaving the page
  untouched.
- Angular: DOM was not cleaned after use (7965), a z-index problem (8081, 1461), flicker when the window closes (6370),
  removal with no container (5123), leak in HMR (3859), `nzData` for a template (9001) -> tests: no leftover DOM, the
  layer is above other popups, nothing breaks when the container is gone.

## Differences React / Vue / Angular (CLAUDE.md section 5)

| Level | React 6.7.1 | Vue (4.x docs) | Angular 22.2.0 | Our decision |
|---|---|---|---|---|
| **Presence** | `message` static methods, `message.useMessage()` (hook, recommended), `App` | the same | `NzMessageService` | `message` object and a `MessageHost` component (D1) |
| **Methods** | `open`, `success`, `error`, `info`, `warning`, `loading`, `destroy(key?)`, `config` | the same + `warn` alias | `success`, `error`, `info`, `warning`, `loading`, `remove(id)` | `open`, `info`, `success`, `error`, `warning`, `loading`, `destroy`, `config` |
| **Call shape** | `(content, [duration], onClose)` or `(config)` | the same | `(content, options)` | both of React |
| **Return** | a function that closes, which is also thenable | the same | `NzMessageRef {messageId, onClose: Subject}` | the React and Vue form (D2 option A) |
| **`content`** | `ReactNode` | `string \| VNode \| () => VNode` | `string \| TemplateRef<void>` (+ `nzData`) | `string \| number \| Snippet` (P1) |
| **`duration`** | seconds, 3; 0 = never | seconds (docs: 1.5 and 3) | **milliseconds**, 3000; 0 = never | seconds, 3 (React) |
| **`key`** | string \| number; same key updates | the same | message id (generated) | same key updates in place (P8) |
| **`icon`** | `ReactNode` | `VNode \| () => VNode` | not available | `string \| Snippet \| false` (P2) |
| **`class`, `style`** | `className`, `style` (5.7.0) | `class`, `style` | `nzClass`, `nzStyle` (20.4.0) | `class`, `style` (P4) |
| **`classNames`, `styles`** | six parts, object or function (6.0.0; `wrapper`, `title`, `list`, `listContent` 6.4.0) | no | no | objects, six parts and `close` (P3) |
| **`onClick`, `onClose`** | yes | yes | `onClose` Subject; no click | `onclick`, `onclose` (P9) |
| **Hover pause** | `pauseOnHover`, true | no | `nzPauseOnHover`, true | `pauseOnHover`, true (P5) |
| **Animation toggle** | no (motion is the theme's) | no | `nzAnimate` | not taken: `prefers-reduced-motion` (P10) |
| **`top`** | 8, `string \| number` | `'8px'` | `nzTop` 24, `number \| string` | `number \| string`, 8 (P7) |
| **`maxCount`** | drops the oldest | the same | `nzMaxStack`, 7 | `maxCount`, no limit by default (P7) |
| **Container** | `getContainer` | `getContainer` | CDK overlay | `container` (P7) |
| **`rtl`, `prefixCls`** | yes | yes | `nzDirection` | not taken (P10) |
| **`stack`** | 6.4.0: collapse after a threshold | no | no | **taken in v1.0** (D4 option C; against the default of 5a) |
| **`closable`** (close button) | no | no | no | **taken in v1.0** (D4 option C; ours, additive) |
| **Context** | `useMessage` + `contextHolder`; static cannot see ConfigProvider | the same | injection | `MessageHost` placed in the tree (D1) |
| **a11y** | `role="alert"` for all, icon read as its file name | none | none | D3 |

## API (proposed)

Names follow React. The Svelte type is in the second column. Callbacks are lower case (the library rule).

### The `message` object

```ts
message.open(options: MessageOptions): MessageHandle
message.info | success | error | warning | loading(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle
message.info | success | error | warning | loading(options: MessageOptions): MessageHandle   // `type` is fixed by the method
message.destroy(key?: string | number): void          // one message, or all
message.config(options: MessageConfig): void           // global defaults
```

### `MessageOptions`

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `type` | `'info' \| 'success' \| 'error' \| 'warning' \| 'loading'` | `'info'` | Only for `message.open`. |
| `content` | `string \| number \| Snippet` | — | `0` is shown. P1. |
| `duration` | `number` (seconds) | `3`, or `config.duration` | `0` = until closed by code. A negative or non-finite value is treated as the default (a warning in development). |
| `icon` | `string \| Snippet \| false` | the type icon | Replaces the icon; `false` removes it. P2. |
| `key` | `string \| number` | generated | Same key as an open message updates it in place (P8). |
| `pauseOnHover` | `boolean` | `true` | P5. |
| `class`, `style` | `string`, `string \| style object` | — | On the box. P4. |
| `closable` | `boolean` | `false`, or `config.closable` | Shows a close button at the end of the box (D4). Ours: none of the three has it. |
| `classNames`, `styles` | `{ root?, wrapper?, icon?, title?, close? }` | — | P3. Objects only. |
| `onclick` | `(event: MouseEvent) => void` | — | P9. |
| `onclose` | `() => void` | — | Once per message, however it closed (below). |

### `MessageHandle` (D2, option A, chosen by the maintainer against the recommendation)

```ts
type MessageHandle = (() => void) & PromiseLike<void>;
```

A function that closes the message (`const hide = message.loading('...'); hide()`), which is also **thenable**:
`message.success('a').then(afterClose)`. The promise resolves when the message **starts to close** (the moment of
`onclose`), as React's does (measured: the next message of a sequence appears while the first leaves). The handle
carries nothing else; `update` is `message.open({ key, ... })`. **The trap, kept on purpose for parity:** `await
message.success('x')` and `return message.success('x')` from an `async` function wait for the message to close. The
page says so next to the first example, and `closed`, `update` and `key` stay possible later as additive properties.

### `MessageConfig` and the props of `MessageHost`

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `top` | `number \| string` | `8` | Distance from the top of the window; a number is pixels. P7. |
| `duration` | `number` (seconds) | `3` | Default of every message. |
| `maxCount` | `number` | none | When exceeded, the oldest message is closed (its `onclose` runs). |
| `container` | `HTMLElement \| (() => HTMLElement)` | `document.body` | React and Vue `getContainer`. **Only where the layer sits in the page:** it stays `position: fixed` and is drawn at the window. What it is for (the owner, 2026-11-19): a native modal `<dialog>` (`showModal()`) is in the top layer, so a layer in the `body` is covered and cannot be reached, while a layer in the dialog stands above it; also an iframe or a shadow root. The `Modal` of this library does not need it (`data-ads-overlay-keep`). |
| `closable` | `boolean` | `false` | Default of every message. |
| `labels` | `Partial<Record<MessageType \| 'close', string>>` | English (D3, D4) | The hidden type word read before the text (`Info`, `Success`, `Error`, `Warning`, `Loading`) and the name of the close button (`Close`); `''` removes a type word. |
| `classNames`, `styles` | `{ list?, listContent?, root?, wrapper?, icon?, title?, close? }` | — | Defaults for every message; a message's own value wins (P3). |
| `stack` | `boolean \| { threshold?: number }` | `false`; threshold `3` | React 6.4.0 (D4 option C: taken now). Only here, not per message. See Behavior. |

Resolution order: **the message's own option > `MessageHost` props > `message.config()` > defaults.**

### `MessageHost` (D1 option C)

A component with no visible markup of its own, placed once near the root of the app (`<MessageHost />`). It renders
the open messages into the layer. If no host is mounted when a message opens, one is created on `document.body`
(browser only) and removed when the last message has left. With a host mounted, `message.*` calls from anywhere in the
app, even from a plain `.ts` file, show up in it. One host is active at a time: the one mounted last; another host
mounted at the same time renders nothing and warns in development (P11).

## Behavior

- **Entry.** Every call adds a message to a global list and returns at once; it does not wait for the DOM. On the
  server (no `document`) every `message.*` call is a **no-op that returns an inert handle** and never throws: module
  state on a server is shared by all requests, so nothing may be stored there (P11).
- **Placement.** A fixed layer at the top of the window, the boxes centred, a 16 px gap between them, new ones **below**
  the older (the order of the three libraries, measured). The layer has `pointer-events: none`, only boxes take events,
  so a click next to a message reaches the page (React PR 59622).
- **Time.** The timer starts when the message opens. When it ends, the message starts to close: `onclose` is called and
  `closed` resolves **then**, at the start of the exit motion, not after it (measured on React: the next message of a
  sequence appears while the first is still leaving). The element is removed after the exit.
- **Pause.** While the pointer (a mouse or a pen, not a touch) is over the box, **or focus is inside the box**, **or the
  page is hidden**, the timer stands still and resumes with the remaining time (React measured; the other two are ours,
  P5). A message with `duration: 0` never expires. With `stack` the pause covers every message while the pile is
  hovered or has focus.
- **Update by key.** `open` with the key of an open message replaces its type, content, icon and options **in place**
  (no new box, the position is kept), restarts the timer with the new duration and is announced again (P8). The same
  key after the message has closed opens a new one.
- **Closing.** `handle()` closes one message; `message.destroy(key)` one by key; `message.destroy()` every message; the
  close button (below) closes its own. All of them run the normal exit and `onclose`. Closing a message that is already
  closing or closed does nothing, and `onclose` runs **once** per message in every case (timer, handle, destroy,
  `maxCount`, the button).
- **`closable`.** A button at the inline end of the box: a native `<button type="button">` with a decorative cross and
  the name `labels.close` (default "Close"). A click, Enter or Space closes the message. **Escape closes the message
  that has focus inside it** (a local key, not a global one: the Escape of a Select or a Modal is not touched). The
  button is the only focusable part of the component; `onclick` of the box is not called for a click on the button.
  Adding or removing the button by an update with the same key changes the width of the box (the button's own width) and
  never its height.
- **`stack`** (React 6.4.0, measured on the public demo, 2026-11-16; threshold 3 as in its demo):
  - **Off (default):** the newest message is **below** the older ones.
  - **On:** the newest message is **at the top**, in every state. With up to `threshold` messages the list is plain (the
    pitch of 56 px, each fully visible). With more, the pile is **collapsed**: only the newest is shown in full; the
    older ones sit behind it, shifted down by 8 to 10 px each, scaled to 0.94 and 0.88, and invisible but for a faint
    edge under the newest box. While the pointer is over the pile, **or focus is inside it** (ours), it **expands** to the
    plain list (the newest at 8 px, the oldest the lowest) and every timer is paused (measured: 6 messages stayed
    for 6 s under the pointer); leaving collapses it again.
  - Our additions: the older messages of a collapsed pile are `inert` (not focusable, not readable again), so a close
    button that cannot be seen cannot take focus; the expansion on focus lets a keyboard user reach the others.
  - Because the order differs, changing `stack` while messages are open reorders them without a new announcement.
  - Estimate: about two days (a second layout mode, the transitions, hover and focus, three engines), more than the
    "one day" of 5a: the maintainer took it knowing so (D4).
- **`maxCount`.** A new message above the limit closes the oldest one first.
- **Leaving.** When a message leaves, the ones below slide up (animated); the sizes of the others do not change.
- **A box does not change size when its type changes** (loading to success by key): the icon is 16 px in a 22 px line, so
  the box stays 40 px high; the width follows the text.
- **Long text** wraps within the window minus 24 px on each side; a word longer than that breaks. No line limit.
- **Motion.** 0.2 s (the library motion token): from 64 px above and transparent to place; the exit is the same
  backwards; the layout slide of the others the same. None under `prefers-reduced-motion`; the timer is the same.
- **Direction.** The layer inherits `direction` from its container, so the order of icon and text mirrors in a
  right-to-left page; there is no `rtl` option (P10).
- **No leftovers.** After the last message has left, no element of the component remains in the page (Angular 7965); a
  host that was created automatically is removed.
- **Content is a Snippet.** It renders in the host's tree. Context read inside the snippet (`getContext`) comes from the
  host's position, not from where the snippet was written; this is documented on the page.
- **Number of messages.** No limit by default (React, Vue). The layer does not scroll: with more messages than fit, the
  ones below the window edge are not visible. The page recommends `maxCount`.

## A11y (the contract is ours; none of the three pages describes it)

The pattern is a **status message** (WCAG 2.2 success criterion 4.1.3) with the `status` and `alert` roles of WAI-ARIA;
the timing rule is WCAG 2.2.1. There is no APG pattern for a toast, so the checks are the roles, a real screen reader
(Orca through Guidepup, which the repository has) and the matrix below.

- **Role (D3).** The box of `error` and `warning` has `role="alert"`; `info`, `success` and `loading` have
  `role="status"`. React gives `role="alert"` to all five, which interrupts the reader for "Saved"; Vue and Angular give
  nothing, so a screen-reader user never learns of the result. Whether a freshly inserted `role="status"` box is read
  reliably in Orca, NVDA and VoiceOver is **open**: it is measured in stage 4 with Orca, and if it is not read, the host
  gets a persistent polite live region that the boxes are inserted into (the container exists before the content, the
  condition for reliable announcements).
- **Icon.** Decorative, `aria-hidden`; no `role="img"` with an icon file name. The type is said by a **visually hidden
  word** before the text ("Error: Upload failed"), from `labels` (default English; localize by passing `labels`), so
  the type is not only a colour and a shape (WCAG 1.4.1). D3.
- **Never takes focus.** Opening a message never moves focus. Without `closable` the box is not in the Tab order and
  not focusable; with it, only the close button is.
- **The close button** is the answer of this component to WCAG 2.2.1 for a message that must stay (`duration: 0`) or that
  a person wants to dismiss at once. Its name is `labels.close`; it is a real `<button>`; Enter and Space close it;
  Escape inside the message closes it too. **Known limit, to be checked by hand in stage 4:** the layer is at the end of
  the container, so Tab reaches the button only after the rest of the page. There is no hotkey that moves focus to the
  messages in v1.0 (not in any of the three libraries); a screen-reader user reaches the button through the reader's own
  navigation.
- **`stack`.** The older messages of a collapsed pile were announced when they opened and are not announced again when
  the pile collapses or expands; while collapsed they are `inert`.
- **Time limit (WCAG 2.2.1).** A message that times out cannot be reached by keyboard. Mitigations: pause on hover, pause
  on focus inside (a link or a button in the content, or the close button, makes the message pause while it is
  focused), pause while the page is hidden, the `closable` button, and the default of 3 s is the reference's. Without
  `closable` a message with `duration: 0` can be closed by code only, as in the three libraries.
- **`onclick` is not keyboard-accessible.** It exists because React and Vue have it; the page says so and shows a
  button in the content for an action.
- **Contrast.** Text `rgba(0,0,0,0.88)` on white is about 15:1; the dark box is `#1f1f1f` with `rgba(255,255,255,0.85)`.
  The type icon colours of Ant Design are decorative here (the hidden word and the text carry the meaning), but they are
  checked: on `tokens-accessible.css` and in the dark theme the icon reaches 3:1 against the box (WCAG 1.4.11).
- **Forced colors.** The shadow disappears, so the box gets a border in `forced-colors: active`, and the icon uses a
  system colour.
- **Reduced motion:** see Behavior.

## Colors, tokens and sizes

Measured on React 6.7.1, 2026-11-16 (Chromium): box padding `9px 12px`, radius `8px` (our `--ads-radius-lg`), height 40 px,
font 14 px, line height 22 px, icon 16 px with an 8 px gap, shadow
`0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05)`, z-index 2010.
The Ant Design token page lists the same: `contentPadding` 9px 12px, `zIndexPopup` 2010, `contentBg` `#ffffff`.
Icon colours: success `#52c41a`, error `#ff4d4f`, warning `#faad14`, info and loading `#1677ff`.

New tokens in `tokens.css` (light, and dark where it differs): `--ads-message-bg`, `--ads-message-color`,
`--ads-message-padding`, `--ads-message-radius`, `--ads-message-shadow`, `--ads-message-gap`, `--ads-message-top`,
`--ads-message-z-index` (2010), `--ads-message-icon-size`, the four type colours `--ads-message-icon-success`, `-error`,
`-warning`, `-info`, the close button (`--ads-message-close-size`, `-color`, `-color-hover`, which reach 4.5:1 on the box
in both themes, and `-bg` and `-bg-hover`, the faint background that shows where the button is) and the stack (`--ads-message-stack-offset`, `--ads-message-stack-scale-step`). In the dark theme: box `#1f1f1f`, text `rgba(255,255,255,.85)`, the faint shadow.

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue, the same semantics):** `open`, `info`, `success`, `error`, `warning`, `loading`, `destroy`,
  `config`; `content`, `duration`, `key`, `icon`, `class`, `style`, `onclick`, `onclose`; `config` with `top`,
  `duration`, `maxCount`, `container`; the function-and-thenable return value (D2). Angular has no `config` on the
  service (it uses the global config), no `icon` and no click.
- **Дешёвые React-дополнения (≤ 1 день):**
  - `pauseOnHover` (React 6.x): a few lines; the focus and page-hidden pauses are ours and add about an hour (P5).
  - `classNames` and `styles` with six parts: about half a day; the shared helper exists (P3).
  - `icon: false`: one line (P2).
- **Expensive items taken now by the maintainer (D4 option C, 2026-11-16).** CLAUDE.md section 5a puts expensive
  React-only features in v1.1 and the "one day" line for the cheap ones; the maintainer chose to take both in v1.0:
  - `stack` (React 6.4.0, React only): about two days, see Behavior. Its contract is fixed above, so there is no
    reserved-name guard to write.
  - `closable` (a close button; in none of the three, so it is outside the core and not an addition from React): about
    one day (the button, the label, Escape, the pause rule, the tests, the page). Additive in the sense of 5a: a new
    prop with a default of `false`.
- **Зарезервировано на v1.1:** `ConfigProvider` settings for Message (`top`, `duration`, `maxCount`, `stack`,
  `classNames`, `styles`, `closable`): there is no ConfigProvider component yet; they arrive with it (the same
  reservation as Tooltip).
- **Не берём (Vue/Angular-only):** the `warn` alias of Vue (a deprecated alias of `warning`); `nzAnimate` (motion follows
  `prefers-reduced-motion`; a per-message switch would let a call override the user's setting); `nzData` (a Snippet sees
  its surrounding scope); Angular `nzMaxStack` default 7 (React and Vue have no default limit); the duration in
  milliseconds of Angular (React semantics: seconds); `message.remove(id)` of Angular (it is `destroy(key)`).
- **Не берём (React-only, не подходит для Svelte):** `message.useMessage()` with `contextHolder` and the `App`
  component (the way to give a static call access to a React context; `MessageHost` placed in the tree does that
  job, D1); the function form of `classNames` and `styles` (compute the object in `$derived`); `prefixCls` (the
  prefix `ads-` is fixed); `rtl` (the direction is inherited).

## Dependencies

Added on 2026-11-17: rule 6b and step 0 of the workflow (`ai/dependencies.md`) were written while this component was already
built, so the analysis is done after the fact, against `origin/main` at `1e1ee4f` (0.8.0).

- **Components: none.** The plan says Message takes no component, and none is needed. The close button is a native
  `<button>` with a cross and the name `labels.close`: it is not the `Button` that a user sees elsewhere (no type, size or
  shape), so it is not taken as a component.
- **Primitive `anim`** (`src/lib/internal/anim/motion.ts`). In `main` at the time of writing the animation existed only inside
  `Popup.svelte` (a CSS animation on the panel and a wait for `animationend`). A list of rows needs other things: a row that
  collapses to nothing while the others slide, a `finished` promise that removes the row, and FLIP for the pile. So Message had
  its own `motion.ts` (Web Animations API), **not a copy** of anything in `Popup`. Rule 6b says to stop and ask when a primitive is
  missing; this was not asked in time. **Moved on 2026-11-19** (branch `refactor/anim-motion`, `specs/overlay.md`, A2): the file is
  now `internal/anim/motion.ts`, behavior unchanged, and the distance of the slide is an argument (`offsetToken`) that Message
  fills with its own `--ads-message-motion-offset`.
- **Primitive `portal`** (`src/lib/internal/portal/portal.svelte.ts`). It was inside `Popup.svelte` too. `MessageLayer.svelte`
  moved its fixed layer to the container with one `appendChild` in an attachment; since 2026-11-19 it uses the shared attachment
  (`specs/overlay.md`, P1 to P5), with the same behavior. The layer also carries `data-ads-overlay-keep` (since 0.12.0,
  `specs/overlay.md`, O2): a Modal that is open puts the page out of reach, and a message must stay readable above it.
- **Primitive `timer`** (`src/lib/internal/timer/pausableTimer.ts`, since 2026-11-19, `specs/overlay.md`, T1 to T4). The timer that
  stands still for the reasons `hover`, `focus`, `pile` and `hidden` and resumes with the time left was in `store.ts`; it is now a
  shared part, and the store keeps one for each message. Behavior unchanged. What stays in the store: the page-hidden listener.
- **Primitive `layer`** (`src/lib/internal/layer/layer.ts`, since 2026-11-19, `specs/overlay.md`, L1 to L4). `Message/layer.ts` and
  `Modal/layer.ts` were line for line the same; now both are a few lines that say which component to mount and when, over the shared
  part. `ensureLayer` and `removeLayer` keep their names.
- **Primitive `list`** (`src/lib/internal/list/listStore.ts`, since 2026-11-19, `specs/overlay.md`, LS1 to LS9). The core of the global list that
  `store.ts` held (the records, the keys and the update by key, the close and its reason, the limit, the timers and the page-hidden pause, the
  hosts, the merge of the three layers of settings, the server no-op) is a shared part, one independent list per call of `createListStore`.
  What stays in `store.ts`: the fields of a message record, its settings and their defaults (`resolveSettings`), the validation warnings, and
  the thenable handle. The exported functions of `store.ts` keep their names and signatures; `onclose` of a message still takes no argument (the
  reason is in the core and can be passed on later, additively). Behavior unchanged: the tests of Message are not edited.
- **Primitive `pile`** (`src/lib/internal/pile/pile.svelte.ts`, since 2026-11-19, `specs/overlay.md`, PL1 to PL7). What `MessageLayer.svelte` did for a
  collapsed pile (the pointer or the focus opens it, the timers wait while it is open, the rows slide, the pointer and the focus are forgotten with the
  list) is `createPile`, one call for the list; `inertWhen` is the `inert` of a buried row. What stays in Message: the CSS of the pile (the offsets, the
  scale steps and `data-depth` of `MessageItem.svelte`), the threshold and `stack`. Behavior unchanged: the tests of Message are not edited.
- **Shared without copies:** `internal/semantic.ts` (`classList`, `styleText`), `internal/options.ts` (`resolveOption`),
  `internal/env.ts` (`isProduction`), and the tokens `--ads-motion-*`, `--ads-radius-*`, `--ads-font-*` and the focus ring.
- **Decision (motion): was A** (2026-11-17, `motion.ts` stays in `Message/` until the second consumer), **now B**: the maintainer
  chose, before Notification, to move it to `internal/` (2026-11-19, together with the timer and the layer). Notification and
  Drawer import it from there. A new consumer adds itself to its own `## Dependencies`. The core of the list (`store.ts`: records,
  keys, handles, hosts, settings) was moved the same day in the next branch (`refactor/list-core`), see the next item.
- **Primitive `icons`** (since 2026-11-18, `specs/icons.md`): `MessageIcon.svelte` is a thin adapter over the shared `internal/icons/Icon.svelte`, which draws the
  four status discs, the spinner and the cross exactly as this component drew them before; the class names (`ads-message-svg`) are unchanged.

## Decisions for the owner (D1 to D4 answered on 2026-11-16)

### D1. How a message is shown (the architecture): **C, both paths** (taken, the recommended option)

| Option | What | For | Against |
|---|---|---|---|
| A | Only `<MessageHost />`, mounted once by the app; `message.*` fills a global list | explicit, no hidden DOM, SSR-safe, the host sits in the tree (context, theme) | the first call with no host shows nothing (a warning in development) |
| B | Only the static call: the first `message.success()` creates the layer on `document.body` | nothing to set up (what Ant Design's static methods do) | a hidden mount; no place in the tree; React deprecated this form for exactly that reason |
| **C (taken)** | Both: `message.*` works with no setup (auto layer on `body`) and `<MessageHost />` takes over when the app mounts it | works at once like the static method of React and Vue, and the host gives the tree position of `useMessage` | two paths to test; the rule "one active host" |

### D2. What `message.success()` returns: **A, as React and Vue** (taken, against the recommendation C)

| Option | What | Notes |
|---|---|---|
| **A (taken)** | A function that closes, which is also **thenable** (React, Vue) | familiar and the same as two of the three libraries; the trap: `await message.success('x')` waits for the message to close, and returning it from an `async` function does too |
| B | An object `{ key, close(), update(), closed }` (Angular-like) | clear and typed; `close()` is not a call on the value |
| C (recommended) | A function with the properties of B, **not** thenable (`.closed.then(f)` instead of `.then(f)`) | would have been a narrowing of React and Vue; not taken |

The maintainer chose parity over the safer shape. What follows from it: the page warns about the `await` trap next to
the first example; `then` resolves at the start of the close (see the handle); nothing else hangs on the handle, and
`closed`, `update` and `key` can be added later without breaking anything (they are properties of a function).

### D3. What a screen reader hears: **B, a role by type and a hidden type word** (taken, the recommended option)

| Option | Role | Type |
|---|---|---|
| A | `alert` for all five types, the icon read as its file name (React as it is) | "check-circle Saved": noisy, the type is a file name |
| **B (taken)** | `alert` for `error` and `warning`, `status` for `info`, `success` and `loading`; the icon is decorative; a hidden type word from `labels` ("Error: Upload failed", localizable) | needs the Orca check of stage 4; the English default of `labels` needs the consumer to pass the translation (the library has no locale system yet) |
| C | As B, but no hidden type word (the text alone) | simplest; an "Error" notice whose text does not say "failed" tells nothing but its colour |

### D4. What is not in v1.0: **C, nothing; `stack` and `closable` are both in v1.0** (taken, against the recommendation A)

| Option | `stack` (React 6.4.0) | `closable` (a close button; in none of the three) |
|---|---|---|
| A (recommended) | v1.1, name and contract reserved now | v1.1, name and contract reserved now |
| B | v1.1 | now |
| **C (taken)** | **now** (about two days) | **now** (about one day) |

Both are outside what 5a calls the base: `stack` is expensive and React-only, `closable` is in none of the three. The
maintainer took them knowing the estimates; the contracts are in Behavior and A11y, so nothing is reserved for v1.1 but
the ConfigProvider settings.

## Proposals P1 to P12 (cheap or settled by the three libraries; **accepted as written on 2026-11-16**)

- **P1. `content`: `string | number | Snippet`.** The forms of React (`ReactNode`), Vue (`string | VNode | () => VNode`) and
  Angular (`string | TemplateRef`) are covered; no narrowing. `0` is a valid content (React fixed it, PR 59153).
- **P2. `icon`: `string | Snippet | false`.** React and Vue take a node; a string is a node in React (text or an emoji).
  `false` (no icon) is ours, one line; React's behaviour for `null` is not documented and was not measured.
- **P3. `classNames` and `styles` for the six parts of React 6.x plus our `close`**, objects only (the Switch and Tooltip
  precedent). `list` and `listContent` are meaningful on the host and config only; the per-message ones are `root`,
  `wrapper`, `icon`, `title`, `close`.
- **P4. `class` and `style` on the box** (the core, all three; React names them `className`). `style` takes a string or a
  style object.
- **P5. `pauseOnHover` (default `true`), plus pause on focus inside and while the page is hidden.** Hover counts only for
  a mouse or a pen; a touch does not pause (a tap leaves a sticky hover on a phone and the message would never leave).
  With `stack` the pile expands for a mouse, a pen or focus, not for a touch.
- **P6. `duration` in seconds** (React and Vue; Angular's milliseconds are not taken).
- **P7. `top`: `number | string`, default 8** (React: `string | number`); **`maxCount`** with no default limit;
  **`container`** takes an element or a function that returns it (the Tooltip precedent).
- **P8. Same `key` updates in place**, restarts the timer with the new `duration`, and is announced again. Whether a
  change of the content of a live region is read depends on the reader; the update re-inserts the text node (stage 4,
  Orca).
- **P9. `onclick`** (the core of React and Vue) with the keyboard note in A11y; `onclose` fires once per message at the
  start of the exit, for every way of closing, including `maxCount`, `destroy` and the close button.
- **P10. Not taken, with the reason:** `rtl`, `prefixCls`, `nzAnimate`, `nzDirection` (see the table of Scope).
- **P11. One active host; SSR no-op.** A second mounted host warns in development and renders nothing; on the server
  `message.*` returns an inert handle.
- **P12. The static API is `message`, a plain object (not a class), exported with `MessageHost` and the types**
  (`MessageType`, `MessageOptions`, `MessageConfig`, `MessageHandle`, `MessageContent`, `MessageStack`,
  `MessageLabels`, `MessageSemanticName`, `MessageClassNames`, `MessageStyles`).

## Implementation notes (2026-11-16)

Files: `src/lib/Message/` (`message.ts` the `message` object, `store.ts` the list, timers, keys, settings and hosts with no
Svelte in it, `layer.ts` the layer the library makes itself, `MessageHost.svelte`, `MessageLayer.svelte` the drawing
shared by the host and the library layer, `MessageItem.svelte`, `MessageIcon.svelte` (the Web Animations are `internal/anim/motion.ts`, the timer `internal/timer/`, the mounting of the layer `internal/layer/`, since 2026-11-19),
`types.ts`, `README.md`), 24 `--ads-message-*` tokens in `tokens.css` and two overrides in `tokens-accessible.css`.
Tests: `tests/Message.test.ts` (80 cases), `tests/MessageMotion.test.ts`, `tests/MessageStore.test.ts`,
`tests/MessageIcon.test.ts`, the Message cases of `tests/tokens.test.ts`, `tests/docs/message-page.test.ts`,
`e2e/message.spec.ts` (26 cases per engine) and `e2e/message-touch.chromium.spec.ts`, five checks in
`scripts/floor/smoke.cjs`, and `screen-reader/message.spec.ts`. The unit tests cover 100% of the lines and of the branches of
every file of `src/lib/Message/`.

What the implementation settled, and what it changed in this document:

- **Two bugs that only a real browser showed, fixed.** The box was 43 px high instead of 40 (the icon took its 16 px size
  as the `em` of its own height, so the line was taller than 22 px): the icon container is now as tall as the line token
  and only the svg has the icon size. And a leaving row stopped at 16 px instead of 0, so the messages below it jumped
  by the gap when it was removed: the row is `border-box` with the gap as bottom padding, so the shrink animates the
  padding as well as the height. The unit tests could not show either (jsdom has no layout).
- **Bugs found by the unit tests, fixed:** the hand-over from a host that unmounts to the library layer created a component
  inside an effect cleanup, which Svelte forbids (`effect_in_teardown`): the layer waits a microtask. An update by key
  that removes a focused control left the focus hold on for ever: it is released after the update.
- **`inert` as an attribute.** The property is ignored where the engine does not know it, so the item gets the attribute
  (`toggleAttribute`). Chromium 90 and Firefox 85 (the floor) do not know `inert`: there a closed pile only keeps its close
  buttons out of the Tab order (`tabindex="-1"`); links or buttons a snippet put in an older message stay tabbable. Said
  in the README.
- **The close button is 24 px** (WCAG 2.5.8; Ant Design has 22 px for the Notification) and takes `margin` of `-1px` above
  and below, so the box keeps its 40 px.
- **The cross of the close button is 16 px with a stroke of 1.8** (2026-11-17, a remark of the maintainer on the released
  0.9.0: "plain, unclear, not sharp"). It was 12 px with a stroke of 1.4, a cross 5 px across on a button with no background,
  and beside the disc of the `error` icon (which has a cross in it too) it did not read as a button. Now the button has a faint
  background at rest (`--ads-message-close-bg`), which grows on hover (`--ads-message-close-bg-hover`); the box is still 40 px.
- **The container example on the site (the owner, 2026-11-19; changed after the `Notification` page, where the same question came up).** It was a region
  of the page with a `transform` and a mounted `MessageHost`: the setting is global, so the messages of the other examples ended up in the region, and
  none of the three libraries has such a demo (a transformed element makes the layer fixed to it, but that is CSS, not a feature). Now it is a native
  modal `<dialog>`, the case that `container` is for: with the container not set the layer is in the `body` and the dialog covers it (at the centre of the
  message the pointer meets the dialog); with `container` set to the dialog the layer is in it and the message can be reached and closed. When the dialog
  closes (the button or Escape) its message is closed and the setting is given back (the next message of another example puts its layer in the `body`).
  Site tests: `the container example: ...` (two, in `docs/e2e/site.spec.ts`).
- **The page of the library has no `MessageHost` in the demos by default.** Settings that a demo changes with
  `message.config()` are taken back when the demo goes (a site test checks it), and `stack` is off in the demo until its
  switch is turned on, so no demo changes the messages of another.
- **Orca.** This setup (Firefox under Xvfb, no window manager) does not speak even a plain `role="alert"` inserted with the
  DOM, and the notification list of Orca stays empty, so whether a screen reader announces a message **when it opens** is
  not shown by any test here. The Orca test reads the messages with the caret and with Tab: "alert. Error:. Upload failed",
  "status bar. Success:. Saved" (Orca names `role="status"` "status bar"), "status bar. Success:. Done" after an update by
  key, "alert. Warning:. Careful. Close. button" and, on Tab, "alert. Close. button". The icon is silent. The open item of
  A11y about a persistent polite live region stays open for that reason: there is no evidence either way, and the
  dynamically inserted `role="status"` is the form the three libraries and the WAI-ARIA specification describe.
- **Mutation testing (2026-11-17):** `npm run test:mutation -- --target=Message --file=<file>` for `MessageItem` (48 mutants),
  `MessageLayer` (35), `MessageHost` (8) and `MessageIcon` (10): 101 mutants, 101 killed (100%). The tool mutates comments as
  well: a doc comment with the word `true` showed up as a surviving mutant and was reworded. It handles only `.svelte`
  files; `store.ts`, `layer.ts` and `message.ts` (and the shared `internal/anim/motion.ts`, `internal/timer/`, `internal/layer/`) are covered by 100% of lines and branches and by the tests
  that call them, but are not mutated.
- **Floor (2026-11-16):** Chromium 90.0.4392.0, Firefox 85.0b5 and WebKit 15.4 pass the five Message checks (30, 30 and 30
  of 30 checks in all). No new entry in `ENHANCEMENTS`: the Message adds one forced-colors rule and logical properties
  that the floor understands.
- **Not handled / open:** a screen reader announcing a message when it opens (above); NVDA, JAWS, VoiceOver and a phone
  screen reader; a real touch device (emulated touch in Chromium only); a real Safari; keyboard use of `closable` with a
  real keyboard on a real page (the layer is the last element of the container, so Tab reaches the button last; e2e
  tests the Tab order and the focus ring, and a person has not tried it); IME is not relevant.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Message.test.ts` and `e2e/message.spec.ts`: the `alert` and `status` roles of WAI-ARIA 1.2 per type, the hidden type word, no focus move, the name of the close button, the inert older rows of a pile; compared with the status message of WCAG 4.1.3, the time limit of 2.2.1 and the target size of 2.5.8 (there is no pattern for a toast in the WAI-ARIA Authoring Practices, so there is nothing to copy it against) |
| Forced colors | test | `e2e/message.spec.ts` (the forced-colors case, three engines): the box has a border, because the shadow is gone |
| IME | n/a | a message has no text input |
| Touch | test | `e2e/message-touch.chromium.spec.ts` (emulated touch, Chromium): a tap on the box calls `onclick` and does not hold the timer, a tap on the close button closes it, a tap does not open a pile, and the button is at least 24px. A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit) |
| Browser floor | test | `npm run test:floor`: five Message checks in `scripts/floor/smoke.cjs` (placement and click-through, the timer, an update by key, the close button and its focus ring, a pile with its `inert` rows) in Chromium 90, Firefox 85 and WebKit 15.4 |
| Screen reader | test | `screen-reader/message.spec.ts`: Orca with Firefox through Guidepup reads the role, the type word and the text of an error, a success and an update by key, the close button after the text, and the name of the close button on Tab (run in Docker on 2026-11-16). Whether a message is **announced when it opens** is not shown (this setup does not speak even a plain `role="alert"`); NVDA, JAWS, VoiceOver and a phone are **not checked**; the page and the README say so |

## Список тестов

Each item is at least one test; the name is the item. Unit in jsdom, geometry and events in `e2e/message.spec.ts`
(three engines).

- Methods: `open` with each `type`; `info`, `success`, `error`, `warning`, `loading` with `(content)`, `(content,
  duration)`, `(content, duration, onclose)` and `(options)`; `destroy(key)` and `destroy()`; `config`.
- `content`: string, number (`0` shown), Snippet; a Snippet that reads context from the host's position.
- `duration`: default 3 s, a number, `0` never closes, a negative or non-finite value falls back to the default.
- `key`: same key updates in place (position kept, timer restarted, type switched, box height constant); a closed key
  opens a new one; a number and a string key.
- `icon`: default per type, a string, a Snippet, `false`; the type icon is `aria-hidden` and has no `role="img"`.
- `class`, `style`, `classNames`, `styles`: each of the seven parts, precedence message > host > config.
- `pauseOnHover`: hover pauses and resumes with the remaining time; `false` does not pause; **touch does not pause**;
  focus inside pauses; a hidden page pauses.
- The handle: calling it closes the message; it is thenable and `then` resolves at the start of the close (the moment
  of `onclose`), so `await` on it waits; calling it twice is harmless; an inert handle on the server is thenable too.
- `onclose`: once per message for timer, handle, `destroy(key)`, `destroy()`, `maxCount`, the close button; at the
  start of the exit.
- `closable`: the button exists only with it; name from `labels.close` and a translation; click, Enter and Space close;
  Escape inside the message closes it and does not close a Select or a Modal opened elsewhere; the pause while the
  button has focus; adding the button by a key update changes the width and not the height; `onclick` of the box is
  not called by the button; `config.closable` and the message's own value.
- `stack`: off, the newest below; on, the newest on top, even for two messages; up to the threshold a plain list; above
  it a collapsed pile (positions, scales and the hidden ones as measured, 8 to 10 px steps); hover and focus expand it
  and pause every timer; leaving collapses it; the hidden ones are `inert`; a custom `threshold`; `maxCount` with
  `stack`; no layout jump of the newest box when the pile expands; touch does not expand it.
- `onclick`: called with the event; a click does not close the message.
- `maxCount`: the oldest closes first; `onclose` of the oldest runs.
- `top`: number and string; `container`: element and function; the page is not touched (Vue 6880).
- `MessageHost`: renders the open messages; auto layer with no host; the auto layer is removed when empty; a second
  host warns and renders nothing; unmounting the host and calling `message.*` again works.
- SSR: `message.*` on the server is a no-op with an inert handle, no throw, no shared state between two renders.
- Placement: fixed, centred, `top` 8, gap 16, new below old; the layer passes pointer events (a click next to a box
  reaches the page; React PR 59622); a long text wraps within the window on a phone.
- Layout: type switch by key does not change the height; a leaving box lets the others slide, frame by frame; no
  shift of a message that stays.
- A11y: roles per type; hidden type word and `labels` (a translation, `''` removes it); focus never moves; axe in light,
  dark and `tokens-accessible.css`; contrast of text and icon.
- Forced colors: the box has a border.
- Motion: none under `prefers-reduced-motion`, the timer unchanged.
- Direction: the order of icon and text mirrors in `dir="rtl"`.
- Reactivity: `message.config()` changes apply to the next message and to a changed `top` of an open one.
- Docs page and the three languages (stage 6).
- Mutation testing: `npm run test:mutation` for the Message files once they exist.

## Страница на сайте (plan, stage 6)

Demos in the two-column order (rule 6a), each with its own state: **Basic** (one button); **Types** (info, success, error,
warning, loading); **Duration** (a short and a long one, and `0` with a close button); **Loading, then success by key**
(update in place); **Sequence** (`closed.then`); **Content** (a string, a number, a Snippet with a link and a button);
**Icon** (custom, none); **Styling** (`class`, `style`, `classNames`, `styles`); **Pause on hover and focus**;
**maxCount**; **Top and container**; **MessageHost** (placed in the tree; the auto layer); **Update** (`onclick`);
**Closable** (a persistent message with a close button, and a short one); **Stack** (with a switch and a threshold, as in
the React demo, each with its own state). A warning about `await message.x()` next to the first example. The API table
has rows for `stack` and `closable`. Methods (the handle, `destroy`) are rows of the API table; no example is made only
to call them (CLAUDE.md section 4, item 6). The text says which parts are not
checked: a real screen reader other than Orca, a real touch device, a real Safari.

## Решения и обоснование

- **Why `role="status"` and `role="alert"` by type:** React makes everything an alert, so a plain "Saved" interrupts a
  reader; Vue and Angular make nothing, so a blind user never learns of a result. The project's rule makes accessibility
  mandatory and the public record shows nobody has solved it, so the contract is ours and is measured with a real
  reader (D3).
- **Why the handle is a thenable function (D2):** the maintainer chose parity with React and Vue over the safer shape.
  The trap is real and known (`await message.x()` waits for the close), so it is documented where people look first;
  properties can be added later without a break.
- **Why `closable` and `stack` are in v1.0 (D4):** the maintainer's choice. `closable` answers the one gap all three
  libraries share (a message that stays cannot be dismissed by the user, WCAG 2.2.1); `stack` is React 6.4.0 and was
  measured on its public demo.
- **Why the timer pauses on focus and when the page is hidden:** a message that expires cannot be reached by keyboard
  (WCAG 2.2.1), and a message that expires in a background tab is never seen; neither costs more than an hour (P5).
- **Why the host in the tree and the auto layer:** both are real needs; React's own history (static methods deprecated
  for lack of context, a hook added) shows that the call-from-anywhere form and the tree form must both exist (D1).
- API inspired by Ant Design (MIT); the implementation is original for Svelte. The text above is paraphrased from the
  public documentation and changelogs and from measurements of the public demos; no code and no documentation text is
  copied.
