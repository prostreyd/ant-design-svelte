<script lang="ts">
  import { HomeOutlined, SettingOutlined, SmileOutlined } from 'svelte-ant-design/icons';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">no props: the size and the color of the text</span>
    <div class="row">
      <HomeOutlined />
      <SettingOutlined />
      <SmileOutlined />
    </div>
  </div>

  <div class="field">
    <span class="caption">font-size and color set on the parent</span>
    <div class="row big">
      <HomeOutlined />
      <SettingOutlined />
      <SmileOutlined />
    </div>
  </div>

  <div class="field">
    <span class="caption">inside a line of text</span>
    <p class="line">Your settings <SettingOutlined /> are saved <SmileOutlined />.</p>
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
    gap: 12px;
  }

  .big {
    color: var(--ads-color-primary);
    font-size: 28px;
  }

  .line {
    margin: 0;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
