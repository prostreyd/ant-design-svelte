<script lang="ts">
  import Popup from '$lib/internal/popup/Popup.svelte';

  let outerOpen = $state(false);
  let innerOpen = $state(false);
  let outerAnchor = $state<HTMLElement | null>(null);
  let innerAnchor = $state<HTMLElement | null>(null);
  let secondOpen = $state(false);
  let secondAnchor = $state<HTMLElement | null>(null);
</script>

<button type="button" data-testid="outer-anchor" bind:this={outerAnchor}>Outer anchor</button>
<button type="button" data-testid="second-anchor" bind:this={secondAnchor}>Second anchor</button>
<button type="button" data-testid="open-outer" onclick={() => (outerOpen = true)}>Open outer</button>
<button type="button" data-testid="open-inner" onclick={() => (innerOpen = true)}>Open inner</button>
<button type="button" data-testid="open-second" onclick={() => (secondOpen = true)}>Open second</button>
<span data-testid="state">{outerOpen}/{innerOpen}/{secondOpen}</span>

<Popup bind:open={outerOpen} anchor={outerAnchor} data-testid="outer-frame">
  <span data-testid="outer-content">Outer content</span>
  <button type="button" data-testid="inner-anchor" bind:this={innerAnchor}>Inner anchor</button>
</Popup>
<Popup bind:open={innerOpen} anchor={innerAnchor} data-testid="inner-frame">
  <span data-testid="inner-content">Inner content</span>
</Popup>
<Popup bind:open={secondOpen} anchor={secondAnchor} data-testid="second-frame">
  <span data-testid="second-content">Second content</span>
</Popup>
