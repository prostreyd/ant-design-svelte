<script lang="ts">
  import { Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  const languages = ['Svelte', 'TypeScript', 'JavaScript', 'Rust', 'Go', 'Python', 'Kotlin', 'Margaret Hamilton\'s Apollo assembly'];

  let chosen = $state<SelectValue[]>(['Svelte', 'TypeScript']);
  let removed = $state('nothing removed yet');
  let limited = $state<SelectValue[]>(['Rust']);
  let kept = $state<SelectValue[]>(['Svelte', 'Rust', 'Go', 'Python', 'Kotlin']);
  let typed = $state<SelectValue[]>([]);
</script>

<!-- The value is an array; each value is a tag with a remove button. ondeselect runs when one is removed. -->
<Select
  bind:value={chosen}
  aria-label="Languages"
  mode="multiple"
  placeholder="Pick languages"
  options={languages}
  allowClear
  ondeselect={(value) => (removed = `removed ${value}`)}
  style="width: 320px"
/>
<span>{JSON.stringify(chosen)}</span>
<span role="status">{removed}</span>

<!-- maxCount: with two values the other options are disabled. -->
<Select
  bind:value={limited}
  aria-label="At most two"
  mode="multiple"
  maxCount={2}
  options={languages}
  style="width: 320px"
/>

<!-- maxTagCount folds the rest into one tag; maxTagTextLength cuts a long tag. -->
<Select
  bind:value={kept}
  aria-label="Folded tags"
  mode="multiple"
  maxTagCount={2}
  maxTagPlaceholder="+ more"
  maxTagTextLength={8}
  options={languages}
  style="width: 320px"
/>

<!-- autoClearSearchValue={false}: the text stays after a selection, so several matches can be picked in a row. -->
<Select
  bind:value={typed}
  aria-label="Keep the search text"
  mode="multiple"
  autoClearSearchValue={false}
  placeholder="Type, then pick several"
  options={languages}
  style="width: 320px"
/>
