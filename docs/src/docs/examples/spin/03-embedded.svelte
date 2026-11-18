<script lang="ts">
  import { Button, Spin, Switch } from 'svelte-ant-design';

  let loading = $state(true);
  let presses = $state(0);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">spinning</span>
    <Switch bind:checked={loading} aria-label="Spinning" />
  </div>

  <div class="field">
    <span class="caption">Spin with children: the content is dimmed and ignores the mouse</span>
    <!--
      The content stays reachable with the keyboard: Tab to the button and press Enter while it is dimmed. Something
      that must not run twice (a form being sent) has to guard itself.
    -->
    <Spin spinning={loading} description="Loading the report">
      <div class="panel">
        <p>The report has three rows.</p>
        <Button onclick={() => (presses += 1)}>Press me</Button>
      </div>
    </Spin>
    <span>The button was pressed {presses} times</span>
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
    height: 190px;
    padding: 16px;
    border: 1px solid var(--ads-color-border);
    border-radius: 8px;
  }

  p {
    margin: 0 0 12px;
  }
</style>
