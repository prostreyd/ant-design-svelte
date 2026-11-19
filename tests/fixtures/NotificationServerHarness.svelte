<script lang="ts">
  import { notification } from '../../src/lib/Notification/notification';
  import NotificationHost from '../../src/lib/Notification/NotificationHost.svelte';
  import { getSnapshot } from '../../src/lib/Notification/store';

  // Rendered on a server: the call must be a no-op that stores nothing, and the host must render nothing.
  const handle = notification.success({ title: 'Saved' });
  const kind = typeof handle;
  const stored = getSnapshot().records.length;
  const hosts = getSnapshot().activeHost === undefined ? 'no-host' : 'host';
</script>

<p>{kind}|{stored}|{hosts}</p>
<NotificationHost top={4} />
