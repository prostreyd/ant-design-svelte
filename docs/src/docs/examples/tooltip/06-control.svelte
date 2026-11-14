<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';

  let open = $state(false);
  let log = $state('no change yet');
  let host = $state<HTMLElement>();
</script>

<!-- bind:open keeps the parent in step; onopenchange runs once per change the user causes. -->
<Tooltip bind:open title="Controlled tooltip" onopenchange={(next) => (log = `onopenchange(${next})`)}>
  <Button>Hover or focus me</Button>
</Tooltip>
<Button onclick={() => (open = !open)}>{open ? 'Hide' : 'Show'} from the parent</Button>
<span role="status">{log}</span>

<!-- An empty trigger list and open: only the parent decides. container keeps a tip that is always there inside the
     region of the page, so that it is not a loose block outside every landmark. -->
<div class="always" bind:this={host}>
  <Tooltip open title="Always open" trigger={[]} placement="right" container={host}>
    <Button>No triggers</Button>
  </Tooltip>
</div>

<style>
  .always {
    position: relative;
    display: inline-block;
    margin-inline-start: 12px;
  }
</style>
