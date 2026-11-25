<!--
  The look of `strong`, `mark`, `code`, `kbd` and links inside the article and any part of Typography: the tags the decorations draw,
  and the plain tags a consumer writes there (Q5 of specs/typography.md). It draws nothing. It is a component of its own because the
  article and the parts both need these rules, and an application's build keeps the styles of the components it renders, not of the
  others.
-->
<style>
  :global(.ads-typography strong) {
    font-weight: 600;
  }

  :global(.ads-typography mark) {
    padding: 0;
    color: var(--ads-typography-mark-color);
    background: var(--ads-typography-mark-bg);
  }

  :global(.ads-typography code) {
    margin-inline: 0.2em;
    padding: 0.2em 0.4em 0.1em;
    border: 1px solid var(--ads-typography-code-border);
    border-radius: 3px;
    background: var(--ads-typography-code-bg);
    font-family: var(--ads-typography-code-font-family);
    font-size: 85%;
  }

  :global(.ads-typography kbd) {
    margin-inline: 0.2em;
    padding: 0.15em 0.4em 0.1em;
    border: 1px solid var(--ads-typography-code-border);
    border-bottom-width: 2px;
    border-radius: 3px;
    background: var(--ads-typography-kbd-bg);
    font-family: var(--ads-typography-code-font-family);
    font-size: 90%;
  }

  /* A link is an anchor with `href`, and looks like a `TypographyLink`; a named anchor without one stays text. */
  :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-']))) {
    color: var(--ads-typography-link-color);
    text-decoration: var(--ads-typography-link-decoration);
    transition: color var(--ads-typography-transition);
  }

  :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-'])):hover) {
    color: var(--ads-typography-link-hover-color);
  }

  :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-'])):active) {
    color: var(--ads-typography-link-active-color);
  }

  :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-'])):focus-visible) {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-']))) {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :global(.ads-typography a:where([href]:not([class^='ads-'], [class*=' ads-']))) {
      color: LinkText;
    }

    /* `Highlight`, not `Mark`: the engines of the browser floor do not know the newer names. */
    :global(.ads-typography mark) {
      forced-color-adjust: none;
      color: HighlightText;
      background: Highlight;
    }
  }
</style>
