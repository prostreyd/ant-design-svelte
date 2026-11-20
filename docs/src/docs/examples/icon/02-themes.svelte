<script lang="ts">
  import { HeartFilled, HeartOutlined, HeartTwoTone, StarFilled, StarOutlined, StarTwoTone } from 'svelte-ant-design/icons';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">StarOutlined, StarFilled, StarTwoTone</span>
    <div class="row">
      <StarOutlined />
      <StarFilled />
      <StarTwoTone />
    </div>
  </div>

  <div class="field">
    <span class="caption">HeartOutlined, HeartFilled, HeartTwoTone</span>
    <div class="row">
      <HeartOutlined />
      <HeartFilled />
      <HeartTwoTone />
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
    font-size: 28px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
