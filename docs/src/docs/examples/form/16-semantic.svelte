<script lang="ts">
  import { Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="semantic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      classNames={{ root: 'demo-item', helpItem: 'demo-help-item' }}
      styles={{ label: { 'font-weight': 600 }, extra: { 'font-style': 'italic' }, content: { 'border-inline-start': '3px solid var(--ads-color-primary)', 'padding-inline-start': '8px' } }}
      initialValues={{ name: '' }}
    >
      <FormItem name="name" label="Name" extra="Styled through classNames and styles." rules={[{ required: true, message: 'Please input a name' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
    </Form>
  </div>
</div>

<style>
  .stage {
    display: grid;
    gap: 16px;
    width: 100%;
    max-width: 660px;
    margin-inline: auto;
  }

  .sheet {
    padding: 28px 24px 4px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 12px;
    background: var(--ads-color-bg-container);
    box-shadow:
      0 1px 2px rgba(16, 36, 94, 0.06),
      0 6px 18px rgba(16, 36, 94, 0.05);
  }

  .stage :global(.demo-help-item) {
    text-decoration: underline dotted;
  }
</style>
