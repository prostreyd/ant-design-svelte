<script lang="ts">
  import { Form, FormItem, Input, Switch, createForm } from 'svelte-ant-design';

  const form = createForm();
</script>

{#snippet richHelp()}
  Use at least <b>8</b> characters.
{/snippet}

<div class="stage">
  <div class="sheet">
    <Form
      {form}
      name="help"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ one: '', two: '', three: '', four: '', five: false }}
    >
      <FormItem name="one" label="With a tooltip" tooltip="Shown on hover and on keyboard focus.">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="two" label="Tooltip props" tooltip={{ title: 'Placed below', placement: 'bottom', icon: 'i', iconLabel: 'About this field' }}>
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="three" label="Extra hint" extra="We will never share it.">
        {#snippet children(field)}
          <Input bind:value={field.value} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="four" label="Own help" help={richHelp} rules={[{ min: 8 }]}>
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="five" label="Label click off" htmlFor={null} extra="htmlFor={null}: a click on the label does not toggle the switch.">
        {#snippet children(field)}
          <Switch bind:checked={field.value} {...field.attrs} />
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

  .sheet {
    padding: 28px 24px 4px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 12px;
    background: var(--ads-color-bg-container);
    box-shadow:
      0 1px 2px rgba(16, 36, 94, 0.06),
      0 6px 18px rgba(16, 36, 94, 0.05);
  }
</style>
