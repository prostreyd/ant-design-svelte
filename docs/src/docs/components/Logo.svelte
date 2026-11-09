<script lang="ts">
  import { LOGO_BLUE, LOGO_RED, LOGO_S, LOGO_VIEWBOX } from '#docs/logo-paths';

  /** `frameOnly` leaves out the S, for the large decoration around the hero showcase. */
  let { frameOnly = false }: { frameOnly?: boolean } = $props();
</script>

<svg viewBox={LOGO_VIEWBOX} aria-hidden="true" focusable="false">
  <path class="lg-red" fill-rule="evenodd" d={LOGO_RED} />
  {#if !frameOnly}<path class="lg-red" fill-rule="evenodd" d={LOGO_S} />{/if}
  <path class="lg-blue" fill-rule="evenodd" d={LOGO_BLUE} />
</svg>
