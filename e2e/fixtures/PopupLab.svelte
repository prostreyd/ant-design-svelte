<script lang="ts">
  // A lab for the popup primitive (specs/popup.md). Tests drive it through `window.__popupLab.set({...})`,
  // so every case is a patch of one state object. Opened at `/#popup`.
  import Popup from '$lib/internal/popup/Popup.svelte';
  import type { PopupArrow, PopupLayer, PopupPlacement } from '$lib/internal/popup/types';

  const initial = {
    open: false,
    placement: 'bottomLeft' as PopupPlacement,
    arrow: false as PopupArrow,
    matchWidth: false as boolean | number,
    autoAdjustOverflow: true,
    offset: undefined as number | undefined,
    layer: 'dropdown' as PopupLayer,
    zIndex: undefined as number | undefined,
    anchorLeft: 500,
    anchorTop: 300,
    anchorWidth: 100,
    anchorHeight: 40,
    panelWidth: 200,
    panelHeight: 100,
    rtl: false,
    preventBlur: false,
    destroyOnHidden: false,
    container: 'body' as 'body' | 'scroller' | 'shifted',
    secondOpen: false,
    secondLayer: 'tooltip' as PopupLayer,
    flowOpen: false,
    flowAnchorWidth: 60,
    innerOpen: false,
    outerOpen: false,
    nestedInnerOpen: false
  };

  let cfg = $state({ ...initial });
  let anchor = $state<HTMLElement | null>(null);
  let scroller = $state<HTMLElement | null>(null);
  let shifted = $state<HTMLElement | null>(null);
  let flowAnchor = $state<HTMLElement | null>(null);
  let innerAnchor = $state<HTMLElement | null>(null);
  let nestedAnchor = $state<HTMLElement | null>(null);
  let nestedInnerAnchor = $state<HTMLElement | null>(null);

  (window as unknown as { __popupLab: unknown }).__popupLab = {
    set(patch: Partial<typeof initial>) {
      Object.assign(cfg, patch);
    },
    reset() {
      Object.assign(cfg, initial);
    }
  };
</script>

<div class="lab" dir={cfg.rtl ? 'rtl' : 'ltr'}>
  <button
    type="button"
    data-testid="anchor"
    style="position: fixed; z-index: 1; left: {cfg.anchorLeft}px; top: {cfg.anchorTop}px; width: {cfg.anchorWidth}px; height: {cfg.anchorHeight}px; margin: 0; padding: 0"
    bind:this={anchor}>Anchor</button
  >

  <!-- A tall page, so the page itself can scroll under an open popup. -->
  <div style="position: relative; height: 2400px; width: 100%">
    <div style="position: absolute; top: 1000px; left: 300px; display: flex; gap: 8px">
      <button type="button" data-testid="neighbor-before">Before</button>
      <button type="button" data-testid="flow-anchor" style="width: {cfg.flowAnchorWidth}px" bind:this={flowAnchor}>F</button>
      <button type="button" data-testid="neighbor-after">After</button>
    </div>
  </div>

  <!-- A scroll container: the popup must follow its scrolling and must not be clipped by it. -->
  <div
    data-testid="scroller"
    style="position: fixed; z-index: 1; left: 20px; top: 400px; width: 300px; height: 200px; overflow: auto; border: 1px solid #888; background: #eef"
    bind:this={scroller}
  >
    <div style="height: 800px; padding-top: 60px">
      <button type="button" data-testid="inner-anchor" bind:this={innerAnchor}>Inner</button>
    </div>
  </div>

  <!-- A container with a transform: it is the containing block of everything inside it, fixed or not. -->
  <div data-testid="shifted" style="position: absolute; left: 0; top: 0; width: 10px; height: 10px; transform: translate(37px, 29px)" bind:this={shifted}></div>

  <button type="button" data-testid="nested-anchor" style="position: fixed; z-index: 1; left: 700px; top: 500px" bind:this={nestedAnchor}>Nested</button>
  <button type="button" data-testid="field" style="position: fixed; z-index: 1; left: 700px; top: 600px">Field</button>
</div>

<Popup
  bind:open={cfg.open}
  {anchor}
  placement={cfg.placement}
  arrow={cfg.arrow}
  matchWidth={cfg.matchWidth}
  autoAdjustOverflow={cfg.autoAdjustOverflow}
  offset={cfg.offset}
  layer={cfg.layer}
  zIndex={cfg.zIndex}
  preventBlur={cfg.preventBlur}
  destroyOnHidden={cfg.destroyOnHidden}
  container={cfg.container === 'scroller' ? (scroller ?? undefined) : cfg.container === 'shifted' ? (shifted ?? undefined) : undefined}
  class="lab-frame"
  data-testid="frame"
>
  <div data-testid="content" style="width: {cfg.panelWidth}px; height: {cfg.panelHeight}px">Panel</div>
</Popup>

<Popup
  bind:open={cfg.secondOpen}
  {anchor}
  placement={cfg.placement}
  layer={cfg.secondLayer}
  class="lab-frame lab-frame-2"
  data-testid="second-frame"
>
  <div data-testid="second-content" style="width: {cfg.panelWidth}px; height: {cfg.panelHeight}px">Second</div>
</Popup>

<Popup bind:open={cfg.flowOpen} anchor={flowAnchor} placement="bottom" class="lab-frame" data-testid="flow-frame">
  <div data-testid="flow-content" style="width: 160px; height: 60px">Flow</div>
</Popup>

<Popup bind:open={cfg.innerOpen} anchor={innerAnchor} placement="bottom" class="lab-frame" data-testid="inner-frame">
  <div data-testid="inner-content" style="width: 200px; height: {cfg.panelHeight}px">Inner</div>
</Popup>

<Popup bind:open={cfg.outerOpen} anchor={nestedAnchor} placement="bottomLeft" class="lab-frame" data-testid="outer-frame">
  <div data-testid="outer-content" style="width: 220px; height: 120px; padding: 8px">
    Outer
    <button type="button" data-testid="nested-inner-anchor" onclick={() => (cfg.nestedInnerOpen = true)} bind:this={nestedInnerAnchor}>Open inner</button>
  </div>
</Popup>

<Popup bind:open={cfg.nestedInnerOpen} anchor={nestedInnerAnchor} placement="bottomLeft" class="lab-frame" data-testid="nested-inner-frame">
  <div data-testid="nested-inner-content" style="width: 120px; height: 60px">Nested inner</div>
</Popup>

<style>
  :global(body) {
    margin: 0;
  }
  :global(.lab-frame) {
    background: #fff;
    border: 1px solid #888;
    box-sizing: border-box;
    --ads-popup-arrow-bg: #fff;
  }
  :global(.lab-frame-2) {
    background: #fcc;
  }
</style>
