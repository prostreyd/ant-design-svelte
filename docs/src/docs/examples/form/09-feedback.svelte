<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, createForm } from 'svelte-ant-design';

  const form = createForm();

  type Status = 'success' | 'warning' | 'error' | 'validating';
  let status = $state<Status>('warning');

  // A check that takes a second, to show the validating icon.
  const free = (name: string) =>
    new Promise<void>((resolve, reject) => setTimeout(() => (name === 'admin' ? reject('That name is taken') : resolve()), 1000));
</script>

{#snippet tick()}
  <span aria-hidden="true">✔</span>
{/snippet}

{#snippet wait()}
  <span aria-hidden="true">…</span>
{/snippet}

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">validateStatus of the last item</span>
      <RadioGroup
        bind:value={status}
        optionType="button"
        options={[
          { value: 'success', label: 'success' },
          { value: 'warning', label: 'warning' },
          { value: 'error', label: 'error' },
          { value: 'validating', label: 'validating' }
        ]}
      />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="feedback"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      feedbackIcons={{ validating: wait }}
      initialValues={{ name: '', mail: 'me@example.com', manual: 'value' }}
    >
      <FormItem
        name="name"
        label="Name (try admin)"
        hasFeedback
        rules={[{ required: true, message: 'Please input a name' }, { validator: (_rule, value) => (value ? free(value) : undefined) }]}
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs}>
            {#snippet suffix()}{@render field.feedback?.()}{/snippet}
          </Input>
        {/snippet}
      </FormItem>
      <FormItem name="mail" label="Email" hasFeedback={{ icons: { success: tick } }} rules={[{ type: 'email', message: 'Not an email' }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs}>
            {#snippet suffix()}{@render field.feedback?.()}{/snippet}
          </Input>
        {/snippet}
      </FormItem>
      <FormItem name="manual" label="Status by hand" hasFeedback validateStatus={status} help="validateStatus: {status}">
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs}>
            {#snippet suffix()}{@render field.feedback?.()}{/snippet}
          </Input>
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

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 12px 24px;
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

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    font-weight: 500;
  }
</style>
