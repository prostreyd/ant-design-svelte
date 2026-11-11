<script lang="ts">
  import { Button, Input } from 'svelte-ant-design';

  let field: ReturnType<typeof Input> | undefined = $state();
</script>

<Input bind:this={field} value="Hello, world" aria-label="Focus demo" />
<span>
  <Button onclick={() => field?.focus()}>Focus</Button>
  <Button onclick={() => field?.focus({ cursor: 'start' })}>At the start</Button>
  <Button onclick={() => field?.focus({ cursor: 'end' })}>At the end</Button>
  <Button onclick={() => field?.focus({ cursor: 'all' })}>Select all</Button>
  <Button onclick={() => field?.focus({ preventScroll: true })}>No scroll</Button>
  <Button onclick={() => field?.blur()}>Blur</Button>
</span>
