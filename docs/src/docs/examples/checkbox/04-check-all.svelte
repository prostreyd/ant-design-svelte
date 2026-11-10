<script lang="ts">
  import { Checkbox, CheckboxGroup } from 'svelte-ant-design';

  const options = ['Apple', 'Pear', 'Orange'];
  let selected = $state<string[]>(['Apple']);

  const all = $derived(selected.length === options.length);
  const some = $derived(selected.length > 0 && !all);
</script>

<!-- indeterminate only changes the look; checked stays the value that is reported. -->
<Checkbox
  checked={all}
  indeterminate={some}
  onchange={(checked) => (selected = checked ? [...options] : [])}
>
  Check all
</Checkbox>
<CheckboxGroup bind:value={selected} {options} aria-label="Fruits" />
<span role="status">Selected: {selected.join(', ') || 'nothing'}</span>
