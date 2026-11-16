<script lang="ts">
  import { RadioButton, RadioGroup } from 'svelte-ant-design';

  let city = $state('Hangzhou');
  let solidCity = $state('Shanghai');
  let mode = $state('day');
</script>

<div class="stack">
  <!-- optionType="button" asks options for buttons instead of plain radios. -->
  <RadioGroup
    bind:value={city}
    optionType="button"
    options={['Hangzhou', 'Shanghai', { label: 'Beijing', value: 'Beijing', disabled: true }]}
    aria-label="City"
  />

  <!-- buttonStyle="solid" fills the checked button. -->
  <RadioGroup
    bind:value={solidCity}
    optionType="button"
    buttonStyle="solid"
    options={['Hangzhou', 'Shanghai', 'Chengdu']}
    aria-label="City, solid"
  />

  <!-- Or put RadioButton elements in the group yourself. -->
  <RadioGroup bind:value={mode} buttonStyle="solid" aria-label="Mode">
    <RadioButton value="day">Day</RadioButton>
    <RadioButton value="week">Week</RadioButton>
    <RadioButton value="month">Month</RadioButton>
  </RadioGroup>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
