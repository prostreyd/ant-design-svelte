<script lang="ts">
  import { Button, Checkbox } from 'svelte-ant-design';

  let box: ReturnType<typeof Checkbox> | undefined = $state();
</script>

<Checkbox bind:this={box}>Subscribe</Checkbox>
<Button onclick={() => box?.focus()}>Focus</Button>
<Button onclick={() => box?.blur()}>Blur</Button>
