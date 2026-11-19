<script lang="ts">
  import NotificationHost from '../../src/lib/Notification/NotificationHost.svelte';

  let { second = false, ...rest }: { second?: boolean; [key: string]: unknown } = $props();
</script>

<NotificationHost {...rest} />
{#if second}<NotificationHost />{/if}
