<script lang="ts">
  import { Button, Form, FormItem, Input, Switch, createForm } from 'svelte-ant-design';

  interface Profile {
    username: string;
    email: string;
    subscribe: boolean;
  }

  // Your own state: the form reads it and writes to it. `form` is only for its methods (the reset button).
  const values: Profile = $state({ username: '', email: '', subscribe: false });
  const form = createForm<Profile>();
  let result = $state('');
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      model={values}
      name="model"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      rules={{
        username: [
          { required: true, message: 'Please input a username' },
          { min: 3, message: 'At least 3 characters' }
        ]
      }}
      onfinish={(submitted) => (result = `Success: ${JSON.stringify(submitted)}`)}
    >
      <FormItem name="username" label="Username">
        {#snippet children(field)}
          <Input bind:value={values.username} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="email" label="Email" rules={[{ type: 'email', message: 'Not an email address' }]}>
        {#snippet children(field)}
          <Input bind:value={values.email} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="subscribe" label="Subscribe">
        {#snippet children(field)}
          <Switch bind:checked={values.subscribe} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </FormItem>
    </Form>
  </div>
  <div class="row">
    <Button onclick={() => (values.username = 'ab')}>values.username = 'ab'</Button>
    <Button onclick={() => form.setFieldValue('username', 'ann')}>setFieldValue('username', 'ann')</Button>
    <Button onclick={() => form.resetFields()}>resetFields()</Button>
  </div>
  <div class="results">
    <div class="field">
      <span class="caption">values: your own $state object</span>
      <pre>{JSON.stringify(values, null, 2)}</pre>
    </div>
    {#if result}
      <div class="field">
        <span class="caption">onfinish</span>
        <p role="status">{result}</p>
      </div>
    {/if}
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

  .field {
    display: grid;
    justify-items: start;
    gap: 6px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    font-weight: 500;
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

  .results pre {
    box-sizing: border-box;
    margin: 0;
    max-width: 100%;
    overflow-x: auto;
    padding: 10px 14px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-container);
    font-size: 12px;
  }
</style>
