<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Menu from '$lib/Menu/Menu.svelte';

  // A parent that holds `openKeys` itself and refuses every change (a fully controlled menu).
  let { openKeys = [], ...rest }: ComponentProps<typeof Menu> = $props();
</script>

<Menu bind:openKeys={() => openKeys, () => {}} {...rest} />
