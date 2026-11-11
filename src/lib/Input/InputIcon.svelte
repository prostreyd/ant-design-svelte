<script lang="ts">
  /*
   * The few icons the input family needs, drawn here from plain geometry (a circle, a cross, an almond,
   * a ring). They are decorative: the button that holds one carries the accessible name.
   */
  type IconName = 'clear' | 'eye' | 'eye-off' | 'search' | 'loading';

  let { name }: { name: IconName } = $props();

  // The cross of the clear icon is cut out of the disc with a mask, so it shows what is behind the icon
  // (any variant, any background). The id is unique per instance.
  const uid = $props.id();
  const iconClass = $derived(`ads-input-icon ads-input-icon-${name}`);
</script>

<svg
  class={iconClass}
  viewBox="0 0 16 16"
  width="1em"
  height="1em"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'clear'}
    <mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <rect width="16" height="16" fill="#fff" stroke="none" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#000" stroke-width="1.6" />
    </mask>
    <circle cx="8" cy="8" r="7" fill="currentColor" mask="url(#{uid}-cut)" />
  {:else if name === 'eye' || name === 'eye-off'}
    <path d="M1 8s2.6-4.8 7-4.8S15 8 15 8s-2.6 4.8-7 4.8S1 8 1 8z" />
    <circle cx="8" cy="8" r="2.1" />
    {#if name === 'eye-off'}<path d="M2.6 13.4L13.4 2.6" />{/if}
  {:else if name === 'search'}
    <circle cx="7" cy="7" r="4.6" />
    <path d="M10.4 10.4L14 14" />
  {:else}
    <circle class="track" cx="8" cy="8" r="6" />
    <path class="arc" d="M8 2a6 6 0 0 1 6 6" />
  {/if}
</svg>

<style>
  .ads-input-icon {
    display: block;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* The filled disc has no stroke. */
  .ads-input-icon-clear circle {
    stroke: none;
  }

  .ads-input-icon-loading {
    animation: ads-input-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  .ads-input-icon-loading .track {
    opacity: 0.25;
  }

  .ads-input-icon-loading .arc {
    stroke-width: 2;
  }

  @keyframes ads-input-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-input-icon-loading {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
