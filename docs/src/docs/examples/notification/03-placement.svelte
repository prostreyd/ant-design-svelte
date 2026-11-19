<script lang="ts">
  import { Button, notification, type NotificationPlacement } from 'svelte-ant-design';

  const top: NotificationPlacement[] = ['topLeft', 'top', 'topRight'];
  const bottom: NotificationPlacement[] = ['bottomLeft', 'bottom', 'bottomRight'];

  const show = (placement: NotificationPlacement) =>
    notification.info({ title: placement, description: 'The newest stands nearest the window edge.', placement, duration: 6 });
</script>

<!-- Six places. Each is its own list: the newest notification is nearest the edge, the older ones are pushed away from it. -->
<div class="stack">
  <div class="row">
    {#each top as placement (placement)}
      <Button onclick={() => show(placement)}>{placement}</Button>
    {/each}
  </div>
  <div class="row">
    {#each bottom as placement (placement)}
      <Button onclick={() => show(placement)}>{placement}</Button>
    {/each}
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
