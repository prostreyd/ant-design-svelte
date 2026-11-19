<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();

  type Trigger = 'change' | 'blur' | 'both';
  let trigger = $state<Trigger>('change');
  let debounce = $state(false);
  let runs = $state(0);
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">validateTrigger</span>
      <RadioGroup
        bind:value={trigger}
        optionType="button"
        options={[
          { value: 'change', label: 'change' },
          { value: 'blur', label: 'blur' },
          { value: 'both', label: 'both' }
        ]}
      />
    </div>
    <div class="field">
      <span class="caption">validateDebounce 500</span>
      <Switch bind:checked={debounce} aria-label="validateDebounce" />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="trigger"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      validateTrigger={trigger === 'both' ? ['change', 'blur'] : trigger}
      initialValues={{ nick: '' }}
    >
      <FormItem
        name="nick"
        label="Nickname"
        validateDebounce={debounce ? 500 : undefined}
        rules={[
          { min: 3, message: 'At least 3 characters' },
          {
            validator: () => {
              runs += 1;
            }
          }
        ]}
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
    </Form>
  </div>
  <div class="results">
    <p role="status">Validations run: {runs}</p>
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

  .results p {
    margin: 0;
    padding: 6px 14px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 999px;
    background: var(--ads-color-bg-container);
    font-size: 13px;
  }
</style>
