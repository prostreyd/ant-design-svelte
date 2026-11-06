# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

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
