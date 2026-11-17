<script lang="ts">
  import { Menu, MenuItem } from '$lib';

  // Markup components inside a plain element: their markers are nested one level deeper than the children of the Menu.
  let { showMiddle = false }: { showMiddle?: boolean } = $props();
</script>

<Menu aria-label="Wrapped">
  <MenuItem key="first">First</MenuItem>
  <div>
    {#if showMiddle}<MenuItem key="middle">Middle</MenuItem>{/if}
    <MenuItem key="inside">Inside</MenuItem>
  </div>
  <MenuItem key="last">Last</MenuItem>
</Menu>
