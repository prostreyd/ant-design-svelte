<script lang="ts">
  import Form from '../../src/lib/Form/Form.svelte';
  import FormItem from '../../src/lib/Form/FormItem.svelte';
  import Input from '../../src/lib/Input/Input.svelte';
</script>

<!-- Two required fields that print what their snippet is given besides the value, so the whole `field` object is read. -->
<Form initialValues={{ first: '', second: '' }}>
  {#each ['first', 'second'] as name (name)}
    <FormItem {name} label={name} rules={[{ required: true, message: `${name} needed` }, { required: true, message: `${name} soft`, warningOnly: true }]}>
      {#snippet children(field)}
        <Input bind:value={field.value} {...field.attrs} />
        <output data-testid="{name}-state">{JSON.stringify({ errors: field.errors, warnings: field.warnings, validating: field.validating, touched: field.touched })}</output>
      {/snippet}
    </FormItem>
  {/each}
  <button type="submit">Go</button>
</Form>
