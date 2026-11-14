<script lang="ts">
  import type { Snippet } from 'svelte';
  import { contrastText } from '../internal/contrast.js';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';
  import Popup from '../internal/popup/Popup.svelte';
  import { popupTriggers } from '../internal/popup/triggers.js';
  import { POPUP_PLACEMENTS } from '../internal/popup/types.js';
  import { classList, styleText } from '../internal/semantic.js';
  import {
    TOOLTIP_PRESET_COLORS,
    type TooltipArrow,
    type TooltipClassNames,
    type TooltipContainer,
    type TooltipPlacement,
    type TooltipPresetColor,
    type TooltipStyles,
    type TooltipTrigger
  } from './types.js';

  type TooltipProps = {
    /**
     * The text or the content of the tip. Empty (`undefined`, `null`, `''`) means no tooltip: it never opens, even when
     * `open` is `true`. `0` is shown.
     */
    title?: string | number | Snippet | null;
    /** The trigger: one element. The tooltip is placed next to it and listens to it. */
    children?: Snippet;
    /** Whether the tooltip is shown. `bind:open` for two-way use; a plain `open={x}` is the initial value. */
    open?: boolean;
    /** Called once per change caused by the user (trigger, Escape, outside press), not for a change made by the parent. */
    onopenchange?: (open: boolean) => void;
    /** Preferred placement. Mirrored in right-to-left layouts, flipped at the edge of the screen. */
    placement?: TooltipPlacement;
    /** What opens it: one value or several. An empty array means it is only controlled. Default hover and focus. */
    trigger?: TooltipTrigger | readonly TooltipTrigger[];
    /** Delay before it shows on hover, in seconds. */
    mouseEnterDelay?: number;
    /** Delay before it hides after the pointer left, in seconds. The pointer may rest in the panel. */
    mouseLeaveDelay?: number;
    /** Shows an arrow. `{ pointAtCenter: true }` points it at the middle of the trigger. */
    arrow?: TooltipArrow;
    /** Flip to the opposite side when there is no room, and shift along the edge for an unaligned placement. */
    autoAdjustOverflow?: boolean;
    /** One of the 13 preset names, or any CSS color for the background. The text color follows. */
    color?: string;
    /** Overrides the z-index of the tooltip layer. */
    zIndex?: number;
    /** Where the panel is moved to. Default `document.body`. */
    container?: TooltipContainer;
    /** Remove the content from the DOM on every close. Default: it stays mounted after the first opening. */
    destroyOnHidden?: boolean;
    /** Extra classes for the `root`, `container` and `arrow` parts. */
    classNames?: TooltipClassNames;
    /** Inline styles for the `root`, `container` and `arrow` parts. */
    styles?: TooltipStyles;
    /** The element to place the tooltip next to, instead of the first element of `children`. */
    anchor?: HTMLElement | null;
  };

  const uid = $props.id();

  let {
    title,
    children,
    open = $bindable(false),
    onopenchange,
    placement = 'top',
    trigger = ['hover', 'focus'],
    mouseEnterDelay = 0.1,
    mouseLeaveDelay = 0.1,
    arrow = true,
    autoAdjustOverflow = true,
    color,
    zIndex,
    container,
    destroyOnHidden = false,
    classNames,
    styles,
    anchor
  }: TooltipProps = $props();

  const TRIGGERS = ['hover', 'focus', 'click', 'contextMenu'] as const;
  const panelId = $derived(`ads-tooltip-${uid}`);

  /** The panel (the positioned root of the popup), once it has been created by the first opening. */
  let panel = $state<HTMLElement | null>(null);
  /** The first element inside the wrapper: what the tooltip is placed next to, unless `anchor` is given. */
  let firstElement = $state<HTMLElement | null>(null);

  const resolvedPlacement = $derived(
    resolveOption('Tooltip', 'placement', placement, POPUP_PLACEMENTS, 'top') as TooltipPlacement
  );
  const triggers = $derived(
    (Array.isArray(trigger) ? [...trigger] : [trigger]).map((value) =>
      resolveOption('Tooltip', 'trigger', value, TRIGGERS, 'hover')
    )
  );

  const hasTitle = $derived(title !== undefined && title !== null && title !== '');
  const anchorElement = $derived(anchor ?? firstElement);
  /** Open, and there is something to show. A parent that sets `open` with an empty title gets no panel. */
  const popupOpen = $derived(open && hasTitle);

  /** Changes the open state on behalf of the user. The parent may refuse (a function binding). */
  function setOpen(next: boolean): void {
    if (open === next) return;
    open = next;
    onopenchange?.(next);
  }

  // Follows the first element of the wrapper while it changes (an `{#if}` swaps the child, a list re-renders).
  function track(node: HTMLElement): () => void {
    const read = () => {
      firstElement = node.firstElementChild instanceof HTMLElement ? node.firstElementChild : null;
      if (!firstElement && !isProduction() && node.textContent?.trim()) {
        console.warn('Tooltip: the child must be one element; a text-only child cannot be a trigger.');
      }
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, { childList: true });
    return () => observer.disconnect();
  }

  // What can take focus. The description belongs to the element that does: a `Checkbox` is a label with an input inside,
  // and a screen reader reads the description of the input, not the one of the label around it.
  const FOCUSABLE =
    'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable=""], [contenteditable="true"]';

  // `aria-describedby` on the trigger only while the panel exists: a reference to an id that is not on the page is
  // what accessibility scanners report. The trigger is the first element, or the first focusable element inside it;
  // a trigger with nothing to focus (a plain `<span>`) gets it itself. A value the consumer already set is kept, and a
  // rewrite of the attribute by the consumer's own markup is repaired.
  $effect(() => {
    const anchorTarget = anchorElement;
    if (!popupOpen || panel === null || anchorTarget === null) return;
    const target = anchorTarget.matches(FOCUSABLE) ? anchorTarget : (anchorTarget.querySelector<HTMLElement>(FOCUSABLE) ?? anchorTarget);
    const id = panelId;
    const tokens = () => (target.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const add = () => {
      const list = tokens();
      if (!list.includes(id)) target.setAttribute('aria-describedby', [...list, id].join(' '));
    };
    add();
    const observer = new MutationObserver(add);
    observer.observe(target, { attributes: true, attributeFilter: ['aria-describedby'] });
    return () => {
      observer.disconnect();
      const rest = tokens().filter((token) => token !== id);
      if (rest.length > 0) target.setAttribute('aria-describedby', rest.join(' '));
      else target.removeAttribute('aria-describedby');
    };
  });

  const preset = $derived(
    color !== undefined && (TOOLTIP_PRESET_COLORS as readonly string[]).includes(color) ? (color as TooltipPresetColor) : null
  );
  /** A color that is not a preset, and that the browser understands. Anything else leaves the default box. */
  const custom = $derived(
    color && preset === null && typeof CSS !== 'undefined' && CSS.supports('color', color) ? color : null
  );

  // The text of a custom color: black or white, whichever contrasts more, read from the color the browser resolved
  // on the visible box (so `rgb()`, `hsl()` and `var(--x)` all work). A preset has its text in a token.
  let boxElement = $state<HTMLElement | null>(null);
  // An effect, not a derived value: the color has to be read from the DOM after the box has been painted with it.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let customText = $state<string | null>(null);
  $effect(() => {
    customText = boxElement === null || custom === null ? null : contrastText(getComputedStyle(boxElement).backgroundColor);
  });

  const colorStyle = $derived(
    preset !== null
      ? `--ads-tooltip-bg: var(--ads-tooltip-preset-${preset}); --ads-tooltip-color: var(--ads-tooltip-preset-${preset}-text)`
      : custom !== null
        ? `--ads-tooltip-bg: ${custom}${customText ? `; --ads-tooltip-color: ${customText}` : ''}`
        : undefined
  );
  // The arrow takes the background of the box, so a color or a token set on the tooltip colors both.
  const frameStyle = $derived(styleText('--ads-popup-arrow-bg: var(--ads-tooltip-bg)', colorStyle));
  const containerClass = $derived(
    classList('ads-tooltip', preset !== null && `ads-tooltip-preset-${preset}`, classNames?.container)
  );
</script>

<span class="ads-tooltip-trigger" {@attach track} {@attach popupTriggers({
    trigger: triggers,
    open: () => open,
    setOpen: (next) => setOpen(next),
    mouseEnterDelay,
    mouseLeaveDelay,
    panel: () => panel,
    disabled: !hasTitle
  })}>{@render children?.()}</span>

<Popup
  bind:open={() => popupOpen, setOpen}
  bind:panel
  anchor={hasTitle ? anchorElement : null}
  placement={resolvedPlacement}
  {autoAdjustOverflow}
  {arrow}
  {container}
  {zIndex}
  {destroyOnHidden}
  layer="tooltip"
  id={panelId}
  role="tooltip"
  style={frameStyle}
  rootClass={classNames?.root}
  rootStyle={styles?.root}
  arrowClass={classNames?.arrow}
  arrowStyle={styles?.arrow}
>
  <div class={containerClass} style={styleText(styles?.container)} bind:this={boxElement}>
    {#if typeof title === 'function'}{@render title()}{:else}{title}{/if}
  </div>
</Popup>

<style>
  /* No box of its own: the child lays out as if the wrapper were not there. */
  .ads-tooltip-trigger {
    display: contents;
  }

  .ads-tooltip {
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
    word-wrap: break-word;
  }

  /* Colors are replaced by the system colors: without a border the box would melt into the page. */
  @media (forced-colors: active) {
    .ads-tooltip {
      border: 1px solid CanvasText;
    }
  }
</style>
