# Switch specification

Status: scope and open points agreed with the maintainer on 2026-11-10 (workflow stage 2 done);
implementation follows this document.

The comparison below uses public documentation, not implementation source code.

| Library | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/switch> | 6.7.0 (site navigation), 2026-11-10 |
| Ant Design Vue | <https://antdv.com/components/switch> | The site renders client-side and could not be fetched; the API tables were read from the documentation markdown file of the repository (docs only, no component code). No version is shown there. |
| NG-ZORRO (Angular) | <https://ng.ant.design/components/switch/en> | 22.2.0 (site header), 2026-11-10 |

None of the three pages has an accessibility or keyboard section. The a11y contract below is
therefore our own, based on the WAI-ARIA `switch` pattern, not copied from Ant Design.

## Element

A native `<button type="button" role="switch" aria-checked="true|false">`. Its two children are
`<span class="ads-switch-content">` (the on/off text, `aria-hidden`) and
`<span class="ads-switch-indicator">` (the handle; holds the spinner while loading). They are the
three semantic parts `root`, `content` and `indicator`.

## API

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `checked` | `boolean` (`$bindable`) | `false` | Current state. `bind:checked` for two-way use. The component flips it locally on a user toggle, so `checked={x}` without `bind:` behaves as an initial value (there is no separate `defaultChecked`). |
| `onchange` | `(checked: boolean, event: MouseEvent) => void` | — | Called once per user toggle, after the state flips, with the new value. Not called for a change of the `checked` prop made by the parent, nor while disabled or loading. |
| `onclick` | `(event: MouseEvent) => void` | — | Native click callback. **Differs from React/Vue**, which pass `(checked, event)` (see "Agreed decisions"). Runs before the state flips, so `event` is the click that causes the toggle; read the new value in `onchange`. Suppressed while disabled or loading. |
| `disabled` | `boolean` | `false` | Native `disabled`: not focusable, not activatable. |
| `loading` | `boolean` | `false` | Shows a spinner in the handle and ignores activation. The switch keeps focus (see A11y). |
| `size` | `'medium' \| 'small' \| 'default'` | `'medium'` | `medium` follows React; `default` is a compatibility alias of `medium` (Vue and Angular name). |
| `checkedChildren` | `string \| Snippet` | — | Content shown while checked: plain text, or a snippet for icons and markup. Hidden from assistive technology. Always mounted; hidden while unchecked (see Behavior). |
| `unCheckedChildren` | `string \| Snippet` | — | Content shown while unchecked: plain text or a snippet. Hidden from assistive technology. Always mounted; hidden while checked (see Behavior). |
| `classNames` | `Partial<Record<'root' \| 'content' \| 'indicator', string>>` | — | Classes appended to the semantic part. |
| `styles` | `Partial<Record<'root' \| 'content' \| 'indicator', Record<string, string \| number>>>` | — | Inline styles applied to the semantic part; they override the token-based values. Keys are CSS property names in kebab-case or custom properties (`'background-color'`, `'--my-var'`); numbers are written as-is, with no automatic `px`. |
| `class` | `string` | — | Appended to the root classes, together with `classNames.root`. |
| `style` | `string` | — | Inline style of the root; `styles.root` is written after it, so it wins on the same property. |
| Native attributes | `HTMLAttributes<HTMLButtonElement>` | — | Forwarded to the `<button>` (`id`, `title`, `tabindex`, `data-*`, `aria-*`, other event handlers). The component owns `type`, `role` and `aria-checked`. Its `loading` state takes priority over a consumer `aria-disabled` and `aria-busy`; otherwise the consumer value is kept. Button-only attributes (`form`, `name`, `value`) are not part of the type: the switch never submits or reports a value. |

**Methods** (on the component instance, through `bind:this`): `focus(options?: FocusOptions)` and
`blur()`.

Enum prop `size` follows the Button rule: outside its contract it throws a `RangeError` in
development and tests, and falls back to `medium` in a production build.

## Поведение / Behavior

- Activation (click, Enter, Space) calls `onclick(event)`, then toggles `checked`, then calls
  `onchange(checked, event)`. Keyboard activation is the native button behavior: the browser
  dispatches a click.
- If `onclick` calls `event.preventDefault()`, the switch does not toggle and `onchange` is not
  called, as with a native checkbox. This is the synchronous way to veto a change; the function
  binding below is the asynchronous one.
- A change of the `checked` prop by the parent updates the view and does not call `onchange`.
- A fully controlled switch (the parent may veto or delay a change, for example after an async
  confirmation) uses a function binding: `bind:checked={() => on, (next) => confirm(next)}`.
  This replaces the React pattern of `checked` plus `onChange` and the Angular `nzControl`.
- While `disabled`: native `disabled`, no callbacks, not in the Tab order.
- While `loading`: the state does not change, `onchange` and `onclick` are not called, a spinner is
  shown in the handle. `aria-busy="true"` and `aria-disabled="true"` are set. Not natively
  disabled, same as Button, so a focused switch does not lose focus when an action starts.
  With both `disabled` and `loading`, the native `disabled` applies.
- `checkedChildren` and `unCheckedChildren` take plain text or a snippet. A string is rendered as
  text, never as HTML; an empty string counts as not given. Each one is optional and independent.
  Each one that is given
  is **always rendered**, in the same grid cell of the content part; the one of the other state
  is `visibility: hidden` (and the whole content part is `aria-hidden`). The cell is as wide as
  the wider of the two, so the switch has the **same width in both states** and neighbours do
  not move when it toggles. The shorter content is centered in the cell. A switch with only one
  of the two keeps its width as well: the track stays as wide as that content in the other state.
  Because both snippets are mounted at once, avoid `id`s, `bind:`s and side effects inside them.
- `size="small"` shrinks the track and the handle; `default` and `medium` look identical.
- Rapid repeated clicks: each toggles once and calls `onchange` once each.
- `styles` values are applied after the component's own, so a consumer value wins.

## A11y

- Native button with `role="switch"` and `aria-checked` kept in sync with `checked`
  (WAI-ARIA switch pattern). Enter and Space toggle. Arrow keys are not part of the pattern, and
  none of the three libraries documents them, so they are not implemented.
- **An accessible name is required.** The text in `checkedChildren`/`unCheckedChildren` is
  `aria-hidden`, because as the name it would only repeat the state ("On"/"Off"). Provide the name
  with `aria-label`, `aria-labelledby` or `<label for={id}>` (the `id` is forwarded).
- `:focus-visible` outline from the design tokens, at least 3:1 against the page background.
- Non-text contrast (WCAG 1.4.11): the track in **both** states against the page background, and
  the handle against the track, reach 3:1 in the light and dark themes, in the rest, hover and
  pressed states. The on/off text is visible text, so it reaches 4.5:1 against the track
  (WCAG 1.4.3) even though it is `aria-hidden`. Consequently the unchecked track is darker than in
  Ant Design's own visual design, the same trade as the `-solid` tokens of Button, and in the dark
  theme hover and pressed are slightly darker, not lighter: a lighter track would lose contrast
  against the white handle. A loading switch keeps full opacity (Ant Design dims it with
  `opacityLoading`) so the guarantee holds. Disabled switches are exempt, as in WCAG.
- `prefers-reduced-motion: reduce` disables the handle and track transitions and slows the spinner
  (`--ads-motion-duration-spinner-reduced`).
- Axe checks cover named switches in every state; an unnamed switch is reported (negative check).

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular, or React ∩ Vue):** `checked` state, change callback with
  `(checked, event)`, `disabled`, `loading` (boolean), `size`, on/off content (text or snippet),
  `focus()`/`blur()`.
- **Дешёвые React-дополнения (≤ 1 дня):** `classNames` and `styles` for `root`, `content`,
  `indicator` (React 6.0.0, indicator 6.3.0). Chosen for v1.0 by the maintainer. Estimate: about
  half a day. One small internal helper turns the two props into class strings and style
  strings for the three parts; it is written to be reused by Button when its reserved
  `classNames`/`styles` are implemented. Plus tests and one docs example.
- **Зарезервировано на v1.1:** nothing.
- **Не берём (Vue-only):** `checkedValue` / `unCheckedValue` (a state other than `boolean`):
  mapping a boolean to another value is one line in the consumer, and it makes the `checked`
  type and `aria-checked` ambiguous. `autofocus`: call `focus()` after mount.
- **Не берём (Angular-only):** `nzControl` (replaced by a function binding, see Behavior);
  `nzId` (native `id` is forwarded).
- **Не берём (React-only, не подходит для Svelte):**
  - `defaultChecked`, and the `value` / `defaultValue` aliases (5.12.0): `$bindable` covers the
    initial and the controlled cases; the aliases exist for React form libraries.
  - The function form of `classNames`/`styles` (a function of the props): a Svelte consumer
    computes the object in `$derived`.
  - The `Form.Item` `valuePropName` FAQ: not applicable, there is no form wrapper in this library.

## Расхождения семантики React / Vue / Angular

| API | React (6.7.0) | Vue (docs markdown) | Angular (22.2.0) | Решение |
|---|---|---|---|---|
| State | `checked`, `defaultChecked`, alias `value`/`defaultValue` | `checked` (v-model), type is `checkedValue \| unCheckedValue` | `[ngModel]` boolean, `(ngModelChange)` | One boolean `checked`, `$bindable`. |
| `size` | `medium \| small`, default `medium` | `default \| small`, default `default` | `default \| small`, default `default` | React values; `default` accepted as an alias. |
| Content | `checkedChildren`, `unCheckedChildren` (ReactNode) | same names, `string \| slot` | `nzCheckedChildren`, `nzUnCheckedChildren` (`string \| TemplateRef`) | `string \| Snippet` with the React/Vue names. All three libraries accept plain text; the snippet is the Svelte counterpart of a React node, a Vue slot and an Angular template. |
| Change | `onChange(checked, event)` | `change(checked, event)` | `(ngModelChange)(boolean)` | `onchange(checked, event)`. |
| Click | `onClick(checked, event)` | `click(checked, event)` | — | Native `onclick(event)`, see "Agreed decisions". |
| Loading | `boolean` | `boolean` | `nzLoading` boolean | `boolean`; no delay (Button's `{ delay }` is not part of Switch in any library). |
| Methods | `focus()`, `blur()` | `focus()`, `blur()` | `focus()`, `blur()` | Same. |
| Semantic styling | `classNames`/`styles`, objects or functions (6.0.0) | — | — | Objects only, v1.0. |
| Full control | `checked` + `onChange` | `checked` + `change` | `nzControl` | Function binding. |

## Agreed decisions (2026-11-10)

1. **`onclick` keeps the native `(event)` signature**, as in Button; the new state is read from
   `onchange`. React and Vue pass `(checked, event)`. The alternative would make one `onclick`
   behave differently from every other native-named callback in the library.
2. **`styles` keys are kebab-case with no automatic `px`**, as in a `style` attribute. This is
   the shared contract; Button follows it when its reserved `styles` is implemented. The
   alternative was React's camelCase with automatic units.
3. **The unchecked track is darker than in Ant Design's visual design** so the 3:1 non-text
   contrast holds (see A11y). Only that state differs.
4. Earlier choices: the Vue API was read from the docs markdown; `checked` is the only state prop
   (`$bindable`); `size` is `medium`/`small` plus the `default` alias; `classNames` and `styles`
   are in v1.0.
5. **The switch keeps one width in both states** (decided after a review of the first
   implementation, 2026-11-10). That first version mounted only the content of the current state,
   so the width followed the text: "On" to "Off" moved neighbours by 0.7 to 2.3 px in Ubuntu, DejaVu
   and Noto, "Yes" to "No" by about 3 px and "Happy" to "Sad" by about 15 px (checked at 12px; the
   headless Chromium of the tests, with Liberation Sans, showed 0.2 px and hid the problem).
   Chosen: mount both and reserve the width of the wider one, with the shorter centered.
   Rejected: leaving it to the consumer (`styles.root` `min-width`, a number that depends on the
   font and the language) and changing only the demo.
6. **`checkedChildren` and `unCheckedChildren` accept a plain string as well as a snippet**
   (decided 2026-11-10 after a review of the demo). The first version took only snippets, which was
   a gap: React (`ReactNode`), Vue (`string | slot`) and Angular (`string | TemplateRef`) all
   accept text, and a snippet for a word such as "On" is noise. Additive and cheap. Only `string`:
   numbers are not accepted, and text is never interpreted as HTML.

## Решения и обоснование

- `loading` keeps focus and uses `aria-disabled`, like Button: the same reasoning (a natively
  disabled element drops focus when an action starts).
- The root is a native `<button>`: Space and Enter, focus and `disabled` come from the platform.
  A `<input type="checkbox" role="switch">` would give form submission, but Ant Design's Switch
  does not take part in native forms, and an extra hidden input is not worth it.
- Design tokens: `--ads-switch-*` are in `tokens.css`, each consumed by the component. The
  dimensions follow the default values of the public Ant Design token table (checked 2026-11-10):
  track height 22 / small 16, minimum width 44 / 28, handle 18 / 12, padding 2, content margin
  9 to 24 / 6 to 18, handle shadow `0 2px 4px 0 rgba(0,35,11,0.2)`, white handle. The colors are
  our own, chosen for contrast (see A11y), and the disabled opacity is ours.
- Positions use logical properties (`inset-inline-start`, `padding-inline`), so the switch
  mirrors in right-to-left layouts (covered by an e2e test).
- The validation helper `resolveOption` (now inside `Button.svelte`) moves to `src/lib/internal/`
  so Button and Switch share it. Button's tests and mutation score must stay green.
- All code is independently authored for Svelte. Ant Design implementation source was not used.

## Страница на сайте

`docs/` page at `/components/switch/` (en, ru, zh). One live example per item; the API, methods and
design tokens tables are compared with the source by `tests/docs/switch-page.test.ts`, which also
checks that every prop and method appears in at least one example.

| Example | Spec items |
|---|---|
| `01-basic` | `checked` (`bind:`), `onchange` |
| `02-disabled` | `disabled` |
| `03-text` | `checkedChildren`, `unCheckedChildren`: text as strings, icons as snippets; small with text; no layout shift |
| `04-sizes` | `size`: `medium`, `small`, the `default` alias |
| `05-loading` | `loading`, focus kept, ignored activation |
| `06-control` | function binding, `onclick` with `preventDefault()` |
| `07-semantic` | `classNames`, `styles` (including custom properties), `class`, `style` |
| `08-methods` ("Focus and blur") | `focus()`, `blur()` |
| `09-labels` | accessible name: `<label for>`, `aria-label`, `aria-labelledby`, `aria-describedby`, `title` |

The demo of the methods is titled "Focus and blur", not "Methods": a page may not have two landmark
regions with the same name (the demo section and the methods table).

## Список тестов

Each item is at least one test; the test name is the item.

- Default render: `role="switch"`, `type="button"`, `aria-checked="false"`, `medium` size.
- `checked`: initial `true`/`false`; `bind:checked` updates the parent; plain `checked={x}` toggles
  locally; a later change of the prop by the parent updates the view; `aria-checked` follows.
- `onchange`: called once per click with `(newValue, event)`; not called on a prop change; called
  once each for rapid clicks; not called while disabled or loading.
- Function binding: a parent that refuses a change keeps the switch unchanged; one that accepts
  it changes.
- `onclick`: native event, once per click, runs before the state flips, suppressed while disabled
  and loading; `preventDefault()` cancels the toggle and `onchange`.
- Keyboard: Enter and Space toggle; other keys, including arrows, do nothing; Tab reaches it;
  disabled is not in the Tab order; loading is in the Tab order and ignores Enter and Space.
- `disabled`: native `disabled`, no callbacks; `disabled` + `loading` stays natively disabled.
- `loading`: spinner shown, `aria-busy`/`aria-disabled`, focus kept when it starts, state does not
  change; consumer `aria-disabled`/`aria-busy` forwarded when not loading, overridden when loading.
- `size`: `medium`, `small`, and the `default` alias map to the right classes; an invalid value
  throws `RangeError` outside production and falls back to `medium` in production.
- `checkedChildren` / `unCheckedChildren` as strings: shown as text in the state, hidden in the
  other; special characters and markup in a string are text, not HTML; an empty string renders
  nothing; a string and a snippet can be mixed (one of each); a changed string is rendered; the
  width reservation, the centering and `aria-hidden` work the same as for snippets.
- `checkedChildren` / `unCheckedChildren`: both are rendered and only the active one is visible
  (the other is marked hidden); each alone; neither; the content part is `aria-hidden`; they swap
  when the state changes. In the browser (e2e): the width and the position of the next element do
  not change on a toggle for "On"/"Off", "Yes"/"No" and "Happy"/"Sad", in both sizes; the shorter
  text is centered; the hidden content is `visibility: hidden`.
- `classNames`: each of the three parts gets its class; classes are appended, not replacing;
  `class` and `classNames.root` both reach the root.
- `styles`: each part gets its style; kebab-case keys and custom properties; numbers as-is;
  override the token-based value; update reactively; removed when the prop is cleared.
- Native attributes: `id`, `title`, `data-*`, `aria-label`, `aria-labelledby`, `tabindex` and other
  handlers forwarded; `type`, `role` and `aria-checked` are not overridable.
- A label (`<label for>`) names the switch and a click on it toggles the switch; a switch inside
  a form does not submit it.
- `focus()` and `blur()` move and remove focus.
- Reactivity: changing `size`, `disabled`, `loading` and the snippets re-renders correctly.
- Axe: a switch named with `aria-label`, `aria-labelledby` and `<label for>`; checked, unchecked,
  disabled, loading, small; a negative check that an unnamed switch is reported.
- Visual states (`:hover`, `:active`, `:focus-visible`, disabled, loading, small, checked/unchecked,
  `prefers-reduced-motion`) in Playwright (`e2e/switch.spec.ts`), comparing computed styles with the
  design tokens; a contrast matrix (state x light/dark) checks track and handle contrast >= 3:1 and
  the focus ring >= 3:1.
- The internal `classNames`/`styles` helper has its own unit tests.
- Mutation testing: `npm run test:mutation -- --target=Switch` applies one mutation at a time to
  `Switch.svelte` and runs `tests/Switch.test.ts`. Current result: 100% (53 of 53 killed). The score
  depends on the code around each mutation, so re-run it after editing the component.
