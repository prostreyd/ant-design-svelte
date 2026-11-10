<script lang="ts">
  import { Checkbox, CheckboxGroup } from 'svelte-ant-design';

  let days = $state<string[]>(['mon', 'wed']);
</script>

<!-- The children of the group are your own markup: here a grid. Each checkbox needs a value. -->
<CheckboxGroup bind:value={days} aria-label="Days" style="display: block; width: 100%">
  <div class="grid">
    <Checkbox value="mon">Monday</Checkbox>
    <Checkbox value="tue">Tuesday</Checkbox>
    <Checkbox value="wed">Wednesday</Checkbox>
    <Checkbox value="thu">Thursday</Checkbox>
    <Checkbox value="fri" disabled>Friday (closed)</Checkbox>
    <Checkbox value="sat">Saturday</Checkbox>
  </div>
</CheckboxGroup>
<span role="status">Selected: {days.join(', ') || 'nothing'}</span>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px 16px;
  }
</style>
