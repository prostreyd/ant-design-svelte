<script lang="ts">
  import { onMount } from 'svelte';
  import OverlayLayer from './OverlayLayer.svelte';

  // The lab of the overlay primitives (specs/overlay.md). A long page with a scrollbar and a few things to click and
  // to tab to, and two layers: `a` (with a Select) and `b`, which `a` opens over itself. `window.__overlayLab` is for the tests.
  let open = $state({ a: false, b: false });
  let dismissed = $state<string[]>([]);
  let clicks = $state(0);

  function dismiss(id: string): void {
    dismissed.push(id);
    open[id as 'a' | 'b'] = false;
  }

  onMount(() => {
    (window as unknown as { __overlayLab: unknown }).__overlayLab = {
      open: (id: 'a' | 'b') => (open[id] = true),
      close: (id: 'a' | 'b') => (open[id] = false),
      dismissed: () => [...dismissed],
      clicks: () => clicks
    };
  });
</script>

<!-- A page that always has a scrollbar, a classic one, so that the lock has something to compensate for. -->
<svelte:head>
  <style>
    html { overflow-y: scroll; }
    ::-webkit-scrollbar { width: 15px; }
    ::-webkit-scrollbar-thumb { background: #888; }
  </style>
</svelte:head>

<main data-testid="page" style="padding: 24px; min-height: 2400px">
  <h1>Overlay lab</h1>
  <div data-testid="marker" style="width: 100%; height: 24px; background: #ccd"></div>
  <p>
    <button type="button" data-testid="open-a" onclick={() => (open.a = true)}>Open A</button>
    <button type="button" data-testid="page-button" onclick={() => clicks++}>Page button</button>
    <input data-testid="page-input" aria-label="Page input" />
    <span data-testid="clicks">{clicks}</span>
  </p>
</main>

{#if open.a}<OverlayLayer id="a" ondismiss={dismiss} onopen={(id) => (open[id as 'b'] = true)} />{/if}
{#if open.b}<OverlayLayer id="b" ondismiss={dismiss} />{/if}
