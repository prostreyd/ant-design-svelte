<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- xs is the base for every width; each larger breakpoint applies from its minimum width up. Resize the window. -->
<div class="stack">
  <div class="field">
    <span class="caption">xs 2/20/2, sm 4/16/4, md 6/12/6, lg 8/8/8, xl 10/4/10, xxl 11/2/11, xxxl 12/0/12</span>
    <Row>
      <Col xs={2} sm={4} md={6} lg={8} xl={10} xxl={11} xxxl={12}><div class="box">Col</div></Col>
      <Col xs={20} sm={16} md={12} lg={8} xl={4} xxl={2} xxxl={0}><div class="box alt">Col</div></Col>
      <Col xs={2} sm={4} md={6} lg={8} xl={10} xxl={11} xxxl={12}><div class="box">Col</div></Col>
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
