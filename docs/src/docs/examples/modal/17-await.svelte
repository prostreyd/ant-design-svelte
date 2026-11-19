<script lang="ts">
  import { Button, modal } from 'svelte-ant-design';

  let answer = $state('');

  // The call returns a handle that can be awaited: true for OK, false for Cancel, Escape and destroy.
  // The trap: `await modal.confirm(...)` waits until the dialog is closed, and so does returning the handle from an async function.
  async function ask() {
    const confirmed = await modal.confirm({ title: 'Publish the post?', content: 'It will be visible to everyone.' });
    answer = confirmed ? 'You pressed OK' : 'You cancelled';
  }
</script>

<div class="stack">
  <Button onclick={ask}>Ask</Button>
  <output class="caption">{answer}</output>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
