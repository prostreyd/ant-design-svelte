# Spin specification

Status: **agreed with the maintainer on 2026-11-17 (workflow stage 2 done): Q1 B, Q2 A, Q3 A, Q4 A, P1 to P14 accepted as
written** (see "Agreed decisions"). **Implemented, tested and documented (workflow stages 3 to 6, 2026-11-17)**; what implementation found out is in
"Implementation notes". Not committed: it waits for the maintainer's "запуш".

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers and black-box observation of the public demos (CLAUDE.md sections 2, 4a and
7a). One accident is recorded under "Исходник, консультации".

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/spin> (the page's markdown and its `semantic.md`) | 6.7.1 (changelog head), 2026-11-17 |
| Ant Design Vue | `components/spin/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-17. The page is the old 3.x API, the changelog head is 3.1.0-rc.5 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/spin/en> | 22.2.0 (site header), 2026-11-17 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-17 |
| Issue trackers | React 6383, 29568, 50860, 57082, 58424, 58801; Vue 174, 625, 5811; NG-ZORRO 5458, 5926, 5927, 7595 (read through the GitHub API, code removed from comments) | 2026-11-17 |
| Black-box | the public demos on <https://ant.design/components/spin>, Chromium under Playwright 1.65, 1000 and 1280 px, 2026-11-17 (results below) | |

## What it is

A **loading indicator** with three shapes, all in the three libraries except where noted:

1. **Standalone**: only the indicator (four dots that turn), optionally with a description under it.
2. **Embedded** (nested): the Spin wraps content. While `spinning`, the content is dimmed and ignores the pointer, and the
   indicator is centered over it.
3. **Fullscreen** (React only): a dimmed backdrop over the viewport with the indicator in the middle (a page loader).

The indicator can be replaced (`indicator`), delayed to avoid a flash (`delay`), sized (`size`), and in React shown as a
progress ring (`percent`). Spin is not interactive: no focus, no keyboard, no callbacks.

Exports: **`Spin`**. Files: `src/lib/Spin/Spin.svelte`, `types.ts`. A Svelte component with a `children` snippet is both the
standalone and the embedded form; there is no `nzSimple`-style switch (see "Не берём").

## Black-box findings (2026-11-17)

Measured on the public demos of <https://ant.design/components/spin> (React 6.7.1):

1. **Geometry.** The dot box is a square of **14 / 20 / 32 px** for `small` / default / `large` (the documented tokens
   `dotSizeSM`, `dotSize`, `dotSizeLG`). A standalone Spin is exactly that square (no padding). Four dots sit in the corners of
   the square, each about 45% of its side (9 px of 20), scaled to 0.75; the whole group turns once in **1.2 s, linear, forever**,
   and each dot pulses its opacity (about 0.3 to 1) in 1 s with a staggered start. The turning group's bounding box is larger
   than the square (28 px for 20), so the root must not clip it.
2. **Description.** Indicator on top, description under it, both centered, with a **12 px** gap (section heights 40, 46 and 58
   for dots 14, 20 and 32 plus one 14 px line). The text is in the primary color, in the body font size.
3. **Embedded.** The root is `position: relative`. The indicator section is absolutely positioned at 50% / 50% (centered) with
   `z-index: 1`; the content container gets **`opacity: 0.5`** (transition 0.3 s), **`pointer-events: none`** and
   **`user-select: none`** while spinning, and nothing else: no blur, no `inert`, no `aria-hidden`. A click at the middle of the
   container hits the indicator, not the content. When `spinning` ends the container returns to opacity 1 and the indicator is
   removed.
4. **`delay` (500 ms demo).** Turning `spinning` on: the indicator and `aria-busy="true"` appear at about 0.5 s, not before.
   Turning it off at any time, including inside the delay, hides at once and nothing flashes (on, then off 100 ms later: never
   shown). `aria-busy` follows what is **visible**, not what was asked.
5. **Progress (`percent`).** The dots are replaced by a ring in the dot box: an SVG with a track circle
   (`rgba(0,0,0,0.06)`) and a progress arc in the primary color, thickness 20% of the box, starting at 12 o'clock, `0.3 s`
   transitions. The SVG has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow`, **no name**.
   With `percent="auto"` the value is **simulated in script**: `aria-valuenow` climbed 14.3, then 26.5 within 0.7 s, so the
   progressbar changes on every frame (see Q2).
6. **Fullscreen.** `position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.45)`, fade 0.2 s, **pointer events are
   kept** (clicks do not reach the page), the indicator is centered, the element **stays in the DOM** after it hides (opacity
   0). It is drawn **in place**, not in a portal. The page keeps scrolling and **Tab still reaches the page behind** (no focus
   trap, no scroll lock).
7. **ARIA on the root.** Every Spin root, standalone, embedded and fullscreen, has `aria-live="polite"` and `aria-busy` (`true`
   while spinning, `false` otherwise). There is **no role**, **no text** unless a description is given, and the content
   container carries no ARIA state. (WAI-ARIA lets assistive technology hold the announcements of a live region back while `aria-busy` is true.)
8. **Forced colors.** With `forced-colors: active` the dots are drawn with the system `Canvas` color (their `background-color` is
   forced), so **the default indicator disappears**. Found 2026-11-17 on the Size demo; the same class of defect as the Switch of
   2026-11-11.
9. **Reduced motion.** With `prefers-reduced-motion: reduce` the animations are unchanged (1.2 s and 1 s): Ant Design does not react.
10. **Page-level.** The fullscreen root of the "semantic" demo is `absolute`, not `fixed`: the `fullscreen` style is
    positioned by the demo itself, so it does not tell how to build the real one.

## Differences between the three libraries

| Level | React 6.7 | Vue (docs markdown) | Angular 22.2 | Difference | Decision |
|---|---|---|---|---|---|
| **Presence** | `Spin` | `a-spin` | `nz-spin` | all three | Core |
| **State** | `spinning` (default `true`) | `spinning` (default `true`) | `[nzSpinning]` (default `true`) | same | Core: `spinning` |
| **Delay** | `delay` (ms) | `delay` | `[nzDelay]` | same | Core: `delay` |
| **Size** | `size`: `small`, `medium`, `large`; `default` deprecated in 6.3.2 | `small`, `default`, `large` | `'large' \| 'small' \| 'default'` | `medium` vs `default` | React values, `default` accepted as an alias (as Switch), P2 |
| **Indicator** | `indicator` (ReactNode) | `indicator` (vNode or slot) | `[nzIndicator]` (`TemplateRef`) | form of the value | Core: `indicator` as a `Snippet` (P3) |
| **Description** | `description` (ReactNode, 6.3.0); `tip` deprecated | `tip` (string or slot, slot since 3.0) | `[nzTip]` (string) | name and forms | `description` as `string \| Snippet` (P2) |
| **Wrapper class** | `wrapperClassName` deprecated, use `classNames.root` | `wrapperClassName` | — | renamed | `classNames.root`; the old name is not taken (4a) |
| **Embedded** | children | default slot | content projection, `[nzSimple]` marks "no children" | mechanism | Core: `children` snippet |
| **Percent** | `percent`: number or `'auto'` (5.18.0) | — | — | React only | Cheap React addition, Q2 |
| **Fullscreen** | `fullscreen` (5.11.0) | — | — | React only | Cheap React addition, Q3 |
| **Semantic styling** | `classNames` / `styles`, objects or functions (6.0.0); parts `root`, `section`, `indicator`, `description`, `container` | — | — | React only | Cheap React addition: objects only (P9) |
| **Global default indicator** | `Spin.setDefaultIndicator`, ConfigProvider `indicator` (5.20.0) | `Spin.setDefaultIndicator` | global config `nzIndicator` | needs a provider | Reserved for v1.1 (P10) |
| **a11y** | `aria-live="polite"` + `aria-busy` on the root; ring has `role="progressbar"` | not documented | not documented | none documents any | Our own contract (Q1) |
| **Methods** | none | none | none | | none |

### Values per prop (rule 5, item 4)

| Prop | React | Vue | Angular | Our type | Narrowing? |
|---|---|---|---|---|---|
| `spinning` | boolean | boolean | boolean | `boolean` | no |
| `delay` | number | number | number | `number` | no |
| `size` | string enum | string enum | string enum | `'small' \| 'medium' \| 'large' \| 'default'` | no |
| `indicator` | ReactNode | vNode or slot | `TemplateRef` | `Snippet` | **yes, in React only**: text, numbers and elements are a `Snippet` here. Vue and Angular take no text either. P3 |
| `description` | ReactNode | string or slot | string | `string \| Snippet` | no |
| `percent` | number or `'auto'` | — | — | `number \| 'auto'` | no |
| `fullscreen` | boolean | — | — | `boolean` | no |
| `classNames`, `styles` | object or function | — | — | object | **yes**: the function form is not taken (P9) |

### Deprecated and renamed (4a)

- `tip` → `description` (React 6.3.0, struck through in the table). Taken: `description`.
- `wrapperClassName` → `classNames.root` (React 6.0.0 semantic styling). Taken: `classNames.root`.
- `size="default"` → `medium` (React 6.3.2, deprecation warning reworded in 6.4.0). Taken: `medium`, with `default` as an alias
  because Vue and Angular still use it (the Switch decision).
- `Spin.setDefaultIndicator(...)` → ConfigProvider `indicator` (React 5.20.0). Not taken, reserved (P10).
- The React 5 to 6 upgrade note never listed the Spin removals (issue 58424): the chain above is read from the changelog.

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular):** `spinning`, `delay`, `size`, `indicator`, `description` (`tip`), embedded mode with `children`.
- **Дешёвые React-дополнения (≤ 1 дня каждое):**
  - `classNames` / `styles` for five parts: about half a day (the helper of Switch exists). Objects only.
  - `percent` (ring, number and `'auto'`): about half a day, if the indeterminate ring is CSS only (Q2).
  - `fullscreen`: about half a day in place, more with a portal (Q3).
- **Зарезервировано на v1.1:** the default `indicator` and `size` from ConfigProvider (contract: the same names, read when the
  prop is not given). `Spin.setDefaultIndicator` is not part of Svelte.
- **Не берём (Vue/Angular-only):** `[nzSimple]` (Angular): the presence of `children` already decides, and a flag that
  contradicts the content is a trap.
- **Не берём (React-only, не подходит для Svelte):** the function form of `classNames` / `styles` (a Svelte consumer computes the
  object in `$derived`); `Spin.setDefaultIndicator` (a mutable global; the provider replaces it in v1.1); `tip`,
  `wrapperClassName`, `size="default"` as React names (deprecated, see above).
- **Не берём (нет ни в одной версии):** a minimum display time (the open request React 29568 and NG-ZORRO 5458: `delay` only
  postpones the start, it cannot keep a short spinner on screen). If wanted later it is an additive prop with no clash.

## API

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `spinning` | `boolean` | `true` | Whether the Spin is active. `undefined` counts as the default (`true`), as in React (issue 57082). Standalone: when it is false (or the delay has not passed) **nothing is rendered**. Embedded: the content is shown as it is, with no indicator and no dimming. |
| `delay` | `number` (ms) | none | The indicator appears this long after `spinning` became `true`. See Behavior. |
| `size` | `'small' \| 'medium' \| 'large' \| 'default'` | `'medium'` | Dot box 14 / 20 / 32 px. `default` is an alias of `medium`. Outside the list: `RangeError` in development and tests, `medium` in a production build (the Button rule). |
| `description` | `string \| Snippet` | — | Shown under the indicator, in the status message (A11y). A string is text, never HTML; an empty string counts as not given. |
| `indicator` | `Snippet` | — | Replaces the default dots. It is drawn in the indicator part, a box of the dot size with `font-size` equal to it and the Spin color, so an icon scales with `size`. The component does not turn it. Hidden from assistive technology. |
| `percent` | `number \| 'auto'` | — | Replaces the default dots with a ring. A number is clamped to 0 to 100. `'auto'` is an indeterminate ring (Q2). Ignored when `indicator` is given. |
| `fullscreen` | `boolean` | `false` | The Spin becomes a backdrop over the viewport with the indicator in the middle (Q3). |
| `children` | `Snippet` | — | Embedded mode: the content the Spin covers. |
| `classNames` | `Partial<Record<'root' \| 'section' \| 'indicator' \| 'description' \| 'container', string>>` | — | Classes appended to the part. |
| `styles` | `Partial<Record<'root' \| 'section' \| 'indicator' \| 'description' \| 'container', Record<string, string \| number>>>` | — | Inline styles of the part, kebab-case keys and custom properties, numbers as-is, written after the token-based values (the Switch contract). |
| `class` | `string` | — | Appended to the root, with `classNames.root`. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it. |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the root `<div>` (`id`, `title`, `data-*`, `aria-label`, `aria-labelledby`, handlers). The component owns `role` and the `aria-live` and `aria-busy` of the live parts (Q1). |

No methods (nothing to focus), so the page has no method table and no "Focus and blur" block (rule of 2026-11-16).

**The five parts.** `root` (the outer element), `section` (indicator and description together), `indicator` (the dot box),
`description`, `container` (the covered content, embedded mode only). As in React, **standalone has one element for `root` and
`section`**: both class names and both styles land on it. Fullscreen and embedded have a separate `section`.

## Behavior

**Standalone** (no `children`, not `fullscreen`)
- `SPN-1` The root is an inline flex column, as large as the dot box (plus the description). The indicator is centered, the
  description is under it with a 12 px gap, both centered.
- `SPN-2` Not spinning: nothing is rendered, no space is kept (the consumer sizes the area if it needs a stable layout).

**Embedded** (`children` given)
- `SPN-3` The root is a `position: relative` block. The covered content is in `container`. While spinning the container has
  opacity 0.5, `pointer-events: none` and `user-select: none`, and the section (indicator and description) is centered over it
  at 50% / 50% with a higher stacking order. Nothing else: no blur.
- `SPN-4` Not spinning: the container is at full opacity and takes events; the section is not rendered.
- `SPN-5` **No flash on the first paint**: if `spinning` is true at mount the container is already at 0.5 (no transition from 1;
  Vue issue 174). The opacity transition (0.3 s) runs only on later changes.
- `SPN-6` The Spin does not make the content `inert` and does not hide it from assistive technology (Q4).
- `SPN-7` A Spin inside the content of another Spin works on its own: its indicator is centered in its own box, and a standalone
  Spin with no children and no spinning does not cover the outer content (React 58801 and 50860).

**Delay**
- `SPN-8` `delay` applies **every time** `spinning` goes from false to true, including at mount. Turning `spinning` off cancels a
  pending start and hides at once. Turning it on again starts a **new** delay (NG-ZORRO 5926, 5927).
- `SPN-9` A repeated true (the parent re-renders with the same value, or the prop is set again) does **not** start another timer
  or restart the pending one (React 6383).
- `SPN-10` Until the delay has passed the Spin is as if not spinning: no indicator, content at full opacity and live, and the busy
  state is `false` (finding 4). `delay` of 0 or not given: no timer, the first render already shows it.
- `SPN-11` `delay` that is negative or not finite: `RangeError` in development and tests, treated as no delay in a production build.
- `SPN-12` The timer is cleared when the component is destroyed.

**Size, description, indicator, percent**
- `SPN-13` `size` maps to the dot box (14 / 20 / 32). The description keeps the body font size at every size.
- `SPN-14` A custom `indicator` is drawn in the indicator part; the default dots are not rendered. It is not turned by the
  component, so a consumer that wants a turning icon animates it.
- `SPN-15` `percent` as a number draws the ring with that fraction filled, from 12 o'clock clockwise, in the dot box; the dots
  are not rendered. Below 0 counts as 0 and above 100 as 100; `NaN` is a `RangeError` in development and ignored (dots shown) in
  a production build. A change of the number animates the arc (0.3 s). `'auto'` is the indeterminate ring (Q2).
- `SPN-16` The ring has `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow` for a number; for
  `'auto'` it has no `aria-valuenow` (indeterminate, the ARIA meaning of "unknown").

**Fullscreen**
- `SPN-17` `fullscreen` draws the Spin `position: fixed` over the whole viewport (`inset: 0`) with the mask color and a
  z-index from a token, the indicator and the description centered in white. Pointer events are kept, so clicks do not reach the
  page. It fades in (0.2 s) and leaves at once.
- `SPN-18` Not spinning (or in the delay): the backdrop is not rendered, so it never blocks the page.
- `SPN-19` Drawn in place (Q3). There is no focus trap and no scroll lock; the page says so.
- `SPN-20` `fullscreen` together with `children`: both are drawn, and the content is not dimmed (the backdrop covers it).

**Cross-cutting**
- `SPN-21` Right-to-left: no `left` or `right`, only logical properties and flex, so nothing mirrors wrongly at `dir="rtl"`.
- `SPN-22` `prefers-reduced-motion: reduce`: the turn of the dots is slowed (to the `--ads-motion-duration-spinner-reduced`
  family) and the container transition is off; the indicator stays visible (finding 9: Ant Design ignores the setting).
- `SPN-23` Server rendering: the server markup is the same as the first client paint (with `delay` greater than 0 and
  `spinning` true, both render the not-yet-visible state), so there is no hydration mismatch and no flash.
- `SPN-24` `styles` values are applied after the component's own, so a consumer value wins.
- `SPN-25` Reactive: changing `spinning`, `size`, `description`, `indicator`, `percent`, `fullscreen` and `children` re-renders
  correctly, including switching between the standalone, embedded and fullscreen shapes.

## A11y

There is no ARIA or WAI-ARIA pattern named "spinner". The contract below is ours, built from the `status` and `progressbar` roles
and `aria-busy` of WAI-ARIA 1.2, and from what the three libraries do not do (finding 7). It depends on Q1; this is the proposed
answer (option B).

- **The graphics are decorative.** The dots, the ring track and a custom indicator are `aria-hidden="true"`; only text and the
  progressbar state reach assistive technology.
- **Status message.** The message a screen reader hears is the text of `description`. The element that holds it is
  `role="status"` (an implicit polite live region). Standalone and fullscreen: the root. Embedded: the `section`.
- **A Spin with no `description` is silent** unless the consumer names it with `aria-label` or `aria-labelledby` (forwarded to the
  status element). The page and the README say so. In development a Spin that is spinning with neither a description nor a name
  logs one `console.warn`.
- **Busy state.** Embedded: `aria-busy="true"` on the **container** (the region that is being updated) while spinning, removed
  otherwise. It is not put on the live region itself, because a busy live region may not be announced (finding 7).
- **Progress.** The `percent` ring is `role="progressbar"` with the values above and **an accessible name**: it is named by
  `description` when given, otherwise by the forwarded `aria-label`.
- **Focus.** Spin never takes focus and is not in the Tab order. In embedded mode the content stays focusable and readable
  (Q4); in fullscreen the page behind stays reachable by keyboard (finding 6). Both are documented limits, not features.
- **Contrast.** The dots (`--ads-color-primary`, 4.10:1 on white) and the ring arc reach 3:1 as graphical objects (WCAG 1.4.11) in
  the default light set and in the dark theme. The description is text (4.5:1): the default primary is 4.10:1 on white, so the
  description uses `--ads-color-primary-text`, which `tokens-accessible.css` makes 4.5:1 or more. Fullscreen: white on the mask over a
  white page is 3.4:1 with the default `rgba(0,0,0,0.45)`, so `tokens-accessible.css` raises the mask to 0.6 (5.7:1). The 0.3 to
  1 pulse of a single dot is momentary and the indicator as a whole is not required to understand the content (the status text is).
- **Forced colors** (`forced-colors: active`): finding 8. The dots, the ring and the backdrop are drawn with system colors
  (`CanvasText` or `Highlight` for the dots and the arc, `GrayText` for the track, a `CanvasText`-based backdrop that keeps the
  indicator readable) so they never merge with `Canvas`. Decided here, tested in the three engines.
- **Reduced motion:** `SPN-22`.
- Axe checks cover every state (standalone with description, with `aria-label`, embedded, fullscreen, ring), and a negative check
  that a progressbar without a name is reported.

## Colors and tokens

`--ads-spin-*` tokens in `tokens.css`, each consumed by the component. Dimensions are the documented defaults (checked
2026-11-17): dot box 20 / 14 / 32, gap to the description 12 (the `paddingSM` token), container opacity 0.5, container and indicator
transition 0.3 s, fullscreen mask `rgba(0,0,0,0.45)` (the `colorBgMask` token), fullscreen z-index 1000 (`zIndexPopupBase`),
fullscreen indicator and text white, ring track `rgba(0,0,0,0.06)` (`colorFillSecondary`), dot color `colorPrimary`. Colors follow the
theme tokens (`--ads-color-primary`, `--ads-color-primary-text`, and so on), so the dark theme needs no extra values.
The accessible set overrides the description color and the mask (above). The turn time (1.2 s), the pulse time (1 s) and the
reduced-motion time are tokens as well.

Not taken: the token `contentHeight` (400). It is documented as "height of content area", and no demo shows where it applies; if a
black-box check later finds it, it is additive.

## Agreed decisions (2026-11-17)

1. **Q1 B**: a `role="status"` element holds the text of `description`; `aria-busy` is on the covered container only; the graphics
   are `aria-hidden`; a Spin with no description needs `aria-label` or `aria-labelledby`, and a development warning says so.
2. **Q2 A**: `percent="auto"` is a CSS-only indeterminate ring (a turning arc, no timer, no `aria-valuenow`).
3. **Q3 A**: `fullscreen` is drawn in place (`position: fixed`), no portal.
4. **Q4 A**: the content under an embedded Spin stays focusable and readable; only the pointer and the selection are blocked.
5. **P1 to P14** accepted as written.

What implementation changed against the draft: the fullscreen backdrop **fades in** (0.2 s) and **leaves at once**, because a fade-out
would keep a pointer-blocking layer over the page after the loading has ended (`SPN-17`, `SPN-18`).

## Decisions for the maintainer (workflow stage 2, as they were put)

**Q1. The ARIA model.** None of the three libraries documents any, and what Ant Design's DOM does has two flaws (finding 7): a
Spin with no text says nothing, and `aria-busy="true"` on a live region lets assistive technology hold its own announcement back.
- **A. As Ant Design:** `aria-live="polite"` and `aria-busy` on the root, no role, no hidden text. Same markup as the originals; a
  screen reader says nothing for a plain spinner and nothing while busy.
- **B. Status plus busy on the content (recommended):** the text of `description` in a `role="status"` element; `aria-busy` on the
  covered container only; the graphics `aria-hidden`; a Spin with no description needs an `aria-label` (a dev warning says so).
  More correct, one prop more to remember. To be confirmed with a real screen reader (Orca, see the matrix) before release.

**Q2. `percent="auto"`.** Ant Design simulates progress in script: the arc climbs on a timer and `aria-valuenow` changes on every
frame (finding 5). Say what a Svelte user should get:
- **A. A CSS-only indeterminate ring (recommended):** an arc that turns, no timer, no `aria-valuenow` (the ARIA meaning of
  "unknown"), quiet for screen readers, works with reduced motion. **Looks different** from the Ant Design demo (a turning arc
  instead of a climbing one).
- **B. Simulate it as Ant Design does:** same look; needs a timer per Spin and puts a changing `aria-valuenow` on a live page.
- **C. Do not take `'auto'` in v1.0**, only the number; reserve `'auto'` for v1.1.

**Q3. Where does `fullscreen` draw?**
- **A. In place (recommended), as Ant Design does:** `position: fixed` where the component is. Cheap and portal-free, and the plan
  gives Spin no dependency. The limit: inside an ancestor with `transform`, `filter` or `contain`, `fixed` is relative to that
  ancestor, not the viewport; the page tells the consumer to put it near the root of the app.
- **B. In a portal to `<body>`:** always the viewport, but `origin/main` has no portal primitive (`internal/` holds only
  `popup`). Rule 6b and step 0 say to stop and make it first as a separate branch (Modal, Dropdown and Drawer need it too), so
  Spin would wait for that branch.

**Q4. Content under an embedded Spin and the keyboard.** The pointer is blocked (`pointer-events: none`), but the keyboard is not:
Tab still reaches a button under the dimmed content and Enter presses it (finding 3).
- **A. As Ant Design (recommended):** keep the content focusable and readable; the page says that a destructive or repeatable
  action under a Spin must guard itself. Nothing loses focus when a Spin starts.
- **B. `inert` while spinning:** the mouse and the keyboard are blocked the same way, but the content is also hidden from screen
  readers, and a focused element inside **loses focus** the moment the Spin starts. Can be added later as an opt-in prop
  without a break.

### Proposals (accepted together unless the maintainer objects)

- **P1** Names: `Spin`; types `SpinProps`, `SpinSize`, `SpinSemanticName`, `SpinClassNames`, `SpinStyles`; one export in `index.ts`.
- **P2** Names and values: `description` (not `tip`), `classNames.root` (not `wrapperClassName`), `size` is `medium`, with
  `default` accepted as an alias (as Switch).
- **P3** `indicator` is a `Snippet` only (a narrowing of React's ReactNode; Vue and Angular take no text either, and a text
  indicator is `{#snippet indicator()}text{/snippet}`).
- **P4** `spinning` defaults to `true`; `undefined` is the default (React issue 57082, kept as it is).
- **P5** The delay contract of `SPN-8` to `SPN-12`: a fresh delay on every false-to-true change and at mount; false cancels and hides
  at once; a repeated true starts nothing; invalid numbers throw in development.
- **P6** `percent`: a number is clamped to 0 to 100, `NaN` throws in development and is ignored in production; a custom `indicator`
  wins over `percent`.
- **P7** A standalone Spin that is not spinning renders nothing (Ant Design keeps it with `display: none`).
- **P8** Embedded: opacity 0.5, no pointer events, no text selection, no blur, no first-paint transition; no `inert`
  and no `aria-hidden` (Q4).
- **P9** `classNames` and `styles` take objects for five parts, kebab-case keys, numbers as-is (the Switch contract); no function
  form.
- **P10** No `Spin.setDefaultIndicator` and no global config; the names `indicator` and `size` are reserved for ConfigProvider in v1.1.
- **P11** No methods, no "Focus and blur" block, no method table.
- **P12** `fullscreen` has no focus trap and no scroll lock; the page states both limits.
- **P13** Reduced motion slows the turn instead of stopping it (the Switch rule), because a stopped spinner reads as a frozen page.
- **P14** Logical properties only, tested at `dir="rtl"`; the demos on the page follow the 2026-11-16 layout rules (a stack of
  units, a caption above, the output below, a state of its own for every Spin).

## Dependencies

Rule 6b of the rules for AI assistants: what this component uses besides its own files.

None. `Spin` draws everything itself: no other component, no primitive of `internal/` that is a part of a feature. Shared helpers
from `src/lib/internal/` (`env`, `options`, `semantic`): small functions with no stable API; they are not dependencies in the sense
of rule 6b. Other components take Spin whole later (Table, List, Mentions, QRCode, Card), as in `ai/dependencies.md`. Q3 option B
would add the portal primitive; that needs the maintainer's decision first.

The code already has four private copies of a border-drawn loading ring (Button, Switch, and the icons of Input and Select).
Spin's dots are a different drawing and share nothing with them, so no copy is made; merging those four is a separate cleanup
and is **not** part of this component.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Spin.test.ts` (the status element, the busy container, the progressbar and the hidden graphics checked against WAI-ARIA 1.2; axe in every state and a negative check for an unnamed progressbar) |
| Forced colors | test | `e2e/forced-colors.spec.ts` (Spin block: the dots, the ring and the text differ from `Canvas`, in Chromium, Firefox and WebKit; without the fix the dot tests fail in Chromium and Firefox, WebKit does not replace the backgrounds of this element) |
| IME | n/a | Spin has no text input, so there is no composition to test |
| Touch | n/a | Spin is not interactive and has no pointer target of its own; the covered content ignores touch the same way as the mouse (pointer events, covered in `e2e/spin.spec.ts`) |
| Browsers | test | `e2e/spin.spec.ts` (geometry, delay timing, overlay, layout, right-to-left, reduced motion and contrast in Chromium, Firefox and WebKit) and `tests/SpinServer.test.ts` (the server markup is the client markup) |
| Browser floor | test | `npm run test:floor` (the CSS audit and the Spin smoke of 9 checks on Chromium 90, Firefox 85, WebKit 15.4: 43 of 43 on each, 2026-11-17; no new entry in `ENHANCEMENTS`) |
| Screen reader | manual pending | Orca with Firefox through `screen-reader/` is planned for the status message (Q1); NVDA, VoiceOver and JAWS stay manual. The page and the README say "not checked with a screen reader" until then |

## Список тестов

Each item is at least one test; the test name is the item.

- `SPN-1`, `SPN-2`: standalone markup, the dot box at each size, the description under the indicator, nothing rendered when not spinning.
- `SPN-3` to `SPN-7`: embedded: container opacity, pointer events and selection while spinning, the section centered, full opacity
  and no section when not spinning, no transition on the first paint, no `inert` and no `aria-hidden` on the container, nested
  Spins independent, an empty inner Spin does not block the outer content.
- `SPN-8` to `SPN-12`: delay with fake timers: not shown before the time, shown after, off during the delay never shows, off and on
  restarts the delay, repeated true does not stack timers, mount with `spinning` true waits, `delay={0}` shows at once, invalid
  values throw, the timer is cleared on destroy, `aria-busy` follows the visible state. In the browser (e2e): real time.
- `SPN-13` to `SPN-16`: `size` and the `default` alias, invalid size throws or falls back; `description` as a string (text, not
  HTML, empty counts as none) and a snippet; custom `indicator` replaces the dots and is hidden from AT; `percent` as a number
  (clamped, `NaN`), `'auto'` (no `aria-valuenow`), the ring replaces the dots, `indicator` wins, the progressbar values and its name.
- `SPN-17` to `SPN-20`: fullscreen fixed over the viewport, mask color, z-index, white indicator, blocks the pointer, not rendered
  when not spinning or in the delay, `fullscreen` with `children`.
- `SPN-21` to `SPN-25`: `dir="rtl"`, reduced motion (a slower animation, the indicator still visible), the server markup equals the
  client markup (`tests/helpers/renderOnServer.mjs`), `styles` wins, reactivity across shapes and props.
- API: `classNames` and `styles` for each of the five parts (including that `root` and `section` are one element standalone),
  `class`, `style`, native attributes forwarded, `role` and the live attributes not overridable.
- Axe: standalone with `description` and with `aria-label`, embedded, fullscreen, ring (number and `'auto'`); a negative check
  that a progressbar with no name is reported.
- Visual states in Playwright (`e2e/spin.spec.ts`): the geometry measured on the Ant Design demos (dot box, the 12 px gap, the
  centering), delay timing, the contrast matrix with `tokens-accessible.css` and in the dark theme, no layout shift when `spinning`
  toggles (the embedded content keeps its size and position, with text of different widths), `prefers-reduced-motion`.
- Forced colors (`e2e/forced-colors.spec.ts`): the three shapes differ from `Canvas` in Chromium, Firefox and WebKit.
- The docs page: `tests/docs/spin-page.test.ts` compares the API and token tables with the sources and checks that every prop is
  in an example; the `Spin page` block of `docs/e2e/site.spec.ts` checks the units, the groups are independent, three languages.
- Tokens: `tests/tokens.test.ts` (the documented values; the dots 3:1, the description 4.5:1, white on the mask 4.5:1 with the
  accessible file and in the dark theme, and why the defaults are below).
- The server render: `tests/SpinServer.test.ts` (through `tests/helpers/renderOnServer.mjs`).
- The browser floor: the Spin smoke of `scripts/floor/smoke.cjs` (`npm run test:floor`).
- Mutation testing: `npm run test:mutation -- --target=Spin` on `Spin.svelte` with `tests/Spin.test.ts` and `tests/SpinServer.test.ts`, run last and alone. Result 2026-11-17: 100% (107 of 107 mutants killed, none invalid, 21 operators written for Spin in `scripts/mutation-test.mjs`). The score depends on the code around each mutation, so re-run it after editing the component.

## Implementation notes (2026-11-17)

- **The progressbar is the indicator part, not the svg.** The first draft put `role="progressbar"` on the svg. axe does not apply
  `aria-progressbar-name` to an svg (it treats the svg `<title>` as a naming method), so an unnamed ring was never reported and the
  negative check could not hold. The role is now on the `<span>` of the indicator part, the svg inside is `aria-hidden`.
- **WebKit does not report an accelerated animation in `getComputedStyle`.** The transform of the turning group stays at the base
  value while `getAnimations()` shows a running animation with a moving clock, so the tests (and the floor smoke) read the Animations
  API, which is the same in the three engines.
- **A delay test that checks "not there yet" right after the mount races the delay** on a loaded machine (4 workers, Firefox): the
  indicator legitimately appeared before the first check. The delay tests now read the page clock (the lab records the mount and
  the first insertion of the status element) and the "not there yet" checks use a 1.5 s delay.
- **The section of an embedded Spin covers the whole root** (`inset: 0`, a flex box that centers its content), so the indicator is
  centered without `transform` (which has no logical form for right-to-left) and the section also takes the clicks.
- **The first-paint rule is plain CSS**: the busy class is on the container from the first render, and a transition does not run on
  the first style, so nothing else is needed; the e2e test reads the opacity in the same task as the mount.
- **Values.** The dots are 45% of the box, scaled to 0.75, in the corners, the group turns from 45 deg (the shape measured on the
  Ant Design demo, drawn from scratch). The ring is a 100 unit `pathLength` circle with a dash offset (`100 - value`), so the arc
  is a single transition; the indeterminate arc is `30 70` and the svg turns.
- **The development warning** is once per instance, when the indicator is first visible, so a plain `<Spin />` in a page logs one line
  each, not one per render.
- **Not taken after all:** a fade-out of the fullscreen backdrop (see "Agreed decisions"). `container` also exists next to the
  fullscreen backdrop when `children` are given (`SPN-20`), as a plain wrapper.
- **Docs site.** `verify-build` refuses a page text that is only "undefined" or that contains "NaN"; the API rows say "a value that is
  not a valid number" and `spinning={undefined}`. `.ads-spin` is excluded from the color-contrast run of axe on the site, like the other
  components (the default description color is Ant Design's own, 4.10:1).

## Docs page plan (stage 6, done)

One page `Spin` at `/components/spin/` (en, ru, zh); every example a `stack` of `field` units, the demos in the two-column grid.

| Example | Spec items |
|---|---|
| `01-basic` | standalone, `spinning` toggled by a switch |
| `02-sizes` | `size` (and the `default` alias) |
| `03-embedded` | `children`, `spinning` (content dims, indicator centered), the limit of Q4 in the text |
| `04-description` | `description` as a string and as a snippet, in standalone and embedded |
| `05-delay` | `delay`: a fast load never shows the indicator, a slow one does |
| `06-indicator` | `indicator` snippet (an icon the consumer turns) |
| `07-percent` | `percent` as a number with a slider and `'auto'` |
| `08-fullscreen` | `fullscreen`, with a button that starts it and a timer that stops it, the limits in the text |
| `09-semantic` | `classNames`, `styles`, `class`, `style` |

API tables: props, the five semantic parts, tokens. No method table. The a11y notes (a name for a silent Spin, keyboard behind
the dim, no focus trap in fullscreen) sit in the "Accessibility" list of the page. A silhouette for the card on the overview
page.

## Исходник, консультации

None. The source of Ant Design was not read for this component.

One accident on 2026-11-17: while reading the tracker, the body of React issue 50860 turned out to contain a few lines of the
component's source, pasted by the reporter outside a code fence (so the stripping of fenced blocks did not remove them). They were
seen, **not used**, and are not reflected here: every decision above comes from the documentation, the changelogs, the issue titles
and symptoms, and the black-box measurements. The `aria-live` and `aria-busy` of finding 7 are also in the public `semantic.md` of
the React page (the "Abstract DOM structure"), which is where they are taken from.
