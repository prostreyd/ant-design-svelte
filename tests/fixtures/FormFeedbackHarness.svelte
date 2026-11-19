<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import type { FormItemProps, FormProps } from '../../src/lib/Form/types.js';

  let { formProps = {}, itemProps = {} }: { formProps?: Partial<FormProps>; itemProps?: Partial<FormItemProps> } = $props();
</script>

<Form initialValues={{ a: '' }} {...formProps}>
  <FormItem name="a" label="A" hasFeedback {...itemProps}>
    {#snippet children(field)}
      <Input bind:value={field.value} status={field.status} {...field.attrs}>
        {#snippet suffix()}{@render field.feedback?.()}{/snippet}
      </Input>
    {/snippet}
  </FormItem>
</Form>
