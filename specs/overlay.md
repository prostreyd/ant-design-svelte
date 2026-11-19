# Overlay primitives specification (internal)

Status: **decisions taken 2026-11-17, implementation in `feat/overlay-primitives` (released with the Modal, 0.12.0); extended
2026-11-19 in `refactor/anim-motion`**. The maintainer chose to build the shared parts in a branch of their own before the Modal
(rule 6b, step 0 of the workflow), and to write `specs/modal.md` after these parts were in `main`. The motion of Message
(`Message/motion.ts`) was left out of that branch: Message was released and in `main`, and the maintainer decided (2026-11-18)
to move it to `internal/anim/` in a branch of its own just before Notification, the second user. That branch is
`refactor/anim-motion`: it moves the motion (A2), takes the timer that waits and the layer made for a global call out of Message
and Modal (T, L), and changes nothing a user can see. Notification, Drawer and the next components import these parts.

Five internal blocks under `src/lib/internal/`. They are not components, not exported from the package and have no page
on the documentation site; each component built on them documents its own behavior on its own page.

| Folder | What | Written | Used by |
|---|---|---|---|
| `portal/` | Moves a panel out of its place in the tree into a container, and takes it back out when its owner goes. | Taken out of `popup/Popup.svelte`. `Message/MessageLayer.svelte` had the same line of its own and uses the shared one since 2026-11-19. | Popup, Message; Modal, Drawer, Image, Notification next. |
| `anim/` | The two ways a panel comes and goes: `leave.ts` waits for a CSS animation to end before the panel is hidden; `motion.ts` plays Web Animations for a list of rows. | `leave.ts` out of `Popup.svelte`; `motion.ts` is `Message/motion.ts`, moved (2026-11-19). | `leave.ts`: Popup, Modal. `motion.ts`: Message; Notification next. |
| `overlay/` | What makes a layer modal: the page does not scroll, the page behind it cannot be reached, focus stays inside and comes back, Escape closes the topmost one. | New. | Modal, Drawer, Image preview. |
| `timer/` | A timer that stands still for several reasons at once and resumes with the time left. | The timer of `Message/store.ts`, moved (2026-11-19). | Message; Notification next. |
| `layer/` | The layer the library makes on the body for a call from code (`message.success(...)`, `modal.confirm(...)`) while no host is mounted. | `Message/layer.ts` and `Modal/layer.ts` were the same file; now one part and two short files that say what to mount. | Message, Modal; Notification next. |

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
- **A2** (`motion.ts`). The same behavior as `Message/motion.ts` had: `motionAllowed`, `playEnter`, `playLeave`, `readTops`,
  `playFlip`; the box fades in from above and, with `shift`, its slot grows from nothing; a closing row fades up while its slot
  shrinks, so that the neighbours slide into its place; a pile that opens or closes slides by FLIP. No motion under
  `prefers-reduced-motion` or without `Element.animate`. The only change: the token for the distance of the slide is a parameter
  (`offsetToken`), because the file no longer belongs to Message; Message passes `--ads-message-motion-offset`, so its public
  token keeps working. Without a token the distance is 64 px.

### Timer (`timer/`)

`createPausableTimer(duration, onElapsed)` in `pausableTimer.ts`. `duration` is in milliseconds. It is a closure and not a class: private
class fields are not known to Firefox 85, the floor.

- **T1.** `start()` counts the duration down and calls `onElapsed` **once**; a duration of 0 never fires. `remaining` is the time
  left: it counts down while the timer runs and stands still while a reason holds it.
- **T2.** `setPaused(reason, on)` holds the timer for a reason or lets the reason go. Any number of reasons may hold at once, a
  reason set twice is one reason, and the timer runs only when none holds. A pause **keeps the time left** and the timer resumes
  with it, it does not start again (also after many pauses; React fixed a loss of the remainder in 2.1.1). A reason set before `start()`
  keeps the timer from starting until it lets go.
- **T3.** `restart(duration)` gives a new duration and counts it in full; the reasons that hold stay, so a held timer waits for
  them (the update of a message by its key).
- **T4.** `cancel()` stops it for good; after it, or after `onElapsed` has been called, `start`, `restart` and a pause that lets
  go do not start it again. Calling `cancel()` again does nothing.

### Layer (`layer/`)

`createLayer({ component, props, wanted, subscribe })` in `layer.ts`; it returns `{ ensure, remove }`. It imports no component:
the component is an argument.

- **L1.** `ensure()` mounts the component on the body, with the props, when `wanted()` is true, and starts watching through
  `subscribe`. Asked again it makes no second layer and no second subscription.
- **L2.** When `wanted()` turns false (nothing is left to show, or a host has taken over) the layer is unmounted, and made again
  when it turns true. `remove()` unmounts it and stops watching.
- **L3.** A change heard through `subscribe` is looked at in the next microtask, and several changes in one go are looked at once:
  a host that unmounts hands what it showed back in the middle of its own teardown, and Svelte forbids creating effects there.
- **L4.** On a server (no `document`) `ensure()` does nothing and starts no watching.

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
  not touched, because they come from inside the layer. An element with `data-ads-overlay-keep` is never touched (the Message
  layer carries it since 0.12.0: a message must stay readable above a Modal, also one that was on the page before the Modal opened).
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
6. **`motion.ts` takes the token as an argument** (A2) and does not get a generic token: a new public token for a value nobody
   asked to change is not added. `readTops` and `playFlip` still look for `data-message-id`; the name is decided when
   Notification, the second user, is specified. (2026-11-18 it stayed in Message; moved 2026-11-19, in the branch before Notification.)
7. **The timer, the layer and the motion move together, before Notification** (the maintainer, 2026-11-19, after the three
   libraries were compared in `specs/notification.md`: all of them share one core between their message and their notification,
   and the motion, the timer and the layer are in it). No second copy for Notification (rule 6b). The core of the list itself
   (`Message/store.ts`: records, keys, handles, hosts) is a **separate** later branch, so this one stays a move that changes no
   behavior and that the unchanged tests of Message and Modal show.
8. **The page-hidden pause stays in the owner for now.** The timer knows reasons, not the page: `Message/store.ts` listens for
   `visibilitychange` and sets the reason `hidden` on every timer. It moves with the core of the list.
9. **`createLayer` takes the component as an argument.** An internal part imports no component (rule 6b); the part that mounts and
   unmounts is shared, what is mounted is not.

## Tests (each item is at least one test)

Unit, jsdom (`tests/portal.test.ts`, `tests/anim.test.ts`, `tests/overlay*.test.ts`); the existing Popup tests stay as they are
and must pass unchanged, which is how "no change of behavior" is shown.

- P1 to P5: moved to `body`, to an element, to the result of a function, left in place when it returns nothing; appended last
  on each activation; follows a changed container; removed on destroy; the server render touches nothing.
- A1: the end of the element's own animation, not a child's; cancel; a cancelled animation; one second; none at once;
  `cancel()` stops the calls.
- A2 (`tests/anim.test.ts`, with `Element.animate` stubbed; the frames themselves are measured in `e2e/message.spec.ts`): the
  distance is the token's value, or 64 px; seconds and milliseconds; `shift` grows the slot to its measured height and gap; a
  closing row resolves also when an animation is cancelled; `readTops` and `playFlip` (the rows that moved, not the new ones, not
  the ones that moved less than half a pixel); none under reduced motion or without `Element.animate`.
- T1 to T4 (`tests/pausableTimer.test.ts`): once, and not before the time; 0 never; `remaining` counts down; a pause keeps what is
  left, also after repeated pauses; several reasons; the same reason twice; a reason before `start`; `restart` in full, held
  reasons stay; `cancel`, and finished means finished.
- L1 to L4 (`tests/layer.test.ts`, probe `tests/fixtures/LayerProbe.svelte`): mounted on the body with its props; none while not
  needed; one layer however often; removed and made again; `remove` stops watching; the microtask; one look for several
  changes; nothing on a server.
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
- Popup keeps its own tests (R10, R11) and e2e unchanged after the portal and the leave were taken out. Message and Modal keep their
  tests unchanged in `refactor/anim-motion` as well (the one edit is the list of source files that the Message page test reads: the
  motion is now in `internal/anim/`); that is how "no change of behavior" is shown for the move of the motion, the timer and the layer.
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
`portal`, `anim`, `overlay` and `layer`; Message takes `portal`, `anim` (the motion), `timer` and `layer`. Notification takes the
same four as Message.
