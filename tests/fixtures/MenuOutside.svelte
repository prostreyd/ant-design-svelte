<script lang="ts">
  import { MenuItem, MenuSubMenu, MenuItemGroup, MenuDivider } from '$lib';

  let { component }: { component: 'item' | 'submenu' | 'group' | 'divider' } = $props();
</script>

{#if component === 'item'}
  <MenuItem key="x">X</MenuItem>
{:else if component === 'submenu'}
  <MenuSubMenu key="x" label="X" />
{:else if component === 'group'}
  <MenuItemGroup label="X" />
{:else}
  <MenuDivider />
{/if}
