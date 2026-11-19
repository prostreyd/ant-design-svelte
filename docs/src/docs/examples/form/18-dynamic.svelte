<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
  let count = $state(2);

  function add() {
    form.setFieldValue(['users', count, 'name'], '');
    count += 1;
  }

  function removeLast() {
    count -= 1;
  }
</script>

<div class="stage">
  <div class="sheet">
    <Form {form} name="dynamic" labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} initialValues={{ users: [{ name: 'Ann' }, { name: '' }] }}>
      {#each Array.from({ length: count }, (_, index) => index) as index (index)}
        <FormItem name={['users', index, 'name']} label="Name {index + 1}" preserve={false} rules={[{ required: true, message: 'Please input a name' }]}>
          {#snippet children(field)}
            <Input bind:value={field.value} status={field.status} {...field.attrs} />
          {/snippet}
        </FormItem>
      {/each}
    </Form>
  </div>
  <div class="row">
    <Button onclick={add}>Add a field</Button>
    <Button onclick={removeLast} disabled={count <= 1}>Remove the last</Button>
  </div>
  <div class="results">
    <div class="field">
      <span class="caption">getFieldsValue()</span>
      <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
    </div>
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

  .field {
    display: grid;
    justify-items: start;
    gap: 6px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
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

  .results pre {
    box-sizing: border-box;
    margin: 0;
    max-width: 100%;
    overflow-x: auto;
    padding: 10px 14px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-container);
    font-size: 12px;
  }
</style>
