<script lang="ts">
  import { Breakpoints } from '../../src/lib/Grid/Breakpoints.js';
  import type { Breakpoint } from '../../src/lib/Grid/types.js';

  let { fallback }: { fallback?: Breakpoint } = $props();
  // The harness reads the prop once, when it is made: a fallback is a constructor option.
  // svelte-ignore state_referenced_locally
  const screens = new Breakpoints({ fallback });
</script>

<output data-testid="current">{screens.current}</output>
<output data-testid="flags">{(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const).filter((name) => screens[name]).join(' ')}</output>
