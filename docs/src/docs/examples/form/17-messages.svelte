<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="messages"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      validateMessages={{ required: 'Please fill in ${name}.', string: { min: '${name} needs at least ${min} characters.' } }}
      initialValues={{ name: '', handle: '', city: '' }}
    >
      <FormItem name="name" label="Full name" rules={[{ required: true }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="handle" label="Handle" rules={[{ min: 4 }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem
        name="city"
        label="City"
        messageVariables={{ where: 'the city you live in' }}
        rules={[{ required: true, message: 'Tell us ${where}, ${name} is empty.' }]}
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
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
</style>
