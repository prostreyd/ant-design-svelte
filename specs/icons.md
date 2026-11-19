# Icons specification (internal primitive)

Status: **decided 2026-11-18, implementation in `feat/internal-icons`** (stacked: `feat/overlay-primitives` -> `feat/internal-icons` -> `feat/modal`). The maintainer
chose to extract the icons before the Modal (decision D3, option B of `specs/modal.md`), knowing that it touches four released components.

One shared block under `src/lib/internal/icons/`: a decorative `<svg>` drawn from plain geometry. It is not a component of Ant Design, is not exported from the
package and has no page of its own. Nothing in it is taken from the source code of Ant Design or of its icon package; the shapes are the ones the four components
already draw (rule 6b: extract before the second user, do not copy). API inspired by Ant Design (MIT); the implementation is original for Svelte.

## What it is, and what it is not

`Icon.svelte` draws one of a fixed set of small icons on a 16 x 16 grid, `1em` square, in `currentColor`, hidden from assistive technology. It is **not** a public icon
library (the library has no `Icon` component; `Icon` and the icon set of Ant Design are planned for a later version) and it takes no color, size or name of a file:
the owner sets `color` and `font-size` on the element that holds it, as every component does now.

## Who needs it

Four components have a private icon file each, with the same shape and the same CSS, and the Modal would be a fifth:

| File | Icons | Used by |
|---|---|---|
| `Message/MessageIcon.svelte` | `info`, `success`, `error`, `warning` (a disc with the sign cut out), `loading`, `close` | `MessageItem` |
| `Select/SelectIcon.svelte` | `arrow`, `search`, `clear` (a disc with a cross cut out), `check`, `remove`, `loading` | `Select` |
| `Input/InputIcon.svelte` | `clear`, `eye`, `eye-off`, `search`, `loading` | `InputPassword`, `InputSearch`, `ClearButton` |
| `Menu/MenuIcon.svelte` | `arrow`, `ellipsis` | `MenuList` |
| the Modal (`specs/modal.md`) | `close`, and the four status discs for `modal.confirm`, `info`, `success`, `warning`, `error` | `Modal`, `ModalHost` |

The set is the union: `arrow`, `check`, `clear`, `close`, `ellipsis`, `error`, `eye`, `eye-off`, `info`, `loading`, `remove`, `search`, `success`, `warning` (14).
`close` (Message: stroke 1.8, from 3.8 to 12.2) and `remove` (Select: stroke 1.4, from 4.4 to 11.6) stay two icons because they are drawn differently and the pixels of two
released components must not change.

## Requirements

- **I1.** `<Icon name>` renders one `<svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">`, with `display: block`, `flex: none`, no fill, `stroke: currentColor`,
  `stroke-width: 1.4`, round caps and joins. `class` is added to the classes of the icon (`ads-icon ads-icon-<name>`).
- **I2.** The geometry of every icon is **the same** as in the file it came from: the markup (paths, circles, masks, attributes) is equal, which a test compares against what each of
  the four files drew.
- **I3.** The icons that cut a sign out of a disc (`info`, `success`, `error`, `warning`, `clear`) use a mask whose id is unique per instance (`$props.id()`), so two icons in one page never share it.
- **I4.** `loading` turns (`--ads-motion-duration-spinner`, linear, endless), slower under `prefers-reduced-motion` (`--ads-motion-duration-spinner-reduced`), with a track at 25% opacity and a 2 px arc.
- **I5.** The icon is decorative: no `role`, no `title`, no name. The element that holds it carries the accessible name (as the four components already do).
- **I6.** No global CSS: the styles are scoped to the icon.
- **I7.** The four old files stay as thin adapters that pass their own class names (`ads-message-svg ads-message-svg-<name>`, `ads-select-icon ads-select-icon-<name>`, `ads-input-icon ads-input-icon-<name>`,
  `ads-menu-icon`, `ads-menu-icon-ellipsis`), so that every call site, every test and every `querySelector` keeps working and the pixels do not change. The Modal uses `Icon` directly.
- **I8.** The server renders the same markup (no browser API is used).

## Decisions

1. **Thin adapters, not a rewrite of the call sites.** Six files call the four icon files (`MessageItem`, `Select`, `InputPassword`, `InputSearch`, `ClearButton`, `MenuList`), and
   ten tests look at the class names. An adapter of five lines per component keeps all of them as they are; the duplicated geometry and CSS (about 270 lines) are gone.
2. **`close` and `remove` are two icons** (above), and the spinner has one shared `@keyframes` (`ads-icon-spin`) instead of three equal ones with other names.
3. **No size or color prop.** The components already size and color the holder; a prop would invite a second way.
4. **The names are a closed union**, not a free string: a wrong name is a type error.

## Tests (each item is at least one test)

- I1, I5, I8: every name renders the svg with the attributes above, no `role` and no `title`; the class names are merged; the server render has the same markup.
- I2: for each name, the markup equals the markup the old file drew (the expected markup is written down in `tests/Icon.test.ts` from the old files, mask ids normalized).
- I3: two icons that use a mask have different ids and each `mask="url(#id)"` points at its own mask.
- I4: the `loading` icon has the track and the arc; it turns every second and endlessly, and every 2.5 s under reduced motion (`e2e/icons.spec.ts`, three engines).
- I7: the four adapters pass the classes their tests expect (the existing tests of Message, Select, Input and Menu pass unchanged).
- Parity in a real browser (done once, 2026-11-18, by a script that is not kept): the 19 icons (owner and name) of the four old files, taken from git, and the same 19 drawn by the new
  adapters, **in the same cell of a page** (two loads), at 48 px: identical pixels and identical computed styles of the svg and of every child, in Chromium 158, Firefox 159 and WebKit 27.2; a
  control that draws the old files twice also gives 0 differences. (Drawn in **different** cells, Chromium differs for the same old code in 8 of 19: the rasterization depends on the
  position, so only the same cell is a fair comparison.)

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Icon.test.ts`: `aria-hidden="true"` and `focusable="false"` on every icon, no role and no name; the holders keep naming themselves (`tests/MessageIcon.test.ts` and the tests of the four components) |
| Forced colors | n/a | the icons are drawn in `currentColor`, which a forced-colors mode maps to a system color; they have no color of their own |
| IME | n/a | no text input of its own: an icon is only drawn |
| Touch | n/a | not interactive: the button that holds an icon is tested in its own component |
| Browsers | test | `e2e/icons.spec.ts` (the spinner, three engines) and `npm run test:e2e`: the Select, Input, Menu and Message specifications draw these icons in Chromium, Firefox and WebKit |
| Browser floor | test | `npm run test:floor`: the Select, Input and Message pages of the smoke draw them in Chromium 90, Firefox 85 and WebKit 15.4 |
| Screen reader | n/a | decorative and hidden; the holders are checked by the Orca tests of their own components |

## Dependencies

Rule 6b: a shared part, it imports no component. `Message`, `Select`, `Input` and `Menu` take it through their adapters, and the Modal takes it directly (their specifications name `icons`).
