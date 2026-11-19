# Form

A form collects, validates and submits a set of values. `Form` draws the `<form>` and owns the layout and the submit flow;
`FormItem` is one row: a label, the control, its messages and a hint. The API is inspired by Ant Design (MIT); the
implementation is original for Svelte. The rules are checked by [`@rc-component/async-validator`](https://www.npmjs.com/package/@rc-component/async-validator)
(MIT), the first runtime dependency of the package.

## Usage

```svelte
<script lang="ts">
  import { Button, Form, FormItem, Input, createForm } from 'svelte-ant-design';

  const form = createForm();
</script>

<Form {form} name="signup" initialValues={{ username: '' }} onfinish={(values) => save(values)}>
  <FormItem name="username" label="Username" rules={[{ required: true, message: 'Please input your username' }]}>
    {#snippet children(field)}
      <Input bind:value={field.value} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
  <Button htmlType="submit">Sign up</Button>
</Form>
```

A control is connected to its field through the `field` object that `FormItem` hands to its snippet, not by cloning the
child: bind `field.value` (`bind:value`, `bind:checked`, or a function binding to convert it), pass `field.status` to a
control that has a `status` prop, and spread `field.attrs` (`id`, `aria-describedby`, `aria-invalid`, `aria-required`,
`aria-labelledby`). Any control works, and the status of an item cannot leak into a popup.

### Typed values and your own model

```svelte
<script lang="ts">
  import { Form, FormItem, Input, createForm } from 'svelte-ant-design';

  interface Profile {
    username: string;
    email: string;
  }

  // Your own state holds the values; the instance is only for its methods.
  const values: Profile = $state({ username: '', email: '' });
  const form = createForm<Profile>();
</script>

<Form {form} model={values} rules={{ username: [{ required: true }] }} onfinish={(submitted) => save(submitted.username)}>
  <FormItem name="username" label="Username">
    {#snippet children(field)}
      <Input bind:value={values.username} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>
```

`createForm<Values>()` types the instance, and `Form` takes `Values` from `form` or from `model`. `model` must be a `$state`
object; the form reads and writes the values in it. A change of the model from outside (a bound control, `values.username = 'x'`)
counts as a change by the user, the methods of the instance (`setFieldValue`, `resetFields`) do not. With `model`,
`initialValues` fill only the keys it lacks, and `resetFields()` writes the model back as it was when the form mounted.
`rules` of the form are listed by field name and come before the rules of the item. The names of the items are not typed
(they reach the form through a context).

**A field that a control binds needs an initial value** (`initialValues` of the form or `initialValue` of the item): Svelte
throws `props_invalid_value` when `undefined` is bound to a prop that has a default (`Input`, `Switch`, `Checkbox`). In
development the item warns when a field has none.

## Form

| Prop | Type | Default |
|---|---|---|
| `form` | `FormInstance<Values>` from `createForm()` (`bind:form` returns the one the form makes) | made by the form |
| `model` | `Values`, your own `$state` object that holds the values | the store keeps them |
| `rules` | rules by field name, added before the rules of the item | |
| `initialValues` | `DeepPartial<Values>` (not reactive) | |
| `name` | `string`, the prefix of the control ids | a unique id |
| `layout` | `'horizontal' \| 'vertical' \| 'inline'` | `'horizontal'` |
| `labelCol`, `wrapperCol` | the props of `Col` | |
| `labelAlign` | `'start' \| 'end'` | `'end'` |
| `labelWrap`, `colon` | `boolean` | `false`, `true` |
| `requiredMark` | `boolean \| 'optional' \| Snippet` | `true` |
| `validateTrigger` | `'change' \| 'blur'` or a list | `'change'` |
| `validateMessages` | templates (`${name}`, `${min}`, ...) | English |
| `preserve` | `boolean` | `true` |
| `disabled`, `size`, `variant` | handed to the controls through `field` | |
| `tooltip` | default props of the label tooltips | |
| `scrollToFirstError` | `boolean \| ScrollIntoViewOptions & { focus?: boolean }` | `{ focus: true }` |
| `feedbackIcons` | one snippet per status | |
| `classNames`, `styles` | the parts `root`, `label`, `content`, `help`, `helpItem`, `extra` of every item | |
| `onfinish`, `onfinishfailed`, `onvalueschange`, `onfieldschange` | callbacks | |

The layout below 576 px stacks the label above the control. A failed submit focuses the first invalid field; `scrollToFirstError={false}`
turns that off. `novalidate` is set, because the rules validate.

## FormItem

`name` (a key or a path), `label` (text, snippet or `null`), `rules`, `required`, `help` (text, snippet or `false`), `extra`,
`tooltip`, `hasFeedback`, `validateStatus`, `validateFirst`, `validateTrigger`, `validateDebounce`, `dependencies`,
`initialValue`, `hidden`, `preserve`, `messageVariables`, `colon`, `labelAlign`, `labelWrap`, `labelCol`, `wrapperCol`,
`layout`, `htmlFor`. See the page of the component for the table.

## The instance

`createForm<Values>()` returns the instance: `getFieldValue`, `getFieldsValue`, `setFieldValue`, `setFieldsValue`, `getFieldError`,
`getFieldWarning`, `getFieldsError`, `isFieldTouched`, `isFieldsTouched`, `isFieldValidating`, `setFields`, `validateFields`,
`resetFields`, `submit`, `scrollToField`. Reading in markup, `$derived` or `$effect` is tracked. Values set from code clear the
messages and raise no change callback. A component inside a `Form` reaches the instance with `getFormInstance()`.

With `createForm<Values>()`, `getFieldsValue()` (no argument, a list of names or `{ filter }`) is typed as a deep partial of `Values`: it
reads the fields that have an item, so check a field before you use it. `getFieldsValue(true)` is the whole `Values`.
`onfinish` and `validateFields()` are typed `Values` and hold the fields that have an item at that moment: declare a field that can be hidden as optional (`age?: number`).

## Not in this version

`Form.List`, `Form.ErrorList`, `Form.Provider` and `noStyle` (names reserved), and the automatic passing of the status, `disabled`,
`size` and `variant` to controls through a context (they are passed through `field` for now).

## Accessibility

The label is a native `<label for>`; the star and the colon are `aria-hidden`, so the name of the control is the label text.
The messages are linked to the control with `aria-describedby` and are neither a live region nor `role="alert"`; the move of
focus on a failed submit is what announces it. A validation on every change waits for the end of an IME composition. Colour
is never the only signal. Checked with a real screen reader: Orca with Firefox. Not checked: NVDA, JAWS and VoiceOver, a real
IME keyboard on a phone, and touch devices other than the Chromium emulation.
