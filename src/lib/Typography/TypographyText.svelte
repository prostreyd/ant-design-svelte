<script lang="ts">
  import TextBase from './TextBase.svelte';
  import type { TypographyTextProps } from './types.js';

  let { content = $bindable(), editing = $bindable(false), ...rest }: TypographyTextProps = $props();
</script>

<TextBase tag="span" kind="text" bind:content bind:editing {...rest} />
