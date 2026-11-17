<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- offset skips that many columns before the column. -->
<div class="stack">
  <Row>
    <Col span={8}><div class="box">col-8</div></Col>
    <Col span={8} offset={8}><div class="box alt">col-8 offset-8</div></Col>
  </Row>
  <Row>
    <Col span={6} offset={6}><div class="box">col-6 offset-6</div></Col>
    <Col span={6} offset={6}><div class="box alt">col-6 offset-6</div></Col>
  </Row>
  <Row>
    <Col span={12} offset={6}><div class="box">col-12 offset-6</div></Col>
  </Row>
</div>

<style>
  .stack {
    display: grid;
    gap: 20px;
    width: 100%;
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
