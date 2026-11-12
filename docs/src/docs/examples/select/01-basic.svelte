<script lang="ts">
  import { Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  let city = $state<SelectValue | undefined>();
  let last = $state('no change yet');

  // A string or a number is both the value and the label; an object gives them apart.
  const cities = [
    'Bishkek',
    'Almaty',
    { value: 'tashkent', label: 'Tashkent' },
    { value: 'ulaanbaatar', label: 'Ulaanbaatar', disabled: true }
  ];
</script>

<!-- bind:value keeps a variable in sync with the field; onchange receives the value and the option object. -->
<Select
  bind:value={city}
  aria-label="City"
  placeholder="Pick a city"
  options={cities}
  style="width: 240px"
  onchange={(value, option) => (last = `onchange(${JSON.stringify(value)}, ${JSON.stringify(option)})`)}
/>
<span>The city is {city === undefined ? 'not chosen' : city}</span>
<span role="status">{last}</span>
