<script lang="ts">
  import { Button, message } from 'svelte-ant-design';

  let top = $state<number | string>(8);

  $effect(() => {
    message.config({ top });
    return () => message.config({ top: undefined });
  });
</script>

<!-- top is a number (pixels) or any CSS length. -->
<div class="stack">
  <div class="field">
    <span class="caption">top: {typeof top === 'number' ? `${top} (px)` : `'${top}'`}</span>
    <div class="row">
      <Button onclick={() => (top = 8)}>8</Button>
      <Button onclick={() => (top = 80)}>80</Button>
      <Button onclick={() => (top = '30vh')}>'30vh'</Button>
    </div>
  </div>

  <Button onclick={() => message.info({ content: 'Where am I?', duration: 5 })}>Show message</Button>
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
