<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import type { FormRules } from '../../src/lib/Form/types.js';

  let { rules }: { rules?: FormRules } = $props();
  // The consumer's own state, as a page would write it.
  const values = $state({ username: 'from the model', user: { city: 'Bishkek' } });
</script>

<Form model={values} {rules} name="s">
  <FormItem name="username" label="Username">
    {#snippet children(field)}
      <Input bind:value={values.username} {...field.attrs} />
    {/snippet}
  </FormItem>
  <FormItem name={['user', 'city']} label="City">
    {#snippet children(field)}
      <Input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>
