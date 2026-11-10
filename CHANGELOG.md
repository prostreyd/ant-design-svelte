# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
