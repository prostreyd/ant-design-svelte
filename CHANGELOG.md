# Changelog

Public-facing change history. User-visible changes, new components, bug fixes,
improvements, and breaking changes go here. Internal debugging details and minor
development actions do not.

Format follows [Keep a Changelog](https://keepachangelog.com/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed

- Internal, no change for users: the parts that every layer needs are now shared. Moving a panel out of its place in the page
  (`portal`) and waiting for a leave animation (`anim`) were taken out of `Popup`; `Popup`, `Tooltip` and `Select` behave as
  before. New shared part for the Modal and the Drawer (`overlay`): the page does not scroll while a layer is open and does
  not jump sideways, the page behind the layer is out of reach of the keyboard, the pointer and assistive technology, focus
  stays inside the layer and comes back, and Escape closes the topmost layer. None of this is exported from the package yet.

### Documentation

- `Menu`: a popup that opens beside a vertical menu is flipped to the side with more room but not moved inside the window, so on a
  screen narrower than the menu and its popup it can be cut off (the public demos of Ant Design differ here: React leaves it off
  the screen or opens it above, Vue pushes it over its menu, Angular does not flip). The page, the README and the specification now say
  so and advise `mode="inline"` there, and the examples with vertical menus are narrower on a phone, so their popups stay inside the
  screen; a test of the site checks it at 390 and 360 px.

## [0.11.0] - 2026-11-18

### Added

- `Menu`, with `MenuItem`, `MenuSubMenu`, `MenuItemGroup` and `MenuDivider`: a list of choices for navigation. Three types:
  `horizontal` (a bar; items that do not fit move into a "…" item), `vertical` (submenus open in popups) and `inline`
  (submenus expand in place, with `inlineIndent`; `inlineCollapsed` narrows it to icons with a tip on every item and popup
  submenus). `theme` `light` or `dark`, and a submenu may have a theme of its own for its popup. The content is `items`
  (items, submenus, groups, dividers; `label` and `icon` as text or a snippet, `extra`, `title`, `disabled`, `danger`,
  `popupClassName`, `popupOffset`, `ontitleclick`, `popupRender`) or the markup components, in the order of the markup also
  after `{#if}` and `{#each}`. `bind:selectedKeys` and `bind:openKeys` (no `defaultSelectedKeys` or `defaultOpenKeys`),
  `multiple`, `selectable`, `triggerSubMenuAction`, `subMenuOpenDelay` and `subMenuCloseDelay` (seconds), `forceSubMenuRender`,
  `expandIcon`, `overflowedIndicator`, `overflowLabel`, `tooltip`, `classNames`, `styles`, `popupRender`, and the callbacks
  `onclick`, `onselect`, `ondeselect` and `onopenchange` (the user's changes only). Keys are strings. Accessibility follows the
  menu and menubar patterns of the WAI-ARIA Authoring Practices: one Tab stop on an item, the arrow keys, `Home`, `End`,
  `Enter`, `Space`, `Escape` and typing a letter; a selected item is `menuitemradio` (`menuitemcheckbox` with `multiple`) with
  `aria-checked`, so it is spoken; icons are hidden from assistive technology; ids are unique per menu; the keyboard and touch
  open a popup whatever `triggerSubMenuAction` says. Three colors of the Ant Design token table are below 4.5:1 (the selected
  item, the group title, the danger item) and so are two fills of the dark menu; `tokens-accessible.css` darkens them and the
  dark theme of the page needs no file. Forced-colors modes, `prefers-reduced-motion` and right-to-left are covered; selecting,
  hovering and focusing never move an item. Not checked with a real screen reader or on a real touch device. The page with
  examples, the API and the design tokens is on the documentation site, in English, Russian and Chinese.

### Changed

- Publishing to npm now waits for every check of the CI. A version tag starts three stages in `publish.yml`, and nothing is
  published unless all of them are green: a quick guard (the tag matches the version in `package.json`, the tagged commit is on
  `main`, the version is not in npm yet), then every job of `ci.yml` (lint, types, unit tests with coverage, the package, the
  browser tests of the library and of the site in three browsers), then `npm publish`. Before, the tag ran only lint, types, unit
  tests and the build, so a red browser test did not stop a release (the browser tests of 0.10.0 had not run when it was
  published). A red stage leaves npm untouched; a job that failed only because the runner could not install the browsers is run
  again with "Re-run failed jobs". Trusted Publishing is unchanged (the file is still `publish.yml`, the environment `npm`).
  The two browser jobs of the CI now run in the official Playwright image (`mcr.microsoft.com/playwright:v1.65.0-noble`), which already
  holds the three browsers and their system packages, so a job downloads and installs nothing at the start. Before, each run
  installed them with `apt`, and on 2026-11-18 the Ubuntu mirror of the runners was so slow (76 packages in 8 minutes) that every
  browser job of the day, the one of `main` included, timed out there before a test ran. `tests/ciPlaywright.test.ts` keeps the
  tag of the image equal to the version of Playwright in `package-lock.json`. In a container job Firefox does not start unless
  `HOME=/root` is set (the `$HOME` of the container belongs to another user), so the two steps that run Playwright set it, and
  the same test keeps it. `ci.yml` can now also be called from another workflow (`workflow_call`). The rules for AI assistants say how a release goes
  now: the tag is set right after the merge into `main`, and GitHub decides whether to publish.

### Documentation

- The rules for AI assistants say what a component checks on this machine before it is released: only its own browser tests, the
  tests of the components that import it or whose shared code it changed (extending the popup primitive checks `Select` and
  `Tooltip`), and the pages of these components on the site. The files that every new component adds its own lines to (tokens,
  the exports, the test stand, the registries of the site) no longer make the machine run everything; the planner of the checks is
  asked with the files of the component (`--files`). The full run of every component is done by the CI on GitHub. A port of a
  test server is checked for its owner, not only for being free: a run once went to the build of another worktree.
- The rules also describe a joint release of several finished components: one branch that gathers them, one CI run on GitHub, one
  version (+0.1.0 once, whatever the number of the new components) and one tag.

## [0.10.0] - 2026-11-18

### Added

- `Spin`: a loading indicator of four turning dots, with `spinning`, `delay`, `size` (`small`, `medium`, `large`; `default` is an
  alias of `medium`), `description` (a string or a snippet), `indicator` (a snippet), `percent`, `fullscreen`, `classNames` and
  `styles` for the parts `root`, `section`, `indicator`, `description` and `container`. Standalone it is only the indicator and renders
  nothing while it is not spinning; with children the content is dimmed (half opacity) and ignores the mouse and the text selection,
  and the indicator is centered over it. The API is inspired by Ant Design; the implementation is original for Svelte.
  - `delay` starts again every time `spinning` becomes true (also at mount), turning it off hides at once and a repeated true starts no
    second timer, so a quick load never flashes. Embedded, the content is not dimmed until the indicator appears, and a Spin that is
    spinning at mount is dimmed from the first paint, with no fade from full opacity.
  - `percent` draws a progress ring (`role="progressbar"`, named by the description or `aria-label`); `percent="auto"` is an
    indeterminate ring that turns, with no timer and no changing value for a screen reader (the Ant Design one is simulated in script).
  - `fullscreen` is a dimmed backdrop over the viewport, drawn in place (`position: fixed`), that blocks the pointer; it has no focus
    trap and does not lock the scroll, and the page says so. It leaves at once, so it never blocks the page after the loading ends.
  - A screen reader hears the `description` in a `role="status"` element; the covered content gets `aria-busy` (not `inert`: the
    keyboard still reaches it). A Spin with no description or name logs one warning in development.
  - Dots and ring are visible in forced-colors modes such as Windows High Contrast (the default indicator of Ant Design disappears there),
    and `prefers-reduced-motion` slows the turn instead of ignoring the setting. With `tokens-accessible.css` the description keeps 4.5:1
    and white text on the fullscreen backdrop keeps 4.5:1 over a white page.
  - Page of `Spin` on the documentation site, with 9 examples and the API, semantic parts and token tables in English, Russian and Chinese.
    Not checked with a real screen reader (Orca, NVDA, JAWS, VoiceOver); the page and the README say so.
  - Not taken: `tip` and `wrapperClassName` (deprecated in Ant Design), the function form of `classNames` and `styles`,
    `Spin.setDefaultIndicator` and `nzSimple`. A default `indicator` and `size` are reserved for ConfigProvider in v1.1.

### Documentation

- `npm run test:affected` no longer runs every browser test when a file in `screen-reader/` changes. Those tests use a real
  screen reader (Orca) and run only in the workflow `Screen reader` on GitHub (on `main`, on pull requests and by hand), never on
  this machine, so a change there has nothing to run here. Before, such a file was "unknown" to the plan and started the whole
  run, which took about half an hour. The rules for AI assistants say it too.

## [0.9.1] - 2026-11-17

### Fixed

- `Message`: the close button (`closable`) is easier to see. The cross was 12px with a thin line and no background, and next to the
  disc of an `error` message, which has a cross in it too, it did not read as a button. The cross is now 16px with a thicker
  line, the button has a faint background at rest (`--ads-message-close-bg`) and a stronger one on hover, in the light and
  the dark theme. The box keeps its 40px height. One token is new: `--ads-message-close-bg`.

## [0.9.0] - 2026-11-17

### Added

- **`Message`** (with `MessageHost`): a short notice at the top of the page that goes away by itself, opened by a call from
  code, from anywhere: `message.info`, `success`, `error`, `warning`, `loading`, `open`, `destroy` and `config`. The library
  makes the layer itself when the first message opens and removes it when the last has gone; a `<MessageHost>` in the app
  takes the messages over and holds the settings (`top`, `duration`, `maxCount`, `container`, `closable`, `labels`,
  `classNames`, `styles`, `stack`). A call returns a function that closes the message and is also thenable (`.then` runs
  when the message starts to close, so `await message.info(...)` waits for the close, as in React and Vue); a call with the
  `key` of an open message updates it in place. `content` is a string, a number or a snippet, `icon` a string, a snippet or
  `false`, and `class`, `style`, `classNames` and `styles` address the box and its parts. The timer waits while the pointer
  (not a touch), the focus or a hidden page holds it. New: `closable` (a close button of 24px; `Escape` closes the message
  that has focus in it) and `stack` (React 6.4.0: the newest message first, and past a threshold the others lie behind it as
  a pile that the pointer or focus opens). A role per type (`alert` for `error` and `warning`, `status` for the rest) and a
  hidden type word read before the text, translated through `labels`, where Ant Design React gives `role="alert"` to all and
  Vue and Angular give none. 23 `--ads-message-*` tokens, light, dark and accessible (`tokens-accessible.css` darkens the
  green and the amber icon to 3:1). Not checked: whether a screen reader announces a message when it opens, NVDA, JAWS,
  VoiceOver, a real touch device and a real Safari.

### Documentation

- The rules for AI assistants say how a component takes another component. Before the specification, the assistant checks
  `origin/main` for what the new component can reuse (whole public components, shared parts in `src/lib/internal/`) and, if a
  needed part is missing, stops and asks the owner to make it first instead of writing a copy. The specification gets a
  "Dependencies" section. There are three ways to depend: render the whole public component (when the user sees the same
  element and can set it with the same props, as `InputSearch` draws a `Button`), take a part or a primitive from `internal/` (when only
  a mechanism is needed, as the popup), or share state through a context, a rune class or an attachment (as `Breakpoints` of
  the `Grid`). `internal/` imports no component, components make no cycles, a component is imported only through a file that
  `src/lib/index.ts` exports, and a part is moved to `internal/` before its second consumer.
- The rules for AI assistants describe working on several components at once: a new component is made in its own
  `git worktree` on a branch `feat/<name>` from `origin/main` (the main folder is shared by the chats and is not touched),
  with its own ports for the tests, no heavy runs in two chats at the same time, additive edits in the files that every
  component changes, and, before the merge, the current `main` merged into the branch (not rebased, force-push is
  forbidden), a new green CI, the version counted from `main` at the moment of the merge, and the worktree removed after
  the release. A short request such as "let's make the `Menu` component" is now enough to start.
- `npm run check:docs` now also checks the dependencies between the components of the library. It fails on a cycle between
  components, on a component that `internal/` imports, on a component that reaches into another one's private files instead of a
  file the package exports, on a dependency that is not written down with its reason, and on a specification that has no
  "Dependencies" section or does not name the components and the primitives of `internal/` that the component uses. The
  specifications of `Button`, `Checkbox`, `Grid`, `Input`, `Radio`, `Select`, `Switch` and `Tooltip` got that section.

## [0.8.0] - 2026-11-17

### Added

- `Grid`: `Row` and `Col`, the 24-column layout, with `Breakpoints` to read the screen from code. A `Row` has `align`, `justify`,
  `gutter` (pixels, a CSS length, a value per breakpoint, or `[horizontal, vertical]`) and `wrap`. A `Col` has `span` (`0` hides it),
  `offset`, `push`, `pull`, `order`, `flex` and the responsive `xs`, `sm`, `md`, `lg`, `xl`, `xxl` and `xxxl`, each a span or an
  object of the same props. The API is inspired by Ant Design; the implementation is original for Svelte.
  - The gutter is a flex `gap`, not a negative margin with padding on the columns, so a `Row` is exactly as wide as its parent and
    never makes a page scroll sideways (the Ant Design `Row` does, an open issue since 2018). The boxes of the content are in the
    same places as in the Ant Design demos; a column's own background does not paint the gutter.
  - The responsive values are resolved in CSS (the component writes its values as custom properties and static media queries pick
    them), so the server and the browser render the same markup and nothing flashes on hydration. The breakpoints (576, 768, 992,
    1200, 1600 and 1920 px) are fixed and exported as `BREAKPOINTS`.
  - `Breakpoints` is a class with `xs` ... `xxxl` and `current`; its values are right on the first render in a browser (the
    Ant Design hook returns an empty object there) and it includes `xxxl`.
  - A single length in `flex` (`'100px'`) is a fixed width, as in the Ant Design demos, although their table says "applied as written".
  - `Row` and `Col` have no role and no state; `order`, `push` and `pull` change only how the columns are drawn, and the page says so.
  - Page of `Grid` on the documentation site, with 16 examples and the API tables in English, Russian and Chinese.

### Documentation

- The rules for AI assistants say how the examples of a component page are laid out and what state they keep: every group and
  every separate control on its own line (as in the demos of Ant Design), texts and controls not mixed (a caption above the
  control it names, its output under it, no loose text beside the controls), every component with a state of its own (two
  groups do not share a bound variable unless the example is about a shared value), and the page is checked on the built site
  by clicking in each group in both themes, with a site test that the groups are independent.
- On every page of a component the examples stand in two columns in the order of reading (1 | 2, 3 | 4) and one column on a
  phone. They used to flow in CSS columns, so a block that did not fit jumped to the top of the other column and the order
  depended on the heights, the language and the width. The rules for AI assistants forbid CSS columns for the list of examples,
  and a site test checks the order on every component page. A demo that needs room takes both columns (the placement demo of
  the `Tooltip`: in the right column a tip on the right turned to the left, and the demo no longer showed the right placements).
- On the page of `Input`, the examples "One-time code" and "One-time code options" show each `InputOTP` on a line of its own,
  with a short caption of the option it shows, instead of mixing the fields, their texts and each other in one flow.
- On the examples of every component page, the button that shows the code now looks different when the code is shown: the
  brackets `< >` turn into brackets with a slash `</>` (as in the demos of Ant Design) and the button keeps a tinted background,
  so the state can be read without pointing at it. Before, only the colour of the same glyph changed.
- The left menu and the menu on a phone show the names of the components in English only (`Button`, `Radio`, `Select`),
  without the Russian or Chinese translation beside them. The translated note stays in the heading of each component page.
  The rules for AI assistants say both, and the site tests check them in all three languages.

## [0.7.0] - 2026-11-16

### Added

- `Radio`, `RadioButton` and `RadioGroup`: one choice out of several that are all visible. A radio is a native
  `<input type="radio">` in a `<label>`; the group renders `options` (strings, numbers, booleans or objects with a text or
  snippet `label`, `disabled`, `title`, `id`, `required`, `class`, `style` and `onchange`) or holds your own `Radio` and
  `RadioButton` elements. `bind:value` and `bind:checked`, `onchange`, a function binding that lets the parent refuse a
  choice (the previous radio is put back), `optionType="button"`, `buttonStyle` (`outline` or `solid`), `size` (`middle` and
  `default` are aliases of `medium`), `orientation` and `vertical`, `block`, `disabled`, `name`, `classNames` and `styles` for
  the parts of each component, and `focus()` and `blur()`. `value` is a string, a number or a boolean; `null` and
  `undefined` mean nothing is selected. The group is `role="radiogroup"`, and its inputs share one native name, so the
  browser gives it the keyboard behavior of a radio group: one Tab stop on the selected radio, arrow keys that move and
  select (at the ends Chromium and Firefox wrap around and WebKit stops), and Space. A group without a `name` makes a
  unique one and is never submitted with a form (React submits its random name). The accessible colors, the dark theme
  and forced-colors modes are covered; selecting never changes the size of a control. Not checked with NVDA, JAWS or
  VoiceOver (a public report says VoiceOver may stop twice on a label that wraps the input and its text, the shape used
  here) or on a real touch device; Orca is checked by an automated test. The page with examples, the API and the design
  tokens is on the documentation site, in English, Russian and Chinese.

### Documentation

- The pages of `Switch`, `Checkbox`, `Input` and `Select` no longer have the "Focus and blur" example. `focus()` and `blur()` (and
  the `cursor` and `preventScroll` options of `Input`) stay in the methods table of each page, and their tests stay. The page of
  `Radio` has none either.
  The rules for AI assistants say the same for the pages of new components: a method with no visible result is a row of the
  API table and a test, not an example.

## [0.6.0] - 2026-11-15

### Added

- `Tooltip`: a short text tip for an element, built on the popup of the library. 12 placements that flip at the edge of
  the screen, an arrow (`pointAtCenter`), `hover`, `focus`, `click` and `contextMenu` triggers with delays in seconds,
  `bind:open` and `onopenchange`, `title` as text, a number or a snippet, `zIndex`, `container`, `destroyOnHidden`,
  `classNames` and `styles` for the `root`, `container` and `arrow` parts, and `anchor` to place the tip at an element
  you hold. The 13 preset colors and any CSS color work as `color`; the text is black or white, whichever contrasts
  more, so it reaches 4.5:1 (Ant Design draws white on every preset, which is below 4.5:1 on most of them). The tip has
  `role="tooltip"`, the trigger gets `aria-describedby` only while it is shown, it opens on keyboard focus as well as on
  hover (the default `trigger` is `['hover', 'focus']`; Ant Design for React: hover only), `Escape` closes it, and the
  pointer may rest in it. Not checked with a real screen reader or on a real touch device. The page with examples, the
  API and the design tokens is on the documentation site, in English, Russian and Chinese.

### Documentation

- The rules for AI assistants now ask to run, on the developer's machine, only the checks that a change affects
  (`npm run test:affected`, with `--dry-run` to see the plan and `--quick` for Chromium only) and to leave the full run to
  CI. The browser tests are chosen from the import graph of the library: a change in a component also checks the components
  that use it, and what imports cannot show (design tokens, configuration) runs everything. CI now starts on every pushed
  branch, and it has to be green before a branch is merged or released.
- The header of the documentation site is an ordinary block now: it scrolls away with the page instead of staying at the
  top of the screen. The sidebar and the table of contents stay in view under the top edge once the header has gone, and
  a link to a heading lands near the top.
- The rules for AI assistants add a quality matrix to the specification of every new component (rule 7a): for the
  accessibility pattern, forced colors, IME, touch, the three browsers, the lowest browser versions and a manual screen
  reader check it says whether a test covers it, a manual check with a date, or why it does not apply. A manual check that
  has not been done is marked as such on the README and the page of the component, and `npm run test:floor` joins the
  checks of a release.
- The README states the supported browsers and what has and has not been tested.

### Tests

- `npm run check:docs` also checks that the specification of a new component has a quality matrix that is filled in:
  every row is present, a test cell names files and scripts that exist, a manual check has a date, a row that does not
  apply has a reason.
- `screen-reader/`: tests with a real screen reader (Orca with Firefox, driven through Guidepup) for the Switch and the
  Checkbox: they assert what the screen reader says for the name and the state of a control and after Space. The workflow
  `Screen reader` runs them on a GitHub runner, apart from the CI of the library.

## [0.5.2] - 2026-11-13

### Fixed

- `Select` on a touch screen: an open list is no longer closed by the first touch of a scroll. A touch outside the
  list now closes it only as a tap: the finger comes up where it went down, the browser did not take the touch for
  scrolling, and no second finger went down. The list stays open while the page is scrolled with a finger, until an
  option is chosen or the user taps somewhere else. The mouse and the pen are unchanged.
- `Select` in Safari (WebKit): an option could not be chosen by a tap, because the browser sent no `click` to an
  element that has no click listener of its own (Svelte puts the handler on the document). Every option now has one.

### Documentation

- The documentation site on a phone: the menu behind the burger button was only 49 px high, so the link to the page
  with the list of components (and the one to the changelog) was cut off; it now fills the screen under the header.
- The components overview page: each card is now the name of the component and a drawn silhouette of it (before, every
  ready card showed the same two buttons). A ready component has blue lines, a solid border and an arrow, the whole card is
  the link; a planned one has grey dashed lines and no arrow. The state is told to screen readers only.

- The rules for AI assistants now allow studying the source code of single mechanisms of Ant Design, to understand a
  technique and judge it, and say on what conditions: the decision is written down before reading, only the mechanism in
  question is read, nothing is copied, ported or retold line by line, and what was read is recorded in the specification
  (date, question, what was read, by whom). Studying the public demos as a black box (geometry, recorded frames, screen
  readers) is listed as a way to compare behavior. The library stays an independent implementation.
- The rules for AI assistants now say that a branch merged into `main` is deleted, locally and on GitHub, and that a release
  is marked by its tag, not by a `release/*` branch.

### Tests

- `npm run test:floor` runs a smoke of the library in the engines of the lowest supported versions (Chromium 90 for Chrome 89,
  Firefox 85, WebKit 15.4) from the Docker images of old Playwright releases, with an audit that asks each engine whether it
  understands every selector, declaration and media query of the shipped CSS.

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
