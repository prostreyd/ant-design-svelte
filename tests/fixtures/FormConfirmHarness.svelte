<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
  import { createForm } from '../../src/lib/Form/store.svelte.js';
  import type { FormInstance } from '../../src/lib/Form/types.js';

  let { form = createForm() }: { form?: FormInstance } = $props();
</script>

<Form {form} name="reg" initialValues={{ password: '', confirm: '' }}>
  <FormItem name="password" label="Password" rules={[{ required: true, message: 'password needed' }]}>
    {#snippet children(field)}
      <Input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
  <FormItem
    name="confirm"
    label="Confirm"
    dependencies={['password']}
    rules={[
      { required: true, message: 'confirm needed' },
      (instance) => ({
        validator(_rule, value) {
          if (!value || instance.getFieldValue('password') === value) return;
          return Promise.reject('The passwords do not match');
        }
      })
    ]}
  >
    {#snippet children(field)}
      <Input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>
