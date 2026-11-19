<script lang="ts">
  import { untrack } from 'svelte';
  import Button from '../Button/Button.svelte';
  import { waitForLeave } from '../internal/anim/leave.js';
  import { isProduction } from '../internal/env.js';
  import Icon from '../internal/icons/Icon.svelte';
  import { tabbables } from '../internal/overlay/focus.js';
  import { openOverlay } from '../internal/overlay/overlay.js';
  import { lockScroll } from '../internal/overlay/scrollLock.js';
  import { portal, type PortalContainer } from '../internal/portal/portal.svelte.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { claimMask, maskCovered } from './masks.svelte.js';
  import { recentPress, trackPress } from './pointer.js';
  import type { ModalProps, ModalText } from './types.js';

  const uid = $props.id();

  let {
    open = $bindable(false),
    title = undefined,
    children,
    footer = undefined,
    okText = undefined,
    cancelText = undefined,
    okType = 'primary',
    okButtonProps = undefined,
    cancelButtonProps = undefined,
    confirmLoading = false,
    onok,
    closeOnOk = false,
    oncancel,
    closable = true,
    closeIcon,
    mask = true,
    keyboard = true,
    centered = false,
    width,
    zIndex,
    container,
    destroyOnHidden = false,
    forceRender = false,
    focusable,
    scrollLock = true,
    zoomFromClick = false,
    modalRender,
    class: customClass,
    style: customStyle,
    wrapClassName,
    classNames,
    styles,
    onafteropenchange,
    onafterclose,
    ...rest
  }: ModalProps = $props();

  /** The layer exists in the page: from the first opening (or from the start with `forceRender`), until `destroyOnHidden` removes it. */
  let mounted = $state(false);
  /** The layer is visible: open, or still playing its leave animation. */
  let shown = $state(false);
  let rootElement = $state<HTMLElement | null>(null);
  let wrapperElement = $state<HTMLElement | null>(null);
  let dialogElement = $state<HTMLElement | null>(null);
  /** The OK button waits for the Promise that `onok` returned. */
  let okPending = $state(false);

  let cancelLeave: (() => void) | null = null;
  let cancelEnter: (() => void) | null = null;
  let alive = true;

  const hasTitle = $derived(title !== undefined && title !== null && title !== '');
  const titleId = `ads-modal-title-${uid}`;
  const showClose = $derived(closable !== false);
  const closableConfig = $derived(typeof closable === 'object' && closable !== null ? closable : {});
  const closeIconSnippet = $derived(closableConfig.closeIcon ?? closeIcon);
  const maskEnabled = $derived(mask === false ? false : typeof mask === 'object' && mask !== null ? mask.enabled !== false : true);
  // The mask is claimed while the Modal is shown. A Modal opened over another one with a mask draws no second mask.
  let maskId = $state(0);
  const maskDrawn = $derived(maskEnabled && !(maskId !== 0 && maskCovered(maskId)));
  $effect(() => {
    if (!shown || !maskEnabled) return;
    const claim = claimMask();
    maskId = claim.id;
    return () => {
      claim.release();
      maskId = 0;
    };
  });
  const maskClosable = $derived(typeof mask === 'object' && mask !== null ? mask.closable !== false : true);
  // No width: the token (520 px). A number is px.
  const widthCss = $derived(width === undefined ? 'var(--ads-modal-width)' : typeof width === 'number' ? `${width}px` : width);
  const dataState = $derived(open ? 'open' : 'closed');
  const okLoading = $derived(Boolean(confirmLoading || okPending || okButtonProps?.loading));

  // The name of the dialog is its title; with none, the app has to give `aria-label` or `aria-labelledby`.
  const labelled = $derived(rest['aria-label'] != null || rest['aria-labelledby'] != null);
  let warned = false;
  $effect(() => {
    if (open && !hasTitle && !labelled && !warned && !isProduction()) {
      warned = true;
      console.warn('Modal: a Modal with no title needs an `aria-label` or an `aria-labelledby`, or a screen reader cannot name it.');
    }
  });

  function resolveContainer(): HTMLElement | null {
    if (container === false) return null;
    if (typeof container === 'string') return document.querySelector<HTMLElement>(container) ?? document.body;
    return ((typeof container === 'function' ? container() : (container as PortalContainer)) as HTMLElement | null | undefined) ?? document.body;
  }

  // The layer is moved to its container each time it is shown, and the portal takes it out again when the Modal is gone.
  const target = () => (shown ? resolveContainer() : null);

  function stopTimers(): void {
    cancelLeave?.();
    cancelLeave = null;
    cancelEnter?.();
    cancelEnter = null;
  }

  function finishLeave(): void {
    stopTimers();
    shown = false;
    if (destroyOnHidden) mounted = false;
    onafteropenchange?.(false);
    onafterclose?.();
  }

  // The Modal is in the page ahead of the first opening when it is asked to be.
  $effect(() => {
    if (forceRender) untrack(() => (mounted = true));
  });

  // The lifecycle: opening shows the layer (and puts it in the page the first time); closing plays the leave animation and hides it.
  $effect(() => {
    const wantOpen = open;
    untrack(() => {
      if (wantOpen) {
        stopTimers();
        mounted = true;
        shown = true;
      } else if (shown) {
        stopTimers();
        cancelLeave = waitForLeave(dialogElement, finishLeave);
      }
    });
  });

  // The enter animation has ended.
  $effect(() => {
    if (!open || !shown || !dialogElement) return;
    const box = dialogElement;
    untrack(() => {
      cancelEnter?.();
      cancelEnter = waitForLeave(box, () => onafteropenchange?.(true));
    });
    return () => {
      cancelEnter?.();
      cancelEnter = null;
    };
  });

  // The place of the last click is kept only for a Modal that zooms from it.
  // (A derived value, so that the effect runs again only when the option changes, not each time any prop is set: stopping the listener forgets the click.)
  const followClicks = $derived(zoomFromClick === true);
  $effect(() => (followClicks ? trackPress() : undefined));

  /** What gets focus when the Modal opens: the button asked for, or the first element Tab reaches, or the dialog itself. */
  function initialFocus(): HTMLElement {
    // Called by the overlay when it opens, which happens only with the dialog in the page.
    const box = dialogElement as HTMLElement;
    const wanted = focusable?.autoFocusButton;
    if (wanted === null) return box;
    if (wanted === 'ok' || wanted === 'cancel') {
      const button = box.querySelector<HTMLElement>(`[data-ads-modal-${wanted}]`);
      if (button) return button;
    }
    return tabbables(box)[0] ?? box;
  }

  // While it is open the Modal holds the page: what is behind it, focus, and Escape (`specs/overlay.md`). The scroll is held by the next effect.
  $effect(() => {
    if (!open || !shown || !rootElement || !dialogElement) return;
    const root = rootElement;
    const box = dialogElement;
    return openOverlay({
      root: box,
      scope: root,
      lockScroll: false,
      trapFocus: focusable?.trap !== false,
      restoreFocus: focusable?.focusTriggerAfterClose !== false,
      initialFocus,
      escape: () => keyboard,
      dismiss: (_reason, event) => cancel(event)
    });
  });

  // The page does not scroll while the Modal is shown, **up to the end of its leave animation**: when the lock went with `open`, the scrollbar came back at
  // the first frame of the leave, the page was laid out again, and the dialog (and what is behind it) jumped half the width of the bar sideways (specs/modal.md, P23).
  $effect(() => {
    if (!shown || !scrollLock) return;
    return lockScroll();
  });

  // With `zoomFromClick` the zoom starts at the click that opened the Modal; otherwise it is around the center of the dialog. The place is
  // worked out after the page is locked (the next effect): without a scrollbar the window is wider, and the dialog stands a few pixels further.
  $effect(() => {
    if (!open || !shown || !dialogElement) return;
    const box = dialogElement;
    const press = followClicks ? recentPress() : null;
    if (!press) {
      box.style.removeProperty('transform-origin');
      return;
    }
    // Where the dialog stands without the zoom: the enter animation has already scaled its rectangle. It is positioned in the scroll
    // area, which is not animated.
    const area = wrapperElement as HTMLElement;
    const place = area.getBoundingClientRect();
    const left = place.left + box.offsetLeft - area.scrollLeft;
    const top = place.top + box.offsetTop - area.scrollTop;
    box.style.setProperty('transform-origin', `${press.x - left}px ${press.y - top}px`);
  });

  $effect(
    () => () => {
      alive = false;
      stopTimers();
    }
  );

  /** A way to close that is not OK: the handler may refuse with `event.preventDefault()`. */
  function cancel(event: MouseEvent | KeyboardEvent): void {
    oncancel?.(event);
    if (event.defaultPrevented) return;
    open = false;
  }

  const isThenable = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';

  function handleOk(event: MouseEvent): void {
    // A second press while the OK button waits never gets here: a loading Button does not pass the click on.
    okButtonProps?.onclick?.(event);
    const result = onok?.(event);
    if (event.defaultPrevented || !closeOnOk) return;
    if (isThenable(result)) {
      okPending = true;
      Promise.resolve(result).then(
        () => {
          okPending = false;
          if (alive) open = false;
        },
        () => {
          okPending = false;
        }
      );
    } else {
      open = false;
    }
  }

  function handleCancelButton(event: MouseEvent): void {
    cancelButtonProps?.onclick?.(event);
    cancel(event);
  }

  function handleClose(event: MouseEvent): void {
    if (closableConfig.disabled) return;
    cancel(event);
  }

  // A press on the area around the dialog is a press on the mask. It closes only when it started there as well:
  // selecting text inside the dialog and letting go outside does not (a click then lands on a common ancestor).
  let pressStartedOnMask = false;
  function handleWrapperDown(event: PointerEvent): void {
    pressStartedOnMask = event.target === wrapperElement;
  }
  function handleWrapperClick(event: MouseEvent): void {
    const started = pressStartedOnMask;
    pressStartedOnMask = false;
    if (event.target !== wrapperElement || !started || !maskClosable) return;
    cancel(event);
  }
</script>

{#snippet text(value: ModalText)}
  {#if typeof value === 'function'}{@render value()}{:else}{value}{/if}
{/snippet}

{#snippet cancelButton()}
  <Button {...cancelButtonProps} onclick={handleCancelButton} data-ads-modal-cancel="">{@render text(cancelText ?? 'Cancel')}</Button>
{/snippet}

{#snippet okButton()}
  <Button type={okType} {...okButtonProps} loading={okLoading} onclick={handleOk} data-ads-modal-ok="">{@render text(okText ?? 'OK')}</Button>
{/snippet}

{#snippet origin()}
  {@render cancelButton()}
  {@render okButton()}
{/snippet}

{#snippet card()}
  <div class={classList('ads-modal-content', classNames?.content)} style={styleText(styles?.content)}>
    {#if showClose}
      <button
        type="button"
        class={classList('ads-modal-close', classNames?.close)}
        style={styleText(styles?.close)}
        aria-label={closableConfig['aria-label'] ?? 'Close'}
        disabled={closableConfig.disabled}
        onclick={handleClose}
      >
        {#if closeIconSnippet}{@render closeIconSnippet()}{:else}<Icon name="close" />{/if}
      </button>
    {/if}
    {#if hasTitle}
      <div class={classList('ads-modal-header', classNames?.header)} style={styleText(styles?.header)}>
        <div class={classList('ads-modal-title', classNames?.title)} style={styleText(styles?.title)} id={titleId}>
          {@render text(title as ModalText)}
        </div>
      </div>
    {/if}
    <div class={classList('ads-modal-body', classNames?.body)} style={styleText(styles?.body)}>{@render children?.()}</div>
    {#if footer !== null}
      <div class={classList('ads-modal-footer', classNames?.footer)} style={styleText(styles?.footer)}>
        {#if footer === undefined}
          {@render origin()}
        {:else if typeof footer === 'function'}
          {@render footer({ origin, ok: okButton, cancel: cancelButton })}
        {:else}
          {footer}
        {/if}
      </div>
    {/if}
  </div>
{/snippet}

{#if mounted}
  <div
    class={classList('ads-modal-root', classNames?.root)}
    style={styleText(zIndex !== undefined && `z-index: ${zIndex}`, styles?.root)}
    hidden={!shown}
    bind:this={rootElement}
    {@attach portal(target)}
  >
    {#if maskDrawn}
      <div class={classList('ads-modal-mask', classNames?.mask)} style={styleText(styles?.mask)} data-state={dataState}></div>
    {/if}
    <!-- The press on the area around the dialog: a mouse or a finger (the dialog has its own keys). -->
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class={classList('ads-modal-wrapper', centered && 'ads-modal-centered', wrapClassName, classNames?.wrapper)}
      style={styleText(styles?.wrapper)}
      bind:this={wrapperElement}
      onpointerdown={handleWrapperDown}
      onclick={handleWrapperClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        tabindex="-1"
        {...rest}
        class={classList('ads-modal', customClass, classNames?.dialog)}
        style={styleText(`width: ${widthCss}`, customStyle, styles?.dialog)}
        data-state={dataState}
        bind:this={dialogElement}
      >
        {#if modalRender}{@render modalRender(card)}{:else}{@render card()}{/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* The layer: fixed over the whole window, under the popup layers (a Select in a Modal opens above it). */
  .ads-modal-root {
    position: fixed;
    inset: 0;
    z-index: var(--ads-modal-z-index);
  }

  .ads-modal-root[hidden] {
    display: none;
  }

  .ads-modal-mask {
    position: absolute;
    inset: 0;
    background-color: var(--ads-modal-mask-bg);
  }

  /* The scroll area: a tall dialog scrolls here, not the page, and the scroll does not chain to the page. */
  .ads-modal-wrapper {
    position: absolute;
    inset: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }

  .ads-modal {
    position: relative;
    box-sizing: border-box;
    max-width: calc(100vw - 32px);
    margin: var(--ads-modal-top) auto 24px;
    outline: none;
    color: var(--ads-modal-body-color);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: 1.5714285714285714;
  }

  /* Centered: the wrapper is a flex box and `margin: auto` centers the dialog; one taller than the window sits at the top and scrolls. */
  .ads-modal-centered {
    display: flex;
  }

  .ads-modal-centered > .ads-modal {
    margin: auto;
  }

  .ads-modal-content {
    position: relative;
    box-sizing: border-box;
    padding: var(--ads-modal-padding);
    border-radius: var(--ads-modal-radius);
    background-color: var(--ads-modal-content-bg);
    box-shadow: var(--ads-modal-shadow);
  }

  .ads-modal-header {
    margin-block-end: var(--ads-modal-header-gap);
  }

  .ads-modal-title {
    color: var(--ads-modal-title-color);
    font-size: var(--ads-modal-title-font-size);
    font-weight: var(--ads-modal-title-font-weight);
    line-height: var(--ads-modal-title-line-height);
    overflow-wrap: break-word;
  }

  /* A block formatting context: the margins of the first and the last element of the content stay in the body and do not run through
     the 8 px under the title or the 12 px above the footer. */
  .ads-modal-body {
    display: flow-root;
    overflow-wrap: break-word;
  }

  .ads-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--ads-modal-footer-gap);
    margin-block-start: var(--ads-modal-footer-margin-top);
  }

  .ads-modal-close {
    position: absolute;
    inset-block-start: var(--ads-modal-close-inset);
    inset-inline-end: var(--ads-modal-close-inset);
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--ads-modal-close-size);
    height: var(--ads-modal-close-size);
    padding: 0;
    border: 0;
    border-radius: var(--ads-radius-sm);
    background: transparent;
    color: var(--ads-modal-close-color);
    font-size: 16px;
    cursor: pointer;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-modal-close:hover:not(:disabled) {
    background-color: var(--ads-modal-close-bg-hover);
    color: var(--ads-modal-close-color-hover);
  }

  .ads-modal-close:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  .ads-modal-close:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @keyframes ads-modal-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes ads-modal-fade-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes ads-modal-zoom-in {
    from {
      opacity: 0;
      transform: scale(0.2);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes ads-modal-zoom-out {
    from {
      opacity: 1;
      transform: none;
    }
    to {
      opacity: 0;
      transform: scale(0.2);
    }
  }

  .ads-modal-mask[data-state='open'] {
    animation: ads-modal-fade-in var(--ads-motion-duration) linear both;
  }

  .ads-modal-mask[data-state='closed'] {
    animation: ads-modal-fade-out var(--ads-motion-duration) linear both;
  }

  .ads-modal[data-state='open'] {
    animation: ads-modal-zoom-in var(--ads-motion-duration-slow) var(--ads-modal-motion-ease) both;
  }

  .ads-modal[data-state='closed'] {
    animation: ads-modal-zoom-out var(--ads-motion-duration-slow) var(--ads-motion-ease-in-out-circ) both;
  }

  /* A narrow screen: 8 px at each side. */
  @media (max-width: 575.98px) {
    .ads-modal {
      max-width: calc(100vw - 16px);
      margin-inline: 8px;
    }

    .ads-modal-centered > .ads-modal {
      margin: auto 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-modal-mask[data-state],
    .ads-modal[data-state],
    .ads-modal-close {
      animation: none;
      transition: none;
    }
  }

  /* The shadow is gone in a forced-colors mode: the card gets a border. The mask is kept translucent (the system would make it opaque). */
  @media (forced-colors: active) {
    .ads-modal-content {
      border: 1px solid CanvasText;
    }

    .ads-modal-mask {
      forced-color-adjust: none;
    }

    .ads-modal-close {
      border: 1px solid ButtonText;
      color: ButtonText;
    }

    .ads-modal-close:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
