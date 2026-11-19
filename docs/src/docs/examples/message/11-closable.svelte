<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<!-- closable adds a button. Enter and Space press it, and Escape closes the message that has focus inside it. -->
<div class="stack">
  <div class="field">
    <span class="caption">closable, duration 0: stays until the button is pressed</span>
    <Button onclick={() => message.info({ content: 'A message that stays', closable: true, duration: 0 })}>stays</Button>
  </div>

  <div class="field">
    <span class="caption">closable, duration 3</span>
    <Button onclick={() => message.error({ content: 'Upload failed', closable: true })}>can be closed</Button>
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

  .caption {
      color: var(--ads-color-text-secondary);
      font-size: 12px;
    }
</style>
