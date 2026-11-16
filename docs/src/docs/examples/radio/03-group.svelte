<script lang="ts">
  import { Radio, RadioGroup } from 'svelte-ant-design';

  let fruit = $state('Apple');
  let last = $state('no change yet');
</script>

<div class="stack">
  <!-- The children of the group are Radio elements; each one needs a value. -->
  <RadioGroup
    bind:value={fruit}
    name="fruit"
    aria-label="Fruit"
    onchange={(value) => (last = `onchange(${value})`)}
  >
    <Radio value="Apple">Apple</Radio>
    <Radio value="Pear">Pear</Radio>
    <Radio value="Orange">Orange</Radio>
  </RadioGroup>
  <span>The value is {fruit}</span>
  <span role="status">{last}</span>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
