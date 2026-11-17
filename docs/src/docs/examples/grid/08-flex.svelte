<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">{'flex={2} and flex={3}'}: a number n is "n n auto"</span>
    <Row>
      <Col flex={2}><div class="box">2 / 5</div></Col>
      <Col flex={3}><div class="box alt">3 / 5</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">flex="100px" and flex="auto": a fixed width and the rest</span>
    <Row>
      <Col flex="100px"><div class="box">100px</div></Col>
      <Col flex="auto"><div class="box alt">Fill rest</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">flex="1 1 200px" and flex="0 1 300px": a raw flex value</span>
    <Row>
      <Col flex="1 1 200px"><div class="box">1 1 200px</div></Col>
      <Col flex="0 1 300px"><div class="box alt">0 1 300px</div></Col>
    </Row>
  </div>

  <div class="field">
    <span class="caption">flex="none" and flex="auto"</span>
    <Row wrap={false}>
      <Col flex="none"><div class="box">none</div></Col>
      <Col flex="auto"><div class="box alt">auto with no-wrap</div></Col>
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
