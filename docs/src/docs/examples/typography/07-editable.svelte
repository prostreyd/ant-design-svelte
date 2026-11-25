<script lang="ts">
  import { Button, TypographyParagraph, TypographyText } from 'svelte-ant-design';
  import { HighlightOutlined } from 'svelte-ant-design/icons';

  let plain = $state('This is an editable text.');
  let custom = $state('Custom icon and tip.');
  let byText = $state('Click the text or the icon.');
  let limited = $state('No more than 20 chars');
  let held = $state('Open me from outside.');
  let holding = $state(false);
  let events = $state('No events yet');
</script>

<div class="stack">
  <div class="field">
    <span class="caption">bind:content, with the events</span>
    <TypographyParagraph
      bind:content={plain}
      editable={{
        onstart: () => (events = 'started'),
        onchange: (text) => (events = `changed to "${text}"`),
        onend: () => (events += ', ended'),
        oncancel: () => (events = 'cancelled')
      }}
    />
    <span role="status">{events}</span>
  </div>

  <div class="field">
    <span class="caption">icon, tooltip</span>
    <TypographyParagraph bind:content={custom} editable={{ icon: pencil, tooltip: 'Click to edit' }} />
  </div>

  <div class="field">
    <span class="caption">triggerType: ['icon', 'text']</span>
    <TypographyParagraph bind:content={byText} editable={{ triggerType: ['icon', 'text'] }} />
  </div>

  <div class="field">
    <span class="caption">maxLength, autoSize, no enter mark</span>
    <TypographyParagraph
      bind:content={limited}
      editable={{ maxLength: 20, autoSize: { maxRows: 3 }, enterIcon: null }}
    />
  </div>

  <div class="field">
    <span class="caption">bind:editing</span>
    <div class="row">
      <Button onclick={() => (holding = true)}>Edit the sentence</Button>
      <TypographyText type="secondary">{holding ? 'editing' : 'reading'}</TypographyText>
    </div>
    <TypographyParagraph bind:content={held} bind:editing={holding} editable={{ triggerType: [] }} />
  </div>

  {#snippet pencil()}<HighlightOutlined label="" />{/snippet}
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
