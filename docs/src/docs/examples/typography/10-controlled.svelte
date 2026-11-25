<script lang="ts">
  import { Switch, TypographyParagraph } from 'svelte-ant-design';

  const long =
    'Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers. Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers.';

  let open = $state(false);
  let rows = $state(2);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">bind:expanded</span>
    <div class="row">
      <Switch bind:checked={open} aria-label="Show the whole text" />
      <span>{open ? 'expanded' : 'cut'}</span>
    </div>
    <TypographyParagraph bind:expanded={open} ellipsis={{ rows: 2, expandable: 'collapsible' }}>{long}</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">rows, with a slider</span>
    <label class="row">
      Rows: {rows}
      <input type="range" min="1" max="6" bind:value={rows} />
    </label>
    <TypographyParagraph ellipsis={{ rows, expandable: true }}>{long}</TypographyParagraph>
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
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
