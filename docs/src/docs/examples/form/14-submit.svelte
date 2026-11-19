<script lang="ts">
  import { Button, Form, FormItem, Input, RadioGroup, createForm } from 'svelte-ant-design';

  const form = createForm();

  type Mode = 'focus' | 'scroll' | 'off';
  let mode = $state<Mode>('focus');
  let active = $state('');
  const rows = [1, 2, 3, 4, 5, 6];

  function where() {
    // The first invalid field has been scrolled to, and focused with the default.
    setTimeout(() => {
      const element = document.activeElement;
      active = element && element.id ? `Focus is on: ${element.id}` : 'Focus did not move.';
    }, 50);
  }
</script>

<div class="stage">
  <div class="controls">
    <div class="field">
      <span class="caption">scrollToFirstError</span>
      <RadioGroup
        bind:value={mode}
        optionType="button"
        options={[
          { value: 'focus', label: '{ focus: true } (default)' },
          { value: 'scroll', label: 'true' },
          { value: 'off', label: 'false' }
        ]}
      />
    </div>
  </div>
  <div class="sheet">
    <Form
      {form}
      name="submit"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      scrollToFirstError={mode === 'focus' ? { focus: true } : mode === 'scroll' ? true : false}
      initialValues={Object.fromEntries(rows.map((row) => [`field${row}`, row === 3 || row === 5 ? '' : 'ok']))}
      onfinishfailed={where}
    >
      {#each rows as row (row)}
        <FormItem name="field{row}" label="Field {row}" rules={row === 3 || row === 5 ? [{ required: true, message: 'Field {row} is required' }] : []}>
          {#snippet children(field)}
            <Input bind:value={field.value} status={field.status} {...field.attrs} />
          {/snippet}
        </FormItem>
      {/each}
      <FormItem wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">Submit</Button>
      </FormItem>
    </Form>
  </div>
  {#if active}
    <div class="results">
      <p role="status">{active}</p>
    </div>
  {/if}
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
