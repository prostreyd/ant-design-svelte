<script lang="ts">
  import { Form, FormItem, Input, RadioGroup, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();

  let labelAlign = $state<'start' | 'end'>('end');
  let labelWrap = $state(false);
  let colon = $state(true);
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">labelAlign</span>
      <RadioGroup
        bind:value={labelAlign}
        optionType="button"
        options={[
          { value: 'start', label: 'start' },
          { value: 'end', label: 'end' }
        ]}
      />
    </div>
    <div class="field">
      <span class="caption">labelWrap</span>
      <Switch bind:checked={labelWrap} aria-label="labelWrap" />
    </div>
    <div class="field">
      <span class="caption">colon</span>
      <Switch bind:checked={colon} aria-label="colon" />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="label-col"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      {labelAlign}
      {labelWrap}
      {colon}
      initialValues={{ short: '', long: '' }}
    >
      <FormItem name="short" label="Short">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="long" label="A long label that does not fit in its column">
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
