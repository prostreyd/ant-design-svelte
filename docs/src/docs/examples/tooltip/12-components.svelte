<script lang="ts">
  import { Button, Checkbox, Switch, Tooltip } from 'svelte-ant-design';

  let target = $state<HTMLElement | null>(null);
  let on = $state(false);
</script>

<Tooltip title="Saves the draft">
  <Button type="primary">Save</Button>
</Tooltip>

<Tooltip title="Turns the alerts on or off">
  <Switch aria-label="Alerts" />
</Tooltip>

<!-- The whole label is the trigger: moving from the box to its text does not close the tip. -->
<Tooltip title="You can change this later">
  <Checkbox>Agree with the terms</Checkbox>
</Tooltip>

<!-- An icon-only button needs a name of its own: a tooltip describes, it does not name. -->
<Tooltip title="Add to favorites">
  <Button shape="circle" aria-label="Add to favorites">+</Button>
</Tooltip>

<!-- anchor places the tip at an element that you hold, with no wrapper around it. -->
<button type="button" class="native" bind:this={target} onclick={() => (on = !on)}>Anchor: click me</button>
<Tooltip title="Placed at the button on the left" anchor={target} open={on} trigger={[]} placement="bottom" />

<style>
  .native {
    height: 32px;
    padding: 0 15px;
    border: 1px solid var(--ads-color-border);
    border-radius: 6px;
    background: var(--ads-color-bg-container);
    color: var(--ads-color-text);
    font: inherit;
    cursor: pointer;
  }
</style>
