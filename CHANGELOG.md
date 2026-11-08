# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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
  `ant-design-svelte/tokens.css`.

### Changed

- Button now follows the documented React `medium` size default while retaining
  `middle` as a compatibility alias.
- Button design values, including focus and loading indicators, use CSS tokens.

### Fixed

- Button: a pending `loading.delay` timer no longer restarts when the parent passes a
  new `{ delay }` object with the same delay value.
- Button: `download={false}` no longer renders a `download` attribute, which made the
  link download anyway; `download={true}` renders a bare attribute instead of `"true"`.
- Button: invalid `type`, `size`, `shape`, `htmlType`, or `iconPlacement` values throw a
  `RangeError` instead of rendering silently (an invalid `iconPlacement` used to hide the icon).
- Button: the demo API table documents every public prop, including `danger`, `ghost`,
  `block`, `target`, `rel`, `download`, `htmlType`, `form`, `name`, `value`, and `class`.
