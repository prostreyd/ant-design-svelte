<script lang="ts">
  import type { Snippet } from 'svelte';
  import Modal from '../../src/lib/Modal/Modal.svelte';
  import type { ModalFooterContext, ModalProps } from '../../src/lib/Modal/types.js';

  /**
   * A Modal with the things a test needs around it: a button that opened it (focus goes back to it), a field in the body,
   * the bound value, and the snippets that a test cannot write in a script (the render form of the footer, `modalRender`).
   */
  let {
    open = $bindable(true),
    title,
    footer,
    footerAs,
    titleAs,
    wrap = false,
    bare = false,
    closeRightAway = false,
    ...rest
  }: ModalProps & { footerAs?: 'origin' | 'parts'; titleAs?: 'snippet'; wrap?: boolean; bare?: boolean; closeRightAway?: boolean } = $props();

  // A parent that closes the Modal in the same flush that opened it, before the layer is in the page.
  $effect(() => {
    if (closeRightAway && open) open = false;
  });
</script>

{#snippet titleSnippet()}<em data-testid="title-snippet">Rich title</em>{/snippet}
{#snippet footerOrigin(context: ModalFooterContext)}<span data-testid="footer-custom">{@render context.origin()}</span>{/snippet}
{#snippet footerParts(context: ModalFooterContext)}
  <span data-testid="ok-slot">{@render context.ok()}</span><span data-testid="cancel-slot">{@render context.cancel()}</span>
{/snippet}
{#snippet body()}<p data-testid="body">Body <input data-testid="field" aria-label="Field" /></p>{/snippet}
{#snippet wrapper(card: Snippet)}<div data-testid="wrapped">{@render card()}</div>{/snippet}

<button type="button" data-testid="opener" onclick={() => (open = true)}>Open</button>
<output data-testid="open-state">{open}</output>
<main data-testid="page"><button type="button" data-testid="page-button">Page</button></main>
<Modal
  bind:open
  title={titleAs === 'snippet' ? titleSnippet : title}
  footer={footerAs === 'origin' ? footerOrigin : footerAs === 'parts' ? footerParts : footer}
  modalRender={wrap ? wrapper : undefined}
  {...rest}
>
  {#if !bare}{@render body()}{/if}
</Modal>
