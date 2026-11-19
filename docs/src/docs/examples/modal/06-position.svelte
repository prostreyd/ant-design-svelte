<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let centered = $state(false);
  let wide = $state(false);
  let high = $state(false);
  let zoom = $state(false);
</script>

<div class="stack">
  <div class="row">
    <Button onclick={() => (centered = true)}>Centered</Button>
    <Button onclick={() => (wide = true)}>Width 720</Button>
    <Button onclick={() => (high = true)}>Style and zIndex</Button>
    <Button onclick={() => (zoom = true)}>zoomFromClick</Button>
  </div>

  <Modal closeOnOk bind:open={centered} title="Centered" centered><p>In the middle of the window.</p></Modal>
  <Modal closeOnOk bind:open={wide} title="Width 720" width={720}><p>A number is px; a string such as <code>'60%'</code> is used as it is. On a narrow window it is never wider than the window.</p></Modal>
  <Modal closeOnOk bind:open={high} title="Style and zIndex" style="top: 20px" zIndex={1100}><p>20px from the top, above the default layer.</p></Modal>
  <Modal closeOnOk bind:open={zoom} title="From the click" zoomFromClick><p>It zooms in and out from the place of the click, as in Ant Design. By default it zooms around its own center.</p></Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
