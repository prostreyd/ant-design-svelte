<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();
  let hidden = $state(true);
  let company = $state(true);
  let preserve = $state<'keep' | 'drop'>('keep');
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">hidden</span>
      <Switch bind:checked={hidden} aria-label="hidden" />
    </div>
    <div class="field">
      <span class="caption">show the company field</span>
      <Switch bind:checked={company} aria-label="show the company field" />
    </div>
    <div class="field">
      <span class="caption">preserve</span>
      <RadioGroup
        bind:value={preserve}
        optionType="button"
        options={[
          { value: 'keep', label: 'true' },
          { value: 'drop', label: 'false' }
        ]}
      />
    </div>
  </div>
  <div class="sheet">
    <Form {form} name="initial" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} initialValues={{ name: 'Ann', secret: 'kept even when hidden' }}>
      <FormItem name="name" label="Name (initialValues)">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="role" label="Role (initialValue)" initialValue="Engineer">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="secret" label="Secret" {hidden} rules={[{ required: true }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      {#if company}
        <FormItem name="company" label="Company" initialValue="Acme" preserve={preserve === 'keep'}>
          {#snippet children(field)}
            <Input bind:value={field.value} {...field.attrs} />
          {/snippet}
        </FormItem>
      {/if}
    </Form>
  </div>
  <div class="results">
    <div class="field">
      <span class="caption">getFieldsValue(true)</span>
      <pre role="status">{JSON.stringify(form.getFieldsValue(true), null, 2)}</pre>
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

  .results {
    display: grid;
    justify-items: start;
    gap: 16px;
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
