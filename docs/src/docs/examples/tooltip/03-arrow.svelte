<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<!-- Shown by default. -->
<Tooltip title="prompt text" placement="topLeft">
  <Button>Arrow at the edge</Button>
</Tooltip>

<!-- pointAtCenter points the arrow at the middle of a short trigger, wherever the tip is aligned. -->
<Tooltip title="prompt text" placement="topLeft" arrow={{ pointAtCenter: true }}>
  <Button>pointAtCenter</Button>
</Tooltip>

<Tooltip title="prompt text" arrow={false}>
  <Button>No arrow</Button>
</Tooltip>
