<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getMenuRegistry, getParentRegistration } from './context.js';
  import type { MenuDividerProps } from './types.js';

  let { dashed = undefined }: MenuDividerProps = $props();

  let node: HTMLElement | undefined = $state();
  const menu = getMenuRegistry();

  if (!menu) {
    if (!isProduction()) throw new Error('MenuDivider must be written inside a Menu.');
  } else {
    const remove = menu.register({
      kind: 'divider',
      node: () => node ?? null,
      parent: getParentRegistration(),
      props: () => ({ dashed })
    });
    onDestroy(remove);
  }
</script>

<!-- The divider draws nothing where it is written (see MenuItem). -->
<span hidden bind:this={node}></span>
