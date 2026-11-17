<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- A Row inside a Col fills the content box of the column and has a gutter of its own. -->
<div class="stack">
  <div class="field">
    <span class="caption">Outer gutter 16; the inner Row on the left has gutter 4, the one on the right none</span>
    <Row gutter={16}>
      <Col span={12}>
        <Row gutter={4}>
          <Col span={12}><div class="box">12 / 24 of 12</div></Col>
          <Col span={12}><div class="box alt">12 / 24 of 12</div></Col>
        </Row>
      </Col>
      <Col span={12}>
        <Row>
          <Col span={8}><div class="box">8</div></Col>
          <Col span={16}><div class="box alt">16</div></Col>
        </Row>
      </Col>
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
