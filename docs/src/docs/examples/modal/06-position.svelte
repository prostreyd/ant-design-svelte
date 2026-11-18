<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let centered = $state(false);
  let wide = $state(false);
  let high = $state(false);
</script>

<div class="stack">
  <div class="row">
    <Button onclick={() => (centered = true)}>Centered</Button>
    <Button onclick={() => (wide = true)}>Width 720</Button>
    <Button onclick={() => (high = true)}>Style and zIndex</Button>
  </div>

  <Modal bind:open={centered} title="Centered" centered><p>In the middle of the window.</p></Modal>
  <Modal bind:open={wide} title="Width 720" width={720}><p>A number is px; a string such as <code>'60%'</code> is used as it is. On a narrow window it is never wider than the window.</p></Modal>
  <Modal bind:open={high} title="Style and zIndex" style="top: 20px" zIndex={1100}><p>20px from the top, above the default layer.</p></Modal>
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
