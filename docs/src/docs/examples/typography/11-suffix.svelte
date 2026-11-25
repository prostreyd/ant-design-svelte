<script lang="ts">
  import { TypographyParagraph } from 'svelte-ant-design';

  const quote =
    'To be, or not to be, that is the question: whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles, and by opposing end them. To die, to sleep; no more.';
  // Long enough to be cut at any width.
  const speech = [quote, quote, quote].join(' ');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">suffix, rows and expandable</span>
    <TypographyParagraph ellipsis={{ rows: 2, expandable: 'collapsible', suffix: '--William Shakespeare' }}>{speech}</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">suffix with a text that fits</span>
    <TypographyParagraph ellipsis={{ rows: 6, suffix: '--William Shakespeare' }}>{quote}</TypographyParagraph>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
    --ads-typography-paragraph-margin-bottom: 0;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
    width: 100%;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
