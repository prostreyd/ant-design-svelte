<script lang="ts">
  import { untrack } from 'svelte';
  import TypographyLink from '$lib/Typography/TypographyLink.svelte';
  import TypographyParagraph from '$lib/Typography/TypographyParagraph.svelte';
  import TypographyText from '$lib/Typography/TypographyText.svelte';
  import TypographyTitle from '$lib/Typography/TypographyTitle.svelte';

  // A part with its text given as `content` (bound) or as a child, and its three bound values printed, so a test can see what the
  // bindings carry back to the parent.
  interface Props {
    kind?: 'title' | 'paragraph' | 'text' | 'link';
    text?: string;
    asContent?: boolean;
    props?: Record<string, unknown>;
  }

  let { kind = 'paragraph', text = 'Hello', asContent = false, props = {} }: Props = $props();

  const parts = { title: TypographyTitle, paragraph: TypographyParagraph, text: TypographyText, link: TypographyLink };
  const Part = $derived(parts[kind]);
  let content = $state(untrack(() => text));
  let editing = $state(untrack(() => Boolean(props.editing)));
  let expanded = $state(untrack(() => Boolean(props.expanded)));
  const rest = $derived.by(() => {
    const others = { ...props };
    delete others.editing;
    delete others.expanded;
    return others;
  });

</script>

{#snippet child()}{text}{/snippet}

{#if asContent}
  <Part {...rest} bind:content bind:editing bind:expanded />
{:else}
  <Part {...rest} bind:editing bind:expanded>{@render child()}</Part>
{/if}
<output data-testid="content">{content}</output>
<output data-testid="editing">{String(editing)}</output>
<output data-testid="expanded">{String(expanded)}</output>
<button type="button" data-testid="toggle-editing" onclick={() => (editing = !editing)}>toggle editing</button>
<button type="button" data-testid="toggle-expanded" onclick={() => (expanded = !expanded)}>toggle expanded</button>
