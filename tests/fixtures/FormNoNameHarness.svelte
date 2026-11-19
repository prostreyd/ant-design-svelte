<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
</script>

<!-- Items with no name: a snippet that reads and writes a field that does not exist, and an item with no content at all. -->
<Form>
  <FormItem label="Free" data-testid="free">
    {#snippet children(field)}
      <input data-testid="free-input" bind:value={field.value} {...field.attrs} />
      <span data-testid="free-value">{String(field.value)}</span>
    {/snippet}
  </FormItem>
  <FormItem label="Empty" data-testid="empty" />
</Form>
