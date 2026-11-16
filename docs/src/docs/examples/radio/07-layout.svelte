<script lang="ts">
  import { Radio, RadioGroup } from 'svelte-ant-design';

  let a = $state('Apple');
  let b = $state('Pear');
  let c = $state('Hangzhou');
  let d = $state('x');
  const fruits = ['Apple', 'Pear', 'Orange'];
</script>

<div class="layout">
  <!-- orientation="vertical" puts one option on each line. -->
  <RadioGroup bind:value={a} orientation="vertical" options={fruits} aria-label="Vertical" />

  <!-- vertical is a shorthand for it; orientation wins when both are set. -->
  <RadioGroup bind:value={b} vertical optionType="button" options={fruits} aria-label="Vertical buttons" />

  <!-- block fills the width of the parent and shares it between the items. -->
  <RadioGroup
    bind:value={c}
    block
    optionType="button"
    options={['Hangzhou', 'Shanghai', 'Beijing']}
    aria-label="Block"
  />

  <!-- Your own markup around the radios: they still share the group. -->
  <RadioGroup bind:value={d} aria-label="Grid">
    <div class="grid">
      <Radio value="x">Top left</Radio>
      <Radio value="y">Top right</Radio>
      <Radio value="z">Bottom left</Radio>
      <Radio value="w">Bottom right</Radio>
    </div>
  </RadioGroup>
</div>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, 140px);
    gap: 8px;
  }
</style>
