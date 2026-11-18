<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
</script>

<!-- okText and cancelText: a text, a number or a snippet. okType is the type of the OK button; okButtonProps and cancelButtonProps are the props of Button itself. -->
<div class="stack">
  <Button onclick={() => (open = true)}>Delete…</Button>
  <Modal
    bind:open
    title="Delete the project?"
    okText="Delete"
    cancelText="Keep it"
    okType="primary"
    okButtonProps={{ danger: true }}
    cancelButtonProps={{ type: 'text' }}
    onok={() => (open = false)}
  >
    <p>The OK button is a danger button, and Cancel is a text button.</p>
  </Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }
</style>
