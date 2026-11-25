<script lang="ts">
  import { isProduction } from '../internal/env.js';
  import TextBase from './TextBase.svelte';
  import { TYPOGRAPHY_LEVELS, type TypographyTitleProps } from './types.js';

  let { level = 1, content = $bindable(), editing = $bindable(false), expanded = $bindable(false), ...rest }: TypographyTitleProps & {
    content?: string;
    editing?: boolean;
    expanded?: boolean;
  } = $props();

  // `1` to `5`. Anything else throws while developing and means `1` in a production build.
  const resolvedLevel = $derived.by(() => {
    if ((TYPOGRAPHY_LEVELS as readonly unknown[]).includes(level)) return level;
    if (!isProduction()) throw new RangeError(`TypographyTitle level must be one of: ${TYPOGRAPHY_LEVELS.join(', ')}.`);
    return 1;
  });
</script>

<TextBase tag={`h${resolvedLevel}`} kind="title" level={resolvedLevel} bind:content bind:editing bind:expanded {...rest} />
