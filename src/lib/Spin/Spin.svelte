<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { SpinClassNames, SpinSize, SpinStyles } from './types.js';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';

  type SpinProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'role'> & {
    /** Whether the Spin is active. `undefined` counts as the default (`true`). */
    spinning?: boolean;
    /** Milliseconds to wait, every time `spinning` becomes true, before the indicator appears. */
    delay?: number;
    /** Size of the dot box: 14, 20 or 32 px. `default` is a compatibility alias of `medium`. */
    size?: SpinSize;
    /** Text or content shown under the indicator. It is what a screen reader announces. */
    description?: string | Snippet;
    /** Replaces the default dots. Drawn in a box of the dot size; the component does not turn it. */
    indicator?: Snippet;
    /** A progress ring (0 to 100) in place of the dots, or `'auto'` for an indeterminate ring. */
    percent?: number | 'auto';
    /** A dimmed backdrop over the viewport with the indicator in the middle. Drawn in place. */
    fullscreen?: boolean;
    /** Embedded mode: the content the Spin covers while it is spinning. */
    children?: Snippet;
    /** Extra classes for the `root`, `section`, `indicator`, `description` and `container` parts. */
    classNames?: SpinClassNames;
    /** Inline styles for the five parts; they are written after the token-based values. */
    styles?: SpinStyles;
    /** Additional CSS class appended to the root classes. */
    class?: string;
    /** Inline style of the root; `styles.root` is applied after it. */
    style?: string;
  };

  let {
    spinning = true,
    delay,
    size = 'medium',
    description,
    indicator,
    percent,
    fullscreen = false,
    children,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    'aria-label': ariaLabel = undefined,
    'aria-labelledby': ariaLabelledby = undefined,
    ...rest
  }: SpinProps = $props();

  const SPIN_SIZES = ['small', 'medium', 'large', 'default'] as const;

  const uid = $props.id();
  const descriptionId = `${uid}-description`;

  // Validated on every render. Values outside the contract throw in development and fall back
  // to `medium` in production. `default` is rendered exactly like `medium`.
  const resolvedSize = $derived.by(() => {
    const value = resolveOption('Spin', 'size', size, SPIN_SIZES, 'medium');
    return value === 'default' ? 'medium' : value;
  });

  // A delay that is not a finite number of milliseconds, 0 or more, throws in development and
  // means "no delay" in production.
  const delayMs = $derived.by(() => {
    if (delay === undefined) return 0;
    if (typeof delay === 'number' && Number.isFinite(delay) && delay >= 0) return delay;
    if (!isProduction()) {
      throw new RangeError('Spin delay must be a finite number of milliseconds, 0 or more.');
    }
    return 0;
  });

  // A number is clamped to 0 to 100; `NaN` and anything else outside the contract throws in
  // development and is ignored (the dots are drawn) in production.
  const ringValue = $derived.by((): number | 'auto' | undefined => {
    if (percent === undefined || percent === 'auto') return percent;
    if (typeof percent === 'number' && !Number.isNaN(percent)) {
      return Math.min(100, Math.max(0, percent));
    }
    if (!isProduction()) {
      throw new RangeError("Spin percent must be a number or 'auto'.");
    }
    return undefined;
  });
  // A custom indicator wins over the ring.
  const showRing = $derived(indicator === undefined && ringValue !== undefined);

  // The indicator is seen once `spinning` is true and the delay (if any) has passed. A change to
  // false hides at once, because `visible` reads `isActive` directly; the timer is only a way of
  // waiting. A repeated true does not change `isActive`, so it starts no second timer.
  const isActive = $derived(Boolean(spinning));
  let delayElapsed = $state(false);
  const visible = $derived(isActive && (delayMs === 0 || delayElapsed));

  $effect(() => {
    if (!isActive || delayMs === 0) {
      delayElapsed = false;
      return;
    }
    const timer = setTimeout(() => {
      delayElapsed = true;
    }, delayMs);
    return () => clearTimeout(timer);
  });

  const hasDescription = $derived(
    typeof description === 'string' ? description !== '' : description !== undefined
  );
  const isNamed = $derived(hasDescription || Boolean(ariaLabel) || Boolean(ariaLabelledby));

  // A Spin with no text and no name is silent for a screen reader, so development says so once.
  let warned = false;
  $effect(() => {
    if (visible && !isNamed && !warned && !isProduction()) {
      warned = true;
      console.warn(
        'Spin: it has no description and no accessible name, so a screen reader says nothing while it spins. ' +
          'Give it a `description` or an `aria-label` / `aria-labelledby`.'
      );
    }
  });

  const shape = $derived(fullscreen ? 'fullscreen' : children !== undefined ? 'embedded' : 'standalone');

  const sizeClass = $derived(`ads-spin-${resolvedSize}`);
  // A standalone Spin has one element for the root and the section, so it takes both.
  const rootClass = $derived(
    classList(
      'ads-spin',
      `ads-spin-${shape}`,
      sizeClass,
      customClass,
      classNames?.root,
      shape === 'standalone' && classNames?.section
    )
  );
  const rootStyle = $derived(
    styleText(customStyle, styles?.root, shape === 'standalone' && styles?.section)
  );
  const sectionClass = $derived(classList('ads-spin-section', classNames?.section));
  const sectionStyle = $derived(styleText(styles?.section));
  const indicatorClass = $derived(classList('ads-spin-indicator', classNames?.indicator));
  const ringClass = $derived(classList(indicatorClass, 'ads-spin-indicator-ring'));
  const customClassName = $derived(classList(indicatorClass, 'ads-spin-indicator-custom'));
  const indicatorStyle = $derived(styleText(styles?.indicator));
  const descriptionClass = $derived(classList('ads-spin-description', classNames?.description));
  const descriptionStyle = $derived(styleText(styles?.description));
  const containerClass = $derived(classList('ads-spin-container', classNames?.container));
  const containerStyle = $derived(styleText(styles?.container));
</script>

<!-- The indicator and the description: the same three places draw them. -->
{#snippet parts()}
  {#if showRing}
    <!-- The indicator part is the progressbar, so it is not hidden from assistive technology; the drawing inside is. -->
    <span
      class={ringClass}
      style={indicatorStyle}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ringValue === 'auto' ? undefined : ringValue}
      aria-label={hasDescription ? undefined : ariaLabel}
      aria-labelledby={hasDescription ? descriptionId : ariaLabelledby}
    >
      <svg
        class="ads-spin-ring"
        class:ads-spin-ring-auto={ringValue === 'auto'}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle class="ads-spin-ring-track" cx="50" cy="50" r="40" fill="none" />
        <circle
          class="ads-spin-ring-arc"
          cx="50"
          cy="50"
          r="40"
          fill="none"
          transform="rotate(-90 50 50)"
          pathLength="100"
          stroke-dasharray={ringValue === 'auto' ? '30 70' : '100 100'}
          stroke-dashoffset={ringValue === 'auto' ? 0 : 100 - (ringValue as number)}
        />
      </svg>
    </span>
  {:else if indicator}
    <span class={customClassName} style={indicatorStyle} aria-hidden="true">
      {@render indicator()}
    </span>
  {:else}
    <span class={indicatorClass} style={indicatorStyle} aria-hidden="true">
      <span class="ads-spin-dots"><span></span><span></span><span></span><span></span></span>
    </span>
  {/if}
  {#if hasDescription}
    <!-- A string is text (never HTML); anything else is a snippet. -->
    <div id={descriptionId} class={descriptionClass} style={descriptionStyle}>
      {#if typeof description === 'string'}{description}{:else}{@render (description as Snippet)()}{/if}
    </div>
  {/if}
{/snippet}

{#if shape === 'standalone'}
  {#if visible}
    <div
      {...rest}
      class={rootClass}
      style={rootStyle}
      role="status"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      {@render parts()}
    </div>
  {/if}
{:else if shape === 'embedded'}
  <div {...rest} class={rootClass} style={rootStyle}>
    {#if visible}
      <div
        class={sectionClass}
        style={sectionStyle}
        role="status"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
      >
        {@render parts()}
      </div>
    {/if}
    <!-- Busy marks the region that is being updated; it is not put on the live region above. -->
    <div
      class={containerClass}
      class:ads-spin-container-busy={visible}
      style={containerStyle}
      aria-busy={visible ? true : undefined}
    >
      {@render children?.()}
    </div>
  </div>
{:else}
  {#if visible}
    <div
      {...rest}
      class={rootClass}
      style={rootStyle}
      role="status"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
    >
      <div class={sectionClass} style={sectionStyle}>
        {@render parts()}
      </div>
    </div>
  {/if}
  <!-- Content given together with `fullscreen` is drawn as it is: the backdrop covers it, nothing dims it. -->
  {#if children}
    <div class={containerClass} style={containerStyle}>
      {@render children()}
    </div>
  {/if}
{/if}

<style>
  /*
   * The size only sets the private `--_dot`; the rules below read it, so the indicator, the ring and a
   * custom indicator all follow it. Colors, sizes and times come from the `--ads-spin-*` tokens. Positions
   * use logical properties, so nothing mirrors wrongly in right-to-left layouts.
   */
  .ads-spin {
    --_dot: var(--ads-spin-dot-size);
    --_stagger: 0.4s;

    box-sizing: border-box;
  }

  .ads-spin-small {
    --_dot: var(--ads-spin-dot-size-sm);
  }

  .ads-spin-large {
    --_dot: var(--ads-spin-dot-size-lg);
  }

  /* One element is the root and the section of a standalone Spin. */
  .ads-spin-standalone,
  .ads-spin-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ads-spin-gap);
    color: var(--ads-spin-color);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
  }

  .ads-spin-standalone {
    display: inline-flex;
    vertical-align: middle;
  }

  /* Embedded: the section is laid over the whole content and centers the indicator in it. */
  .ads-spin-embedded {
    position: relative;
    display: block;
  }

  .ads-spin-embedded > .ads-spin-section {
    position: absolute;
    inset: 0;
    z-index: 1;
    justify-content: center;
  }

  .ads-spin-container {
    position: relative;
    transition: opacity var(--ads-motion-duration-slow);
  }

  /* The pointer and the selection are blocked; the keyboard and assistive technology are not. */
  .ads-spin-container-busy {
    opacity: var(--ads-spin-container-opacity);
    pointer-events: none;
    user-select: none;
  }

  /* Fullscreen: a backdrop over the viewport. It keeps the pointer, so clicks do not reach the page. */
  .ads-spin-fullscreen {
    position: fixed;
    inset: 0;
    z-index: var(--ads-spin-fullscreen-z-index);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--ads-spin-mask-bg);
    color: var(--ads-spin-fullscreen-color);
    animation: ads-spin-fade-in var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-spin-fullscreen > .ads-spin-section {
    color: var(--ads-spin-fullscreen-color);
  }

  .ads-spin-indicator {
    display: block;
    flex: none;
    width: var(--_dot);
    height: var(--_dot);
    font-size: var(--_dot);
    line-height: 1;
  }

  /* A custom indicator is centered in the dot box, which is also its font size. */
  .ads-spin-indicator-custom {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ads-spin-description {
    color: var(--ads-spin-description-color);
    font-size: var(--ads-font-size);
    line-height: 1;
    text-align: center;
  }

  .ads-spin-fullscreen .ads-spin-description {
    color: var(--ads-spin-fullscreen-color);
  }

  /* The default indicator: four dots in the corners of the box; the group turns and each dot pulses. */
  .ads-spin-dots {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    transform: rotate(45deg);
    animation: ads-spin-rotate var(--ads-spin-duration) linear infinite;
  }

  .ads-spin-dots > span {
    position: absolute;
    display: block;
    width: 45%;
    height: 45%;
    border-radius: 100%;
    background-color: currentcolor;
    opacity: 0.3;
    transform: scale(0.75);
    animation: ads-spin-pulse var(--ads-spin-pulse-duration) linear infinite alternate;
  }

  .ads-spin-dots > span:nth-child(1) {
    inset-block-start: 0;
    inset-inline-start: 0;
  }

  .ads-spin-dots > span:nth-child(2) {
    inset-block-start: 0;
    inset-inline-end: 0;
    animation-delay: var(--_stagger);
  }

  .ads-spin-dots > span:nth-child(3) {
    inset-block-end: 0;
    inset-inline-end: 0;
    animation-delay: calc(var(--_stagger) * 2);
  }

  .ads-spin-dots > span:nth-child(4) {
    inset-block-end: 0;
    inset-inline-start: 0;
    animation-delay: calc(var(--_stagger) * 3);
  }

  /* The progress ring fills the dot box: a track, and an arc that starts at 12 o'clock. */
  .ads-spin-ring {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .ads-spin-ring circle {
    stroke-width: 20;
  }

  .ads-spin-ring-track {
    stroke: var(--ads-spin-ring-track);
  }

  .ads-spin-ring-arc {
    stroke: currentcolor;
    transition: stroke-dashoffset var(--ads-motion-duration-slow) var(--ads-motion-ease);
  }

  /* Indeterminate: a fixed arc that turns; no timer and no value for a screen reader. */
  .ads-spin-ring-auto {
    animation: ads-spin-turn var(--ads-spin-duration) linear infinite;
  }

  @keyframes ads-spin-rotate {
    to {
      transform: rotate(405deg);
    }
  }

  @keyframes ads-spin-turn {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ads-spin-pulse {
    to {
      opacity: 1;
    }
  }

  @keyframes ads-spin-fade-in {
    from {
      opacity: 0;
    }
  }

  /*
   * Forced colors (Windows High Contrast): the dots are backgrounds, which the system replaces with Canvas, so
   * the default indicator would vanish (found on Ant Design's own Spin, 2026-11-17). The dots and the ring are
   * drawn with system colors instead and opt out of the adjustment; a custom indicator is the consumer's own
   * and is left to the system.
   */
  @media (forced-colors: active) {
    .ads-spin-dots > span {
      forced-color-adjust: none;
      background-color: CanvasText;
    }

    .ads-spin-ring {
      forced-color-adjust: none;
    }

    .ads-spin-ring-track {
      stroke: GrayText;
    }

    .ads-spin-ring-arc {
      stroke: CanvasText;
    }
  }

  /* Honour the OS "reduce motion" setting: no transitions, a slower turn (never a frozen indicator). */
  @media (prefers-reduced-motion: reduce) {
    .ads-spin {
      --_stagger: 1s;
    }

    .ads-spin-container,
    .ads-spin-ring-arc {
      transition: none;
    }

    .ads-spin-fullscreen {
      animation: none;
    }

    .ads-spin-dots,
    .ads-spin-ring-auto {
      animation-duration: calc(var(--ads-spin-duration) * 2.5);
    }

    .ads-spin-dots > span {
      animation-duration: calc(var(--ads-spin-pulse-duration) * 2.5);
    }
  }
</style>
