<script lang="ts">
  import MessageHost from '../../src/lib/Message/MessageHost.svelte';

  let { second = false, ...rest }: { second?: boolean; [key: string]: unknown } = $props();
</script>

<MessageHost {...rest} />
{#if second}<MessageHost />{/if}
