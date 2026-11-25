<script lang="ts">
  import { classList, styleText } from '../internal/semantic.js';
  import Decorations from './Decorations.svelte';
  import type { TypographyProps } from './types.js';

  let { children, classNames, styles, class: customClass, style: customStyle, ...rest }: TypographyProps = $props();
</script>

<Decorations />

<article
  {...rest}
  class={classList('ads-typography', 'ads-typography-article', customClass, classNames?.root)}
  style={styleText(customStyle, styles?.root)}
>
  {@render children?.()}
</article>

<!--
  The plain tags a consumer writes inside the article cannot be reached by scoped styles (they are not in this file), so they are
  styled with descendant selectors under the article's own class, and nothing outside it is touched (Q5 of specs/typography.md).
  Only **plain** tags: an element with a class of the library (`ads-...`, a heading of `TypographyTitle`, a list of `Menu`) keeps its
  own look. The condition sits in `:where()`, so it adds no weight to a selector. `table` is reserved for v1.1. What the article
  shares with the text parts (`strong`, `mark`, `code`, `kbd`, links) is in `Decorations.svelte`.
-->
<style>
  .ads-typography-article {
    display: block;
    box-sizing: border-box;
    color: var(--ads-typography-color);
    font-family: var(--ads-font-family);
    font-size: var(--ads-typography-font-size);
    line-height: var(--ads-typography-line-height);
    overflow-wrap: break-word;
  }

  .ads-typography-article :global(h1:where(:not([class^='ads-'], [class*=' ads-']))),
  .ads-typography-article :global(h2:where(:not([class^='ads-'], [class*=' ads-']))),
  .ads-typography-article :global(h3:where(:not([class^='ads-'], [class*=' ads-']))),
  .ads-typography-article :global(h4:where(:not([class^='ads-'], [class*=' ads-']))),
  .ads-typography-article :global(h5:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin-block: var(--ads-typography-title-margin-top) var(--ads-typography-title-margin-bottom);
    color: var(--ads-typography-color);
    font-weight: var(--ads-typography-title-weight);
  }

  .ads-typography-article :global(h1:where(:not([class^='ads-'], [class*=' ads-'])):first-child),
  .ads-typography-article :global(h2:where(:not([class^='ads-'], [class*=' ads-'])):first-child),
  .ads-typography-article :global(h3:where(:not([class^='ads-'], [class*=' ads-'])):first-child),
  .ads-typography-article :global(h4:where(:not([class^='ads-'], [class*=' ads-'])):first-child),
  .ads-typography-article :global(h5:where(:not([class^='ads-'], [class*=' ads-'])):first-child) {
    margin-block-start: 0;
  }

  .ads-typography-article :global(h1:where(:not([class^='ads-'], [class*=' ads-']))) {
    font-size: var(--ads-typography-h1-font-size);
    line-height: var(--ads-typography-h1-line-height);
  }

  .ads-typography-article :global(h2:where(:not([class^='ads-'], [class*=' ads-']))) {
    font-size: var(--ads-typography-h2-font-size);
    line-height: var(--ads-typography-h2-line-height);
  }

  .ads-typography-article :global(h3:where(:not([class^='ads-'], [class*=' ads-']))) {
    font-size: var(--ads-typography-h3-font-size);
    line-height: var(--ads-typography-h3-line-height);
  }

  .ads-typography-article :global(h4:where(:not([class^='ads-'], [class*=' ads-']))) {
    font-size: var(--ads-typography-h4-font-size);
    line-height: var(--ads-typography-h4-line-height);
  }

  .ads-typography-article :global(h5:where(:not([class^='ads-'], [class*=' ads-']))) {
    font-size: var(--ads-typography-h5-font-size);
    line-height: var(--ads-typography-h5-line-height);
  }

  .ads-typography-article :global(p:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin-block-end: var(--ads-typography-paragraph-margin-bottom);
  }

  /* A first paragraph does not push its box down; between paragraphs the space above stays the browser's or the application's. */
  .ads-typography-article :global(p:where(:not([class^='ads-'], [class*=' ads-'])):first-child) {
    margin-block-start: 0;
  }

  .ads-typography-article :global(ul:where(:not([class^='ads-'], [class*=' ads-']))),
  .ads-typography-article :global(ol:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin: 0 0 var(--ads-typography-paragraph-margin-bottom);
    padding: 0;
  }

  .ads-typography-article :global(li:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin-block: 0;
    margin-inline: 20px 0;
    padding-block: 0;
    padding-inline: 4px 0;
  }

  .ads-typography-article :global(ul > li:where(:not([class^='ads-'], [class*=' ads-']))) {
    list-style-type: circle;
  }

  .ads-typography-article :global(ul > li > ul > li:where(:not([class^='ads-'], [class*=' ads-']))) {
    list-style-type: square;
  }

  .ads-typography-article :global(blockquote:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin-block: var(--ads-typography-paragraph-margin-bottom);
    margin-inline: 0;
    padding-block: 0;
    padding-inline: 0.6em 0;
    border: 0;
    border-inline-start: 4px solid var(--ads-typography-blockquote-border);
  }

  .ads-typography-article :global(pre:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin: 0 0 var(--ads-typography-paragraph-margin-bottom);
    padding: 0.4em 0.6em;
    overflow: auto;
    border: 1px solid var(--ads-typography-code-border);
    border-radius: 3px;
    background: var(--ads-typography-code-bg);
    font-family: var(--ads-typography-code-font-family);
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .ads-typography-article :global(pre code:where(:not([class^='ads-'], [class*=' ads-']))) {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font-size: inherit;
  }
</style>
