<script lang="ts">
  import { Button, message } from 'svelte-ant-design';

  let undone = $state(0);
</script>

<!-- A snippet can hold a link or a button. It is drawn in the layer, so it sees the context of the place where the
     MessageHost is, not of this component. -->
{#snippet saved()}
  Saved
  <Button size="small" type="link" onclick={() => undone++}>Undo</Button>
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">content: string, number, snippet</span>
    <div class="row">
      <Button onclick={() => message.info('A string')}>string</Button>
      <Button onclick={() => message.info(0)}>number 0</Button>
    </div>
  </div>

  <div class="field">
    <span class="caption">content: a snippet with a button</span>
    <Button onclick={() => message.success({ content: saved, duration: 6 })}>snippet</Button>
    <span role="status">Undo pressed {undone} times</span>
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
