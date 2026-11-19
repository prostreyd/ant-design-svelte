<script lang="ts" module>
  /** The icons that components share, on a 16 x 16 grid (specs/icons.md). */
  export const ICON_NAMES = [
    'arrow',
    'check',
    'clear',
    'close',
    'ellipsis',
    'error',
    'eye',
    'eye-off',
    'info',
    'loading',
    'remove',
    'search',
    'success',
    'warning'
  ] as const;

  export type IconName = (typeof ICON_NAMES)[number];
</script>

<script lang="ts">
  /*
   * A decorative icon drawn from plain geometry: a chevron, a tick, a cross, an almond, a ring, a spinner, and the discs with a
   * sign cut out of them (the sign shows what is behind the icon). The element that holds it carries the accessible name, so the
   * svg is hidden from assistive technology. It is the size of the text (`1em`) and the color of the text (`currentColor`): the
   * owner sets `font-size` and `color` on the holder. `class` adds the classes of the component that draws it.
   */
  import { classList } from '../semantic.js';

  let { name, class: customClass }: { name: IconName; class?: string } = $props();

  // The id of the mask that cuts the sign out of a disc: one per icon, so two icons never share it.
  const uid = $props.id();
</script>

<svg
  class={classList('ads-icon', `ads-icon-${name}`, customClass)}
  viewBox="0 0 16 16"
  width="1em"
  height="1em"
  aria-hidden="true"
  focusable="false"
>
  {#if name === 'arrow'}
    <path d="M3.2 6l4.8 4.8L12.8 6" />
  {:else if name === 'check'}
    <path d="M3 8.6l3.2 3.2L13 5" />
  {:else if name === 'close'}
    <path d="M3.8 3.8l8.4 8.4M12.2 3.8l-8.4 8.4" />
  {:else if name === 'remove'}
    <path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2" />
  {:else if name === 'search'}
    <circle cx="7" cy="7" r="4.6" />
    <path d="M10.4 10.4L14 14" />
  {:else if name === 'eye' || name === 'eye-off'}
    <path d="M1 8s2.6-4.8 7-4.8S15 8 15 8s-2.6 4.8-7 4.8S1 8 1 8z" />
    <circle cx="8" cy="8" r="2.1" />
    {#if name === 'eye-off'}<path d="M2.6 13.4L13.4 2.6" />{/if}
  {:else if name === 'ellipsis'}
    <circle cx="3" cy="8" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="13" cy="8" r="1.3" />
  {:else if name === 'loading'}
    <circle class="track" cx="8" cy="8" r="6" />
    <path class="arc" d="M8 2a6 6 0 0 1 6 6" />
  {:else if name === 'clear'}
    <mask id="{uid}-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
      <rect width="16" height="16" fill="#fff" stroke="none" />
      <path d="M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8" stroke="#000" stroke-width="1.6" />
    </mask>
    <circle cx="8" cy="8" r="7" fill="currentColor" mask="url(#{uid}-cut)" />
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
  .ads-icon {
    display: block;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ads-icon-close {
    stroke-width: 1.8;
  }

  /* The filled disc of a clear icon has no stroke. */
  .ads-icon-clear circle {
    stroke: none;
  }

  /* The three dots are filled, not drawn with a line. */
  .ads-icon-ellipsis circle {
    fill: currentColor;
    stroke: none;
  }

  .ads-icon-loading {
    animation: ads-icon-spin var(--ads-motion-duration-spinner) linear infinite;
  }

  .ads-icon-loading .track {
    opacity: 0.25;
  }

  .ads-icon-loading .arc {
    stroke-width: 2;
  }

  @keyframes ads-icon-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-icon-loading {
      animation-duration: var(--ads-motion-duration-spinner-reduced);
    }
  }
</style>
