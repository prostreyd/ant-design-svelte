# Typography specification

Status: **agreed with the maintainer on 2026-11-24 (workflow stage 2 done): Q1 A, Q2 A, Q3 A, Q5 A, Q6 A, "Orca: needed" (P23), P1 to P23 accepted as written** (see "Agreed
decisions"; the maintainer saw the comparison with the three libraries and said "всё устраивает"). Q4 was settled earlier: he made the icons first (option B), and they are in
`main` as the public Icon family (0.15.0, 0.15.1). Step 0 was repeated on 2026-11-24 after merging `origin/main` into this branch (see "Dependencies"). **Implemented, tested and
documented (workflow stages 3 to 6, 2026-11-24 and 25)**; what it found out is in "Implementation notes". Not committed: it waits for the maintainer's "запуш".
Worktree `../ant-design-svelte-typography`, branch `feat/typography` (created from `origin/main` at `4f2bf5b`, 0.14.1; merged with `8a2b463`, 0.15.1).

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers and black-box observation of the public demos (CLAUDE.md sections 2, 4a and 7a).
Q2 offers a reader subagent for one mechanism (the cut of long text); none was started.

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/typography> (the page's markdown and its demos, rendered) | the page of the `master` branch, 6.7.x (`shimmer` is 6.7.0), 2026-11-20 |
| Ant Design Vue | `components/typography/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-20. The old 3.x API |
| NG-ZORRO (Angular) | `components/typography/doc/index.en-US.md` in the repository (docs text) | `master`, 22.2.0, 2026-11-20 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line); the Vue and Angular trackers by title | 2026-11-20 |
| Issue trackers | React 56855, 54691, 54317, 54449, 58211, 58551, 59629, 59640, 42346, 54277, 57762, 48075, 25373, 36099, 49973, 59717, 59913, 58806; Vue 4227, 5746, 7145, 7552, 8175; NG-ZORRO 3664, 6606, 7832, 8420 (read through the GitHub API; code removed from the text; only 59913, 58806, 59717, 59640, 49973 were read in full, the rest by title and symptom) | 2026-11-20 |
| Black-box | the public demos on <https://ant.design/components/typography>, Chromium under Playwright, 1000 px, 2026-11-20 (results below) | |

## What it is

Text for articles, notes and interfaces. Five parts, all in React; Vue has no `Link` part and Angular has a single attribute
directive on native tags:

1. **`Typography`**: an `<article>` root. It carries the base text styles and styles the plain tags inside it (`h1` to `h5`, `p`,
   `a[href]`, lists, `blockquote`, `pre`, `code`, `kbd`, `mark`).
2. **Title** (`h1` to `h5` by `level`), **Paragraph** (a block), **Text** (inline), **Link** (an anchor).
3. Text styles on the three text parts: `type` (`secondary`, `success`, `warning`, `danger`), `disabled`, `strong`, `italic`,
   `underline`, `delete`, `mark`, `code`, `keyboard`.
4. Three behaviors on the text parts: **copyable** (a copy button), **editable** (a field that replaces the text), **ellipsis**
   (one or more rows, an expand button, a suffix, a tooltip with the full text).
5. React 6.4 to 6.7 additions: the **actions** bar placement, semantic `classNames` / `styles`, **`shimmer`** (animated "thinking" text).

Exports (proposal P1): **`Typography`**, **`TypographyTitle`**, **`TypographyParagraph`**, **`TypographyText`**,
**`TypographyLink`**, and types. Files: `src/lib/Typography/Typography.svelte`, `TypographyTitle.svelte`, `TypographyParagraph.svelte`,
`TypographyText.svelte`, `TypographyLink.svelte`, one internal `TextBase.svelte` (the shared body of the four text parts: decorations,
actions, edit field, ellipsis), `types.ts`, `copy.ts` (clipboard), `ellipsis.ts` (the search for the cut and the "clipped" check; plain functions, no runes), `README.md`.

## Black-box findings (2026-11-20)

Measured on the public demos (React 6.7.x), Chromium, white page, light theme:

1. **Elements.** The root is `<article class="ant-typography">`. Title is `h1` to `h5`, Paragraph a `<div>`, Text a `<span>`, Link an
   `<a>`. The text styles are **nested tags inside the span**: `strong`, `i` (italic), `u`, `del`, `mark`, `code`, `kbd`; the `type`
   and `disabled` are classes on the root of the part. A Link with `target="_blank"` gets `rel="noopener noreferrer"` although
   the demo sets only the target. Plain tags in the article (`ul`, `blockquote`, `pre`, `code`) are styled by the article.
2. **Sizes.** Headings 38 / 30 / 24 / 20 / 16 px, line height 46 / 38 / 32 / 28 / 24 px, weight 600, color `rgba(0,0,0,.88)`.
   Heading margins: top **1.2em** (36, 28.8, 24, 19.2 px for `h2` to `h5`; `0` for the first `h1`), bottom **0.5em** (19, 15, 12, 10, 8).
   Paragraph and the article: 14 px, line height 22 px, bottom margin **1em** (14 px). `ul`: bottom 14 px, `li` margin-inline-start
   20 px and padding-inline-start 4 px. `blockquote`: block margin 14 px, padding-inline-start 0.6em, a 4 px start border
   `rgba(100,100,100,.2)`. `pre`: padding `0.4em 0.6em`, fill `rgba(150,150,150,.1)`, border `1px rgba(100,100,100,.2)`, radius 3 px,
   monospace.
3. **Decorations.** `strong` weight 600. `mark` fill `#ffe58f`, text black (16.9:1). `code`: fill `rgba(150,150,150,.1)`, border
   `1px rgba(100,100,100,.2)`, radius 3 px, padding `0.2em 0.4em 0.1em`, size 85% (11.9 of 14 px), monospace, margin-inline 0.2em.
   `kbd`: fill `rgba(150,150,150,.06)`, padding `0.15em 0.4em 0.1em`, size 90% (12.6), radius 3 px, margin-inline 0.2em.
   `u` and `del` are plain `text-decoration`.
4. **Types and disabled.** `secondary` `rgba(0,0,0,.45)` (3.4:1 on white), `success` `#52c41a` (2.3:1), `warning` `#faad14` (1.9:1),
   `danger` `#ff4d4f` (3.3:1), `disabled` `rgba(0,0,0,.25)` (1.8:1) with `cursor: not-allowed`. Link `#1677ff` (4.1:1), hover
   `#69b1ff`, no underline, transition 0.3 s. **None of the type colors reaches 4.5:1**; `tokens-accessible.css` must darken them (P17).
5. **Copy.** A real `<button type="button" aria-label="Copy">` with a 14 px icon, 14 x 22 px, `margin-inline-start: 4px`, link color, lighter
   on hover, inside a `<span class="ant-typography-actions">` that follows the text (`-actions-start` puts it before). Hover shows a
   tooltip `Copy`. A click writes the text to the clipboard (confirmed by reading it back), swaps the icon to a check, and sets the
   button's **name** to `Copied` and the tooltip to `Copied`; it returns to `Copy` **3 s** later (between 3.0 and 4.0 s in the
   measurement). **No live region** announces it; the name just changes. Enter on the focused button copies again. A custom tooltip
   text becomes the button's name (`click here`). The icon-only form (a Text with only `copyable`) has the extra class `-copy-icon-only`.
   **A promised text** (observed 2026-11-25 on the React demo with a delayed text, after the maintainer asked about it): the icon becomes a
   spinning `loading` icon at once and stays until the check; the name stays `Copy`; the button is not disabled and has no `aria-busy`; a
   second click calls the text again (the 3 s restarted from it).
6. **Edit.** A real `<button aria-label="Edit">` with a pencil icon (same box as copy). A click replaces the text **in place**:
   the root becomes `ant-typography-edit-content`, holding a `<textarea rows="1" style="resize: none; height: 32px">` (the Input look,
   the root's full width) and an `enter` icon (`role="img" aria-label="enter"`). Focus goes to the textarea, the caret at the **end**.
   **Esc** closes and discards. **Enter** closes and keeps the text. **Blur** (a click elsewhere) and **Tab** also **keep** the text.
   After all three, **focus lands on the edit button**, even when the click went elsewhere. **Shift+Enter inserts nothing** (the
   field has no line breaks). **Enter during an IME composition** (CDP `imeSetComposition`, then Enter) does not end the editing;
   the composed text goes in on commit. The textarea has **no accessible name**. The field is 32 px (the line plus 10: padding `4px 11px`, border 1 px, radius 6 px)
   and **overhangs** the line: 5 px above and below (a relative offset), 12 px at the inline start; the block's own bottom margin shrinks by the same 10 px, so
   **the next element does not move** (measured: the next paragraph keeps its top). The enter icon is absolute, 10 px from the end and 8 px from the bottom, 14 px,
   `rgba(0,0,0,.45)`, no pointer events.
7. **Ellipsis (the DOM).** Single line, text only: the root has `ant-typography-ellipsis-single-line` and the text stays whole in the
   DOM (CSS). When the text is cut by script (rows, expand, suffix, with actions), the root gets an **`aria-label` with the full text**
   (also when nothing is cut: with `rows=10` and a text that fits, the label was still there), the visible parts are
   `<span aria-hidden="true">` (the cut text and `...`), and the rest (suffix) is plain. The label sits on a `div` with **no role**,
   where most assistive technology ignores it. The expand control is a real
   `<button aria-label="Expand">` whose **visible text is the `symbol`** (`more` in one demo, `Expand` in others): the name `Expand`
   does not contain the visible `more` (WCAG 2.5.3, label in name), and there is **no `aria-expanded`**. The button sits at the end of the
   last row, after the `...`, inside the actions. After expanding, the root has no `-single-line` and no cut. A `Text` with
   `ellipsis` and a width (inline style) cuts with CSS and shows a tooltip text from `ellipsis.tooltip` (`I am ellipsis now!`).
8. **Suffix.** The `suffix` text is shown **always**, also when the text fits: at 10 rows the text ended with `...life--William Shakespeare`
   and had no button; at 1 and 3 rows `...--William ShakespeareExpand`.
9. **Semantic parts** (the React page, 6.4.0): `root`, `actions`, `action` (each of copy, edit, expand and collapse), `textarea`.
10. **Shimmer** (6.7.0): the root gets `aria-busy="true"` and a class; the text is painted with `background-clip: text` and a transparent
    text fill, over a 40%-wide white gradient that moves, `animation: 2s linear infinite` (1 s motion plus 1 s wait in the demo; the
    duration is two custom properties). Under `forced-colors` a transparent text fill would hide the text: **our version must handle
    that** (the same class of defect as the Spin dots, 2026-11-17). Not tested on their side.
11. **Public record: accessibility.** Nothing about Typography accessibility is documented by any of the three libraries. The
    changelog has two traces: "duplicate button semantics for the default edit icon" (React 59112) and "ellipsis `aria-label` not
    updating when `rows` or the text changes" (58650). The defects in findings 5 to 7 are ours to avoid, not to copy (A11y).

**What the trackers say (public traces, 2026).** (a) The script cut is a **binary search that reads the layout on every step**, so a table
of thousands of cells drops frames; React moved the tooltip's overflow check to the first hover (58806) and is moving single-row text with
buttons to CSS (59913, open); the cut had an infinite-loop case (54317) and a false "overflow" with a small line height (58211, open).
(b) **Copy**: HTTP pages needed a fallback (55073), a failed copy must not show "Copied" or call `onCopy` (59717, open), the text to copy
went stale (48075, 48332), a disabled Link must keep working copy and edit buttons (57762, 54277), an old timer ran after unmount (59560).
(c) **Clicks**: a click on Expand started editing when the text was a trigger (59640, open); an icon click fired `onStart` twice when both
triggers were on (59629, open); `onClick` on the root once blocked editing (59325); `stopPropagation` on the buttons hid clicks from
ancestors (the discussion of 59640). (d) **Edit**: Enter must end the editing, and **blur must call `onEnd` too** (42346; Vue 4227 asked
for the same); the textarea must take the font size of the text (58551, 34169). (e) **Ellipsis tooltip**: hovering the copy button
must not open it (56855); the tip must stay open while the pointer moves into it (58661, 57556); `onEllipsis` is reported as always true
for some titles (49973, open). (f) Vue: a flicker of cut text on tab switching (7145), a warning with `copyable` and `ellipsis` together
(7552). (g) Angular: "more edit triggers" is an open request (8420).

## Differences between the three libraries

| Level | React 6.7 | Vue (docs markdown) | Angular 22.2 | Difference | Decision |
|---|---|---|---|---|---|
| **Presence** | `Typography`, `.Title`, `.Paragraph`, `.Text`, `.Link` | `a-typography`, `-title`, `-paragraph`, `-text` (no Link, no root styles beyond the wrapper) | one directive `nz-typography` on native tags | parts | the five React parts as components (P1); the directive form is not taken |
| **Text source** | children (a string; `editable.text`, `copyable.text` for the rest) | `content` (v-model) when ellipsis or editable is used | `[nzContent]` (+ `[nzCopyText]`) | where the text comes from | Q1 |
| **Styles** | `code`, `delete`, `disabled`, `italic` (4.16), `keyboard` (4.3), `mark`, `strong`, `type`, `underline` | the same minus `italic` | `nzType`, `nzDisabled` only | `italic` is React-only | core: the common set; `italic` cheap addition (P3) |
| **`type`** | `secondary`, `success` (4.6), `warning`, `danger` | `secondary`, `success`, `warning`, `danger` | the same four | same | core |
| **Title** | `level` 1 to 5 (5 since 4.6) | `level` 1 to 5 | native `h1`..`h5` | same | core: `level` |
| **Copyable** | `copyable` bool or `{ text, onCopy, icon, tooltips, format, tabIndex }` | `{ text, onCopy, tooltip: boolean }` + slots `copyableIcon`, `copyableTooltip` | `nzCopyable`, `nzCopyText`, `nzCopyIcons`, `nzCopyTooltips` | `tooltips` pair vs `tooltip` boolean; `format`, `tabIndex` React-only | core: `text`, `onCopy`, `tooltips`, `icon`; cheap: `tabIndex`, function `text`; `format` reserved (P6) |
| **Editable** | `{ editing, text, maxLength, autoSize, icon, tooltip, enterIcon, triggerType, tabIndex, onStart, onChange(string), onCancel, onEnd }` | `{ editing, maxlength, autoSize, tooltip, triggerType, onStart, onChange(event), onCancel, onEnd }` | `nzEditable`, `nzEditIcon`, `nzEditTooltip`, `(nzContentChange)` | **`onChange` differs**: React fires **when editing completes** with the text (docs fixed in 59021), Vue "when input at textarea" with the event; `maxLength` vs `maxlength` | React semantics (5a): `onchange(text)` on completion; `maxLength` (P7) |
| **Ellipsis** | `ellipsis` bool or `{ rows, expandable: bool \| 'collapsible', suffix, symbol, tooltip, defaultExpanded, expanded, onExpand(event, info), onEllipsis }`; Text takes no `rows`, `expandable`, `onExpand` | the same without `collapsible`, `expanded`, `defaultExpanded`; `tooltip` bool or string | `nzEllipsis`, `nzEllipsisRows` (default 1), `nzExpandable`, `nzSuffix`, `(nzExpandChange)`, `(nzOnEllipsis)` | `collapsible`, controlled `expanded` React-only | core: `rows`, `expandable`, `suffix`, `symbol`, `tooltip`, `onellipsis`, `onexpand`; React additions `collapsible`, `expanded` (Q3) |
| **Actions bar** | `actions: { placement: 'start' \| 'end' }` (6.4.0) | no | no | React-only | cheap (P13) |
| **Semantic styling** | `classNames` / `styles`, objects or functions; parts `root`, `actions`, `action`, `textarea` (6.4.0) | no | no | React-only | cheap: objects only (P15) |
| **Shimmer** | `shimmer: bool \| { duration: number \| [motion, wait] }` (6.7.0) | no | no | React-only | cheap if CSS only (P14) |
| **Root styles** | `Typography` styles plain tags; table styles added in 6.4 (57633) | the wrapper only | none | | Q5 |
| **Global config** | `classNames` / `styles` from ConfigProvider (6.4.0) | no | `nzEllipsisRows`, copy and edit icons and tooltips | needs a provider | reserved for v1.1 |
| **a11y** | not documented; `aria-label` on the cut root, `aria-busy` on shimmer, real buttons | not documented | not documented | none documents any | our own contract (A11y) |
| **Methods** | none | none | none | | none |

### Values per prop (rule 5, item 4)

| Prop | React | Vue | Angular | Our type | Narrowing? |
|---|---|---|---|---|---|
| `type` | string enum | string enum | string enum | `'secondary' \| 'success' \| 'warning' \| 'danger'` | no |
| `level` | number 1 to 5 | number 1 to 5 | tag | `1 \| 2 \| 3 \| 4 \| 5` | no |
| `copyable` | `boolean \| object` | `boolean \| object` | `boolean` | `boolean \| TypographyCopyable` | no |
| `copyable.text` | `string \| () => string \| Promise<string>` | string | string | the same as React | no |
| `copyable.icon` | `[ReactNode, ReactNode]` (copy, copied) | slot with `{ copied }` | `[string \| TemplateRef, ...]` | `Snippet<[copied: boolean]>` | **shape differs, capability equal** (Svelte snippets take arguments, as the Vue slot); a text icon is `{#snippet}text{/snippet}` (P6) |
| `copyable.tooltips` | `false \| [ReactNode, ReactNode]` | boolean + slot | `null \| [string \| TemplateRef, ...]` | `false \| [string \| Snippet, string \| Snippet]` | no. The accessible name uses the string form, else the default (P6) |
| `editable` | `boolean \| object` | `boolean \| object` | `boolean` | `boolean \| TypographyEditable` | no |
| `editable.text` | string | `content` | `nzContent` | `string` | no |
| `editable.autoSize` | `boolean \| { minRows, maxRows }` | the same | | the same as `InputTextArea` | no |
| `editable.maxLength` | number | `maxlength` | | `number` | no (`maxLength`) |
| `editable.icon`, `.tooltip`, `.enterIcon` | ReactNode (`false` hides the tooltip, `null` the enter icon) | slots | `string \| TemplateRef`, `null` | `Snippet`, `string \| Snippet \| false`, `Snippet \| null` | no |
| `editable.triggerType` | `('icon' \| 'text')[]` | the same | | the same | no |
| `ellipsis` | `boolean \| object` | `boolean \| object` | `boolean` | `boolean \| TypographyEllipsis` | no |
| `ellipsis.rows` | number | number | number | `number` (integer, at least 1) | no |
| `ellipsis.expandable` | `boolean \| 'collapsible'` | boolean | boolean | `boolean \| 'collapsible'` | no |
| `ellipsis.suffix` | string | string | string | `string` | no |
| `ellipsis.symbol` | `ReactNode \| (expanded) => ReactNode` | string | none | `string \| Snippet<[expanded: boolean]>` | no |
| `ellipsis.tooltip` | `ReactNode \| TooltipProps` | `boolean \| string` | none | `boolean \| string \| Snippet \| TooltipProps` (props of our Tooltip, rule 6b) | no |
| `shimmer` | `boolean \| { duration }` | none | none | `boolean \| { duration?: number \| [number, number] }` | no |
| `actions` | `{ placement }` | none | none | `{ placement?: 'start' \| 'end' }` | no |
| `classNames`, `styles` | object or function | none | none | object | **yes**: the function form is not taken (P15) |
| `children` | ReactNode | slot | projection | `Snippet`, plus `content: string` (Q1) | no (wider than React) |

### Deprecated and renamed (4a)

No struck-through row on the React page (checked 2026-11-20). Renames between libraries, settled by taking the React name: Vue
`maxlength` to `maxLength`; Vue `content` to our `content` (Q1); Vue `copyable.tooltip: boolean` to React `tooltips: false`; Vue slots
`copyableIcon`, `editableIcon`, `ellipsisSymbol`, ... to the `icon`, `symbol` fields of the config objects (as snippets); Angular
`nzEllipsisRows` to `ellipsis.rows`. The old React `ellipsis.expandable: true` stays (expand only); `'collapsible'` (5.16) adds collapse.

## Scope v1.0

- **Ядро (React ∩ Vue ∩ Angular, same meaning):** the parts Title (`level`), Paragraph, Text; `type`, `disabled`, `code`, `mark`, `underline`,
  `delete` (and `strong`, `keyboard` where React and Vue have them, P2); `copyable` (`text`, `onCopy`, `tooltips`, `icon`);
  `editable` (`editing`, `maxLength`, `autoSize`, `triggerType`, `onStart`, `onChange`, `onCancel`, `onEnd`, `tooltip`, `icon`);
  `ellipsis` (`rows`, `expandable`, `suffix`, `symbol`, `tooltip`, `onEllipsis`, `onExpand`).
- **Дешёвые React-дополнения (≤ 1 дня каждое):**
  - `TypographyLink` and the `Typography` root: half a day with the styles of Q5.
  - `italic`: minutes. `actions.placement`: an hour. `copyable.tabIndex` and `editable.tabIndex`: minutes.
  - `ellipsis.expandable: 'collapsible'`, `expanded` and `symbol` as a function: inside the expand button, about half a day.
  - `copyable.text` as a function or a promise: an hour. `editable.text`, `enterIcon`, custom `icon`: an hour.
  - `classNames` / `styles` for four parts: about half a day (the helper of Switch exists). Objects only.
  - `shimmer`: about a day with forced colors and reduced motion handled (P14); one gradient and one keyframe.
- **Зарезервировано на v1.1:** ConfigProvider (`classNames`, `styles`, `direction`, and the default expand and collapse labels from a
  locale; the names are the same as here); `copyable.format: 'text/html'` (writing rich text needs `ClipboardItem`, absent in
  Firefox before 127, below the browser floor); the `table` styles of the `Typography` root if Q5 is A or B (the contract: the
  same selector family, additive CSS).
- **Не берём (Vue/Angular-only):** Angular's attribute directive on native tags (our parts are components); Vue's slots (`copyableIcon`,
  `ellipsisSymbol`, ...): the same capability as snippets inside the config objects; Angular's `nzEllipsisRows` global default (v1.1).
- **Не берём (React-only, не подходит для Svelte):** the function form of `classNames` / `styles` (a Svelte consumer computes the
  object in `$derived`); `ellipsis.defaultExpanded` (a plain `expanded` value is the initial value in Svelte, Q3); the pair form of
  `copyable.icon` (replaced by one snippet that takes `copied`, P6).
- **Не берём (нет ни в одной версии):** line breaks inside the edit field (none of the three allows them either); a minimum number of
  characters or a validator for the edit; an `onChange` while typing (Vue's `onChange(event)` per input: `InputTextArea` has `onchange`
  for it; the editing here ends on completion, as React).

## API

Four text parts share one base (`TypographyBaseProps`); Title adds `level`, Link adds the anchor attributes. Callbacks are lowercase,
like the rest of the library (`onclick`, `onchange`, `onclear`); inside the config objects they keep the React field names in
lowercase (`oncopy`, `onstart`, `onchange`, `onend`, `oncancel`, `onexpand`, `onellipsis`).

**Base props** (Text, Title, Paragraph, Link; which part has which is in P2)

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `type` | `'secondary' \| 'success' \| 'warning' \| 'danger'` | none | Text color. An unknown value: `RangeError` in development and tests, ignored in a production build (the Button rule). |
| `disabled` | `boolean` | `false` | Disabled text color and `cursor: not-allowed`. The actions (copy, edit, expand) stay usable (finding of 57762). For a Link it also removes the link (TYP-9). |
| `code`, `mark`, `underline`, `delete`, `strong`, `italic`, `keyboard` | `boolean` | `false` | Each wraps the content in its own tag (`code`, `mark`, `u`, `del`, `strong`, `i`, `kbd`), nested in a fixed order, so the styles combine. |
| `content` | `string` (`$bindable`) | none | The text as a value (Q1). Used by edit, copy and the cut; if both `content` and `children` are given, `content` is shown and `children` ignored (a development warning). |
| `copyable` | `boolean \| TypographyCopyable` | `false` | A copy button in the actions. |
| `editable` | `boolean \| TypographyEditable` | `false` | An edit button in the actions (and the text as a trigger with `triggerType`). |
| `editing` | `boolean` (`$bindable`) | `false` | Whether the edit field is open (Q3). A plain value is the initial state. Changes made by the consumer do not call `onstart`, `onend`, `oncancel`; changes caused by the user do (the Tooltip rule). |
| `ellipsis` | `boolean \| TypographyEllipsis` | `false` | Cuts the text. Text takes `Omit<TypographyEllipsis, 'rows' \| 'expandable' \| 'onexpand'>` (as React). |
| `expanded` | `boolean` (`$bindable`) | `false` | Whether the cut text is expanded (Q3). A plain value is the initial state (React's `defaultExpanded`). |
| `actions` | `{ placement?: 'start' \| 'end' }` | `{ placement: 'end' }` | Where the bar of buttons stands relative to the text. |
| `shimmer` | `boolean \| { duration?: number \| [number, number] }` | `false` | Animated text; `duration` in seconds, a number is the motion time with a 1 s wait, a pair is `[motion, wait]`. Default 1 s. |
| `children` | `Snippet` | none | The text and the inline content. |
| `onclick` | `(event: MouseEvent) => void` | none | Click on the part (also on its action buttons; the component does not stop the propagation, TYP-36). |
| `classNames` | `Partial<Record<'root' \| 'actions' \| 'action' \| 'textarea', string>>` | none | Classes appended to the part (Semantic DOM below). |
| `styles` | `Partial<Record<'root' \| 'actions' \| 'action' \| 'textarea', Record<string, string \| number>>>` | none | Inline styles of the part, kebab-case keys and custom properties, numbers as they are, written after the token-based values (the Switch contract). |
| `class`, `style` | `string` | none | Appended to the root, with `classNames.root` / `styles.root` after them. |
| Native attributes | `HTMLAttributes` of the element | none | Forwarded to the root element (`id`, `title`, `data-*`, `aria-*`, handlers). |

**`TypographyTitle`** adds `level: 1 | 2 | 3 | 4 | 5` (default `1`; anything else is a `RangeError` in development and tests, `1` in a
production build). **`TypographyLink`** adds the anchor attributes (`href`, `target`, `rel`, `download`, ...). **`Typography`** takes
`children`, `class`, `style`, `classNames.root`, `styles.root` and the native attributes of `<article>`.

**`TypographyCopyable`**

| Field | Type | Contract |
|---|---|---|
| `text` | `string \| (() => string \| Promise<string>)` | The text to copy. Default: `content`, else the rendered text of the part without its actions. A function is called at each click; a promise is awaited. |
| `oncopy` | `(event: MouseEvent \| KeyboardEvent) => void` | Called **once per successful copy**, never after a failed one (TYP-14). |
| `icon` | `Snippet<[copied: boolean]>` | Replaces the copy and the check icons. |
| `tooltips` | `false \| [string \| Snippet, string \| Snippet]` | The tip before and after the copy (default `Copy`, `Copied`); `false` hides the tip. The accessible name takes the string form, else the default. |
| `tabIndex` | `number` | `tabindex` of the button (default none; `-1` leaves the Tab order). |
| `format` | reserved | `'text/plain' \| 'text/html'`, v1.1. Not accepted in v1.0 (the name is held). |

**`TypographyEditable`**

| Field | Type | Contract |
|---|---|---|
| `text` | `string` | The starting text of the field, instead of `content` or the rendered text. |
| `maxLength` | `number` | `maxlength` of the field (the cut of a composition follows `InputTextArea`). |
| `autoSize` | `boolean \| { minRows?: number; maxRows?: number }` | Default `true`. The field grows with the text (`InputTextArea`). |
| `icon` | `Snippet` | Replaces the pencil. |
| `tooltip` | `string \| Snippet \| false` | Default `Edit`; `false` hides the tip (the name stays `Edit`). |
| `enterIcon` | `Snippet \| null` | Default the enter icon in the field; `null` removes it. Decorative. |
| `triggerType` | `Array<'icon' \| 'text'>` | Default `['icon']`. Without `'icon'` the pencil is not rendered; with `'text'` a click on the text starts the editing. |
| `tabIndex` | `number` | `tabindex` of the edit button. |
| `onstart` | `() => void` | The editing opened by the user. |
| `onchange` | `(text: string) => void` | The editing **completed** (Enter, blur or Tab) with a text that **differs** from the start (P7). |
| `onend` | `() => void` | The editing completed by Enter or by blur (React 42346). |
| `oncancel` | `() => void` | The editing cancelled by Esc. |

**`TypographyEllipsis`**

| Field | Type | Contract |
|---|---|---|
| `rows` | `number` | Rows to show, an integer from 1 (default 1). Not an integer or below 1: `RangeError` in development, `1` in production. |
| `expandable` | `boolean \| 'collapsible'` | An expand button at the end of the last row; `'collapsible'` also shows a collapse button after the text is expanded. |
| `suffix` | `string` | Text after the cut text, **always shown**, also when the text fits (finding 8). |
| `symbol` | `string \| Snippet<[expanded: boolean]>` | The button's content; default `Expand` / `Collapse` (the labels are English in v1.0; ConfigProvider localizes them in v1.1). |
| `tooltip` | `boolean \| string \| Snippet \| TooltipProps` | The tip with the full text while the text is cut: `true` the text itself, a string or snippet its own content, an object the props of `Tooltip` (without `children`). |
| `onexpand` | `(event: MouseEvent, info: { expanded: boolean }) => void` | The user pressed expand or collapse. |
| `onellipsis` | `(ellipsis: boolean) => void` | The cut state: after the first measurement and at every later change (P10). |

No methods (no `focus()` on a text), so the page has no method table and no "Focus and blur" block (rule of 2026-11-16).

**The four parts.** `root` (the outer element; it is also the element the decorations live in), `actions` (the span that holds the
buttons), `action` (**each** button: copy, edit, expand, collapse), `textarea` (the edit field's `<textarea>`, the class and style go to
the field element of `InputTextArea`). The `Typography` article has only `root`.

## Behavior

**Elements and styles**
- `TYP-1` `Typography` is an `<article class="ads-typography">`; the text parts are `div` (Paragraph), `span` (Text), `a` (Link), `h1` to
  `h5` (Title). Native attributes, `class` and `style` go to the root.
- `TYP-2` Each decoration flag adds its tag around the content, in a fixed order (outer to inner: `strong`, `i`, `u`, `del`, `mark`,
  `code`, `kbd`); two flags combine, none removes another. The actions are outside the decorations.
- `TYP-3` Type and disabled colors are classes on the root. `disabled` also sets `cursor: not-allowed`; the text stays selectable.
- `TYP-4` Title margins (top 1.2em and bottom 0.5em, `0` top on a first child) and sizes (finding 2) are tokens; a Paragraph has a bottom
  margin of 1em; Text has none.
- `TYP-5` The `Typography` root styles the plain tags inside it (finding 1) through descendant selectors under `.ads-typography` (Q5);
  a `p` has 1em under it and, as a first child, nothing above (above other paragraphs the space stays the browser's or the
  application's); `pre` has 1em under it and nothing above; its links are `TYP-5a`;
  nothing outside the root is affected. Only **plain** tags: an element with a class of the library (`ads-...`: a Title or a Paragraph,
  a list of `Menu`) keeps its own look, its type and disabled colors too; the condition is in `:where()` and adds no weight to a selector.
  The look of `code`, `kbd`, `mark` and `strong` reaches an application that uses only `Typography` (they live in `Decorations.svelte`,
  which the article and the parts both render).
- `TYP-5a` A plain `a` **with `href`**, inside the article or inside any text part standing alone (colored and disabled parts too), looks
  like a `TypographyLink` (colors, hover, pressed, focus ring, underline in the dark theme, no transition with reduced motion, `LinkText`
  in forced colors); an anchor without `href` stays text; a link with a class of the library keeps its own look; a link outside is the
  browser's. The rules live in `Decorations.svelte`, so an application with the article only, or with one part only, gets them.
- `TYP-6` `TypographyTitle`: `level` outside 1 to 5 is a `RangeError` in development and tests and `1` in a production build.
- `TYP-7` `type` outside the list is a `RangeError` in development and tests and ignored in a production build.

**Link**
- `TYP-8` A Link is an `<a>`. `target="_blank"` with no `rel` adds `rel="noopener noreferrer"` (finding 1); a given `rel` is kept as it is.
- `TYP-9` A disabled Link renders `<a aria-disabled="true">` **without `href`** (so it is not a link and not in the Tab order), and its
  `onclick` is not called. Its copy and edit buttons keep working.

**Copy**
- `TYP-10` `copyable` adds a `<button type="button">` with the copy icon to the actions. Its accessible name is the tip text (`Copy`).
- `TYP-11` A click copies `copyable.text` (a function is called, a promise is awaited), else `content`, else the rendered text of the part
  without the actions (so a snippet child is copied as text). The text read at the click, never a stale one (48075).
- `TYP-11a` While a promise from `copyable.text` is awaited, the button shows a turning `LoadingOutlined` icon (instead of the copy icon, the
  check or a custom `icon`), has `aria-busy="true"` and `aria-disabled="true"` and stays focusable (the loading contract of `Button`); its name
  and tip do not change and further clicks do nothing: one request at a time (the demo calls the text again, finding 5; ours is deliberate).
  A string, and a function that returns a string, show no spinner. It ends with the check, or with the copy icon after a rejected promise or
  a failed write (`TYP-14`). The box stays 14 x 22 px (`TYP-16`).
- `TYP-12` The clipboard: `navigator.clipboard.writeText` when it exists and the context is secure; otherwise, or when it rejects, a
  temporary off-screen `<textarea>` with `document.execCommand('copy')`, removed after use, which also works on HTTP (55073).
- `TYP-12a` A browser accepts a write only for a few seconds after the click (measured on 2026-11-25: after 6 s both ways of `TYP-12` fail in
  Chromium, Firefox and WebKit). So a **promised** text goes to `navigator.clipboard.write` **at once, inside the click**, as a
  `ClipboardItem` that takes the promise (a `text/plain` blob), and it may then take longer. The copy counts only when the write resolved and
  the text came. Where this is not possible (no `ClipboardItem` or no `write`: Firefox before 127; an engine whose `ClipboardItem` refuses a
  promise: Chromium 90; a page that is not a secure context; a rejected write) the text is awaited and written as in `TYP-12`, where a slow
  promise can still fail (`TYP-14`). A rejected promise writes nothing and raises no unhandled rejection. Chosen by the maintainer on
  2026-11-25.
- `TYP-13` Success: the icon becomes the check, the name and the tip `Copied`, `oncopy(event)` is called once, and **3 s later** it
  returns to the copy state. A click while it shows `Copied` copies again and restarts the 3 s. The timer is cleared on destroy (59560).
- `TYP-14` Failure (both ways fail): nothing changes: no check, no `Copied`, no `oncopy`; a previous success state is cleared, and the
  button stays ready for a retry (59717).
- `TYP-15` A polite status message `Copied` (a visually hidden `role="status"` in the actions) is added for 3 s on success, because the change of a
  button's name is not announced (finding 5).
- `TYP-16` The swap of the copy and the check icon, and of the tip, does not change the size of the button or the position of the text
  (the same box of 14 x 22 px; checked in the browser).

**Edit**
- `TYP-17` `editable` adds a `<button type="button">` with the pencil; its name and tip are `Edit`. `triggerType` without `'icon'`
  removes it; with `'text'` a click on the text (not on a link, a button or a selection) starts the editing.
- `TYP-18` Starting: the text is replaced **in place** by an `InputTextArea` (`autoSize` default `true`, `maxLength`, the value from
  `editable.text`, else `content`, else the rendered text) and the enter icon; the field takes the font and size of the text (58551);
  it is focused with the caret at the **end**; `editing` becomes `true` and `onstart` is called once, whether the start came from the pencil
  or from the text, and also when both are triggers (59629). A click on an action button (expand, copy) never starts the editing (59640).
- `TYP-19` **Enter** (no Shift, Ctrl, Alt or Meta, **not during an IME composition**) completes: the field closes and keeps the text,
  `onchange(text)` is called if the text differs from the start, then `onend`. Enter during a composition does nothing.
- `TYP-20` **Shift+Enter** and the other Enter variants insert nothing (a line break is not possible). A line break that reaches the field
  another way (pasted text, an Enter that a browser lets through during a composition) is dropped from the value.
- `TYP-21` **Esc** cancels: the field closes, the text is discarded, `oncancel` is called, `onchange` is not.
- `TYP-22` **Blur and Tab** complete like Enter (finding 6; 42346). After Enter, Esc and Tab-out, **focus returns to the edit button**
  (finding 6). After a blur caused by a click on another focusable element, focus **stays where the user put it** (we do not
  steal it back; Ant Design restores it to the edit button even then).
- `TYP-23` With `bind:content` the new text is written to `content` before `onchange` is called. Without it the consumer updates its
  own text in `onchange`, and the part shows the new `children` afterwards.
- `TYP-24` `editing` controlled by the consumer (`bind:editing`): `true` opens the field, `false` closes it keeping the text as the
  starting value; consumer changes call no callbacks, user changes do.
- `TYP-25` The field has an accessible name (P12). The enter icon is `aria-hidden`.
- `TYP-26` A part that is `ellipsis` and `editable` at once shows the full text in the field while editing and the cut text after.

**Ellipsis**
- `TYP-27` Modes (Q2, option A). **CSS only** (no script cut): one row with no suffix and no expand button, with or without actions (the
  text shrinks, the actions keep their size); `rows` of 2 or more with no suffix, no expand and no actions (`line-clamp`).
  **Script cut**: `suffix`, `expandable`, or `rows` of 2 or more with actions. The mode follows the props; the text and the width are the inputs.
- `TYP-28` CSS single row: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`. A Text is `display: inline-block; max-width: 100%;
  vertical-align: bottom` and **follows its container** (Ant Design fixes the width at the first cut and tells the user to set a width).
- `TYP-29` The state "cut" is read from the layout (`scrollWidth` and `scrollHeight` against the box) by a `ResizeObserver`, once per frame, not
  on mount for a part that needs no tip and no `onellipsis` (the cost seen in 58806). A text that is exactly as wide as the box is
  not "cut" (58211, 49973).
- `TYP-30` Script cut: the text is cut so that `cut text + "..." + suffix + the expand button` fills at most `rows` rows; the cut falls on a code
  point, never inside a surrogate pair; the text, the width, `rows`, `suffix`, `symbol` and a font load re-cut it. A text that fits is
  not cut. Before the first measurement the part shows the full text clamped by CSS (no flash of the whole text, no hydration
  mismatch: the server markup equals the first client paint).
- `TYP-31` Expand: the button sits at the end of the last row, in the actions, is a real `<button type="button">`, and its content is the
  `symbol` (default `Expand`). A click shows the whole text, calls `onexpand(event, { expanded: true })` and sets `expanded`. With
  `expandable: true` the button is gone after that; with `'collapsible'` a `Collapse` button follows and a click returns to the cut.
- `TYP-32` `expanded` controlled (`bind:expanded`): `true` shows the whole text, `false` the cut; a consumer change calls no callback;
  the initial value is the plain value (`defaultExpanded`).
- `TYP-33` `suffix` is placed after the (cut or whole) text, always (finding 8).
- `TYP-34` `tooltip`: shown on hover only while the text is cut, with the full text (or the given content); never when expanded; measured
  at the first hover; hovering an action button does not open it (56855); the pointer may move into the tip (58661). It is built on
  `Tooltip` with `anchor` set to the part. A text that is not focusable has no tip for keyboard users (A11y).
- `TYP-35` `onellipsis(true | false)`: after the first measurement and at every later change; not on re-render with the same state.
- `TYP-36` The clicks: action buttons call `onclick` of the root like any child, and **no `stopPropagation`** is used (an ancestor's
  handler still sees them); the component ignores clicks that come from the actions when it decides whether the text was clicked.

**Actions, shimmer, cross-cutting**
- `TYP-37` `actions.placement`: `end` (default) puts the bar after the text, `start` before it; the order inside the bar is expand, edit,
  copy (the order of the page's semantic demo). Margin between the text and the bar is 4 px, on the inline side (logical, RTL-safe).
- `TYP-38` `shimmer`: the text is painted by a gradient clipped to the text with a transparent fill and moves for `motion` seconds, then
  waits `wait` seconds; `aria-busy="true"` while on. Under `prefers-reduced-motion: reduce` the movement stops and the text stays
  visible; under `forced-colors: active` the gradient and the transparent fill are dropped and the text keeps its system color.
- `TYP-39` Right-to-left: only logical properties, the cut falls on the end side; nothing mirrors wrongly at `dir="rtl"`.
- `TYP-40` `classNames` and `styles` for each of the four parts; `styles` are written after the component's own.
- `TYP-41` Server rendering: the markup is the first client paint (no script cut, no copy state), no `navigator` access before `onMount`.
- `TYP-42` Reactive: `content`, `children`, `rows`, `suffix`, `symbol`, `type`, the flags, `copyable`, `editable`, `ellipsis`, `actions`,
  `shimmer` and the semantic props re-render correctly, including turning `ellipsis`, `editable`, `copyable` on and off.

## A11y

There is no ARIA pattern named "typography"; the buttons follow the WAI-ARIA Authoring Practices button pattern and the field is a
plain text box. The contract below is ours and fixes the defects of findings 5 to 7.

- **The text is always readable in full.** A part that is cut by script keeps the full text in the DOM: the visible cut text and the `...`
  are `aria-hidden="true"`, and a visually hidden element holds the whole text (and the suffix is not duplicated). No `aria-label` is put on a
  role-less element (finding 7). A CSS cut keeps the text whole in the DOM already.
- **Real buttons.** Copy, edit, expand and collapse are `<button type="button">`, in the Tab order (`tabIndex` configurable), Enter and
  Space press them, Esc and Tab have no special meaning on a button. The icons are `aria-hidden`.
- **Names.** Copy: `Copy` / `Copied`. Edit: `Edit`. Expand and collapse: **their visible content is the name**, so a custom
  `symbol` such as `more` is also the name (WCAG 2.5.3); `aria-expanded` says whether the text is expanded on the expand button
  (`false`) and on the collapse button (`true`). A custom icon, tip or snippet does not change the name unless it is a string.
- **Announcements.** Copy success: the visually hidden status (TYP-15). Waiting for a promised text is not announced (`aria-busy` on the button, TYP-11a). Expanding and collapsing change the content in place
  and are not announced by a live region: the button's `aria-expanded` and focus are the signal. A failed copy is silent, as the three
  libraries are; it is documented.
- **The edit field.** It has an accessible name (the `Edit` label, `aria-label` of the `<textarea>`); Enter, Esc, blur and the IME rule are
  in `TYP-19` to `TYP-22`; the focus goes into the field on start and back to the edit button after Enter, Esc and Tab-out.
- **Keyboard limits (documented).** A text that is the trigger (`triggerType: ['text']` without `'icon'`) is not focusable: a keyboard
  user needs the pencil, so the page says to keep `'icon'`. A text with a tooltip is not focusable either: its full text is in the DOM for
  assistive technology, and `expandable` gives a keyboard way to the full text. The page lists both.
- **Disabled.** A disabled Link has no `href` and `aria-disabled="true"`. Disabled text stays in the reading order; the actions work (finding 4).
- **Color is not the only signal.** `type` changes only the color; the page says to add a word or an icon where the type carries meaning
  (WCAG 1.4.1). A link inside running text is 4.03:1 from the text in the light theme and 3.19:1 with the accessible colors, above the 3:1
  that lets color alone mark it, but 1.75:1 in the dark theme: there links (the `TypographyLink` and the plain ones of the article) are
  underlined; a disabled one is not.
- **Contrast.** The type colors reach 4.5:1 in `tokens-accessible.css` and in the dark theme; the default light set is Ant Design's own
  (finding 4) and does not (P17). `mark` is 16.9:1. The link is 4.1:1 by default, 4.5:1 or more with the accessible set (the Spin rule).
- **Forced colors** (`forced-colors: active`): `mark` uses the `Highlight` and `HighlightText` system colors (a fill alone is dropped; the newer `Mark` is unknown to the browser floor), `code` and `kbd`
  keep their border, `disabled` uses `GrayText`, the shimmer is plain text (TYP-38). Decided here, tested in the three engines.
- **Reduced motion:** TYP-38; the copy icon swap has no transition.
- Axe checks cover every state (plain, each type, a link, disabled, copyable before and after, editable closed and open, an ellipsis
  cut by CSS and by script, expanded, shimmer).

## Colors and tokens

`--ads-typography-*` tokens in `tokens.css`, each consumed by the component, with the dark theme in the existing dark block and the
accessible values in `tokens-accessible.css`:

| Group | Tokens (values measured 2026-11-20) |
|---|---|
| Headings | font sizes 38 / 30 / 24 / 20 / 16, line heights 46 / 38 / 32 / 28 / 24, weight 600, margin top 1.2em, margin bottom 0.5em |
| Body | font size 14 (`--ads-font-size`), line height 22, paragraph margin 1em, `strong` weight 600 |
| Types | `secondary` `rgba(0,0,0,.45)`, `success` `#52c41a`, `warning` `#faad14`, `danger` `#ff4d4f`, disabled `rgba(0,0,0,.25)` |
| Link and actions | link `#1677ff`, hover `#69b1ff`, active `#0958d9`, no underline (underlined in the dark theme, `--ads-typography-link-decoration`); the actions margin 4 px; the focus ring of the library |
| Decorations | mark fill `#ffe58f` and text `#000`; `code` and `kbd` fill, border, radius 3 px, padding, size 85% / 90%, monospace stack |
| Blocks | `blockquote` border 4 px `rgba(100,100,100,.2)` and padding 0.6em; `pre` padding `0.4em 0.6em`; `ul` item margin 20 px and padding 4 px |
| Motion | shimmer motion and wait (defaults 1 s and 1 s); the transitions of the link color 0.3 s (the 3 s of the copy state is a constant of the component, not a token) |

The accessible set darkens `success`, `warning`, `danger`, `secondary`, the link and the action color to 4.5:1 or more on the page
background; the dark theme keeps the ratios. Not taken: the React component tokens for the editable field and the semantic demos' sizes;
if a black-box check later finds one, it is additive.

## Agreed decisions (2026-11-24)

1. **Q1 A**: `children` shows the content as it is; `content: string` (`$bindable`) is the text as a value for edit, copy and the cut, and wins if both are given.
2. **Q2 A**: CSS first (`text-overflow`, `line-clamp`, the "cut" state read by a `ResizeObserver`); the script cut only for `suffix`, `expandable`, and several rows with
   buttons. The source of Ant Design is **not** read (no reader subagent).
3. **Q3 A**: `bind:editing` and `bind:expanded` on the top level; a plain value is the initial state; no `defaultExpanded`.
4. **Q4**: settled by the Icon release (0.15.0, 0.15.1).
5. **Q5 A**: the `Typography` root styles the plain tags (`h1` to `h5`, `ul`, `ol`, `li`, `blockquote`, `pre`, `code`, `kbd`, `mark`; `p` and `a` added by the
   maintainer on 2026-11-25) with descendant selectors under `.ads-typography`; the `table` styles are reserved for v1.1.
6. **Q6 A**: Typography imports `CopyOutlined`, `CheckOutlined`, `EditOutlined`, `EnterOutlined` each from its own file; `scripts/check-architecture.mjs` counts the files that
   the `exports` map of `package.json` exposes (`./icons/*`) as public surface (a case in `tests/architecture.test.ts`); `Typography -> Input`, `-> Tooltip`, `-> Icon` are
   added to `DEPENDENCIES` with their reasons.
7. **P23**: Orca is needed; `screen-reader/typography.spec.ts` is written with the other tests and run locally in Docker until green.
8. **P1 to P22** accepted as written.

## Questions for the maintainer (workflow stage 2, as they were put; all answered A on 2026-11-24)

**Q1. Where the text comes from.** React reads the text from `children` (a string) and tells you to pass `editable.text` and
`copyable.text` when the child is not a string. Vue and Angular use a `content` / `nzContent` string for anything that edits or cuts
the text. A Svelte `Snippet` cannot be read as a string.
- **A. Both (recommended):** `children` shows content as it is (rich, any markup); `content: string` (`$bindable`) is the text as a
  value for edit, copy and the cut, and wins if both are given. `<TypographyParagraph bind:content editable ellipsis>` is the whole
  usage, as in Vue; a snippet child still works, with the text read from the DOM for copy and cut (the cut then shows plain text).
- **B. Only `children`, as React:** the text is read from the rendered DOM for the cut, the field and the copy, and the consumer sets the new
  text itself in `onchange`. No new prop, but the cut and the edit of a snippet with markup are unreliable, and the usage is longer.

**Q2. How long text is cut** (the largest mechanism of this component). Ant Design cuts with script in most cases (a binary search that
reads the layout at every step), which public trackers show to be slow in long tables (finding trackers (a)).
- **A. CSS first, script only where CSS cannot (recommended):** one row (with or without buttons) and several rows without buttons are
  `text-overflow` and `line-clamp`, with the "cut" state read by a `ResizeObserver`; the script cut runs only for `suffix`, `expandable`, and several rows
  with buttons, one measurement per width change. The look matches Ant Design in every case; the cost is lower in the plain cases. More code
  (two paths, `TYP-27`).
- **B. Script always, as Ant Design:** one path, the same cut point everywhere, but the cost the trackers describe.
- **C. CSS only:** `suffix` is not supported and the expand button stands **under** the text, not at the end of the last row.
  Cheapest, but different from every Ant Design demo.
  *Source reading (rule 3a).* My hypothesis for the script cut is in `TYP-30` (a hidden ruler, a binary search with one layout read per
  step, cached by width and text). If you want it compared with theirs, I would offer a separate reader subagent that returns prose only;
  I recommend **not** reading it: the public traces already name the costs and the failure cases.

**Q3. The shape of the state.** React keeps `editing` and `expanded` **inside the config objects** (`editable.editing`,
`ellipsis.expanded` / `defaultExpanded`) and reports changes with callbacks.
- **A. Top-level `bind:editing` and `bind:expanded` (recommended):** the Svelte way (`bind:checked`, `bind:open`), one source of truth; the
  config objects keep only the rest. A plain value is the initial state, so `defaultExpanded` is not needed. A form difference from
  React; the same capability.
- **B. As React:** `editable.editing`, `ellipsis.expanded`, `ellipsis.defaultExpanded` plus callbacks; a binding inside an object cannot
  use `bind:`. Same shape as the docs and codemods from React, longer to use in Svelte.

**Q4. Three small icons: settled (2026-11-20 to 2026-11-24).** On 2026-11-20 the draft asked where `copy`, `edit` and `enter` should come from, because the
private set of `src/lib/internal/icons/` had only `check`. The maintainer chose to make the icons first, in his own chat (option B). He built the public
**Icon family** instead of three private drawings: released as 0.15.0 and 0.15.1 (`specs/icon.md`), with the Ant Design drawings from `@ant-design/icons-svg`.
`CopyOutlined`, `EditOutlined`, `EnterOutlined` and `CheckOutlined` exist now, each as `src/lib/Icon/icons/<Name>.svelte`, and `specs/icon.md` names Typography as
a consumer. So the draft's "three new names in the private `Icon.svelte`" no longer applies; how Typography imports them is **Q6**.

**Q5. What the `Typography` root styles.** Descendant selectors under `.ads-typography` for plain tags (`h1` to `h5`, `ul`, `ol`, `li`,
`blockquote`, `pre`, `code`, `kbd`, `mark`) are the only way to style a consumer's own markup in Svelte (scoped styles do not reach
slotted content). They affect only what is inside the root and nothing else on the page, but they are `:global` selectors, which the
project avoids elsewhere (rule 6).
- **A. Take them for the listed tags (recommended)**, leave `table` for v1.1 (React added it in 6.4; the name is reserved).
- **B. Take them and the `table` styles now.** Half a day more; the table look needs its own measurements.
- **C. Style nothing:** `Typography` is a plain `<article>` with the base font; users use the four text parts for everything. Smallest, but
  the "article" use of Ant Design's first demo does not work.

**Q6. How Typography imports the ready icons** (new, 2026-11-24, found by step 0). The icons are public components, but `npm run check:docs`
(`scripts/check-architecture.mjs`, rule 6b) calls a file public only when `src/lib/index.ts` exports it, and the icons are exposed through the `exports` map of
`package.json` (`./icons/*`), not through `index.ts`. So `import CopyOutlined from '../Icon/icons/CopyOutlined.svelte'` would fail the check as "a private
file of Icon", and `Typography -> Icon` also needs a line in its `DEPENDENCIES` list.
- **A. Import each icon from its own file and teach the check (recommended):** four imports (`CopyOutlined`, `CheckOutlined`, `EditOutlined`, `EnterOutlined`),
  each from its own file and never from the 848-line list (the Icon release found that a list floods the e2e dev server); `check-architecture.mjs` also counts the files
  that the `exports` map exposes as public surface (a few lines and one case in `tests/architecture.test.ts`); one `Typography -> Icon` line with the reason. Alert,
  Result, Pagination and Upload will need the same, so this is the place to fix it once. The drawings are exactly Ant Design's.
- **B. The generic `Icon` and the data package:** `Icon` is public through `index.ts`, so the check stays as it is, but Typography would import `@ant-design/icons-svg`
  itself (the Icon spec keeps that to one generator, and Node 22 needs the deep `es/asn/<Name>.js` form), once per consumer.
- **C. Draw the four icons privately in `internal/icons/`:** no new dependency, but a second set that differs from the Ant Design drawings and repeats what now exists.

In every option the icons inside the buttons are decorative: `label=""` hides them and the button carries the name (A11y).

### Proposals (accepted together unless the maintainer objects)

- **P1** Exports: `Typography`, `TypographyTitle`, `TypographyParagraph`, `TypographyText`, `TypographyLink` (the flat names of `RadioGroup`,
  `InputTextArea`); types `TypographyBaseProps`, `TypographyTitleProps`, `TypographyTextProps`, `TypographyParagraphProps`,
  `TypographyLinkProps`, `TypographyType`, `TypographyLevel`, `TypographyCopyable`, `TypographyEditable`, `TypographyEllipsis`,
  `TypographyActions`, `TypographyShimmer`, `TypographySemanticName`, `TypographyClassNames`, `TypographyStyles`.
- **P2** Which part has which flag (as React and Vue): Title has no `strong` and no `keyboard`; Paragraph has no `keyboard`; Text and Link have
  all; Text takes `ellipsis` without `rows`, `expandable` and `onexpand` (a Text is one inline row). Link takes the same flags as Text.
- **P3** `italic` (React 4.16, absent in Vue and Angular): cheap, taken.
- **P4** Callbacks are lowercase; the config objects keep React's field names in lowercase (`oncopy`, `onstart`, `onchange`, `onend`,
  `oncancel`, `onexpand`, `onellipsis`).
- **P5** Copy contract `TYP-10` to `TYP-16`: Clipboard API with an `execCommand` fallback, the failure rule, the 3 s state, a status message.
- **P6** `copyable.text` may be a function or a promise (React demo "Request copy text"); `tabIndex` taken; `icon` is one snippet that
  takes `copied` (not React's pair); `tooltips` keeps React's pair and `false`; `format` is reserved for v1.1.
- **P7** Edit contract `TYP-17` to `TYP-26`. `onchange` fires **only when the text changed** (React says "when editing is completed";
  whether it also fires for an unchanged text is not documented and was not measured, NG-ZORRO fixed the same question in 3664 as "no
  event without a change"); this can be widened later without a break. `onend` fires on Enter and on blur (42346).
- **P8** The text trigger without the icon is **not focusable** (as Ant Design); documented, with the advice to keep `'icon'`.
- **P9** `ellipsis.tooltip` forms: `true`, a string, a snippet, or `Tooltip` props; only when cut; never on a non-cut or expanded part.
- **P10** `onellipsis` is called after the first measurement and at each change (React's first call is not documented, 49973 shows
  disagreement about it).
- **P11** `suffix` is always shown after the text (finding 8).
- **P12** The a11y contract: full text for assistive technology without `aria-label` on a role-less element; the expand button's name is its
  visible content and carries `aria-expanded`; the edit field has a name; a status message for a successful copy.
- **P13** `actions.placement` taken; the order of the buttons: expand, edit, copy.
- **P14** `shimmer` taken (CSS only: a gradient clipped to the text, one keyframe, two custom properties for the times), with forced colors
  and reduced motion handled and `aria-busy="true"` while on. About a day; on the edge of "cheap", so say if you want it in v1.1.
- **P15** `classNames` and `styles` for four parts, objects only (the Switch contract). No function form.
- **P16** Link: `rel="noopener noreferrer"` with `target="_blank"`; the disabled form of `TYP-9`.
- **P17** Tokens `--ads-typography-*`; the type colors, the link and `secondary` are darkened in `tokens-accessible.css` to 4.5:1 and the
  dark theme keeps the ratios.
- **P18** Reduced motion: shimmer stops, the copy icon has no transition; forced colors as in "A11y".
- **P19** No methods, no "Focus and blur" block, no method table.
- **P20** No global default labels or icons; the English defaults `Copy`, `Copied`, `Edit`, `Expand`, `Collapse` move to ConfigProvider's
  locale in v1.1 (the names are fixed now, so the change is additive). Until then every label is overridable through the config objects.
- **P21** Layout when a state changes (rule 7): the copy to check swap keeps the box; the edit field overhangs the line (5 px above and
  below, 12 px at the start; the part keeps its size and its place, as Ant Design), the expand and collapse change the height by design; the test checks that
  **neighbors of the part** do not move on opening the field, nor on a copy, and move only by the height change on expand and collapse.
- **P22** The docs page follows the layout rules of 2026-11-16 (a stack of units, a caption above, the output below, a state of its own
  for every example, two-column grid); the examples are listed in "Docs page plan".
- **P23** **Orca: needed** (rules 7a and 4, 2026-11-20; the maintainer confirms at this stage). Typography has speech: the copy and edit buttons and their names, the
  `Copied` status, the expand button with `aria-expanded`, the full text of a cut part, the name of the edit field. `screen-reader/typography.spec.ts` is written
  with the other tests and **run locally in Docker until green** (its own file only) before "done", not left to a later release; the matrix row is `test`. NVDA, JAWS,
  VoiceOver and a phone stay manual, and the README and the page say what Orca does not check. The release does not change `exports` or the entry point, so
  `npm run check:consumer` (rule 7b) is **not needed**.

## Dependencies

Rule 6b of the rules for AI assistants: what this component uses besides its own files. Checked against `origin/main` (`4f2bf5b`,
0.14.1) on 2026-11-20 and again against `8a2b463` (0.15.1) on 2026-11-24, after the Icon family arrived, and against `ai/dependencies.md` (the Typography row: `Input (TextArea)`,
`Tooltip`, no primitive, no shared state; the Icon row is read with it, `specs/icon.md` names Typography as a consumer).

- **Whole (public components):**
  - **`InputTextArea`** (`../Input/InputTextArea.svelte`): the edit field. The user sees the same element as a separate
    `InputTextArea`, and sets it with the same props (`autoSize`, `maxLength`); it brings the IME rule for Enter, the auto-sizing and the
    focus ring. `classNames.textarea` goes to its `class`.
  - **`Tooltip`** (`../Tooltip/Tooltip.svelte`): the tips of the copy and edit buttons (wrapping the button) and the ellipsis tip
    (`anchor` on the part, controlled `open`, `trigger: []`). Its props object is `ComponentProps<typeof Tooltip>` (the type of
    `ellipsis.tooltip`).
  - **The ready icons of the Icon family** (Q4 settled, import form Q6): `CopyOutlined`, `CheckOutlined` and `LoadingOutlined` (the copy button, its success state and the wait for a promised text, TYP-11a), `EditOutlined` (the edit
    button), `EnterOutlined` (the enter mark in the edit field). The user sees the same Ant Design drawings as in a separate `Icon`; each is imported from its own file,
    never from the whole list, and drawn with `label=""` (decorative; the button is named). `Icon` is a family of components, so it stays in this list, not among the primitives.
- **Part or primitive (`internal/`):** none for icons any more (the private set of `internal/icons/` is not used: the two sets stay apart, `specs/icon.md`). Shared helpers
  `semantic` (`classList`, `styleText`), `options`, `env`: small functions with no stable API; not dependencies in the sense of rule 6b.
  No `popup`, `portal` or `anim`: the tips go through `Tooltip`.
- **Shared state:** none. (ConfigProvider's defaults come in v1.1.)
- **Deviations from `ai/dependencies.md`:** none in what is taken. Lines needed in the `DEPENDENCIES` list of `scripts/check-architecture.mjs`:
  `Typography -> Input`, `Typography -> Tooltip` (with the reasons above) and `Typography -> Icon`; the last one needs the check to accept the files of
  `src/lib/Icon/icons/` as public surface, which is the maintainer's decision (Q6). Other components take Typography whole later
  (Card, Descriptions, Table cells, Result, Statistic if the plan says so).
- **Not copied:** the ruler for the cut is written here (`TextBase.svelte` with `ellipsis.ts`); no other component has a second user of it today. If
  Table or List later need the same measuring, it moves to `internal/` **before** the second user, not copied (rule 6b).

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Typography.test.ts`, `tests/TypographyEdit.test.ts`, `tests/TypographyEllipsis.test.ts` (the buttons against the APG button pattern, the names, `aria-expanded`, the status message, the hidden-full-text structure of a cut part, the edit field's name; axe in every state) |
| Forced colors | test | `e2e/forced-colors.spec.ts` (Typography block: `mark`, `code`, `kbd`, disabled, link, button and the shimmer differ from `Canvas`, a plain link of the article has the color of a `TypographyLink`; Chromium, Firefox and WebKit) |
| IME | test | `e2e/typography-ime.chromium.spec.ts` (Enter during a composition does not complete the edit, a composition is not cut by `maxLength`; Chromium DevTools protocol). A real keyboard was not tried |
| Touch | manual pending | a real phone was not tried. The buttons keep the Ant Design size, 14 x 22 px with 4 px between them: two of them side by side are 18 px between centres, below the 24 px of WCAG 2.2 target size (2.5.8). The maintainer decided on 2026-11-25 to keep the size (see "Questions answered after the implementation") |
| Browsers | test | `e2e/typography.spec.ts` (geometry from the findings, copy, edit, expand, tips, layout, right-to-left, reduced motion, contrast in Chromium, Firefox and WebKit) and `tests/TypographyServer.test.ts` |
| Browser floor | test | `npm run test:floor` (CSS audit and the Typography smoke of 10 checks on Chromium 90, Firefox 85, WebKit 15.4: 91 of 91 on each, 2026-11-25; no new entry in `ENHANCEMENTS`) |
| Screen reader | test | `screen-reader/typography.spec.ts` (Orca with Firefox through Guidepup, passed locally in Docker twice in a row on 2026-11-25: the copy and edit buttons by name, the `Copied` status for a string and a promised text, the edit field by name and text, the expand button and its state, the whole cut text, the level of a title, plain links of the article and of a part; see "Implementation notes"). The `Copied` of a promised text that takes seconds, NVDA, JAWS, VoiceOver and a phone screen reader were not checked, and the README and the page say so |

## Список тестов

Each item is at least one test; the test name is the item.

- `TYP-1` to `TYP-7`: elements and tags, decorations nested in order and combined, type and disabled classes, margins and sizes from tokens,
  the root's descendant styles and nothing outside, `level` and `type` validation.
- `TYP-8`, `TYP-9`: Link `rel`, disabled form (no `href`, `aria-disabled`, no `onclick`, actions work).
- `TYP-10` to `TYP-16` (with `TYP-11a`: the spinner, one request at a time, rejection, no spinner for a string, the same box; with `TYP-12a`: the write
  inside the click, each way back, a rejected promise, and in the browser an answer after more than 5 s): copy: the text sources (function, promise, `content`, rendered text, snippet child), the Clipboard path, the
  fallback path (no `navigator.clipboard`), both failing, the success state and its 3 s with fake timers, a second click restarts it, the status message,
  the timer cleared on destroy, `oncopy` once; in the browser: the box does not change on the swap.
- `TYP-17` to `TYP-26`: edit: start by pencil and by text, `triggerType`, caret at the end, Enter, Shift+Enter, Esc, blur, Tab,
  focus return and not stealing focus, IME, `maxLength`, `autoSize`, `onchange` only on a change, `bind:content`, `bind:editing`, the name,
  `onstart` once with two triggers, no start from an action click.
- `TYP-27` to `TYP-36`: ellipsis: the mode per props, one row with actions, several rows, the "cut" state read on resize, an exact fit is
  not cut, the script cut for `suffix` / `expandable` / rows with actions, a surrogate pair is not split, re-cut on width, text and font
  load, expand, collapsible, `bind:expanded`, the symbol forms, `suffix` always, the tooltip rules (only when cut, not on actions, can
  enter the tip), `onellipsis` timing, `onexpand`, no `stopPropagation`; in the browser with real widths and fonts of different widths.
- `TYP-37` to `TYP-42`: `actions.placement` and the order, shimmer (the custom properties, `aria-busy`, forced colors, reduced motion),
  `dir="rtl"`, `classNames` / `styles` for each part, the server markup equals the client markup, reactivity.
- A11y: axe in every state; the cut part's reading text; the expand button's name equals its visible text; `aria-expanded` on both
  buttons; a negative check that a field without a name is reported.
- Visual states in Playwright (`e2e/typography.spec.ts`): the geometry measured on the Ant Design demos (sizes, margins, the 14 x 22 button,
  the 32 px edit field that overhangs the line and moves nothing), the contrast matrix with `tokens-accessible.css` and in the dark theme, no layout shift on the copy swap
  and on the expand with text of different widths, `prefers-reduced-motion`.
- Forced colors: `e2e/forced-colors.spec.ts`. IME: `e2e/typography-ime.chromium.spec.ts`.
- Screen reader (Orca, P23): `screen-reader/typography.spec.ts` asserts what Orca says: the names `Copy`, `Edit`, the status `Copied` after a copy of a string and of a
  promised text (and no `Copied` while the text is awaited), the expand button with its state (collapsed, expanded), the whole text of a part cut by script, the name of
  the edit field, the level of a title, plain links of the article and of a part; the lab gets the controls it needs (`e2e/fixtures/TypographyLab.svelte`).
  Written with the other tests, run locally in Docker until green.
- The docs page: `tests/docs/typography-page.test.ts` compares the API and token tables with the sources and checks that every prop is in an
  example; the `Typography page` block of `docs/e2e/site.spec.ts` checks the units, the groups are independent, three languages.
- Tokens: `tests/tokens.test.ts` (the documented values, the contrast of every type color and the link with the accessible file and in
  the dark theme).
- The server render: `tests/TypographyServer.test.ts`. The browser floor: the Typography smoke of `scripts/floor/smoke.cjs`.
- Mutation testing: **not run**: `scripts/mutation-test.mjs` has no operators for Typography. It can be added later; the branch and line
  coverage of the sources is 100%.

## Implementation notes (2026-11-24 and 25)

- **One body, four parts.** `TextBase.svelte` is the whole behavior; the four parts choose the element and validate what is theirs
  (`level`, the link attributes).
- **Expand and collapse are one button** that changes its content and `aria-expanded` (the position never moves), not two buttons.
  A string `symbol` is the text of **expand**; collapse stays `Collapse` (a snippet changes both).
- **`TooltipProps` of `ellipsis.tooltip`** omit `children`, `anchor` and `open`: the component controls them.
- **The tip is refused, not hidden.** The `open` setter of `Tooltip` is bound to a function that says no when the text is not cut, so
  the cut is measured at the first hover (TYP-34).
- **The script cut** clones the live nodes into a hidden ruler inside the part, writes candidate prefixes into it and reads its height
  (about `log2(length)` reads). A `Text` takes its room from its parent (its own width shrinks to the cut). The number of rows of a CSS
  clamp is an inline `-webkit-line-clamp`: the standard property is unknown to the browser floor and to the CSS check of the docs.
- **The edit field** overhangs the line by negative margins (the block keeps its size, the neighbours stay), takes the font of its text
  through the `style` of `InputTextArea`, and its value drops line breaks (Chromium inserts one after an Enter pressed during a
  simulated composition). After a click elsewhere the focus is never moved.
- **Found by a coverage run:** with `editing` true from the first render and a text given as `children`, the field opened empty (the hidden
  copy of the children did not exist yet); the text is now read right after the first render, with a test.
- **A shared fix, `internal/popup/`.** Taking a focused `Tooltip` trigger out of the page (the edit field replacing the pencil) raised
  `state_unsafe_mutation`: the browser fires `focusout` in the middle of the teardown. The close now waits for the end of the task
  **only** when the event arrives inside a Svelte reaction (`reaction.svelte.ts`); a normal blur closes at once. Regression test in
  `e2e/typography.spec.ts` (it fails without the fix) and `tests/popupTriggers.test.ts`.
- **Browser floor.** WebKit 15.4 ends a clamped box at the last glyph, 3 px short of the line (41 for two rows): the whole rows show and
  the smoke allows it. `Highlight` / `HighlightText` replace `Mark` / `MarkText` in forced colors; `background-clip` is written as the standard
  `border-box` before the prefixed `text`.
- **A late announcement cannot be checked with Orca here (2026-11-25).** When a promised text is written 4 s after the click, the DOM shows the
  status and the new name, and Orca says nothing; it says nothing for a plain `role="status"` changed by a script on the same page either, while
  with a text that comes after 300 ms it says `Copied`, from the status (removed, nothing is said; with the name kept at `Copy`, it is said). So
  this setup speaks a change of a status only right after a key press, and the late case stays unchecked.
- **Orca** says "expanded" when the button opens the text and nothing when it closes it; a plain button with `aria-expanded` behaves the
  same in this setup (compared on 2026-11-25), so the test reads the collapsed state by coming back to the button.
- **Server rendering.** In a real browser the client takes over the server markup of every scene without a warning (checked with the
  same Vite server on both sides). Vitest and the Vite server of the test helper scope the styles differently, so the markup comparison
  ignores Svelte's scoping classes.
- **Architecture check.** The files that the `exports` map of `package.json` exposes are public surface (Q6), with tests.
- **Found by the maintainer's question about two looks of an `h4` (2026-11-25).** Two faults of the article, both fixed with tests that
  failed before: (1) its rules for plain tags weighed more than the classes of our own components, so a colored or disabled Title inside it
  turned the plain color, and a `Menu` inside it took the margins of an article list; (2) `code`, `kbd`, `mark` and `strong` were styled by
  rules of the parts, so an application that used only `Typography` got none of them (the documentation page, which loads every part, hid
  it). `TYP-5` had no test; `TYP-25`, `TYP-29`, `TYP-36` and `TYP-39` had no test of their name, and now have.
- **Code of the examples (the maintainer's remark, 2026-11-25).** The highlighter of the documentation site colored a name as an attribute
  only when `=` followed it, so `strong`, `code` or `mark` had the color of the text, and `type=` that of a keyword; a whole style block
  had the color of an expression, as the braces of an `import` in a script did. It now reads the tags, the script and the CSS rules
  (`docs/src/docs/highlight.ts`, `tests/docs/highlight.test.ts`: every attribute of every example, found by the Svelte compiler, and no
  script or style block painted as markup).
- **Docs page.** The article is shown twice, with the four parts and with ready HTML, so that the two ways are not mixed; the title example
  keeps the margins of the titles. The title example starts at level 2 (a page has one `h1`); the demo about parts is called "Styling the parts" (two regions
  with one name fail axe); the outputs sit right under their component (the paragraph margin is zero inside the units).

## Questions answered after the implementation (2026-11-25)

- **A promised text that comes late: fix it.** A write that starts after a few seconds fails in all three engines. `TYP-12a`: the write
  starts inside the click with a `ClipboardItem` that takes the promise. Checked in headed Chromium, Firefox and WebKit (the Playwright
  builds, on a virtual display, no permission granted): this write passed after 6.5 s, while a `writeText` made then was refused (Firefox,
  WebKit) or never settled (Chromium, which waits for a permission). `e2e/typography.spec.ts` fails in the three engines without it; a page
  that Playwright calls into counts that as a new click, so the test leaves the page alone while the text is on its way. The oldest
  supported engines go the fallback way (Chromium 90 refuses a promise in `ClipboardItem`; the Firefox 85 and WebKit 15.4 builds have
  none). The installed Safari, Chrome and Firefox were not tried.
- **Target size of the buttons: keep** the Ant Design geometry (14 x 22 px, 4 px apart), below the 24 px of WCAG 2.2 2.5.8; not tried on a
  phone.
- **Plain paragraphs and links in the article: add both** (not in the Q5 list; HTML from Markdown almost always has them). Observed on
  the published bundle (React 6.7.2) rendered in an empty page, Chromium: `p` has `margin: 14px 0` (the 14 px above are the browser's own);
  `a`, with or without `href`, is `#1677ff` without underline, `#69b1ff` on hover, `#0958d9` pressed, with a focus ring, and the same
  inside a standalone Paragraph; `pre` has `margin: 14px 0`. Ours, and where it differs: a first paragraph has no top margin (as the first
  heading); `pre` gets the 1em under it of a list (it had none, so a following block could touch it); only an `a` with `href` is a link;
  the dark theme underlines links (see "A11y"); `p` and `pre` in the article only.
- **Plain links outside the article: the same** (`TYP-5a`, the maintainer's second answer). Observed on the same bundle: inside a standalone
  Paragraph, Title and Text, a `type="danger"` and a `type="secondary"` Paragraph and a disabled one, a plain `a` is `#1677ff` without
  underline and `#69b1ff` on hover.

## Docs page plan (stage 6, done)

One page `Typography` at `/components/typography/` (en, ru, zh); every example a `stack` of `field` units, in the two-column grid; the
article demos (components and ready HTML) and the ellipsis demos are `wide`. The names in the menu stay English.

| Example | Spec items |
|---|---|
| `01-basic` | the `Typography` root with the four parts inside it: titles, paragraphs, text decorations, a link |
| `02-html` | `Typography` around ready HTML (`{@html}`): plain headings, a paragraph with a link, lists, a quote, `pre`, `code`, `kbd`, `mark`, `strong` (TYP-5, Q5) |
| `03-title` | `level` 1 to 5 |
| `04-text` | `type`, `disabled`, `strong`, `italic`, `underline`, `delete`, `mark`, `code`, `keyboard`, combined |
| `05-link` | `href`, `target`, `disabled` (and the status of its actions), a plain `<a>` inside a paragraph (TYP-5a) |
| `06-copyable` | `copyable`: default, `text` (string, function), `icon`, `tooltips`, `false`, `oncopy` output |
| `07-editable` | `editable`: default, `bind:content`, `icon`, `tooltip`, `enterIcon`, `triggerType`, `maxLength`, `autoSize`, `bind:editing` |
| `08-ellipsis` | `ellipsis` one row, `rows`, a Text with a width and a `tooltip` |
| `09-expandable` | `expandable`, `'collapsible'`, `symbol` (string and snippet), `onexpand` output |
| `10-controlled` | `bind:expanded` with a switch and a rows slider (each its own state) |
| `11-suffix` | `suffix` with `rows` and `expandable` |
| `12-actions` | `actions.placement`, the buttons together (expand, edit, copy) |
| `13-shimmer` | `shimmer`, `duration` (number and pair) |
| `14-semantic` | `classNames`, `styles`, `class`, `style` for the four parts |

API tables: the base props, the three config objects, the four semantic parts, tokens. No method table. The accessibility notes (the
keyboard limits, color not alone, no announcement of a failed copy) sit in the "Accessibility" list of the page. A silhouette for the card on the
overview page.

## Исходник, консультации

None so far. The source code of Ant Design was not read for this component. Q2 records the offer of a reader subagent for the cut of long
text; the maintainer has not answered it. If one is started, the date, the question, the mechanism read by name and what it confirmed
are added here, in words, without quotes, and `TYP-27` to `TYP-30` are updated if the decision changes.
