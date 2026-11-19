<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import type { FormItemProps, FormProps } from '../../src/lib/Form/types.js';

  // Items with no control of their own: for the markup, the layout and the labels.
  let { formProps = {}, itemProps = {}, second }: { formProps?: Partial<FormProps>; itemProps?: Partial<FormItemProps>; second?: Partial<FormItemProps> } = $props();
</script>

<Form {...formProps}>
  <FormItem label="One" {...itemProps}><span data-testid="content-one">content one</span></FormItem>
  {#if second}
    <FormItem label="Two" {...second}><span>content two</span></FormItem>
  {/if}
</Form>
