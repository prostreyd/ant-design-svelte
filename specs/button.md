# Button specification

Status: approved for the current v1.0 implementation.

The comparison below uses the public component documentation, not implementation
source code. The React documentation reported Ant Design 6.7.0 when checked on
2026-11-06. The Vue page did not expose a version in its rendered API table.

## API

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `type` | `'primary' \| 'default' \| 'dashed' \| 'text' \| 'link'` | `'default'` | Selects the visual style. |
| `size` | `'large' \| 'medium' \| 'middle' \| 'small'` | `'medium'` | `medium` follows the current React API; `middle` remains a compatibility alias. |
| `shape` | `'default' \| 'circle' \| 'round'` | `'default'` | Controls the shape. |
| `disabled` | `boolean` | `false` | Prevents button activation; disabled anchors also suppress navigation and leave the tab order. |
| `loading` | `boolean \| { delay: number }` | `false` | Shows an accessible-hidden spinner immediately or after a finite, non-negative delay in milliseconds; the control is disabled once loading is shown. |
| `danger` | `boolean` | `false` | Applies danger styling. |
| `ghost` | `boolean` | `false` | Applies transparent styling. |
| `block` | `boolean` | `false` | Fills the available width. |
| `href` | `string` | — | Renders an anchor when provided, including an empty string. |
| `target` | `string` | — | Native anchor target. |
| `htmlType` | `'button' \| 'submit' \| 'reset'` | `'button'` | Native button type; ignored when rendering an anchor. |
| `icon` | `Snippet` | — | Icon snippet, hidden from assistive technology. |
| `iconPlacement` | `'start' \| 'end'` | `'start'` | Positions the icon snippet. |
| `children` | `Snippet` | — | Label or other button content. |
| `class` | `string` | — | Extra class appended to the component's classes. |
| Native attributes | `HTMLButtonAttributes` or `HTMLAnchorAttributes` | — | Forwarded to the selected native element, including ARIA and form/link attributes. |
| `onclick` | `(event: MouseEvent) => void` | — | Called once for an enabled click; suppressed while disabled or loading. |

`loading.delay` must be a finite, non-negative number of milliseconds. A pending
delay remains interactive; it is cancelled when `loading` changes before it
expires.

## Поведение / Behavior

- Without `href`, render a native `<button>` using `htmlType`.
- With `href`, render a native `<a>` and forward anchor attributes.
- An empty `href` still selects the anchor branch.
- Loading renders a spinner and exposes `aria-busy`; disabled/loading anchors
  receive `aria-disabled`, `tabindex="-1"` and click suppression.
- Button types, sizes, shapes, danger, ghost, and block are style variants.
- `iconPlacement` defaults to `start`; only `start` and `end` are accepted.
- The legacy `middle` size value maps to the `medium` appearance.
- A custom `class` is appended, not substituted for the component's classes.
- Enum props (`type`, `size`, `shape`, `htmlType`, `iconPlacement`) reject values
  outside their contract with a `RangeError` instead of rendering silently.
- `download: true` renders a bare `download` attribute; `download: false` renders no
  attribute; a string value is used as the file name.

## A11y

- Use native button/link semantics rather than recreating roles or keyboard behavior.
- A native enabled button is activated by Enter and Space.
- Disabled/loading buttons use native `disabled`; disabled/loading anchors are
  removed from sequential focus and cannot navigate.
- Link anchors activate with Enter; buttons activate with Enter and Space.
- The icon and spinner are `aria-hidden`; icon-only controls require an
  accessible name, such as `aria-label`.
- `aria-busy` is set on either element while loading is active.
- `:focus-visible` has a visible outline using design tokens.
- Axe checks cover named button/link examples. Keyboard activation, disabled
  behavior, focus, and ARIA states have behavioral tests.

## Scope v1.0

- **Ядро (React ∩ Vue):** `type`, `danger`, `ghost`, `block`, `disabled`,
  `shape`, `size`, `loading` with shared delay behavior, `href`, `target`,
  `htmlType`, click callback, icon content, and native element semantics.
- **Дешёвые React-дополнения (≤ 1 дня):** `iconPlacement` (`start`/`end`),
  estimated at under one day; Vue provides icon content but not the same
  placement prop.
- **Зарезервировано на v1.1 (contract, not implemented):**
  - `color?: 'default' | 'primary' | 'danger' | PresetColor`, where
    `PresetColor` is `'blue' | 'purple' | 'cyan' | 'green' | 'magenta' |
    'pink' | 'red' | 'orange' | 'yellow' | 'volcano' | 'geekblue' | 'lime' |
    'gold'`. `color` selects the palette; an explicit value takes precedence
    over the `danger` shorthand.
  - `variant?: 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link'`.
    If omitted, the current `type` behavior remains unchanged; when supplied,
    `variant` selects the surface treatment.
  - `classNames?: Partial<Record<'root' | 'icon' | 'content' | 'loadingIcon', string>>`;
    classes are appended to those semantic elements.
  - `styles?: Partial<Record<'root' | 'icon' | 'content' | 'loadingIcon', Record<string, string | number>>>`;
    inline styles apply to those elements and override their token-based values.
- **Не берём:** `autoInsertSpace`. It relies on interpreting two Chinese
  characters inside rendered React-node content. Svelte children are snippets
  and cannot be inspected reliably without fragile DOM mutation; consumers can
  provide explicit whitespace. A separate React `loading.icon` value is also
  not copied; Svelte's snippet API is the composition mechanism.

## Расхождения семантики React / Vue

| API | React (Ant Design 6.7.0 docs) | Vue (rendered public docs) | Решение |
|---|---|---|---|
| `size` | `large \| medium \| small`, default `medium` | `large \| middle \| small`, default `middle` | Use React's `medium`; retain `middle` as a compatibility alias. |
| `type` | `primary \| dashed \| link \| text \| default` | Also documents `ghost` as a type value | Keep the React `type` values; use the shared `ghost` boolean prop. |
| `loading` | `boolean \| { delay, icon }` | `boolean \| { delay }` | Implement the shared delay contract. Use Svelte snippets rather than copying the React-node icon API. |
| Icon content / placement | React node, `iconPlacement: start \| end` | Vue slot; no matching placement prop in its public API table | Use Svelte snippets and add `iconPlacement` as a low-cost React addition. |
| Link rendering | `href` and `target` | `href` and `target` | Use native anchor rendering for both. |
| Semantic styling | `classNames` and `styles` are public in React 6 | Not listed as equivalent API in the Vue page | Reserve additive Svelte contracts for v1.1; do not claim these are cheap. |
| Native attributes | Documents native button attributes | Explicitly accepts native button props | Forward the corresponding Svelte native attributes. |

## Анализ Angular

NG-ZORRO documents a button directive with `nzType`, `nzShape`, `nzSize`,
`nzLoading`, `nzGhost`, `nzBlock`, `nzDanger`, and native button attributes.
Its documented size values are `large`, `small`, and `default`; it does not
provide an equivalent `href` button API. Keep Angular-specific `nz*` names out
of the Svelte API. Native button behavior is used where the semantics match.

## Решения и обоснование

- Current React documentation uses `medium`, while Vue uses `middle`; React is
  the reference under the project scope policy. `middle` remains accepted to
  avoid breaking the already implemented pre-1.0 API.
- `iconPlacement` is a small additive option and uses the public React values.
- `autoInsertSpace` is not implemented because Svelte snippets are opaque
  render functions; mutating their generated DOM to infer text is fragile.
- `color`, `variant`, `classNames`, and `styles` are deferred to keep v1.0
  styling scope bounded. Their names and initial contracts are reserved above.
- All code is independently authored for Svelte. The comparison is based on
  public documentation; Ant Design implementation source was not used.

## Список тестов

- Default rendering, each `type`, each supported size, `middle` compatibility alias,
  and each shape.
- `danger`, `ghost`, `block`, `htmlType`, custom class, native form/name and ARIA attributes.
- Icon snippet default/end placement and decorative icon semantics.
- Click callback invocation count and payload; suppression when disabled/loading.
- Native keyboard activation; disabled button focus/activation behavior.
- Link Enter activation and disabled-anchor focus behavior.
- Immediate and delayed loading, cancellation, invalid delay, spinner, and `aria-busy`.
- Anchor rendering for normal and empty `href`; `target`, `rel`, `download`, disabled/loading behavior.
- Reactive prop changes, including `onclick` replacement and button/anchor switching.
- Native form behavior: default `type="button"`, `submit`, `reset`, disabled submit,
  `value`, and `htmlType` ignored for anchors.
- Invalid enum values (`type`, `size`, `shape`, `htmlType`, `iconPlacement`) throw `RangeError`.
- `download` boolean and string mapping; omitted anchor attributes.
- Loading edge cases: pending delay shows no spinner, `true` replaces a pending delay,
  changing the delay restarts the timer, keyboard blocked while loading, loading link
  does not navigate.
- Rapid repeated clicks; keyboard focus on an enabled button; Space does not activate a link.
- Axe checks for accessible named controls, loading/disabled states, and a negative
  check that an icon-only button without a name is reported.
- Visual states (`:hover`, `:active`, `:focus-visible`, disabled, loading spinner, sizes,
  block, circle/round) are covered by Playwright e2e tests in `e2e/button.spec.ts`,
  which compare computed styles against the design tokens. Run with `npm run test:e2e`.

## Mutation testing

`npm run test:mutation` applies one mutation at a time to `Button.svelte`, runs the unit
tests for each, and reports survivors. Current result: 99% (96 of 97 killed). The one
survivor is equivalent: the initial value of `delayedLoading` is overwritten by the
loading effect during mount, so no state is observable from outside the mount.
