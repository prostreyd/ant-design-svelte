# Popup specification (internal primitive)

Status: **agreed, workflow stage 2 is done** (2026-11-11). Decision 1 (approach **B**: own positioning
and a portal), 2 (browser floor: the library's own, Chrome 89, Firefox 85, Safari 15.4) and 3 (Vue docs)
were taken one by one; 4 (point anchor, RTL mirroring) and 5 (internal, not exported) were accepted with
"давай" to the proposals. The Select specification ([select.md](select.md)) is agreed too and has checked
this contract. The primitive is implemented (2026-11-11, see "Implementation notes"); no component uses it yet.

The popup is a shared internal block under `src/lib/internal/`. It is not a component of Ant Design and
has no page of its own on the documentation site; every component that sits on it is documented on its
own page. It is not exported from the package in v1.0 (see decision 5).

The comparison below uses public documentation, not implementation source code.

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/tooltip>, `/popover`, `/dropdown`, `/select` | 6.7.0 (site navigation), 2026-11-11 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/tooltip/en>, `/dropdown/en`, `/select/en` | 22.2.0 (site header), 2026-11-11 |
| Ant Design Vue | <https://antdv.com/components/tooltip>, `/dropdown`, `/select`; the site renders client-side, so the API tables were read from the documentation markdown files of the repository (`components/<name>/index.en-US.md`, docs text only, no component code; standing permission, decision 3) | `main` branch docs, 2026-11-11; npm release 4.2.6 |
| Package manifests | `npm view` of `@rc-component/trigger` 3.10.1 (and its published README), `@rc-component/portal`, `ant-design-vue` 4.2.6, `antdv-next` 1.8.1, `@v-c/trigger` 1.1.6, `ng-zorro-antd` 22.2.0 | 2026-11-11 |
| Browser support | `@mdn/browser-compat-data` 8.1.8 (npm package, read locally) | 2026-11-11 |

The pages read have no section on ARIA, keyboard use, Escape, outside-click or focus for Tooltip,
Popover and Dropdown, and Select has only a note to add `aria-label` yourself. The a11y contract below
is therefore our own, based on the WAI-ARIA patterns, not copied from Ant Design.

## What it is, and what it is not

A **popup** is a small panel anchored to an element or to a point. It places itself next to the anchor,
moves to the other side or along the edge when there is no room, follows scroll, resize and size changes,
closes on outside click and Escape, opens on hover, focus or click, is drawn above and outside the normal
flow, and animates in and out.

It is **not** a Modal or a Drawer: those are centered or edge-attached, have a backdrop and no anchor, so
they need only the layering and the animation. It does not own the content, the role or the focus
behavior of the panel: a Tooltip, a listbox, a menu and a calendar are different things inside the same
frame.

## Who needs it

The 14 components that sit on a popup, found on 2026-11-11 from the public documentation and package
manifests of Ant Design 6.7.0 (no source code read). "Needs" is what each is expected to ask from the
primitive; each component's own specification confirms it.

| Component | Opens by | Anchor | Needs |
|---|---|---|---|
| Tooltip | hover, focus, click, context menu | trigger element | arrow, delays, never takes focus |
| Popover | as Tooltip | trigger element | the pointer can move into the panel (it holds links and buttons); built on Tooltip |
| Popconfirm | click | trigger element | built on Tooltip |
| Dropdown | hover, click, context menu | trigger element or a point | closes on item click, cascading menus, report whether the trigger or the menu closed it |
| Select, AutoComplete, Mentions | focus or click on the field | the field | width of the field, focus stays in the field, closes on blur |
| Cascader, TreeSelect | as Select | the field | as Select, wider and taller panels |
| DatePicker, TimePicker | as Select | the field | as Select, interactive panels |
| Menu | hover, click on a submenu item | the item | nested popups (a popup opened from inside a popup) |
| Tabs | click on the overflow button | the button | menu inside a popup |
| Tour | by step | a target element | no hover/click triggers |

## Requirements

What the primitive must provide. "Evidence" is where the need shows in the public documentation;
"ours" means the documentation is silent and the contract is our decision.

| # | Requirement | Evidence |
|---|---|---|
| R1 | **Placement.** 12 values: `top`, `bottom`, `left`, `right` and the aligned `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `leftTop`, `leftBottom`, `rightTop`, `rightBottom`. Consumers restrict the set (Select: 4 values, default `bottomLeft`; Tooltip default `top`; Dropdown default `bottomLeft`). | React Tooltip, Dropdown, Select; Angular Tooltip; Vue Tooltip (12 values, default `top`), Dropdown (6 values: `bottom` and `top` are the centered ones), Select (4 values, 3.3.0) |
| R2 | **Overflow.** When there is no room: move to the opposite side (`top` to `bottom`, `topLeft` to `bottomLeft`), and for a placement without alignment also shift along the edge; an aligned placement only flips. On by default, switchable (`autoAdjustOverflow`, default `true`). | React Tooltip text and props, Dropdown (5.2.0); Vue Tooltip `autoAdjustOverflow` (default `true`) |
| R3 | **Follow the layout.** Stays attached through scroll of the page and of any scrolling ancestor, window resize, size change of the anchor or the panel, and a movement of the anchor by a layout change elsewhere, with no manual call (the rectangle of the anchor is checked once per frame while the popup is open). **The page scroll needs no repositioning step** (decision 13): the panel is in the same coordinate space as its anchor, so the browser moves both together, in the same frame. | React says it does not realign after layout changes unless `forceAlign` is called; Angular says only the body scroll repositions it and a custom scroll container needs `CdkScrollable`. Both are limits we do not inherit. The Vue pages are silent. |
| R4 | **Anchor.** An element, or a point `{x, y}` (the context menu opens at the pointer). | React Dropdown `contextMenu` trigger; Angular `NzContextMenuService.create({x, y})`, `nzTooltipOrigin`; Vue lists the `contextmenu` trigger without saying where the panel opens |
| R5 | **Match the anchor width.** `boolean` or a number; the width is a **minimum**: the panel may be wider, and a number wider than the field is kept. | React Select `popupMatchSelectWidth` (5.5.0); Angular `nzDropdownMatchSelectWidth` (boolean); Vue Select `dropdownMatchSelectWidth` (`boolean \| number`, same minimum-width wording; `false` also disables virtual scroll) |
| R6 | **Arrow.** Optional, pointing at the anchor; `pointAtCenter` points at the center of the anchor instead of its aligned edge. The arrow must stay correct after a flip or a shift. | React `arrow: boolean \| {pointAtCenter}` (5.2.0; Tooltip default `true`, Dropdown `false`); Angular `nzTooltipArrowPointAtCenter`, `nzArrow`; Vue `arrow: boolean \| {pointAtCenter}` (Tooltip 4.2.0, default `true`; Dropdown 3.3.0, default `false`) and the older `arrowPointAtCenter` |
| R7 | **Open state.** Controlled by an `open` value and reported through `onopenchange(open, info)`; `info.source` tells whether the trigger or the content caused it. | React `open`/`onOpenChange` (Dropdown `info.source`, 5.11.0); Angular `nzVisible`/`nzVisibleChange`; Vue `open` (v-model) and `openChange(open)`. **Semantics differ:** the Vue Dropdown does not call `openChange` when the menu closes after an item click; React does, with `source: 'menu'`. React is the reference. |
| R8 | **Triggers and delays.** `hover`, `focus`, `click`, `contextMenu`, any combination, or none (controlled only). Delays in seconds, default 0.1 before show and 0.1 before hide in React; Angular 0.15 and 0.1. The pointer may cross the gap between the anchor and the panel without closing it. | React `trigger`, `mouseEnterDelay`, `mouseLeaveDelay`; Angular `nzTooltipTrigger` (`null` = never), delays; Vue `trigger` (a single value for Tooltip, an array for Dropdown, `contextmenu` in lower case), delays 0.1 and 0.1 seconds. The React trigger package also has `focusDelay` and `blurDelay` (README), which the Tooltip docs do not expose. |
| R9 | **Dismissal.** Outside press, Escape, and (for field-anchored popups) focus leaving the field. A press inside the panel, or inside a popup opened from it, is not outside. | ours (React Select only says it closes on lost focus) |
| R10 | **Layering.** Drawn above the page content and outside its flow, not clipped by `overflow: hidden` ancestors. Ant Design tokens order the layers: Popover 1030, Dropdown and Select 1050, Tooltip 1070. React `getPopupContainer(triggerNode)` (default `document.body`) moves it into another element. | React `zIndex`, `getPopupContainer`, tokens `zIndexPopup`. React and Vue Select: render into the trigger's parent when the panel scrolls with the page or must sit inside other popup layers. |
| R11 | **Motion.** Enter and leave animation from motion tokens; `prefers-reduced-motion: reduce` removes it. After the first opening the content stays mounted while closed; `destroyOnHidden` removes it on every close (React 5.25.0, default `false`). Before the first opening nothing is rendered (ours). `fresh` (React 5.10.0, keeps the closed content updating) is not needed: mounted Svelte content stays reactive. | React Tooltip tokens `motionDuration*`, `destroyOnHidden`, `fresh`; Vue `destroyTooltipOnHide`, `destroyPopupOnHide` (same meaning, old names) |
| R12 | **Focus.** The primitive never moves focus by itself. A field-anchored popup keeps focus in the field, so pressing inside the panel must not blur it. | React Select FAQ (stop `mousedown` to keep it open); Vue Select FAQ (a click in the `dropdownRender` area closes the dropdown unless its default is prevented); ours |
| R13 | **Nesting.** A popup opened from inside a popup (cascading Dropdown menu, a Select inside a Popover) keeps the outer one open while it is used, and closes on Escape from the inside first. | React Dropdown cascading demo; ours |
| R14 | **Wiring for a11y.** A stable `id` for the panel, so the consumer sets `aria-controls`, `aria-describedby`, `aria-expanded`. The role (`tooltip`, `listbox`, `menu`, `dialog`) belongs to the consumer. | ours |
| R15 | **RTL.** Placements mirror in right-to-left layouts, as the other components do (`left` becomes `right`). | ours, same rule as Switch |
| R16 | **Server rendering.** No DOM access while rendering on the server; a popup that has not been opened renders no panel. | ours |

## Value forms per prop (CLAUDE.md section 5, item 4)

| Prop | React | Angular | Our type | Narrowing |
|---|---|---|---|---|
| `placement` | string union of 12 | string union of 12, and `Array<string>` for Tooltip | string union of 12 | The array form (an ordered list of fallbacks) is Angular-only: not taken, the order of fallbacks is internal. Dropdown naming differs: React `bottom`, Angular `bottomCenter` for the same place; React names are the reference. |
| `trigger` | one value or an array | one value or `null` | array of values; an empty array means controlled only | none: both forms are covered |
| `open` | boolean | boolean | `boolean` | none |
| `arrow` | `boolean \| {pointAtCenter}` | two separate inputs | `boolean \| {pointAtCenter: boolean}` | none |
| delays | number, seconds | number, seconds | number, seconds | Unit follows the reference (React). Defaults differ (React 0.1/0.1, Angular 0.15/0.1): React's are the reference. |
| match width | `boolean \| number` | `boolean` | `boolean \| number` | none |
| container | function `(triggerNode) => HTMLElement` | not documented | depends on decision 1 | see decision 1 |
| content | `ReactNode` or function | `string \| TemplateRef` | a `Snippet` in the primitive | The primitive takes a snippet only. Tooltip and Popover take **string and snippet** (decided for Switch on 2026-11-10: both libraries accept text); check this again in their own specifications. |

Vue forms, checked against the same rows: `trigger` is a single value for Tooltip (`hover`, `focus`,
`click`, `contextmenu`) and an array for Dropdown; `title` is `string | slot`; `arrow` is
`boolean | {pointAtCenter}` plus the older boolean `arrowPointAtCenter`; delays are seconds;
`dropdownMatchSelectWidth` is `boolean | number`; `getPopupContainer` is a function; `open` is a boolean
(`v-model`). Nothing in Vue is wider than the forms in the table, so there is no new narrowing. Spelling:
Vue and Angular write `contextmenu`, React `contextMenu`: React's spelling is the reference.

## How the three libraries build it (public information only)

Asked on 2026-11-11: how does Ant Design build the popup, and does the approach fit us? The
implementation source was **not read for this section** (it was read once later, for one question: see
"Source consulted" under decision 13), so
this section rests on published package manifests, the published README of the React trigger package and
the documentation pages above. It shows the technique, not the code. The Angular CDK overlay
documentation (<https://material.angular.dev/cdk/overlay/overview>) could not be read: the page is
rendered on the client and a fetch returns only the site title.

| | React 6.7.0 | Vue | Angular 22.2.0 |
|---|---|---|---|
| Popup package | `@rc-component/trigger` 3.10.1 (MIT), a separate package shared by the components | ant-design-vue 4.2.6 (own code); antdv-next 1.8.1, a Vue 3 rewrite, depends on `@v-c/trigger` 1.1.6 | NG-ZORRO depends on `@angular/cdk` ^22 |
| Layers, from the manifests | trigger and state; `@rc-component/portal`; `@rc-component/motion`; `@rc-component/resize-observer` | ant-design-vue: `dom-align`, `resize-observer-polyfill`; `@v-c/trigger`: `@v-c/portal`, `@v-c/resize-observer` | the CDK overlay (positioning, scroll strategies, container) |
| Positioning, from the docs | measured in JavaScript: `popupAlign` is "dom-align compatible", named `builtinPlacements`, an `onPopupAlign` callback, `autoAdjustOverflow` | `align`: "settings of dom-align" | placement list; an `updatePosition()` method |
| Where the panel lives | in a portal, in `getPopupContainer`, `body` by default; `zIndex` | same | the overlay container; a `nzBackdrop` option on Select |
| Extras in the trigger layer (README) | `stretch`, `alignPoint` (anchor at the pointer), `unique` (one shared popup container), `fresh`, `forceRender`, `autoDestroy`, `mask`, `focusDelay`, `blurDelay`, `disabled` | none listed | none listed |
| Documented consequences | no realign after layout changes unless `forceAlign` is called; Select: render into the parent when it scrolls with the page or sits in other popup layers | Select: the same parent-container advice | body scroll repositions it; a custom scroll container needs `CdkScrollable` |
| Popover API, CSS anchor positioning | not mentioned in the docs, the README or the manifest | not mentioned | not mentioned |

What follows:

- All three build it the same way: **positioning measured in JavaScript, a portal outside the flow, a
  separate trigger layer shared by the components**, with a ready alignment library (dom-align) or the
  CDK doing the measuring. That is approach B below, with C as its off-the-shelf variant.
- What carries over to us is the **decomposition** (state and triggers, alignment, layer, motion as
  separate pieces) and the **public feature set** (named placements, match width, point anchor, shared
  tooltip container, `fresh`, delays in seconds). Both are already in the requirements above. The
  code is written from scratch.
- The **documented weaknesses** of the technique are the ones R3, R10 and R13 are written against:
  realign by hand, a scroll container that must be registered, and "render into the parent when popups
  sit in popups". With B all three are ours to get right: the measuring follows every scroll parent and
  every size change on its own (R3), a `container` option places the panel inside another element (R10),
  and a layer registry keeps nested popups open and orders them (R13).
- Features of the React trigger layer not yet in the requirements, to be judged in the consumers'
  specifications: `unique` (Tooltip), `mask` (Tour, unconfirmed), `focusDelay` and `blurDelay`.

## Approaches (decision 1: **B**, taken 2026-11-11)

**Chosen: B**, with the browser floor of the library itself (decision 2). A needs Firefox 147 and
Safari 26. D needs Chrome 114, Firefox 125 and Safari 17, which would drop Chrome 89 to 113, Firefox 85
to 124 and Safari 15.4 to 16.x for the sake of less code. C adds a runtime dependency that contradicts
the site's "No dependencies except Svelte 5". The table below is kept as the record of the comparison.

All four give the same public behavior to the components. They differ in what the platform does for us,
in the browser floor, and in how it is tested. Browser versions are from `@mdn/browser-compat-data`
8.1.8; "partial" entries are explained in the notes.

| | **A. Native** (excluded by decision 2) | **B. Own positioning and portal** (the technique of all three libraries) | **C. Third-party library** | **D. Hybrid** |
|---|---|---|---|---|
| Layer, light dismiss, Escape | Popover API: `popover`, `showPopover()` (top layer, no z-index) | ours: portal to `body`, z-index stack, document listeners | ours (the library does only positioning) | Popover API |
| Placement, flip, shift, width | CSS anchor positioning: `position-area`, `position-try-fallbacks`, `anchor-size()` | ours (`getBoundingClientRect`, scroll parents, `ResizeObserver`) | `@floating-ui/dom` 1.8.0 (MIT; two dependencies of its own; 174 KB unpacked, per npm) | ours, as B |
| Follows scroll and resize (R3) | by the browser, no code | ours (the scroll-container pitfall of Angular's docs) | the library's `autoUpdate` | ours, as B |
| Arrow after a flip (R6) | CSS can tell which fallback applied only through anchored container queries: Chrome 143, not in Firefox or Safari; elsewhere measured in JS | known to the JS, easy | the library has an arrow module | known to the JS, easy |
| Triggers, delays, `open` sync (R7, R8) | ours; `interestfor` (hover) is Chrome 142 only and experimental, so unusable | ours | ours | ours |
| Point anchor (R4) | CSS anchors need an element: a zero-size element placed at the point | easy | virtual element, supported | easy |
| Browser floor | Chrome/Edge 125 (`position-area` 129, `position-try-fallbacks` 128), Firefox 147, Safari 26; Popover API from Chrome 114, Firefox 125, Safari 17 | the floor of the rest of the library, measured on 2026-11-11: Chrome 89, Firefox 85, Safari 15.4 (see "Measured floor"); the popup code itself needs nothing newer | as B | Popover API only: Chrome/Edge 114, Firefox 125, Safari 17 |
| A modal in the top layer | popups are in the top layer too, so they are above a modal | a popup in `body` is **hidden behind** a `<dialog>` opened with `showModal()` if Modal ever uses it | same as B | as A |
| Scoped theme tokens | the panel stays in its place in the DOM, so tokens set on an ancestor reach it | a panel in `body` sees only tokens set on `:root` or `body` | same as B | as A |
| Unit tests (jsdom 31) | jsdom has no Popover API and no layout: needs a small shim; positioning only in a real browser | the placement math is a pure function: unit-testable with fake rectangles; real geometry in a real browser | as B | as A for the layer; the math as B |
| CI browsers | CI installs only Chromium; Firefox 147 and Safari 26 behavior would be untested unless Firefox and WebKit projects are added to CI | same: one engine in CI | same | same |
| Dependency | none | none | **adds a runtime dependency**: contradicts the site's "No dependencies except Svelte 5 (peer)" (`f6.t`, `f6.d`, `intro.f5` in en, ru, zh) | none |
| Code we write | least | most | middle | middle |
| Main risk | the floor: Firefox 147 and Safari 26 only; `position-anchor` changed its initial value across versions (partial in Chrome 125 to 150, Firefox 147 to 150, Safari 26), so it is always set explicitly | the most code to get right, and the modal conflict | supply chain and a documentation claim to rewrite | JS placement code plus a Safari behavior note below |

Notes on the table:

- `popover="hint"` is not usable: Chrome 151 (partial from 133), Firefox 153 (partial from 149), Safari
  only in preview.
- web.dev reports a light-dismiss bug in Safari before 18.3 (the browser-compat data shows Safari 17 for
  the API itself). This was read in a web.dev article and **not checked by us**.
- Motion for the native layer (`@starting-style`, `transition-behavior: allow-discrete`) works from
  Chrome 117, Firefox 129 (partial), Safari 17.5. The `overlay` property is Chrome-only and not needed.
- None of the native behavior listed under "Open questions" has been tried in a prototype yet.

### Measured floor (2026-11-11)

The floor of a library is set by its weakest part, so the popup is compared with what the library
already needs. Method: every CSS property, selector and at-rule used in `src/lib` (13 files, the
`<style>` blocks and `.css`) looked up in `@mdn/browser-compat-data` 8.1.8; JavaScript features looked up
by name. Entries marked partial are read as soft (see below).

| Part | Needs | Chrome | Firefox | Safari |
|---|---|---|---|---|
| CSS: logical corner radii (`border-start-start-radius` and the others) | hard | 89 | 66 | 15 |
| CSS: `:focus-visible` (a rule with an unknown selector is dropped, so the focus ring is lost) | hard | 86 | 85 | 15.4 |
| CSS: `appearance` without a prefix | hard for native-looking inputs | 84 | 80 | 15.4 |
| CSS: `outline` that follows `border-radius`; `color-scheme` | soft: the page works, the look degrades | 94 | 88 (`color-scheme` 96) | 16.4 |
| Svelte 5 runtime: `??=` and `\|\|=` (syntax; 21 and 4 files of its runtime) | hard, unless the consumer's bundler transpiles it | 85 | 79 | 14 |
| Svelte 5 runtime: `structuredClone`, only inside `$state.snapshot` | only for that call | 98 | 94 | 15.4 |
| `ResizeObserver` (already used by `InputTextArea`, guarded by a `typeof` check) | not above the rest | 64 | 69 | 13.1 |
| **Floor of the library today** | | **89** | **85** | **15.4** |
| D: Popover API | hard | 114 | 125 | 17 |
| A: CSS anchor positioning | hard | 125 (129) | 147 | 26 |

So the library already runs from Chrome 89, Firefox 85 and Safari 15.4. B and C keep that floor; D raises it
to 114, 125 and 17; A to 125, 147 and 26. The Svelte runtime row was measured by searching its source for
the names, not by running it; a consumer's bundler may change it.

## Contract (approach B; final after the consumers' specifications)

The approach is chosen. The exact shape is still checked against Select, Tooltip and Dropdown before the
primitive is built. A component `Popup.svelte` plus two helpers:

| Item | Svelte type | Default | Contract |
|---|---|---|---|
| `open` | `boolean` (`$bindable`) | `false` | R7. |
| `anchor` | `HTMLElement \| {x: number; y: number} \| null` | `null` | R4. `null` renders nothing. |
| `placement` | the 12 values | `'top'` | R1; mirrors in RTL (R15). |
| `autoAdjustOverflow` | `boolean` | `true` | R2. |
| `matchWidth` | `boolean \| number` | `false` | R5; a minimum width. |
| `arrow` | `boolean \| {pointAtCenter: boolean}` | `false` | R6. |
| `offset` | `number` | the arrow's reserve | Gap between anchor and panel, in px. |
| `container` | `HTMLElement \| ((anchor: HTMLElement \| null) => HTMLElement)` | `document.body` | R10. The panel is moved there when it is first shown; never on the server. A Select inside another popup passes the parent of its field. React and Vue take only the function form; the element form is wider and costs nothing. |
| `zIndex` | `number` | from the layer token | R10. Overrides the token. |
| `layer` | `'popover' \| 'dropdown' \| 'tooltip'` | `'dropdown'` | R10. Chooses the layer token: `--ads-popover-z-index` 1030, `--ads-dropdown-z-index` 1050 (Select), `--ads-tooltip-z-index` 1070. Added by the implementation: a number prop cannot name a token. |
| `preventBlur` | `boolean` | `false` | R12. A press inside the panel does not take focus from the anchor (a field-anchored popup). Inputs, textareas, selects and editable content inside the panel still take it. Select passes `true`. |
| `onplacement` | `(placement: PopupPlacement) => void` | — | Called with the placement actually used (physical names, after RTL mirroring and flipping) when it changes. The same value is on the frame as `data-placement`, and the side as `data-side`. Asked for by the Select specification. |
| `panel` | `HTMLElement \| null` (`$bindable`, read it with `bind:panel`) | `null` | The positioned element, for the trigger helper's hover bridge. |
| `onopenchange` | `(open: boolean, info: {source: 'trigger' \| 'content' \| 'dismiss'}) => void` | — | R7, R9. |
| `dismiss` | `{outsidePress?: boolean; escape?: boolean}` | both `true` | R9; Select turns the field blur on itself. |
| `destroyOnHidden` | `boolean` | `false` | R11. |
| `id` | `string` | generated | R14. |
| `class`, `style`, `children` | — | — | The panel frame and its content snippet. |

Helper 1, `popupTriggers` (an attachment for the anchor element): `trigger` list, delays, hover bridge,
`contextMenu` position (R8, R4). Helper 2, a layer registry for nesting (R13): it knows which popups are
open, which one is the topmost (Escape closes that one first), and which popup a press belongs to.

Layer tokens, ordered as the Ant Design token table orders them (checked in the React docs on
2026-11-11): `--ads-popover-z-index` 1030, `--ads-dropdown-z-index` 1050 (Dropdown, Select and the
field-anchored family), `--ads-tooltip-z-index` 1070. Popups with equal z-index stack in the order of
opening, because each panel is appended to its container when it is shown.

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular):** R1 to R14 and R16; `autoAdjustOverflow`; `matchWidth`;
  `arrow` as `boolean | {pointAtCenter}`; `destroyOnHidden`; `container` (React and Vue
  `getPopupContainer`; Angular does not document it, but B needs it); the three layer tokens.
- **Дешёвые React-дополнения (≤ 1 день):** `zIndex` (React Tooltip; a few lines over the layer token);
  R15, RTL mirroring (ours; the other components already mirror); the point anchor (React `alignPoint`
  and the Dropdown context menu, Angular has it too, Vue lists only the trigger: on the border, so it is
  decision 4). Estimate: about a day for the three together, under B. `ConfigProvider tooltip.unique`
  (one Tooltip at a time) is not cheap and not needed by the other 13 components, so it stays out of the
  primitive and is decided in the Tooltip specification.
- **Зарезервировано на v1.1:** a public export of the primitive (additive, decision 5).
- **Не берём (React and Vue, не подходит для Svelte):** `align` (an options object of the external
  alignment library, dom-align, behind both implementations; our placement model is R1 and R2 instead,
  and exposing another library's option object would tie our API to it).
- **Не берём (React-only, не подходит для Svelte):** `forceAlign`, and Angular `updatePosition()`: R3
  makes a manual realign unnecessary; `fresh`: it exists because React does not update the content of a
  closed popup, while mounted Svelte content stays reactive, so there is nothing to refresh.
- **Не берём (deprecated names, new library):** `destroyTooltipOnHide`, `destroyPopupOnHide`,
  `onDropdownVisibleChange` and the other names that React 6.7.0 marks deprecated.
- **Не берём (Angular-only):** `Array<string>` placement (see value forms); `nzBackdrop` (a backdrop is
  not part of a popup).
- **Не берём (Vue-only):** `arrowPointAtCenter` (the older boolean next to `arrow`: React's
  `arrow: {pointAtCenter}` covers it); the lower-case `contextmenu` spelling; the Vue Dropdown rule that
  `openChange` is silent after an item click (React reports it with `source: 'menu'`, which is the
  reference); `overlayInnerStyle`, `overlayClassName`, `overlayStyle` (Vue and Angular names for what the
  React `classNames`/`styles` do: decided per component, see the Switch precedent); `Dropdown.Button`
  (a component of its own, later).
## Решения для владельца (all taken on 2026-11-11)

1. **Approach: B, taken 2026-11-11.** Own positioning and a portal: the technique of all three Ant
   Design libraries (see "How the three libraries build it"), with the browser floor of decision 2. C and
   D were weighed and not chosen (see "Approaches"); A was out by decision 2. The maintainer asked to look
   at how Ant Design does it first, and chose after the floor was measured.
2. **Browser floor: taken 2026-11-11: the library's own floor, Chrome 89, Firefox 85, Safari 15.4** (see
   "Measured floor"). The maintainer first chose "wider" between two offered levels (Chrome 125, Firefox
   147, Safari 26, or Chrome 114, Firefox 125, Safari 17), then confirmed the library's own floor, which B
   keeps. The project stated no floor before (the README and the site name no browsers; checked
   2026-11-11), so it goes into the README and the site when the first component on the primitive is
   released.
3. **Vue column: taken 2026-11-11.** Standing permission to read the Vue API from the documentation
   markdown on GitHub (docs text only, never component code), without asking each time. Done for
   Tooltip, Dropdown and Select; Popover (1 KB) was downloaded but not needed.
4. **Borderline scope items:** the point anchor for the context menu (only Dropdown needs it; React and
   Angular document it, Vue lists only the trigger) and RTL mirroring (ours). Proposed: both in v1.0,
   both cheap under B. (`fresh` was on this list and is dropped: it has no meaning in Svelte, see Scope.)
   **TAKEN, as proposed.**
5. **Internal or exported.** Proposed: internal in v1.0, not exported; exporting later is additive
   (CLAUDE.md section 5a), changing a name after export is not. **TAKEN, as proposed.**

## Consequences of B for other components

- **Modal and Drawer.** A panel in `body` is hidden behind a `<dialog>` opened with `showModal()`, because
  that dialog sits in the browser's top layer, above every z-index. So the Modal specification must **not**
  use the native modal dialog for its layer, or must pass a `container` to the popups opened inside it.
  Modal's own layer stays below the three popup layers.
- **Scoped theme tokens.** A panel in `body` sees only the tokens set on `:root` or `body`. A consumer that
  sets tokens on a subtree passes `container` inside it. This is the remedy the Ant Design Select docs
  give for the same situation (`getPopupContainer`); it goes into the site's text for popup components.
- **Select, Cascader, TreeSelect and the like** pass the parent of their field as `container` when they
  are placed inside another popup (R10), as the React and Vue Select docs advise.

## Implementation notes (2026-11-11)

Files: `src/lib/internal/popup/` has `types.ts`, `placement.ts` (the pure placement math), `layers.ts` (the
registry), `triggers.ts` (the trigger helper) and `Popup.svelte`. Tokens `--ads-popover-z-index`,
`--ads-dropdown-z-index`, `--ads-tooltip-z-index` and `--ads-popup-arrow-size` are in `tokens.css`. Tests:
150 unit tests in four files (`tests/popupPlacement.test.ts`, `popupLayers.test.ts`, `popupTriggers.test.ts`,
`Popup.test.ts`, with the harnesses in `tests/fixtures/`) at 100% of branches, and 48 browser tests in
`e2e/popup.spec.ts` against the lab `e2e/fixtures/PopupLab.svelte` (open at `/#popup`).

**Browsers.** The 48 browser tests pass in Chromium, Firefox 159 and WebKit 27.2 (the builds of Playwright
1.65), run with the Firefox and WebKit projects of Playwright added to the configuration. The maintainer decided
on 2026-11-11 that every browser test runs in all three engines; the Playwright configuration and CI for that
are a separate change and are not part of the commits of the primitive. These are the newest engines: the floor
versions (Firefox 85, Safari 15.4, Chrome 89) have **not** been run. The first run in WebKit failed one
test, and the fault was the test: it clicked a point that, in WebKit, the wider "Open inner" button made the
inner panel cover.

What the implementation settled, and what it changed in this document:

- **Following the layout (R3).** Listeners for `resize` of the window, `scroll` in the capture phase of the
  document (it hears every scroll parent, although `scroll` does not bubble), `resize` and `scroll` of
  `visualViewport` when it exists, a `ResizeObserver` on the panel and on an element anchor when it exists,
  and a per-frame check of the anchor's rectangle. All of them ask for one placement per frame. **The
  per-frame check was added after a browser test showed a gap:** an anchor moved by a layout change with no
  event (nothing scrolled, resized or changed its size) left the panel behind. The React documentation
  names this as a limit of its popup ("call `forceAlign`").
- **A leak found by a test, fixed.** Svelte removes only the range of nodes it knows, and the panel had
  been moved out of it, so it stayed in the container after the component was destroyed. The panel now
  removes itself.
- **A border on the frame** shifted the arrow by its width (the arrow is positioned against the padding
  box). The placement now takes the border off, so the arrow still points at the anchor and sits on the
  outer edge of the frame. Found by a browser test with a bordered frame.
- **No flash at the origin.** The panel is `visibility: hidden` until it has been placed once
  (`data-positioned`); a browser test samples every frame.
- **Outside press** is `pointerdown` in the capture phase of the document. A press on the anchor is not
  outside, so a click trigger does not close the popup and open it again. A press in a popup opened from
  inside another one belongs to both.
- **Escape** is one `keydown` listener on the document. It closes the topmost popup only, cancels the key
  when it closed something, and ignores a key that was already handled and an IME composition.
- **Shift along the edge and the arrow after a flip or a shift** are in the pure placement function. The
  anchor's direction (its computed style) decides the RTL mirroring.
- **Motion.** The panel plays an enter and a leave animation and hides when the leave one ends (or after one
  second if it never ends); with `prefers-reduced-motion` there is none and it hides at once.

Still open or not handled:

- The mobile virtual keyboard: `visualViewport` is listened to, but the flip uses the layout viewport
  (`documentElement.clientWidth` and `clientHeight`). Whether it should use the visual viewport on Safari
  15.4 and later is not decided and was not tried on a device.
- ~~A `container` with a CSS `transform`, `filter` or `contain` becomes the containing block of the
  `position: fixed` panel, so the coordinates would be off.~~ Handled since 0.5.1 (decision 13): the panel
  measures where its own containing block starts, so any container works.
- Firefox and WebKit, as above.

## Following the page scroll (decision 13, 2026-11-12)

**The problem.** With the panel `position: fixed` and the placement redone in JS after each `scroll` event,
the field moves with the page at once and the panel only one frame later. The maintainer saw it as a list
that jerks while the page scrolls under an open Select.

**Measured** (2026-11-12, Chromium 158, a scroll gesture driven through the DevTools protocol, so the
compositor scrolls as it does under a trackpad; every composited frame was recorded and the painted gap
between a blue "field" and a red "panel" was read from the pixels; the gap at rest is 9 px):

| Method | Frames with both visible | Frames whose gap was not 9 px | Worst error |
|---|---|---|---|
| `position: fixed`, JS placement after `scroll` (0.5.0) | 40 | 37 | 5 px |
| `position: absolute` in page coordinates | 40 | 0 | 0 px |
| CSS anchor positioning, no JS | 40 | 0 | 0 px |

The same kind of check on the public demos of the three libraries (geometry at each `scroll` event, 14
wheel steps of 50 px): the React and Vue panels were 0 px from where they belong at every event; the
Angular panel (CDK overlay, fixed container, reposition on scroll) was 50 px behind at every event and caught
up two frames later, exactly like 0.5.0. This reading of the geometry at the event is not a painted frame
(it also shows an error for CSS anchor positioning, which the compositor corrects), so only the recorded
frames above are used as proof.

**How the others do it** (public documentation and, once, source: the maintainer allowed a one-time look on
2026-11-12 for this question only; nothing was copied, the ideas are stated here in words).
React and Vue place the panel `position: absolute` in a wrapper in `body`, with coordinates that include the
scroll of the page, so a page scroll moves it for free; they re-align on `scroll` of the window and of every
scrolling ancestor of the anchor, and on resize. Angular's overlay container is fixed over the window and its
`reposition` scroll strategy re-applies the position on every scroll event, which its documentation says
costs scrolling performance.

**Decision (maintainer, 2026-11-12): do A and B, defer D.**

- **A. Same space as the anchor.** The panel is `position: absolute` and is placed with the offset between the
  anchor and where its own containing block starts. That offset is measured, not assumed: the rectangle of
  the panel minus the translation applied last. So it holds for a `body` that is positioned or has a margin,
  and for a `container` with a `transform`, `filter` or `contain` (the old note in "Still open").
- **The exception.** An anchor that does not move with the page (a point anchor, or an element inside a
  `position: fixed` ancestor) gets a `position: fixed` panel (`data-fixed`), so the panel stays with it.
- **B. Cheaper placement.** The panel stays at `left: 0; top: 0` and is moved with `transform: translate()`,
  so measuring its natural size needs no write and no forced layout; nothing is written when the placement did
  not change (a change below 0.01 px is noise); the translation is rounded to a device pixel, where a layout
  would have snapped `left` and `top` (a fractional transform blurs text). The panel is `width: max-content`
  with a `max-width` of the viewport, which is what shrink-to-fit gave a fixed panel, so a narrow positioned
  `container` does not make it wrap.
- **What it does not fix.** An anchor inside a scrolling element (or inside a fixed one that scrolls, such as a
  modal wrapper) is still followed by JS after each `scroll`, one frame behind. The same is true of the React
  and Vue popups.
- **D reserved for v1.1+ (CSS anchor positioning).** It would remove that last lag and the per-frame
  rectangle check, as an additive enhancement behind a feature test, with the JS placement staying the
  baseline. Not taken now: it needs two code paths to test in every engine, and `onplacement`, the arrow after
  a flip and the size limits are known only to the JS. Support is real in the engines of 2026 (Chrome 158,
  Firefox 159 and WebKit 27.2 all answer `CSS.supports` for it) but absent at the library's floor.
- **C (close on scroll) is not taken:** none of the three libraries does it by default.

**Source consulted** (the section the project rules ask for when the source of Ant Design was read).
Date 2026-11-12; question: how the popups of the three libraries follow the scroll of the page; allowed by the
maintainer for this question only. The technique, a panel in page coordinates, was already visible in the black-box
measurement of the public demos (a `position: absolute` panel in a wrapper in `body`) before any source was opened.
Read, by the main session (there was no separate reader), and deleted afterwards: the scroll watcher and the
collection of scrolling ancestors in the React trigger package, the key lines of its alignment hook, and the
reposition scroll strategy and the exact-position part of the connected position strategy of the Angular CDK.
Confirmed: React and Vue listen to the scroll of the window and of the scrolling ancestors of the anchor and align
again; Angular applies the position again on every scroll event. Different in ours: a `transform` with a measured
origin, no write below 0.01 px, rounding to a device pixel, a fixed panel for fixed anchors and points, and a
`max-width`. Nothing was copied.

**Select, found while checking this.** The list had `overscroll-behavior: contain` always, so with the cursor
over an open list that does not scroll the wheel did not move the page in Chromium and WebKit (Firefox did).
The property is now applied only while the list really scrolls (`data-scrollable`, measured after each
change of the options and once more in the next frame). Behavior of a list that scrolls is unchanged.

## Страница на сайте

None: the primitive is internal. Each component built on it documents its popup props on its own page.

## Список тестов (planned)

Each item is at least one test; the test name is the item. Unit tests in jsdom where possible, the rest
in Playwright (`e2e/popup.spec.ts`).

- R1: every one of the 12 placements puts the panel on the right side and edge of the anchor (e2e).
- R2: flips at the edge on each axis; shifts along the edge for an unaligned placement; an aligned one
  only flips; `autoAdjustOverflow={false}` neither flips nor shifts (e2e).
- R3: stays attached after a page scroll, a scroll of an ancestor, a resize of the window, and a change
  of the size of the anchor and of the panel (e2e).
- R3 (decision 13): at every `scroll` event of the page the panel is where it belongs, with no repositioning
  step in between (e2e, three engines; it fails with a fixed panel); a fixed anchor and a point anchor keep a
  fixed panel; a `container` that is positioned, or has a `transform`, still gets a panel next to the anchor;
  nothing is written when the placement did not change; a change below 0.01 px is not written.
- R4: element anchor, point anchor, `null` anchor renders nothing.
- R5: `matchWidth` `true`, a number smaller and larger than the anchor, `false`; the width is a minimum.
- R6: arrow points at the anchor on every placement, after a flip, with `pointAtCenter`.
- R7: `open` controls; `onopenchange` is called once per change with the right `source`; no call for a
  change made by the parent.
- R8: each trigger and combinations; delays; the pointer crosses the gap to the panel; empty trigger list.
- R9: outside press, Escape, field blur close; a press inside does not; a press inside a nested popup
  does not close the outer one.
- R10: not clipped by `overflow: hidden`; above the page content; `container` as an element and as a
  function (the panel is inside it); `zIndex` overrides the token; the three layer tokens keep their
  order; popups of equal z-index stack in the order of opening; nothing is moved on the server.
- R11: enter and leave animation runs; none under `prefers-reduced-motion`; closed content stays
  mounted, and `destroyOnHidden` removes it.
- R12: opening does not move focus; a press inside the panel does not blur a field-anchored popup.
- R13: Escape from the inside closes the inner popup first; the layer registry reports the topmost popup
  and forgets a popup that closed or was destroyed.
- R14: the `id` is stable and reaches the panel; the consumer's ARIA attributes can refer to it.
- R15: placements mirror with `dir="rtl"` (e2e).
- R16: renders on the server without touching the DOM.
- Layout: opening and closing does not move the anchor or its neighbors (e2e, anchors of different
  widths).
- Axe: a popup with a labelled panel in open and closed state.
- Mutation testing: `npm run test:mutation` for the primitive's source file once it exists.

## Решения и обоснование

- The primitive is written once, before Select, because the same code would otherwise be copied into 14
  places and rewritten when Tooltip and Dropdown start. Table also needs Select (through Pagination), so
  Select comes before Table.
- **Why B** (2026-11-11): it is the technique all three Ant Design libraries use, it keeps the whole
  library on one browser floor (Chrome 89, Firefox 85, Safari 15.4) where D would raise it to Chrome 114,
  Firefox 125, Safari 17, and it adds no dependency. The price is accepted: the most code of the four
  (measuring, portal, layer registry), the Modal constraint and the scoped-token note above, and tests
  that need a real browser for geometry, in all three engines (see "Implementation notes").
- **Decision 13** (2026-11-12): the panel follows the page scroll without a repositioning step (A and B above);
  CSS anchor positioning is deferred to v1.1+ by the maintainer, who also allowed a one-time reading of the
  Ant Design source for this question; on 2026-11-13 the project rules turned it into a standing permission to
  study single mechanisms, on conditions (the decision first, nothing copied, a record in the specification).
- All code is independently authored for Svelte. Ant Design implementation source was not used for the
  requirements and the primitive's design; it was read once afterwards for one question (see "Source consulted"
  under decision 13). No code and no documentation text is copied: the requirements above are paraphrased from the public API tables and
  notes. API inspired by Ant Design (MIT); the implementation is original for Svelte.
