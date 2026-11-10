<script lang="ts">
  import { Button, Switch } from 'svelte-ant-design';

  let power: ReturnType<typeof Switch> | undefined = $state();
</script>

<Switch bind:this={power} aria-label="Power" />
<Button onclick={() => power?.focus()}>Focus</Button>
<Button onclick={() => power?.blur()}>Blur</Button>
