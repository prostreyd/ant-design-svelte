# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Documentation

- The rules for AI assistants now allow studying the source code of single mechanisms of Ant Design, to understand a
  technique and judge it, and say on what conditions: the decision is written down before reading, only the mechanism in
  question is read, nothing is copied, ported or retold line by line, and what was read is recorded in the specification
  (date, question, what was read, by whom). Studying the public demos as a black box (geometry, recorded frames, screen
  readers) is listed as a way to compare behavior. The library stays an independent implementation.

## [0.5.1] - 2026-11-13

### Fixed

- `Select`: an open drop-down list no longer lags behind its field while the page scrolls. The list used to be placed
  against the window and moved again after each scroll event, one frame late; it is now placed in the page, next to its
  field, so the browser moves both together. A field inside a fixed element (and a point anchor) keeps a list that stays
  on the screen with it. A field inside a scrolling element is still followed one frame late, as in Ant Design.
- `Select`: with the cursor over an open list that has nothing to scroll (a few options), the mouse wheel moved nothing
  in Chromium and WebKit, because the list held the wheel for itself. A list holds the wheel only while it scrolls.
- `Select`: a `container` that has a CSS `transform`, `filter` or `contain` no longer shifts the list away from its
  field.

### Changed

- The internal popup panel is moved with `transform` from the corner of its containing block, is as wide as the viewport
  at most, and is rounded to a device pixel; it writes nothing while the placement does not change. No public prop changed.

## [0.5.0] - 2026-11-12

### Added

- `Select`, `SelectOption` and `SelectOptGroup` components: a drop-down list in the modes single, `multiple` and `tags`,
  with `options` (strings, numbers, objects, groups, `fieldNames`) or the options written as markup, search
  (`showSearch`, `filterOption`, `filterSort`, `optionFilterProp`, `searchValue`, `onsearch`, `autoClearSearchValue`),
  tags with `maxTagCount`, `maxTagPlaceholder`, `maxTagTextLength`, `maxCount` and `tokenSeparators`, `allowClear`,
  `loading`, `size`, `variant`, `status`, `prefix`, `suffix`, custom icons, `optionRender`, `labelRender`, `tagRender`,
  `popupRender`, `notFoundContent`, `placement`, `popupMatchSelectWidth`, `listHeight`, `container`, `bind:open` with
  `onopenchange`, the callbacks `onselect`, `ondeselect`, `onclear`, `onfocus`, `onblur`, `onpopupscroll` and
  `oninputkeydown`, `classNames` and `styles` (eleven parts), and the methods `focus()` and `blur()`. The focused element
  is a `combobox` and DOM focus never leaves it; the list is a `listbox` in a panel that is put at the end of the page,
  flips at the edge of the screen and follows the field. Full keyboard support (arrows, Home, End, PageUp, PageDown,
  Enter, Space, Escape, Tab, Backspace, type-ahead), a polite live line that says the number of matches, or the
  empty-result text, while searching (`resultsText`), forced-colors support, light and dark themes. The type of an option object is `SelectOptionItem`.
  Planned later and reserved: `virtual`, `listItemHeight`, `maxTagCount="responsive"`, `labelInValue`, `showSearch` as an
  object, a locale mechanism for the built-in texts, `selectOnTab`, `selectionText` (an announcement of an option that was
  toggled in a field that searches). Known limitation until then: Orca says nothing when an option is toggled with Enter in
  such a field.
- The `--ads-select-*` design tokens, and group label and empty-result colors in `tokens-accessible.css`.
- A page for `Select` on the documentation site, in English, Russian and Chinese, with thirteen live examples, the API
  tables of the three components, the methods and the tokens.

### Tests

- `Select` was run with a real screen reader (Orca 50.3 with Chromium, real key events, in an isolated session) and its
  speech was checked: the name, the role, the value, the open list and its items, groups, `selected` and `unselected`, the
  clear button, an invalid state, and the number of matches and the empty-result text while searching. That found two
  defects, now fixed: Orca does not read a change of the text of a `role="status"` element, and an empty-result text that
  appears together with the list is not announced by a live region; the search status line is now a plain polite live
  region that says both. Mutation testing of `Select` (294 mutants) has a score of 100%.
- The tests of the library and of the site check `Select` in Chromium, Firefox and WebKit: the sizes, the layout while
  opening, closing, selecting, loading and clearing (with labels of different width, frame by frame during the
  animations), the panel, the keyboard, tags, forced colors and the page of the site.

## [0.4.1] - 2026-11-12

### Fixed

- `Switch` and `Checkbox` in forced-colors modes such as Windows High Contrast. The track and the handle of a switch and
  the bar of an indeterminate checkbox are backgrounds, which these modes replace, so a switch disappeared (only its text
  and the loading spinner were left) and an indeterminate checkbox looked unchecked. They are now drawn with system colors:
  an outlined off track, a `Highlight` on track, a handle in the text color, the bar in the text color, and the disabled
  system color for disabled controls. Sizes and layout are unchanged. Browser tests switch the mode on in Chromium,
  Firefox and WebKit.
- Documentation site: the four copy buttons (home page, examples, code blocks, install commands) announced "Copied" even when
  the browser refused to write to the clipboard. They now report the real outcome and say "Copy failed" when it failed, in
  English, Russian and Chinese.

### Tests

- The browser tests of the library and of the documentation site now run in Chromium, Firefox and WebKit, locally and in CI,
  which installs the three browsers. Tests that were slow in WebKit got longer timeouts or fewer browser round trips, and the
  test that needs the Chrome DevTools Protocol stays in Chromium only. None of the changes was a defect of a component.

- Real IME composition in Chromium (through the Chrome DevTools Protocol) is now also checked for a text area cut at the
  end of a composition, for `InputSearch` (the Enter that confirms a composition does not search, the next one does),
  and for `InputOTP` (a cell takes its character, or several, when the composition ends, and Backspace and the arrows
  during a composition are left to the IME). No component changed.

### Documentation

- `Input`: the documentation of `onchange` now says which event it receives. It is the native `input` event, or `compositionend`
  when a browser (Firefox, for one) ends an IME composition before its last `input` event. The text and the number of calls
  are the same; only `event.type` differs. The behavior of the component did not change.
- The rules for AI assistants now ask to check every property for deprecation before it is taken into an API: the
  current replacement name is used, a rename chain is recorded in the specification, and the decisions of Ant Design
  are judged only from public traces (deprecated properties, change lists, the issue tracker, package manifests).

## [0.4.0] - 2026-11-11

### Added

- `Input`, `InputTextArea`, `InputPassword`, `InputSearch` and `InputOTP` components: a text field family on native
  `<input>` and `<textarea>`. `Input` has `bind:value` (a function binding can refuse an edit), `type`, `disabled`, `readonly`,
  `size` (`large`, `medium`, `small`; `middle` and `default` are aliases of `medium`), `variant` (`outlined`, `filled`,
  `borderless`, `underlined`), `status` (`error` also sets `aria-invalid`), `prefix` and `suffix`, `addonBefore` and `addonAfter`
  (text or a snippet), `allowClear` (a native button that keeps focus in the field; the object form sets the icon, the name and the tab
  index), `showCount` and `count` (`max` as a soft limit, `strategy`, `show`, `exceedFormatter`), `maxlength`, `onchange(value, event)`
  on every edit, `onpressenter`, `onclear`, `classNames` and `styles` for the parts `root`, `prefix`, `input`, `suffix`, `clear` and
  `count`, and `focus({ preventScroll, cursor })` / `blur()`. `InputTextArea` adds `autoSize` (`true` or `{ minRows, maxRows }`).
  `InputPassword` adds `bind:visible`, `onvisiblechange`, `visibilityToggle` and `iconRender`. `InputSearch` adds `enterButton`,
  `loading`, `onsearch(value, event, { source })` and `searchIcon`. `InputOTP` has `length`, `mask`, `formatter`, `separator`,
  `onchange` (all cells filled), `oninput`, keyboard navigation, paste and `autocomplete`. A field is one element around the
  native control (a group element appears only with `addonBefore` / `addonAfter`), and the prefix, the suffix, the clear button
  and the count are its siblings, so the input keeps its focus and caret when they come and go. The IME composition is respected:
  Enter that confirms a candidate is not `onpressenter` or a search, and the text is cut by `exceedFormatter` when the composition ends.
  A native form reset is followed by a restore of the view to the state. `--ads-input-*` design tokens were added to `tokens.css`, and
  `tokens-accessible.css` darkens the border (3:1), the placeholder, the count and the clear icon (4.5:1 and 3:1) and the warning
  colors; the dark theme keeps these ratios without it. The comparison with Ant Design (React, Vue, Angular) and the decisions are in
  `specs/input.md`.
- Input page on the documentation site (English, Russian and Chinese): 21 live examples with their code, the API tables of all
  five components, the methods and the design tokens.
- Tests of the input family: unit and accessibility tests, mutation tests, Playwright tests of the visual states, IME, `autoSize`,
  layout (nothing moves when the text, the status, the visibility or the loading changes), right-to-left layout, a contrast matrix in
  both themes and the default colors, and tests that keep the Input page honest.

## [0.3.0] - 2026-11-10

### Added

- `Checkbox` and `CheckboxGroup` components. `Checkbox` is a native `<input type="checkbox">` inside a `<label>`
  with `bind:checked`, `indeterminate` (a "check all" look that is announced as mixed and changes only the
  appearance), `disabled`, `value`, `name`, `children`, `onchange(checked, event)`, `classNames` and `styles` for the
  parts `root`, `icon` and `label`, and the `focus()` / `blur()` methods. `CheckboxGroup` has `bind:value`, `options`
  (strings, numbers, or objects with a text or snippet `label`, `disabled`, `title`, `class`, `style` and `onchange`),
  custom markup with checkboxes inside, `disabled`, `name`, `onchange(value, event)` and `classNames` / `styles` for the
  parts `root`, `item`, `itemIcon` and `itemLabel`. A parent can accept or refuse a change with a function binding, or
  cancel it with `preventDefault()` in `onclick`. The selected values follow the order of the options. A native form
  reset is followed by a restore of the view to the state. The unchecked border and the hover fill are darker in
  `tokens-accessible.css`, so the border, the check mark and the focus ring keep 3:1 contrast in both themes.
  `--ads-checkbox-*` design tokens, `--ads-motion-duration-fast`, `--ads-motion-duration-slow` and
  `--ads-motion-ease-out-back` were added to `tokens.css`. The comparison with Ant Design (React, Vue, Angular) and the
  decisions are in `specs/checkbox.md`.
- Checkbox page on the documentation site (English, Russian and Chinese): ten live examples with their code, the API
  tables of both components, the methods and the design tokens.
- Tests of the Checkbox: unit and accessibility tests, Playwright tests of the visual states, a contrast matrix in both
  themes, a layout test (nothing moves when a checkbox toggles) and right-to-left layout, and tests that keep the
  Checkbox page honest.

### Changed

- `npm run test:mutation` accepts `--file=<component>` for a second component of a folder and runs every test file
  of the component (`--target=Checkbox` also runs the `CheckboxGroup` tests).

## [0.2.1] - 2026-11-10

### Added

- `svelte-ant-design/tokens-accessible.css`: an optional file, imported after `tokens.css`, with darker light-theme
  colors for the `-solid`, `-text` and link tokens and for the Switch tracks. With it every text pair is at least
  4.5:1 and every track and handle at least 3:1. The dark theme needs no extra file.
- Tokens `--ads-color-link`, `--ads-color-link-hover`, `--ads-color-link-active`, `--ads-button-text-hover-bg`,
  `--ads-button-text-active-bg` and `--ads-switch-loading-opacity`.

### Changed

- The default light colors of `Button` and `Switch` are now the values of the Ant Design token documentation:
  primary `#1677ff` (hover `#4096ff`, pressed `#0958d9`), danger `#ff4d4f`, links `#1677ff` (hover `#69b1ff`), a
  switch on `#1677ff`, off `rgba(0, 0, 0, 0.25)`. A text button now keeps its text color on hover and is tinted with
  `rgba(0, 0, 0, 0.04)`; a link button has its own hover and pressed colors; a loading switch is dimmed to `0.65`.
  These values are not WCAG AA for text (white on the primary fill is 4.10:1); the previous, darker values are in
  `tokens-accessible.css`. The dark theme is unchanged.
- The documentation site shows the default colors and checks the contrast of its own texts; the contrast of the
  library's components is checked by the library tests with the accessible file.

### Documentation

- The release rules for AI assistants now require `npm publish --dry-run` in a clean clone of the release
  commit before the version tag is pushed. The first release by tag stopped because the checks that run
  before publishing need a file that only `svelte-kit sync` creates; `npm test` now creates it itself.

## [0.2.0] - 2026-11-10

From this version on, releases are numbered without pre-release suffixes: a new component raises the
minor number and a fix raises the patch number. The versions before this one were published as alpha.

### Added

- `Switch` component: a native `<button role="switch">` with `bind:checked`, `onchange`, `onclick`,
  `disabled`, `loading`, `size` (`medium`, `small`, and `default` as an alias of `medium`),
  `checkedChildren` / `unCheckedChildren` (plain text or a snippet), `classNames` and `styles` for the parts `root`,
  `content` and `indicator`, and the `focus()` / `blur()` methods. A parent can accept or refuse a change
  with a function binding, or cancel it with `preventDefault()` in `onclick`. The track and the handle keep
  3:1 contrast and the text 4.5:1 in both themes, so the off track is darker than in the Ant Design design.
  Both on/off contents stay mounted and the switch keeps the width of the longer one, so it does not
  change size and nothing around it moves when it toggles.
  `--ads-switch-*` design tokens were added to `tokens.css`. The comparison with Ant Design (React, Vue,
  Angular) and the decisions are in `specs/switch.md`.
- Switch page on the documentation site (English, Russian and Chinese): nine live examples with their code,
  the API, methods and design tokens tables.
- Tests of the Switch: unit and accessibility tests, Playwright tests of the visual states, a contrast matrix
  in both themes and right-to-left layout, and tests that keep the Switch page honest.

### Changed

- The check of enum-like props (`RangeError` in development, a fallback in production) moved from `Button`
  to a helper shared with `Switch`. The behavior of `Button` is unchanged.
- The documentation site no longer shows alpha labels (header, menu, component pages, home page). The home
  page roadmap lists every ready component, and the texts that said only the Button was ready were updated.

### Documentation

- The rules for AI assistants now require comparing, for every prop, the value forms that React, Vue and
  Angular accept with the Svelte type, and treat any narrowing (for example `Snippet` only, where all three
  accept text too) as a decision for the maintainer.
- The rules for AI assistants now require checking in a browser, with contents of different widths, that
  toggling a component does not change its size or move its neighbours.
- The rules for AI assistants now describe what the maintainer's "запуш" means for a ready or fixed
  component: merge into `main`, bump the version (a minor for a new component, a patch for a fix, no
  pre-releases), push the version tag (npm publication through the existing workflow) and confirm that
  the site was updated.

## [0.1.0-alpha.2] - 2026-11-10

The library code is unchanged since 0.1.0-alpha.1; this release brings the documentation site and the
updated package metadata to the npm page.

### Added

- Documentation site, published on GitHub Pages: <https://prostreyd.github.io/ant-design-svelte/>. It has
  a home page, a **Docs** section (getting started, theming, dark mode, accessibility, FAQ,
  contributing) and a separate **Components** section with an overview and the Button page: eleven live
  examples that use the real component, the code of each example, an API table, and the design
  tokens the component reads. Three languages (English, Russian, Chinese), a light and a dark theme,
  search, and a layout for phones. The site is a SvelteKit app in `docs/`, prerendered to static
  files; `.github/workflows/pages.yml` builds and deploys it from `main`.
- Tests for the site: Vitest checks that the API and token tables match `Button.svelte`,
  `types.ts` and `tokens.css`, that every example runs, that translations are complete, and that every
  code snippet is valid; Playwright checks all pages in three languages, two themes and three screen
  widths (accessibility with axe-core, console errors, overflow) and the main interactions; a
  script checks links, anchors, titles, canonical URLs, hreflang links and the sitemap in the build.

### Changed

- `npm run dev`, `npm run build` and `npm run preview` now run the documentation site. It replaces the
  old demo playground (`demo/`, Russian only). The library build (`npm run package`) is unchanged.
- `package.json` `homepage` points to the documentation site, so the npm page links to it, and `keywords` gained
  `antd`, `design-system` and `ui-library`.
- The Button README links to the live examples instead of the removed playground.

## [0.1.0-alpha.1] - 2026-11-09

### Added

- Packaging test (`tests/packaging/tree-shaking.test.ts`): it packages a copy of the library with
  `svelte-package`, installs it into a throw-away app, builds the app with Vite, and checks that
  components the app does not import are not bundled, that an app importing only `VERSION` gets no
  Svelte runtime, and that `tokens.css` and the styles of the imported components are kept.

### Changed

- `package.json` declares `"sideEffects": ["**/*.css"]`, the field bundlers read to decide which
  modules they may drop. With it, an app that imports only `VERSION` gets no component code and no
  Svelte runtime (without it, 37 Svelte runtime modules stayed in the bundle). Unused components were
  already left out by Vite; the packaging test covers Vite only.

## [0.1.0-alpha.0] - 2026-11-08

### Added

- GitHub Actions workflow (`.github/workflows/ci.yml`): lint, type check, unit tests with the
  coverage thresholds, package and site builds, and the Playwright e2e tests on every push to
  `main` and every pull request.
- `package.json`: `repository`, `homepage`, `bugs`, and `keywords`, so the npm page links back to
  the project.
- MIT `LICENSE` and a project `README.md` with installation, usage, and development
  instructions, plus the Ant Design attribution and AI-use notice.
- `prepublishOnly` script: runs lint, type checks, tests, and `svelte-package` before
  publishing, so the published `dist/` is always fresh.

- **Button** — Ant Design-style button: `type` (primary/default/dashed/text/link),
  `size`, `shape`, `disabled`, `loading`, `danger`, `block`, `ghost`, `href`/`target`
  (renders a link), `htmlType`, `icon` and `children` snippets, `iconPlacement`,
  native attribute forwarding, delayed loading, `onclick` callback, and accessible
  disabled/loading behavior for buttons and links.
- Design tokens starter set (`--ads-*`) including Button tokens, exposed via
  `svelte-ant-design/tokens.css`.

### Changed

- Button: invalid `type`, `size`, `shape`, `htmlType`, `iconPlacement`, and `loading.delay`
  values still throw a `RangeError` while developing and in tests, but a production build now falls
  back to the documented default instead of breaking the page.
- `tokens.css` no longer sets `color-scheme: light` on `:root` (it affected the whole consumer
  application); the dark theme still sets `color-scheme: dark` under `[data-theme='dark']`. Tokens
  that only the documentation site used (`code-*`, `violet*`, `success*`, `bg-code`, `bg-subtle`,
  `primary-soft`, `font-family-code`) were removed from the published stylesheet.
- Coverage thresholds now apply to the whole `src/lib` instead of only `Button.svelte`.
- Package name: the library is published as `svelte-ant-design` (the former name was already
  taken on npm by an unrelated, unmaintained package). The CSS class prefix `ads-` and the
  `--ads-*` tokens are unchanged.
- Button: a loading button is no longer natively disabled. It keeps keyboard focus when loading
  starts, stays in the Tab order, and exposes `aria-disabled="true"`; clicks, Enter, Space, and
  form submission are still blocked. A button with both `disabled` and `loading` stays natively
  disabled.
- Button: a disabled or loading link is rendered without `href` and with `role="link"`, so it can no
  longer be opened with a middle click or from the context menu.
- Button: new accessible color tokens (`--ads-color-primary-solid*`, `--ads-color-primary-text*`,
  `--ads-color-danger-solid*`, `--ads-color-danger-text*`) replace the base palette for fills and
  text, and the focus ring is a solid color. Primary buttons are slightly darker than before so
  white text reaches 4.5:1; hover and pressed states are darker still. The base
  `--ads-color-primary*` and `--ads-color-danger*` tokens are unchanged.
- Button: `ghost` now also makes `default` and `dashed` buttons transparent; text and border colors
  come from the type and `danger`.

- Button now follows the documented React `medium` size default while retaining
  `middle` as a compatibility alias.
- Button design values, including focus and loading indicators, use CSS tokens.

### Fixed

- Button: the label of a `primary` button no longer takes the background color (invisible text) on
  keyboard focus, and `primary` + `danger` no longer shows blue text on red.
- Button: `danger` on `default`, `dashed`, `text`, and `link` keeps its danger palette on hover,
  focus, and press instead of turning blue.
- Button: `ghost` no longer fills with color on hover, and `ghost` + `danger` is red instead of blue.
- Button: a focused button no longer loses focus when `loading` starts.
- Button: `tabindex` passed to a link or button, and `aria-busy`/`aria-disabled` passed by the
  consumer, are forwarded instead of being silently dropped.
- Button: the focus ring and button text meet WCAG contrast (3:1 and 4.5:1) in the light and dark
  themes. Transitions are disabled and the spinner is slower under `prefers-reduced-motion`.

- Button: a pending `loading.delay` timer no longer restarts when the parent passes a
  new `{ delay }` object with the same delay value.
- Button: `download={false}` no longer renders a `download` attribute, which made the
  link download anyway; `download={true}` renders a bare attribute instead of `"true"`.
- Button: invalid `type`, `size`, `shape`, `htmlType`, or `iconPlacement` values throw a
  `RangeError` instead of rendering silently (an invalid `iconPlacement` used to hide the icon).
- Button: the demo API table documents every public prop, including `danger`, `ghost`,
  `block`, `target`, `rel`, `download`, `htmlType`, `form`, `name`, `value`, and `class`.
