<script lang="ts">
  import { setContext, type Snippet } from 'svelte';
  let { who, children }: { who: string; children: Snippet } = $props();
  // svelte-ignore state_referenced_locally
  setContext('message-test', who);
</script>

{@render children()}
