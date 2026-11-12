<script lang="ts">
  import { onDestroy } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { getSelectContext, setGroupContext, type GroupRegistration } from './context.js';
  import type { SelectOptGroupProps } from './types.js';

  let { label, title = undefined, class: customClass = undefined, children }: SelectOptGroupProps = $props();

  let node: HTMLElement | undefined = $state();
  const select = getSelectContext();

  if (!select) {
    if (!isProduction()) throw new Error('SelectOptGroup must be written inside a Select.');
  } else {
    const registration: GroupRegistration = {
      kind: 'group',
      node: () => node ?? null,
      props: () => ({ label, title, class: customClass })
    };
    // The options inside read it as their group. The group is registered before they are created.
    setGroupContext(registration);
    const remove = select.register(registration);
    onDestroy(remove);
  }
</script>

<!-- The group draws nothing where it is written (see SelectOption); its options follow the marker. -->
<span hidden bind:this={node}></span>
{@render children()}
