# Tooltip specification

Status: **agreed, workflow stage 2 is done** (2026-11-13). Decisions 1 to 4 and 3b were put to the maintainer one by
one, and P1 to P9 were accepted in one answer (see "Решения для владельца"). Implemented and tested on 2026-11-13 (see "Implementation notes"); the page of the documentation site is written. The component sits on
the internal popup primitive ([popup.md](popup.md), released in 0.5.0); everything the primitive already does
(placement, flip, shift, arrow, follow scroll, layers, Escape, outside press, motion, RTL) is not repeated here.

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The
comparison uses documentation, changelogs, the issue trackers, package manifests and black-box observation of the
public demos (CLAUDE.md sections 2, 4a and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/tooltip> | 6.7.0 (site navigation), 2026-11-13 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/tooltip/en> | 22.2.0 (site header), 2026-11-13 |
| Ant Design Vue | `components/tooltip/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-13; npm release 4.2.6 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-13 |
| Issue trackers | React 49891, 57333; NG-ZORRO PR 9881 (read through the GitHub API, code removed from comments) | 2026-11-13 |
| Black-box | the public demos of the three libraries, Chromium 158 under Playwright, 2026-11-13 (results below) | |

## What it is

A **Tooltip** is a short text tip for an element: the explanation of a button, an icon or a piece of text. It opens
on hover (and, here, on keyboard focus), closes when the pointer or the focus leaves, and never takes focus. It is
**not** a Popover (title, rich content, links and buttons inside) and not a Popconfirm; those are separate
components built on the same primitive. All three Ant Design documentations say the same: no complex text, no
operations inside.

## Parts and elements

Proposed DOM under decision 1, option D (the wrapper). The panel is created on the first opening and moved to the
`container` (`document.body` by default) by the primitive.

```
<span class="ads-tooltip-trigger" style="display: contents">       wrapper: no box of its own
  {children}                                                       the trigger: one element
</span>
<!-- later, in the container, only after the first opening -->
<div class="ads-popup ads-popup-tooltip">                          root: the positioned element
  <div class="ads-popup-frame ads-tooltip" role="tooltip" id="…">  container: the visible box
    {title}
    <div class="ads-popup-arrow"><span></span></div>              arrow
  </div>
</div>
```

The three parts are the semantic parts of `classNames` and `styles`: `root`, `container`, `arrow` (the same three as
the React "Semantic DOM" section, which lists exactly these).

## API

Names follow React (the reference, CLAUDE.md section 5a). The Svelte type is in the second column.

| Prop | Svelte type | Default | Notes |
|---|---|---|---|
| `title` | `string \| number \| Snippet` | — | The text or the content. Empty (`undefined`, `null`, `''`) means no tooltip: it never opens, even when `open` is `true` (React documents this as the way to disable a Tooltip). `0` is shown. See P1. |
| `children` | `Snippet` | — | The trigger: **one element**. Decision 1. |
| `open` | `boolean` (`$bindable`) | `false` | `bind:open` for controlled use; a plain `open={x}` is the initial value (the Switch and Select rule; no `defaultOpen`). See P3. |
| `onopenchange` | `(open: boolean) => void` | — | Called once per change caused by the user (trigger, Escape, outside press), not for a change made by the parent. Same name and meaning as in Select. |
| `placement` | the 12 placements of the primitive | `'top'` | Mirrors in right-to-left layouts, flips at the screen edge. |
| `trigger` | `'hover' \| 'focus' \| 'click' \| 'contextMenu'`, or an array of them | `['hover', 'focus']` | Decision 2 (React: `'hover'`). An empty array means controlled only (Angular `null`). React spelling `contextMenu`. |
| `mouseEnterDelay` | `number` (seconds) | `0.1` | React and Vue default. Angular: 0.15. |
| `mouseLeaveDelay` | `number` (seconds) | `0.1` | The pointer may cross the gap to the panel and stay in it (see Behavior). |
| `arrow` | `boolean \| { pointAtCenter: boolean }` | `true` | React and Vue default to `true`. |
| `autoAdjustOverflow` | `boolean` | `true` | Flip, and shift along the edge for an unaligned placement. |
| `color` | `string` | — | One of the 13 preset names (`pink`, `red`, `yellow`, `orange`, `cyan`, `green`, `blue`, `purple`, `geekblue`, `magenta`, `volcano`, `gold`, `lime`) or any CSS color for the background. A name from the list is a preset, as in React; for the CSS color of the same name write `#0000ff` or `rgb()`. The text color follows (decision 3b). |
| `zIndex` | `number` | the tooltip layer, 1070 | Overrides `--ads-tooltip-z-index`. |
| `container` | `HTMLElement \| ((anchor: HTMLElement \| null) => HTMLElement)` | `document.body` | React and Vue `getPopupContainer`; the element form is wider and costs nothing (same as Select). |
| `destroyOnHidden` | `boolean` | `false` | Removes the content on every close. React 5.25.0; Vue `destroyTooltipOnHide`. |
| `classNames` | `{ root?, container?, arrow? }` of strings | — | See P2. |
| `styles` | `{ root?, container?, arrow? }` of style objects | — | See P2. Objects only (the Switch precedent: a Svelte consumer computes the object). |
| `anchor` | `HTMLElement \| null` | — | The element the panel is placed next to, instead of the first element of `children` (Angular `nzTooltipOrigin`). Only with decision 1, option D. |

Methods: none. `open` is the show and hide of Angular `show()` and `hide()`; `updatePosition()` is unnecessary (the
primitive follows the layout by itself, R3 of the popup specification).

## Behavior

- **Opens** on the triggers in `trigger`. Hover opens after `mouseEnterDelay` and closes after `mouseLeaveDelay`; a
  pass over the element shorter than the delay opens nothing (the timer is cancelled). Focus opens and blur closes
  at once. `click` toggles. `contextMenu` opens at the element (ours: the pointer position is not used, React's `alignPoint` is not
  taken) and suppresses the browser menu.
- **Hoverable.** The pointer can go from the element into the panel, and the panel stays open while it is there
  (all three libraries do this; measured below; WCAG 1.4.13). The hover bridge of the primitive does it.
- **Dismissable.** Escape closes it while focus or the pointer is on the element or in the panel (WCAG 1.4.13). React
  has done this by default since 6.2.0 (changelog #56492); Angular closes it too; Vue does not (measured). A press
  outside closes a tooltip opened by click. A press on the trigger does not close a hover tooltip.
- **Never takes focus** and is not in the Tab order. Moving focus into the panel is not a case: it has no focusable
  content (`title` is text; interactive content is a Popover).
- **Empty title:** nothing is rendered and no `aria-describedby` is set; the trigger works as if there were no tooltip.
- **Content changes while open:** the panel resizes and is placed again (the primitive watches its size).
- **Long text** wraps at the token `max-width` (250 px); a word longer than that breaks.
- **The trigger changes while open** (the first element is replaced or removed): the anchor follows; if no element is
  left, the panel closes.
- **Nesting:** a tooltip on an element inside a Select panel, a Modal or another popup works; a press in the tooltip
  panel is "inside" for the layer registry.
- **Layout:** opening and closing never changes the size or position of the trigger or its neighbors (the panel is out
  of flow, the wrapper has no box).
- **Server rendering:** the wrapper and the children render; no panel, no DOM access.
- **Motion:** the primitive's enter and leave animation; none under `prefers-reduced-motion`. React fixed text
  shifting after the opening motion (#59729), so a test measures the text position at the end of the animation and a
  frame later.
- **Disabled child.** A native `disabled` button swallowed mouse events in browsers of the past, and the Vue changelog
  lists "Tooltip not displaying in Switch in loading state". Measured on 2026-11-13: a `display: contents` wrapper
  receives `mouseenter` and `mouseleave` from a `disabled` button, an `aria-disabled` button and a checkbox label in
  Chromium 158, Firefox 159 and WebKit 27.2, **and the tip opens on hover over a disabled button at the browser floor
  too** (Chromium 90.0.4392.0, Firefox 85.0b5, WebKit 15.4, `npm run test:floor`). So the library adds no special
  wrapper (P8). Not checked: a real Safari. The page keeps one sentence for a control that swallows pointer events
  by itself: a `<span>` around it.

## A11y

The pattern is the tooltip of WAI-ARIA Authoring Practices plus WCAG 1.4.13 (content on hover or focus: dismissable,
hoverable, persistent). None of the three Ant Design pages describes keyboard use or ARIA for Tooltip, so the
contract is ours, checked against what the demos do (measured below) and against the public record.

- **Role and wiring.** The visible box has `role="tooltip"` and an `id`. While the panel is shown, the trigger has
  `aria-describedby` with that id (merged with a value the consumer already set, and restored when it closes: React
  fixed this in 6.6.2, #59139). **The trigger is the first element, or the first focusable element inside it when the
  first element itself cannot take focus** (the `<label>` of a `Checkbox`, the box of a `Select`): a screen reader reads
  the description of the element that has focus, so on the label it would be lost. A trigger with nothing to focus (a
  `<span>`, a disabled button) gets the attribute itself. The attribute is **absent while the panel does not exist**: the reporter of React issue 49891
  got a scanner error for an `aria-describedby` whose id was not on the page when the tooltip was closed (Form item
  tooltip icon).
- **Keyboard.** With `focus` in `trigger` (decision 2), Tab to the element shows the tip, Tab away hides it, Escape
  hides it and focus stays. React issue 49891 (closed) is the public record of what happens without it: "moving
  keyboard focus to the trigger does not display the tooltip". The React FAQ tells developers to add `focus` to
  `trigger` themselves.
- **The trigger must be focusable for the keyboard to work.** The Tooltip does not make an element focusable. A
  non-interactive trigger (a `<span>`) is reachable by hover only; the page says so and shows `tabindex="0"` with
  a role where the information matters. (React issue 49891 asks the same.)
- **Name versus description.** A tooltip describes; it does not name. An icon-only button needs `aria-label`; the page
  says so. Because the tooltip text may be the only label, the Screen reader row of the matrix stays open until a
  real screen reader has been tried (see "Quality matrix plan").
- **Contrast.** The default box (white text on 85% black) is 15.1:1 on a white page; in the dark theme the box is
  `#424242` with white text, 10.0:1. Presets and custom colors get the text color of decision 3b, which reaches
  4.5:1 on any background. The checks run on `tokens-accessible.css` and the dark theme (CLAUDE.md section 7).
- **Forced colors:** the box has a border in `forced-colors: active`, and the arrow is drawn with the system colors, so
  the box does not melt into the page (a filled box with no border vanishes when backgrounds are replaced).
- **Touch:** decision 4.

## Colors, tokens and sizes

Measured on the React 6.7.0 demo on 2026-11-13 (Chromium 158). Light theme: background `rgba(0, 0, 0, 0.85)` (ours: `#262626`, see "A gap between the arrow and the box"), text
`#fff`, radius 6 px, padding 6 px 8 px, minimum height 32 px, font 14 px with line height 22 px, maximum width 250 px,
z-index 1070. Dark theme: background `#424242`, text white, page `#141414`. The page of tokens lists the same
`maxWidth` 250 and `zIndexPopup` 1070.

New tokens in `tokens.css` (light and dark where it differs): `--ads-tooltip-bg`, `--ads-tooltip-color`,
`--ads-tooltip-radius`, `--ads-tooltip-padding`, `--ads-tooltip-min-height`, `--ads-tooltip-max-width`. Existing:
`--ads-tooltip-z-index`. The arrow takes the background through the primitive's
`--ads-popup-arrow-bg`, so a custom `color` colors the arrow too. React 6.x fixed an arrow shadow darker than the
container (#57988) and a corner radius above 8 px on the left and right placements (#59568): the tests compare the
arrow with the box and cap the radius.

**The 13 presets** (decision 3, taken: now). Backgrounds measured on the React 6.7.0 demo, 2026-11-13, Chromium 158,
light and dark theme. React draws white text on all of them (all 13 measured). The last two columns are the white
contrast, and the text color decision 3b proposes with its contrast ("W" white, "B" black).

| Preset | Light bg | White on light | Proposed text, light | Dark bg | White on dark | Proposed text, dark |
|---|---|---|---|---|---|---|
| pink | `#eb2f96` | 3.90 | B 5.38 | `#cb2b83` | 4.99 | W 4.99 |
| red | `#f5222d` | 4.08 | B 5.15 | `#d32029` | 5.24 | W 5.24 |
| yellow | `#fadb14` | 1.38 | B 15.21 | `#d8bd14` | 1.87 | B 11.21 |
| orange | `#fa8c16` | 2.38 | B 8.83 | `#d87a16` | 3.13 | B 6.72 |
| cyan | `#13c2c2` | 2.21 | B 9.52 | `#13a8a8` | 2.92 | B 7.19 |
| green | `#52c41a` | 2.27 | B 9.27 | `#49aa19` | 2.98 | B 7.05 |
| blue | `#1677ff` | 4.10 | B 5.12 | `#1668dc` | 5.19 | W 5.19 |
| purple | `#722ed1` | 6.94 | W 6.94 | `#642ab5` | 8.27 | W 8.27 |
| geekblue | `#2f54eb` | 5.85 | W 5.85 | `#2b4acb` | 7.13 | W 7.13 |
| magenta | `#eb2f96` | 3.90 | B 5.38 | `#cb2b83` | 4.99 | W 4.99 |
| volcano | `#fa541c` | 3.31 | B 6.35 | `#d84a1b` | 4.27 | B 4.92 |
| gold | `#faad14` | 1.90 | B 11.05 | `#d89614` | 2.53 | B 8.29 |
| lime | `#a0d911` | 1.69 | B 12.43 | `#8bbb11` | 2.28 | B 9.21 |

So white text, as Ant Design draws it, reaches 4.5:1 on 2 of the 13 in the light theme and on 6 of the 13 in the dark
theme. `magenta` is the same color as `pink` in both themes. The values are design data read from a public page; the
backgrounds are kept, only the text color is in question. Tokens: `--ads-tooltip-preset-<name>` for the background and
`--ads-tooltip-preset-<name>-text` for the text, in the light and the dark set (26 and 26 values); a consumer can
override them. They are static: the text of a preset needs no script.

## Scope v1.0 (CLAUDE.md section 5a)

- **Ядро (React ∩ Vue, same semantics):** `title`, `open` and its change callback, `placement`, `trigger`,
  `mouseEnterDelay`, `mouseLeaveDelay`, `arrow` with `pointAtCenter`, `autoAdjustOverflow`, `color` (CSS color),
  `container`, `destroyOnHidden`. Angular lacks `autoAdjustOverflow`, `container`, `destroyOnHidden` and the arrow toggle.
- **Дешёвые React-дополнения (≤ 1 день):**
  - `zIndex`: a few lines over the layer token.
  - `classNames` and `styles` for `root`, `container`, `arrow` (React 5.23.0): about half a day, because the primitive
    must accept classes and styles for the root and the arrow (it takes them for the frame only). P2.
  - Automatic text color for a custom `color` (React 5.27.0): about half a day with the contrast rule. Decision 3b.
- **Expensive items taken now by the maintainer (decision 3, 2026-11-13):** the 13 preset colors of `color`. CLAUDE.md
  section 5a lists palettes under v1.1; the maintainer chose to take them in v1.0. React and Angular show them in their
  demos; the Vue page lists `color` as a plain string, so this is React ∩ Angular. Estimate: about one more day (26 + 26
  tokens, the text rule, a page example, tests).
- **Зарезервировано на v1.1:**
  - `ConfigProvider` settings for Tooltip (`unique`, `trigger`, `arrow`, delays, `classNames`, `styles`): there is no
    ConfigProvider component yet, so these arrive with it. `tooltip.unique` (only one tooltip at a time, with a smooth
    move between them; React 6.x) is not cheap and no other component needs it.
  - A `trigger` snippet that receives the props to spread on the trigger (decision 1, option B), additive.
- **Не берём (React-only, не подходит для Svelte):** `fresh` (it exists because React does not update the content of a
  closed popup; mounted Svelte content is reactive), `forceAlign` and the `ref` (the primitive follows the layout),
  `align` (the options object of an external library), the function form of `classNames`/`styles` (compute the
  object in `$derived`), `defaultOpen` (`$bindable`).
- **Не берём (Vue/Angular-only):** `arrowPointAtCenter` and `nzTooltipArrowPointAtCenter` (React's
  `arrow.pointAtCenter` covers them), `overlayClassName`, `overlayStyle`, `overlayInnerStyle` and the Angular
  `nzTooltipOverlay*` (React `classNames.root`, `styles.root`, `styles.container`), `nzTooltipTitleContext` (a snippet
  sees the surrounding scope), `nzTooltipOrigin` (taken as `anchor` under decision 1), `show()`, `hide()` and
  `updatePosition()` (`open`), the `Array<string>` placement of Angular (the primitive decided this), `contextmenu` in
  lower case (React spelling is the reference).

## Расхождения React / Vue / Angular

| Level | React 6.7.0 | Vue (docs, 4.2.6) | Angular 22.2.0 | Our decision |
|---|---|---|---|---|
| **Presence** | `Tooltip` | `a-tooltip` | `nz-tooltip` directive (the component API was removed in v9) | Component `Tooltip` |
| **API: content** | `title: ReactNode \| () => ReactNode` | `title: string \| slot` | `nzTooltipTitle: string \| TemplateRef` (+ context) | `string \| number \| Snippet` (P1) |
| **API: open state** | `open`, `defaultOpen`, `onOpenChange` | `open` (`v-model`), `openChange` | `nzTooltipVisible`, `nzTooltipVisibleChange`, `show()`, `hide()` | `bind:open`, `onopenchange` |
| **API: trigger** | `hover \| focus \| click \| contextMenu`, or an array; default `hover` | one of `hover \| focus \| click \| contextmenu`; default `hover` | `click \| focus \| hover \| null`; default `hover` | array or single value; default `['hover', 'focus']` (decision 2) |
| **API: delays** | 0.1 and 0.1 | 0.1 and 0.1 | 0.15 and 0.1 | 0.1 and 0.1 (React) |
| **API: arrow** | `arrow: boolean \| { pointAtCenter }`, default `true` | `arrow` (4.2.0) and the older `arrowPointAtCenter` | `nzTooltipArrowPointAtCenter` | React form, default `true` |
| **API: color** | `color`: a preset name or a CSS color | `color` (a string) | `nzTooltipColor`; the demo shows presets | presets and CSS colors (decision 3) |
| **API: target element** | the child, found by the library | the child | the host element; `nzTooltipOrigin` for another one | decision 1 |
| **Behavior: Escape** | closes (since 6.x) | does not close (measured) | closes (measured) | closes |
| **Behavior: pointer into the panel** | stays open (measured) | stays open (measured) | stays open (measured) | stays open |
| **Behavior: touch tap** | opens on the tap, closes on a tap elsewhere (measured) | no panel after a tap (measured) | no panel after a tap (measured; hover is skipped after touch since 22.1.2, 2026-10-09, #9881) | decision 4 |
| **Behavior: layout change** | does not realign unless `forceAlign` is called | not documented | body scroll only; `cdkScrollable` for other containers | the primitive follows everything |
| **a11y: role** | `role="tooltip"` on the box, with an `id` (measured) | `role="tooltip"` on the inner box, no `id` (measured) | none (measured) | `role="tooltip"` and an `id` |
| **a11y: description link** | `aria-describedby` on the trigger while open, removed on close (measured) | none (measured) | none (measured) | the same as React |
| **a11y: keyboard** | focus shows it only with `trigger` including `focus` (measured: a focused button shows nothing) | not documented | `focus` trigger exists | decision 2 |
| **Customization** | `classNames`, `styles` (root, container, arrow), objects or functions; global config | `overlayClassName`, `overlayStyle`, `overlayInnerStyle` | `nzTooltipOverlayClassName`, `nzTooltipOverlayStyle` | `classNames`, `styles` objects (P2) |
| **Customization: global** | `ConfigProvider` (`unique`, `trigger`, `arrow`, delays, semantic) | not on the Tooltip page | not on the Tooltip page | reserved for v1.1 |

## Value forms per prop (CLAUDE.md section 5, item 4)

| Prop | React | Vue | Angular | Our type | Narrowing |
|---|---|---|---|---|---|
| `title` | `ReactNode`, or a function returning one | `string`, or the `title` slot | `string`, or a `TemplateRef` (+ context object) | `string \| number \| Snippet` | A function (React) is a lazy snippet. A `number` is taken because React's `ReactNode` includes it. Context: not taken, a snippet sees its scope. Nothing narrower than React. |
| `trigger` | one value or an array | one value | one value or `null` | one value or an array; `[]` = controlled only | none (`null` is `[]`) |
| `open` | `boolean` | `boolean` (`v-model`) | `boolean` | `boolean`, `$bindable` | none |
| `arrow` | `boolean \| { pointAtCenter }` | the same, plus the older boolean | boolean (separate input) | `boolean \| { pointAtCenter }` | none |
| delays | number, seconds | number, seconds | number, seconds | number, seconds | none |
| `color` | `string`: preset name or CSS color | `string` | `string` | `string` | preset names and CSS colors (decision 3) |
| `container` | function of the trigger | function of the trigger | not documented | element, or the function | wider than the others |
| `classNames`, `styles` | object or function | — | — | object | the function form is not taken (see Scope) |
| `placement` | string union of 12 | string union of 12 | union of 12, and `Array<string>` | union of 12 | the array form: not taken (popup.md) |

## Deprecation check (rule 4a)

React 6.7.0 page and changelog, Vue docs and changelog, NG-ZORRO changelog. Names that are deprecated or renamed are
**not taken**; the current name is.

| Old name | Where | Current name | In our API |
|---|---|---|---|
| `visible`, `onVisibleChange` | React (before 4.23.0), Vue (before 4.0.0) | `open`, `onOpenChange` / `openChange` | `open`, `onopenchange` |
| `destroyTooltipOnHide` | React (the page lists both names), Vue | `destroyOnHidden` (5.25.0) | `destroyOnHidden` |
| `overlayClassName`, `overlayStyle`, `overlayInnerStyle` | React (the page says "please use `classNames.root`, `styles.root`, `styles.container`"), Vue | `classNames`, `styles` | `classNames`, `styles` |
| `arrowPointAtCenter` | Vue (the older boolean beside `arrow`, which is 4.2.0); the React page lists only `arrow`; Angular's `nzTooltipArrowPointAtCenter` is its only form and is not deprecated | `arrow: { pointAtCenter }` | `arrow` |
| `nzMouseEnterDelay`, `nzMouseLeaveDelay`, `nzOverlayClassName`, `nzOverlayStyle`, `(nzVisibleChange)` | Angular (removed in v10) | the `nzTooltip*` names | — |

Chain recorded as the reason for the final name: `visible` → `open`; `overlayClassName` → `classNames.root`;
`overlayInnerStyle` → `styles.container`.

## Public traces turned into items (rule 7a)

| Trace | What it says | Item here |
|---|---|---|
| React 49891, closed | keyboard focus did not show the tooltip; no `aria-describedby`; a maintainer says a later change in the tooltip package added the attribute and the id; a scanner flagged an `aria-describedby` whose id was not on the page | focus trigger (decision 2); `aria-describedby` only while the panel exists |
| React changelog 6.6.2, #59139 | existing `aria-describedby` relationships are preserved | tokens are merged and restored |
| React changelog 6.2.0, #56492 | Escape closes Tooltip by default | Escape closes |
| React changelog 6.x, #59701, #59699 | moving the pointer from a Checkbox or Radio to its text closed the tooltip | test: a tooltip on a `Checkbox`, pointer from the box to the text, no close (on a plain `label` with a checkbox, moving the pointer from the box to the text sends no extra `mouseleave` in the three engines: tried) |
| React changelog 6.x, #59729, #56887 | text shifted after the opening motion; the animation started shifted to the left | test: text position at the end of the animation and a frame later; `transform-origin` toward the trigger |
| React changelog 6.x, #57988, #59568 | arrow shadow darker than the box; corner radius not capped on the sides | arrow and box compared; radius capped at 8 px |
| NG-ZORRO PR 9881, released in 22.1.2 (2026-10-09) | a tap on a button with a hover tooltip ran the action and showed the tooltip; hover is now skipped after touch | decision 4 |
| NG-ZORRO 5765, open since 2020 | on a touch screen a hover tooltip stays when a modal opens | test: opening a modal-like layer closes the tooltip (outside press) |
| NG-ZORRO 5868, 6489 | the leave delay was ignored on the panel; visibility with a `null` trigger | the delay applies when leaving the panel; `[]` trigger keeps `open` as set |
| NG-ZORRO 8512 | hydration error | server rendering test |
| Vue changelog | "Tooltip not displaying in Switch in loading state" | the disabled-child item above |

## Black-box observations (2026-11-13)

Public demos, Chromium 158 under Playwright, desktop pointer unless stated. Not code: attributes, geometry and
events, as the rules allow (section 2).

| What | React 6.7.0 | Vue | Angular |
|---|---|---|---|
| Trigger attributes while closed | none | none | none (only the directive's own) |
| Trigger attributes while open | `aria-describedby` = the id of the box, class `ant-tooltip-open`; both removed on close | class `ant-tooltip-open` only | none |
| Role of the box | `role="tooltip"` and an `id` | `role="tooltip"` on the inner box, no `id` | none |
| Pointer moved into the panel | stays open | stays open | stays open |
| Escape (opened by hover) | closes, attribute removed | stays open | closes |
| Keyboard focus on a button | nothing shown, no attribute | not tested | not tested |
| Touch tap on the trigger (touch emulation) | opens; a tap elsewhere closes | no panel | no panel |

React default box (light): background `rgba(0, 0, 0, 0.85)`, text white, radius 6 px, padding 6 px 8 px, minimum
height 32 px, font 14 px/22 px, maximum width 250 px, z-index 1070. Dark: `#424242` with white text.
**Preset colors in React: the text is white on all 13, in both themes** (table in "Colors, tokens and sizes"). A
custom color gets its own text color: `#87d068` gets black, `#f50` gets white, so the choice is not always the best one
(white on `#f50` is 3.21:1, black would be 6.55:1). White text does not meet WCAG AA (4.5:1 for 14 px text) on 11 of
the 13 presets in the light theme and on 7 in the dark theme. This is the input to decision 3b.

## Requirements this puts on the popup primitive

Small and additive; the primitive is internal, so nothing is public.

- Classes and styles for the **root** and the **arrow** (it takes them for the frame only): needed by
  `classNames.root`, `classNames.arrow`, `styles.root`, `styles.arrow`.
- The frame already receives `role` and the rest attributes; the `id` is already the frame's.
- `popupTriggers`: nothing new for hover, focus, click and contextMenu. Escape and outside press are in the primitive.
- An anchor that changes while open (decision 1) is handled by the Tooltip, which passes a new `anchor`.

Estimate of the whole component under the decisions and proposals: Tooltip about 1.5 days, the presets about one more
day, primitive additions half a day, the page and its examples one day, tests alongside.

## Решения для владельца

Decisions 1 to 4 and 3b were put to the maintainer one by one and **taken on 2026-11-13**. P1 to P9 were proposals and
were **accepted in one answer** the same day ("Принять все").

1. **How the Tooltip reaches its trigger element: D, taken.** A wrapper plus an `anchor` prop. React clones its child
   and gives it handlers, the Vue and Angular versions attach to the child or to the host element; Svelte has no
   equivalent of cloning, so the shape is ours. The options that were weighed:

   | | A. Wrapper | B. Props snippet | C. Attachment only | **D. A, plus an `anchor` prop (taken)** |
   |---|---|---|---|---|
   | Usage | `<Tooltip title="x"><Button/></Tooltip>` | `<Tooltip title="x">{#snippet children(props)}<Button {...props}/>{/snippet}</Tooltip>` | `<Button {@attach tooltip({ title: 'x' })}/>` | as A; `<Tooltip anchor={el} …/>` for an element you hold |
   | Extra DOM | one `<span style="display: contents">`, no box (events reach it in the three engines: measured, including from a disabled button) | none | none | as A |
   | Works with any element child, including `Checkbox`, `Switch`, `Select` and third-party components | yes (events bubble; the anchor is the first element) | only if the component forwards the spread to the element you want; `Checkbox` forwards to the `<input>`, so hovering its text would not count | yes | yes |
   | `aria-describedby` | set on the first element by the Tooltip, merged with the consumer's value; a `MutationObserver` re-adds it if Svelte rewrites the attribute | in the spread: Svelte owns it | needs a mount outside the tree; context is lost | as A |
   | Same shape as React, Vue and Angular | yes | no (the Bits UI style) | no | yes |
   | Cost | about 1 day, with the observer | about 0.5 day, but a worse default | not recommended: `mount()` loses context and the SSR story | A plus 0.1 day |

   B is reserved for v1.1 as an additive `trigger` snippet prop. Costs of A that stay: one wrapper node, an imperative
   attribute on the trigger, and **one element child** (a text-only child is not supported; the page and a development
   warning say so).

2. **Default `trigger`: `['hover', 'focus']`, taken.** React: `hover` only; its FAQ tells you to add `focus` for the
   keyboard (public issue 49891 is about exactly this). WCAG 2.1.1 and 1.4.13 and the project rule "keyboard is
   mandatory for interactive components" say a tip that only a pointer can open is not enough. This is a deliberate
   difference from React's default; the prop, its name and its values are React's.

3. **`color` presets: taken now (v1.0), against the default of section 5a, which would have deferred palettes to
   v1.1.** The facts that were put to the maintainer: the library has no palette tokens, so the presets mean 13 colors
   in two themes; Ant Design's own presets keep white text, which does not reach AA on most of them (measured, table
   above); 11 of the 13 names are CSS color names (all but `geekblue` and `volcano`), so a later change of what `blue`
   draws would have been visible. Taking them now removes the reserved-names guard that was proposed. Cost: about one
   more day. Contract: `color?: string`; a name from the list is a preset (as in React), anything else is a CSS color.

3b. **Text color of the presets: (ii), taken.** The backgrounds are kept as measured; the question was the text.
   - **(i) As Ant Design (not taken):** white on all 13 in both themes. Reaches 4.5:1 on 2 of 13 (light) and 6 of 13 (dark). The
     light theme would need a `tokens-accessible.css` override for 11 presets, and the dark theme, which that file
     does not touch (it leaves dark alone), would fail the project's own contrast check for 7. Custom colors adapt, as
     in React (5.27.0).
   - **(ii) One rule for presets and custom colors (taken):** the text color, black or white, that contrasts more with
     the background. The background is never changed, and AA holds in light, dark and with `tokens-accessible.css`, with
     no override: for any background the better of the two reaches at least 4.58:1. On the 26 measured backgrounds this
     is the same as "white where white reaches 4.5:1, black otherwise". **Light theme:** white on `purple` and
     `geekblue`, black on the other 11. **Dark theme:** white on `pink`, `red`, `blue`, `purple`, `geekblue` and
     `magenta`, black on the other 7 (the table shows each contrast). The visible change from Ant Design is black text
     on the blue, red, pink and volcano tooltips in the light theme. Presets are static tokens; only a custom color
     needs a script (one read of its computed color).

4. **Touch: as React, taken.** A tap on the trigger shows the tip and runs the action; a tap elsewhere closes it (the
   tap rule of the popup, decision 14). Measured: React opens it on a tap and closes it on a tap elsewhere; Vue and
   Angular show nothing. Angular has skipped hover after touch since 22.1.2 (October 2026) because the tap also runs the
   button's own action; that option was weighed and not taken. With `focus` in `trigger`, a tap that focuses the
   element (Android; not iOS Safari) opens it anyway.

P1 (accepted). **`title` forms:** `string | number | Snippet` (React's `ReactNode` includes numbers; Vue and Angular take text and
a template). Empty means no tooltip. Not taken: the context object of Angular.
P2 (accepted). **`classNames` and `styles` in v1.0** for `root`, `container`, `arrow`, objects only; the primitive learns to take
classes and styles for the root and the arrow. Estimate: half a day.
P3 (accepted). **`open` is `$bindable`, plain `open={x}` is the initial value; `onopenchange(open)`; no `defaultOpen`**, the same
as Select and Switch.
P4 (accepted). **Escape closes the tooltip and the pointer may rest in the panel** (WCAG 1.4.13), as React and Angular do; Vue
does not close on Escape.
P5 (accepted). **`aria-describedby` only while the panel exists, merged with the consumer's value;** `role="tooltip"` and an `id`
on the visible box.
P6 (accepted). **`unique` and the other `ConfigProvider` settings are deferred** with the ConfigProvider component; the names are
reserved above.
P7 (accepted). **A custom `color` gets the text color of decision 3b.** The color is read once from the computed style, so any
CSS color works (`rgb()`, `hsl()`, `var(--x)`); a color the browser cannot parse leaves the default box.
P8 (accepted). **The disabled child** is measured at the floor in stage 3 and the result goes into this file (see Behavior); no
special wrapper in the library unless an engine of the floor fails. **Result (2026-11-13): no engine failed**, so there is none.
P9 (accepted). **`trigger` accepts one value or an array**, and `[]` means controlled only.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Tooltip.test.ts` and `e2e/tooltip.spec.ts`: `role="tooltip"`, `aria-describedby` on the element that has focus, Escape, hover and focus, focus never moves, the tip dismisses on blur. Checked against the tooltip pattern of the WAI-ARIA Authoring Practices (read on 2026-11-13: shown on focus and hover, Escape dismisses, the tooltip does not receive focus, focus stays on the trigger, the trigger references it with `aria-describedby`) and WCAG 1.4.13 |
| Forced colors | test | `e2e/forced-colors.spec.ts` (the Tooltip cases, three engines): the box and the arrow have a border in a system color |
| IME | n/a | a tooltip has no text input: nothing is typed into it, and an Escape during composition is the primitive's rule (`tests/Popup.test.ts`) |
| Touch | test | `e2e/tooltip.spec.ts` (emulated touch, three engines) and `e2e/tooltip-touch.chromium.spec.ts` (a real swipe through the DevTools protocol). A real touch device is **not checked**; the page and the README say so |
| Browsers | test | `npm run test:e2e` (Chromium, Firefox and WebKit) |
| Browser floor | test | `npm run test:floor`: six Tooltip checks in Chromium 90, Firefox 85 and WebKit 15.4, a disabled button included |
| Screen reader | manual pending | not checked with a real screen reader (no `screen-reader/` test for the Tooltip yet; NVDA, JAWS and VoiceOver by hand). The page and the README say "not checked" |

## Страница на сайте

`docs/src/routes/[[lang=lang]]/components/tooltip/+page.svelte`, en, ru, zh, in the standard pattern (live example,
"show code", API table). The registry entry `Tooltip` (phase `later`) becomes `now`, and its card on the overview page
gets its silhouette. Examples, one per item of the specification:

1. Basic (hover).
2. Placement: the 12 values, with the buttons in a ring (a row on top, a column on each side, a row at the bottom, the middle empty, as in the Ant Design demo), so that a tip beside a button never covers its neighbour. A site test checks the side of each tip and that it covers no button.
3. Arrow: shown, hidden, `pointAtCenter`.
4. Triggers: hover, focus, click, contextMenu, a combination; keyboard (Tab).
5. Delays.
6. Controlled `open` with `bind:open` and `onopenchange`.
7. `color`: the 13 presets in both themes, custom colors with the automatic text color, and the arrow.
8. A snippet as `title`, and a number.
9. Disabled: an empty `title`; a disabled control inside a `<span>` if the floor needs it.
10. `autoAdjustOverflow`, `zIndex`, `container`, `destroyOnHidden`.
11. `classNames` and `styles`.
12. Around components: `Button`, `Switch`, `Checkbox`, and an icon-only button with `aria-label` (the a11y note).

Honest notes on the page: not checked with a screen reader; touch not checked on a real device; a non-focusable trigger
is reachable by hover only.

## Implementation notes (2026-11-13)

Files: `src/lib/Tooltip/` (`Tooltip.svelte`, `types.ts`, `README.md`), `src/lib/internal/contrast.ts` (the text color rule),
the 52 preset tokens and the 6 size and color tokens in `tokens.css`; the primitive learned `rootClass`, `rootStyle`,
`arrowClass` and `arrowStyle` (the root style is written one property at a time, so it never wipes the placement) and an
outline for its arrow in forced colors; `popupTriggers` ignores the compatibility `mouseleave` that follows a touch.
Tests: `tests/Tooltip.test.ts` (71 cases, 100% of lines and branches of `Tooltip.svelte`), `tests/contrast.test.ts`,
the Tooltip cases of `tests/tokens.test.ts` and `tests/popupTriggers.test.ts`, `tests/docs/tooltip-page.test.ts`,
`e2e/tooltip.spec.ts` (35 cases per engine), `e2e/tooltip-touch.chromium.spec.ts`, the forced-colors cases and the six
checks of `scripts/floor/smoke.cjs`. The Tooltip is the first real user of `popupTriggers` (Select opens its list by
its own logic), which is how the touch problem below was found.

What the implementation settled, and what it changed in this document:

- **The visible box is an element of the Tooltip, inside the frame of the popup**, so the frame carries `role="tooltip"`
  and the `id`, and the box (`.ads-tooltip`) carries the background, the padding and `classNames.container`. The arrow
  takes `--ads-popup-arrow-bg: var(--ads-tooltip-bg)`, so a color or a token set on the tooltip colors both.
- **Bug found by a browser test, fixed:** the text color of a custom `color` was read from the frame, which has no
  background, so it was always white. In jsdom the test passed because the computed style had been stubbed for the frame;
  the real browser showed it. The color is now read from the box (a reference to the element, not a class lookup), and the
  jsdom stub is on the box.
- **Bug found by watching the tip after a tap, fixed:** Chromium sends `mouseenter` and at once `mouseleave` after a tap.
  The tap opened the tip (the focus did), and 100 ms later the leave closed it, so decision 4 ("a tap shows the tip until a
  tap elsewhere") did not hold, and the first version of the touch test only saw the tip for a moment. `popupTriggers`
  now ignores a `mouseleave` that comes within 800 ms of a touch `pointerdown`; a mouse or a pen press does not hold the
  tip open. A tap elsewhere still closes it through the outside-press rule of the popup (decision 14).
- **`aria-describedby` on the element that has focus** (see A11y): found by looking at the `Checkbox` case, where the
  description on the label would never be read.
- **Text color rule (3b):** the preset text is a static token (`#ffffff` or `#000000`, computed by the same rule); a custom
  color is read once from the box after the browser resolved it (`rgb()`, `hsl()` and `var(--x)` all work). Forms the
  browser writes as `oklch()` and the like are not read: the default text color stays. Not recomputed when the theme
  changes while a tip with a custom color is open.
- **`color`:** the 13 names are a preset; any other string must pass `CSS.supports('color', ...)`, otherwise the default
  box stays. Where `CSS` does not exist the custom color is left out.
- **Layout:** measured frame by frame in the three engines (a short and a wide trigger, with the animation): nothing moves
  by more than 0.01 px, and the text of the tip does not move after the opening motion.
- **Floor (2026-11-13):** Chromium 90.0.4392.0, Firefox 85.0b5 and WebKit 15.4 pass 18 of 18 checks, six of them for the
  Tooltip. No new entry in `ENHANCEMENTS`: the Tooltip adds one forced-colors rule (already an allowed enhancement).
- **Mutation testing (2026-11-13):** `npm run test:mutation -- --target=Tooltip`, 48 mutants of `Tooltip.svelte`, 48 killed
  (100%).
- **Site tests (2026-11-13):** the page passes the site checks in the three engines (54 cases: three languages, light and
  dark theme, wide, laptop and phone screens: axe, no console errors, no horizontal scroll). They found two things in the
  examples, fixed: an always-open tip portaled outside every landmark (axe `region`; the example now uses `container`),
  and a fixed-width grid that scrolled a phone sideways.
- **The arrow of the aligned placements (2026-11-13 and 2026-11-14).** The maintainer asked for the arrow of `rightTop`,
  `rightBottom`, `leftTop` and `leftBottom` to be at the top or the bottom of the tip, saw a gap between the arrow and the box at
  the corner, rejected a square corner and a "radius + 2" distance as fixes, and showed that the Ant Design Vue demo does it
  with the same sizes. The difference was the shape: a soft bump (rounded tip, concave flare at the base) instead of a straight
  triangle. The arrow is now that bump, 14 px (above or below) or 13 px (beside the trigger) from the aligned edge at the
  radius 6 (the radius + 8 and the radius + 7; the 10 px of the Vue demo looked like a piece stuck on at the corner), and the corners keep their radius (see the popup specification, "The
  arrow"). At a fractional pixel ratio the base goes one pixel into the box, which is invisible because the default light
  background is the opaque `#262626` (the 85% black of Ant Design over a white page: the same color on a white page, a
  different one only over a dark or colored page). A custom `color` with an alpha shows the overlap as a slightly darker line.
  The measured Ant Design React value `rgba(0, 0, 0, 0.85)` stays in this document as the reference.
- **Not handled / open:** a real screen reader (NVDA, JAWS, VoiceOver, Orca); a real touch device; a real Safari; a tip with
  a custom color whose theme changes while it is open; `contextMenu` as a trigger places the tip at the element, not at the
  pointer (ours, as decided); the layout shift of a trigger whose own size depends on the tip is outside the Tooltip.

## Список тестов

Each item is at least one test; the name is the item. Unit tests in jsdom where they can be, geometry and events that
need a real browser in `e2e/tooltip.spec.ts` (three engines).

- `title`: string, number (`0` shown), snippet; empty never opens, even with `open`; no `aria-describedby` then.
- `children` and the wrapper: one element; the first element is the anchor; the wrapper has no box and changes no
  layout (triggers of different widths); the child replaced or removed while open; no element left closes; a warning
  in development for a text-only child.
- `anchor`: the panel is placed at the given element.
- `open`: controlled and initial value; `onopenchange` once per user change, not for a parent change; a function binding.
- `placement`: the 12 values (the primitive tests it; here: the right side for each, mirrored in RTL, flipped at the edge).
- `trigger`: each value, an array, `[]`, one value; default is hover and focus; hover delays; a pass shorter than
  `mouseEnterDelay` opens nothing; `mouseLeaveDelay` applies on leaving the panel too; click toggles; contextMenu opens
  and blocks the browser menu.
- Hoverable: the pointer into the panel keeps it open and leaving closes it.
- Escape: closes with the pointer or the focus on the trigger, focus stays; ignored during IME composition (the
  primitive's rule).
- `arrow`: default shown, hidden, `pointAtCenter`; after a flip; compared with the box in a bordered `container`.
- `autoAdjustOverflow`: flips and shifts; off does neither.
- `color`: each of the 13 presets takes its background and text token in both themes and the arrow follows; every
  preset and a set of custom colors reach 4.5:1 (computed from the rendered colors, light, dark and
  `tokens-accessible.css`); a name from the list is a preset, any other string is a CSS color; an unparsable color
  leaves the default box; overriding a preset token changes the tooltip.
- `zIndex`, `container` (element and function), `destroyOnHidden`.
- `classNames` and `styles`: each of the three parts.
- Focus: opening never moves focus; the panel is not focusable; Tab to the trigger opens, Tab away closes.
- A11y: `role="tooltip"`, the `id` on the box, `aria-describedby` set while shown, merged with the consumer's value and
  restored, absent when closed and when empty; axe in the open and closed states in light, dark and
  `tokens-accessible.css`.
- Touch (emulated): the decision 4 behavior; a swipe does not open or close it.
- Forced colors: the box has a border; the arrow is visible.
- Around components: a tooltip on `Button` (disabled and loading), `Switch`, `Checkbox` (pointer from the box to the
  text does not close it), `Select`.
- Nesting: inside a Select panel or another popup; a press in the tooltip is "inside".
- Layout: opening and closing moves neither the trigger nor its neighbors, with triggers of different widths, in
  frames during the animation; the text does not shift after the opening motion.
- Motion: none under `prefers-reduced-motion`.
- Content change while open: the panel is placed again.
- Server rendering: the wrapper and the children render, no panel.
- Reactivity: changing `title`, `placement`, `trigger`, `color` while open and while closed.
- Mutation testing: `npm run test:mutation` for `Tooltip.svelte` once it exists.

## Решения и обоснование

- **Why a component on the primitive, not a new mechanism:** the primitive exists for this (popup.md, "Who needs it");
  Tooltip is its first simple consumer and the base of Popover and Popconfirm.
- **Why the keyboard is in the default** (decision 2): the public record (React 49891, the FAQ) shows that the default
  of the reference leaves keyboard users without the tip, and the project's own rules make keyboard use mandatory.
- **Why the presets are in v1.0** (decision 3): the maintainer chose to take them against the default of section 5a, so
  there is no reserved-name guard and nothing to change later. Their text color is a rule, not a copy of Ant Design's
  white, because white fails AA on most of the palette (13 presets measured, both themes) and the project's contrast
  check covers the dark theme too (3b).
- **Why the attribute is absent while closed:** the reporter in React 49891 shows a scanner failing on a reference to a
  missing id.
- API inspired by Ant Design (MIT); the implementation is original for Svelte. The text above is paraphrased from the
  public documentation and changelogs; no code and no documentation text is copied.
