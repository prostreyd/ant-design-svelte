<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">{'gutter={16}'}</span>
    <!-- A number is pixels. The Row does not grow past its parent: there is no negative margin. -->
    <Row gutter={16}>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">{'gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}'} (resize the window)</span>
    <!-- One value per breakpoint; a breakpoint that is not given keeps the value of the next smaller one. -->
    <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">{'gutter={[16, 24]}'}: horizontal and vertical</span>
    <Row gutter={[16, 24]}>
      {#each [0, 1, 2, 3, 4, 5, 6, 7] as index (index)}
        <Col span={6}><div class="box">col-6</div></Col>
      {/each}
    </Row>
  </div>

  <div class="field">
    <span class="caption">gutter="2rem": a CSS length</span>
    <Row gutter="2rem">
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
      <Col span={6}><div class="box">col-6</div></Col>
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
</style>
