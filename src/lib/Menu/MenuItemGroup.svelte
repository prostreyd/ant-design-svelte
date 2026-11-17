<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getMenuRegistry, getParentRegistration, setParentRegistration, type GroupRegistration } from './context.js';
  import type { MenuItemGroupProps } from './types.js';

  let { label = undefined, class: customClass = undefined, children = undefined }: MenuItemGroupProps = $props();

  let node: HTMLElement | undefined = $state();
  const menu = getMenuRegistry();

  if (!menu) {
    if (!isProduction()) throw new Error('MenuItemGroup must be written inside a Menu.');
  } else {
    const registration: GroupRegistration = {
      kind: 'group',
      node: () => node ?? null,
      parent: getParentRegistration(),
      props: () => ({ label, class: customClass })
    };
    setParentRegistration(registration);
    const remove = menu.register(registration);
    onDestroy(remove);
  }
</script>

<!-- The group draws nothing where it is written (see MenuItem); its items follow the marker. -->
<span hidden bind:this={node}></span>
{@render children?.()}
