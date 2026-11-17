<script lang="ts">
  import { getContext } from 'svelte';
  const who = getContext<string | undefined>('message-test') ?? 'nobody';
</script>

<span data-testid="context">{who}</span>
