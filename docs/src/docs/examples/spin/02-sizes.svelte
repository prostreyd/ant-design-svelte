<script lang="ts">
  import { Spin } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">size="small" (14 px)</span>
    <Spin size="small" aria-label="Loading, small" />
  </div>

  <div class="field">
    <span class="caption">size="medium" (20 px, the default)</span>
    <Spin size="medium" aria-label="Loading, medium" />
  </div>

  <div class="field">
    <span class="caption">size="large" (32 px)</span>
    <Spin size="large" aria-label="Loading, large" />
  </div>

  <div class="field">
    <span class="caption">size="default" (an alias of medium)</span>
    <Spin size="default" aria-label="Loading, default" />
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

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
