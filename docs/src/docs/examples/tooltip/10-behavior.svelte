<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';

  let host = $state<HTMLElement>();
  let visible = $state(false);
</script>

<!-- autoAdjustOverflow flips the tip to the other side when there is no room (this trigger is at the left edge). -->
<div class="edge">
  <Tooltip title="flips to the right" placement="left">
    <Button>Flips</Button>
  </Tooltip>
  <Tooltip title="stays on the left, and runs off the screen" placement="left" autoAdjustOverflow={false}>
    <Button>autoAdjustOverflow off</Button>
  </Tooltip>
</div>

<!-- zIndex overrides the tooltip layer (1070 by default). -->
<Tooltip title="zIndex 3000" zIndex={3000}>
  <Button>zIndex</Button>
</Tooltip>

<!-- container moves the tip into an element; the tip is clipped by it. -->
<div class="host" bind:this={host}>
  <Tooltip title="Inside the box" container={host}>
    <Button>container</Button>
  </Tooltip>
</div>

<!-- destroyOnHidden removes the content from the DOM on every close; the text below is its state. -->
<Tooltip title="Removed when closed" destroyOnHidden onopenchange={(next) => (visible = next)}>
  <Button>destroyOnHidden</Button>
</Tooltip>
<span role="status">{visible ? 'in the DOM' : 'removed'}</span>

<style>
  .edge {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .host {
    position: relative;
    display: inline-block;
    padding: 28px 12px 4px;
    margin: 0 12px;
    border: 1px dashed #8c8c8c;
  }
</style>
