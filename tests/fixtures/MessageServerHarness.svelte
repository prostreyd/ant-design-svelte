<script lang="ts">
  import { message } from '../../src/lib/Message/message';
  import MessageHost from '../../src/lib/Message/MessageHost.svelte';
  import { getSnapshot } from '../../src/lib/Message/store';

  // Rendered on a server: the call must be a no-op that stores nothing, and the host must render nothing.
  const handle = message.success('Saved');
  const kind = typeof handle;
  const stored = getSnapshot().records.length;
  const hosts = getSnapshot().activeHost === undefined ? 'no-host' : 'host';
</script>

<p>{kind}|{stored}|{hosts}</p>
<MessageHost top={4} />
