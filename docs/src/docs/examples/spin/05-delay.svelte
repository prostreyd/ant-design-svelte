<script lang="ts">
  import { Button, Spin } from 'svelte-ant-design';

  let loading = $state(false);
  let last = $state('Nothing has been loaded yet');

  function load(ms: number) {
    loading = true;
    last = `Loading, it will take ${ms} ms`;
    setTimeout(() => {
      loading = false;
      last = `Loaded in ${ms} ms`;
    }, ms);
  }
</script>

<div class="stack">
  <div class="field">
    <span class="caption">delay=&#123;500&#125;: the indicator waits half a second</span>
    <div class="row">
      <Button disabled={loading} onclick={() => load(200)}>Load fast (200 ms)</Button>
      <Button disabled={loading} onclick={() => load(2000)}>Load slow (2 s)</Button>
    </div>
  </div>

  <div class="field">
    <span class="caption">A load shorter than the delay never shows the indicator</span>
    <Spin spinning={loading} delay={500} description="Loading">
      <div class="panel">The content of the panel.</div>
    </Spin>
    <span role="status">{last}</span>
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

  .panel {
    box-sizing: border-box;
    width: 280px;
    height: 120px;
    padding: 16px;
    border: 1px solid var(--ads-color-border);
    border-radius: 8px;
  }
</style>
