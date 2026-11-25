<script lang="ts">
  import { TypographyParagraph, TypographyText } from 'svelte-ant-design';

  const long =
    'Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers. Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers.';

  let cut = $state(false);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">one row, with a tooltip</span>
    <TypographyParagraph ellipsis={{ tooltip: true }}>{long}</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">rows={3}</span>
    <TypographyParagraph ellipsis={{ rows: 3 }}>{long}</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">onellipsis</span>
    <TypographyParagraph ellipsis={{ rows: 2, onellipsis: (value) => (cut = value) }}>{long}</TypographyParagraph>
    <span role="status">The text is {cut ? 'cut' : 'shown whole'}</span>
  </div>

  <div class="field">
    <span class="caption">a Text in a narrow box</span>
    <div class="narrow">
      <TypographyText ellipsis={{ tooltip: true }}>{long}</TypographyText>
    </div>
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

  .narrow {
    width: 200px;
    max-width: 100%;
  }
</style>
