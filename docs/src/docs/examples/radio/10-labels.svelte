<script lang="ts">
  import { Radio, RadioGroup } from 'svelte-ant-design';

  let color = $state('red');
</script>

<div class="stack">
  <!-- children: the text of the radio is its accessible name. -->
  <Radio>Visible text</Radio>

  <!-- aria-label: for a radio without a visible text. -->
  <div class="row">
    <Radio aria-label="Hidden label" />
    <span>No visible text, named by aria-label</span>
  </div>

  <!-- aria-labelledby: another element names it. -->
  <div class="row">
    <Radio aria-labelledby="radio-name" />
    <span id="radio-name">Named by a heading</span>
  </div>

  <!-- An external <label for> works with the id of the input. -->
  <div class="row">
    <Radio id="radio-external" />
    <label for="radio-external">External label</label>
  </div>

  <!-- aria-describedby and title. -->
  <div class="row">
    <Radio aria-describedby="radio-hint" title="Wireless">Wi-Fi</Radio>
    <small id="radio-hint">Uses the radio of your device.</small>
  </div>

  <!-- A group is named with aria-labelledby (or aria-label), so a screen reader says what the choice is about. -->
  <div class="field">
    <span id="color-title">Pick a colour</span>
    <RadioGroup bind:value={color} options={['red', 'green', 'blue']} aria-labelledby="color-title" />
  </div>
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
    gap: 4px 12px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 4px;
  }
</style>
