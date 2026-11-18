<script lang="ts">
  /*
   * The tip of an item of a collapsed menu (specs/menu.md, P9). It is drawn on the popup primitive with the look of the
   * Tooltip, and it is invisible to assistive technology: the label of the item stays in the accessibility tree, so a
   * description that repeats it would be read twice.
   */
  import Popup from '../internal/popup/Popup.svelte';
  import { popupTriggers } from '../internal/popup/triggers.js';
  import { classList, styleText } from '../internal/semantic.js';
  import type { MenuTooltipProps } from './types.js';

  type Props = {
    /** The row of the item: the tip is placed next to it and listens to it. */
    anchor: HTMLElement | null;
    /** The text of the tip; when empty, the text of the label is read from the row. */
    title: string | undefined;
    /** The tip waits for this (the width of the menu is still changing while it is `false`). */
    ready: boolean;
    config: MenuTooltipProps | undefined;
  };

  let { anchor, title, ready, config }: Props = $props();

  let open = $state(false);
  let panel = $state<HTMLElement | null>(null);
  let text = $state('');

  $effect(() => {
    // The row is bound before the effect runs, and goes with the tip.
    const element = anchor as HTMLElement;
    return popupTriggers({
      trigger: ['hover', 'focus'],
      open: () => open,
      setOpen: (next) => {
        if (next) text = title ?? (element.querySelector('.ads-menu-item-content') as HTMLElement).textContent!.trim();
        open = next && text !== '';
      },
      mouseEnterDelay: config?.mouseEnterDelay,
      mouseLeaveDelay: config?.mouseLeaveDelay,
      panel: () => panel,
      disabled: !ready
    })(element);
  });

  // The tip closes when the menu stops being collapsed or starts changing its width.
  $effect(() => {
    if (!ready) open = false;
  });
</script>

<Popup
  bind:open
  bind:panel
  {anchor}
  placement={config?.placement ?? 'right'}
  arrow={config?.arrow ?? true}
  autoAdjustOverflow={config?.autoAdjustOverflow ?? true}
  zIndex={config?.zIndex}
  layer="tooltip"
  aria-hidden="true"
  style="--ads-popup-arrow-bg: var(--ads-tooltip-bg)"
  rootClass={config?.classNames?.root}
  rootStyle={config?.styles?.root}
  arrowClass={config?.classNames?.arrow}
  arrowStyle={config?.styles?.arrow}
>
  <div class={classList('ads-menu-tip', config?.classNames?.container)} style={styleText(config?.styles?.container)}>
    {text}
  </div>
</Popup>

<style>
  .ads-menu-tip {
    box-sizing: border-box;
    min-height: var(--ads-tooltip-min-height);
    max-width: var(--ads-tooltip-max-width);
    padding: var(--ads-tooltip-padding);
    border-radius: min(var(--ads-tooltip-radius), 8px);
    color: var(--ads-tooltip-color);
    background: var(--ads-tooltip-bg);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: 1.5714285714285714;
    text-align: start;
    overflow-wrap: break-word;
  }

  @media (forced-colors: active) {
    .ads-menu-tip {
      border: 1px solid CanvasText;
    }
  }
</style>
