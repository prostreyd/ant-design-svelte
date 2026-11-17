# Grid specification (Row, Col, Breakpoints)

Status: **agreed (workflow stage 2, 2026-11-16) and implemented (stages 3 to 6, 2026-11-16 to 2026-11-17)**. The maintainer chose
the recommended option of Q1 to Q4 and accepted P1 to P12 in one answer (see "Agreed decisions"). What implementation found out is
in "Implementation notes". Not committed: it waits for the maintainer's "запуш".

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers and black-box observation of the public demos (CLAUDE.md sections 2, 4a
and 7a).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/grid> (the page's markdown) | 6.7.x (site navigation), 2026-11-16 |
| Ant Design Vue | `components/grid/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-16 |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/grid/en> | 22.2.0 (site header), 2026-11-16 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-16 |
| Issue trackers | React 10144, 13518, 29247, 29248, 29250, 32533, 52075 (read through the GitHub API, code removed from comments) | 2026-11-16 |
| Black-box | the public demos on <https://ant.design/components/grid>, Chromium under Playwright 1.65, viewports 400 / 600 / 800 / 1000 / 1300 / 1700 / 2000 px, 2026-11-16 (results below) | |

## What it is

The **24-column grid** of Ant Design: a **`Row`** lays its **`Col`** children out on 24 equal columns. A `Col` takes
`span` of them; a column that does not fit moves to the next line as a whole. Rows align and distribute their columns
(`justify`, `align`), columns can be shifted (`offset`, `push`, `pull`), reordered (`order`), given a raw flex value
(`flex`) and hidden or resized per screen width (`xs` to `xxxl`). Space between columns is the `gutter`.

All three libraries have it, with one idea and the same names (`Row`/`Col`, `a-row`/`a-col`, `nz-row`/`nz-col`); Angular
uses attribute directives, so the consumer picks the element. They are layout containers: **no role, no name, no state**.

Exports (Svelte has no `Grid.Row` namespace): **`Row`**, **`Col`**, and the helper **`Breakpoints`** (the counterpart of
`Grid.useBreakpoint`, see Q3). Files: `src/lib/Grid/Row.svelte`, `Col.svelte`, `Breakpoints.ts`, `layout.ts` (props to CSS custom properties, validation),
`constants.ts`, `types.ts`.

## Black-box findings (2026-11-16)

Measured on the public demos of <https://ant.design/components/grid> (React 6.7.x):

1. **Gutter is negative margin plus padding.** A `Row` with `gutter={16}` gets `margin-inline: -8px`, every `Col` gets
   `padding-inline: 8px`. So the Row box is **wider than its parent by the gutter** (154 px in a 138 px parent at gutter
   16). The demos hide it because their container has 24 px padding; without padding the page scrolls sideways. This is
   the open issue 10144 (2018, 36 reactions, 49 comments, workaround "wrap it in `overflow: hidden`"), duplicated by
   13518. Vertical gutter is a plain `row-gap`.
2. **The content boxes follow one formula.** With a parent content width `W`, gutter `g` and a column of `span` s, the
   visible content of a column is `(W + g) * s / 24 - g` wide and starts `(W + g) * (column start) / 24` from the left
   edge. Checked at gutters 8, 16, 24 and 32 and parent widths 138 to 1405 px (for example `W = 488, g = 32, s = 6`: 98 px at 323,
   453, 583, 713). **A flex `gap` of `g` with column widths of that formula gives the same boxes with no negative
   margin and no overflow** (the basis of Q1).
3. **Responsive values cascade upward ("mobile first").** In the "Responsive" demo (`xs 2/20/2`, `sm 4/16/4`, `md 6/12/6`,
   `lg 8/8/8`, `xl 10/4/10`) the columns measure 2, 4, 6, 8, 10 of 24 at 400, 600, 800, 1000, 1300 px, and **stay at
   10/4/10 at 1700 and 2000 px**, where `xxl` and `xxxl` are not given. In "More responsive" (`xs` and `lg` only) the
   `xs` value (5 of 24, offset 1) still applies at 600 and 800 px. So `xs` is the base for all widths, and each
   breakpoint inherits from the next smaller one that was given. The responsive gutter object behaves the same
   (`{xs:8, sm:16, md:24, lg:32}` gives 32 at 1300 px).
4. **`useBreakpoint` flags are not cumulative at the bottom.** The demo printed `xs` at 400, `sm` at 600, `sm md` at 800,
   `sm md lg` at 1000, up to `sm md lg xl xxl xxxl` at 2000. So `xs` is true only **below** 576 px, the others from their
   minimum width up. (The page says "xs only takes effect when the screen match the min width", which reads the other way.)
   Whether a gutter object with `xs` and `md` but no `sm` gives the `xs` value at 700 px is **not verified**: no public demo
   has such a gap. Our contract is the cascade of finding 3.
5. **`flex` strings are not all "applied as written".** On the "Flex Stretch" demo the computed values were: the number `2`
   gives `2 2 auto` (as documented); the string `'100px'` gives **`0 0 100px`** (a fixed width, not `1 1 100px`); `'auto'`
   gives `1 1 auto`, `'none'` gives `0 0 auto`, `'1 1 200px'` and `'0 1 300px'` stay as written. Every column also has
   `max-width: 100%` and `min-width: auto`. The page's own table says "string is applied directly"; the table lags behind
   the behavior, and we follow the behavior. A string of digits (`'2'`, documented as `2 1 0`) is not on a demo and follows
   the table.

## Differences between the three libraries

| Level | React 6.7 | Vue (docs markdown) | Angular 22.2 | Difference | Decision |
|---|---|---|---|---|---|
| **Presence** | `Row`, `Col`, `Grid.useBreakpoint` | `a-row`, `a-col`, `Grid.useBreakpoint` (4.0, sandbox link only) | `[nz-row]`, `[nz-col]` directives; no hook on the grid page | Angular puts the directive on any element | Core: `Row`, `Col`. The helper: Q3 |
| **API, Row** | `align`, `gutter`, `justify`, `wrap` | the same | `nzAlign`, `nzGutter`, `nzJustify`, `nzWrap` | `wrap` default: React `true` (4.8.0), Angular `true` (21.3.0), **Vue `false`**. Responsive object for `align`/`justify`: React 4.24, Vue 4.0, Angular 21.3.0. String gutter: React 5.28, Angular 21.3, **not in Vue**. | Core: all four props. `wrap` default `true` (P1). String gutter: cheap React addition (P2) |
| **API, Col** | `flex`, `offset`, `order`, `pull`, `push`, `span`, `xs` to `xxxl` | the same; `xxxl` is not in the table, but the changelog has it since 3.0.0-alpha.14 | `nzFlex`, `nzOffset`, `nzOrder`, `nzPull`, `nzPush`, `nzSpan`, `nzXs` to `nzXXXl` | `xxxl`: React 6.3.0, Angular 21.3.0, Vue 3.0.0-alpha.14 (changelog only) | Core (`xxxl` is a cheap addition, P4) |
| **Behavior** | flex layout; negative-margin gutter; responsive by JS `matchMedia` for `Row`, CSS classes for `Col` | same model | same model | one model in all three | Our mechanism differs (Q1, Q2) |
| **a11y** | none documented | none | none | no role in any | No role (see A11y) |
| **Customization** | breakpoints by theme token `screen[XS..XXXL]` (5.1.0); no `classNames`/`styles`; no component tokens | breakpoints by theme (4.0.0) | none | only React and Vue make the breakpoints configurable | Fixed breakpoints in v1.0 (Q2) |

**Props and the value forms each library takes** (rule 5, item 4):

| Prop | React / Vue / Angular accept | Svelte type | Narrowing? |
|---|---|---|---|
| `Row.align` | `'top' \| 'middle' \| 'bottom' \| 'stretch'` or an object per breakpoint (Angular default: none, the others `top`) | `RowAlign \| Partial<Record<Breakpoint, RowAlign>>` | no |
| `Row.justify` | `'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` or an object per breakpoint | `RowJustify \| Partial<Record<Breakpoint, RowJustify>>` | no |
| `Row.gutter` | number (px), string with a CSS unit, object per breakpoint, `[horizontal, vertical]` (Vue: no string) | `Gutter \| [Gutter, Gutter]`, `Gutter = number \| string \| Partial<Record<Breakpoint, number \| string>>` | no (the object also takes a string, see P2) |
| `Row.wrap` | boolean | `boolean` | no |
| `Col.span`, `offset`, `order`, `push`, `pull` | number | `number` | no |
| `Col.flex` | string or number (React: a number `n` is `flex: n n auto`; a string is applied as is, a string of digits `'n'` is `flex: n 1 0`; observed: a single length such as `'100px'` is `0 0 100px`, finding 5) | `string \| number` | no |
| `Col.xs` to `xxxl` | a `span` number, or an object with `span`, `offset`, `order`, `pull`, `push`, `flex` | `number \| ColSize` | no |
| children | ReactNode / slot / projected content | `Snippet` (`children`) | no: text between the tags is a snippet |

Not taken, with reasons (rule 5.3):

- **Not taken (no library has it): `classNames` / `styles` for Row and Col**, **component tokens**, **`ConfigProvider`
  defaults** (the Global Config column of the React table is `×` for every Row and Col prop). Additive later.
- **Not taken (Angular-only): the directive form** (`nz-row` on any element). A consumer who needs `<ul>`/`<li>` puts them
  inside a `Col`. A `tag` prop is possible later, additively.
- **Not taken (React/Vue-only, not for Svelte): the hook form** `Grid.useBreakpoint()` (a hook). The Svelte counterpart
  is Q3.
- **Not taken (Vue-only): nothing.** Vue lists no prop that React lacks; only its `wrap` default differs (P1).
- **Deprecated and renamed:** nothing in the Row/Col tables is struck through or marked deprecated in any version.
  Angular removed `nz-row[nzType]` in version 10 (it only chose flex mode); not taken.

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular):** `Row` `align`, `justify`, `gutter` (number, object, `[h, v]`), `wrap`; `Col`
  `span`, `offset`, `push`, `pull`, `order`, `flex`, `xs` to `xl` and `xxl` (number or object); span `0` hides.
- **Дешёвые React-дополнения (≤ 1 дня):** the string gutter (CSS length; Angular has it too) and the `xxxl` breakpoint
  (React 6.3.0, Angular 21.3.0, Vue changelog 3.0.0-alpha.14). Each is one more key in a table and one more custom property: well under a day.
- **Зарезервировано на v1.1:** nothing is deferred for the components. Q2 reserves customizable breakpoints if the
  maintainer wants them later.
- **Не берём:** see "Not taken" above.

## API

### Row

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `align` | `RowAlign \| Partial<Record<Breakpoint, RowAlign>>` | `'top'` | Vertical alignment of the columns of a line. `top`, `middle`, `bottom`, `stretch` map to `align-items` `flex-start`, `center`, `flex-end`, `stretch`. An object gives a value per breakpoint (the cascade of finding 3). |
| `justify` | `RowJustify \| Partial<Record<Breakpoint, RowJustify>>` | `'start'` | Horizontal arrangement. `start` and `end` map to `flex-start` and `flex-end` (the keywords `start`/`end` are newer in flex containers than the browser floor, Chromium 90, and are not relied on). |
| `gutter` | `Gutter \| [Gutter, Gutter]` | `0` | Space between columns. One value is the horizontal space; a pair is `[horizontal, vertical]`. A number is pixels; a string is a CSS length (`'2rem'`, `'5vw'`, `'calc(1rem + 4px)'`); an object gives a value per breakpoint. Implemented as `column-gap` and `row-gap` of the Row (Q1). |
| `wrap` | `boolean` | `true` | `flex-wrap: wrap`; `false` is `nowrap`: one line, and the columns keep their widths and run past the end of the Row (a strip the consumer scrolls); they do not shrink, because a `span` is a fixed width in all three libraries. |
| `children` | `Snippet` | — | The columns. Only `Col` should be a direct child (the rule of all three documentations); other children are laid out as plain flex items. |
| `class`, `style` | `string` | — | Appended to the root classes; written after the component's own inline style (so a consumer value wins). |
| Native attributes | `HTMLAttributes<HTMLDivElement>` | — | Forwarded to the root `<div>` (`id`, `data-*`, `aria-*`, `role`, event handlers). |

### Col

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `span` | `number` | unset | Number of the 24 columns to take. Unset: the column keeps its content width (a flex item). `0`: `display: none`. |
| `offset` | `number` | `0` | Empty columns before this one (`margin-inline-start`). |
| `push`, `pull` | `number` | `0` | Shift to the inline end / inline start by that many columns, **visually only** (`position: relative`); the DOM order does not change, and the shifted column does not move its neighbours. Both set: the net shift (P5). |
| `order` | `number` | `0` | The flex `order`. |
| `flex` | `string \| number` | unset | A number `n` is `flex: n n auto`; a string of digits only (`'2'`) is `flex: 2 1 0px`; a single length or percentage (`'100px'`, `'30%'`) is a fixed width, `flex: 0 0 <length>` (finding 5); any other string (`auto`, `none`, `1 1 200px`) is applied as `flex` as it is. Numeric `0` is a real value, not "unset" (public bug 58719). Where both are set, `flex` wins over the width of `span`; a column with `flex` keeps `max-width: 100%`. |
| `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `xxxl` | `number \| ColSize` | unset | From that screen width up (the cascade of finding 3). A number is `{ span: n }`. `ColSize` is `{ span?, offset?, push?, pull?, order?, flex? }`; each key cascades on its own. `xs` is the base for all widths. |
| `children`, `class`, `style`, native attributes | as in Row | | |

### Breakpoints (Q3)

`Breakpoints` is a small reactive class (no hook). `const screens = new Breakpoints()`; then `screens.xs` ... `screens.xxxl`
(booleans) and `screens.current` (`Breakpoint`, the largest that matches; `'xs'` below 576 px) are readable in markup and
in `$derived`. The flags follow finding 4: `xs` is true below 576 px, the others from their minimum width up. The values
are read from `matchMedia` at the moment of creation on the client, so they are **right on the first render**
(public issue 32533: React's hook returns an empty object there, "by design" for SSR hydration). On the server they come
from `options.fallback` (a `Breakpoint`, default `'xs'`), the same contract as Svelte's own `MediaQuery`. The listeners are
removed when nothing reads the values any more. The class also covers `xxxl` (public issue 52075).

### Constants

`BREAKPOINTS`: `{ xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600, xxxl: 1920 }` (minimum widths in px, the values of
all three libraries, the Bootstrap 4 widths). A unit test compares them with the `@media` widths written in `Row.svelte`
and `Col.svelte`, so the helper and the CSS cannot drift apart.

## Behavior

### Layout

- **ROW-1** The Row is `display: flex` with the content box of its parent (`width: 100%` of a block parent). It is exactly as
  wide as its parent for **every** gutter: no negative margin, no horizontal scrollbar from the Row itself (issues 10144, 13518).
- **ROW-2** `align`, `justify`: the mapping in the table; defaults `top` and `start`; each accepts the object form.
- **ROW-3** `wrap` (true): columns whose spans do not fit move to the next line as a whole; `false`: one line, the columns keep
  their widths and run past the end of the Row (`flex-shrink: 0`, as the `span` of all three libraries is a fixed width).
- **COL-1** A column of `span` s is `(100% + g) * s / 24 - g` wide, where `g` is the horizontal gutter in effect, and does not
  grow or shrink (`flex: 0 0` that width). Finding 2 is the reference: the content boxes of a Row measure the same as in the
  Ant Design demos at the same parent width and gutter.
- **COL-2** `offset` o: `margin-inline-start: (100% + g) * o / 24`. `push`/`pull`: `inset-inline-start` of the net
  shift, `position: relative`. All three are **logical**, so they mirror in right-to-left pages (React moved to logical
  properties in 6.0.0, change 52560); an e2e test covers `dir="rtl"`.
- **COL-3** `span` of `0` is `display: none`; the column leaves layout, the accessibility tree and the Tab order, and the
  neighbours close the gap. Responsively, `xs={0} md={8}` hides below `md` and shows from `md` (the common "hide on mobile").
- **COL-4** `flex`: the mapping in the table. A col with only `flex` and a col with `span` can share a Row.
- **COL-5** A column outside a `Row` is allowed and behaves as a column of a Row with no gutter (`g = 0`).
- **COL-6** A nested Row inside a `Col` fills the content box of that Col (there is nothing to compensate, unlike the
  negative-margin model).
- **COL-7** Many columns of one Row never wrap by rounding: **N equal columns that add up to 24** stay on one line for every
  parent width from 280 to 2000 px at gutters 0, 8, 16, 24, 32 and `2rem`, in three engines. This is a real risk of the
  `calc()` widths (the sum of the rounded widths and gaps can exceed the parent by 1/64 px); the mitigation is chosen in
  implementation, and if none holds, Q1 falls back to option A. **Result (Chromium, 2026-11-16):** no spurious wrap at any
  width from 280 to 2000 px, six gutters, thirteen partitions (more than ten thousand checked layouts); Firefox and WebKit
  are run by the same test. A layout is only checked where the formula leaves its narrowest column at least 1 px: with a
  negative width (24 columns of span 1 and a 16 px gutter at under 368 px) the line has to wrap, as in Ant Design's
  grid, and that is not a rounding error.

### Gutter

- **GUT-1** Horizontal value: `column-gap` of the Row, and the `g` of the width formulas. Vertical value: `row-gap`. A single
  value is horizontal only (vertical `0`), as in all three libraries.
- **GUT-2** A number is `n px`. A string is a CSS length passed as it is; an invalid or unitless string is treated as
  not given (`0`), never throws and never breaks the widths of the columns. `NaN`, `Infinity` and negative numbers: see P6.
- **GUT-3** The object form `{ xs: 8, md: 24 }` cascades: below the smallest given key the value is `0`; between keys, the
  next smaller one. Inside `[h, v]` each element can be a number, a string or an object.
- **GUT-4** Both responsive resolutions (gutter and `Col` sizes) are **CSS only**: the component writes the given values
  as custom properties on the element, and static `@media (min-width: …)` rules in the component choose between them.
  There is no `matchMedia`, no listener and no state in `Row` and `Col`.

### Responsive resolution

- **RES-1** The cascade of finding 3: the value at a width is the value of the largest breakpoint at or below it among those
  given, `xs` meaning "from 0". Each of `span`, `offset`, `push`, `pull`, `order`, `flex` cascades on its own (a breakpoint
  that gives only `span` keeps the `offset` of the smaller one).
- **RES-2** Breakpoints (min widths): `sm` 576, `md` 768, `lg` 992, `xl` 1200, `xxl` 1600, `xxxl` 1920. A width of exactly
  the minimum belongs to that breakpoint (public bug 57246: the `xxxl` mapping was wrong once); e2e tests resize across every
  boundary.
- **RES-3** A prop that is removed or changed later updates the layout and leaves nothing behind (public bug 59066: stale
  `align`/`justify` classes after the prop was removed or the breakpoint stopped matching).
- **RES-4** Server and client render the **same markup** and the same inline style: nothing depends on the viewport in
  JavaScript, so there is no hydration mismatch and no flash (public issues 29247, 29248, a Next.js user report of a different
  style on the server and on the client).

### Edge cases

- An empty Row renders an empty `<div>`; a Row with one column; a Col with no children.
- `span` greater than 24: the column is wider than the Row (allowed, as in all three libraries; no clamp).
- `offset` and `span` together that add up to more than 24: the column wraps to the next line (wrap on) or shrinks (off).
- A fractional `span` (`2.5`) works as written; it is not rounded.
- Columns whose formula width would be negative (a large gutter, many columns, a narrow parent) are `0` wide, and the line wraps
  (wrap on) or overflows (off).
- Changing `gutter`, `span` or a breakpoint value at run time re-lays the grid without remounting the children.

## A11y

- Row and Col are plain `<div>`s with **no role, name or state added**. They must not get table or grid roles (`row`, `cell`,
  `gridcell`): the 24-column "grid" is a layout, not a data grid, and those roles would make a screen reader announce a table.
  A consumer may add `role` or `aria-*` through the native attributes.
- **The reading order is the DOM order.** `order`, `push` and `pull` change only the visual order, so the Tab order and
  the screen-reader order can differ from what is drawn (WCAG 2.4.3 Focus Order, 1.3.2 Meaningful Sequence). None of the
  three documentations says so; our page and the API tables do (a warning next to `order`, `push` and `pull`), and a
  test pins that these props do not change the DOM order.
- `span` `0` is `display: none`, so the content is hidden from assistive technology as well as from view.
- No colors, no focus, no motion: no contrast, forced-colors or reduced-motion work (a Row has no background of its own).
- Axe checks cover a page of Rows and Cols in every combination of props (nothing to report).

## Colors and tokens

None. There is no new token: the grid draws nothing. The gutter default is `0`, as in all three libraries (Ant Design's
own examples recommend `16 + 8n` px; that is advice, not a default).

## Agreed decisions (2026-11-16)

1. **Q1: gutter is a flex `gap` (option B).** The Row is as wide as its parent; the visible content boxes equal Ant Design's
   (finding 2). Fallback to option A only if COL-7 cannot be made to hold in three engines; that would be recorded here.
2. **Q2: CSS only, fixed breakpoints (option A).** No JavaScript in `Row` and `Col`. Customizable breakpoints stay a possible
   additive extension (not reserved by name).
3. **Q3: `Breakpoints` class in v1.0 (option A).**
4. **Q4: `wrap` defaults to `true` (React).** P1 to P12 are accepted as written below.

The questions and the alternatives that were not chosen follow, as they were put to the maintainer.

## Decisions for the maintainer (workflow stage 2)

**Q1. How is the gutter built?**
- **A. As Ant Design does** (Row `margin-inline: -g/2`, every Col `padding-inline: g/2`). Same box model as the originals:
  a Col's background paints the gutter, `flex-basis` of a Col includes it. **Keeps the 8-year-old overflow bug** (10144).
- **B. With flex `gap` (recommended).** The Row is as wide as its parent, with no overflow. The visible content boxes are
  **identical** to Ant Design's (finding 2). Differences a consumer can see: (1) a Col's own background does not paint the
  gutter (demos put the visible box in an inner `div`, which looks the same); (2) `flex="100px"` or `flex="50%"` is the width
  of the content, not of content plus gutter; (3) a Row has no negative margin to compensate when nested. Risk: COL-7.
  Fallback if COL-7 cannot be made to hold: A.

**Q2. How are responsive values resolved, and can the breakpoints be changed?**
- **A. CSS only, fixed breakpoints (recommended).** No JavaScript for `Row` and `Col`, same markup on the server and the
  client, no flash. Breakpoints are the fixed values above, because **a media query cannot read a CSS variable**. Ant Design
  lets a theme change them (React 5.1.0, Vue 4.0.0). Customizable breakpoints could be added later (an additive prop that
  emits a scoped style, or a JS mode).
- **B. JavaScript `matchMedia` in `Row` and `Col`.** Breakpoints can be configured, as in React and Vue. Costs: a listener
  per Row, a flash on SSR and hydration (the source of 29247 and 32533), and the memory-leak class of bugs the NG-ZORRO
  changelog records for the grid (6408).

**Q3. The breakpoint helper.** React has `Grid.useBreakpoint()` (documented in a demo, not in the API table); Vue only links a sandbox for it.
- **A. A class `Breakpoints` in v1.0 (recommended).** Same names and values as `Col`, right on the first client render, an
  explicit server fallback, `xxxl` included; about half a day. The page gets one demo.
- **B. Not taken.** Svelte 5 already has `MediaQuery` in `svelte/reactivity`; the page would say so. No guarantee that the
  numbers match the grid's.
- **C. Deferred to v1.1.**

**Q4. React semantics where React and Vue differ.** Only one prop differs: **`wrap`**. React and Angular default to `true`,
the Vue docs to `false`. Proposed: **React (`true`)** (P1). Confirm, or choose the Vue default.

### Proposals (accepted together unless the maintainer objects)

- **P1** `wrap` defaults to `true` (Q4).
- **P2** The gutter object also takes strings per breakpoint (`{ xs: '1rem', lg: 32 }`), a small widening of the documented
  numbers-only object; free in CSS.
- **P3** Names: `Row`, `Col`, `Breakpoints`, constants `BREAKPOINTS`; types `Breakpoint`, `ColSize`, `Gutter`, `RowAlign`,
  `RowJustify`, `RowProps`, `ColProps`.
- **P4** `xxxl` (1920 px) is in `Col`, in the gutter object and in the responsive `align`/`justify` objects.
- **P5** `push` and `pull` together move the column by the **net** (`push − pull`); the originals leave this undefined.
- **P6** Numbers must be finite; `span`, `offset`, `push`, `pull`, `flex` (a number) and a numeric `gutter` must also be `≥ 0`, and
  `order` an integer (CSS needs one). An unknown key in a breakpoint object (`{ mdd: 1 }`) is outside the contract too. A violation throws a `RangeError` in
  development and tests and is treated as unset in a production build (the Button/Switch rule for enum props, extended).
  Strings are never validated, see GUT-2.
- **P7** `align`/`justify` outside their lists throw in development and tests and fall back to the default in production
  (the same Button/Switch rule).
- **P8** No `classNames`/`styles`, no `tag`/`as`, no ConfigProvider defaults (above).
- **P9** The page has no "Focus and blur" block (nothing to focus) and no method table (Row and Col have no methods).
- **P10** A `Col` outside a `Row` works with `g = 0` (COL-5).
- **P11** Right-to-left is logical properties (COL-2), tested at `dir="rtl"`.
- **P12** The Svelte minimum: `Breakpoints` needs `createSubscriber` and `matchMedia` (Svelte 5.7); the library already needs
  5.29 (`{@attach}`), so no new floor. The `peerDependencies` of `^5.0.0` is out of date for the library as it is
  (worth a separate fix, not part of this component).

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Row.test.ts` (no role or state is added; roles can be passed through), `tests/Col.test.ts` (order/push/pull keep the DOM order; span 0 leaves the tree), axe in both |
| Forced colors | n/a | the grid draws no color, background, border or shadow, so there is nothing for forced-colors mode to replace |
| IME | n/a | the grid has no text input, so there is no composition to test |
| Touch | n/a | not interactive: no pointer target, no gesture |
| Browsers | test | `e2e/grid.spec.ts` (geometry in Chromium, Firefox and WebKit: the width formula, no overflow, every breakpoint boundary, rounding sweep, `dir="rtl"`) |
| Browser floor | test | `npm run test:floor` (CSS audit and smoke of Row and Col on Chromium 90, Firefox 85, WebKit 15.4: flex `gap`, `inset-inline-start`, `margin-inline-start`, custom-property fallbacks) |
| Screen reader | n/a | no role, name or state is added, so there is nothing for a screen reader to announce; the one point that matters, the reading order equal to the DOM order, is pinned by `tests/Col.test.ts` |

## Список тестов

Every item above (ROW-*, COL-*, GUT-*, RES-*, the edge cases, the A11y points, `Breakpoints`, `BREAKPOINTS`) has at least one
test. Files:

- `tests/Row.test.ts`, `tests/Col.test.ts`: props, defaults, validation (P6, P7), object forms, removal of a prop (RES-3), `flex`
  forms including `0` (public bug 58719), the reset of the inherited custom properties is in the e2e test below, native
  attributes, the DOM order under `order`/`push`/`pull`, no role, no `matchMedia`, axe.
- `tests/Breakpoints.test.ts`: flags and `current` at each width including the boundary pixels and 575.5, first-read
  correctness (public issue 32533), the server fallback, listener cleanup, `xxxl`, the constants against the `@media` widths
  written in `Row.svelte` and `Col.svelte`.
- `tests/GridServer.test.ts` (through `tests/helpers/renderOnServer.mjs`): the server markup equals the client markup (RES-4).
- `e2e/grid.spec.ts` (Chromium, Firefox, WebKit; the lab `e2e/fixtures/GridLab.svelte`): the width formula with the numbers
  measured on the Ant Design demos (COL-1), no overflow (ROW-1), vertical and string gutters, the rounding sweep (COL-7), offset,
  push and pull, `dir="rtl"`, span 0, every breakpoint boundary one pixel on each side (RES-2), the cascade (RES-1), align,
  justify, wrap, flex forms, nesting and the reset of inherited properties (COL-6), `Breakpoints` in a real browser.
- `scripts/floor/smoke.cjs`, `gridPage` (`npm run test:floor`): the same geometry on Chromium 90, Firefox 85 and WebKit 15.4.
- `tests/docs/grid-page.test.ts` and the `Grid page` block of `docs/e2e/site.spec.ts`: the tables match the sources, every
  example renders and is built on a `stack` of `field` units, three languages, the groups of the playground are independent,
  the responsive demo follows a resize at the boundary pixel, the page does not scroll sideways on a phone. The order of the
  demos in the two columns is checked for this page by the shared test of the site.

## Implementation notes (2026-11-16)

- **The component does not look at the screen.** `layout.ts` turns the props into custom properties
  (`--ads-row-gx-<bp>`, `--ads-col-span-<bp>`, ...) and the static `@media (min-width: ...)` rules choose. Each chain gives a
  breakpoint the value of the next smaller one with `var(--own, var(--smaller))`. A value that is not given stays *invalid*, and a
  declaration that uses it is dropped at computed-value time, so a column without `span` keeps its content width.
- **Custom properties inherit, so the public ones are reset.** A Row in a Row (or in a Col) would take the gutter of the outer one,
  and a Col in a Col its span. `.ads-row` and `.ads-col` set every public variable to `initial`; the inline values of the
  component win over that. Found while writing the nesting test; covered by `e2e/grid.spec.ts` (COL-5 and COL-6).
- **A Row carries no inline style unless a value is given.** `align`, `justify` and `gutter` have no default in the destructuring;
  the defaults are in the stylesheet (`flex-start`, `flex-start`, `0px`). The page test knows this.
- **Black-box measurement changed two decisions** (finding 5, and `wrap`): a single-length `flex` string is a fixed width, and
  `wrap={false}` does not shrink the columns. The first draft of this document said "applied as written" and "the columns shrink".
- **Narrow parents.** A formula width can be negative (24 columns of span 1 with a 16 px gutter under 368 px); it is clamped to 0
  and the line wraps, as the Ant Design grid would. The sweep skips those layouts.
- **Defaults for the docs site.** `feat/grid` was brought up to `origin/docs/code-toggle-and-menu` (a fast-forward: that branch
  stands on `main`), because the demo grid, the `wide` flag and the English-only menu names of the page live there and not yet in
  `main`. Merging `feat/grid` therefore also carries those documentation commits.
- **The floor smoke** waits for the lab host as *attached*: it is an empty block with no height until a row is drawn.

## Docs page plan (stage 6, done)

One page `Grid`, 16 examples, each a `stack` of `field` units (caption above, component, output below): Basic, Gutter (number,
responsive, vertical, string), Offset, Push and pull, Justify, Align, Order, Flex, Wrap, Nesting, Hide a column, Responsive,
Responsive flex, More responsive, Playground, Breakpoints in code. `Responsive`, `More responsive` and `Playground` are
`wide: true`. The API tables: Row, Col, ColSize, Breakpoints, `BREAKPOINTS`. There is no method table and no token table. The
a11y notes sit in the "Accessibility" list of the page. A silhouette for the card on the overview page, a new "Layout" group in
the roadmap and the menus, and the home page chips are added.

## Исходник, консультации

None. The source of Ant Design was not read for this component.
