<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- push and pull move a column visually. The DOM order, the Tab order and the reading order do not change. -->
<div class="stack">
  <div class="field">
    <span class="caption">{'push={6} and pull={18}'}: the first column in the DOM is drawn second</span>
    <Row>
      <Col span={18} push={6}><div class="box">col-18 push-6</div></Col>
      <Col span={6} pull={18}><div class="box alt">col-6 pull-18</div></Col>
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
