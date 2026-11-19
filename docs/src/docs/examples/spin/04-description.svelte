<script lang="ts">
  import { Spin } from 'svelte-ant-design';
</script>

<!-- The text of the description is what a screen reader announces, so a Spin with one needs no aria-label. -->
{#snippet detail()}
  <strong>Saving</strong> <small>(this takes a moment)</small>
{/snippet}

<div class="stack">
  <div class="field">
    <span class="caption">description as a string, standalone</span>
    <Spin description="Loading" />
  </div>

  <div class="field">
    <span class="caption">description as a snippet, standalone</span>
    <Spin description={detail} />
  </div>

  <div class="field">
    <span class="caption">description over embedded content</span>
    <Spin description="Loading the table">
      <div class="panel">Rows that are being loaded.</div>
    </Spin>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  .panel {
    box-sizing: border-box;
    width: 280px;
    height: 120px;
    padding: 16px;
    border: 1px solid var(--ads-color-border);
    border-radius: 8px;
  }
</style>
