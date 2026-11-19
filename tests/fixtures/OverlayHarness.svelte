<script lang="ts">
  import { openOverlay } from '../../src/lib/internal/overlay/overlay.js';
  import { portal, resolveContainer, type PortalContainer } from '../../src/lib/internal/portal/portal.svelte.js';

  /**
   * The composition a Modal makes: a layer (a mask and a box) that the portal moves into the body and `openOverlay` makes
   * modal while it is open. `seen` says where the layer was when `openOverlay` was called.
   */
  let {
    open = true,
    container,
    seen,
    ondismiss
  }: {
    open?: boolean;
    container?: PortalContainer;
    seen?: { parent: Element | null; inert: boolean };
    ondismiss?: () => void;
  } = $props();

  let wrap = $state<HTMLElement | null>(null);
  let box = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!open || !wrap || !box) return;
    if (seen) {
      seen.parent = wrap.parentElement;
      seen.inert = document.getElementById('app')?.hasAttribute('inert') ?? false;
    }
    return openOverlay({ root: box, scope: wrap, dismiss: () => ondismiss?.() });
  });
</script>

<main id="app"><button id="trigger" type="button">Open</button></main>

{#if open}
  <div id="wrap" bind:this={wrap} {@attach portal(() => resolveContainer(container))}>
    <div id="mask"></div>
    <div id="box" role="dialog" aria-modal="true" aria-label="Layer" tabindex="-1" bind:this={box}>
      <button id="ok" type="button">OK</button>
      <button id="cancel" type="button">Cancel</button>
    </div>
  </div>
{/if}
