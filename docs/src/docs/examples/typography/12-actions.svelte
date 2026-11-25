<script lang="ts">
  import { TypographyParagraph } from 'svelte-ant-design';

  let text = $state('Buttons after the text.');
  let other = $state('Buttons before the text.');
  const long =
    'Ant Design, a design language for background applications, is refined by Ant UED Team. It aims to make the interface specifications of internal projects uniform, to lower the cost of design differences and of implementation, and to free the time of designers and front-end developers.';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">actions.placement: 'end'</span>
    <TypographyParagraph bind:content={text} editable copyable />
  </div>

  <div class="field">
    <span class="caption">actions.placement: 'start'</span>
    <TypographyParagraph bind:content={other} editable copyable actions={{ placement: 'start' }} />
  </div>

  <div class="field">
    <span class="caption">expand, edit and copy together</span>
    <TypographyParagraph content={long} editable copyable ellipsis={{ rows: 2, expandable: true }} />
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
