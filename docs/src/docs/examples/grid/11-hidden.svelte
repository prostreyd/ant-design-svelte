<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- A span of 0 is display: none, so the content leaves the page, the Tab order and the screen reader. -->
<div class="stack">
  <div class="field">
    <span class="caption">{'xs={0} md={8}'}: the first column shows from 768 px (resize the window)</span>
    <Row gutter={16}>
      <Col xs={0} md={8}><div class="box">Only from md</div></Col>
      <Col xs={24} md={16}><div class="box alt">Always</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">{'span={0}'}: always hidden</span>
    <Row gutter={16}>
      <Col span={12}><div class="box">col-12</div></Col>
      <Col span={0}><div class="box alt">Never seen</div></Col>
      <Col span={12}><div class="box">col-12</div></Col>
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
