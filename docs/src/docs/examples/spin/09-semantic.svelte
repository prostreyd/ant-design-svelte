<script lang="ts">
  import { Spin } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">classNames: a class for each part (the CSS is in this example)</span>
    <Spin
      description="Loading"
      classNames={{ indicator: 'demo-indicator', description: 'demo-description' }}
    />
  </div>

  <div class="field">
    <span class="caption">styles: inline styles, custom properties included</span>
    <Spin
      description="Loading"
      styles={{
        root: { '--ads-spin-color': '#52c41a' },
        description: { 'font-weight': 700, 'letter-spacing': '1px' }
      }}
    />
  </div>

  <div class="field">
    <span class="caption">class and style go to the root; container is the covered content</span>
    <Spin
      description="Loading"
      class="demo-root"
      style="border-radius: 8px"
      classNames={{ container: 'demo-container' }}
      styles={{ section: { 'gap': '4px' } }}
    >
      <div class="panel">Covered content</div>
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

  :global(.demo-indicator) {
    color: #fa541c;
  }

  :global(.demo-description) {
    color: #fa541c;
    font-style: italic;
  }

  :global(.demo-root) {
    background: var(--ads-color-bg-container);
  }

  :global(.demo-container) {
    border-radius: 8px;
  }
</style>
