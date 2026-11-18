<script lang="ts">
  /*
   * The few icons a Select needs (a chevron, a disc, a cross, a tick, an almond, a ring). They are decorative: the button
   * that holds one carries the accessible name. Drawn by the shared `internal/icons`.
   */
  import Icon from '../internal/icons/Icon.svelte';

  type IconName = 'arrow' | 'search' | 'clear' | 'check' | 'remove' | 'loading';

  let { name }: { name: IconName } = $props();
</script>

<Icon {name} class={`ads-select-icon ads-select-icon-${name}`} />
