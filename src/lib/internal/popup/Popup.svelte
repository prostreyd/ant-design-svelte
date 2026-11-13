<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveOption } from '../options.js';
  import { classList } from '../semantic.js';
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
  const panelClass = $derived(`ads-popup ads-popup-${resolvedLayer}`);

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

  /** Measures and places the panel. Runs only while the panel exists and is shown. */
  function update(): void {
    const element = panel as HTMLElement;
    const frameElement = frame as HTMLElement;
    const box = measureAnchor();
    const computed = getComputedStyle(element);
    const arrowSize = arrowOn ? parseFloat(computed.getPropertyValue('--ads-popup-arrow-size')) || 8 : 0;

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
      arrow: arrowOn ? { size: arrowSize, pointAtCenter, edge: 16 } : null
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
        <div class="ads-popup-arrow" aria-hidden="true"><span></span></div>
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

  /* The arrow is the middle of a rotated square on the edge of the frame that faces the anchor. */
  .ads-popup-arrow {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .ads-popup-arrow > span {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    width: calc(var(--ads-popup-arrow-size) * 1.4142);
    height: calc(var(--ads-popup-arrow-size) * 1.4142);
    background: var(--ads-popup-arrow-bg, currentColor);
    transform: translate(-50%, -50%) rotate(45deg);
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
