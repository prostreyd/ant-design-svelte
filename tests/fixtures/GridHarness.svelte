<script lang="ts">
  import Col from '../../src/lib/Grid/Col.svelte';
  import Row from '../../src/lib/Grid/Row.svelte';

  // A Row with columns described as data, for the tests of Row and Col (a snippet cannot be written in a test file).
  let { rowProps = {}, cols = [{}] }: { rowProps?: Record<string, unknown>; cols?: Record<string, unknown>[] } = $props();
</script>

<Row data-testid="row" {...rowProps}>
  {#each cols as col, index (index)}
    <Col data-testid={`col-${index}`} {...col}>column {index}</Col>
  {/each}
</Row>
