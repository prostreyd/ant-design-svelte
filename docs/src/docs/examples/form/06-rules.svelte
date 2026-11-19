<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();

  let result = $state('');
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="rules"
      labelCol={{ span: 7 }}
      wrapperCol={{ span: 17 }}
      initialValues={{ username: '', email: '', age: '', website: '', code: '' }}
      onfinish={(values) => (result = `Success: ${JSON.stringify(values)}`)}
      onfinishfailed={() => (result = 'Failed: the form has errors.')}
    >
      <FormItem
        name="username"
        label="Username"
        rules={[
          { required: true, whitespace: true, message: 'Please input a username' },
          { min: 3, max: 12, message: '${name} must be 3 to 12 characters' },
          { pattern: /^[a-z0-9_]+$/, message: 'Use lowercase letters, digits and _' }
        ]}
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="email" label="Email" rules={[{ required: true }, { type: 'email' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem
        name="age"
        label="Age"
        rules={[{ type: 'number', min: 18, max: 99, transform: (value) => (value === '' ? undefined : Number(value)), message: '${name} must be a number from ${min} to ${max}' }]}
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="website" label="Website" rules={[{ type: 'url' }]} extra="Optional, but it must be a url.">
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="code" label="Code" rules={[{ len: 6, message: 'The code has exactly ${len} characters' }, { pattern: /^\d+$/, message: 'Digits only' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 7, span: 17 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </FormItem>
    </Form>
  </div>
  {#if result}
    <div class="results">
      <p role="status">{result}</p>
    </div>
  {/if}
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

  .results {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .results p {
    margin: 0;
    padding: 6px 14px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 999px;
    background: var(--ads-color-bg-container);
    font-size: 13px;
  }
</style>
