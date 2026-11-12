# Select

A drop-down list with Ant Design-inspired styles and a Svelte 5 API. Three components:

| Component | What it is |
|---|---|
| `Select` | the field and its list, in the modes single (default), `multiple` and `tags` |
| `SelectOption` | one option, written inside `Select` or `SelectOptGroup` (the markup form of an `options` entry) |
| `SelectOptGroup` | a labelled group of `SelectOption`s |

## Usage

Import the design tokens once in the application entry point:

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Select } from 'svelte-ant-design';

  let city = $state<string | number | undefined>();
</script>

<Select
  bind:value={city}
  aria-label="City"
  placeholder="Pick a city"
  options={['Bishkek', 'Almaty', { value: 'tashkent', label: 'Tashkent' }]}
  style="width: 240px"
/>
```

A Select has no label of its own: name it with an external `<label for>` (and the `id` of the field), `aria-label`
or `aria-labelledby`. The placeholder is not a name. The field fills its container like `Input`; set the width with
`class` or `style`.

`options` take strings and numbers (both the value and the label), objects (`{ value, label, disabled, title, class }`,
other keys pass through to the callbacks) and groups (an object with an `options` array). `fieldNames` maps the keys of
your own data. `onchange` receives the value and the option object; for `multiple` and `tags` the value is an array and
the option is an array of objects.

```svelte
<Select mode="multiple" bind:value={languages} options={['Svelte', 'Rust', 'Go']} aria-label="Languages" maxTagCount={2} />
<Select mode="tags" bind:value={tags} tokenSeparators={[',']} aria-label="Tags" />
<Select showSearch options={people} optionFilterProp={['label', 'team']} aria-label="Person" />
```

## Options as markup

`SelectOption` and `SelectOptGroup` written inside `Select` give the same options as `options`, in the order of the
markup, also after `{#each}` and `{#if}` insert or move one. A non-empty `options` wins and the children are ignored.

```svelte
<Select bind:value aria-label="Mood">
  <SelectOption value="happy" label="Happy" />
  <SelectOptGroup label="Other">
    <SelectOption value="sad" label="Sad" />
  </SelectOptGroup>
</Select>
```

The text that search, type-ahead and the accessible name use is the `label` when it is a string, then the `title`, then
the value. The content of an option (its `children`) is only drawn, so write a `label` for an option that has to be found
by search.

## Behavior to know

- DOM focus never leaves the field: the highlighted option is shown by `aria-activedescendant`, and a press inside the
  list does not blur the field.
- The list is put at the end of the page (`container` changes that), so it is never cut off by the container of the field.
  It flips at the edge of the screen and follows the field while the page scrolls.
- The search text is cleared when the list closes, and `onsearch` is told. `filterOption={false}` leaves the list to you
  (server-side search).
- Tab only closes the list and keeps the value.
- A long list renders all its options in this version (there is no `virtual` yet); `listHeight` makes it scroll.
- The built-in texts (`No data`, `Clear`, `Remove ...`, and the number of matches announced while searching) are English;
  `notFoundContent`, `allowClear.label` and `resultsText` replace three of them.
- The type of an option object is `SelectOptionItem`, because `SelectOption` is the component.
- The field is not a native form control: it does not submit with a `<form>`. Read `value`.

## Accessibility

The focused element is a `<div>` or, with `showSearch`, an `<input>`, with `role="combobox"`, `aria-expanded`,
`aria-controls` and `aria-activedescendant`; the list is a `listbox` of `option`s and `group`s. Keys: Down, Up, Alt+Down,
Alt+Up, Enter, Space, Home, End, PageUp, PageDown, Escape, Tab, Backspace, and typing characters in a field that cannot
search. Forced-colors modes (Windows High Contrast) are supported. Support for `aria-activedescendant` in iOS VoiceOver has
been weak, so check a Select by hand there.

Known limitation: Orca announces a change of `aria-selected` only after the Space key. In a field that searches (the default
of `multiple` and `tags`) Space types a space and Enter toggles an option, so Orca says nothing when one is toggled; the
field reads the selected values when it gets focus. The React, Vue and Angular demos of Ant Design are silent in the same
case. An announcement of the toggled option (`selectionText`) is planned for v1.1 with the translation of the built-in texts,
after NVDA, JAWS and VoiceOver have been tried.

The default light colors are Ant Design's own and do not reach WCAG AA for every text. Import `tokens-accessible.css`
after `tokens.css` for colors that do.

## API and examples

The API tables, the methods and the design tokens are on the
[Select page](https://prostreyd.github.io/ant-design-svelte/components/select/) of the documentation site, with a live
example for every property. The specification is [`specs/select.md`](../../../specs/select.md).
