<script lang="ts">
  import { untrack, type ComponentProps } from 'svelte';
  import Menu from '$lib/Menu/Menu.svelte';

  // A menu whose collapsing and open keys are state of the parent, changed by a button (a rerender of the test library puts the
  // first props back, so it cannot show what a menu remembers).
  type Props = Omit<ComponentProps<typeof Menu>, 'inlineCollapsed' | 'mode'> & { startCollapsed?: boolean };

  let { startCollapsed = false, openKeys: startOpen = [], ...rest }: Props = $props();
  let collapsed = $state(untrack(() => startCollapsed));
  let openKeys = $state(untrack(() => [...startOpen]));
</script>

<button type="button" data-testid="toggle" onclick={() => (collapsed = !collapsed)}>Toggle</button>
<Menu mode="inline" {...rest} inlineCollapsed={collapsed} bind:openKeys />
<span data-testid="open">{openKeys.join('>')}</span>
