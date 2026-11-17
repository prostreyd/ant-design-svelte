<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- Columns go into a Row. A column takes span of the 24; the Row is as wide as its parent. -->
<div class="stack">
  <Row>
    <Col span={24}><div class="box">col-24</div></Col>
  </Row>
  <Row>
    <Col span={12}><div class="box">col-12</div></Col>
    <Col span={12}><div class="box alt">col-12</div></Col>
  </Row>
  <Row>
    <Col span={8}><div class="box">col-8</div></Col>
    <Col span={8}><div class="box alt">col-8</div></Col>
    <Col span={8}><div class="box">col-8</div></Col>
  </Row>
  <Row>
    <Col span={6}><div class="box">col-6</div></Col>
    <Col span={6}><div class="box alt">col-6</div></Col>
    <Col span={6}><div class="box">col-6</div></Col>
    <Col span={6}><div class="box alt">col-6</div></Col>
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
