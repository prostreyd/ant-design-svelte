<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Popup from '$lib/internal/popup/Popup.svelte';

  interface Props extends Omit<ComponentProps<typeof Popup>, 'anchor' | 'children' | 'panel'> {
    /** `false`: the popup gets a `null` anchor. */
    withAnchor?: boolean;
    /** A point anchor instead of the button. */
    point?: { x: number; y: number };
    /** The anchor button lays out right to left. */
    rtl?: boolean;
    /** `veto`: a function binding that never accepts a change of `open` (a fully controlled popup). */
    mode?: 'bind' | 'veto' | 'empty';
    /** A second container: the button `swap-container` switches to it while the popup is open. */
    swapTo?: HTMLElement;
  }

  let { open = $bindable(false), withAnchor = $bindable(true), point, rtl = false, mode = 'bind', swapTo, container, ...rest }: Props = $props();
  let swapped = $state(false);
  let toPoint = $state(false);

  let anchorElement = $state<HTMLElement | null>(null);
  let panel = $state<HTMLElement | null>(null);
  const anchor = $derived(toPoint ? { x: 1, y: 2 } : (point ?? (withAnchor ? anchorElement : null)));
</script>

<button type="button" data-testid="anchor" style={rtl ? 'direction: rtl' : undefined} bind:this={anchorElement}>Anchor</button>
<button type="button" data-testid="toggle" onclick={() => (open = !open)}>Toggle</button>
<button type="button" data-testid="remove-anchor" onclick={() => (withAnchor = false)}>Remove anchor</button>
<button type="button" data-testid="swap-container" onclick={() => (swapped = true)}>Swap container</button>
<button type="button" data-testid="to-point" onclick={() => (toPoint = true)}>Use a point</button>
<span data-testid="parent-open">{String(open)}</span>
<span data-testid="has-panel">{panel ? 'yes' : 'no'}</span>
{#if mode === 'empty'}
  <Popup bind:open {anchor} bind:panel {...rest} />
{:else if mode === 'veto'}
  <Popup bind:open={() => open, () => {}} {anchor} bind:panel {...rest}>
    <span data-testid="content">Content</span>
  </Popup>
{:else}
  <Popup bind:open {anchor} bind:panel container={swapped ? swapTo : container} {...rest}>
    <span data-testid="content">Content</span>
    <input data-testid="field" aria-label="Field" />
  </Popup>
{/if}
