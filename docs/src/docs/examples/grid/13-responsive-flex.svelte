<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';
</script>

<!-- A breakpoint object can carry flex: a share of the line that changes with the screen. Resize the window. -->
<div class="stack">
  <div class="field">
    <span class="caption">flex 100% / 50% / 40% / 20% / 10% from xs / sm / md / lg / xl</span>
    <Row>
      {#each [0, 1, 2, 3, 4] as index (index)}
        <Col xs={{ flex: '100%' }} sm={{ flex: '50%' }} md={{ flex: '40%' }} lg={{ flex: '20%' }} xl={{ flex: '10%' }}>
          <div class="box" class:alt={index % 2 === 1}>Col</div>
        </Col>
      {/each}
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
