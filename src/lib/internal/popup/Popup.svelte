<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveOption } from '../options.js';
  import { classList, styleText, type SemanticStyle } from '../semantic.js';
  import { registerLayer } from './layers.js';
  import { computePlacement, type Box } from './placement.js';
  import {
    POPUP_LAYERS,
    POPUP_PLACEMENTS,
    isPopupElement,
    type PopupAnchor,
    type PopupArrow,
    type PopupContainer,
    type PopupDismiss,
    type PopupLayer,
    type PopupPlacement,
    type PopupPoint,
    type PopupSource
  } from './types.js';

  type PopupProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'id' | 'onmousedown'> & {
    /** Whether the panel is shown. Use `bind:open` for two-way use. */
    open?: boolean;
    /** What the panel is placed next to: an element, a point in viewport coordinates, or `null` (renders nothing). */
    anchor?: PopupAnchor;
    /** Preferred placement. Mirrored in right-to-left layouts, flipped at the edge of the screen. */
    placement?: PopupPlacement;
    /** Flip to the opposite side when there is no room, and shift along the edge for an unaligned placement. */
    autoAdjustOverflow?: boolean;
    /** `true`: at least as wide as the anchor. A number: that many px, but never narrower than the anchor. */
    matchWidth?: boolean | number;
    /** Shows an arrow that points at the anchor. */
    arrow?: PopupArrow;
    /** Gap between the anchor and the panel in px. Default 4, or the arrow size plus 2 with an arrow. */
    offset?: number;
    /** Where the panel is moved to. Default `document.body`. */
    container?: PopupContainer;
    /** Layer token: popover 1030, dropdown 1050 (also Select), tooltip 1070. */
    layer?: PopupLayer;
    /** Overrides the z-index of the layer. */
    zIndex?: number;
    /** Called when a dismissal (outside press, Escape) asks to close. Not called for a change made by the parent. */
    onopenchange?: (open: boolean, info: { source: PopupSource }) => void;
    /** What closes the popup by itself. Both default to `true`. */
    dismiss?: PopupDismiss;
    /** Remove the content from the DOM on every close. Default: it stays mounted after the first opening. */
    destroyOnHidden?: boolean;
    /** A press inside the panel does not take focus from the anchor (a field-anchored popup). Inputs inside still work. */
    preventBlur?: boolean;
    /** Called with the placement actually used, after mirroring and flipping, when it changes. */
    onplacement?: (placement: PopupPlacement) => void;
    /** The positioned element of the panel. Read it with `bind:panel`. */
    panel?: HTMLElement | null;
    /** Id of the visible panel (the `frame`). Generated when not given. */
    id?: string;
    /** Extra classes of the frame. */
    class?: string;
    /** Extra classes of the root, the positioned element that holds the frame (Tooltip `classNames.root`). */
    rootClass?: string;
    /** Inline styles of the root, set one property at a time so they never wipe the placement. */
    rootStyle?: SemanticStyle;
    /** Extra classes of the arrow. */
    arrowClass?: string;
    /** Inline style of the arrow. */
    arrowStyle?: SemanticStyle;
    /** Inline style of the frame. */
    style?: string;
    onmousedown?: HTMLAttributes<HTMLDivElement>['onmousedown'];
    children?: Snippet;
  };

  const uid = $props.id();

  let {
    open = $bindable(false),
    anchor = null,
    placement = 'top',
    autoAdjustOverflow = true,
    matchWidth = false,
    arrow = false,
    offset,
    container,
    layer = 'dropdown',
    zIndex,
    onopenchange,
    dismiss,
    destroyOnHidden = false,
    preventBlur = false,
    onplacement,
    panel = $bindable(null),
    id,
    class: customClass,
    style: customStyle,
    rootClass,
    rootStyle,
    arrowClass,
    arrowStyle,
    onmousedown,
    children,
    ...rest
  }: PopupProps = $props();

  const resolvedPlacement = $derived(resolveOption('Popup', 'placement', placement, POPUP_PLACEMENTS, 'top'));
  const resolvedLayer = $derived(resolveOption('Popup', 'layer', layer, POPUP_LAYERS, 'dropdown'));
  const anchorElement = $derived(isPopupElement(anchor) ? anchor : null);
  const arrowOn = $derived(arrow !== false);
  const pointAtCenter = $derived(typeof arrow === 'object' && arrow.pointAtCenter);
  const frameId = $derived(id ?? `ads-popup-${uid}`);
  const panelClass = $derived(classList('ads-popup', `ads-popup-${resolvedLayer}`, rootClass));

  /** The panel exists in the DOM: from the first opening (never on the server), until `destroyOnHidden` removes it. */
  let mounted = $state(false);
  /** The panel is visible: open, or still playing its leave animation. */
  let shown = $state(false);
  let frame = $state<HTMLElement | null>(null);

  let leaveToken = 0;
  let leaveCleanup: (() => void) | null = null;
  let lastPlacement: PopupPlacement | null = null;
  // The translation of the last placement: exactly as computed, and as written (rounded to a device pixel). The
  // panel's rectangle minus the written one is where its containing block starts.
  let exact: { x: number; y: number } | null = null;
  let appliedX = 0;
  let appliedY = 0;

  function cancelLeave(): void {
    leaveToken++;
    leaveCleanup?.();
    leaveCleanup = null;
  }

  function finishLeave(): void {
    cancelLeave();
    shown = false;
    if (destroyOnHidden) mounted = false;
    if (panel) {
      delete panel.dataset.positioned;
      panel.style.transform = '';
    }
    lastPlacement = null;
    exact = null;
    appliedX = 0;
    appliedY = 0;
  }

  /** Plays the leave animation and hides the panel when it ends; at once when there is no animation. */
  function beginLeave(): void {
    cancelLeave();
    const token = leaveToken;
    const element = frame;
    const name = element ? getComputedStyle(element).animationName : 'none';
    if (!element || !name || name === 'none') {
      finishLeave();
      return;
    }
    const done = (event?: Event) => {
      if (token !== leaveToken || (event && event.target !== element)) return;
      finishLeave();
    };
    element.addEventListener('animationend', done);
    element.addEventListener('animationcancel', done);
    const fallback = setTimeout(done, 1000);
    leaveCleanup = () => {
      element.removeEventListener('animationend', done);
      element.removeEventListener('animationcancel', done);
      clearTimeout(fallback);
    };
  }

  // The lifecycle: open shows (and mounts on the first time); close plays the leave animation and hides.
  $effect(() => {
    const wantOpen = open && anchor !== null;
    untrack(() => {
      if (wantOpen) {
        cancelLeave();
        mounted = true;
        shown = true;
      } else if (shown) {
        beginLeave();
      }
    });
  });

  // Nesting, outside press and Escape (R9, R13) are handled by the registry while the popup is open.
  $effect(() => {
    if (!open || !shown) return;
    return registerLayer({
      id: frameId,
      panel: () => panel,
      anchor: () => anchorElement,
      outsidePress: () => dismiss?.outsidePress !== false,
      escape: () => dismiss?.escape !== false,
      dismiss: () => {
        open = false;
        onopenchange?.(false, { source: 'dismiss' });
      }
    });
  });

  function resolveContainer(): HTMLElement {
    const target = typeof container === 'function' ? container(anchorElement) : container;
    return target ?? document.body;
  }

  // Move the panel to its container each time it is shown, and again if the container changes while it is
  // shown. Appending moves the node to the end of its container, so popups of equal z-index stack in the
  // order of opening (R10). The effect runs once before the panel exists, and again when it does.
  let appendedTo: HTMLElement | null = null;
  $effect(() => {
    const element = panel;
    if (!shown) {
      appendedTo = null;
      return;
    }
    if (!element) return;
    const target = resolveContainer();
    if (appendedTo !== target) {
      target.appendChild(element);
      appendedTo = target;
    }
  });

  // Svelte removes only the range of DOM nodes it knows about, and the panel has been moved out of it: without
  // this the panel would stay in the container after the component is gone.
  $effect(() => {
    const element = panel;
    if (!element) return;
    return () => element.remove();
  });

  $effect(() => {
    if (panel) panel.style.zIndex = zIndex === undefined ? '' : String(zIndex);
  });

  // The styles of the root are written one property at a time: a `style` attribute written by Svelte would wipe the
  // transform, the z-index and the sizes that the placement writes on the same element. The ones that left the
  // object are removed again.
  let appliedRootStyle: string[] = [];
  $effect(() => {
    const element = panel;
    if (!element) return;
    const next = Object.entries(rootStyle ?? {}).filter(([, value]) => value !== '' && value !== undefined && value !== null);
    for (const name of appliedRootStyle) if (!next.some(([key]) => key === name)) element.style.removeProperty(name);
    for (const [name, value] of next) element.style.setProperty(name, String(value));
    appliedRootStyle = next.map(([name]) => name);
  });

  function measureAnchor(): Box {
    if (anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
    // The panel exists only for a non-null anchor, so what is left is a point.
    const point = anchor as PopupPoint;
    return { left: point.x, top: point.y, width: 0, height: 0 };
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  /** A transform is not snapped to the pixel grid as a `left` or a `top` is, and text drawn between pixels blurs. */
  const snap = (value: number) => Math.round(value * window.devicePixelRatio) / window.devicePixelRatio;

  /** Writes a `data-` attribute only when it changes: a write of the same value still costs a style recalculation. */
  function setData(element: HTMLElement, name: string, value: string): void {
    if (element.dataset[name] !== value) element.dataset[name] = value;
  }

  /** The anchor stays where it is on the screen when the page scrolls: it is a point, or inside a fixed element. */
  function anchoredToViewport(): boolean {
    for (let node: Element | null = anchorElement; node; node = node.parentElement) {
      if (getComputedStyle(node).position === 'fixed') return true;
    }
    return anchorElement === null;
  }

  /** The height of the arrow in px, for the placement (the shape in the css is a little lower: its tip is rounded). */
  const ARROW_SIZE = 8;

  /**
   * The largest corner radius of the frame or of what is inside it, in px (the box of a Tooltip is inside the frame). The
   * arrow of an aligned placement stands further from the edge when the corner is rounder. A radius in per cent counts as its
   * number, which for a pill pushes the arrow to the middle, where it belongs.
   */
  function cornerRadius(frame: HTMLElement): number {
    let largest = 0;
    for (const element of [frame, ...Array.from(frame.children)]) {
      const style = getComputedStyle(element);
      for (const corner of [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius]) {
        largest = Math.max(largest, parseFloat(corner) || 0);
      }
    }
    return largest;
  }

  /** Measures and places the panel. Runs only while the panel exists and is shown. */
  function update(): void {
    const element = panel as HTMLElement;
    const frameElement = frame as HTMLElement;
    const box = measureAnchor();
    const arrowSize = arrowOn ? ARROW_SIZE : 0;

    // The panel is in the same space as its anchor: in the page, so that the page moves both in the same frame
    // (decision 13), unless the anchor stays on the screen, and then so does the panel.
    element.toggleAttribute('data-fixed', anchoredToViewport());
    if (matchWidth === false) element.style.minWidth = '';
    else element.style.minWidth = `${Math.max(typeof matchWidth === 'number' ? matchWidth : 0, box.width)}px`;
    const view = document.documentElement;
    // A panel sits at the corner of its containing block, which may be narrow: it is still as wide as it would be
    // on a fixed panel, that is, up to the viewport.
    element.style.maxWidth = `${view.clientWidth}px`;
    const rtl = getComputedStyle(anchorElement ?? element).direction === 'rtl';
    // Where the containing block starts, in the viewport: where the panel is, less what was added to put it there.
    const origin = element.getBoundingClientRect();

    const result = computePlacement({
      anchor: box,
      panel: { width: element.offsetWidth, height: element.offsetHeight },
      viewport: { width: view.clientWidth, height: view.clientHeight },
      placement: resolvedPlacement,
      offset: offset ?? (arrowOn ? arrowSize + 2 : 4),
      autoAdjustOverflow,
      rtl,
      // The middle of the arrow of an aligned placement, from the aligned edge: the radius of the corner and 8 px above or below
      // the anchor (14 px at the radius 6, as in Ant Design Vue), and the radius and 7 px beside it, where the tip is one line
      // high and the arrow has to be seen near the top or the bottom without looking like a piece stuck on at the corner
      // (13 px at the radius 6; the 10 px of the Vue demo left a notch at the corner of a tip with a translucent edge).
      arrow: arrowOn ? { size: arrowSize, pointAtCenter, edge: cornerRadius(frameElement) + 8, sideEdge: cornerRadius(frameElement) + 7 } : null
    });

    // Nothing is written when the placement did not change: while the page scrolls the two numbers differ only by
    // the noise of the arithmetic, and a rounding flipping between two pixels would shake the panel.
    const x = result.x - (origin.left - appliedX);
    const y = result.y - (origin.top - appliedY);
    if (exact === null || Math.abs(x - exact.x) > 0.01 || Math.abs(y - exact.y) > 0.01) {
      exact = { x, y };
      appliedX = snap(x);
      appliedY = snap(y);
      element.style.transform = `translate(${appliedX}px, ${appliedY}px)`;
    }
    if (result.arrow !== null) {
      // The arrow is positioned against the padding box of the frame. Take the border off, so that it still
      // points at the right place and sits on the outer edge of a frame that has one.
      const f = frameElement;
      const horizontal = result.side === 'top' || result.side === 'bottom';
      const startBorder = horizontal ? f.clientLeft : f.clientTop;
      const facingBorder =
        result.side === 'bottom'
          ? f.clientTop
          : result.side === 'right'
            ? f.clientLeft
            : result.side === 'top'
              ? f.offsetHeight - f.clientHeight - f.clientTop
              : f.offsetWidth - f.clientWidth - f.clientLeft;
      element.style.setProperty('--ads-popup-arrow-offset', `${round(result.arrow - startBorder)}px`);
      element.style.setProperty('--ads-popup-arrow-shift', `${facingBorder}px`);
    }
    setData(element, 'positioned', '');
    setData(frameElement, 'placement', result.placement);
    setData(frameElement, 'side', result.side);
    if (lastPlacement !== result.placement) {
      lastPlacement = result.placement;
      untrack(() => onplacement?.(result.placement));
    }
  }

  // Place the panel whenever something that decides its place changes.
  $effect(() => {
    if (!shown || !panel) return;
    update();
  });

  // Follow the layout (R3): scroll of the page or of any scroll parent, resize of the window, size changes of
  // the anchor and of the panel, and a movement of the anchor by a layout change elsewhere on the page. One
  // placement per frame.
  $effect(() => {
    const element = panel;
    if (!shown || !element) return;
    let scheduled = 0;
    const schedule = () => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        untrack(update);
      });
    };
    window.addEventListener('resize', schedule);
    // `scroll` does not bubble, so the capture phase of the document is how every scroll parent is heard.
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(element);
    if (anchorElement) observer?.observe(anchorElement);
    // A layout change elsewhere on the page can move the anchor with no scroll, no resize and no change of
    // its size (an element above it grows). The rectangle of the anchor is checked once per frame while the
    // popup is open; the placement runs only when it changed.
    let last = measureAnchor();
    let watching = 0;
    const watch = () => {
      watching = requestAnimationFrame(watch);
      const box = measureAnchor();
      if (box.left === last.left && box.top === last.top && box.width === last.width && box.height === last.height) return;
      last = box;
      untrack(update);
    };
    watching = requestAnimationFrame(watch);
    return () => {
      cancelAnimationFrame(watching);
      cancelAnimationFrame(scheduled);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('scroll', schedule, { capture: true });
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      observer?.disconnect();
    };
  });

  function handleMouseDown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
    onmousedown?.(event);
    if (!preventBlur || event.defaultPrevented) return;
    // Keep focus where it is, unless the press is on something that takes text.
    const target = event.target as Element;
    if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    event.preventDefault();
  }
</script>

{#if mounted && anchor !== null}
  <div class={panelClass} hidden={!shown} bind:this={panel}>
    <div
      {...rest}
      class={classList('ads-popup-frame', customClass)}
      style={customStyle}
      id={frameId}
      data-state={open ? 'open' : 'closed'}
      bind:this={frame}
      onmousedown={handleMouseDown}
    >
      {@render children?.()}
      {#if arrowOn}
        <div class="ads-popup-arrow" aria-hidden="true"><span class={arrowClass} style={styleText(arrowStyle)}></span></div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* In the page, with the anchor: the page scrolls both in the same frame. Moved by `transform`, from the corner. */
  .ads-popup {
    position: absolute;
    top: 0;
    left: 0;
    width: max-content;
    box-sizing: border-box;
  }

  /* An anchor that stays on the screen (a point, or inside a fixed element) gets a panel that stays too. */
  .ads-popup[data-fixed] {
    position: fixed;
  }

  /* Hidden until the first placement, so the panel never shows at the origin. */
  .ads-popup:not([data-positioned]) {
    visibility: hidden;
  }

  .ads-popup-popover {
    z-index: var(--ads-popover-z-index);
  }

  .ads-popup-dropdown {
    z-index: var(--ads-dropdown-z-index);
  }

  .ads-popup-tooltip {
    z-index: var(--ads-tooltip-z-index);
  }

  .ads-popup-frame {
    position: relative;
    box-sizing: border-box;
    /* The arrow sits behind the content but in front of the frame's own background. */
    isolation: isolate;
  }

  .ads-popup-frame[data-side='top'] {
    transform-origin: 50% 100%;
  }

  .ads-popup-frame[data-side='bottom'] {
    transform-origin: 50% 0;
  }

  .ads-popup-frame[data-side='left'] {
    transform-origin: 100% 50%;
  }

  .ads-popup-frame[data-side='right'] {
    transform-origin: 0 50%;
  }

  @keyframes ads-popup-in {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes ads-popup-out {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: scale(0.8);
    }
  }

  .ads-popup-frame[data-state='open'] {
    animation: ads-popup-in var(--ads-motion-duration) var(--ads-motion-ease-out-back) both;
  }

  .ads-popup-frame[data-state='closed'] {
    animation: ads-popup-out var(--ads-motion-duration-fast) var(--ads-motion-ease) both;
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-popup-frame[data-state] {
      animation: none;
    }
  }

  /*
   * The arrow is a triangle that stands on the outer edge of the frame that faces the anchor: as wide as two sizes and one
   * size high, so its sides are at 45 degrees. It is only the half that sticks out. (It used to be a whole rotated
   * square behind the frame, and a frame with a translucent background showed the other half through it, as a darker
   * diamond inside the box.) The wrapper is a point at the edge; each side below places the triangle against it.
   */
  .ads-popup-arrow {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  /*
   * The arrow is a soft bump on the outer edge of the frame that faces the anchor, as in Ant Design: a rounded tip and
   * concave edges that flare out at the base, so that its base flows into the edge of the frame and into the curve of a
   * rounded corner beside it. A straight triangle with a flat base cannot do that: close to a rounded corner it leaves a
   * notch, and the base is a hairline away from the frame. It is 16 px wide at the base and about 7 px high; the shape is
   * drawn once, for this size, and cut out of a box with `clip-path`. (It used to be a whole rotated square behind the frame,
   * which a translucent frame showed through as a darker diamond.) The wrapper is a point at the edge; each side below
   * places the shape against it.
   *
   * The base of the shape goes one pixel into the frame, past its edge (only the base: beside it the frame has a rounded corner
   * and the shape must not stick out of it). Browsers put the edge of a box and the edge of a clipped shape
   * on pixels by different rules, and at a pixel ratio such as 125% or 150% they miss each other by a device pixel, which
   * leaves a hairline of the page between the arrow and the frame. The overlap closes it, and it is not seen where the
   * frame and the arrow have the same opaque color. A translucent color (a custom `color` of a Tooltip with an alpha) shows
   * the overlap as a slightly darker line.
   */
  .ads-popup-arrow > span {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--ads-popup-arrow-bg, currentColor);
  }

  /* Colors are replaced by the system colors: the arrow is filled with the color of the border of the box. */
  @media (forced-colors: active) {
    .ads-popup-arrow > span {
      background: CanvasText;
    }
  }

  /* The panel is above the anchor: the arrow is on its bottom edge and points down. The base is at (9.5, 1) of the box. */
  .ads-popup-frame[data-side='top'] > .ads-popup-arrow > span {
    width: 19px;
    height: 8.5px;
    transform: translate(-9.5px, -1px);
    clip-path: path('M 0.2574 1 A 3 3 0 0 1 2.3787 1.8787 L 8.0858 7.5858 A 2 2 0 0 0 10.9142 7.5858 L 16.6213 1.8787 A 3 3 0 0 1 18.7426 1 L 17.5 1 L 17.5 0 L 1.5 0 L 1.5 1 Z');
  }

  /* Below the anchor: on the top edge, pointing up. The base is at (9.5, 7.5). */
  .ads-popup-frame[data-side='bottom'] > .ads-popup-arrow > span {
    width: 19px;
    height: 8.5px;
    transform: translate(-9.5px, -7.5px);
    clip-path: path('M 18.7426 7.5 A 3 3 0 0 1 16.6213 6.6213 L 10.9142 0.9142 A 2 2 0 0 0 8.0858 0.9142 L 2.3787 6.6213 A 3 3 0 0 1 0.2574 7.5 L 1.5 7.5 L 1.5 8.5 L 17.5 8.5 L 17.5 7.5 Z');
  }

  /* To the left of the anchor: on the right edge, pointing right. The base is at (1, 9.5). */
  .ads-popup-frame[data-side='left'] > .ads-popup-arrow > span {
    width: 8.5px;
    height: 19px;
    transform: translate(-1px, -9.5px);
    clip-path: path('M 1 18.7426 A 3 3 0 0 1 1.8787 16.6213 L 7.5858 10.9142 A 2 2 0 0 0 7.5858 8.0858 L 1.8787 2.3787 A 3 3 0 0 1 1 0.2574 L 1 1.5 L 0 1.5 L 0 17.5 L 1 17.5 Z');
  }

  /* To the right of the anchor: on the left edge, pointing left. The base is at (7.5, 9.5). */
  .ads-popup-frame[data-side='right'] > .ads-popup-arrow > span {
    width: 8.5px;
    height: 19px;
    transform: translate(-7.5px, -9.5px);
    clip-path: path('M 7.5 0.2574 A 3 3 0 0 1 6.6213 2.3787 L 0.9142 8.0858 A 2 2 0 0 0 0.9142 10.9142 L 6.6213 16.6213 A 3 3 0 0 1 7.5 18.7426 L 7.5 17.5 L 8.5 17.5 L 8.5 1.5 L 7.5 1.5 Z');
  }

  .ads-popup-frame[data-side='top'] > .ads-popup-arrow {
    bottom: calc(var(--ads-popup-arrow-shift, 0px) * -1);
    left: var(--ads-popup-arrow-offset, 50%);
  }

  .ads-popup-frame[data-side='bottom'] > .ads-popup-arrow {
    top: calc(var(--ads-popup-arrow-shift, 0px) * -1);
    left: var(--ads-popup-arrow-offset, 50%);
  }

  .ads-popup-frame[data-side='left'] > .ads-popup-arrow {
    top: var(--ads-popup-arrow-offset, 50%);
    right: calc(var(--ads-popup-arrow-shift, 0px) * -1);
  }

  .ads-popup-frame[data-side='right'] > .ads-popup-arrow {
    top: var(--ads-popup-arrow-offset, 50%);
    left: calc(var(--ads-popup-arrow-shift, 0px) * -1);
  }
</style>
