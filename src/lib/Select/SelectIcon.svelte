<script lang="ts">
  /*
   * The few icons a Select needs, drawn here from plain geometry (a chevron, a disc, a cross, a tick, an
   * almond, a ring). They are decorative: the button that holds one carries the accessible name.
   */
  type IconName = 'arrow' | 'search' | 'clear' | 'check' | 'remove' | 'loading';

  let { name }: { name: IconName } = $props();

  // The cross of the clear icon is cut out of the disc with a mask, so it shows what is behind the icon.
  const uid = $props.id();
  const iconClass = $derived(`ads-select-icon ads-select-icon-${name}`);
</script>

<svg class={iconClass} viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
  {#if name === 'arrow'}
    <path d="M3.2 6l4.8 4.8L12.8 6" />
  {:else if name === 'check'}
    <path d="M3 8.6l3.2 3.2L13 5" />
  {:else if name === 'remove'}
    <path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" />
  {:else if name === 'search'}
    <circle cx="7" cy="7" r="4.6" />
    <path d="M10.4 10.4L14 14" />
  {:else if name === 'clear'}
    <mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <rect width="16" height="16" fill="#fff" stroke="none" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#000" stroke-width="1.6" />
    </mask>
    <circle cx="8" cy="8" r="7" fill="currentColor" mask="url(#{uid}-cut)" />
  {:else}
    <circle class="track" cx="8" cy="8" r="6" />
    <path class="arc" d="M8 2a6 6 0 0 1 6 6" />
  {/if}
</svg>

<style>
  .ads-select-icon {
    display: block;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* The filled disc has no stroke. */
  .ads-select-icon-clear circle {
    stroke: none;
  }

  .ads-select-icon-loading {
    animation: ads-select-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  .ads-select-icon-loading .track {
    opacity: 0.25;
  }

  .ads-select-icon-loading .arc {
    stroke-width: 2;
  }

  @keyframes ads-select-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-select-icon-loading {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
