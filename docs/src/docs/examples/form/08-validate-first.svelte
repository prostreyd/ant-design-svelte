<script lang="ts">
  import { Form, FormItem, Input, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();

  let first = $state(false);
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">validateFirst</span>
      <Switch bind:checked={first} aria-label="validateFirst" />
    </div>
  </div>
  <div class="sheet">
    <Form {form} name="first" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} initialValues={{ password: '' }}>
      <FormItem
        name="password"
        label="Password"
        validateFirst={first}
        rules={[
          { required: true, message: 'Please input a password' },
          { min: 8, message: 'At least 8 characters' },
          { pattern: /\d/, message: 'Add a digit' },
          { pattern: /^(?!password)/i, message: 'That password is very common', warningOnly: true }
        ]}
      >
        {#snippet children(field)}
          <Input type="text" bind:value={field.value} status={field.status} {...field.attrs} />
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
