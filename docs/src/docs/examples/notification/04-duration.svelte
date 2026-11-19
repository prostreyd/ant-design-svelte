<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  let close: (() => void) | undefined;
</script>

<!-- `duration` is in seconds (default 4.5). `0` or `false` keeps the notification until it is closed. -->
<div class="stack">
  <div class="field">
    <span class="caption">duration 10</span>
    <Button onclick={() => notification.info({ title: 'Ten seconds', description: 'It waits longer than usual.', duration: 10 })}>10 s</Button>
  </div>

  <div class="field">
    <span class="caption">duration 0: until it is closed</span>
    <div class="row">
      <Button onclick={() => (close = notification.warning({ title: 'Stays', description: 'Close it with the cross, or with the other button.', duration: 0 }))}>
        Open
      </Button>
      <Button onclick={() => close?.()}>Close it by code</Button>
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
