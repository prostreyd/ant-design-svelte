<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
  let loose = $state(false);
</script>

<div class="stack">
  <div class="row">
    <Button onclick={() => (open = true)}>Long content</Button>
    <Button onclick={() => (loose = true)}>scrollLock: false</Button>
  </div>

  <Modal bind:open title="Long content">
    {#each Array.from({ length: 40 }, (_, index) => index) as index (index)}
      <p>Paragraph {index + 1}: the window scrolls, the page behind does not, and it does not jump sideways when its scrollbar goes away.</p>
    {/each}
  </Modal>

  <Modal bind:open={loose} title="The page may scroll" scrollLock={false}>
    <p>The page behind keeps scrolling while this is open (the Modal does not hold the scroll).</p>
  </Modal>
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
