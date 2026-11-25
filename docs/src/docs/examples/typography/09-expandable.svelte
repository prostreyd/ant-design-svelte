<script lang="ts">
  import { TypographyParagraph } from 'svelte-ant-design';

  const long =
    'Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers. Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers.';

  let note = $state('Nothing pressed yet');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">expandable</span>
    <TypographyParagraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>{long}</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">expandable: 'collapsible', onexpand</span>
    <TypographyParagraph
      ellipsis={{
        rows: 2,
        expandable: 'collapsible',
        onexpand: (_event, { expanded }) => (note = expanded ? 'Expanded' : 'Collapsed')
      }}
    >
      {long}
    </TypographyParagraph>
    <span role="status">{note}</span>
  </div>

  <div class="field">
    <span class="caption">symbol as a snippet</span>
    <TypographyParagraph ellipsis={{ rows: 2, expandable: 'collapsible', symbol }}>{long}</TypographyParagraph>
  </div>

  {#snippet symbol(expanded: boolean)}{expanded ? 'Show less' : 'Read on'}{/snippet}
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
