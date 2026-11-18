<script lang="ts">
  /*
   * The two icons a Menu needs: the arrow of a submenu and the "…" of the overflow item. They are decorative: the item that
   * holds one carries the accessible name. Drawn by the shared `internal/icons`.
   */
  import Icon from '../internal/icons/Icon.svelte';

  let { name }: { name: 'arrow' | 'ellipsis' } = $props();
</script>

<Icon {name} class={name === 'ellipsis' ? 'ads-menu-icon ads-menu-icon-ellipsis' : 'ads-menu-icon'} />
