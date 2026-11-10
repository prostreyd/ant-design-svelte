<script lang="ts">
  import { CheckboxGroup } from 'svelte-ant-design';

  let fruits = $state<string[]>(['Apple']);
  let sizes = $state<number[]>([2]);
  let extras = $state<string[]>([]);
  let last = $state('no change yet');
</script>

<!-- Strings and numbers are both the value and the label; the group reports the whole array. -->
<CheckboxGroup
  bind:value={fruits}
  options={['Apple', 'Pear', 'Orange']}
  aria-label="Fruits"
  onchange={(value) => (last = `onchange([${value.join(', ')}])`)}
/>
<CheckboxGroup bind:value={sizes} options={[1, 2, 3]} aria-label="Sizes" name="size" />

<!-- Objects add a snippet label, disabled, title and an onchange of the option. -->
{#snippet cherry()}<strong>Cherry</strong>{/snippet}

<CheckboxGroup
  bind:value={extras}
  aria-label="Extras"
  options={[
    { label: cherry, value: 'cherry' },
    {
      label: 'Pear',
      value: 'pear',
      title: 'Juicy',
      onchange: (checked) => (last = `pear: ${checked}`)
    },
    { label: 'Plum', value: 'plum', disabled: true }
  ]}
/>

<!-- disabled disables the whole group. -->
<CheckboxGroup disabled value={['Apple']} options={['Apple', 'Pear']} aria-label="Disabled fruits" />
<span role="status">{last}</span>
