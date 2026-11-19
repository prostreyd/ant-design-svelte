<script lang="ts">
  import { Button, Switch, message } from 'svelte-ant-design';

  let stacked = $state(false);
  let opened = $state(0);

  // stack is a setting of message.config(): true collapses the messages into a pile after 3 of them (or { threshold }).
  $effect(() => {
    message.config({ stack: stacked ? { threshold: 3 } : undefined });
    return () => message.config({ stack: undefined });
  });
</script>

<!-- The newest message is the first row. Past the threshold the others lie behind it; the pointer or focus opens the
     pile, and every timer waits while it is open. -->
<div class="stack">
  <div class="row">
    <Switch bind:checked={stacked} aria-label="stack" />
    <span>stack {stacked ? 'on, threshold 3' : 'off'}</span>
  </div>

  <div class="row">
    <Button onclick={() => message.info({ content: `Message ${++opened}: This is a stacked message.`, closable: true, duration: 10 })}>Open</Button>
    <Button onclick={() => message.destroy()}>Destroy all</Button>
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
