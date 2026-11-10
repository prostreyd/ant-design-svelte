<script lang="ts">
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import CheckboxGroup from '$lib/Checkbox/CheckboxGroup.svelte';

  const options = ['Apple', 'Pear', 'Orange'];
  let selected = $state<string[]>(['Apple']);

  const all = $derived(selected.length === options.length);
  const some = $derived(selected.length > 0 && !all);
</script>

<Checkbox checked={all} indeterminate={some} onchange={(checked) => (selected = checked ? [...options] : [])}>
  Check all
</Checkbox>
<CheckboxGroup bind:value={selected} {options} aria-label="Fruits" />
<output data-testid="selected">{selected.join(',')}</output>
