<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from '$lib';

  // The lab of the Form (e2e/form.spec.ts). Every form has its test ids; the tests read geometry and focus.
  const basic = createForm();
  const tall = createForm();
  const ime = createForm();
  let message = $state('Short');
  let finished = $state('');
  let failed = $state('');

  const long = 'A long message that needs more than one line to be shown in this narrow column of the form';
  const rows = Array.from({ length: 40 }, (_, index) => index + 1);
</script>

<main style="padding: 16px; display: grid; gap: 32px; justify-items: start">
  <section data-testid="lab-basic" style="width: 100%; max-width: 600px">
    <Form
      form={basic}
      name="basic"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 18 }}
      initialValues={{ user: '', pass: '', check: '' }}
      onfinish={(values) => (finished = JSON.stringify(values))}
      onfinishfailed={(info) => (failed = info.errorFields.map((field) => field.name.join('.')).join(','))}
    >
      <FormItem name="user" label="Username" rules={[{ required: true, message: 'Please input your username' }]} data-testid="item-user">
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} data-testid="input-user" {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem name="pass" label="Password" tooltip="Pick a strong password" data-testid="item-pass">
        {#snippet children(field)}
          <Input type="password" bind:value={field.value} data-testid="input-pass" {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem
        name="check"
        label="Check"
        rules={[{ validator: () => Promise.reject(message === 'Short' ? 'Short' : long) }]}
        data-testid="item-check"
      >
        {#snippet children(field)}
          <Input bind:value={field.value} status={field.status} data-testid="input-check" {...field.attrs} />
        {/snippet}
      </FormItem>
      <FormItem label="Last" data-testid="item-last">
        <span data-testid="last-content">content</span>
      </FormItem>
      <FormItem wrapperCol={{ offset: 6, span: 18 }} data-testid="item-submit">
        <Button htmlType="submit" data-testid="basic-submit">Send</Button>
      </FormItem>
    </Form>
    <p>
      <Button data-testid="validate-check" onclick={() => basic.validateFields(['check']).catch(() => {})}>validate</Button>
      <Button data-testid="long-message" onclick={() => (message = 'Long')}>long</Button>
      <Button data-testid="short-message" onclick={() => (message = 'Short')}>short</Button>
      <Button data-testid="reset" onclick={() => basic.resetFields()}>reset</Button>
    </p>
    <p data-testid="finished">{finished}</p>
    <p data-testid="failed">{failed}</p>
  </section>

  <section data-testid="lab-vertical" style="width: 100%; max-width: 600px">
    <Form name="vertical" layout="vertical" initialValues={{ a: '', b: '' }}>
      <FormItem name="a" label="Field A" data-testid="v-item-a">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="v-input-a" {...field.attrs} />{/snippet}
      </FormItem>
      <FormItem name="b" label="Field B" data-testid="v-item-b">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="v-input-b" {...field.attrs} />{/snippet}
      </FormItem>
    </Form>
  </section>

  <section data-testid="lab-inline" style="width: 100%; max-width: 900px">
    <Form name="inline" layout="inline" initialValues={{ a: '', b: '' }}>
      <FormItem name="a" label="Field A" data-testid="i-item-a">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="i-input-a" {...field.attrs} />{/snippet}
      </FormItem>
      <FormItem name="b" label="Field B" data-testid="i-item-b">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="i-input-b" {...field.attrs} />{/snippet}
      </FormItem>
    </Form>
  </section>

  <section data-testid="lab-rtl" dir="rtl" style="width: 100%; max-width: 600px">
    <Form name="rtl" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} initialValues={{ a: '' }}>
      <FormItem name="a" label="Field A" rules={[{ required: true, message: 'needed' }]} data-testid="r-item-a">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="r-input-a" {...field.attrs} />{/snippet}
      </FormItem>
    </Form>
  </section>

  <section data-testid="lab-feedback" style="width: 100%; max-width: 600px">
    <Form name="feedback" initialValues={{ s: 'x', w: 'x', e: 'x', v: 'x' }}>
      {#each [['s', 'success'], ['w', 'warning'], ['e', 'error'], ['v', 'validating']] as const as [name, status] (name)}
        <FormItem {name} label={status} hasFeedback validateStatus={status} help="{status} message" data-testid="f-item-{status}" required>
          {#snippet children(field)}
            <Input bind:value={field.value} status={field.status} data-testid="f-input-{status}" {...field.attrs}>
              {#snippet suffix()}{@render field.feedback?.()}{/snippet}
            </Input>
          {/snippet}
        </FormItem>
      {/each}
    </Form>
  </section>

  <section data-testid="lab-ime" style="width: 100%; max-width: 600px">
    <Form form={ime} name="ime" initialValues={{ text: '' }}>
      <FormItem name="text" label="Text" rules={[{ min: 3, message: 'too short' }]} data-testid="ime-item">
        {#snippet children(field)}<Input bind:value={field.value} data-testid="ime-input" {...field.attrs} />{/snippet}
      </FormItem>
    </Form>
  </section>

  <section data-testid="lab-tall" style="width: 100%; max-width: 600px">
    <Form form={tall} name="tall" initialValues={{ ...Object.fromEntries(rows.map((row) => [`f${row}`, ''])) }}>
      {#each rows as row (row)}
        <FormItem
          name="f{row}"
          label="Field {row}"
          rules={row === 38 ? [{ required: true, message: 'Field 38 is required' }] : []}
          data-testid="tall-item-{row}"
        >
          {#snippet children(field)}<Input bind:value={field.value} data-testid="tall-input-{row}" {...field.attrs} />{/snippet}
        </FormItem>
      {/each}
      <Button htmlType="submit" data-testid="tall-submit">Submit tall</Button>
    </Form>
  </section>
</main>
