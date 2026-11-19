<script lang="ts">
  import { Button, Form, FormItem, Input, Switch, createForm } from 'svelte-ant-design';

  interface Signup {
    username: string;
    newsletter: boolean;
  }

  // The shape of the values is given once: the instance and the callbacks of the form follow it.
  const form = createForm<Signup>();
  let result = $state('');
  let latest = $state('nothing yet');
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="typed"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ username: '', newsletter: false }}
      onfinish={(values) => (result = `Welcome, ${values.username.toUpperCase()}`)}
      onvalueschange={(changed, all) => (latest = `${Object.keys(changed).join(', ')} changed; newsletter is ${all.newsletter}`)}
    >
      <FormItem name="username" label="Username" rules={[{ required: true, message: 'Please input a username' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="newsletter" label="Newsletter">
        {#snippet children(field)}
          <Switch bind:checked={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </FormItem>
    </Form>
  </div>
  <div class="row">
    <Button onclick={() => form.setFieldValue('newsletter', true)}>Subscribe from code</Button>
    <Button onclick={() => form.setFieldsValue({ username: 'ann' })}>Fill the name</Button>
  </div>
  <div class="results">
    {#if result}
      <div class="field">
        <span class="caption">onfinish, typed: values.username.toUpperCase()</span>
        <p role="status">{result}</p>
      </div>
    {/if}
    <div class="field">
      <span class="caption">onvalueschange(changed, all), typed</span>
      <p>{latest}</p>
    </div>
    <div class="field">
      <span class="caption">form.getFieldValue('newsletter') is a boolean</span>
      <p>{String(form.getFieldValue('newsletter'))}</p>
    </div>
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
</style>
