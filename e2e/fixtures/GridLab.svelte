<script lang="ts">
  import { flushSync } from 'svelte';
  import { Breakpoints, Col, Row } from '$lib';
  import type { ColSize, Gutter, Responsive, RowAlign, RowJustify } from '$lib';

  // The lab of the grid (specs/grid.md): the test describes the rows it wants as plain data and the page draws them, so one
  // page serves every geometry check. `window.__gridLab.set(scenes)` replaces the rows and returns after the page is drawn.
  // Every column holds a `.box` (the visible content, as in the Ant Design demos) so the tests measure the boxes.
  type LabCol = ColSize & {
    xs?: number | ColSize;
    sm?: number | ColSize;
    md?: number | ColSize;
    lg?: number | ColSize;
    xl?: number | ColSize;
    xxl?: number | ColSize;
    xxxl?: number | ColSize;
    /** The height of the box, so that the alignment is visible. */
    height?: number;
    /** The text of the box. */
    text?: string;
    /** Nested rows inside this column. */
    rows?: LabScene[];
  };
  type LabScene = {
    id: string;
    gutter?: Gutter | [Gutter, Gutter];
    align?: RowAlign | Responsive<RowAlign>;
    justify?: RowJustify | Responsive<RowJustify>;
    wrap?: boolean;
    cols: LabCol[];
  };

  let scenes = $state<LabScene[]>([]);
  let width = $state<number | undefined>(undefined);
  const screens = new Breakpoints();

  (window as unknown as { __gridLab: unknown }).__gridLab = {
    set(next: LabScene[], hostWidth?: number) {
      scenes = next;
      width = hostWidth;
      flushSync();
    }
  };
</script>

{#snippet drawRow(scene: LabScene)}
  <Row data-testid={scene.id} gutter={scene.gutter} align={scene.align} justify={scene.justify} wrap={scene.wrap}>
    {#each scene.cols as col, index (index)}
      {@const { height, text, rows, ...size } = col}
      <Col {...size}>
        <div class="box" style:height={height ? `${height}px` : undefined}>
          {text ?? ''}
          {#each rows ?? [] as inner (inner.id)}{@render drawRow(inner)}{/each}
        </div>
      </Col>
    {/each}
  </Row>
{/snippet}

<main>
  <output data-testid="current">{screens.current}</output>
  <output data-testid="flags">{(['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const).filter((name) => screens[name]).join(' ')}</output>
  <div class="host" data-testid="host" style:width={width ? `${width}px` : undefined}>
    {#each scenes as scene (scene.id)}{@render drawRow(scene)}{/each}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
  }

  .host {
    /* No padding: the point of the gutter model is that a Row does not leave its parent. */
    box-sizing: content-box;
  }

  .box {
    background: #0092ff;
    min-height: 8px;
  }
</style>
