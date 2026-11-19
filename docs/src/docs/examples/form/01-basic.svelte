<script lang="ts">
  import { Button, Checkbox, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  // The shape of the values is the type argument of createForm. It is optional: createForm() alone is loose.
  interface Login {
    username: string;
    password: string;
    remember: boolean;
  }

  const form = createForm<Login>();

  // Another way, as in Vue: keep the values in your own $state object and pass it as `model`:
  //   const values: Login = $state({ username: '', password: '', remember: true });
  //   <Form {form} model={values}> ... <Input bind:value={values.username} /> ...
  // See the example "Your own model" below.

  let result = $state('');
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ username: '', password: '', remember: true }}
      onfinish={(values) => (result = `Success: ${JSON.stringify(values)}`)}
      onfinishfailed={() => (result = 'Failed: the form has errors.')}
    >
      <FormItem name="username" label="Username" rules={[{ required: true, message: 'Please input your username!' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="password" label="Password" rules={[{ required: true, message: 'Please input your password!' }]}>
        {#snippet children(field)}
          <Input type="password" bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="remember" wrapperCol={{ offset: 8, span: 16 }}>
        {#snippet children(field)}
          <Checkbox bind:checked={field.value} {...field.attrs}>Remember me</Checkbox>
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
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
