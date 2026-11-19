<script lang="ts">
  import { getContext } from 'svelte';
  const who = getContext<string | undefined>('modal-test') ?? 'nobody';
</script>

<span data-testid="context">{who}</span>
