<script lang="ts">
  import DocShell from '#docs/components/DocShell.svelte';

  let { children } = $props();
</script>

<DocShell section="components">{@render children()}</DocShell>
