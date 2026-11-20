<script lang="ts">
  import { Switch } from 'svelte-ant-design';
  import { ArrowUpOutlined, LoadingOutlined, RocketOutlined, SyncOutlined } from 'svelte-ant-design/icons';

  let spinning = $state(true);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">spin: the switch turns it on and off</span>
    <div class="row">
      <Switch bind:checked={spinning} aria-label="Spin" />
      <SyncOutlined spin={spinning} />
    </div>
  </div>

  <div class="field">
    <span class="caption">the loading icon turns by itself</span>
    <div class="row">
      <LoadingOutlined />
    </div>
  </div>

  <div class="field">
    <span class="caption">rotate: 0, 90, 180 and 270 degrees</span>
    <div class="row">
      <ArrowUpOutlined rotate={0} />
      <ArrowUpOutlined rotate={90} />
      <ArrowUpOutlined rotate={180} />
      <ArrowUpOutlined rotate={270} />
    </div>
  </div>

  <div class="field">
    <span class="caption">rotate and spin together</span>
    <div class="row">
      <RocketOutlined rotate={45} spin />
    </div>
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
    gap: 16px;
    font-size: 24px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
