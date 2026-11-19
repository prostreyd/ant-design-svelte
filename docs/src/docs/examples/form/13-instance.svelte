<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
  let outcome = $state('Nothing validated yet.');
  let change = $state('none yet');
  let events = $state(0);

  async function check() {
    try {
      await form.validateFields();
      outcome = 'validateFields resolved';
    } catch (info) {
      outcome = `validateFields rejected: ${(info as { errorFields: { name: string[] }[] }).errorFields.map((field) => field.name.join('.')).join(', ')}`;
    }
  }
</script>

<div class="stage">
  <div class="sheet">
    <Form {form} name="instance" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} initialValues={{ name: '', note: 'start' }}
      onvalueschange={(changed) => (change = JSON.stringify(changed))}
      onfieldschange={() => (events += 1)}
    >
      <FormItem name="name" label="Name" rules={[{ required: true, message: 'Please input a name' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="note" label="Note">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
    </Form>
  </div>
  <div class="row">
    <Button onclick={() => form.setFieldsValue({ name: 'Ann', note: 'filled from code' })}>Fill</Button>
    <Button onclick={() => form.resetFields()}>Reset</Button>
    <Button onclick={check}>Validate</Button>
    <Button onclick={() => form.setFields([{ name: ['name'], errors: [] }])}>Clear messages</Button>
  </div>
  <div class="results">
    <p role="status">{outcome}</p>
    <div class="field">
      <span class="caption">onvalueschange (the user only), onfieldschange (calls)</span>
      <p>{change} / {events}</p>
    </div>
    <div class="field">
      <span class="caption">getFieldsValue(), getFieldsError(), isFieldsTouched()</span>
      <pre>{JSON.stringify({ values: form.getFieldsValue(), errors: form.getFieldsError().map((field) => field.errors), touched: form.isFieldsTouched() }, null, 2)}</pre>
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
