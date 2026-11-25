<script lang="ts">
  import { TypographyLink, TypographyParagraph } from 'svelte-ant-design';

  let clicks = $state(0);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">href, target</span>
    <TypographyLink href="https://svelte.dev" target="_blank">svelte.dev</TypographyLink>
  </div>

  <div class="field">
    <span class="caption">type</span>
    <TypographyLink href="#api" type="danger">A dangerous link</TypographyLink>
  </div>

  <div class="field">
    <span class="caption">disabled (the copy button still works)</span>
    <TypographyLink href="#api" disabled copyable>Not available</TypographyLink>
  </div>

  <div class="field">
    <span class="caption">a plain &lt;a&gt; inside a part</span>
    <TypographyParagraph>Read the <a href="#api">table of properties</a> first.</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">onclick</span>
    <TypographyLink href="#api" onclick={() => (clicks += 1)}>Count the clicks</TypographyLink>
    <span role="status">Clicked {clicks} times</span>
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
