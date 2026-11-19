<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  const text = 'The type gives the icon, and a screen reader the type word before the title.';
</script>

<!-- Four kinds with an icon, and `open`, which has none. `error` and `warning` are read out at once, the others wait. -->
<div class="stack">
  <div class="row">
    <Button onclick={() => notification.success({ title: 'Saved', description: text })}>success</Button>
    <Button onclick={() => notification.info({ title: 'New version', description: text })}>info</Button>
    <Button onclick={() => notification.warning({ title: 'Almost full', description: text })}>warning</Button>
    <Button onclick={() => notification.error({ title: 'Upload failed', description: text })}>error</Button>
  </div>
  <div class="field">
    <span class="caption">open: no type icon</span>
    <Button onclick={() => notification.open({ title: 'No icon', description: text })}>open</Button>
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
