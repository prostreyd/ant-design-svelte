<script lang="ts">
  import { Button, Checkbox, CheckboxGroup, Form, FormItem, Input, RadioGroup, Select, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();

  let result = $state('');
</script>

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="binding"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ alerts: false, agree: false, hobbies: ['music'], plan: 'free', city: 'oslo', amount: 10 }}
      onfinish={(values) => (result = JSON.stringify(values))}
      onfinishfailed={() => (result = 'Failed: the form has errors.')}
    >
      <FormItem name="alerts" label="Switch">
        {#snippet children(field)}
          <Switch bind:checked={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="agree" label="Checkbox" rules={[{ type: 'enum', enum: [true], message: 'You must agree' }]}>
        {#snippet children(field)}
          <Checkbox bind:checked={field.value} {...field.attrs}>I agree</Checkbox>
        {/snippet}
      </FormItem>
      <FormItem name="hobbies" label="CheckboxGroup">
        {#snippet children(field)}
          <CheckboxGroup
            bind:value={field.value}
            options={[
              { value: 'music', label: 'Music' },
              { value: 'film', label: 'Film' },
              { value: 'sport', label: 'Sport' }
            ]}
            {...field.attrs}
          />
        {/snippet}
      </FormItem>
      <FormItem name="plan" label="RadioGroup">
        {#snippet children(field)}
          <RadioGroup
            bind:value={field.value}
            options={[
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' }
            ]}
            {...field.attrs}
          />
        {/snippet}
      </FormItem>
      <FormItem name="city" label="Select">
        {#snippet children(field)}
          <Select
            bind:value={field.value}
            status={field.status}
            options={[
              { value: 'oslo', label: 'Oslo' },
              { value: 'riga', label: 'Riga' }
            ]}
            {...field.attrs}
          />
        {/snippet}
      </FormItem>
      <FormItem name="amount" label="Function binding" rules={[{ type: 'number', min: 1, message: 'A number from 1' }]}>
        {#snippet children(field)}
          <Input
            bind:value={() => String(field.value ?? ''), (text) => (field.value = text === '' ? undefined : Number(text))}
            status={field.status}
            {...field.attrs}
          />
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
