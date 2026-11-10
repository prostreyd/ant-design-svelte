<script lang="ts">
  import type {
    HTMLAnchorAttributes,
    HTMLAttributes,
    HTMLButtonAttributes
  } from 'svelte/elements';
  import type {
    ButtonHTMLType,
    ButtonIconPlacement,
    ButtonLoading,
    ButtonShape,
    ButtonSize,
    ButtonType
  } from './types.js';
  import type { Snippet } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';

  type ButtonProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'class' | 'onclick'> & {
    /** Visual style of the button. */
    type?: ButtonType;
    /** Size of the button. `middle` is a compatibility alias for `medium`. */
    size?: ButtonSize;
    /** Shape of the button. */
    shape?: ButtonShape;
    /** Whether the button is disabled. */
    disabled?: boolean;
    /** Shows a spinner immediately or after the optional delay. */
    loading?: ButtonLoading;
    /** Danger color scheme. */
    danger?: boolean;
    /** Stretch the button to the full width of its container. */
    block?: boolean;
    /** Transparent background (mainly for primary buttons on colored surfaces). */
    ghost?: boolean;
    /** Render an anchor instead of a button. */
    href?: string;
    /** Anchor target (only used when `href` is set). */
    target?: HTMLAnchorAttributes['target'];
    /** Anchor relationship (only used when `href` is set). */
    rel?: HTMLAnchorAttributes['rel'];
    /** Anchor download attribute (only used when `href` is set). */
    download?: string | boolean;
    /** Native `type` attribute of the `<button>` element. */
    htmlType?: ButtonHTMLType;
    /** Native button form association. */
    form?: HTMLButtonAttributes['form'];
    /** Native button name. */
    name?: HTMLButtonAttributes['name'];
    /** Native button value. */
    value?: HTMLButtonAttributes['value'];
    /** Icon snippet rendered before or after the label. */
    icon?: Snippet;
    /** Placement of the icon snippet. */
    iconPlacement?: ButtonIconPlacement;
    /** Additional CSS class appended to the component classes. */
    class?: string;
    /** Click handler. */
    onclick?: (event: MouseEvent) => void;
    /** Button label (default content snippet). */
    children?: Snippet;
  };

  let {
    type = 'default',
    size = 'medium',
    shape = 'default',
    disabled = false,
    loading = false,
    danger = false,
    block = false,
    ghost = false,
    href = undefined,
    target = undefined,
    rel = undefined,
    download = undefined,
    htmlType = 'button',
    form = undefined,
    name = undefined,
    value = undefined,
    icon,
    iconPlacement = 'start',
    onclick,
    children,
    class: customClass,
    tabindex = undefined,
    'aria-busy': ariaBusy = undefined,
    'aria-disabled': ariaDisabled = undefined,
    ...rest
  }: ButtonProps = $props();

  const BUTTON_TYPES = ['primary', 'default', 'dashed', 'text', 'link'] as const;
  const BUTTON_SIZES = ['large', 'medium', 'middle', 'small'] as const;
  const BUTTON_SHAPES = ['default', 'circle', 'round'] as const;
  const BUTTON_HTML_TYPES = ['button', 'submit', 'reset'] as const;
  const BUTTON_ICON_PLACEMENTS = ['start', 'end'] as const;

  // One derived object, so every option is validated on each render, whichever element is used.
  // Values outside the contract throw in development and fall back to the default in production.
  const resolved = $derived({
    type: resolveOption('Button', 'type', type, BUTTON_TYPES, 'default'),
    size: resolveOption('Button', 'size', size, BUTTON_SIZES, 'medium'),
    shape: resolveOption('Button', 'shape', shape, BUTTON_SHAPES, 'default'),
    htmlType: resolveOption('Button', 'htmlType', htmlType, BUTTON_HTML_TYPES, 'button'),
    iconPlacement: resolveOption(
      'Button',
      'iconPlacement',
      iconPlacement,
      BUTTON_ICON_PLACEMENTS,
      'start'
    )
  });

  let delayedLoading = $state(false);

  const loadingDelay = $derived.by(() => {
    if (typeof loading === 'boolean') return 0;
    if (!Number.isFinite(loading.delay) || loading.delay < 0) {
      if (!isProduction()) {
        throw new RangeError('Button loading.delay must be a non-negative finite number.');
      }
      // Production fallback: the caller asked for loading, so show it immediately.
      return 0;
    }
    return loading.delay;
  });

  // Depends only on the derived `loadingDelay` number, so a new `{ delay }` object
  // with the same delay does not restart a pending timer. A zero delay fires on the
  // next macrotask, and `isLoading` already treats zero as immediate.
  $effect(() => {
    const delay = loadingDelay;
    delayedLoading = false;
    const timer = setTimeout(() => {
      delayedLoading = true;
    }, delay);

    return () => clearTimeout(timer);
  });

  const isLoading = $derived(
    typeof loading === 'boolean' ? loading : loadingDelay === 0 || delayedLoading
  );
  const isDisabled = $derived(disabled || isLoading);

  // A loading button stays focusable: a natively disabled element drops focus, which
  // would strand keyboard users the moment an action starts. Clicks are blocked in
  // `handleClick`, and `aria-disabled` tells assistive technology it is unavailable.
  // Attributes the consumer passes are kept unless the component's own state overrides them.
  const busyValue = $derived(isLoading ? true : ariaBusy);
  const buttonAriaDisabled = $derived(isLoading && !disabled ? true : ariaDisabled);
  const anchorAriaDisabled = $derived(isDisabled ? true : ariaDisabled);
  const anchorTabindex = $derived(isDisabled ? -1 : tabindex);

  const classes = $derived.by(() => {
    // `middle` is a legacy alias; it already maps to the `ads-btn-middle` class.
    const sizeClass = resolved.size === 'medium' ? 'middle' : resolved.size;
    const list: string[] = ['ads-btn', `ads-btn-${resolved.type}`, `ads-btn-${sizeClass}`];
    if (resolved.shape !== 'default') list.push(`ads-btn-${resolved.shape}`);
    if (danger) list.push('ads-btn-danger');
    if (ghost) list.push('ads-btn-ghost');
    if (block) list.push('ads-btn-block');
    if (isLoading) list.push('ads-btn-loading');
    if (isDisabled) list.push('ads-btn-disabled');
    if (customClass) list.push(customClass);
    return list.join(' ');
  });

  // A boolean `download` maps to the bare attribute or to no attribute at all.
  // Any other rendering would still cause the link to download.
  const downloadAttribute = $derived(
    download === true ? '' : download === false ? undefined : download
  );

  function handleClick(event: MouseEvent): void {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }
</script>

{#if href !== undefined}
  <a
    {...rest}
    class={classes}
    href={isDisabled ? undefined : href}
    role={isDisabled ? 'link' : undefined}
    {target}
    {rel}
    download={downloadAttribute}
    aria-disabled={anchorAriaDisabled}
    aria-busy={busyValue}
    tabindex={anchorTabindex}
    onclick={handleClick}
  >
    {#if isLoading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon && resolved.iconPlacement === 'start'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
    {#if icon && resolved.iconPlacement === 'end'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
  </a>
{:else}
  <button
    {...rest}
    class={classes}
    type={resolved.htmlType}
    {disabled}
    {form}
    {name}
    {value}
    {tabindex}
    aria-disabled={buttonAriaDisabled}
    aria-busy={busyValue}
    onclick={handleClick}
  >
    {#if isLoading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon && resolved.iconPlacement === 'start'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
    {#if icon && resolved.iconPlacement === 'end'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
  </button>
{/if}

<style>
  /*
   * Every variant only sets the private `--_*` colour variables below. The hover,
   * focus-visible and active rules then read them, so type, `danger` and `ghost`
   * combine without fighting over specificity. Solid fills use the `-solid` tokens and
   * foreground colours on the page background use the `-text` tokens; both keep
   * WCAG AA contrast (4.5:1) in the light and dark themes.
   */
  .ads-btn {
    --_fg: var(--ads-color-text);
    --_fg-hover: var(--ads-color-primary-text-hover);
    --_fg-active: var(--ads-color-primary-text-active);
    --_bg: var(--ads-color-bg-container);
    --_bg-hover: var(--_bg);
    --_bg-active: var(--_bg);
    --_border: var(--ads-color-border);
    --_border-hover: var(--ads-color-primary-text-hover);
    --_border-active: var(--ads-color-primary-text-active);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ads-control-gap);
    height: var(--ads-control-height);
    padding: 0 var(--ads-control-padding-inline);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: var(--ads-control-line-height);
    border: var(--ads-border-width) solid var(--_border);
    border-radius: var(--ads-radius-md);
    background: var(--_bg);
    color: var(--_fg);
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    touch-action: manipulation;
    text-decoration: none;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background var(--ads-motion-duration) var(--ads-motion-ease),
      border-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-btn:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .ads-btn-large {
    height: var(--ads-control-height-lg);
    font-size: var(--ads-font-size-lg);
  }

  .ads-btn-small {
    height: var(--ads-control-height-sm);
    padding: 0 var(--ads-control-padding-inline-sm);
    font-size: var(--ads-font-size-sm);
  }

  /* Danger palette for the interactive states; the types below decide what applies. */
  .ads-btn-danger {
    --_fg-hover: var(--ads-color-danger-text-hover);
    --_fg-active: var(--ads-color-danger-text-active);
    --_border-hover: var(--ads-color-danger-text-hover);
    --_border-active: var(--ads-color-danger-text-active);
  }

  /* default keeps the base variables. */

  .ads-btn-primary {
    --_fg: var(--ads-color-text-inverse);
    --_fg-hover: var(--ads-color-text-inverse);
    --_fg-active: var(--ads-color-text-inverse);
    --_bg: var(--ads-color-primary-solid);
    --_bg-hover: var(--ads-color-primary-solid-hover);
    --_bg-active: var(--ads-color-primary-solid-active);
    --_border: transparent;
    --_border-hover: transparent;
    --_border-active: transparent;
  }

  .ads-btn-dashed {
    border-style: dashed;
  }

  .ads-btn-text {
    --_bg: transparent;
    --_bg-hover: var(--ads-color-bg-text-hover);
    --_bg-active: var(--ads-color-bg-text-hover);
    --_border: transparent;
    --_border-hover: transparent;
    --_border-active: transparent;
  }

  .ads-btn-link {
    --_fg: var(--ads-color-primary-text);
    --_bg: transparent;
    --_border: transparent;
    --_border-hover: transparent;
    --_border-active: transparent;
  }

  .ads-btn-danger.ads-btn-default,
  .ads-btn-danger.ads-btn-dashed,
  .ads-btn-danger.ads-btn-text,
  .ads-btn-danger.ads-btn-link {
    --_fg: var(--ads-color-danger-text);
  }

  .ads-btn-danger.ads-btn-primary {
    --_bg: var(--ads-color-danger-solid);
    --_bg-hover: var(--ads-color-danger-solid-hover);
    --_bg-active: var(--ads-color-danger-solid-active);
  }

  /* Ghost: transparent surface; the text and border keep the button's own colours. */
  .ads-btn-ghost.ads-btn-default,
  .ads-btn-ghost.ads-btn-dashed,
  .ads-btn-ghost.ads-btn-primary {
    --_bg: transparent;
    --_bg-hover: transparent;
    --_bg-active: transparent;
  }

  .ads-btn-ghost.ads-btn-primary {
    --_fg: var(--ads-color-primary-text);
    --_fg-hover: var(--ads-color-primary-text-hover);
    --_fg-active: var(--ads-color-primary-text-active);
    --_border: var(--ads-color-primary-text);
    --_border-hover: var(--ads-color-primary-text-hover);
    --_border-active: var(--ads-color-primary-text-active);
  }

  .ads-btn-ghost.ads-btn-primary.ads-btn-danger {
    --_fg: var(--ads-color-danger-text);
    --_fg-hover: var(--ads-color-danger-text-hover);
    --_fg-active: var(--ads-color-danger-text-active);
    --_border: var(--ads-color-danger-text);
    --_border-hover: var(--ads-color-danger-text-hover);
    --_border-active: var(--ads-color-danger-text-active);
  }

  .ads-btn:not(.ads-btn-disabled):is(:hover, :focus-visible) {
    color: var(--_fg-hover);
    background: var(--_bg-hover);
    border-color: var(--_border-hover);
  }

  .ads-btn:not(.ads-btn-disabled):active {
    color: var(--_fg-active);
    background: var(--_bg-active);
    border-color: var(--_border-active);
  }

  .ads-btn-circle {
    min-width: var(--ads-control-height);
    padding: 0;
    border-radius: 50%;
  }

  .ads-btn-circle.ads-btn-large {
    min-width: var(--ads-control-height-lg);
  }

  .ads-btn-circle.ads-btn-small {
    min-width: var(--ads-control-height-sm);
  }

  .ads-btn-round {
    border-radius: var(--ads-control-height);
  }

  .ads-btn-block {
    display: flex;
    width: 100%;
  }

  .ads-btn-disabled,
  .ads-btn:disabled {
    cursor: not-allowed;
    color: var(--ads-color-text-disabled);
    border-color: var(--ads-color-border);
    background: var(--ads-color-bg-container-disabled);
    box-shadow: none;
  }

  .ads-btn-disabled.ads-btn-text,
  .ads-btn-disabled.ads-btn-link {
    background: transparent;
    border-color: transparent;
  }

  .ads-btn-loading-icon {
    display: inline-block;
    width: var(--ads-button-loading-size);
    height: var(--ads-button-loading-size);
    border: var(--ads-button-loading-border-width) solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ads-btn-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  @keyframes ads-btn-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Honour the OS "reduce motion" setting: no colour transitions, a slower spinner. */
  @media (prefers-reduced-motion: reduce) {
    .ads-btn {
      transition: none;
    }

    .ads-btn-loading-icon {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
