<script lang="ts">
  import Popup from '$lib/internal/popup/Popup.svelte';
  import Tooltip from '$lib/Tooltip/Tooltip.svelte';

  let open = $state(true);
  let tipOpen = $state(false);
  let anchor = $state<HTMLElement | null>(null);
</script>

<button type="button" data-testid="outer-anchor" bind:this={anchor}>Anchor</button>
<button type="button" data-testid="outside">Outside</button>
<span data-testid="outer-open">{String(open)}</span>
<span data-testid="tip-open">{String(tipOpen)}</span>

<Popup bind:open {anchor} layer="dropdown">
  <Tooltip bind:open={tipOpen} title="Inner tip" trigger="click">
    <button type="button" data-testid="inner">Inner</button>
  </Tooltip>
</Popup>
