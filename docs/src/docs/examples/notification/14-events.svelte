<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  let clicked = $state(0);
  let reason = $state('');
</script>

<!-- `onclick` is called when the box is clicked (not the close button). `onclose` is called once, when the notification starts to
     close, with the reason: 'timeout', 'user' (the close button, Escape), 'replaced' (the limit) or 'destroy' (code). -->
<div class="stack">
  <div class="field">
    <Button
      onclick={() =>
        notification.info({
          title: 'Click me, or close me',
          description: 'Wait, close it, or press Escape inside it.',
          duration: 6,
          onclick: () => clicked++,
          onclose: (why) => (reason = why)
        })}
    >
      Open
    </Button>
    <span role="status">box clicks: {clicked}; closed by: {reason || '—'}</span>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

</style>
