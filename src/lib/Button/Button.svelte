<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ButtonHTMLType, ButtonShape, ButtonSize, ButtonType } from './types.js';

  interface ButtonProps {
    /** Visual style of the button. */
    type?: ButtonType;
    /** Size of the button. */
    size?: ButtonSize;
    /** Shape of the button. */
    shape?: ButtonShape;
    /** Whether the button is disabled. */
    disabled?: boolean;
    /** Whether to show a loading spinner (also disables the button). */
    loading?: boolean;
    /** Danger color scheme. */
    danger?: boolean;
    /** Stretch the button to the full width of its container. */
    block?: boolean;
    /** Transparent background (mainly for primary buttons on colored surfaces). */
    ghost?: boolean;
    /** Render an anchor instead of a button. */
    href?: string;
    /** Anchor target (only used when `href` is set). */
    target?: string;
    /** Native `type` attribute of the `<button>` element. */
    htmlType?: ButtonHTMLType;
    /** Leading icon snippet. */
    icon?: Snippet;
    /** Click handler. */
    onclick?: (event: MouseEvent) => void;
    /** Button label (default slot). */
    children?: Snippet;
  }

  let {
    type = 'default',
    size = 'middle',
    shape = 'default',
    disabled = false,
    loading = false,
    danger = false,
    block = false,
    ghost = false,
    href = undefined,
    target = undefined,
    htmlType = 'button',
    icon,
    onclick,
    children
  }: ButtonProps = $props();

  const classes = $derived.by(() => {
    const list: string[] = ['ads-btn', `ads-btn-${type}`, `ads-btn-${size}`];
    if (shape !== 'default') list.push(`ads-btn-${shape}`);
    if (danger) list.push('ads-btn-danger');
    if (ghost) list.push('ads-btn-ghost');
    if (block) list.push('ads-btn-block');
    if (loading) list.push('ads-btn-loading');
    if (disabled || loading) list.push('ads-btn-disabled');
    return list.join(' ');
  });

  const isDisabled = $derived(disabled || loading);

  function handleClick(event: MouseEvent): void {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    onclick?.(event);
  }
</script>

{#if href}
  <a
    class={classes}
    {href}
    {target}
    aria-disabled={isDisabled || undefined}
    tabindex={isDisabled ? -1 : 0}
    onclick={handleClick}
  >
    {#if loading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon}<span class="ads-btn-icon">{@render icon()}</span>{/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
  </a>
{:else}
  <button
    class={classes}
    type={htmlType}
    disabled={isDisabled}
    aria-busy={loading || undefined}
    onclick={handleClick}
  >
    {#if loading}<span class="ads-btn-loading-icon" aria-hidden="true"></span>{/if}
    {#if icon}<span class="ads-btn-icon">{@render icon()}</span>{/if}
    {#if children}<span class="ads-btn-content">{@render children()}</span>{/if}
  </button>
{/if}

<style>
  .ads-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: var(--ads-control-height);
    padding: 0 15px;
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: 1.5715;
    border: 1px solid transparent;
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

  /* Sizes */
  .ads-btn-large {
    height: var(--ads-control-height-lg);
    font-size: var(--ads-font-size-lg);
  }

  .ads-btn-small {
    height: var(--ads-control-height-sm);
    padding: 0 7px;
    font-size: var(--ads-font-size-sm);
  }

  /* Types */
  .ads-btn-default {
    background: var(--ads-color-bg-container);
    border-color: var(--ads-color-border);
  }

  .ads-btn-primary {
    background: var(--ads-color-primary);
    color: #fff;
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

  /* Hover / active (exclude disabled) */
  .ads-btn:not(.ads-btn-disabled):hover,
  .ads-btn:not(.ads-btn-disabled):focus-visible {
    color: var(--ads-color-primary);
  }

  .ads-btn-primary:not(.ads-btn-disabled):hover {
    background: var(--ads-color-primary-hover);
    color: #fff;
  }

  .ads-btn-primary:not(.ads-btn-disabled):active {
    background: var(--ads-color-primary-active);
    color: #fff;
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

  /* Danger */
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

  /* Ghost */
  .ads-btn-ghost.ads-btn-primary {
    background: transparent;
    border-color: var(--ads-color-primary);
    color: var(--ads-color-primary);
  }

  /* Shapes */
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

  /* Block */
  .ads-btn-block {
    display: flex;
    width: 100%;
  }

  /* Disabled */
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

  /* Loading */
  .ads-btn-loading-icon {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ads-btn-spin 1s linear infinite;
  }

  @keyframes ads-btn-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
