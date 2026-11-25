<script lang="ts">
  import { TypographyParagraph } from 'svelte-ant-design';

  let text = $state('Styled by part.');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">classNames: a class for each part (the CSS is in this example)</span>
    <TypographyParagraph
      bind:content={text}
      copyable
      editable
      classNames={{ root: 'demo-root', actions: 'demo-actions', action: 'demo-action', textarea: 'demo-textarea' }}
    />
  </div>

  <div class="field">
    <span class="caption">styles: inline styles, custom properties included</span>
    <TypographyParagraph
      copyable
      styles={{
        root: { '--ads-typography-action-color': '#722ed1' },
        actions: { 'margin-inline-start': '12px' }
      }}
    >
      Purple buttons, further from the text.
    </TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">class and style</span>
    <TypographyParagraph class="demo-note" style="padding-inline-start: 8px">A note with a bar.</TypographyParagraph>
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

  :global(.demo-root) {
    font-weight: 600;
  }

  :global(.demo-actions) {
    border-inline-start: 1px solid var(--ads-color-border);
    padding-inline-start: 4px;
  }

  :global(.demo-action) {
    transform: scale(1.15);
  }

  :global(.demo-textarea) {
    font-style: italic;
  }

  :global(.demo-note) {
    border-inline-start: 3px solid var(--ads-color-primary);
  }
</style>
