<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let plain = $state(false);
  let rich = $state(false);
  let noClose = $state(false);
  let own = $state(false);
</script>

{#snippet richTitle()}<span>Title with <em>emphasis</em></span>{/snippet}
{#snippet crossIcon()}<span aria-hidden="true">✕</span>{/snippet}

<div class="stack">
  <div class="row">
    <Button onclick={() => (plain = true)}>No title</Button>
    <Button onclick={() => (rich = true)}>Snippet title</Button>
    <Button onclick={() => (noClose = true)}>closable: false</Button>
    <Button onclick={() => (own = true)}>closeIcon and a name</Button>
  </div>

  <Modal closeOnOk bind:open={plain} aria-label="A dialog with no title"><p>No title, no header: give it a name with <code>aria-label</code>.</p></Modal>
  <Modal closeOnOk bind:open={rich} title={richTitle}><p>The title is a string, a number or a snippet.</p></Modal>
  <Modal closeOnOk bind:open={noClose} title="No close button" closable={false}><p>Only Cancel, OK, Escape and the mask close it.</p></Modal>
  <Modal closeOnOk bind:open={own} title="Own icon" closeIcon={crossIcon} closable={{ 'aria-label': 'Close the dialog' }}><p>The cross is a snippet, and the button has its own name.</p></Modal>
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
