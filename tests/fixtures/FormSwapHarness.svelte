<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import type { FormInstance } from '../../src/lib/Form/types.js';

  let { first, second }: { first: FormInstance; second: FormInstance } = $props();
  let useSecond = $state(false);
</script>

<button type="button" onclick={() => (useSecond = !useSecond)}>swap</button>
<Form form={useSecond ? second : first} initialValues={{ name: 'start' }}>
  <FormItem name="name" label="Name">
    {#snippet children(field)}
      <Input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>
