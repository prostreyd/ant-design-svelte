# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
