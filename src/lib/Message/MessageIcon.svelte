<script lang="ts">
  /*
   * The icons of a message, drawn here from plain geometry: a disc with the sign cut out of it (the sign shows what is
   * behind the icon), a spinner, and a cross. They are decorative: the text, the hidden type word and the name of the
   * close button carry the meaning.
   */
  type IconName = 'info' | 'success' | 'error' | 'warning' | 'loading' | 'close';

  let { name }: { name: IconName } = $props();

  // The id of the mask that cuts the sign out of the disc: one per icon, so two icons never share it.
  const uid = $props.id();
</script>

<svg class={`ads-message-svg ads-message-svg-${name}`} viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
  {#if name === 'loading'}
    <circle class="track" cx="8" cy="8" r="6" />
    <path class="arc" d="M8 2a6 6 0 0 1 6 6" />
  {:else if name === 'close'}
    <path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" />
  {:else}
    <mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <rect width="16" height="16" fill="#fff" stroke="none" />
      {#if name === 'info'}
        <circle cx="8" cy="4.9" r="1" fill="#000" stroke="none" />
        <path d="M8 7.4v4" stroke="#000" stroke-width="1.6" />
      {:else if name === 'success'}
        <path d="M4.8 8.2l2.3 2.3 4.2-4.6" stroke="#000" stroke-width="1.6" />
      {:else if name === 'error'}
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#000" stroke-width="1.6" />
      {:else}
        <path d="M8 4.4v4.2" stroke="#000" stroke-width="1.6" />
        <circle cx="8" cy="11.2" r="1" fill="#000" stroke="none" />
      {/if}
    </mask>
    <circle cx="8" cy="8" r="7" fill="currentColor" stroke="none" mask="url(#{uid}-cut)" />
  {/if}
</svg>

<style>
  .ads-message-svg {
    display: block;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ads-message-svg-loading {
    animation: ads-message-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  .ads-message-svg-loading .track {
    opacity: 0.25;
  }

  .ads-message-svg-loading .arc {
    stroke-width: 2;
  }

  @keyframes ads-message-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-message-svg-loading {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
