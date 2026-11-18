<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getMenuRegistry, getParentRegistration, setParentRegistration, type SubMenuRegistration } from './context.js';
  import type { MenuSubMenuProps } from './types.js';

  let {
    key,
    label = undefined,
    icon = undefined,
    disabled = undefined,
    popupClassName = undefined,
    popupOffset = undefined,
    theme = undefined,
    ontitleclick = undefined,
    popupRender = undefined,
    class: customClass = undefined,
    children = undefined
  }: MenuSubMenuProps = $props();

  let node: HTMLElement | undefined = $state();
  const menu = getMenuRegistry();

  if (!menu) {
    if (!isProduction()) throw new Error('MenuSubMenu must be written inside a Menu.');
  } else {
    const registration: SubMenuRegistration = {
      kind: 'submenu',
      node: () => node ?? null,
      parent: getParentRegistration(),
      props: () => ({ key, label, icon, disabled, popupClassName, popupOffset, theme, ontitleclick, popupRender, class: customClass })
    };
    // What is written inside reads it as its parent. The submenu is registered before those are created.
    setParentRegistration(registration);
    const remove = menu.register(registration);
    onDestroy(remove);
  }
</script>

<!-- The submenu draws nothing where it is written (see MenuItem); what is written inside follows the marker. -->
<span hidden bind:this={node}></span>
{@render children?.()}
