<script lang="ts">
  import { Button, Switch, notification } from 'svelte-ant-design';

  let stacked = $state(true);
  let opened = $state(0);

  // `stack` is a setting of notification.config(): on by default, `{ threshold }` sets the number, `false` turns it off.
  $effect(() => {
    notification.config({ stack: stacked ? undefined : false });
    return () => notification.config({ stack: undefined });
  });
</script>

<!-- Past the threshold (3) the older notifications of a place lie behind the newest one; the pointer or the focus opens the pile,
     and every timer waits while it is open. -->
<div class="stack">
  <div class="row">
    <Switch bind:checked={stacked} aria-label="stack" />
    <span>stack {stacked ? 'on (the default), threshold 3' : 'off'}</span>
  </div>
  <div class="row">
    <Button onclick={() => notification.info({ title: `Notification ${++opened}`, description: 'This is a stacked notification.', duration: 12 })}>Open</Button>
    <Button onclick={() => notification.destroy()}>Destroy all</Button>
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
