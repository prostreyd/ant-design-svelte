<script lang="ts">
  /*
   * The few icons the input family needs (a circle, a cross, an almond, a ring). They are decorative: the button that holds
   * one carries the accessible name. Drawn by the shared `internal/icons`.
   */
  import Icon from '../internal/icons/Icon.svelte';

  type IconName = 'clear' | 'eye' | 'eye-off' | 'search' | 'loading';

  let { name }: { name: IconName } = $props();
</script>

<Icon {name} class={`ads-input-icon ads-input-icon-${name}`} />
