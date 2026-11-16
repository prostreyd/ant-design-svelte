<script lang="ts">
  import { Select } from 'svelte-ant-design';

  const fruit = ['Apple', 'Banana', 'Cherry'];
</script>

<!-- A Select has no label of its own: name it with an external label, aria-label or aria-labelledby. -->
<!-- The label also names a field that does not search, which a native label could not do for a <div>. -->
<label for="select-labels-fruit">Fruit</label>
<Select id="select-labels-fruit" options={fruit} placeholder="label for" style="width: 200px" />

<Select aria-label="Favourite fruit" options={fruit} placeholder="aria-label" style="width: 200px" />

<span id="select-labels-colour">Colour</span>
<Select
  aria-labelledby="select-labels-colour"
  aria-describedby="select-labels-colour-hint"
  options={['Red', 'Green']}
  placeholder="aria-labelledby"
  style="width: 200px"
/>
<small id="select-labels-colour-hint">The colour of the fruit</small>

<!-- The search input is a native input, so a label names it natively. aria-describedby adds the selected text after your ids. -->
<label for="select-labels-search">Search a fruit</label>
<Select id="select-labels-search" showSearch options={fruit} value="Banana" style="width: 200px" />
