<script lang="ts">
  import { BellOutlined, StarOutlined } from 'svelte-ant-design/icons';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">no label: an image named by the drawing (star)</span>
    <div class="row">
      <StarOutlined />
    </div>
  </div>

  <div class="field">
    <span class="caption">label="Favourite": your own name, in your own language</span>
    <div class="row">
      <StarOutlined label="Favourite" />
    </div>
  </div>

  <div class="field">
    <span class="caption">label="": hidden from assistive technology, next to visible text</span>
    <div class="row">
      <BellOutlined label="" />
      <span>Notifications</span>
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
    gap: 8px;
    font-size: 20px;
  }

  .row span {
    font-size: 14px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
