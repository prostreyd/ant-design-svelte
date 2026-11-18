<script lang="ts">
  import { Button, modal } from 'svelte-ant-design';
</script>

<!-- A call opens a dialog from code: no markup, no state. confirm has Cancel and OK; info, success, warning and error have OK only (okCancel changes that). -->
<div class="stack">
  <div class="row">
    <Button onclick={() => modal.confirm({ title: 'Delete the file?', content: 'This cannot be undone.' })}>confirm</Button>
    <Button onclick={() => modal.info({ title: 'Heads up', content: 'The service restarts at midnight.' })}>info</Button>
    <Button onclick={() => modal.success({ title: 'Saved', content: 'Your changes are stored.' })}>success</Button>
    <Button onclick={() => modal.warning({ title: 'Careful', content: 'The disk is almost full.' })}>warning</Button>
    <Button onclick={() => modal.error({ title: 'Failed', content: 'The upload did not finish.', okText: 'Got it' })}>error</Button>
    <Button onclick={() => modal.info({ title: 'Update available', content: 'Install it now?', okCancel: true, okText: 'Install', cancelText: 'Later' })}>info + okCancel</Button>
    <Button onclick={() => modal.info({ title: 'From the click', content: 'This dialog zooms from the place of the click.', zoomFromClick: true })}>info + zoomFromClick</Button>
  </div>
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
