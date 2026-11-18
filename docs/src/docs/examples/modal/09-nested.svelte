<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let first = $state(false);
  let second = $state(false);
</script>

<!-- Escape and Tab go to the Modal on top; the first one is out of reach until the second is closed. -->
<div class="stack">
  <Button onclick={() => (first = true)}>Open the first</Button>
  <Modal bind:open={first} title="First">
    <p>The second Modal opens above this one.</p>
    <Button onclick={() => (second = true)}>Open the second</Button>
  </Modal>
  <Modal bind:open={second} title="Second"><p>Escape closes this one first, then the first.</p></Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }
</style>
