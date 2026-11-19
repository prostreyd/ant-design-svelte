<script lang="ts">
  import { Spin, Switch } from 'svelte-ant-design';

  let spinning = $state(true);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">spinning</span>
    <Switch bind:checked={spinning} aria-label="Spinning" />
  </div>

  <div class="field">
    <span class="caption">A standalone Spin: only the indicator</span>
    <!-- A Spin with no children is just the indicator. Not spinning, it renders nothing; the slot below keeps the height. -->
    <div class="slot">
      <Spin {spinning} aria-label="Loading the data" />
    </div>
    <span>spinning is {spinning}</span>
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

  .slot {
    display: flex;
    align-items: center;
    min-height: 32px;
  }
</style>
