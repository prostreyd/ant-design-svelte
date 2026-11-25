<script lang="ts">
  import TextBase from './TextBase.svelte';
  import type { TypographyParagraphProps } from './types.js';

  let { content = $bindable(), editing = $bindable(false), expanded = $bindable(false), ...rest }: TypographyParagraphProps = $props();
</script>

<TextBase tag="div" kind="paragraph" bind:content bind:editing bind:expanded {...rest} />
