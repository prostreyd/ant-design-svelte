<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  let opened = $state(0);
</script>

<!-- `notification.destroy(key)` closes one, `notification.destroy()` closes every notification. -->
<div class="stack">
  <div class="row">
    <Button onclick={() => notification.info({ title: `Notification ${++opened}`, key: `n${opened}`, duration: 0 })}>Open</Button>
    <Button onclick={() => notification.destroy(`n${opened}`)}>Close the last</Button>
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
