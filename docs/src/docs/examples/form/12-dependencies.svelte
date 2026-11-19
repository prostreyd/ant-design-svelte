<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
</script>

<div class="stage">
  <div class="sheet">
    <Form {form} name="register" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} initialValues={{ password: '', confirm: '' }}>
      <FormItem name="password" label="Password" rules={[{ required: true, message: 'Please input your password!' }]}>
        {#snippet children(field)}
          <Input type="password" bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem
        name="confirm"
        label="Confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password!' },
          (form) => ({
            validator(_rule, value) {
              if (!value || form.getFieldValue('password') === value) return;
              return Promise.reject('The two passwords do not match!');
            }
          })
        ]}
      >
        {#snippet children(field)}
          <Input type="password" bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">Register</Button>
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
