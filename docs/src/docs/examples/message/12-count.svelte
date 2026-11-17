<script lang="ts">
  import { Button, Switch, message } from 'svelte-ant-design';

  let limited = $state(false);
  let opened = $state(0);

  // maxCount is a setting of message.config(); undefined takes it back to the default.
  $effect(() => {
    message.config({ maxCount: limited ? 3 : undefined });
    return () => message.config({ maxCount: undefined });
  });
</script>

<div class="stack">
  <div class="row">
    <Switch bind:checked={limited} aria-label="maxCount 3" />
    <span>maxCount {limited ? 3 : 'not set'}</span>
  </div>

  <div class="field">
    <div class="row">
      <Button onclick={() => message.info({ content: `Message ${++opened}`, duration: 0 })}>Open one</Button>
      <Button onclick={() => message.destroy()}>Close all</Button>
    </div>
    <span role="status">The oldest closes to make room: {opened} opened</span>
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
