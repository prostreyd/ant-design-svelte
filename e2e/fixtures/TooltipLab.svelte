<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Checkbox, Switch, Tooltip, type TooltipPlacement, type TooltipTrigger } from '$lib';

  // The lab of the Tooltip (specs/tooltip.md). `window.__tooltipLab.set(patch)` changes the state of the page.
  let state = $state({
    open: false,
    placement: 'top' as TooltipPlacement,
    arrow: true as boolean | { pointAtCenter: boolean },
    title: 'Prompt text',
    color: undefined as string | undefined,
    trigger: ['hover', 'focus'] as TooltipTrigger[],
    rtl: false,
    edgeOpen: false,
    classNames: undefined as undefined | { root?: string; container?: string; arrow?: string },
    styles: undefined as undefined | { root?: Record<string, string>; container?: Record<string, string>; arrow?: Record<string, string> },
    container: undefined as HTMLElement | undefined,
    zIndex: undefined as number | undefined,
    destroyOnHidden: false,
    anchorOpen: false,
    boxChecked: false
  });
  let anchorTarget = $state<HTMLElement | null>(null);

  onMount(() => {
    (window as unknown as { __tooltipLab: unknown }).__tooltipLab = {
      set(patch: Partial<typeof state>) {
        Object.assign(state, patch);
      },
      setContainer(id: string | null) {
        state.container = id ? (document.getElementById(id) ?? undefined) : undefined;
      }
    };
  });
</script>

<main dir={state.rtl ? 'rtl' : 'ltr'} style="padding: 140px 120px 60px; display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap">
  <Tooltip
    bind:open={state.open}
    title={state.title}
    placement={state.placement}
    arrow={state.arrow}
    color={state.color}
    trigger={state.trigger}
    classNames={state.classNames}
    styles={state.styles}
    container={state.container}
    zIndex={state.zIndex}
    destroyOnHidden={state.destroyOnHidden}
  >
    <Button data-testid="main">Short</Button>
  </Tooltip>
  <Button data-testid="neighbor">Neighbor</Button>
  <Tooltip title="Wide trigger tip">
    <Button data-testid="wide">A much wider trigger button</Button>
  </Tooltip>
  <Button data-testid="neighbor2">Next</Button>

  <Tooltip title="Disabled tip">
    <Button data-testid="disabled" disabled>Disabled</Button>
  </Tooltip>
  <Tooltip title="Checkbox tip">
    <Checkbox data-testid="box" bind:checked={state.boxChecked}>Agree with the terms</Checkbox>
  </Tooltip>
  <Tooltip title="Switch tip">
    <Switch aria-label="Switch" data-testid="switch" />
  </Tooltip>
  <Tooltip title="Click tip" trigger="click">
    <Button data-testid="click">Click</Button>
  </Tooltip>
  <Tooltip title="A long tip: the text of a tooltip wraps at the maximum width of 250 pixels, and Supercalifragilisticexpialidocious-is-a-word-that-breaks">
    <Button data-testid="long">Long</Button>
  </Tooltip>
  <Tooltip title="Description" trigger={['hover', 'focus']}>
    <button type="button" data-testid="described" aria-describedby="note">Has a note</button>
  </Tooltip>
  <span id="note" hidden>Existing description</span>

  <button type="button" data-testid="anchor-target" bind:this={anchorTarget}>Anchor target</button>
  <Tooltip title="Anchored elsewhere" anchor={anchorTarget} open={state.anchorOpen} trigger={[]} />

  <div id="host" data-testid="host" style="position: relative; width: 160px; height: 40px; border: 1px dashed #999"></div>
</main>

<!-- Room to scroll: the touch tests swipe the page. -->
<div style="height: 1400px"></div>

<div style="position: fixed; top: 6px; left: 50%">
  <Tooltip title="Edge tip" open={state.edgeOpen} trigger={[]}>
    <Button data-testid="edge">Edge</Button>
  </Tooltip>
</div>
