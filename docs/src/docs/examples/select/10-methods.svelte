<script lang="ts">
  import { Button, Select } from 'svelte-ant-design';

  let field: ReturnType<typeof Select> | undefined = $state();
</script>

<!-- bind:this gives the instance; focus() puts the focus in the field (the list does not open), blur() takes it away. -->
<Select bind:this={field} aria-label="Fruit" options={['Apple', 'Banana', 'Cherry']} style="width: 200px" />
<Button onclick={() => field?.focus()}>focus()</Button>
<Button onclick={() => field?.focus({ preventScroll: true })}>focus(&#123; preventScroll: true &#125;)</Button>
<Button onclick={() => field?.blur()}>blur()</Button>
