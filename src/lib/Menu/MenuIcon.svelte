<script lang="ts">
  /*
   * The two icons a Menu needs, drawn from plain geometry: the arrow of a submenu and the "…" of the overflow item.
   * They are decorative: the item that holds one carries the accessible name.
   */
  let { name }: { name: 'arrow' | 'ellipsis' } = $props();
</script>

{#if name === 'arrow'}
  <svg class="ads-menu-icon" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
    <path d="M3.2 6l4.8 4.8L12.8 6" />
  </svg>
{:else}
  <svg class="ads-menu-icon ads-menu-icon-ellipsis" viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
    <circle cx="3" cy="8" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="13" cy="8" r="1.3" />
  </svg>
{/if}

<style>
  .ads-menu-icon {
    display: block;
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .ads-menu-icon-ellipsis circle {
    fill: currentColor;
    stroke: none;
  }
</style>
