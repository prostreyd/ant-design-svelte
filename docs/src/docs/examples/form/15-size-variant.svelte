<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, Select, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();

  type Size = 'small' | 'medium' | 'large';
  type Variant = 'outlined' | 'borderless' | 'filled' | 'underlined';
  let size = $state<Size>('medium');
  let variant = $state<Variant>('outlined');
  let disabled = $state(false);
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">size</span>
      <RadioGroup
        bind:value={size}
        optionType="button"
        options={[
          { value: 'small', label: 'small' },
          { value: 'medium', label: 'medium' },
          { value: 'large', label: 'large' }
        ]}
      />
    </div>
    <div class="field">
      <span class="caption">variant</span>
      <RadioGroup
        bind:value={variant}
        optionType="button"
        options={[
          { value: 'outlined', label: 'outlined' },
          { value: 'filled', label: 'filled' },
          { value: 'borderless', label: 'borderless' },
          { value: 'underlined', label: 'underlined' }
        ]}
      />
    </div>
    <div class="field">
      <span class="caption">disabled</span>
      <Switch bind:checked={disabled} aria-label="disabled" />
    </div>
  </div>
  <div class="sheet">
    <Form {form} name="pass" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} {size} {variant} {disabled} initialValues={{ name: '', city: 'oslo' }}>
      <FormItem name="name" label="Name">
        {#snippet children(field)}
          <Input bind:value={field.value} disabled={field.disabled} size={field.size} variant={field.variant} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="city" label="City">
        {#snippet children(field)}
          <Select
            bind:value={field.value}
            disabled={field.disabled}
            size={field.size}
            variant={field.variant}
            options={[
              { value: 'oslo', label: 'Oslo' },
              { value: 'riga', label: 'Riga' }
            ]}
            {...field.attrs}
          />
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
