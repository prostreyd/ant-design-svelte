<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<!-- Both delays are in seconds and default to 0.1. The pointer may cross into the tip and rest in it. -->
<Tooltip title="shown after 0.8 s" mouseEnterDelay={0.8}>
  <Button>mouseEnterDelay 0.8</Button>
</Tooltip>

<Tooltip title="stays 1.5 s after you leave; move into it to keep it" mouseLeaveDelay={1.5}>
  <Button>mouseLeaveDelay 1.5</Button>
</Tooltip>

<Tooltip title="instant" mouseEnterDelay={0} mouseLeaveDelay={0}>
  <Button>no delay</Button>
</Tooltip>
