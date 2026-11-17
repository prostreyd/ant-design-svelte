<script lang="ts">
  import { Col, Row, Switch } from 'svelte-ant-design';

  let wrap = $state(true);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">wrap</span>
    <div class="row">
      <Switch bind:checked={wrap} aria-label="wrap" />
      <span role="status">{`wrap={${wrap}}`}</span>
    </div>
  </div>

  <div class="field">
    <span class="caption">Three columns of 12: the third does not fit in a line</span>
    <!-- With wrap, a column that does not fit moves to the next line as a whole. Without it the columns keep their width and run past the end of the Row. -->
    <div class="strip">
      <Row {wrap}>
        <Col span={12}><div class="box">col-12</div></Col>
        <Col span={12}><div class="box alt">col-12</div></Col>
        <Col span={12}><div class="box">col-12</div></Col>
      </Row>
    </div>
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

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .strip {
    overflow-x: auto;
  }
</style>
