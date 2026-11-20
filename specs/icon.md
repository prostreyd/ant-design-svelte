# Icon specification

Status: **agreed with the maintainer on 2026-11-20 (workflow stage 2 done): Q1 A, Q2 A, Q3 A, Q4 A, Q5 A; P1 to P14 accepted as written** (see "Agreed decisions"). Implemented, tested and documented (workflow stages 3 to 6, 2026-11-20); what implementation found out is in "Implementation notes". Not committed: it waits for the maintainer's "запуш".

This is the **public** icon family. It is not `specs/icons.md`, which describes the private 16 x 16 set in `src/lib/internal/icons/` that the released components
draw their own chrome with (arrows, close, spinner). The two sets stay apart (see "Relation to the private set").

**Source.** The source code of Ant Design (React, Vue, Angular) and of its icon packages was **not read** for this component. The comparison uses documentation,
the issue tracker, the published manifests, black-box observation of the public demo, and the **data** of `@ant-design/icons-svg` (the drawings and their JSON
shape, which the package documents in its own README). The shape of one two-tone data module was read to see that its colors are a function of two arguments; that
module is data, not a mechanism. No section "Исходник, консультации" is needed (nothing was read under rule 3a); the section at the end says so.

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/icon.md> (the page's markdown) and the `@ant-design/icons` README | `@ant-design/icons` 6.3.4, `antd` 6.7.1, 2026-11-20 |
| Ant Design Vue | `components/icon/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) and the `icons-vue` README | `@ant-design/icons-vue` 7.0.1, 2026-11-20 |
| NG-ZORRO (Angular) | `components/icon/doc/index.en-US.md` in the repository (docs text only) | `ng-zorro-antd` 22.2.0, `@ant-design/icons-angular` 22.1.1, 2026-11-20 |
| Icon data | `@ant-design/icons-svg` 4.6.0: README (the `IconDefinition` shape), manifest, the list of file names in the tarball (848 icons) | 2026-11-20 |
| Issue tracker | `ant-design/ant-design-icons` 478, 684, 533 (read through the GitHub API, code removed from the text) | 2026-11-20 |
| Black-box | the public demo <https://ant.design/components/icon>, Chromium under Playwright 1.65, 1280 px, with and without `prefers-reduced-motion` (results below) | 2026-11-20 |

## Agreed so far

**How the icons arrive (the maintainer, 2026-11-20, "да" to the plan).** Like React, Vue and Angular, we do **not** copy drawings into the repository. The data package
`@ant-design/icons-svg` (MIT, 848 icons, no dependencies, no peer dependencies, `sideEffects: false`) goes into `dependencies`, and the library ships its own Svelte
wrappers around it: one component per icon with the same name as in React (`StarOutlined`, `StarFilled`, `StarTwoTone`) and one generic `Icon`. The MIT notice travels with
the dependency (it is in the package in the user's `node_modules`); nothing of Ant Design's is copied here. This reverses the proposal "do not take the package" in
`ai/dependencies.md` (row `@ant-design/icons-svg`), which had not been confirmed; that row is rewritten when this spec is agreed.

## What it is

An **icon** is a small vector picture the size of the surrounding text (`1em`), in the color of the surrounding text (`currentColor`), drawn from a data definition. Three
themes exist for most drawings (`Outlined` 447, `Filled` 251, `TwoTone` 150 in 4.6.0), and the component name is the drawing name plus the theme. Icons are not
interactive by themselves (no focus, no keyboard); a click handler on them is the owner's business, and an icon inside a button is named by the button.

The parts (all in the three libraries unless noted):

1. **The icon components**, one per definition: `<SmileOutlined />`, with `spin`, `rotate`, `twoToneColor` and ordinary element attributes.
2. **The generic `Icon`**: draws a definition (`icon`), or a custom component (`component`), or custom content, with the same props.
3. **Two-tone colors**, per icon and globally (`setTwoToneColor` / `getTwoToneColor`).
4. **`createFromIconfontCN`** (React and Vue; Angular has `fetchFromIconfont`): icons from an iconfont.cn project (SVG sprite).

Exports: the generic **`Icon`**, the **`IconFont`** factory `createFromIconfontCN`, `setTwoToneColor`, `getTwoToneColor`, the types, and the 848 icon components (where they
live is Q2). Files: `src/lib/Icon/Icon.svelte`, `types.ts`, `twoTone.svelte.ts`, `iconfont.ts`, and the generated `src/lib/icons/*.svelte`.

## Black-box findings (2026-11-20)

Measured on the public demo of <https://ant.design/components/icon> (React, `@ant-design/icons` 6.x), Chromium:

1. **Structure.** `<span role="img" aria-label="<name>" class="anticon anticon-<name>"><svg viewBox="64 64 896 896" focusable="false" data-icon="<name>" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="…"/></svg></span>`.
   The wrapper is a `span`; the `svg` is hidden from assistive technology; the span carries the name. 816 of the 848 drawings use `viewBox="64 64 896 896"`, 32 use `0 0 1024 1024`
   (`loading` is one of them). The label is the English drawing name in kebab-case (`info-circle`), the same text as in the class.
2. **Layout.** The wrapper is `display: inline-flex; align-items: center; color: inherit; font-style: normal; line-height: 0; text-align: center; text-transform: none; vertical-align: -0.125em;
   text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased`, its children `line-height: 1`; the svg is `display: block`. At 14 px the wrapper is 14 x 14; at 24 px it is 24 x 24.
3. **Spin.** `spin` adds `anticon-spin` to the **wrapper** (not the svg): the animation `1s linear infinite` turns the whole span. A bare `<LoadingOutlined />` turns **without** `spin`
   (the demo code passes no prop; the wrapper has the class). With `prefers-reduced-motion: reduce` the animation is **unchanged** (still 1 s, infinite), unlike our private icons.
4. **Rotate.** `rotate={180}` is an inline `transform: rotate(180deg)` (plus the old `-ms-transform`) on the **svg**, not on the wrapper.
5. **Two-tone.** The drawing has two or three paths with `fill` set from two colors: `<SmileTwoTone />` with no color gives `#1677ff` (primary) and `#e6f4ff` (secondary), `twoToneColor="#eb2f96"` gives
   `#eb2f96` and `#fff0f6`, `#52c41a` gives `#52c41a` and `#f6ffed`. So with **one** color the second is **derived** (the lightest shade of the ten-step palette of that color); with a pair
   `[primary, secondary]` nothing is derived. The default primary is the library's blue.
6. **Tab order.** None of the demo icons has `tabindex`. (An icon with a click handler was not on the demo page, so what the React package does for it is **not observed**.)
7. **Not observed:** the Vue and the Angular output (the sites render on the client or load the icons over HTTP); their structure is taken from their documentation only.

## Differences between the three libraries

**Presence.** All three have it, but it is **not a component of the library itself** in any of them: it is a separate package of the same team (`@ant-design/icons`, `icons-vue`, `icons-angular`)
that the component library depends on (`antd`, `ant-design-vue` and `ng-zorro-antd` list it in `dependencies`).

| Topic | React (`@ant-design/icons` 6) | Vue (`icons-vue` 7) | Angular (`icons-angular` 22) | Our decision |
|---|---|---|---|---|
| How an icon is used | `<StarOutlined />`: one component per drawing and theme | the same, registered or imported as a component | `<span nz-icon nzType="star" nzTheme="outline">`: a **string name**, theme as a prop | one component per drawing and theme, like React and Vue; string-name use is **not taken** (below) |
| Theme | in the component name (`Outlined`, `Filled`, `TwoTone`) | the same | prop `nzTheme`: `'fill' \| 'outline' \| 'twotone'` (**`fill`**, while the data says `filled`) | in the name; the Angular spelling is a semantic difference, not taken |
| `spin` | boolean, default `false` | the same | `nzSpin` | core (P1) |
| `rotate` | number, degrees | the same | `nzRotate` | core (P2) |
| `twoToneColor` | `string \| [string, string]` | docs: `string (hex color)`; the type in the code accepts the pair too (issue 533: a warning when a pair is passed) | `nzTwotoneColor`: string | `string \| [string, string]` (React, the widest); see Q4 |
| Global two-tone color | `setTwoToneColor()` / `getTwoToneColor()` | the same | the config service (`nzIcon.nzTwotoneColor`) or a set method | core (P3) |
| `style` / `className` | on the wrapper (`className`, `style`) | `class`, `style` | native | `class` and `style` on the wrapper (P4) |
| Event handlers | `onClick` and the element attributes on the wrapper (typed on the `svg` in the README) | listeners | native | the element attributes of the wrapper pass through (P4) |
| Custom drawing | `<Icon component={Svg} />`: a component that renders an `svg` and gets `width`, `height`, `fill`, `className`, `style` | the same | `addIconLiteral()` (an SVG string, optionally in a `namespace:name`) | `component` and a `children` snippet (P5) |
| iconfont.cn | `createFromIconfontCN({ scriptUrl: string \| string[], extraCommonProps })` | the same, `scriptUrl: string`, `extraCommonProps` with Vue fields | `fetchFromIconfont()` and `nzIconfont` | Q5 |
| Loading the drawings | static import, tree-shaken | the same | **static** (`provideNzIcons`) or **dynamic**: an HTTP request for `assets/<namespace>/<name>.svg` for any name not registered | static import only; dynamic loading is **not taken** (P6) |
| Global defaults | none for the icon props: the "Global Config" column of the React table is `×` for every prop; the two-tone color has its own functions | the same (docs only) | `NzConfigService`: `nzTheme` and `nzTwotoneColor` have a global default (the column is marked) | the two-tone color only, by the functions (P3); a provider for more is reserved (below) |
| Name on the wrapper | `role="img"` and `aria-label=<name>`, English, not translatable (issue 478, open since 2021) | the same (docs only) | not observed | Q3 |

**Value forms (rule 5, point 4).** `spin`: boolean in all three. `rotate`: number in all three (we take a number, in degrees). `twoToneColor`: string in Vue's docs and Angular, string or
pair in React and in Vue's code; we take both forms. `style`: an object (React, Vue) or a string; in Svelte every component of this library takes the element's own `style` (a string) through
the element attributes, and so does this one. `component`: a component in React and Vue; we take a Svelte component, and add the `children` snippet. `scriptUrl`: string, or an array of strings
(React 4.1.0 and later); we take both. Nothing is narrowed except where the table says "not taken".

**Deprecated names.** None in the three icon packages: no struck-through props in the React table, no `deprecated` marks in the Vue and Angular docs. The React page lists `rotate` and `spin` as
"not working in IE9"; that note is obsolete and is not carried over. The old font-icon API (`type="home"` on a generic `<Icon>`, replaced by SVG components in React 3.9.0, Vue 1.2.0) is gone from
all three and is not taken.

**Known weak points in the public traces** (they become requirements below):
- The label is English and cannot be translated by the user (issue 478, 2021, still open). The consumer cannot replace it without losing the `role`.
- One drawing (`ShareAltOutlined`) renders badly at 12 px and well at 13 px (issue 684, open): rasterization of a drawing on a pixel grid. We cannot fix a drawing; the docs mention it.
- Vue's `twoToneColor` prop type disagrees with its own docs and types (issue 533): the pair form warns. We type the prop once, as `string | [string, string]`.

## Scope v1.0

- **Core (in React and Vue with the same meaning; mandatory):** an icon component per drawing and theme; `spin`; `rotate`; `twoToneColor` (string and pair); `setTwoToneColor` / `getTwoToneColor`;
  the generic `Icon` with `component`; `class` and `style`; `createFromIconfontCN` (Q5).
- **Cheap React additions (each is under a day; P-items):** the element attributes of the wrapper pass through (`onclick`, `tabindex`, `data-*`); a `label` prop that replaces the accessible name (answers
  issue 478); a `children` snippet as custom content (the idiom of this library for what React does with a component).
- **Deferred to v1.1+ (name and contract reserved):** a context provider for icon defaults (more than the two-tone color; Angular's config service has a default for the theme too), if a real use appears; a registry for
  string names, if string names are asked for (see "Not taken"). Reserved: an additive `IconProvider` component and an additive `name` prop on `Icon` that looks a definition up. Neither is breaking.
- **Not taken, Angular-only:** string names with dynamic loading over HTTP (`nzType` plus `assets/...`), `changeAssetsSource()`, namespaces `zoo:panda` (P6). In Svelte an icon is a normal import, tree-shaken
  by the bundler; a request per icon at run time costs a flash of nothing and does not work offline or under a strict CSP. `addIconLiteral` is covered by `Icon` with `children`.
- **Not taken, old API:** the font-based icon, `type="..."` on `Icon` (gone from all three).

## API

`Icon` and every icon component take the same props. Types in `src/lib/Icon/types.ts`.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `icon` | `IconDefinition` | — | **`Icon` only.** The data of one drawing: `{ name, theme, icon: AbstractNode \| (primary, secondary) => AbstractNode }`. The type is declared here, structurally equal to the package's (so a definition from `@ant-design/icons-svg` is assignable), so that the package is imported by one file only. |
| `component` | `Component<IconComponentProps>` | — | **`Icon` only.** A Svelte component that renders an `<svg>`; it receives `width="1em"`, `height="1em"` and `fill="currentColor"`. |
| `children` | `Snippet` | — | **`Icon` only.** Custom content, an `<svg>`; the wrapper, `spin` and `rotate` apply to it. Wins over `component` and `icon` if several are given (P5). |
| `spin` | `boolean` | `false` (`true` for the `loading` drawing, as in React) | the wrapper turns once a second, endlessly; slower under reduced motion (P7). |
| `rotate` | `number` | — | degrees, applied to the svg (not to the wrapper). |
| `twoToneColor` | `string \| [string, string]` | the global value | two-tone drawings only; one color derives the second (Q4). Ignored by `Outlined` and `Filled`. |
| `label` | `string` | the drawing name | the accessible name; `''` hides the icon (Q3). |
| `class` | `string` | — | added to the wrapper classes (`ads-icon`, `ads-icon-<name>`). |
| everything else | `HTMLAttributes<HTMLSpanElement>` | — | passed to the wrapper: `style`, `onclick`, `tabindex`, `data-*`, `aria-*`. |

Functions: `setTwoToneColor(color: string \| [string, string])`, `getTwoToneColor(): [string, string]`. `createFromIconfontCN({ scriptUrl, extraCommonProps })` returns a component with a `type` prop (Q5).
`IconDefinition`, `AbstractNode` and `IconComponentProps` are exported as types.

## Behavior

- **I1. Markup.** One wrapper `<span>` with `class="ads-icon ads-icon-<name>"` (and the custom `class`) holds one `<svg viewBox width="1em" height="1em" fill="currentColor" focusable="false" aria-hidden="true">`
  built from the definition: its `viewBox`, its `path`, `g`, `defs`, `style` nodes and their attributes. All 848 drawings use only these tags: 1200 `path` nodes everywhere, and three drawings
  (`DotNetOutlined`, `LoginOutlined`, `RestOutlined`) also use two empty `style` nodes, two `defs` and one `g`. The `data-icon` attribute carries the name.
- **I2. Layout.** The wrapper is `display: inline-flex`, centered, `line-height: 0`, `vertical-align: -0.125em`, `color: inherit`; the svg is `display: block`. The size is `1em`: the owner sets `font-size` and `color`
  on the icon or on a parent, as with every component of this library. The pixels of the wrapper match the measurements above (14 px gives 14 x 14).
- **I3. Spin.** `spin` (or the `loading` drawing) turns the wrapper once in 1 s, linear, endlessly (the measured value). Under `prefers-reduced-motion: reduce` it turns slower, with the token
  `--ads-motion-duration-spinner-reduced` (P7, a **difference from Ant Design**, which does not change the animation).
- **I4. Rotate.** `rotate` is `transform: rotate(<n>deg)` on the svg. `rotate` and `spin` together both apply (the spin on the wrapper, the rotation on the svg).
- **I5. Two-tone.** The definition's function gets `(primary, secondary)`. With one color the secondary is derived (Q4); with a pair both are used. With no `twoToneColor` the global value is used, and
  `setTwoToneColor` changes every icon without its own value, **reactively** (an icon on screen updates). The default is the theme blue: primary `var(--ads-color-primary)`, secondary a light shade.
  The colors are written as `style="fill: …"` (a `var()` is not valid in the `fill` attribute).
- **I6. Custom drawing.** `component` receives `width`, `height` and `fill` (not `class` or `style`: the rotation reaches the svg of a component and of `children` through the wrapper, see "Implementation notes"); `children` is drawn inside the wrapper. Both get `spin`, `rotate`, `class`, `style` and the label like a definition.
- **I7. Server rendering.** The same markup on the server and the client; no browser API at import or render time. `createFromIconfontCN` does nothing on the server.
- **I8. Styles.** Scoped to the icon: no global CSS. One shared `@keyframes`, with a name of ours.
- **I9. Tree-shaking.** Importing one icon bundles that drawing and the shared `Icon` only, not the other 847; the package says `sideEffects: false` for its data, ours has no side effect at import (the global color is a lazily created state).
- **I10. Iconfont (if Q5 is yes).** `createFromIconfontCN({ scriptUrl })` appends one `<script src>` per distinct URL once (and not twice for the same URL, in any number of calls), the sprite symbols the script
  injects are drawn with `<svg><use xlink:href="#<type>"/></svg>` (not `href`: note 11) in the same wrapper (`spin`, `rotate`, `class`, `style`, label), an array of URLs is loaded in order and **a later URL overrides an earlier one for a duplicate
  name** (the example in the React docs), `extraCommonProps` are passed to the wrapper.

## A11y

- **A1 (Q3).** The wrapper has `role="img"` and `aria-label=<label>`; the svg is `aria-hidden="true"` and not focusable (`focusable="false"`). Default label: the drawing name, as in React. `label` replaces it (the answer to
  issue 478); `label=""` removes the role and the name and sets `aria-hidden="true"` on the wrapper (a decorative icon next to visible text).
- **A2.** An icon is never in the tab order by itself. If the owner adds `onclick`, the owner also adds `tabindex` and a `role="button"` or wraps it in a `<button>`: the docs say so, and the docs example does it with a
  button. (What React does for an icon with `onClick` is not observed; we do not add `tabindex` silently.)
- **A3.** The `loading` drawing and every `spin` icon give no live announcement; the owner of a loading state announces it (as with `Spin`).
- **A4.** Color: an icon in `currentColor` takes the contrast of its text; a forced-colors mode maps it to a system color. Two-tone fills are explicit colors; the docs say that a two-tone icon is decoration and that its
  light shade is **not** a contrast carrier (it is below 3:1 on white by design).

## Colors and tokens

- No color of its own for `Outlined` and `Filled`: `fill="currentColor"`.
- Two-tone: `--ads-icon-twotone-primary` (default `var(--ads-color-primary)`) and `--ads-icon-twotone-secondary` (default `#e6f4ff`, a dark-theme value too). Both are **new, additive** tokens in `tokens.css`; there is
  no `--ads-color-primary-bg` token today. When `twoToneColor` is set, the inline value wins over the token.
- No size token: the size is `1em` of the owner.

## Relation to the private set

`src/lib/internal/icons/` (14 shapes on a 16 x 16 grid, one stroke weight) stays as it is: the pixels of the four released components (Message, Select, Input, Menu) must not change, and the two sets must not be mixed in one component
(a different grid and line weight). New components that need an icon **identical to Ant Design's** (Alert, Result, Pagination, Upload, DatePicker, Typography's `copy`, `edit` and `enter`) take it from the public icons, by importing
the component or the definition; `internal/` does not import components (rule 6b), so a component does it, not the private set.

## Agreed decisions (2026-11-20)

The maintainer answered **A to all five questions and accepted P1 to P14** ("все А, остальные пункты считаю принятыми"):

1. **Q1 A.** A component for every drawing, brand marks included, with a line in the docs that the marks belong to their owners.
2. **Q2 A.** A second entry `svelte-ant-design/icons` (the barrel) and `svelte-ant-design/icons/<Name>` per icon; the main entry has `Icon`, the functions and the types.
3. **Q3 A.** `role="img"` and `aria-label` = the drawing name, a `label` prop that replaces it, `label=""` hides the icon.
4. **Q4 A.** `@ant-design/colors` (with `@ant-design/fast-color`) in `dependencies`, one adapter file.
5. **Q5 A.** `createFromIconfontCN` in v1.0.
6. **P1 to P14** as written below.

The questions stay below as they were put.

## Decisions for the maintainer (workflow stage 2, as they were put)

**Q1. The 113 brand marks (of 848).** The set contains logos of other companies: Alipay, Amazon, Android, Anthropic, Apple, Behance, Bilibili, Chrome, Github, Google, Instagram, Linkedin, Slack, Taobao, TikTok, Twitter, Wechat,
Weibo, Youtube and others (83 drawing names in my count, which is a list I wrote and may be incomplete). The MIT licence covers the drawing, not the trademark. Because the drawing comes **through the dependency**, we copy nothing either way.
- **A (recommended).** Generate a component for every drawing, like React. Migrating code keeps working; the docs gallery shows them as the original does, with a line that the marks belong to their owners. I first suggested
  leaving them out; I changed my mind because nothing is copied and parity is the point of this component.
- **B.** Generate components only for the other 735 drawings; the brand marks stay reachable through `Icon` with `icon={GithubOutlined}` imported from the data package by the user.

**Q2. Where the 848 components live.** The package has one entry point today (`.`), plus the token files.
- **A (recommended).** A second entry `svelte-ant-design/icons` (the barrel of 848 exports) and `svelte-ant-design/icons/<Name>` per icon, like React's `@ant-design/icons` and `@ant-design/icons/SmileOutlined`. The main entry stays small (`Icon`,
  the functions, the types): dev servers do not pre-bundle 848 modules to find one button. Migration is a change of the import path from `@ant-design/icons` to `svelte-ant-design/icons`.
- **B.** All from the main entry (rule 6b's "one entry point"). Simpler path, but a 848-line `index.ts`, and slower dev servers.

**Q3. The accessible name of an icon.**
- **A (recommended).** As in React: `role="img"` and `aria-label` = the English drawing name, plus a `label` prop that replaces it and `label=""` that hides the icon (above). Parity first; the known weakness (issue 478) gets a way out.
- **B.** Decorative by default (`aria-hidden`, no role); `label` makes it an image with a name. Better for screen readers on a site not in English, but a deviation from React, and rule 5a takes React's meaning as the reference.

**Q4. The second color of a two-tone icon.** With `twoToneColor="#eb2f96"` Ant Design draws the secondary part in `#fff0f6`: the lightest shade of the ten-step palette of that color (measured above). Reproducing it needs the palette function.
- **A (recommended).** Add `@ant-design/colors` (MIT, its only dependency is `@ant-design/fast-color`) to `dependencies`: React, Vue and Angular **all** depend on it. Exact secondary colors for any primary. It is candidate no. 1 in
  `ai/dependencies.md` (row `@ant-design/fast-color` and `colors`), where it was waiting for the first user; this is the first. One adapter file imports it (`twoTone.svelte.ts`); its browser floor goes through `test:floor`.
- **B.** No package: `twoToneColor` is the pair `[primary, secondary]` only, and a single string draws the secondary as a fixed light blue (or the primary at low opacity). Simpler and smaller, but the single-color form
  stops matching React, and a migration from React shows different colors.
- (Own palette code is a third way, but it duplicates a published algorithm, costs more than a day to match, and the project's rule is to prefer a package that passes the criteria.)

**Q5. `createFromIconfontCN`.** In React and Vue (core by rule 5a), in Angular as `fetchFromIconfont`. It loads a script from a URL the owner gives (iconfont.cn, a Chinese service) that puts SVG symbols in the page, then draws them with `<use>`.
It is small (about half a day, with a test that serves a fake script locally) and the zh audience of this library uses it, but it injects a remote `<script>`, which the docs must say plainly.
- **A (recommended).** In v1.0, as the rule says.
- **B.** Deferred to v1.1, name and contract reserved (`createFromIconfontCN({ scriptUrl, extraCommonProps })` returns a component with a `type` prop); additive later.

## Proposals (accepted unless the maintainer objects)

- **P1.** `spin` is a boolean prop, default `false`, `true` for the `loading` drawing (observed in React).
- **P2.** `rotate` is a number of degrees on the svg.
- **P3.** `setTwoToneColor` and `getTwoToneColor` as module functions over a reactive state; call once at start-up (on the server the state is shared by all requests, so it is for a fixed theme, not per user: the docs say so).
- **P4.** The wrapper's element attributes pass through (`style`, `onclick`, `tabindex`, `data-*`), the `class` is merged; no `classNames` and `styles` (an icon has one element; the wrapper is the root).
- **P5.** `Icon` takes `icon`, `component` or `children`; if more than one is given, `children` wins, then `component`, then `icon` (a documented order, tested).
- **P6.** No string names and no dynamic loading (Angular's `nzType`); an `iconRegistry` and a `name` prop are reserved for v1.1 (additive).
- **P7.** `spin` slows under `prefers-reduced-motion` (a deliberate difference from React; the private spinner does the same). Recorded as a difference in the docs.
- **P8.** The generated components are **committed** (848 small files in `src/lib/icons/`, produced by `npm run generate:icons` from the installed `@ant-design/icons-svg`), with a test that fails when they differ from what the
  generator would write. The alternative (generate on every build) puts a step in lint, check, test, package and the CI workflows. The generated header says: generated, do not edit, data from `@ant-design/icons-svg` (MIT).
- **P9.** The package is imported by **one adapter** (`src/lib/Icon/data.ts`: the generated files import their drawing through it, and `twoToneColor` imports `@ant-design/colors` through its own single file), so that
  criterion 3 of `ai/dependencies.md` (replaceable without changing the public API) holds.
- **P10.** The docs page has a **gallery**: a search box, a theme control (All, Outlined, Filled, TwoTone; All is the first and the default: a name is followed by its themes, as on that list) and the drawings in **the six groups of the Ant Design list, in its order** (added 2026-11-20 at the maintainer's request), click to copy the name; plus examples of each prop. A
  gallery of 848 items is not drawn all at once on the server: the server sends the first chunk and the page draws the rest as soon as it has loaded.
- **P11.** `README` and the docs page say what is not checked ("not checked with a screen reader", until the Orca test exists) and that a drawing can look uneven on a pixel grid (issue 684).
- **P12.** Version: a new component is **+0.1.0** (`0.14.1` to `0.15.0`); a new dependency pair (`@ant-design/icons-svg`, `@ant-design/colors`) is named in the changelog.
- **P13.** The test for each requirement goes in `tests/Icon.test.ts` (unit, a11y, server render), `e2e/icon.spec.ts` (three engines: spin and rotate really turn, no layout change between `Outlined` and `Filled`, `g` and `defs`
  drawings render in the SVG namespace), the docs page test, and the floor smoke.
- **P14.** The release gate: the npm package size is measured before and after (`npm pack --dry-run`); the 848 wrappers must not make the package larger than a few hundred kilobytes (the data is in the dependency).

## Dependencies

(Step 0 of rule 4, rule 6b, `ai/dependencies.md`.) Checked against `origin/main` 4f2bf5b on 2026-11-20.

- **Whole components:** none. `Icon` imports no other component.
- **Primitives in `internal/`:** none needed (`semantic.ts` for `classList` only). The private `internal/icons/` is **not** imported (the sets stay apart).
- **Shared state:** the global two-tone color is a module with runes (`twoTone.svelte.ts`).
- **Packages:** `@ant-design/icons-svg` (the maintainer agreed, 2026-11-20; passes the five criteria: replacement is more than a day and a migration would see different drawings; pure data, no dependencies, no peer
  dependencies; one adapter file; browser floor to be proven by `npm run test:floor`; this record). `@ant-design/colors` and its dependency `@ant-design/fast-color` **only if Q4 is A**; one adapter file; floor the same way.
- **What is missing in `origin/main`:** nothing that Icon needs. (`ai/dependencies.md` rows for the two packages change; `scripts/check-architecture.mjs` gets the new package names in its `DEPENDENCIES` list with a reason: that is part
  of the implementation, after the agreement.)
- **Who will use it:** Typography (`copy`, `edit`, `enter`, in the worktree `feat/typography`, which today has no such icons), and later Alert, Result, Pagination, Upload, DatePicker.

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/IconComponent.test.ts`: role, name, `label`, `label=""`, hidden svg, no focus, axe; `e2e/icon.spec.ts`: the name as each engine exposes it |
| Forced colors | n/a | the icon is drawn in `currentColor`, which a forced-colors mode maps to a system color; a two-tone icon is decoration and never carries state |
| IME | n/a | no text input: an icon is only drawn, nothing is typed into it |
| Touch | n/a | not interactive; a clickable icon is the owner's element (the docs example uses a button) |
| Browsers | test | `e2e/icon.spec.ts`: layout, spin, rotate, two-tone colors, SVG namespace of `g` and `defs`, the accessible name, the iconfont.cn font, in three engines |
| Browser floor | test | `npm run test:floor`: the Icon page of the smoke (six checks, passed 2026-11-20 on all three engines); it also proves that the data package and the color package run on Chromium 90, Firefox 85 and WebKit 15.4 |
| Screen reader | manual pending | an Orca test (`screen-reader/icon.spec.ts`) is planned after the maintainer agrees; until then the README and the page say "not checked with a screen reader" |

## Список тестов

Each requirement has at least one test. The files: `tests/IconComponent.test.ts` (unit, a11y), `tests/IconServer.test.ts` (server render, in a process of its own),
`tests/iconfont.test.ts`, `tests/iconsGenerated.test.ts`, `tests/IconBundle.test.ts` (a real build), `e2e/icon.spec.ts` (three engines), the floor smoke
(`scripts/floor/smoke.cjs`, `iconPage`), `tests/docs/icon-page.test.ts` and the `Icon page` tests of `docs/e2e/site.spec.ts`. The name of a test starts with the item.

- I1: the markup of a drawing (attributes, `data-icon`, the paths of the definition); the drawings that use `g`, `defs` and `style` are drawn whole and every node is in the SVG namespace (unit, and in a real
  engine: the drawing has a size, which it would not in the HTML namespace); the viewBox is kept; nothing is rendered with nothing to draw.
- I2: the classes (`ads-icon`, `ads-icon-<name>`, `class`), `style`, the attributes of the wrapper and a click handler; in a real engine the 14 and 24 px boxes, `inline-flex`, `line-height: 0`,
  `vertical-align: -0.125em`, the color and size of the text, and that the box and the neighbours do not move when the drawing, the theme, spin, rotate or the name change, with different shapes and
  viewBoxes, and frame after frame while it spins (the rule of rule 7, "layout on state change").
- I3, P1, P7: `spin` and its classes, the `loading` drawing and `spin={false}`; in a real engine a running animation of 1 s, linear, endless, and 2.5 s under reduced motion.
- I4, P2: `rotate` (the angle on the wrapper, the marker class, 0, NaN, Infinity, with spin); in a real engine the matrix on the svg (90, 180, -90), none on the wrapper, the center kept.
- I5, P3: no color gives the token colors; one color derives the second (`#1677ff` to `#e6f4ff`, `#eb2f96` to `#fff0f6`, `#52c41a` to `#f6ffed`, the three measured pairs); a pair is used as given; a CSS variable
  keeps the default second color; outlined and filled ignore it; `setTwoToneColor` repaints an icon that is on screen and `getTwoToneColor` returns a copy; the dark theme; the colors the browser paints.
- I6, P5: `component` gets `width`, `height`, `fill`; `children` is drawn; the order of precedence.
- I7: the server markup equals the markup of a browser render for twelve scenes (plain, ready component, two-tone with and without a color and with a pair, spin and rotate, loading, label, hidden, custom
  component, children, iconfont), with the data package loaded by Node itself.
- I8: every selector of the style block starts at the icon, one keyframes name of ours, nothing global.
- I9: a build of one icon from the barrel holds that drawing and not the others and is under a twentieth of the build of all of them.
- I10: one script per URL (however many fonts and calls), the order of an array, nothing for no URL, the `use` markup, `label`, `spin`, `rotate`, `class`, `style`, `extraCommonProps` (the icon's own prop wins, two fonts do not
  share props); in a real engine a sprite is drawn, and a later script overrides an earlier one even when the earlier arrives last.
- A1 to A4: the role and name, `label`, `label=""`, an `aria-label` of the owner, a custom drawing is hidden until labelled, no tab stop, no live region, an axe run without a violation of WCAG 2 A and AA; the name in each engine.
- P8: the committed components are what the generator writes now and none is left over; every drawing of the package has a component and the barrel exports exactly those; a generated file holds no drawing; every one of
  the 848 components renders its own drawing (its paths, its name, the number of its nodes).
- Docs page: the API table is the props of `types.ts` (names, types, defaults), the functions table is what the package exports, the token table is `tokens.css` (and the dark theme), one example per demo in order,
  every example renders icons of the real library with every image named, no loose text at the root, every prop and function appears in an example, no two groups bind one variable, the global color is put back when the
  example leaves; in the browser, every example shows its own source, the gallery searches, filters, copies and shows more, the page keeps its reading order in two columns, the code toggle and the layout on a phone.

## Implementation notes (2026-11-20)

What the implementation found out, and where it differs from the draft:

1. **A dynamic element needs its namespace said.** `<svelte:element>` inside a snippet that renders the nodes of a drawing makes the elements in the HTML namespace (a `path` with no size) unless each carries
   `xmlns="http://www.w3.org/2000/svg"`. A unit test and a real-engine test (the drawing has a size) hold it.
2. **Each drawing is imported from its own ES file, with the extension.** A named import from the package root (`import { StarOutlined } from '@ant-design/icons-svg'`, which is what the first version of `data.ts` did through
   `export *`) works on Node 24 and **not on Node 22**: the package is CommonJS, and Node finds the names of a CommonJS module by a scan of its source, which finds all 851 on Node 24 and two on Node 22 (`default` is
   `module.exports` on both). The server render drew nothing on the Node 22 that CI runs (the local machine had Node 24, so only CI saw it: ten failures of `tests/IconServer.test.ts`), and a SvelteKit server on Node 22 would
   have drawn nothing either. The ES files `@ant-design/icons-svg/es/asn/<Name>.js` load natively on Node 22 and 24 (Node recognizes the ES syntax of a file in a package that is not `type: module`; **without the extension
   they are not found**) and in every bundler, and each is a module of its own, so a bundler keeps only the drawings that are imported (`IconBundle.test.ts`, the packaging test). `data.ts` is therefore generated with one
   re-export per drawing (`npm run generate:icons`), and a test fails on an import from the package root anywhere in `src/lib/`. The generator itself reads the names through `default` for the same reason.
3. **`generate()` of `@ant-design/colors` never throws.** On text that is not a color it returns a dark grey (`#404040`), so a CSS variable or `currentColor` is detected first and keeps the default second color.
4. **A `var()` is a style declaration, not a `fill` attribute**: a path whose fill is a `var(...)` gets `style="fill: ..."`; a literal color stays an attribute.
5. **The rotation goes through the wrapper.** `rotate` sets `--ads-icon-rotate` on the wrapper and the svg child turns by it, so it reaches the svg of a `component` and of `children` too, and `spin` (on the wrapper)
   keeps working at the same time. `component` therefore gets `width`, `height` and `fill` only (the draft said `class` and `style` too).
6. **`spin={false}` stops the `loading` drawing.** In React the bare `LoadingOutlined` was observed to turn without the prop; what `spin={false}` does to it was not observed. Ours stops it (an explicit value wins).
7. **A custom drawing with no `label` is hidden** (`aria-hidden`, no role): an image with no name is a defect. React's custom icon has the role and no name (not observed in detail).
8. **`createFromIconfontCN` returns `(internals, props) => IconFont(internals, props + the shared ones)`**: the shared props are added behind the real props with a `Proxy`, so the props stay reactive and the icon's own wins. The
   scripts run in the order of the list (`async = false`). The public sprite script that iconfont.cn generates (the example in the React docs) was read for how it inserts its symbols: it puts its `<svg>` at the **start** of the
   body, so a later script's symbols come first and win a duplicate name, which is "later overrides earlier" (tested with a fake script that does the same).
9. **Server rendering through Vite loads the data package with Node itself** (`tests/IconServer.test.ts`, in a process of its own): the case that showed note 2. Run the unit tests on Node 22 as well as the local Node: CI uses 22.
10. **Numbers.** 848 components, 849 generated files (with the barrel), a few hundred bytes each; `svelte-check` took about 10 s over 2410 files. The npm package is 343 kB packed (112 kB before), 1.7 MB unpacked,
    1956 files (the 848 `.svelte` files and their declarations; the drawings are in the dependency). Floor: 81 of 81 checks on Chromium 90, Firefox 85 and WebKit 15.4 (six are the icon's). `e2e/icon.spec.ts`: 26 tests in each of
    three engines. Branch coverage of `src/lib/Icon/` is 100%.
11. **The reference of an iconfont symbol is `xlink:href`, not `href`.** The prerender crawler of SvelteKit takes the `href` of any tag for a link and failed the build of the documentation site on `#icon-ring`, a symbol that is no id of
    the page; a user of `createFromIconfontCN` with a prerendered site would have hit the same. It does not read `xlink:href` (which every engine still draws). A unit test and the server test hold it (no `href` anywhere in the markup).
12. **The documentation site styled every svg inside a Button's icon slot as a stroke icon** (`docs/src/docs/styles/site.css`, written for the hand-drawn svgs of the Button demos): `fill: none` blanked the real icons. Found by
    looking at the built page, not by a test; the rule is now `.ads-btn-icon > svg`, and the clicked-icons example and its site test (the button is named by its text alone, the icon is hidden) cover it. The library has no such rule.
13. **`withDefaults` is exported from `iconfont.ts` for its tests only** (the package entry does not export it); its Proxy traps (`get`, `has`, `ownKeys`, `getOwnPropertyDescriptor`) are tested directly.
15. **The gallery is in the groups of the Ant Design list** (`docs/src/docs/data/icon-groups.ts`). The public icon page of Ant Design (React) was opened in a browser and the order of the names in its six groups was read from the page (Directional Icons
    63 names, Suggested Icons 24, Editor Icons 33, Data Icons 13, Brand and Logos 117, Application Icons 246: 496 names, each followed by its themes that exist). The list on that page is 842 drawings; the package has 848: `CopyrightCircle` and
    `DollarCircle` (three themes each) are not on it, and stand next to `Copyright` and `Dollar`. Our first gallery was one list in alphabetical order with an "All" theme and a "Show more" button; the groups replaced the alphabetical order, the "All" choice stays (the maintainer asked for it, 2026-11-20: to see every icon)
    and is the default, next to the three themes that theirs has, and the list is drawn whole after load. A test (`tests/docs/icon-page.test.ts`) fails when the package and the groups part: a drawing that is in no group, or in two, or a name that the package does not have.
14. **The unreachable branch in `Icon.svelte`** (the last `else if` of the template, behind a guard that lets nothing else in) became a plain `else`, so branch coverage stays at 100% without a test that cannot exist.

## Docs page plan (stage 6, done)

`docs/src/docs/examples/icon/`: Basic, Themes, Spin and rotate, Two-tone colors (with the global color), Accessible name, Icons that are clicked, Custom drawing (`icon` and `children`), Custom component (`component`, with the
code of the component after the example), iconfont.cn (a sprite made on the page, so it works offline); the **gallery** (a search box, a theme control (All, Outlined, Filled, TwoTone), the six groups of the Ant Design list in its order, the first 96 from the server and the rest after load, a click copies the name) and the API, functions and token
tables. Texts in en, ru and zh.

## Исходник, консультации

Не проводились: исходный код `@ant-design/icons`, `icons-vue`, `icons-angular` и `antd` не читали. Читали документацию, манифесты, список файлов пакета данных, форму данных одной двухцветной иконки (данные, не механизм),
трекер и собранный DOM демо как чёрный ящик. Фраза «исходник Ant Design не использовался» верна для этого компонента. Отдельно (не код Ant Design): публичный спрайт-скрипт, который генерирует iconfont.cn
(пример из документации React), читали, чтобы узнать, в какое место страницы он вставляет символы (в начало `body`); это решило порядок «поздний скрипт перекрывает ранний» (замечание 8).

Группы и порядок иконок в галерее на сайте (`docs/src/docs/data/icon-groups.ts`) взяты с публичной страницы иконок Ant Design как наблюдение за результатом в браузере (порядок имён на странице, 2026-11-20); код их страницы не читали.
