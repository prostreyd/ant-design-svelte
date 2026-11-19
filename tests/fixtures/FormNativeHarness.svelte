<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import type { FormProps } from '../../src/lib/Form/types.js';

  // A native input accepts an undefined value, so the missing initial value only produces the warning.
  let { formProps = {} }: { formProps?: Partial<FormProps> } = $props();
</script>

<Form {...formProps}>
  <FormItem name="username" label="Username">
    {#snippet children(field)}
      <input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>
