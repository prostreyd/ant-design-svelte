<script lang="ts">
  import { RadioGroup } from 'svelte-ant-design';

  let first = $state('Apple');
  let second = $state<string | undefined>();
  let last = $state('no change yet');
</script>

<!-- Tab enters a group once, on the selected radio (or the first when none is). Arrow keys move and select; Space
     selects the focused one. The browser does it: the inputs of a group share one name. -->
<div class="stack">
  <input aria-label="Before the groups" placeholder="Tab from here" />
  <RadioGroup
    bind:value={first}
    options={['Apple', 'Pear', 'Orange']}
    aria-label="First group"
    onchange={(value) => (last = `first: ${value}`)}
  />
  <RadioGroup
    bind:value={second}
    options={['Red', 'Green', 'Blue']}
    aria-label="Second group"
    onchange={(value) => (last = `second: ${value}`)}
  />
  <span role="status">{last}</span>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
