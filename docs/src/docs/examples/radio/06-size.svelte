<script lang="ts">
  import { RadioGroup } from 'svelte-ant-design';

  const cities = ['Hangzhou', 'Shanghai', 'Beijing'];
</script>

<div class="stack">
  <!-- size changes the buttons only; medium is the default, middle and default are aliases of it.
       A plain value is the initial value, so each group keeps its own selection. -->
  <RadioGroup value="Hangzhou" optionType="button" size="large" options={cities} aria-label="Large" />
  <RadioGroup value="Hangzhou" optionType="button" size="medium" options={cities} aria-label="Medium" />
  <RadioGroup value="Hangzhou" optionType="button" size="small" options={cities} aria-label="Small" />
  <RadioGroup value="Hangzhou" optionType="button" size="default" options={cities} aria-label="Default (medium)" />
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
