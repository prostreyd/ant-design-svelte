<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import type { FormProps } from '../../src/lib/Form/types.js';

  let { formProps = {}, pass = true }: { formProps?: Partial<FormProps>; pass?: boolean } = $props();
</script>

<Form initialValues={{ a: '' }} {...formProps}>
  <FormItem name="a" label="A">
    {#snippet children(field)}
      {#if pass}
        <Input bind:value={field.value} disabled={field.disabled} size={field.size} variant={field.variant} {...field.attrs} />
      {:else}
        <Input bind:value={field.value} {...field.attrs} />
      {/if}
    {/snippet}
  </FormItem>
</Form>
