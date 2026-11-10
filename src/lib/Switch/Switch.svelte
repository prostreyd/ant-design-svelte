<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { SwitchClassNames, SwitchSize, SwitchStyles } from './types.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';

  type SwitchProps = Omit<
    HTMLAttributes<HTMLButtonElement>,
    'children' | 'class' | 'style' | 'onclick' | 'onchange' | 'role'
  > & {
    /** Whether the switch is on. Use `bind:checked` for two-way binding. */
    checked?: boolean;
    /** Called once per user toggle, after the state flips, with the new value. */
    onchange?: (checked: boolean, event: MouseEvent) => void;
    /** Native click callback. Runs before the state flips; `preventDefault()` cancels the toggle. */
    onclick?: (event: MouseEvent) => void;
    /** Whether the switch is disabled. */
    disabled?: boolean;
    /** Shows a spinner in the handle and ignores activation. The switch keeps focus. */
    loading?: boolean;
    /** Size. `default` is a compatibility alias of `medium`. */
    size?: SwitchSize;
    /**
     * Content shown while the switch is on: plain text, or a snippet for icons and markup.
     * Hidden from assistive technology. It stays mounted while the switch is off, so the
     * switch keeps the width of the wider content.
     */
    checkedChildren?: string | Snippet;
    /**
     * Content shown while the switch is off: plain text, or a snippet for icons and markup.
     * Hidden from assistive technology. It stays mounted while the switch is on, so the
     * switch keeps the width of the wider content.
     */
    unCheckedChildren?: string | Snippet;
    /** Extra classes for the `root`, `content` and `indicator` parts. */
    classNames?: SwitchClassNames;
    /** Inline styles for the `root`, `content` and `indicator` parts. */
    styles?: SwitchStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
  };

  let {
    checked = $bindable(false),
    onchange,
    onclick,
    disabled = false,
    loading = false,
    size = 'medium',
    checkedChildren,
    unCheckedChildren,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    'aria-busy': ariaBusy = undefined,
    'aria-disabled': ariaDisabled = undefined,
    ...rest
  }: SwitchProps = $props();

  const SWITCH_SIZES = ['medium', 'small', 'default'] as const;

  let element: HTMLButtonElement | undefined = $state();

  // Validated on every render. Values outside the contract throw in development and fall
  // back to `medium` in production. `default` is rendered exactly like `medium`.
  const resolvedSize = $derived(
    resolveOption('Switch', 'size', size, SWITCH_SIZES, 'medium') === 'small' ? 'small' : 'medium'
  );

  const isOn = $derived(Boolean(checked));

  // A loading switch stays focusable: a natively disabled element drops focus, which would
  // strand keyboard users the moment an action starts. Activation is blocked in `handleClick`
  // and `aria-disabled` tells assistive technology it is unavailable. Attributes the consumer
  // passes are kept unless the component's own state overrides them.
  const isInactive = $derived(disabled || loading);
  const busyValue = $derived(loading ? true : ariaBusy);
  const inactiveValue = $derived(loading && !disabled ? true : ariaDisabled);

  const rootClass = $derived(
    classList(
      'ads-switch',
      `ads-switch-${resolvedSize}`,
      isOn && 'ads-switch-checked',
      loading && 'ads-switch-loading',
      disabled && 'ads-switch-disabled',
      customClass,
      classNames?.root
    )
  );
  const contentClass = $derived(classList('ads-switch-content', classNames?.content));
  const indicatorClass = $derived(classList('ads-switch-indicator', classNames?.indicator));

  const rootStyle = $derived(styleText(customStyle, styles?.root));
  const contentStyle = $derived(styleText(styles?.content));
  const indicatorStyle = $derived(styleText(styles?.indicator));

  function handleClick(event: MouseEvent): void {
    if (isInactive) return;
    onclick?.(event);
    if (event.defaultPrevented) return;
    const next = !isOn;
    checked = next;
    onchange?.(next, event);
  }

  /** Moves focus to the switch. */
  export function focus(options?: FocusOptions): void {
    element?.focus(options);
  }

  /** Removes focus from the switch. */
  export function blur(): void {
    element?.blur();
  }
</script>

<!-- A string is text (never HTML); anything else is a snippet. -->
{#snippet content(value: string | Snippet)}
  {#if typeof value === 'string'}{value}{:else}{@render value()}{/if}
{/snippet}

<button
  {...rest}
  bind:this={element}
  type="button"
  role="switch"
  class={rootClass}
  style={rootStyle}
  {disabled}
  aria-checked={isOn}
  aria-disabled={inactiveValue}
  aria-busy={busyValue}
  onclick={handleClick}
>
  <!--
    Both contents are mounted in one grid cell and the one of the other state is hidden, so the
    cell is as wide as the wider of the two and the switch does not change width when it toggles.
  -->
  <span class={contentClass} style={contentStyle} aria-hidden="true">
    {#if checkedChildren}
      <span class="ads-switch-content-item" class:ads-switch-content-hidden={!isOn}>
        {@render content(checkedChildren)}
      </span>
    {/if}
    {#if unCheckedChildren}
      <span class="ads-switch-content-item" class:ads-switch-content-hidden={isOn}>
        {@render content(unCheckedChildren)}
      </span>
    {/if}
  </span>
  <span class={indicatorClass} style={indicatorStyle} aria-hidden="true">
    {#if loading}<span class="ads-switch-spinner"></span>{/if}
  </span>
</button>

<style>
  /*
   * The size and the state only set the private `--_*` variables below; the rules that
   * paint the track read them, so size, checked, hover and pressed combine without
   * fighting over specificity. The track and handle colors come from the `--ads-switch-*`
   * tokens, which keep WCAG contrast in the light and dark themes. Positions use logical
   * properties, so the switch mirrors in right-to-left layouts.
   */
  .ads-switch {
    --_height: var(--ads-switch-height);
    --_min-width: var(--ads-switch-min-width);
    --_handle: var(--ads-switch-handle-size);
    --_margin-min: var(--ads-switch-content-margin-min);
    --_margin-max: var(--ads-switch-content-margin-max);
    --_font-size: var(--ads-switch-font-size);
    --_spinner-border: var(--ads-switch-spinner-border-width);
    --_track: var(--ads-switch-track-off);
    --_track-hover: var(--ads-switch-track-off-hover);
    --_track-active: var(--ads-switch-track-off-active);

    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    min-width: var(--_min-width);
    height: var(--_height);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--_height);
    background-color: var(--_track);
    color: var(--ads-switch-content-color);
    font-family: var(--ads-font-family);
    font-size: var(--_font-size);
    line-height: var(--_height);
    vertical-align: middle;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    transition: background-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-switch-small {
    --_height: var(--ads-switch-height-sm);
    --_min-width: var(--ads-switch-min-width-sm);
    --_handle: var(--ads-switch-handle-size-sm);
    --_margin-min: var(--ads-switch-content-margin-min-sm);
    --_margin-max: var(--ads-switch-content-margin-max-sm);
    --_font-size: var(--ads-switch-font-size-sm);
    --_spinner-border: 1.5px;
  }

  .ads-switch-checked {
    --_track: var(--ads-switch-track-on);
    --_track-hover: var(--ads-switch-track-on-hover);
    --_track-active: var(--ads-switch-track-on-active);
  }

  .ads-switch:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .ads-switch:not(.ads-switch-disabled):not(.ads-switch-loading):hover {
    background-color: var(--_track-hover);
  }

  .ads-switch:not(.ads-switch-disabled):not(.ads-switch-loading):active {
    background-color: var(--_track-active);
  }

  .ads-switch-content {
    display: grid;
    flex: 1;
    align-content: center;
    box-sizing: border-box;
    height: 100%;
    overflow: hidden;
    border-radius: inherit;
    padding-inline: var(--_margin-max) var(--_margin-min);
    white-space: nowrap;
    transition: padding var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-switch-checked .ads-switch-content {
    padding-inline: var(--_margin-min) var(--_margin-max);
  }

  /* Both contents share one cell; the shorter one is centered in the width of the wider one. */
  .ads-switch-content-item {
    grid-area: 1 / 1;
    justify-self: center;
    min-width: 0;
  }

  .ads-switch-content-hidden {
    visibility: hidden;
  }

  .ads-switch-indicator {
    position: absolute;
    top: var(--ads-switch-padding);
    inset-inline-start: var(--ads-switch-padding);
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--_handle);
    height: var(--_handle);
    border-radius: 50%;
    background-color: var(--ads-switch-handle-bg);
    box-shadow: var(--ads-switch-handle-shadow);
    transition: inset-inline-start var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-switch-checked .ads-switch-indicator {
    inset-inline-start: calc(100% - var(--_handle) - var(--ads-switch-padding));
  }

  .ads-switch-spinner {
    box-sizing: border-box;
    width: calc(var(--_handle) * 0.6);
    height: calc(var(--_handle) * 0.6);
    border: var(--_spinner-border) solid var(--_track);
    border-top-color: transparent;
    border-radius: 50%;
    animation: ads-switch-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  .ads-switch-loading {
    cursor: not-allowed;
    opacity: var(--ads-switch-loading-opacity);
  }

  .ads-switch-disabled {
    cursor: not-allowed;
    opacity: var(--ads-switch-disabled-opacity);
  }

  @keyframes ads-switch-spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Honour the OS "reduce motion" setting: no transitions, a slower spinner. */
  @media (prefers-reduced-motion: reduce) {
    .ads-switch,
    .ads-switch-content,
    .ads-switch-indicator {
      transition: none;
    }

    .ads-switch-spinner {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
