<script lang="ts">
  import { Button, Radio, RadioGroup } from 'svelte-ant-design';

  let disabled = $state(true);
</script>

<div class="stack">
  <div class="row">
    <Button onclick={() => (disabled = !disabled)}>{disabled ? 'Enable' : 'Disable'}</Button>
    <Radio {disabled}>Not selected</Radio>
    <Radio {disabled} checked>Selected</Radio>
  </div>

  <!-- disabled disables the whole group. -->
  <RadioGroup {disabled} value="Apple" options={['Apple', 'Pear']} aria-label="Fruits" />

  <!-- An option can be disabled alone. -->
  <RadioGroup
    value="Apple"
    aria-label="Stock"
    options={['Apple', { label: 'Pear (out of stock)', value: 'Pear', disabled: true }, 'Orange']}
  />
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
