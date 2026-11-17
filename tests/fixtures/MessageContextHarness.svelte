<script lang="ts">
  import { message } from '../../src/lib/Message/message';
  import MessageHost from '../../src/lib/Message/MessageHost.svelte';
  import MessageContextProvider from './MessageContextProvider.svelte';
  import MessageContextReader from './MessageContextReader.svelte';

  let { withHost = true }: { withHost?: boolean } = $props();
</script>

{#snippet reader()}<MessageContextReader />{/snippet}

<MessageContextProvider who="harness">
  <button data-testid="open" onclick={() => message.info(reader, 0)}>open</button>
</MessageContextProvider>

{#if withHost}
  <MessageContextProvider who="host">
    <MessageHost />
  </MessageContextProvider>
{/if}
