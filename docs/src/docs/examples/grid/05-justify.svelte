<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';

  const values = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'] as const;
</script>

<div class="stack">
  {#each values as value (value)}
    <div class="field">
      <span class="caption">justify="{value}"</span>
      <div class="area">
        <Row justify={value}>
          {#each [0, 1, 2, 3] as index (index)}
            <Col span={4}><div class="box" class:alt={index % 2 === 1}>col-4</div></Col>
          {/each}
        </Row>
      </div>
    </div>
  {/each}
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

  .area {
    background: var(--ads-color-bg-container-disabled);
    border-radius: 4px;
  }
</style>
