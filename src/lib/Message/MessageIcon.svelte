<script lang="ts">
  /*
   * The icons of a message: a disc with the sign cut out of it, a spinner, and a cross. They are decorative: the text, the
   * hidden type word and the name of the close button carry the meaning. Drawn by the shared `internal/icons`.
   */
  import Icon from '../internal/icons/Icon.svelte';

  type IconName = 'info' | 'success' | 'error' | 'warning' | 'loading' | 'close';

  let { name }: { name: IconName } = $props();
</script>

<Icon {name} class={`ads-message-svg ads-message-svg-${name}`} />
