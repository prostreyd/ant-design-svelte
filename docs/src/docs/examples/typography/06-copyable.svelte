<script lang="ts">
  import { TypographyParagraph, TypographyText } from 'svelte-ant-design';
  import { SmileFilled, SmileOutlined } from 'svelte-ant-design/icons';

  let copied = $state('Nothing copied yet');
  let requested = $state('Not requested yet');

  async function fetchText(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    requested = 'The text was requested';
    return 'Text from the server';
  }
</script>

<div class="stack">
  <div class="field">
    <span class="caption">copyable</span>
    <TypographyParagraph copyable={{ oncopy: () => (copied = 'The sentence was copied') }}>This is a copyable text.</TypographyParagraph>
    <span role="status">{copied}</span>
  </div>

  <div class="field">
    <span class="caption">text: the copy is not the shown text</span>
    <TypographyParagraph copyable={{ text: 'Hello, clipboard!' }}>Copy something else.</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">text: a function that returns a promise</span>
    <TypographyParagraph copyable={{ text: fetchText }}>Ask the server for the text.</TypographyParagraph>
    <span role="status">{requested}</span>
  </div>

  <div class="field">
    <span class="caption">icon, tooltips</span>
    <TypographyParagraph copyable={{ icon, tooltips: ['Copy the greeting', 'Done'] }}>Own icon and tips.</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">tooltips: false</span>
    <TypographyParagraph copyable={{ tooltips: false }}>No tip, the button keeps its name.</TypographyParagraph>
  </div>

  <div class="field">
    <span class="caption">a Text with only the button</span>
    <TypographyText copyable={{ text: 'icon only' }} content="" />
  </div>

  {#snippet icon(done: boolean)}
    {#if done}<SmileFilled label="" />{:else}<SmileOutlined label="" />{/if}
  {/snippet}
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
