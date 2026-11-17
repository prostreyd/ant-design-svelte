<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- order changes how the columns are drawn, not their place in the DOM (a screen reader and Tab keep the written order). -->
<div class="stack">
  <div class="field">
    <span class="caption">Written 1, 2, 3, 4; drawn 1, 2, 3, 4</span>
    <Row>
      <Col span={6} order={1}><div class="box">1 order-1</div></Col>
      <Col span={6} order={2}><div class="box alt">2 order-2</div></Col>
      <Col span={6} order={3}><div class="box">3 order-3</div></Col>
      <Col span={6} order={4}><div class="box alt">4 order-4</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">Written 1, 2, 3, 4; drawn 4, 3, 2, 1</span>
    <Row>
      <Col span={6} order={4}><div class="box">1 order-4</div></Col>
      <Col span={6} order={3}><div class="box alt">2 order-3</div></Col>
      <Col span={6} order={2}><div class="box">3 order-2</div></Col>
      <Col span={6} order={1}><div class="box alt">4 order-1</div></Col>
    </Row>
  </div>
</div>

<style>
  .stack {
    display: grid;
    gap: 20px;
    width: 100%;
  }

  .field {
    display: grid;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  .box {
    padding: 8px 4px;
    text-align: center;
    font-size: 13px;
    color: var(--ads-color-text);
    background: var(--ads-color-bg-text-hover);
    border: 1px solid var(--ads-color-primary-solid);
    border-radius: 4px;
  }

  .alt {
    background: var(--ads-color-bg-container);
  }
</style>
