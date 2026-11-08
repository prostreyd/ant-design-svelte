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
    ...rest
  }: ButtonProps = $props();

  const BUTTON_TYPES = ['primary', 'default', 'dashed', 'text', 'link'] as const;
  const BUTTON_SIZES = ['large', 'medium', 'middle', 'small'] as const;
  const BUTTON_SHAPES = ['default', 'circle', 'round'] as const;
  const BUTTON_HTML_TYPES = ['button', 'submit', 'reset'] as const;
  const BUTTON_ICON_PLACEMENTS = ['start', 'end'] as const;

  /** Rejects values outside the public contract instead of rendering them silently. */
  function assertAllowed(name: string, value: unknown, allowed: readonly unknown[]): void {
    if (!allowed.includes(value)) {
      throw new RangeError(`Button ${name} must be one of: ${allowed.join(', ')}.`);
    }
  }

  let delayedLoading = $state(false);

  const loadingDelay = $derived.by(() => {
    if (typeof loading === 'boolean') return 0;
    if (!Number.isFinite(loading.delay) || loading.delay < 0) {
      throw new RangeError('Button loading.delay must be a non-negative finite number.');
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

  const classes = $derived.by(() => {
    assertAllowed('type', type, BUTTON_TYPES);
    assertAllowed('size', size, BUTTON_SIZES);
    assertAllowed('shape', shape, BUTTON_SHAPES);
    assertAllowed('htmlType', htmlType, BUTTON_HTML_TYPES);
    assertAllowed('iconPlacement', iconPlacement, BUTTON_ICON_PLACEMENTS);
    // `middle` is a legacy alias; it already maps to the `ads-btn-middle` class.
    const sizeClass = size === 'medium' ? 'middle' : size;
    const list: string[] = ['ads-btn', `ads-btn-${type}`, `ads-btn-${sizeClass}`];
    if (shape !== 'default') list.push(`ads-btn-${shape}`);
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
    {href}
    {target}
    {rel}
    download={downloadAttribute}
    aria-disabled={isDisabled || undefined}
    aria-busy={isLoading || undefined}
    tabindex={isDisabled ? -1 : undefined}
    onclick={handleClick}
  >
    {#if isLoading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon && iconPlacement === 'start'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
    {#if icon && iconPlacement === 'end'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
  </a>
{:else}
  <button
    {...rest}
    class={classes}
    type={htmlType}
    disabled={isDisabled}
    {form}
    {name}
    {value}
    aria-busy={isLoading || undefined}
    onclick={handleClick}
  >
    {#if isLoading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon && iconPlacement === 'start'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
    {#if icon && iconPlacement === 'end'}
      <span class="ads-btn-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
  </button>
{/if}

<style>
  .ads-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ads-control-gap);
    height: var(--ads-control-height);
    padding: 0 var(--ads-control-padding-inline);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: var(--ads-control-line-height);
    border: var(--ads-border-width) solid transparent;
    border-radius: var(--ads-radius-md);
    background: transparent;
    color: var(--ads-color-text);
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

  .ads-btn-default {
    background: var(--ads-color-bg-container);
    border-color: var(--ads-color-border);
  }

  .ads-btn-primary {
    background: var(--ads-color-primary);
    color: var(--ads-color-text-inverse);
  }

  .ads-btn-dashed {
    background: var(--ads-color-bg-container);
    border-color: var(--ads-color-border);
    border-style: dashed;
  }

  .ads-btn-text {
    background: transparent;
    border-color: transparent;
  }

  .ads-btn-link {
    background: transparent;
    border-color: transparent;
    color: var(--ads-color-primary);
  }

  .ads-btn:not(.ads-btn-disabled):hover,
  .ads-btn:not(.ads-btn-disabled):focus-visible {
    color: var(--ads-color-primary);
  }

  .ads-btn-primary:not(.ads-btn-disabled):hover {
    background: var(--ads-color-primary-hover);
    color: var(--ads-color-text-inverse);
  }

  .ads-btn-primary:not(.ads-btn-disabled):active {
    background: var(--ads-color-primary-active);
    color: var(--ads-color-text-inverse);
  }

  .ads-btn-default:not(.ads-btn-disabled):hover,
  .ads-btn-dashed:not(.ads-btn-disabled):hover {
    border-color: var(--ads-color-primary);
  }

  .ads-btn-text:not(.ads-btn-disabled):hover {
    background: var(--ads-color-bg-text-hover);
  }

  .ads-btn-link:not(.ads-btn-disabled):hover {
    color: var(--ads-color-primary-hover);
  }

  .ads-btn-danger.ads-btn-primary {
    background: var(--ads-color-danger);
  }

  .ads-btn-danger.ads-btn-primary:not(.ads-btn-disabled):hover {
    background: var(--ads-color-danger-hover);
  }

  .ads-btn-danger.ads-btn-primary:not(.ads-btn-disabled):active {
    background: var(--ads-color-danger-active);
  }

  .ads-btn-danger.ads-btn-default,
  .ads-btn-danger.ads-btn-dashed,
  .ads-btn-danger.ads-btn-text,
  .ads-btn-danger.ads-btn-link {
    color: var(--ads-color-danger);
  }

  .ads-btn-danger.ads-btn-default:not(.ads-btn-disabled):hover,
  .ads-btn-danger.ads-btn-dashed:not(.ads-btn-disabled):hover {
    border-color: var(--ads-color-danger);
  }

  .ads-btn-ghost.ads-btn-primary {
    background: transparent;
    border-color: var(--ads-color-primary);
    color: var(--ads-color-primary);
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
</style>
