<script lang="ts">
  import ModalHost from '../../src/lib/Modal/ModalHost.svelte';
  import { modal } from '../../src/lib/Modal/modal';
  import ModalContextProvider from './ModalContextProvider.svelte';
  import ModalContextReader from './ModalContextReader.svelte';

  let { withHost = true }: { withHost?: boolean } = $props();
</script>

{#snippet reader()}<ModalContextReader />{/snippet}

<ModalContextProvider who="harness">
  <button data-testid="open" onclick={() => modal.info({ title: 'Context', content: reader })}>open</button>
</ModalContextProvider>

{#if withHost}
  <ModalContextProvider who="host">
    <ModalHost />
  </ModalContextProvider>
{/if}
