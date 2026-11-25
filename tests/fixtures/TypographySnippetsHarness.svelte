<script lang="ts">
  import TypographyParagraph from '$lib/Typography/TypographyParagraph.svelte';
  import type { TypographyBaseProps } from '$lib/Typography/types.js';

  // Real snippets (a raw snippet is drawn once and cannot follow a state): the ones that take an argument.
  let {
    which,
    props = {},
    copyText
  }: { which: 'copyIcon' | 'symbol' | 'tooltips' | 'enterIcon' | 'editIcon'; props?: TypographyBaseProps; copyText?: () => Promise<string> } = $props();
</script>

{#snippet copyIcon(copied: boolean)}<i data-copied={String(copied)}>icon</i>{/snippet}
{#snippet symbol(expanded: boolean)}<i data-symbol={String(expanded)}>{expanded ? 'less' : 'more'}</i>{/snippet}
{#snippet tipA()}<b>Tip A</b>{/snippet}
{#snippet tipB()}<b>Tip B</b>{/snippet}
{#snippet enterIcon()}<i data-enter>enter</i>{/snippet}
{#snippet editIcon()}<i data-edit>pen</i>{/snippet}

{#if which === 'copyIcon'}
  <TypographyParagraph {...props} copyable={{ icon: copyIcon, text: copyText }} content="x" />
{:else if which === 'symbol'}
  <TypographyParagraph {...props} content={'word '.repeat(80)} ellipsis={{ rows: 2, expandable: 'collapsible', symbol }} />
{:else if which === 'tooltips'}
  <TypographyParagraph {...props} copyable={{ tooltips: [tipA, tipB] }} content="x" />
{:else if which === 'enterIcon'}
  <TypographyParagraph {...props} editable={{ enterIcon }} content="x" />
{:else}
  <TypographyParagraph {...props} editable={{ icon: editIcon }} content="x" />
{/if}
