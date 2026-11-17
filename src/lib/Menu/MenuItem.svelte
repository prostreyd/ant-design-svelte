<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getMenuRegistry, getParentRegistration } from './context.js';
  import type { MenuItemProps } from './types.js';

  let {
    key,
    label = undefined,
    icon = undefined,
    title = undefined,
    extra = undefined,
    disabled = undefined,
    danger = undefined,
    class: customClass = undefined,
    children = undefined
  }: MenuItemProps = $props();

  let node: HTMLElement | undefined = $state();
  const menu = getMenuRegistry();

  if (!menu) {
    if (!isProduction()) throw new Error('MenuItem must be written inside a Menu.');
  } else {
    // Registered while the component is created (not in an effect), so a server render has the items too.
    const remove = menu.register({
      kind: 'item',
      node: () => node ?? null,
      parent: getParentRegistration(),
      props: () => ({ key, label, icon, title, extra, disabled, danger, class: customClass, children })
    });
    onDestroy(remove);
  }
</script>

<!--
  The item draws nothing where it is written: the Menu draws it in its list. This empty element only marks the place in the
  markup, so that the Menu can put the items in the order they were written.
-->
<span hidden bind:this={node}></span>
