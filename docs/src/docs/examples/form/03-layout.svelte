<script lang="ts">
  import { Button, Form, FormItem, Input, RadioGroup, createForm } from 'svelte-ant-design';

  const form = createForm();

  let layout = $state<'horizontal' | 'vertical' | 'inline'>('horizontal');
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">layout</span>
      <RadioGroup
        bind:value={layout}
        optionType="button"
        options={[
          { value: 'horizontal', label: 'horizontal' },
          { value: 'vertical', label: 'vertical' },
          { value: 'inline', label: 'inline' }
        ]}
      />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="layout"
      {layout}
      labelCol={layout === 'horizontal' ? { span: 4 } : undefined}
      wrapperCol={layout === 'horizontal' ? { span: 14 } : undefined}
      initialValues={{ first: '', second: '' }}
    >
      <FormItem name="first" label="Field A">
        {#snippet children(field)}
          <Input bind:value={field.value} placeholder="input placeholder" {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="second" label="Field B">
        {#snippet children(field)}
          <Input bind:value={field.value} placeholder="input placeholder" {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem wrapperCol={layout === 'horizontal' ? { offset: 4, span: 14 } : undefined}>
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
