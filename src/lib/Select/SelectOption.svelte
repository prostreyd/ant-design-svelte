<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getGroupContext, getSelectContext } from './context.js';
  import type { SelectOptionProps } from './types.js';

  let {
    value,
    label = undefined,
    disabled = undefined,
    title = undefined,
    class: customClass = undefined,
    children = undefined
  }: SelectOptionProps = $props();

  let node: HTMLElement | undefined = $state();
  const select = getSelectContext();

  if (!select) {
    if (!isProduction()) throw new Error('SelectOption must be written inside a Select.');
  } else {
    // Registered while the component is created (not in an effect), so a server render has the options too.
    const remove = select.register({
      kind: 'option',
      node: () => node ?? null,
      group: getGroupContext(),
      props: () => ({ value, label, disabled, title, class: customClass, children })
    });
    onDestroy(remove);
  }
</script>

<!--
  The option draws nothing where it is written: the Select draws it in its list. This empty element only
  marks the place in the markup, so that the Select can put the options in the order they were written.
-->
<span hidden bind:this={node}></span>
