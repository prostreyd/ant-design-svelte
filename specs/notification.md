# Notification

> **Status: stage 2 answered 2026-11-19 («да, как рекомендуешь»): D1 to D7 as recommended (A each, D3 option B); the proposals
> P1 to P14 go with them as written (the owner can still change any of them).** Written: differences of the three libraries, the
> API, behavior, scope, dependencies, the measurements of the public demo (2026-11-19), the quality matrix, the list of tests and the
> plan of the site page. **The extractions are done** (`refactor/anim-motion`, `refactor/list-core`, `refactor/pile`, merged into this branch,
> local commits). **The owner decided (2026-11-19) that the primitive branches are not pushed on their own: they become part of this branch
> and ship with it in one release.** The consultation of the source of the three libraries (rule 3a) is at the end of the file.
>
> Sources of the public API (docs only, fetched 2026-11-19): React `antd` 6.7.1 (`index.en-US.md` of the component), Vue
> `ant-design-vue` 4.x (the same file on GitHub), Angular `ng-zorro-antd` master (`doc/index.en-US.md`), and the rendered React
> page (Design Token table, class names of the demo).

## What it is

A box with a **title**, a **description** and optional **actions**, shown at one of six places of the window (four corners,
the top edge, the bottom edge). It closes itself after a time, or by its close button, or by code. It is heavier than
`Message`: it has a title, a longer text and buttons, and it stays at the window edge, not above the page content.
Like `Message`, it is opened from anywhere (`notification.success({ title, description })`, even from a `.ts` file) and
drawn by a host.

## Differences React / Vue / Angular (CLAUDE.md section 5)

| Level | React 6.7.1 | Vue 4.x | Angular (master) | Our decision |
|---|---|---|---|---|
| **Presence** | `notification` static, `useNotification()` hook, `App` | the same | `NzNotificationService` | `notification` object and `NotificationHost` (P1) |
| **Methods** | `open`, `info`, `success`, `warning`, `error`, `destroy(key?)`, `config` | the same + `warn` alias, `close(key)`, `destroy()` | `blank`, `success`, `error`, `info`, `warning`, `remove(id)` | `open`, `info`, `success`, `warning`, `error`, `destroy(key?)`, `config` |
| **Call shape** | `(config)` | `(config)` | `(title, content, [options])` | `(options)` |
| **Return** | nothing (close by key) | nothing | `NzNotificationRef { messageId, onClose: Subject<boolean>, onClick }` | a close function (D3) |
| **Title** | `title` (6.0.0); `message` deprecated | `message` (required) | `title` argument | `title` (P2: the current React name) |
| **Text** | `description` | `description` | `content` argument | `description` |
| **Forms of title, description** | `ReactNode` | `string \| VNode \| () => VNode` | `string \| TemplateRef` | `string \| number \| Snippet` (P3) |
| **Actions** | `actions` (5.24.0); `btn` deprecated | `btn` | `nzButton` | `actions` (P3) |
| **`icon`** | `ReactNode`, by type when absent | `VNode \| () => VNode` | by method; `blank` has none | `string \| Snippet \| false` (P3) |
| **Close** | `closable` (bool or `{ closeIcon, onClose }`), `closeIcon` (`null` or `false` hides it) | `closeIcon` | `nzCloseIcon` | `closable` (true) and `closeIcon: string \| Snippet \| false` (P14) |
| **`duration`** | seconds, 4.5; `0` or `false` = never | seconds, 4.5; `0` or `null` = never | **milliseconds**, 4500; `0` = never | seconds, 4.5; `0` or `false` (P4) |
| **`key`** | `string` | `string` | `nzKey` | `string \| number`, update in place (P6) |
| **`placement`** | six names, `topRight` | six names (`top`, `bottom` since 3.3.0), `topRight` | six names, `topRight` | six names, `topRight` (P5) |
| **`top`, `bottom`** | 24 px, `number` | `'24px'`, `string` | `'24px'`, `string` | `number \| string`, 24 (P5) |
| **`maxCount`** | **total** over all places, drops the oldest | **per place** (static); total (hook) | `nzMaxStack` 8, total | `maxCount` (D2) |
| **`stack`** | 5.10.0, **on by default**, threshold 3 | none | none (`nzMaxStack` is only a cap) | **D1** |
| **Pause on hover** | `pauseOnHover` (5.18.0), true; keeps the time left (2.1.1) | none; full time again on leave | `nzPauseOnHover`, keeps the time left | `pauseOnHover`, plus focus, page hidden, pile (P8) |
| **Progress bar** | `showProgress` (5.18.0) | none | none | taken (P7) |
| **`role`** | `role`: `alert` or `status`, default `alert` | none | none | role by type, `role` overrides (P9) |
| **`class`, `style`** | `className`, `style` | `class`, `style` | `nzClass`, `nzStyle` | `class`, `style` (P10) |
| **`classNames`, `styles`** | object or function (6.0.0) | none | none | objects (P10) |
| **`props`** | `data-*`, `aria-*`, `role` on the root | none | none | `data-*` and `aria-*` (P10) |
| **Click, close events** | `onClick`, `onClose` | `onClick`, `onClose` | `onClick` and `onClose` as Subjects; `onClose` says **if the user closed it** | `onclick`, `onclose(reason)` (D4) |
| **Container** | `getContainer` | `getContainer` | CDK overlay | `container` (P5) |
| **Direction** | `rtl` | `rtl` | `nzDirection` | inherited from the page, no option (P12) |
| **Animation switch** | none | none | `nzAnimate` | not taken (P12) |
| **Long list** | **scrolls** when taller than the window | not measured | not measured | **D5** |
| **Context** | `contextHolder`; static calls do not see `ConfigProvider` | the same | injection | `NotificationHost` in the tree (P1) |

## API (proposed)

Names follow React. Callbacks are lower case (the library rule). `NotificationContent = string | number | Snippet`.

### The `notification` object

```ts
notification.open(options: NotificationOptions): NotificationHandle          // no type icon (React `open`, Angular `blank`)
notification.info | success | error | warning(options: NotificationOptions): NotificationHandle
notification.destroy(key?: string | number): void                            // one by key, or all
notification.config(options: NotificationConfig): void                       // global defaults
```

`NotificationHandle = () => void` (D3, recommended option B): calling it closes that notification. Nothing else on it; `update` is
`notification.open({ key, ... })`.

### `NotificationOptions`

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `title` | `NotificationContent` | — | Required (React 6.0.0 `title`; the old name `message` is not taken). |
| `description` | `NotificationContent` | — | The text under the title. Optional here (a title alone is a valid box). |
| `actions` | `NotificationContent` | — | Under the text, at the inline end: usually buttons. The consumer's own focusable elements. |
| `icon` | `string \| Snippet \| false` | by method | Replaces the type icon; `false` removes it. |
| `duration` | `number \| false` (seconds) | `4.5`, or `config.duration` | `0` or `false` = until closed by code or by the user. A negative or non-finite value is the default (a warning in development). |
| `key` | `string \| number` | generated | The same key as an open notification updates it in place (P6). |
| `placement` | `'top' \| 'topLeft' \| 'topRight' \| 'bottom' \| 'bottomLeft' \| 'bottomRight'` | `'topRight'` | Per notification, as in React. |
| `closable` | `boolean` | `true` | The close button. |
| `closeIcon` | `string \| Snippet \| false` | the cross | `false` hides the button (React: `null` or `false`). |
| `showProgress` | `boolean` | `false` | A strip that runs down with the time left (P7). |
| `pauseOnHover` | `boolean` | `true` | P8. |
| `role` | `'alert' \| 'status'` | by type (P9) | Overrides the role. |
| `class`, `style` | `string`, `string \| style object` | — | On the box. |
| `classNames`, `styles` | `{ root?, icon?, section?, title?, description?, actions?, close?, progress? }` | — | P10. Objects only. |
| `props` | `Record<` `` `data-${string}` `` ` \| ` `` `aria-${string}` ``, `string>` | — | Put on the box (React `props`). |
| `onclick` | `(event: MouseEvent) => void` | — | |
| `onclose` | `(reason: NotificationCloseReason) => void` | — | Once per notification, however it closed. D4. |

### `NotificationConfig` and the props of `NotificationHost`

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `top`, `bottom` | `number \| string` | `24` | Distance from the edge for the top and for the bottom places; a number is pixels. |
| `placement` | as above | `'topRight'` | Default place of every notification. |
| `duration` | `number \| false` | `4.5` | Default of every notification. |
| `maxCount` | `number` | none | D2. |
| `stack` | `boolean \| { threshold?: number }` | D1 | See Behavior. |
| `container` | `HTMLElement \| (() => HTMLElement)` | `document.body` | React and Vue `getContainer`. **Only where the layer sits in the page:** it stays `position: fixed` and is drawn at the window (React: «the mount node, but still display at fullScreen»). None of the three libraries has a demo of a region of the page with notifications of its own (public documentation and the list of demo files read on 2026-11-19, no code); a transformed element does make the layer fixed to it, but that is CSS, and we do not present it as a feature. **What it is for (the owner, 2026-11-19, «what is this block for»):** a native modal `<dialog>` (`showModal()`) is in the top layer, over everything outside of it, so a layer in the `body` is covered and cannot be reached, while a layer in the dialog stands above it; also an iframe or a shadow root. The `Modal` of this library does not need it (`data-ads-overlay-keep`). |
| `closable`, `closeIcon`, `showProgress`, `pauseOnHover` | as above | as above | Defaults of every notification. |
| `labels` | `Partial<Record<NotificationType \| 'close', string>>` | English | The hidden type word and the name of the close button, as `MessageHost` (Message D3). |
| `classNames`, `styles` | the parts above plus `list`, `listContent` | — | Defaults; a notification's own value wins. |

Resolution order: **the notification's own option > `NotificationHost` props > `notification.config()` > defaults.**

### `NotificationHost`

A component with no markup of its own, placed once near the root of the app. It draws the open notifications into the
layer. With no host mounted, a layer is created on `document.body` (browser only) and removed after the last notification has
left. One host is active at a time, the one mounted last; another one warns in development and draws nothing. The same rules
as `MessageHost` (P1).

## Behavior

Shared with `Message` and **not repeated here** (they come from the same core, see Dependencies): the entry (a call adds to a global
list and returns at once), the server no-op, the update by key (in place, the timer restarts, announced again), closing once with
`onclose` at the start of the exit, no leftovers in the page, the pause that keeps the time left, Escape closes the focused
notification, the click on the box is not called for a click on the close button. **What is different or new:**

- **Places.** Six, each its own list, drawn in one fixed layer (D6) with `pointer-events: none`; only boxes take events. Every place is a
  column stuck to its edge: the top ones at `top`, the bottom ones at `bottom` (24 px by default); the left and right ones 24 px from
  the window edge; `top` and `bottom` are centred. **The newest notification stands nearest the window edge and the older ones are
  pushed away from it** (measured on the public React demo, the next section): at a top place the newest is the first row and the
  older ones are below it, at a bottom place the newest is the last row and the older ones are above it. This is the opposite of
  `Message` (where the newest is below). The reading order and the Tab order follow the rows as drawn, from top to bottom. The gap
  between boxes is 16 px.
- **Motion.** A notification comes from the side of its place: the right places from the right, the left places from the left, the
  top edge from above, the bottom edge from below; the exit is the same backwards (React, Vue and Angular all do this). The
  distance is a token. Under `prefers-reduced-motion` there is none. This needs a direction option in `internal/anim/motion.ts`
  (additive, the present behavior is the default).
- **Time.** 4.5 s by default. The pauses are those of `Message` (the pointer for a mouse or a pen, focus inside, the page hidden,
  an open pile).
- **Progress bar.** With `showProgress` a strip at the bottom edge of the box runs from full to empty over the duration. It is drawn
  from the time **left** of the shared timer, not from a CSS animation that would drift on a pause: it stands still while the
  timer is paused and resumes with it. With `duration: 0` there is no strip. It is not announced.
- **`maxCount`.** D2. A new one above the limit closes the oldest first, with `onclose('replaced')` (D4).
- **`stack`.** D1. Past the threshold the notifications of a place lie behind the newest; hover or focus opens the pile and holds
  every timer; the geometry is mirrored for the bottom places and the left and right ones (the offsets point the same way as the
  list grows). The buried ones are `inert`. The pile is a part shared with `Message` (D7).
- **A long list.** D5.
- **Size.** The box is 384 px wide (the public token `width`) and never wider than the window minus its margins; a long word
  breaks. The height follows the content.
- **Layout rules (CLAUDE.md section 7).** The box does not change size when its type changes by key (the icon is the same size);
  adding or removing the close button, the actions or the progress strip by an update changes the **height only**, never the width.
  An update that changes the height moves the ones behind it; this is tested in the browser with contents of different heights.
- **Content is a Snippet.** It renders in the host's tree; context read inside the snippet comes from the host's position (the
  page says so, as for `Message`).

## A11y (the contract is ours; none of the three pages describes it)

- **Role.** By type, as `Message` (D3 there): `alert` for `error` and `warning`, `status` for `info`, `success` and `open`.
  React's default is `alert` for everything, which interrupts a reader for a plain "saved"; `role` overrides it (P9).
- **Name and reading.** The icon is decorative; a hidden type word from `labels` is read before the title ("Error: Upload failed"),
  localizable. Title and description are plain text, in this order, in one live region.
- **Focus.** A notification **never takes focus**. It is reachable by Tab in the order of the page where the layer is mounted
  (the end of `body` by default); the close button and the consumer's `actions` are the focusable parts. Escape closes the
  notification that has focus inside. Focus inside holds the timer (Message P5).
- **A pile.** The buried notifications are `inert` and `aria-hidden`; the pile opens on focus so that a keyboard user reaches them.
- **Touch.** A touch does not pause or open the pile (a tap leaves a sticky hover on a phone).
- **Forced colors.** The box gets a border, the strip and the icons use system colors (the Message precedent).

## Colors, tokens and sizes

**From the public Design Token table of React 6.7.1** (2026-11-19): `width` 384, `zIndexPopup` 2050, `progressBg`
`linear-gradient(90deg, #69b1ff, #1677ff)`, and a container background per type (`colorInfoBg`, `colorSuccessBg`, `colorWarningBg`,
`colorErrorBg`: the class names of the demo carry the type on the box). The colors of the global tokens are the same as in
`Message` (success `#52c41a`, error `#ff4d4f`, warning `#faad14`, info `#1677ff`).

**Measured on the public React 6.7.1 demo** (Chromium, light theme, window 1280 x 800, black box: DOM geometry and computed styles,
2026-11-19; no source read). Values our tokens take:

| What | Measured |
|---|---|
| Stack by default | **On, threshold 3, with no setting** (the list has the class `stack` from the first notification; 3 notifications stand as a plain list, the 4th collapses them). D1 confirmed. |
| Order | The newest at the window edge, the older ones away from it, in every place (top: y 24, 134, 244; bottom: bottoms at 776, 666, 556 of 800). The DOM lists the newest first. |
| Layer of a place | `position: fixed`, full height, 432 px wide (box 384 + 24 each side), `overflow: auto`, `pointer-events: none`, `z-index: 2050`; boxes take events. `top` and `bottom` are centred. |
| Box | 384 px wide, padding `20px 24px`, radius 8 px, white, text `rgba(0,0,0,0.88)` 14 px / 22 px, shadow `0 6px 16px 0 rgba(0,0,0,.08), 0 3px 6px -4px rgba(0,0,0,.12), 0 9px 28px 8px rgba(0,0,0,.05)` (the same as `Message`). **The type does not tint the box**, only the icon is colored. |
| Gap | 16 px between boxes (spacing 94 + 16 = 110 for a three-line box). |
| Icon | 24 px, the type color, at the top of the content, 12 px before the text. |
| Title | 16 px / 24 px, weight 400, text color, 24 px free at the inline end for the close button. |
| Description | 14 px / 22 px, text color, 8 px under the title. |
| Actions | 12 px under the text, at the inline end (the demo puts small buttons there). |
| Close button | absolute, 20 px from the top and 24 px from the inline end, 22 x 22 (**ours is 24 x 24**, the smallest target of WCAG 2.5.8, centred on the first line of the title), radius 4, icon 14 px, color `rgba(0,0,0,.45)` (**ours is `0.65` in `tokens-accessible.css`**, 4.5:1); hover: color `rgba(0,0,0,.88)` on `rgba(0,0,0,.06)`; focus: outline 3 px solid `#91caff` with offset 1 px (**ours is the focus ring of the library**). **Ours grows with its content:** a `closeIcon` that is wider than the cross (a word) makes the button as wide as it needs (`min-width` 24 px, 4 px of air at both ends, token `--ads-notification-close-padding`), so that the hover background and the focus ring cover all of it; the title keeps out from under it by the same width. |
| Progress strip | absolute at the bottom, 8 px in from both sides, 2 px high, radius 8 px, track `rgba(0,0,0,.04)`, fill `linear-gradient(90deg, #69b1ff, #1677ff)` (the public token). |
| Pile | past the threshold the newest is at scale 1; the one behind it is lowered 8 px and scaled 0.94; the next 16 px and 0.88; the ones behind that keep the 0.88 and go on 8 px lower each, **with no opacity** (so they cannot be seen). The first three rows can be seen. At the bottom places the same mirrored (raised 8 px each; origin at the top edge of the row; at the top places the origin is the bottom edge). The same numbers as `Message`. Hover on the list opens it (a plain list, gap 16); nothing is said for the focus (ours is added). |
| Motion | 0.2 s, opacity 0 to 1 with a slide of **64 px**: from the right at the right places, from the left at the left places, from above at `top`, from below at `bottom`; the exit is the same backwards. |
| Tall list | the layer of a place scrolls (`overflow: auto`). **Ours** scrolls the same, but the motion and the hidden rows of a pile never make it scroll: the content of the place clips what hangs out of it. |

The class names of the demo give the parts `root`, `icon`, `section`, `title`, `description`, `actions`, `close`, `progress` and, for the
host, `list`, `listContent` (P10 confirmed). The dark theme is not measured: it takes the dark values of `Message` (box `#1f1f1f`,
text `rgba(255,255,255,0.85)`).

New tokens in `tokens.css` (light, and dark where it differs): `--ads-notification-*` (width, z-index, padding, radius, shadow, gap,
margin, top, bottom, the type colors, the progress color, the close button, the motion distance, the pile offset and scale step), with
the measured values above.
Light-theme colors that fail WCAG AA are checked on `tokens-accessible.css` (CLAUDE.md section 7).

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue, the same semantics):** `open`, `info`, `success`, `warning`, `error`, `destroy`, `config`; `title`,
  `description`, `icon`, `actions` (Vue `btn`), `closeIcon`, `duration`, `key`, `placement`, `class`, `style`, `onclick`, `onclose`;
  `config` with `top`, `bottom`, `placement`, `duration`, `container`, `maxCount` (the meaning of `maxCount` differs: D2).
- **Дешёвые React-дополнения (≤ 1 день):** `pauseOnHover` (a few lines, shared with `Message`); `showProgress` (about half a day on the
  shared timer, P7); `role` (a line); `classNames` and `styles` (the shared helper exists, about half a day); `props` (an hour);
  `closable` as a boolean (an hour).
- **На грани, решает владелец:** `stack` on by default (D1), scrolling of a tall list (D5), the reason of `onclose` (D4, Angular's
  idea), the form of the return value (D3).
- **Зарезервировано на v1.1 (the owner, 2026-11-19): an instance bound to a host.** React and Vue give `useNotification(config)` →
  `[api, contextHolder]`: the settings (`getContainer`, `placement`, `stack`...) belong to that instance and the static calls stay
  independent; their docs call the hook «recommended» (React lists the static method demo as deprecated). Ours is one active host
  whose props are the settings of every `notification.*` call on the page (P1), so a region of a page with notifications of its own
  cannot exist today. Reserved, additive: a host hands out its own `open`, `info`, `success`, `warning`, `error`, `destroy`, and the
  global `notification` ignores it. It needs a store made by a factory (the list core already is one) and the same for `Message`;
  not started, and the position «не берём `useNotification`» above stands until the owner decides.
- **Зарезервировано на v1.1:** `ConfigProvider` settings for Notification (`top`, `bottom`, `placement`, `duration`, `maxCount`,
  `stack`, `closeIcon`, `showProgress`, `pauseOnHover`, `classNames`, `styles`): there is no `ConfigProvider` yet.
- **Не берём (Vue/Angular-only):** the `warn` alias (deprecated alias of `warning`) and `close(key)` of Vue (`destroy(key)` does it);
  the positional call `(title, content, options)` of Angular (one options object, as React and Vue); `nzAnimate` (motion follows
  `prefers-reduced-motion`); `nzData` (a Snippet sees its surrounding scope); the duration in milliseconds; `nzMaxStack` with its
  default of 8 (React and Vue have no default limit); `remove(id)` (it is `destroy(key)`); `nzDirection`.
- **Не берём (React-only, не подходит для Svelte):** `useNotification()` with `contextHolder` and `App` (`NotificationHost` placed in the
  tree does that job); the function form of `classNames` and `styles` (compute the object in `$derived`); `prefixCls`; `rtl`;
  the deprecated `btn` and `message` (replaced by `actions` and `title`, P2); the object form of `closable`
  (`{ closeIcon, onClose }`: it is `closeIcon` and `onclose` with the reason `'user'`, a narrowing of the form that the owner can
  reverse, P14).

## Dependencies

Step 0 of the workflow, final form (2026-11-19). Checked against `origin/main` at `296b452` (0.12.1) and the three extraction branches that this branch
stands on (`refactor/anim-motion`, `refactor/list-core`, `refactor/pile`; the owner decided on 2026-11-19 that they are not pushed on their own but
become part of this branch and ship with it in one release). Nothing is missing: the parts were extracted first (rule 6b) and nothing is copied.

- **Components: none.** The plan lists none. The close button is a native `<button>` (not the `Button` of the library: no type, size or shape); the
  actions are content the consumer gives; the progress strip is a plain element, not a `Progress` component. `scripts/check-architecture.mjs` needs
  no entry in `DEPENDENCIES`.
- **Primitives (`internal/`), used as they are:**
  - `portal` (the layer goes to the container), `overlay` (`data-ads-overlay-keep`: the layer stays reachable above an open Modal), `icons` (the
    status icons and the cross), `semantic.ts`, `options.ts` and `env.ts`: in `main`.
  - `anim` (`motion.ts`): rows enter, leave, the others slide; FLIP. **Additive change made with this component (A3 of `specs/overlay.md`):** the side the
    box comes from (`from`) and which padding of the slot is the gap (`gap`); the attribute of a row is `data-row-id`.
  - `timer` (`pausableTimer.ts`), `layer` (`createLayer`), `list` (`createListStore`), `pile` (`createPile`, `inertWhen`): extracted from Message first
    (branches `refactor/anim-motion`, `refactor/list-core`, `refactor/pile`). **Additive change made with this component (LS10):** `timer(id)` of the list
    gives the milliseconds left and whether a reason holds the timer, so that the progress strip draws from the clock that closes the notification.
  - The list has no group: the place of a notification is a field of its own record, and the places are made when the records are drawn. One `createPile`
    for each place (the pointer in one place opens that place only). The geometry of the pile (offsets, scale steps, the lean of the bottom places) is
    Notification's own CSS and tokens, measured on the public demo.
- **Branches.** `feat/notification` is built on the three extraction branches, in order. They ship with this component in one release (the version comes
  with Notification, +0.1.0; the Form may join, rule 8b).
- **The plan** `ai/dependencies.md` is corrected (timer, layer, list-core, pile rows).

## Decisions for the owner (D1 to D7, all answered 2026-11-19)

### D1. Does `stack` start switched on? **Answered: A** (2026-11-19)

| Option | What |
|---|---|
| **A (recommended)** | On by default with threshold 3, as React 5.10.0 does: past three notifications in a place the older ones lie behind the newest. Rule 5a: the React semantics is the reference. The default is read from the docs table (`{ threshold: 3 }`) and is **confirmed on the public demo** with the measurements below before it is final. |
| B | Off by default, as our `Message` (React's Message has it off). Simpler to explain, but differs from React Notification. |

### D2. What does `maxCount` count? **Answered: A** (2026-11-19)

| Option | What |
|---|---|
| **A (recommended)** | All notifications in all places together (React, Angular, and the hook of Vue). The oldest of all closes. |
| B | Each place separately (Vue static). |

### D3. What does a call return? **Answered: B** (2026-11-19)

| Option | What |
|---|---|
| A | Nothing (React, Vue); close by `destroy(key)`. |
| **B (recommended)** | A function that closes it. Not thenable: nobody returns a promise from `notification.*`, so there is no parity to keep and no `await` trap. More can be added later as properties. |
| C | The same thenable function as `message.*`, for symmetry. It brings the `await` trap of Message D2 into a component that never had it. |

### D4. Does `onclose` carry the reason? **Answered: B** (2026-11-19)

| Option | What |
|---|---|
| A | No argument (React, Vue). |
| **B (recommended)** | `onclose(reason)` with `'timeout' \| 'user' \| 'replaced' \| 'destroy'`. Angular says only "closed by the user". Additive; the list-core knows the cause when it closes, so it is cheap there, and `Message` can take it later without a break. |

### D5. A list taller than the window: **Answered: A** (2026-11-19)

| Option | What |
|---|---|
| **A (recommended)** | Each place scrolls (React does), the content stays reachable; about one day with the three engines and the pile. |
| B | No scroll, as our `Message`; the page advises `maxCount`. Content below the edge is unreachable. |

### D6. One layer or one per place? **Answered: A** (2026-11-19)

| Option | What |
|---|---|
| **A (recommended)** | One layer element with up to six lists inside (one `createLayer`, one `data-ads-overlay-keep`, one z-index). |
| B | One layer for each place, as React makes one block per place. More elements, the same behavior. |

### D7. When are the extractions made? **Answered: A** (2026-11-19)

| Option | What |
|---|---|
| **A (recommended)** | After your answers on D1 to D6, because the shape of list-core and of the pile follows them: first `refactor/list-core` (then merged here), then the pile; the implementation starts when both are in this branch. |
| B | list-core now, with the shape of `Message` plus a group; the contract questions (D2, D4) are added to it later as additive changes. |
| C | Write Notification first on a private copy and extract after (against rule 6b: not recommended). |

## Proposals P1 to P14 (settled by the three libraries or ours and cheap; **for the owner's acceptance**)

- **P1. Architecture as `Message` (D1 of Message, option C): the `notification` object plus `NotificationHost`**, one active host, a
  server no-op, an automatic layer on `body` with no host.
- **P2. `title`**, not `message`: React renamed it in 6.0.0 and deprecated the old name (the chain `message` → `title`).
- **P3. Forms:** `title`, `description`, `actions`: `string | number | Snippet` (React `ReactNode`, Vue `string | VNode | () => VNode`,
  Angular `string | TemplateRef`: no narrowing); `icon` and `closeIcon`: `string | Snippet | false`.
- **P4. `duration` in seconds, 4.5;** `0` or `false` = never (React `number | false`, Vue `0` or `null`); Angular's milliseconds are not taken.
- **P5. `placement`** six names as all three; **`top`, `bottom`** `number | string`, 24; **`container`**, element or function.
- **P6. Same `key` updates in place**, restarts the timer, announced again (Message P8); `key` is `string | number`.
- **P7. `showProgress`** (React 5.18.0), on the time left of the shared timer; about half a day. Cheap React addition, so taken.
- **P8. `pauseOnHover` (true), plus focus inside, page hidden and an open pile**; a touch does not pause (Message P5).
- **P9. Role by type** with the `role` prop as an override (React 5.6.0).
- **P10. `class`, `style`, `classNames`, `styles` (objects), `props`** (`data-*`, `aria-*`).
- **P11. `onclick`; `onclose` once per notification** at the start of the exit, for every way of closing.
- **P12. Not taken, with reasons:** `rtl`, `nzDirection` (the direction is inherited from the page), `prefixCls`, `nzAnimate`.
- **P13. The direction of the motion follows the place** (all three libraries do), as an additive option of `internal/anim/motion.ts`.
- **P14. `closable` is a boolean (default true) and `closeIcon` carries the icon;** React's object form `{ closeIcon, onClose }` is not taken
  (a narrowing, so recorded here: its two members are `closeIcon` and `onclose` with `'user'`).

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Notification.test.ts` and `e2e/notification.spec.ts`: the `alert` and `status` roles of WAI-ARIA 1.2 per type and the `role` override, the hidden type word, no focus move, the name of the close button, the inert older rows of a pile; compared with the status message of WCAG 4.1.3, the time limit of 2.2.1 and the target size of 2.5.8 (the WAI-ARIA Authoring Practices have no pattern for a toast, so there is nothing to copy it against; the same as `Message`) |
| Forced colors | test | `e2e/notification.spec.ts` (the forced-colors case, three engines): the box has a border, because the shadow is gone, and the progress strip is visible |
| IME | n/a | a notification has no text input |
| Touch | test | `e2e/notification-touch.chromium.spec.ts` (emulated touch, Chromium): a tap on the box calls `onclick` and does not hold the timer, a tap on the close button closes it, a tap does not open a pile. A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit) |
| Browser floor | test | `npm run test:floor`: the Notification checks in `scripts/floor/smoke.cjs` (a box at a corner with its click-through layer, the six places and the order, the progress strip, a pile with its `inert` rows) in Chromium 90, Firefox 85 and WebKit 15.4 |
| Screen reader | manual pending | not checked with a real screen reader yet: the Orca test of `Message` (`screen-reader/message.spec.ts`) is the pattern to copy; **the page and the README say "not checked with a screen reader"** |

## Список тестов

Each item is at least one test; the name is the item. Unit in jsdom (`tests/Notification.test.ts` and the files next to it), geometry
and events in `e2e/notification.spec.ts` (three engines). The parts shared with `Message` (the timer, the list, the pile, the motion) are
tested in their own files (`specs/overlay.md`); here only what Notification does with them.

- Methods: `open` and each type (`info`, `success`, `error`, `warning`); `destroy(key)` and `destroy()`; `config`; each returns a function that closes.
- `title`, `description`, `actions`: string, number (`0` is shown), Snippet; a Snippet that reads context from the host's position;
  no `description` is a valid box.
- `icon`: default per type, none for `open`, a string, a Snippet, `false`; the type icon is `aria-hidden`.
- `duration`: default 4.5 s, a number, `0` and `false` never close, a negative or non-finite value falls back to the default.
- `key`: same key updates in place (position and order kept, timer restarted, type switched, box width constant, announced again); a closed key
  opens a new one; a number and a string key.
- `placement`: all six, per notification, the default of the host and of `config`; each place is its own list; the corner positions are
  `top`/`bottom` 24 and the margin 24 at the sides; `top` and `bottom` are centred; `top`, `bottom` as a number and as a string.
- Order: at a top place the newest is the first row, at a bottom place the last, nearest the edge; the DOM order equals the drawn order.
- `closable`, `closeIcon`: the button exists by default, `closable: false` and `closeIcon: false` remove it; a string and a Snippet icon;
  name from `labels.close` and a translation; click, Enter and Space close; Escape inside the box closes it; `onclose('user')`.
- `showProgress`: absent by default; with it a strip whose width follows the time left, stands still while the timer is paused, restarts
  on an update by key, absent with `duration: 0`; not announced.
- `pauseOnHover`: hover pauses and resumes with the time left; `false` does not pause; **touch does not pause**; focus inside pauses; a hidden
  page pauses.
- `role`: by type; the `role` prop overrides; the hidden type word from `labels`.
- `class`, `style`, `classNames`, `styles`, `props`: each part; precedence notification > host > config; `data-*` and `aria-*` on the box.
- `onclick`: called with the event; not by the close button; a click does not close the box. `onclose(reason)`: once per notification, with
  `timeout`, `user`, `replaced`, `destroy` for the timer, the close button and Escape, the limit, and `destroy()` and the returned function;
  at the start of the exit.
- `maxCount`: total over all places; the oldest closes first with `'replaced'`; with `stack`.
- `stack`: on by default; up to the threshold a plain list; past it a pile (positions, scales and the hidden ones as measured) at a top and at a
  bottom place; `stack: false`; a custom `threshold`; hover and focus open it and hold every timer; leaving closes it; the buried rows are
  `inert` and `aria-hidden`; one place opens without the others; touch does not open it; a row closed under the pointer does not leave the
  pile held open.
- A tall list: the place scrolls and its content stays reachable.
- A close button with a wide content (the owner, 2026-11-19, the word «Close» as a snippet): the hover background covers all of it, the
  title keeps out from under it, the cross stays 24 x 24; its width is read once and follows a change (`ResizeObserver` when there is
  one), and it is let go with the notification.
- The `container` example on the site (the owner, 2026-11-19, notifications of other examples ended up in the region; then «it does not
  seem to work»: with an ordinary element nothing is seen, the layer is fixed to the window): a native modal `<dialog>`. With the container
  not set the layer is in the `body` and the dialog covers it (at the centre of the notification the pointer meets the dialog); with
  `container` set to the dialog the layer is in it and the notification can be reached and closed; the status says where the layer is.
  When the dialog closes (the button or Escape) its notification is closed and the setting is given back (the next notification of
  another example puts its layer in the `body`), and the status goes back to its first text.
- No scrollbar without a tall list (the owner, 2026-11-19, a scrollbar on `bottomRight` after many calls): a row that comes in grows its
  slot from nothing and the box hangs out of the slot, a leaving row does the same backwards, the rows behind a collapsed pile are
  lowered further than the visible ones. None of that is scrollable overflow: the content of a place (its padding is the margins and the
  distance from the edge) clips it, and the place scrolls only when its boxes are taller than the window. Tested while five rows come
  in and fold into a pile and `destroy()` runs, at all six places, with the motion on, and for a pile of twelve at four places.
- `NotificationHost`: renders the open notifications; auto layer with no host; the auto layer is removed when empty; a second host warns
  and draws nothing; its props are the settings; unmounting it and calling `notification.*` again works.
- SSR: `notification.*` on the server is a no-op, no throw, no shared state between two renders.
- Layout: the box is 384 px wide and never wider than the window on a phone; a long word breaks; a type switch by key changes no width; adding
  the actions, the close button or the strip by a key update changes the height only; a leaving box lets the others slide, frame by frame;
  no shift of a notification that stays.
- Motion: each place enters from its side (and leaves the same way); none under `prefers-reduced-motion`.
- Colors: the light theme on `tokens-accessible.css` and the dark theme pass the contrast of the text, the icons and the close button.

## Plan of the site page

`docs/src/docs/components/notification` in the way of `Message` (`docs/README.md`), texts in en, ru and zh, the table of the API (the options, the
config and host props, the methods, the close reasons, the semantic parts, the tokens), a section of keyboard and screen reader notes that
says "not checked with a screen reader". Examples (each on its own line, one state per component; the demo order is the two-column grid;
the ones that need width, `placement` and `stack`, are `wide`): 01 basic (title and description), 02 types, 03 placement (the six
places), 04 duration (4.5, a number, never), 05 update by key, 06 actions (a Snippet with buttons), 07 icon (custom, none), 08 close (default,
`closable: false`, `closeIcon`), 09 progress, 10 pause on hover, 11 stack (default, off, threshold), 12 maxCount, 13 styling (`class`,
`style`, `classNames`, `styles`), 14 onclick and onclose (the reason logged under the button), 15 content as Snippets, 16 NotificationHost
(`top`, `bottom`, `placement`), 17 destroy (all and by key), 18 container (a native modal `<dialog>`: the layer in the `body` is covered by it, the layer in the dialog stands above it and can be used; the setting is given back and the notification closed when the dialog closes or the demo is left, a status shows where the layer sits) (last on the page: the owner, 2026-11-19, it is the narrowest case). `setup` clears the open notifications when a demo is left.

## Исходник, консультации

**2026-11-19, до чтения (rule 3a, standing permission of 2026-11-13; the owner chose the reader-subagent route on this day).**

- **Question.** How do the three implementations (React `antd` with its notification package and its motion package; Vue
  `ant-design-vue`; Angular `ng-zorro-antd`) solve the six mechanisms below, and does `Message` share each of them with
  `Notification` or does each component have its own copy? The reason: we are about to move parts of `Message` into
  `internal/` and need to know what the others did, where it is better than ours and where it is weaker, before we settle the
  shape of the shared parts.
- **What to find out (only these mechanisms, the files that carry them and nothing else).**
  - **A. Motion.** How a new row comes in, how a closing row leaves, how the neighbours move into its place (CSS classes
    driven by a lifecycle, a measured height, FLIP, the Web Animations API, something else); how the direction depends on the
    placement; what happens with reduced motion; whether a leaving row keeps its place until the end.
  - **B. Timer.** How the pause on hover works (the time left is kept, or the full time starts again on leave); other
    reasons to pause (page hidden, focus); what an update of the same key does to the timer; how a progress bar (Notification
    `showProgress`) is tied to the same time.
  - **C. Layer.** How the container is made when a static call is made and no holder is mounted (where, when it is removed,
    one per placement or one for all, server-side rendering); how a configured container is honoured.
  - **D. Core of the list.** Where the list lives (a module of the library, or the state of a component behind a hook);
    the key and the update by key; `maxCount` (per placement or in total); the handle that a call returns (close, promise);
    how settings of the call, of the host and of the global config are merged; **whether Message and Notification share one
    core or have two**.
  - **E. Host.** How a holder or host registers; what happens with two of them; how a static call finds the active one.
  - **F. Stack.** How the pile past a threshold is made and how hover opens it; whether the timers wait while it is open; the
    geometry for the bottom and for the left and right placements; focus and the screen reader for the rows that are buried.
- **Our decisions and hypotheses, written before reading.**
  - A: ours is the Web Animations API with a measured height and FLIP, one direction (from above). Hypothesis: the others are
    class-driven CSS motion with a lifecycle (React) or the framework's own transition (Vue, Angular), and the neighbours move
    by an animated height or by positions. If they are simpler and as smooth, we may keep ours only for the measured shrink.
  - B: ours keeps the time left and has four reasons (hover, focus, pile, page hidden). Hypothesis: the others start the full
    duration again on leave and know hover only; the page-hidden pause is ours alone. If so, the primitive `timer` is a
    deliberate improvement and its tests must say so.
  - C: ours is a lazily mounted layer, removed with the last row. Hypothesis: the others create a container on the first call
    and keep it for good, one per placement, with no guard for a server.
  - D: ours is one module per component (Message, Modal). Hypothesis: React shares one core between Message and Notification,
    Vue and Angular have two near copies or a shared base. Our proposal (open) is one shared core in `internal/` with two thin
    components on it; if the others show that the two components differ more than we think (for example `maxCount` per
    placement, the stack), the core stays smaller (the timer and the layer only).
  - E: hypothesis: a holder per component through a hook or a service, and one global holder for static calls, the last one
    wins; ours is the same (the host mounted last is active).
  - F: hypothesis: the stack exists in Notification only (not in Message), is made with transforms, and the timers wait while it
    is open. Ours put it in Message too (D4=C of Message).
  - If after reading a decision changes, it is written here, under "after reading", and the reason with it.
- **How.** The reading is done by a **subagent** (the owner's choice, 2026-11-19; large mechanisms, three libraries), which
  returns only a description in words: no code, no quotes, no names of internal functions, no order of steps. This session does
  not see the code. Files are taken one by one from the public repositories (raw URLs, no whole clones) into a temporary
  folder outside this repository, and deleted after reading. Nothing from them goes into `src/lib/`, tests, comments,
  documentation, commits or this file.

**2026-11-19, after reading (the subagent reader; this session did not see the code; the temporary folder was deleted and its
absence checked). Words only. "(inferred)" marks what the reader concluded without seeing it said outright.**

- **What was read.** React: `antd` 6.7.1 on `@rc-component/notification` 2.1.1 (a structure rewritten in April 2026; the
  behavior before 2.0 was not read) and `@rc-component/motion` 1.4 (only the keyed list and the stages): mechanisms A to F, the
  stack code in React only. Vue: `ant-design-vue` 4.2.6, mechanisms A to E in code, F from documentation and changelog. Angular:
  `ng-zorro-antd` master, A to E in code, F from documentation; server-side rendering was not checked. The public changelog and
  issues of the React packages were used for the history of the timer and the stack.
- **A. Motion.** React: rows are placed by their measured heights and the neighbours slide by a position transition (the height of
  the list shrinks later); the direction follows the placement (sideways for left and right, from above or below otherwise);
  the leaving row stays in the page, takes no clicks, and holds its last place; the list scrolls when taller than the window; no
  reduced-motion rule and no fallback for a missing end of animation. Vue: a transition group with keyframes per placement; a
  leaving row fades and collapses its height in the flow, with a ceiling of 150 px (a taller row is cut at the start of its leave);
  no reduced-motion rule. Angular: the same keyframes as Ant Design, the classes put by code, which waits for the end event; no
  fallback, so a missing event leaves the row (inferred); a switch `nzAnimate`; no reduced-motion rule.
- **B. Timer.** React: its own clock that keeps the accumulated time on a pause (a loss of the remainder on repeated pauses was
  fixed in 2.1.1, a row removed under the pointer in 2.0.9); the pause is the pointer over the row, and with `stack` over the
  whole list; no pause for focus or for a hidden page; the progress bar is drawn from the same time. Vue: one timer per row, and
  on leave it starts the **full** duration again; no focus, no hidden page, no progress. Angular: keeps the time left (takes the
  elapsed time on enter, resumes with the rest), `nzPauseOnHover`; the clock is the wall clock, so a hidden tab still closes it;
  no focus, no progress. Update by key: React restarts only when the duration changes (inferred), Vue the same or on an update
  mark, Angular leaves the timer alone (inferred).
- **C. Layer.** React: the first static call makes a separate root in a detached fragment, then a portal to `body` or
  `getContainer`; the root lives for good; one block per placement, made with its first row and removed when it is empty;
  `getContainer` is read once on a static call and frozen; the static path touches `document` with no server guard (inferred).
  Vue: the first static call makes a `div` in `body` or `getContainer` with an app inside; one container per placement for
  Notification, one for Message; they live until `destroy`; a change of `top`, `getContainer` or `maxCount` in `config` drops the
  reference to the old container without destroying it (inferred, a possible leak); no server guard. Angular: a CDK overlay with
  a global position, one container per service for all placements, kept in a registry of singletons and destroyed with its last
  card; no configurable container.
- **D. Core of the list.** **One shared core in all three** (our hypothesis that Vue and Angular have copies was wrong). React:
  Message and Notification are both built on the notification package (list, key, `maxCount`, timer, progress, stack, motion,
  portals); antd adds two thin wrappers that are near copies of each other (static layer, hook, settings merge, icons). Vue: an
  internal package ported from the `rc-notification` of the 4.x time, with a class-instance variant and a hook variant. Angular:
  an abstract base in the Message package (service, container, card component with the timer and the motion) that Notification
  extends. Not shared: the placements (Notification only), key and update (Notification only in Angular), the content markup.
  `maxCount`: total over all placements in React and Angular, per placement in Vue (static; the hook is total). The oldest row
  over the limit is dropped; React and Angular do not call `onClose` for it or for a close by handle (inferred), Vue puts the new
  row on the old row's node with no exit. The handle: Message returns a function with `then`, Notification returns nothing in
  React and Vue (closed by key); Angular returns a reference with streams, and its close event says whether the user closed it.
  Settings: defaults, the holder or global config, then the call; `undefined` is skipped by a hook and not by a static call (Vue).
- **E. Host.** No registry in any of them. React and Vue: a hook returns an API and a holder element, and the static calls go to
  one global holder that is independent of the hook holders; several holders overlap in one corner; the context of
  `ConfigProvider` does not reach a static call (a documented pain). Angular: no host in the markup, a root service and one
  singleton container.
- **F. Stack.** React: in Notification since 5.10.0 (threshold 3) and in Message since 6.4.0 (off by default). Past the
  threshold the rows lie behind the newest, the scale drops by steps down to the second level, a strip of the offset shows (8 px by
  default), deeper rows have no opacity and no clicks; hover on the list opens it and holds every timer (only when the stack is
  on); the bottom and the left and right placements mirror it with the same offset calculation; it is built on heights and
  offsets, with no change of the order in the page; nothing for focus or a screen reader (buried rows stay in the tree and in the
  Tab order, inferred). Vue and Angular have none (`nzMaxStack` is only a cap on the count). A public issue: a row closed under
  the pointer while the stack is open leaves the "pointer is over the list" state stuck, so the rest stay open and their timers
  stand after the pointer has left.
- **Hypotheses, one by one.** A: partly (class-driven in React and Vue; the neighbours move by measured positions in React and by a
  collapsing height in Vue and Angular; the direction follows the placement in all three). B: mostly wrong (only Vue starts the
  full time again; React since 2.1.1 and Angular keep the remainder; no pause for focus or a hidden page anywhere, as guessed).
  C: partly (a container for good in Vue and the React root; React removes an empty block; Angular removes the container with the
  last card). D: wrong for Vue and Angular (all three share a core). E: partly (hook holder plus a global holder for static calls
  in React and Vue; "the last one wins" is wrong, there is no registry). F: partly (the stack is also in Message since 6.4.0, not
  only in Notification; none in Vue and Angular).
- **What we decide after reading.**
  1. **D.** A shared core is what all three did, so extracting one is right and a second copy for Notification is not. The core
     must carry a group (the placement): Message has one list, Notification up to six. The meaning of `maxCount` (total or per
     placement; React and Angular total, Vue per placement) is a decision for the specification stage, with the owner.
  2. **A.** We keep the Web Animations API with a measured slot height (it has no 150 px ceiling and has reduced motion and a
     fallback, which none of them has). The direction by placement is added in the Notification branch as an option with the
     present behavior as the default. To check in `Message`: a leaving row still catches the pointer until it is removed. To
     decide in the specification: a list taller than the window scrolls (React does it).
  3. **B.** The timer keeps the time left, as React and Angular do; the pauses for focus, the pile and a hidden page stay ours
     alone. A progress bar must run on the same clock as the closing (not on a separate CSS animation, or it drifts on a pause), so
     the primitive exposes the time left. Tests that come from their history: repeated pauses keep the remainder; a row removed
     under the pointer.
  4. **C.** Ours (the layer leaves with the last row, the container is read each time, a no-op on a server) is better than the
     roots that live for good. Open for the specification: one layer with the lists of all placements, or one layer per
     placement.
  5. **E.** Ours stays (a mounted host takes over the static calls); the independent holders of theirs are not taken.
  6. **F.** React keeps one stack in the shared core for both components, so a shared part is justified for us too; the geometry
     has to be mirrored for the bottom placements. Decided after the specification fixes the contract. A test comes from the
     public issue: a row removed under the pointer must not leave the pile held open. **Our `MessageLayer` may have the same
     fault** (the hover state lives outside the part that goes away with the last row, and a removed element sends no
     `pointerleave`): not confirmed, to be tested when the pile is touched.
  7. **`onclose` and its reason.** Angular's close event says whether the user closed the card. Whether our `onclose` should carry
     a reason (timeout, user, replaced by the limit, `destroy`) is a question for the specification (additive).
- **How ours differs.** Ours: WAAPI with a measured height and FLIP, one direction; a timer with four pause reasons and the time
  left; a layer that leaves with the last row; a store that calls `onclose` on every reason; a mounted host that takes the static
  calls; a pile with `inert` for buried rows and focus as well as hover. Theirs: class-driven or position-driven motion in every
  direction; one or two pause reasons; containers that live for good; independent holders.
