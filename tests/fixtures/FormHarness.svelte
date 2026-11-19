<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import Switch from '../../src/lib/Switch/Switch.svelte';
  import { createForm } from '../../src/lib/Form/store.svelte.js';
  import type { FormInstance, FormProps, FormItemProps } from '../../src/lib/Form/types.js';

  let {
    form = createForm(),
    formProps = {},
    itemProps = {},
    log = []
  }: {
    form?: FormInstance;
    formProps?: Partial<FormProps>;
    itemProps?: Partial<FormItemProps>;
    log?: unknown[];
  } = $props();
</script>

<Form
  {form}
  name="t"
  initialValues={{ username: '', remember: true }}
  onfinish={(values) => log.push(['finish', values])}
  onfinishfailed={(info) => log.push(['failed', info.errorFields.map((f) => f.name.join('.'))])}
  {...formProps}
>
  <FormItem
    name="username"
    label="Username"
    rules={[{ required: true, message: 'Please input your username' }]}
    {...itemProps}
  >
    {#snippet children(field)}
      <Input bind:value={field.value} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
  <FormItem name="remember" label="Remember">
    {#snippet children(field)}
      <Switch bind:checked={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
  <button type="submit">Submit</button>
</Form>
