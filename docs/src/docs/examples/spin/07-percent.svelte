<script lang="ts">
  import { Spin } from 'svelte-ant-design';

  let percent = $state(35);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">percent: a number from 0 to 100</span>
    <label class="row">
      <input type="range" min="0" max="100" bind:value={percent} />
      <span>{percent}%</span>
    </label>
    <!-- The ring is a progressbar; the description is its name. -->
    <Spin {percent} description="Uploading" />
  </div>

  <div class="field">
    <span class="caption">percent="auto": an indeterminate ring, no value</span>
    <Spin percent="auto" description="Preparing" />
  </div>

  <div class="field">
    <span class="caption">percent with size="large"</span>
    <Spin percent={70} size="large" aria-label="Upload progress" />
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
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
