<script lang="ts">
  import { Button, message, type MessageHandle } from 'svelte-ant-design';

  // The function that a call returns closes the message.
  let hide: MessageHandle | undefined;
</script>

<div class="stack">
  <div class="field">
    <span class="caption">duration 1 (seconds; the default is 3)</span>
    <Button onclick={() => message.info('Gone in a second', 1)}>1 second</Button>
  </div>

  <div class="field">
    <span class="caption">duration 6</span>
    <Button onclick={() => message.info('Stays for six seconds', 6)}>6 seconds</Button>
  </div>

  <div class="field">
    <span class="caption">duration 0: until it is closed from code</span>
    <div class="row">
      <Button onclick={() => (hide = message.loading('Stays until you close it', 0))}>Open</Button>
      <Button onclick={() => hide?.()}>Close it</Button>
    </div>
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

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
