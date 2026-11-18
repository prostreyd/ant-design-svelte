# Overlay primitives specification (internal)

Status: **decisions taken 2026-11-17, implementation in `feat/overlay-primitives`**. The maintainer chose to build the
shared parts in a branch of their own before the Modal (rule 6b, step 0 of the workflow), and to write `specs/modal.md` after
these parts are in `main`. The motion of Message (`Message/motion.ts`) is **not** moved here: Message is released and in `main`,
and the maintainer decided (2026-11-18) to move it to `internal/anim/` in a branch of its own just before Notification, the
second user (option A of the Dependencies section of `specs/message.md` stays in force until then).

Three internal blocks under `src/lib/internal/`. They are not components, not exported from the package and have no page
on the documentation site; each component built on them documents its own behavior on its own page.

| Folder | What | Written | Used by |
|---|---|---|---|
| `portal/` | Moves a panel out of its place in the tree into a container, and takes it back out when its owner goes. | Taken out of `popup/Popup.svelte`. `Message/MessageLayer.svelte` has the same line of its own and moves to the shared one together with its motion, before Notification. | Popup; Modal, Drawer, Image next. |
| `anim/` | How a panel leaves: `leave.ts` waits for a CSS animation to end before the panel is hidden. (The Web Animations of a list of rows, `Message/motion.ts`, join this folder before Notification.) | `leave.ts` out of `Popup.svelte`. | Popup; Modal, Drawer next. |
| `overlay/` | What makes a layer modal: the page does not scroll, the page behind it cannot be reached, focus stays inside and comes back, Escape closes the topmost one. | New. | Modal, Drawer, Image preview. |

The comparison with the three Ant Design libraries is not repeated here: it belongs to the specification of each component
(Modal: `specs/modal.md`). Nothing below is taken from their source code; it was not read. The focus, keyboard and background
rules are the WAI-ARIA Authoring Practices pattern "Dialog (Modal)" (<https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/>);
the scroll lock and `inert` follow MDN. API inspired by Ant Design (MIT); the implementation is original for Svelte.

## What the Popup spec already settled for these parts

- A panel in `body` is hidden behind a native `<dialog>` opened with `showModal()` (the browser's top layer is above every
  z-index). So **the layer of a Modal is an ordinary element, not `showModal()`**, and it sits below the three popup layers
  (popover 1030, dropdown 1050, tooltip 1070): a Select inside a Modal opens above it.
- A press outside and Escape of popups are the registry of `popup/layers.ts`. The overlay stack below does not replace it:
  Escape in a Select inside a Modal closes the Select first (R12).

## Requirements

### Portal (`portal/`)

- **P1.** The element is moved into the container when the owner says it is active (at once, when the attachment runs, so
  that an effect of the owner that comes after it finds the element in its place), and appended last, again on every
  activation: layers of equal z-index stack in the order of opening (Popup R10). Inactive, it stays where it is.
- **P2.** The container is an element, a function that returns one, or nothing: the default is `document.body`, also for a
  function that returns nothing (`resolveContainer`). To leave the element in place the owner gives the attachment no target
  at all (`null`): that is what `getContainer={false}` of the Modal will be.
- **P3.** A change of the container while active moves the element to the new one.
- **P4.** When the owner is destroyed the element is removed from wherever it is (Svelte removes only the nodes it knows, and
  this one was moved out of them).
- **P5.** Nothing is touched on the server (an attachment does not run there).

### Anim (`anim/`)

- **A1** (`leave.ts`). `waitForLeave(element, done)` calls `done` once: when the element's own animation ends or is cancelled
  (the end of an animation of a child does not count), after one second if it never ends, or at once if the element has no
  animation (`animation-name: none`, which is what `prefers-reduced-motion` sets) or there is no element (a panel that is not in the page yet). It returns a function that cancels it.
- **A2** (`motion.ts`, **not in this branch**). The Web Animations of `Message/motion.ts` move here, with the distance of the slide
  as a parameter (`offsetToken`, which Message fills with its own `--ads-message-motion-offset`), in the branch that comes just
  before Notification. The changes are saved in the private notes of the maintainer's folder (`notes/message-motion-move/`).

### Overlay (`overlay/`)

One call, `openOverlay(options)`, returns the function that closes it. The pieces are also exported on their own, so that a
layer without a mask (a Drawer with no mask) takes only what it needs.

- **O1** (`scrollLock.ts`). While a layer is open the container (the body by default) does not scroll: `overflow: hidden`
  (on `html` too, when the container is the body: a page that sets `overflow-y: scroll` on `html` to keep its scrollbar is not
  held by the body alone, which the browser test showed), and `padding-inline-end` grows by the width of the scrollbar that
  went away, so the page does not jump sideways. Two
  layers lock once (counted per container); the last one to close puts back **exactly** the inline values that were there
  before, an empty value included. A page that has no scrollbar gets no padding. Right-to-left pages work (logical
  property).
- **O2** (`inertOutside.ts`). While a layer is open everything outside it is out of reach for the keyboard, the pointer and
  assistive technology: the siblings of the layer and of each of its ancestors, up to the body, get `inert`; where the engine
  does not know `inert` (Chromium before 102, Firefox before 112, Safari before 15.5, so the browser floor) they get
  `aria-hidden="true"` instead, and the focus trap of O3 keeps the keyboard in. An element that was already inert or
  `aria-hidden` keeps its own value when the layer closes. Counted per element, so closing layers in any order never frees an
  element that another layer still holds. Elements added to the page **after** the layer opened (a Select list, a Tooltip) are
  not touched, because they come from inside the layer. An element with `data-ads-overlay-keep` is never touched. The Message
  layer does **not** carry it yet (Message is released and is not changed here): a message layer that is already on the page when
  a Modal opens is put out of reach with the page, so a message added to it is not read by a screen reader; a message that opens a
  new layer after the Modal (the usual case: a message from the OK button when none is on the page) is not touched. The Modal
  specification decides where the attribute is added (the layer of Message, in the branch that moves its motion, or in the Modal's
  branch); until then this is a known gap of the primitive.
- **O3** (`focus.ts`). On open, focus goes to `initialFocus` (an element or a function; the layer itself by default, which
  has `tabindex="-1"`), without scrolling the page. **Tab** on the last focusable element goes to the first and **Shift+Tab**
  on the first goes to the last; a Tab while focus is outside the layer (the body, after a press on the mask) goes in; a layer
  with nothing to focus keeps focus on itself. On close focus goes back to the element that had it before the layer
  opened, if it is still in the page and focus is not already somewhere deliberate (inside the layer or on the body);
  `restoreFocus: false` turns it off. A focusable element is one that is visible, enabled, not `inert` and not in a
  `hidden` or `inert` ancestor, with a non-negative `tabindex`.
- **O4** (`stack.ts`). The open layers are a stack, one `keydown` listener for all of them. **Escape** goes to the
  topmost layer: its `escape()` says whether it closes, and then `dismiss('escape', event)` is called with the key **not yet cancelled** (so a layer can refuse by calling
  `event.preventDefault()` in its handler, which is how the Modal vetoes a close), and the key is cancelled after the call, whether the layer closed or refused; a
  key that was already handled (`defaultPrevented`, which is how a popup says it used Escape) or that ends an IME composition
  is ignored. The listener is on `window`, so it runs after the document listener of the popups. **Tab** is handled by the
  topmost layer only, so a second Modal over the first does not have two traps fighting.
- **O5.** `openOverlay` does these in a fixed order: remember the focused element, join the stack, move focus in, put `inert` on the
  outside, lock the scroll. Focus goes in **before** the page is put out of reach: where the engine does not know `inert` the page gets
  `aria-hidden`, and a browser reports and ignores that on an ancestor of the element that has focus (found while writing the Modal:
  React tracker 50170, Vue 7838). Closing undoes it in the reverse order, and gives focus back last, once the page is reachable
  again. Each step is undone even when another throws. Opening, closing and opening again quickly leaves one hold of each kind.
- **O6.** Nothing here touches the DOM at import time or on the server; the functions are called from effects only.

## Decisions

1. **One composed call plus separate pieces** (O1 to O4 on their own, `openOverlay` over them): Modal and Drawer share the
   whole sequence, a Drawer without a mask takes part of it, Image preview takes all.
2. **`inert` first, `aria-hidden` where it is missing, `aria-modal` on the dialog** (the component sets it): three layers,
   because the floor does not know `inert` and some screen readers still ignore `aria-modal`.
3. **No `focusin` guard** that pulls focus back into the layer. Popups opened from inside a layer (the list of a Select, the
   panel of a DatePicker) live in `body`, outside it, and a guard would fight them. The price: on the floor (no `inert`), a
   Tab from inside such a popup can leave the layer. Where `inert` exists it cannot.
4. **Lock with padding, not `scrollbar-gutter`.** `scrollbar-gutter` needs the page to have set it before the layer
   opens. `html` is locked together with the body (O1), because which of them scrolls the page is the page's choice. The
   limit that stays: iOS Safari before 16 ignores `overflow: hidden` for touch scrolling, and a page whose own scroller is
   an element inside the body is not locked unless that element is the container. The Modal sets `overscroll-behavior:
   contain` on its own scroll area.
5. **`data-ads-overlay-keep`** is the only way out of `inert`. A prop on `openOverlay` was the alternative; an attribute
   lets a component that is not part of the layer (Message) say it on its own, without the layer knowing it.
6. **`Message/motion.ts` stays where it is for now** (2026-11-18). Message is released; moving it here changes four of its files
   and its spec, and Modal does not need it. It moves just before Notification (A2). Said then: the token of the distance is an
   argument, no generic token is added, and `readTops` and `playFlip` look for `data-message-id` until Notification is specified.

## Tests (each item is at least one test)

Unit, jsdom (`tests/portal.test.ts`, `tests/anim.test.ts`, `tests/overlay*.test.ts`); the existing Popup tests stay as they are
and must pass unchanged, which is how "no change of behavior" is shown.

- P1 to P5: moved to `body`, to an element, to the result of a function, left in place when it returns nothing; appended last
  on each activation; follows a changed container; removed on destroy; the server render touches nothing.
- A1: the end of the element's own animation, not a child's; cancel; a cancelled animation; one second; none at once;
  `cancel()` stops the calls.
- O1: lock and unlock restore the inline values (set and empty); `html` is locked and restored with the body; two locks, one
  restore; the scrollbar width goes to the padding; none when there is none; an element container; unlock in any order.
- O2: siblings of every ancestor, not the layer; `inert` or `aria-hidden` by feature; a previously inert element is left alone;
  counted with two layers in both closing orders; `data-ads-overlay-keep`; elements added later are untouched.
- O3: initial focus (default, element, function); Tab and Shift+Tab wrap; Tab from outside goes in; nothing to focus; hidden,
  disabled, `tabindex="-1"` and inert elements are skipped; restore, the guards of restore, `restoreFocus: false`.
- O4: Escape reaches only the topmost; `escape()` false lets it pass; a handled key and a composition are ignored; a popup that
  used Escape stops the layer; the listener is removed with the last layer.
- O5: the order of the steps (focus before the page is hidden, F1) and their undoing, also when a step throws; open, close and open quickly (F2).
- The two together, as a component makes them (`tests/overlayLayer.test.ts`, harness `tests/fixtures/OverlayHarness.svelte`): the
  layer is already in the body when `openOverlay` runs in an effect of the component (a nested effect in the portal ran
  after it and `inert` went to the wrong siblings; the portal now places the element when the attachment runs); opens and
  closes with a flag; Escape reaches the component; destroying the component lets everything go; a layer inside a container
  of the page hides the siblings of the container.
- Browser (`e2e/overlay.spec.ts`, three engines, lab `e2e/fixtures/OverlayLab.svelte`): the page does not shift sideways when the
  lock turns on and off, on a page with a scrollbar; the background cannot be clicked or tabbed to; Tab wraps in both
  directions; focus comes back to the button that opened the layer; Escape in a Popup inside the layer closes the Popup first;
  a second layer over the first takes Tab and Escape, and the first one takes them back when the second closes.
- Popup keeps its own tests (R10, R11) and e2e unchanged after the portal and the leave were taken out. Message and its tests are not
  changed by this branch.
- Mutation testing: the runner mutates only `src/lib/<Component>/*.svelte`. The new parts are `.ts` (not mutated; 100% of lines and
  branches covered, and every file has tests that call it), and `Popup.svelte` is not a target of the runner. No component
  changed in this branch.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/overlayFocus.test.ts` and `e2e/overlay.spec.ts`: compared with the APG pattern "Dialog (Modal)": focus moves into the layer, Tab and Shift+Tab stay in it, focus returns to the element that opened it, Escape closes it. The roles and the name of the dialog belong to the component |
| Forced colors | n/a | no visual output of its own: no color, border or shadow |
| IME | n/a | no text input; a key that ends a composition does not close the layer, and that is a unit test of its own in `tests/overlayStack.test.ts` |
| Touch | manual pending | emulated touch cannot show whether the body lock holds the page on iOS Safari before 16; checked on a real device when the Modal is |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit): `e2e/overlay.spec.ts`. The compensation for the scrollbar is measured in the normal run in Chromium (15 px) and WebKit (15 px). A headless Firefox has no scrollbar that takes room, so there the same test takes the 0 px branch (nothing moves, no padding); the report shows which branch ran. Measured with a real scrollbar on 2026-11-18 by running the same spec in a headed Firefox 159 under `xvfb-run` (12 px, padding 12 px, shift 0 px; the control without the padding widens the page by 12 px) |
| Browser floor | test | `npm run test:floor`: the overlay lab checks in `scripts/floor/smoke.cjs`, 42 of 42 in Chromium 90, Firefox 85 and WebKit 15.4 (2026-11-18). Chromium 90 and Firefox 85 have no `inert` there: the `aria-hidden` and Tab path. The compensation for the scrollbar is measured at the floor only in WebKit 15.4 (15 px); the headless Chromium 90 and Firefox 85 of the floor have no scrollbar (0 px), so those two show only that nothing moves |
| Screen reader | manual pending | what NVDA, VoiceOver and Orca say about a page behind `inert` and `aria-hidden` is not checked; the Orca test of the Modal will be the first |

## Dependencies

Rule 6b: these are shared parts, they import no component. Popup (`popup/Popup.svelte`) takes `portal` and `anim`; the Modal takes
all three. Message takes `portal` and `anim` when its motion moves (before Notification).
