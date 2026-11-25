<script lang="ts">
  import TextBase from './TextBase.svelte';
  import type { TypographyLinkProps } from './types.js';

  let {
    content = $bindable(),
    editing = $bindable(false),
    disabled = false,
    href,
    target,
    rel,
    onclick,
    ...rest
  }: TypographyLinkProps = $props();

  // `target="_blank"` without a `rel` gets `noopener noreferrer`; a `rel` that is given is kept as it is.
  const safeRel = $derived(rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined));
</script>

<!--
  A disabled link has no `href` (so it is no link and not in the Tab order), says `aria-disabled`, and its own `onclick` is not
  called. Its copy and edit buttons keep working.
-->
<TextBase
  tag="a"
  kind="link"
  bind:content
  bind:editing
  {disabled}
  href={disabled ? undefined : href}
  {target}
  rel={safeRel}
  aria-disabled={disabled ? 'true' : undefined}
  onclick={disabled ? undefined : onclick}
  {...rest}
/>
