<script lang="ts">
  import { Radio } from 'svelte-ant-design';

  let selected = $state(false);
  let last = $state('no change yet');
</script>

<div class="stack">
  <!-- The text between the tags is the children of the radio, and its accessible name. -->
  <Radio bind:checked={selected} onchange={(checked) => (last = `onchange(${checked})`)}>
    Send me the newsletter
  </Radio>
  <span>The radio is {selected ? 'selected' : 'not selected'}</span>
  <span role="status">{last}</span>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
