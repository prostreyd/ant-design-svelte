<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let none = $state(false);
  let text = $state(false);
  let custom = $state(false);
  let parts = $state(false);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">footer: null</span>
    <Button onclick={() => (none = true)}>No footer</Button>
    <Modal bind:open={none} title="No footer" footer={null}><p>The Modal has no footer and no gap under the text.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">footer as a text</span>
    <Button onclick={() => (text = true)}>Footer text</Button>
    <Modal bind:open={text} title="Footer text" footer="Saved 2 minutes ago"><p>A string (or a number) is the footer.</p></Modal>
  </div>

  <div class="field">
    <span class="caption">the render form: origin keeps both buttons</span>
    <Button onclick={() => (custom = true)}>Custom footer</Button>
    <Modal bind:open={custom} title="Custom footer">
      <p>The footer gets <code>origin</code>, <code>ok</code> and <code>cancel</code>.</p>
      {#snippet footer({ origin })}
        <Button type="link" onclick={() => (custom = false)}>Skip</Button>
        {@render origin()}
      {/snippet}
    </Modal>
  </div>

  <div class="field">
    <span class="caption">the render form: ok and cancel placed apart</span>
    <Button onclick={() => (parts = true)}>Buttons apart</Button>
    <Modal bind:open={parts} title="Buttons apart">
      <p>The two buttons are placed by hand.</p>
      {#snippet footer({ ok, cancel })}
        <div class="row" style="justify-content: space-between; width: 100%">
          {@render cancel()}
          {@render ok()}
        </div>
      {/snippet}
    </Modal>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
