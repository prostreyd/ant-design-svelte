<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, createForm } from 'svelte-ant-design';

  const form = createForm();

  type Mark = 'shown' | 'hidden' | 'optional' | 'snippet';
  let mark = $state<Mark>('shown');
</script>

{#snippet custom({ label, required }: { label: unknown; required: boolean })}
  <span>{label} {required ? '(must)' : '(may)'}</span>
{/snippet}

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">requiredMark</span>
      <RadioGroup
        bind:value={mark}
        optionType="button"
        options={[
          { value: 'shown', label: 'true' },
          { value: 'hidden', label: 'false' },
          { value: 'optional', label: "'optional'" },
          { value: 'snippet', label: 'snippet' }
        ]}
      />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="required-mark"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      requiredMark={mark === 'shown' ? true : mark === 'hidden' ? false : mark === 'optional' ? 'optional' : custom}
      initialValues={{ name: '', nickname: '', email: '' }}
    >
      <FormItem name="name" label="Name" rules={[{ required: true }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="nickname" label="Nickname">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="email" label="Email (required={false})" required={false} rules={[{ required: true }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
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
