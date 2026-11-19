<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import type { FormInstance, FormItemProps, FormProps, FormRules } from '../../src/lib/Form/types.js';

  interface Profile {
    username: string;
    user: { city: string };
    confirm: string;
  }

  let {
    model,
    form,
    rules,
    direct = true,
    showCity = true,
    preserveCity = true,
    formProps = {},
    itemProps = {},
    log = []
  }: {
    model?: Profile;
    form?: FormInstance<Profile>;
    rules?: FormRules;
    /** A control that binds the model itself (`bind:value={model.username}`) or the field (`bind:value={field.value}`). */
    direct?: boolean;
    showCity?: boolean;
    preserveCity?: boolean;
    formProps?: Partial<FormProps<Profile>>;
    itemProps?: Partial<FormItemProps>;
    log?: unknown[];
  } = $props();
</script>

<Form
  {model}
  {form}
  {rules}
  name="m"
  initialValues={{ username: '', user: { city: '' }, confirm: '' }}
  onvalueschange={(changed, all) => log.push(['change', changed, all])}
  onfinish={(values) => log.push(['finish', values])}
  onfinishfailed={(info) => log.push(['failed', info.errorFields.map((f) => f.name.join('.'))])}
  {...formProps}
>
  <FormItem name="username" label="Username" {...itemProps}>
    {#snippet children(field)}
      {#if direct && model}
        <Input bind:value={model.username} status={field.status} {...field.attrs} />
      {:else}
        <Input bind:value={field.value} status={field.status} {...field.attrs} />
      {/if}
    {/snippet}
  </FormItem>
  {#if showCity}
    <FormItem name={['user', 'city']} label="City" preserve={preserveCity}>
      {#snippet children(field)}
        <Input bind:value={field.value} status={field.status} {...field.attrs} />
      {/snippet}
    </FormItem>
  {/if}
  <FormItem name="confirm" label="Confirm">
    {#snippet children(field)}
      <Input bind:value={field.value} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
  <button type="submit">Submit</button>
</Form>
