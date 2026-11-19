<script lang="ts">
  import { Button, Switch, notification } from 'svelte-ant-design';

  let limited = $state(false);
  let opened = $state(0);
  let pushed = $state(0);

  // maxCount is a setting of notification.config(): it counts the notifications of all places together. undefined takes it back
  // to the default (no limit), so the other examples of the page are not limited.
  $effect(() => {
    notification.config({ maxCount: limited ? 3 : undefined });
    return () => notification.config({ maxCount: undefined });
  });
</script>

<div class="stack">
  <div class="row">
    <Switch bind:checked={limited} aria-label="maxCount 3" />
    <span>maxCount {limited ? 3 : 'not set'}</span>
  </div>

  <div class="field">
    <div class="row">
      <Button
        onclick={() =>
          notification.info({
            title: `Notification ${++opened}`,
            description: 'The oldest closes to make room.',
            duration: 0,
            onclose: (reason) => reason === 'replaced' && pushed++
          })}
      >
        Open one
      </Button>
      <Button onclick={() => notification.destroy()}>Close all</Button>
    </div>
    <span role="status">{opened} opened, pushed out by the limit: {pushed}</span>
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
</style>
