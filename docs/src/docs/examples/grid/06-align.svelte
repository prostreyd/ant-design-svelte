<script lang="ts">
  import { Col, Row } from 'svelte-ant-design';

  const values = ['top', 'middle', 'bottom', 'stretch'] as const;
  const heights = [100, 50, 120, 80];
</script>

<div class="stack">
  {#each values as value (value)}
    <div class="field">
      <span class="caption">align="{value}"</span>
      <div class="area">
        <Row justify="space-around" align={value}>
          {#each heights as height, index (index)}
            <Col span={4}>
              <!-- stretch makes every column as tall as the line. The box of a column fills it when it is as tall as its parent. -->
              <div
                class="box"
                class:alt={index % 2 === 1}
                class:fill={value === 'stretch' && index !== 0}
                style:height={value !== 'stretch' ? `${height}px` : index === 0 ? `${height}px` : undefined}
              >
                col-4
              </div>
            </Col>
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

  .fill {
    height: 100%;
    box-sizing: border-box;
  }
</style>
