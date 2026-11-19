<script lang="ts">
  import { notification } from '../../src/lib/Notification/notification';
  import NotificationHost from '../../src/lib/Notification/NotificationHost.svelte';
  import MessageContextProvider from './MessageContextProvider.svelte';
  import MessageContextReader from './MessageContextReader.svelte';
</script>

{#snippet reader()}<MessageContextReader />{/snippet}

<MessageContextProvider who="harness">
  <button data-testid="open" onclick={() => notification.info({ title: reader, duration: 0 })}>open</button>
</MessageContextProvider>

<MessageContextProvider who="host">
  <NotificationHost />
</MessageContextProvider>
