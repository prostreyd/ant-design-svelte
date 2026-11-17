<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- span, offset, push, pull, order and flex go inside a breakpoint object; xs={6} is the same as xs={{ span: 6 }}.
     Each key cascades on its own: the offset of xs still applies where lg gives only a span. -->
<div class="stack">
  <div class="field">
    <span class="caption">xs span 5 offset 1; lg span 6 offset 2 (resize the window)</span>
    <Row>
      <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}><div class="box">Col</div></Col>
      <Col xs={{ span: 11, offset: 1 }} lg={{ span: 6, offset: 2 }}><div class="box alt">Col</div></Col>
      <Col xs={{ span: 5, offset: 1 }} lg={{ span: 6, offset: 2 }}><div class="box">Col</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">{'xs={12}'}, md order 2 / 1: drawn in the other order from md</span>
    <Row>
      <Col xs={12} md={{ span: 12, order: 2 }}><div class="box">First in the DOM</div></Col>
      <Col xs={12} md={{ span: 12, order: 1 }}><div class="box alt">Second in the DOM</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">md push 6 and pull 18: swapped visually from md, the DOM order stays</span>
    <Row>
      <Col xs={12} md={{ span: 18, push: 6 }}><div class="box">First in the DOM</div></Col>
      <Col xs={12} md={{ span: 6, pull: 18 }}><div class="box alt">Second in the DOM</div></Col>
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
