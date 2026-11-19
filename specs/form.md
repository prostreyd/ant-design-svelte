# Form specification (Form, FormItem, createForm)

Status: **agreed (workflow stage 2, 2026-11-17); implemented (stages 3 to 6, 2026-11-17)**; what implementation found out is in "Implementation notes". The maintainer answered Q1 to Q4 and Q2b,
then accepted the narrowings N1, N2 and the proposals P1 to P26 in one answer ("принимаю", 2026-11-17). Nothing is committed (it
waits for the maintainer's "запуш").

**Source.** The source code of Ant Design (React, Vue, Angular) was **not read** for this component. The comparison uses
documentation, changelogs, the issue trackers and black-box observation of the public demos (CLAUDE.md sections 2, 4a and 7a).
The Svelte facts below come from Svelte's own source in `node_modules` (a dependency of this project, not Ant Design) and from
throwaway tests that were deleted. The rules are checked by an **npm dependency** (Q2b), whose **README** was read for this
document; its source is not read and is not needed (we call its documented API).

| Source | Page | Version / date checked |
|---|---|---|
| Ant Design (React) | <https://ant.design/components/form> (the page's markdown, `components/form/index.en-US.md`) | 6.7.x (the `labelAlign` row of the table names 6.7.0), 2026-11-17 |
| Ant Design Vue | `components/form/index.en-US.md` in the repository (docs text only; the site renders on the client; standing permission) | `main` branch, 2026-11-17 |
| NG-ZORRO (Angular) | `components/form/doc/index.en-US.md` in the repository (docs text only) | `master` branch, 2026-11-17 |
| Changelogs | `ant-design/ant-design` `CHANGELOG.en-US.md` (6.x line), `vueComponent/ant-design-vue` `next/CHANGELOG.en-US.md`, `NG-ZORRO/ng-zorro-antd` `CHANGELOG.md` | 2026-11-17 |
| Issue trackers | React 52661, 28748, 59443, 59702, 59703 (read through the GitHub API, code removed from comments) | 2026-11-17 |
| Validation library | npm manifests and READMEs of `@rc-component/async-validator` 6.0.0 and `async-validator` 4.2.5 (docs only) | 2026-11-17 |
| Black-box | the public "Basic Usage" and "Semantic DOM" demos on <https://ant.design/components/form>, Chromium under Playwright, 2026-11-17 (results below) | |

## What it is

**Form** collects, validates and submits a set of values. A **`Form`** is the `<form>` and owns the layout defaults and the
submit flow; a **`FormItem`** is one row: a label, the control, and below it the validation messages and an extra hint. Rules
(`required`, `min`, `pattern`, a custom `validator`, ...) decide the status of a field; the status is shown as colour, text
and (optionally) an icon.

All three libraries have it, but with **three different architectures**:

| | React | Vue | Angular |
|---|---|---|---|
| Where the values live | A store inside `Form` (`Form.useForm()` returns its instance, `FormInstance`). Field values are addressed by a **name path**. | The consumer's own reactive `model` object; `Form.Item name` is a key of it. | Angular Forms (`FormControl`, `NgModel`); the Ant Design component only displays their state. |
| How the control is connected | `Form.Item` **clones its single child** and injects `value` and `onChange` (`valuePropName`, `trigger`, `getValueFromEvent` tune it). | Since 3.0 the item **no longer hijacks the child**: controls call an injected item context (`useInjectFormItemContext`); our-own controls do it for you. | Angular's own directives (`formControlName`, `ngModel`) on the control; `nz-form-control` finds the first one. |
| Validation | `rules` on the item (async-validator rules), `validateFields()` | `rules` on the item or on the form (async-validator rules), `validate()` | Angular validators; the messages are tips (`nzErrorTip`, `nzAutoTips`) |
| Layout | `Form.Item` = row; `labelCol` / `wrapperCol` are `Col` props | same | three components `nz-form-item`, `nz-form-label`, `nz-form-control`; `nz-row` / `nz-col` APIs apply |

What this means for Svelte: the **layout, the item markup, the status look and the rules** carry over; the **connection of a
control** cannot (no child cloning, no injected context in our controls today): it is the main design question (Q1).

## Findings (2026-11-17)

### Black-box, React 6.7.x

Measured on the public demos of <https://ant.design/components/form> (Chromium):

1. **A field in error** (the "Basic Usage" demo after an empty submit) is
   `<input id="basic_username" aria-required="true" aria-describedby="basic_username_help" aria-invalid="true">` with the
   control's own error class; the messages are `<div id="basic_username_help">` holding one `<div>` per message. The ids are
   `<form name>_<field name>` and `<...>_help`.
2. **The message container has no `role` and no `aria-live`** (the React changelog and the tracker say the same: public issue
   52661 asked to make `role="alert"` of the field error optional, because many accessibility experts call it a problem for
   field-level errors; the current page has none). A screen reader hears the message only when the control gets focus (through
   `aria-describedby`); nothing announces it when it appears.
3. **A failed submit does not move focus**: after an empty submit of the "Basic Usage" demo the active element was the submit
   button. Focus moves only with `scrollToFirstError` (`{ focus: true }`, React 5.24.0).
4. **Semantic parts** of the item, measured on the "Semantic DOM" demo: `root`, `label`, `content`, `help`, `helpItem`,
   `extra` (React 6.0.0, the last three 6.4.0). They are the parts of **every item**, set once on the `Form`.
5. The item is `Row > [label Col > <label for>] + [control Col > control box + messages area]`, and a
   `margin-offset` element after the row. The text of the `<label>` has no star: the required state is a class on it
   (drawn by the stylesheet).

### Public traces (changelogs, trackers): each becomes a point below

- **React 6.x**: `labelAlign` gets `start` / `end`, `left` / `right` are kept **and deprecated** (we take `start` / `end`, 4a).
  `aria-describedby` was added for the messages (28748 asked for it, 2021) and for warning-only messages (59443). The open
  issues 59702 / 59703: the `aria-describedby` of a `noStyle` item points to a help id that does not exist (the reason
  `noStyle` is deferred, P12). Fixes: **form height fluctuating during rapid validation state changes** (layout test, VAL-9);
  vertical layout and `labelCol.offset` (FORM-4); `help={false}` still showing messages (ITEM-8); numeric `0` as a label or help
  (ITEM-1); trailing `|` removed from a label when the colon is drawn (our colon is CSS only, no string work, ITEM-3);
  `noStyle` fields losing the parent status; **the status of Form.Item leaking into `popupRender` content and Popover content
  of Select, TreeSelect, Cascader, Mentions** (two 6.x changelog entries: a *context* leaks into everything below the item;
  an explicit `field` object cannot, Q1).
- **Vue**: `validateFirst` not rejecting with several rules (4273), `scrollToFirstError` options, nested fields not scrollable
  (5404), `validate` event (4817). Vue's own note says an item cannot tell which of several inputs to collect (the 2.x/3.x
  notes); our `field` object belongs to the one control the consumer wires.
- **Angular**: nothing on accessibility; `nz-form-explain`, `nz-form-extra` removed in favour of `nzExtra` and tips.
- **No public record of IME, forced-colors or real-screen-reader testing** of Form in any of the three (same as for Select).

### The validation library (Q2b; manifests and READMEs, 2026-11-17)

| | `@rc-component/async-validator` (chosen) | `async-validator` |
|---|---|---|
| Version, last release | 6.0.0, 2026-06-11 | 4.2.5, 2022-06-17 |
| Used by | React Ant Design | Vue Ant Design |
| Dependencies | `@babel/runtime` | none |
| Types | the list of VAL-3 **with `tel`** | the same without `tel` |
| Licence, entry | MIT, ESM entry `es/`, types | MIT, ESM entry `dist-web/`, types, `sideEffects: false` |

What the documented API gives us: a descriptor keyed by field name, `validate(source, options)` returning a promise that
rejects with `{ errors, fields }`; the options `first`, `firstFields`, `suppressWarning` and `messages` (deep-merged with its
`%s` defaults); the rule keys `type`, `required`, `pattern`, `min` / `max` / `len` (length of a string or array, value of a
number; `len` wins over a range), `enum`, `whitespace`, `fields`, `defaultField`, `transform`, `message` (string, any value,
or a function), `validator` (returns `false`, an error, an array of errors, or calls a callback) and `asyncValidator`
(a promise). What it does **not** have, so Form's adapter (`validate.ts`) supplies it: `warningOnly`, a rule given as a
function of the form, a rule's own `validateTrigger`, the `${name}` message templates and `messageVariables`,
`validateFirst: 'parallel'`, the debounce, the cancelling of stale runs, and the mapping of a name path to a descriptor.
It prints a console warning for some invalid values unless `suppressWarning` is passed (it is). Everything outside the rule
check (the store, the triggers, the status, the layout, the accessibility) is ours.

### Svelte facts that shape the API (checked)

- `bind:value={field.value}` is allowed when `field` is a **snippet parameter** and `value` is a property (the compiler only
  forbids binding the parameter itself); `bind:checked={field.value}` as well; the function binding
  `bind:value={() => f(field.value), (v) => (field.value = g(v))}` compiles too. Checked with `svelte/compiler`, Svelte 5.57.
- A getter reads **reactively** if it reads state: Svelte warns (`binding_property_non_reactive`, dev only) when a bound
  property has no reactive dependencies; a getter over the store has them.
- **`bind:` of `undefined` to a prop with a default throws** in runes mode (`props_invalid_value`): `Switch checked`, `Input
  value` and `CheckboxGroup value` threw in a test; `Select value` (no default) did not. So **a field that a control binds must
  have an initial value** (the same trap as React's "`setFieldsValue(undefined)` does not respond", just louder). It is a
  contract point (STORE-11) with a development warning.
- A control that gets a **defined** value does not write to the parent at mount (`Switch`, `Input`: no setter call at mount).
  The setter of `field.value` is therefore the **user-change path** only, like React's `onChange`; a programmatic
  `setFieldValue` goes around it (STORE-4).
- Our `Input` reports `onchange` **while an IME composition is open** (spec of Input, "IME composition"), so a `change`
  validation would run on every composition update unless the item holds it back (VAL-2).

## Differences between the three libraries

Legend: **core** = in React and Vue with the same meaning (5a); **cheap** = React (or React and Angular) only, estimated at
one day or less; **v1.1** = reserved name and contract; **no** = not taken, with the reason.

### Form

| Feature | React | Vue | Angular | Decision |
|---|---|---|---|---|
| `layout` | `horizontal` (default), `vertical`, `inline`; horizontal stacks labels above controls at ≤ 575 px | same three | `nzLayout`, same three | **core**. The ≤ 575 px stacking is measured before implementation (open point O2) |
| `labelCol`, `wrapperCol` | `Col` props, can use `sm: {...}` | same | `nz-col` API on label and control | **core**; type is the props of our `Col` (rule 6b) |
| `labelAlign` | `start` \| `end` (default `end`); `left` \| `right` deprecated in 6.x | `'left'` \| `'right'` (`'right'`) | `'left'` \| `'right'` | **core, with the React 6.x names `start` / `end`**; `left` / `right` **no, deprecated** (4a, chain `left`/`right` → `start`/`end`) |
| `labelWrap` | boolean (false) | boolean (false) | boolean (false) | **core** |
| `colon` | boolean (true) | boolean (true) | `nzNoColon` (the inverse) | **core**, React name and sense |
| `requiredMark` | `boolean` \| `'optional'` \| function (label, {required}) | `hideRequiredMark` (boolean) | `nzRequiredMark` (`NzRequiredMark`: the required mark or the optional mark) | **core**: `boolean \| 'optional' \| Snippet<[label, {required}]>`; `hideRequiredMark` **no** (React replaced it by `requiredMark`, 4.8.0) |
| `name` | prefix of field ids | same | none | **core** |
| `form` | `FormInstance` (created if omitted) | none (a `model` instead) | none | **core idea, Svelte form**: `form` (`$bindable`), made by `createForm()` (Q1) |
| `initialValues` | object | the model's own values | the control's value | **core** |
| `validateTrigger` | `string \| string[]`, `onChange` | `string \| string[]`, `change` | none | **core**; values are `'change'` and `'blur'` (the Vue form; React writes the event prop names, P7) |
| `validateMessages` | message templates (`${name}`) | none | `nzAutoTips` (per error key) | **cheap**, our templates over the library's `messages` (English defaults; locale through ConfigProvider is v1.1) |
| `scrollToFirstError` | `boolean \| options \| { focus }`, default `false` | `boolean \| options`, default `false` | none | **core**; `boolean \| (ScrollIntoViewOptions & { focus?: boolean })` (N2). **Default `{ focus: true }`, not `false` (Q4, a deviation from both)**; `true` scrolls only, as in React |
| `onFinish`, `onFinishFailed` | callbacks | events `finish`, `finishFailed` | none | **core**: `onfinish`, `onfinishfailed` |
| `onValuesChange` | callback | none | none | **cheap**: `onvalueschange` |
| `onFieldsChange` | callback | event `validate` (per item) | none | **cheap**: `onfieldschange` (Vue's `validate` **no**, covered) |
| `disabled` | boolean | boolean | none | **core**, by hand: `field.disabled` for the control (Q3 B); the automatic propagation is v1.1 |
| `size` | `small \| medium \| large` | none | `nzSize`: `small \| default \| large` | **cheap**: `'small' \| 'medium' \| 'large'` (React; Angular's `default` is our `medium`); by hand through `field.size` (Q3 B) |
| `variant` | `outlined \| borderless \| filled \| underlined` | none | `nzVariant`: same four | **cheap**, same four; by hand through `field.variant` (Q3 B) |
| `preserve` | boolean (true) | none | none | **cheap** |
| `tooltip` (defaults for all items) | `TooltipProps & { icon }` | none | `nzTooltipIcon` (icon only) | **cheap** |
| `classNames`, `styles` | 6.0.0, parts of every item | none | none | **cheap** (P14): `root`, `label`, `content`, `help`, `helpItem`, `extra` (the measured names) |
| `feedbackIcons` | 5.9.0, function by status | none | none | **cheap**: record of snippets by status (Q3) |
| `fields` (state manager) | `FieldData[]` | none | none | **no**: the store has `setFields` (React-only, the consumer owns the store) |
| `component` | element, or `false` | none | none | **no**: React render-element detail (a `<form>` is always drawn; items work in any container) |
| `clearOnDestroy` | boolean | none | none | **no**: the store belongs to the consumer, not to the `Form`; `resetFields()` does it |
| `model`, `rules` (form-level) | none | `model`, `rules` | none | **taken on request (2026-11-18, revision R)**: `model` is the consumer's own `$state` object that the store reads and writes (Q5 A: a direct change counts as a user change); form-level `rules` are keyed by name and added to the item's (Q6 B). First decided "no (Vue-only)" on 2026-11-17 |
| `validateOnRuleChange`, `autoLink` | none | yes | none | **no** (Vue-only, tied to child detection) |
| `nzAutoTips`, `nzDisableAutoTips`, tips per status | none | none | yes | **no** (Angular-only: messages per Angular error key) |
| `nz-form-split`, `nz-form-text` | none | none | yes | **no** (Angular-only trivial layout helpers) |
| `onSubmit` | not accepted | `submit` event | native | **no**: `onfinish` replaces it (the type omits `onsubmit`) |

### FormItem

| Feature | React | Vue | Angular | Decision |
|---|---|---|---|---|
| `name` (NamePath: `string \| number \| (string \| number)[]`) | yes | yes (a key of `model`) | none | **core** |
| `label` | ReactNode (`null` since 5.22: keeps the colon alignment) | `string \| slot` | label component | **core**: `string \| Snippet \| null` (no narrowing) |
| `rules` | `Rule[]` | object \| array | validators | **core** |
| `required` | boolean (derived from rules when unset) | boolean (derived) | `nzRequired` on the label | **core** |
| `help`, `extra` | ReactNode | `string \| slot` | `string \| TemplateRef` | **core**: `string \| Snippet`; `help` also `false` (ITEM-8) |
| `tooltip` | `ReactNode \| TooltipProps & { icon }` | `string \| slot` | `nzTooltipTitle`, `nzTooltipIcon` (`string \| TemplateRef`) | **core**: `string \| Snippet \| (TooltipProps & { icon?: string \| Snippet })` |
| `hasFeedback` | `boolean \| { icons }` | boolean | boolean | **core** (Q3 decides how the icon reaches the control) |
| `validateStatus` | `success`, `warning`, `error`, `validating` | same | same or a control | **core** |
| `validateFirst` | `boolean \| 'parallel'` | boolean | none | **core** (`'parallel'` is cheap, 4.5.0) |
| `validateTrigger` | `string \| string[]` | `string \| string[]` | none | **core** |
| `htmlFor` | string (`null` disables the association) | string | `nzFor` | **core** |
| `colon`, `labelAlign`, `labelCol`, `wrapperCol` | per item | per item | per component (`nz-form-label`, `nz-form-control`) | **core** (the item wins over the form) |
| `labelWrap` per item | form only | form only | per label (`nzLabelWrap`) | **cheap** (React and Vue have it on the form only; the item value is an addition) |
| `layout` (per item) | `horizontal \| vertical` (5.18.0) | none | `nzLayout` (21.3.0) | **cheap** |
| `initialValue` | any (the form's `initialValues` wins) | none | none | **cheap** |
| `hidden` | boolean | none | none | **cheap** |
| `preserve` | boolean | none | none | **cheap** |
| `dependencies` | `NamePath[]` | none | none | **cheap-to-medium** (about 1 day; VAL-8; proposed in v1.0, P11) |
| `messageVariables` | record | none | none | **cheap** |
| `validateDebounce` | number (5.9.0) | none | none | **cheap** |
| `noStyle` | boolean | listed (3.0) | none | **v1.1** (P12) |
| `normalize`, `getValueFromEvent`, `getValueProps`, `valuePropName`, `trigger` | yes (they tune the child cloning) | none | none | **no** (React-only, no child cloning in Svelte): `bind:checked`, `bind:value`, function bindings do the same (P5) |
| `shouldUpdate` | boolean \| function | none | none | **no**: reading values in markup or `$derived` is already reactive |
| `Form.Item.useStatus` | hook | none | none | **v1.1** with the shared status (Q3) |
| `autoLink`, `a-form-item-rest` | none | yes | none | **no** (Vue-only child detection) |

### Instance, hooks, other components

| Feature | React | Vue | Angular | Decision |
|---|---|---|---|---|
| `getFieldValue`, `getFieldsValue` (also `true`, a name list, `{ filter }`) | yes | none | none | **cheap**, part of the store |
| `setFieldValue`, `setFieldsValue` | yes (reset the messages, no change callbacks) | none (assign the model) | none | **cheap** |
| `getFieldError`, `getFieldsError` | yes | none | none | **cheap**; plus `getFieldWarning` (P20) |
| `isFieldTouched`, `isFieldsTouched`, `isFieldValidating` | yes | none | none | **cheap** |
| `setFields` | yes | none | none | **cheap** |
| `validateFields` (+ `validateOnly`, `recursive`, `dirty`) | yes | `validateFields`, `validate` | none | **core** `validateFields(names?)`; the three flags **cheap** |
| `resetFields` | yes | yes | none | **core** |
| `scrollToField` | yes | yes | none | **core**, with `{ focus }` |
| `submit` | yes | none | none | **cheap** |
| `clearValidate` | none | yes | none | **no** (Vue-only; `setFields` with empty errors covers it, P21) |
| `getFieldInstance` | yes (a React ref) | none | none | **no** (React refs) |
| `Form.useForm` | hook | `useForm` composable | none | **core idea**: `createForm()` |
| `Form.useFormInstance` | hook | none | none | **cheap**: `getFormInstance()` (reads the context of the nearest `Form`) |
| `Form.useWatch` | hook | none (reactive model) | none | **no**: values are reactive state, a `$derived` over `form.getFieldValue('x')` watches |
| `Form.List`, `operation`, `Form.ErrorList` | yes | none | none | **v1.1**: names `FormList`, `FormErrorList` reserved (P13) |
| `Form.Provider` | yes | none | none | **v1.1**: name `FormProvider` reserved (P13) |
| Rules: `required`, `type`, `len`, `min`, `max`, `pattern`, `enum`, `whitespace`, `transform`, `validator`, `message` | yes | yes | none (Angular validators) | **core**, checked by the library (Q2b) |
| Rules: `defaultField`, `fields` | yes | through the library's own docs | none | **core by inheritance**, checked by the library |
| Rules: `warningOnly`, a rule as a function of the form, `validateTrigger` per rule | yes | `trigger` (Vue's name for `validateTrigger`) | none | **cheap**, our adapter; `trigger` **no** (React name `validateTrigger`) |
| `validator` shape | `(rule, value) => Promise` | `(rule, value, callback)` | none | `(rule, value) => void \| Promise`, throw or reject to fail (P8); the callback form **no** (Vue legacy) |

### Value forms checked per prop (rule 5, point 4)

| Prop | Forms in the originals | Our type | Narrowing? |
|---|---|---|---|
| `label`, `help`, `extra` | ReactNode / `string \| slot` / `string \| TemplateRef` | `string \| Snippet` (`label` also `null`, `help` also `false`) | none |
| `tooltip` | ReactNode or props object / `string \| slot` / `string \| TemplateRef` | `string \| Snippet \| (TooltipProps & { icon?: string \| Snippet })` | none |
| `requiredMark` | boolean, `'optional'`, function / `hideRequiredMark` boolean / the required mark or the optional mark | `boolean \| 'optional' \| Snippet` | none (the function form is React 5.9.0; ours is a snippet) |
| Rule `message` | `string \| ReactElement` / `string` / n/a | **`string`** | **yes: no markup in a rule message.** Errors are data (`getFieldError` returns `string[]`, `onfinishfailed` carries them), and a snippet cannot be kept in them; rich content is the item's `help` snippet. **Maintainer decision N1** |
| `scrollToFirstError` | `boolean`, the options of the helper library `scroll-into-view-if-needed`, `{ focus }` | `boolean \| (ScrollIntoViewOptions & { focus?: boolean })` | **yes: the helper library's own options (`scrollMode`, `boundary`, ...) are not taken** (we have no such dependency; the native options are `behavior`, `block`, `inline`). **Maintainer decision N2** |
| `labelCol`, `wrapperCol` | `Col` props object | `Omit<ComponentProps<typeof Col>, 'children'>` | none |
| `initialValue` | typed `string` in the table, any in use | `unknown` | none |

## Scope v1.0

- **Core (React ∩ Vue, 5a):** `Form` (`layout`, `labelCol`, `wrapperCol`, `labelAlign`, `labelWrap`, `colon`, `requiredMark`,
  `name`, `form`, `initialValues`, `validateTrigger`, `scrollToFirstError`, `onfinish`, `onfinishfailed`); `FormItem` (`name`,
  `label`, `rules`, `required`, `help`, `extra`, `tooltip`, `hasFeedback`, `validateStatus`, `validateFirst`, `validateTrigger`,
  `htmlFor`, the per-item layout props); the rule keys; `validateFields`, `resetFields`, `scrollToField`; `createForm()`.
- **Cheap React additions (each estimated at one day or less):** the rest of the instance (`getFieldValue(s)`, `setFieldValue(s)`,
  `getFieldError(s)`, `getFieldWarning`, `isField*`, `setFields`, `submit`, the three `validateFields` flags);
  `FormItem` `layout`, `labelWrap`, `initialValue`, `hidden`, `preserve`, `dependencies`, `messageVariables`, `validateDebounce`;
  rules `warningOnly`, `defaultField`, `fields`, rule-as-function, per-rule `validateTrigger`; `Form` `validateMessages`,
  `preserve`, `tooltip`, `classNames`, `styles`, `onvalueschange`, `onfieldschange`, `feedbackIcons`, **`size`, `variant`**
  (Q3 B: handed to the controls by hand through `field`); `getFormInstance()`. `disabled` is core and handed over the same way.
- **Reserved for v1.1 (name and contract fixed now, so the addition is additive):** `FormList` (and `operation`),
  `FormErrorList`, `FormProvider`; `noStyle`; the **automatic** propagation of `disabled`, `size`, `variant` and the status to
  our controls (a context, with `ConfigProvider`; the props above stay and keep their meaning); `Form.Item.useStatus`
  (`getFormItemStatus()`); locale of the default messages through `ConfigProvider`.
- **Vue additions taken on request (2026-11-18, revision R):** `Form` `model` and form-level `rules`; and a typed instance,
  `createForm<Values>()`, that neither original has in this form (React types `FormInstance<Values>` only for some members).
- **Not taken, Vue/Angular-only:** see the tables (`validateOnRuleChange`, `autoLink`,
  `a-form-item-rest`, `clearValidate`, the `validate` event; `nzAutoTips`, tips per status, `nz-form-split`, `nz-form-text`).
- **Not taken, React-only and not suited to Svelte:** `normalize`, `getValueFromEvent`, `getValueProps`, `valuePropName`,
  `trigger` (no child cloning), `shouldUpdate`, `Form.useWatch`, `getFieldInstance`, `component`, `fields`, `clearOnDestroy`.

## The shape of the API (agreed 2026-11-17)

```svelte
<script lang="ts">
  import { Form, FormItem, Input, Switch, Button, createForm } from 'svelte-ant-design';
  const form = createForm();
</script>

<Form {form} name="signup" layout="vertical" initialValues={{ username: '', remember: true }}
      onfinish={(values) => save(values)}>
  <FormItem name="username" label="Username" rules={[{ required: true, message: 'Please input your username' }]}>
    {#snippet children(field)}
      <Input bind:value={field.value} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
  <FormItem name="remember" label="Remember me">
    {#snippet children(field)}
      <Switch bind:checked={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
  <Button htmlType="submit">Sign up</Button>
</Form>
```

### `Form`

| Prop / callback | Svelte type | Default | Contract |
|---|---|---|---|
| `form` | `FormInstance<Values>` (`$bindable`) | created | The store. Omitted: the `Form` creates one and writes it back, so `<Form bind:form>` gives it to the parent. `Values` is inferred from it (revision R). |
| `model` | `Values` | — | The consumer's own `$state` object (revision R, Vue-like). The store reads and writes the values of the fields in it; without it the store keeps them itself. See R2 to R9. |
| `rules` | `FormRules` | — | Rules by field name (revision R, Vue-like), added to the `rules` of the item with that name. See R10. |
| `initialValues` | `DeepPartial<Values>` | — | Applied when the form mounts and by `resetFields`; not reactive (React: changes later are ignored, use `setFieldsValue`). With `model`: fills only the keys the model lacks (R5). |
| `name` | `string` | — | Prefix of the ids of the fields (`signup_username`). Unset: a unique id of the form is used, so two forms with the same field names never share ids (a known React trap in its FAQ). |
| `layout` | `'horizontal' \| 'vertical' \| 'inline'` | `'horizontal'` | |
| `labelCol`, `wrapperCol` | `Omit<ComponentProps<typeof Col>, 'children'>` | — | Defaults for the items; an item's own value wins. |
| `labelAlign` | `'start' \| 'end'` | `'end'` | |
| `labelWrap` | `boolean` | `false` | |
| `colon` | `boolean` | `true` | Only in `horizontal` layout. |
| `requiredMark` | `boolean \| 'optional' \| Snippet<[label, { required }]>` | `true` | Form level only (as in React). |
| `validateTrigger` | `'change' \| 'blur' \| ('change' \| 'blur')[]` | `'change'` | Default of the items. |
| `validateMessages` | `FormValidateMessages` | English | Templates for the generated messages (`${name}`, `${min}`, ...). |
| `preserve` | `boolean` | `true` | Default of the items. |
| `disabled` | `boolean` | `false` | Handed to the controls by hand: `field.disabled` (Q3 B). The `Form` itself does not disable anything. |
| `size` | `'small' \| 'medium' \| 'large'` | — | Handed to the controls by hand: `field.size`. Unset: `undefined`, so the control keeps its own default. |
| `variant` | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | — | Handed over by hand: `field.variant`. |
| `tooltip` | `TooltipProps & { icon?: string \| Snippet; iconLabel?: string }` | — | Default props of every item tooltip. |
| `scrollToFirstError` | `boolean \| (ScrollIntoViewOptions & { focus?: boolean })` | `{ focus: true }` | After a failed submit: scroll the first invalid control into view **and focus it** (Q4 B). `true`: scroll only (React); `{ focus: true, behavior: 'smooth' }` and so on; `false`: nothing moves. |
| `feedbackIcons` | `Partial<Record<FormValidateStatus, Snippet>>` | built-in icons | Used by items with `hasFeedback`. |
| `classNames`, `styles` | parts `root`, `label`, `content`, `help`, `helpItem`, `extra` | — | Apply to every item. |
| `onfinish` | `(values: Values) => void` | — | After a submit whose validation passed. |
| `onfinishfailed` | `({ values, errorFields, outOfDate }) => void` | — | After a submit whose validation failed. |
| `onvalueschange` | `(changed: DeepPartial<Values>, all: Values) => void` | — | After a **user** change (not `setFieldValue(s)`). With `model`, a direct change of the model counts (Q5 A). |
| `onfieldschange` | `(changedFields, allFields) => void` | — | After any change of a field's value, touched, validating, errors or warnings. |
| `children` | `Snippet` | — | |
| `class`, `style`, native attributes | `HTMLFormAttributes` without `onsubmit` | — | `novalidate` is set (P6). |

The automatic propagation of `disabled`, `size`, `variant` (and the status) to controls without the consumer spreading them is
reserved for v1.1 (a context); the props keep their meaning then, so the change is additive.

### `FormItem`

| Prop | Svelte type | Default | Contract |
|---|---|---|---|
| `name` | `FormNamePath` | — | Connects the item to a field. Unset: a layout-only row. |
| `label` | `string \| Snippet \| null` | — | `null` keeps the label column and the colon, drawing no text. |
| `rules` | `FormRule[]` | — | |
| `required` | `boolean` | derived from `rules` | `false` turns the mark off even with a `required` rule. |
| `help` | `string \| Snippet \| false` | generated | Replaces the generated messages; `false` hides them. |
| `extra` | `string \| Snippet` | — | |
| `tooltip` | `string \| Snippet \| (TooltipProps & { icon?: string \| Snippet; iconLabel?: string })` | — | `iconLabel` is the accessible name of the icon button (default `More information`). |
| `hasFeedback` | `boolean \| { icons: Partial<Record<FormValidateStatus, Snippet>> }` | `false` | The icon is given to the consumer as `field.feedback` (Q3); nothing is drawn unless the consumer places it. |
| `validateStatus` | `'success' \| 'warning' \| 'error' \| 'validating'` | derived | |
| `validateFirst` | `boolean \| 'parallel'` | `false` | |
| `validateTrigger` | like the form | the form's | |
| `validateDebounce` | `number` | — | Milliseconds. |
| `dependencies` | `FormNamePath[]` | — | VAL-8. |
| `initialValue` | `unknown` | — | The form's `initialValues` wins. Not under a list (v1.1). |
| `hidden` | `boolean` | `false` | `display: none`; the field is still collected and validated. |
| `preserve` | `boolean` | the form's | `false`: the value is removed when the item is destroyed. |
| `messageVariables` | `Record<string, string>` | — | |
| `colon`, `labelAlign`, `labelWrap`, `labelCol`, `wrapperCol`, `layout` | as on the form (`layout`: `'horizontal' \| 'vertical'`) | the form's | The item wins. |
| `htmlFor` | `string \| null` | the field id | `null` removes the label association. |
| `children` | `Snippet<[FormField]>` | — | The control. |
| `class`, `style`, native attributes | | | Root. |

Reserved: `noStyle` (v1.1, P12).

### `FormField` (the argument of `children`)

| Member | Type | Contract |
|---|---|---|
| `value` | `any` (get / set) | The field value. **The setter is the user-change path**: it stores the value, marks the field touched, runs the `change` validation, calls `onvalueschange` and the `dependencies`. Bind it: `bind:value={field.value}`, `bind:checked={field.value}`, or a function binding for a transform. |
| `status` | `'error' \| 'warning' \| undefined` | For the `status` prop of controls that have one (`Input`, `Select`). |
| `disabled`, `size`, `variant` | `boolean`, `FormSize`, `FormVariant` (or `undefined`) | The form's values, for the matching props of the control (`disabled={field.disabled}`). `undefined` leaves the control's own default. Explicit pass-through: no context (Q3 B). |
| `attrs` | `{ id, 'aria-describedby', 'aria-invalid', 'aria-required', 'aria-labelledby' }` (the ones that apply) | Spread on the control element. `aria-labelledby` is set whenever the item has a label. |
| `errors`, `warnings` | `string[]` | The messages. |
| `validating`, `touched` | `boolean` | |
| `feedback` | `Snippet \| undefined` | The `hasFeedback` icon, for the suffix slot of a control (Q3 A / B). |

### `FormInstance` (from `createForm()` or `getFormInstance()`)

`getFieldValue(name)`, `getFieldsValue(names?: FormNamePath[] | true, { filter }?)`, `setFieldValue(name, value)`,
`setFieldsValue(values)`, `getFieldError(name)`, `getFieldWarning(name)`, `getFieldsError(names?)`, `isFieldTouched(name)`,
`isFieldsTouched(names?, allTouched?)`, `isFieldValidating(name)`, `resetFields(names?)`, `setFields(fields)`, `submit()`,
`validateFields(names?, { validateOnly?, recursive?, dirty? })`, `scrollToField(name, options?)`. Reads inside `$derived`,
markup or `$effect` are tracked. Methods go in the API table of the page only, with no example block of their own (rule 4,
step 6); their tests stay.

### Rule

`FormRule = FormRuleConfig | ((form: FormInstance) => FormRuleConfig)`; `FormRuleConfig`: `required`, `type`
(`string`, `number`, `boolean`, `integer`, `float`, `array`, `object`, `enum`, `url`, `email`, `tel`, `date`, `regexp`,
`hex`, `method`, `any`), `len`, `min`, `max`, `pattern`, `enum`, `whitespace`, `transform`, `message`, `validator`
(`(rule, value) => void | Promise<void>`; a thrown error or a rejection is the message), `warningOnly`, `defaultField`,
`fields`, `validateTrigger`. The rule keys up to `fields` are checked by `@rc-component/async-validator` (Q2b); our adapter
(`validate.ts`) is the only file that imports it, so the engine can be replaced without touching the public API.
`warningOnly`, the function form, the per-rule trigger, the message templates and `validateFirst` are the adapter's.

## Behavior

Each numbered point gets at least one test (rule 7).

### Store

- **STORE-1** `createForm()` returns a `FormInstance`. Reading a value, an error or a flag in markup, `$derived` or `$effect`
  tracks it; a change re-runs only the readers of that field.
- **STORE-2** A name is `string | number | (string | number)[]`; values are nested objects. A **number** in a path creates an
  array when the parent is missing (`['users', 0, 'name']`); a string `'0'` keeps an object (React FAQ).
- **STORE-3** The `Form` applies `initialValues` when it mounts. `resetFields()` restores the initial values (the item
  `initialValue`s too) and clears touched, errors, warnings and validating; `resetFields(names)` does it for those fields only.
- **STORE-4** `setFieldValue(name, v)` and `setFieldsValue(values)` write the value(s) and **clear the messages** of those
  fields. They call **no** `onvalueschange`, run **no** validation and trigger **no** `dependencies` (only user interaction
  does; the React FAQ gives the reason, avoiding loops). `setFieldsValue` merges deeply and does not touch other fields.
- **STORE-5** `getFieldsValue()` returns the values of the **registered** fields (those with a mounted item), nested;
  `getFieldsValue(true)` all values in the store; `getFieldsValue(names)` those paths; `{ filter }` receives `{ touched,
  validating }` per field.
- **STORE-6** `getFieldError`, `getFieldWarning`, `getFieldsError` (`{ name, errors, warnings }`), `isFieldTouched`,
  `isFieldsTouched(names?, allTouched?)`, `isFieldValidating` read the per-field flags. A field is **touched** after a user
  change or a blur-triggered validation, until `resetFields`.
- **STORE-7** `validateFields(names?, config?)` validates the registered fields (or `names`; `recursive` also the ones below
  a path; `dirty` only the touched or already validated ones) and returns a promise of the values, or **rejects** with
  `{ values, errorFields, outOfDate }`. A run that a newer one superseded has `outOfDate: true`. `validateOnly` computes
  without showing messages or setting the status.
- **STORE-8** `submit()` does what pressing a submit button does (FORM-2).
- **STORE-9** `scrollToField(name, options)` scrolls the control into view (`options` as `scrollToFirstError`).
- **STORE-10** `preserve`: an item with `preserve: false` removes its value when it is destroyed; the default keeps it.
- **STORE-11** A field that has **no initial value** and is bound with `bind:` to a control that has a default (`Input`,
  `Switch`, `Checkbox`, `CheckboxGroup`, `RadioGroup` with a default) throws `props_invalid_value` from Svelte. The item warns
  in development, once per field, with the field name and "give it an initial value in `initialValues` or `initialValue`"
  (the warning is the whole fix: the control cannot be asked what its default is).
- **STORE-12** `getFormInstance()` returns the store of the nearest `Form`; outside a `Form` it throws a clear error.

### Form

- **FORM-1** Draws a `<form>` with the native attributes; `novalidate` is on (P6); a native submit is always prevented.
- **FORM-2** Submit (Enter in a field, a submit button, `form.submit()`): validate all registered fields (STORE-7). Passed:
  `onfinish(values)`. Failed: `onfinishfailed({ values, errorFields, outOfDate })`, then `scrollToFirstError` (default
  `{ focus: true }`, Q4 B): the **first invalid control in document order** is scrolled into view and focused (the control
  with the `id` of `field.attrs`; if it is not focusable, its first focusable descendant). `{ focus: false }` or `true`
  scrolls only; `false` does nothing. Focus is **not** moved by a validation that is not a submit (typing, blur,
  `validateFields()` called by the consumer).
- **FORM-3** `layout`: `horizontal` (label and control in one row, label `Col` and control `Col`), `vertical` (label above the
  control), `inline` (items in a flex row with wrapping). Horizontal stacks label above control at ≤ 575 px unless the
  `xs` values of `labelCol` / `wrapperCol` say otherwise (React 6.x, to be measured: O2).
- **FORM-4** `labelCol` and `wrapperCol` are `Col` props; the form's value is the default, the item's wins. In vertical
  layout `labelCol.offset` still applies (public bug fixed in React 6.x).
- **FORM-5** `labelAlign` (`start`, `end`), `labelWrap` (the label wraps instead of being cut with an ellipsis), `colon`,
  `tooltip`, `preserve`, `validateTrigger` are defaults that an item overrides (`requiredMark` is form-only).
- **FORM-6** `name` prefixes the field ids; unnamed forms use a unique id (ITEM-2).
- **FORM-7** `classNames` / `styles` reach the parts of every item (ITEM-10).
- **FORM-8** `onvalueschange(changed, all)` after a user change only; `onfieldschange(changedFields, allFields)` after every
  field change, including `validating` going `true` then `false` (the React FAQ: three calls with a rule).
- **FORM-9** `<Form bind:form>` returns the instance that the `Form` made.
- **FORM-10** `form` can be replaced while mounted: the items re-register with the new store.
- **FORM-11** `disabled`, `size`, `variant` of the `Form` reach the controls only through `field.disabled`, `field.size`,
  `field.variant` (Q3 B): a control that the consumer does not give them keeps its own state, and `Form` never changes a
  control by itself. A change of the form's prop updates `field` (reactive).

### FormItem

- **ITEM-1** The root is a `Row` of the library; the label sits in a `Col` (`labelCol`), the control and the messages in a
  `Col` (`wrapperCol`). `label`, `help`, `extra` render a number `0` (not "nothing").
- **ITEM-2** The control id is `<form name>_<field name joined with _>`, or a unique id when the form has no name; it is
  `field.attrs.id` and the `for` of the label (`htmlFor` overrides; `null` removes `for`).
- **ITEM-3** The label is a `<label>`. The star and the colon are **`aria-hidden` elements** inside it (not generated content: the
  name of a control includes generated content, and "star Username colon" is not a name; the alternative-text form
  `content: '*' / ''` is not understood by the browser floor and would need an `ENHANCEMENTS` row, which only the maintainer
  adds), so the accessible name is the text alone (checked with Orca). The colon (`colon`, horizontal layout only) keeps its room
  with a no-break space when it is off, and the inline layout keeps the room too. The text is not changed to make room for them.
- **ITEM-4** Required mark: `required`, else derived from a `required` rule (including a rule function's result); `false` hides
  it. `requiredMark: 'optional'` shows "(optional)" as **text** on items that are not required, and no star.
- **ITEM-5** `tooltip`: a help icon after the label text, opening the library `Tooltip` on hover and focus; it is
  keyboard-reachable (open point O1: its accessible name).
- **ITEM-6** `hidden`: `display: none` for the whole item; the field is still collected and validated.
- **ITEM-7** Status: `validateStatus` if given; otherwise `validating` while a rule runs, `error` if any non-warning message,
  `warning` if only warning messages, `success` only when `hasFeedback` is set and the field was validated without messages.
- **ITEM-8** Messages: the generated ones, one line per message, under the control; `help` replaces them; `help={false}`
  shows none (a public bug fixed in React 6.x); `extra` is always shown below them.
- **ITEM-9** `hasFeedback`: the status icon (`success`, `warning`, `error`, `validating`), overridable per status
  (`feedbackIcons`); how it reaches the control is Q3.
- **ITEM-10** Semantic parts: `root` (the row), `label`, `content` (the control box), `help` (the messages area), `helpItem`
  (one message), `extra`; `classNames` / `styles` set on the `Form` apply to all items.
- **ITEM-11** An item without `name` is a layout row: label, content and `extra`, no store.
- **ITEM-12** `name` may change while mounted: the item unregisters the old field and registers the new one.

### Validation

- **VAL-1** Triggers: `validateTrigger` (default `'change'`): `'change'` runs after a user change (the `field.value` setter);
  `'blur'` runs on `focusout` from the control's content box; both can be listed. A rule's own `validateTrigger` must be a
  subset of the item's; a rule runs only on its triggers. A submit runs every rule on every trigger.
- **VAL-2** **IME**: while a composition is open inside the control box (`compositionstart` to `compositionend`, which
  bubble), a `change` validation is **held back and runs at the end of the composition** with the final value. Our `Input`
  reports changes during composition; without this a `min` rule shows an error under every half-typed syllable.
- **VAL-3** Rule keys, **checked by the library** (Q2b); our tests pin the outcome for each, because the contract is ours
  even where the check is not: `required` (`undefined`, `null`, `''`, `[]` fail; the tests decide the rest of the table),
  `type` (the list above; `string` unless set), `len` / `min` / `max` (length of a string or array, the value of a number;
  `len` wins over a range), `pattern`, `enum`, `whitespace` (only with `type: 'string'`), `transform` (before validation),
  `validator` (our wrapper over the library's `asyncValidator`: sync or async, throw or reject to fail), `message`,
  `defaultField` and `fields` (rules for the elements of an array / the keys of an object). **The adapter's own**:
  `warningOnly` (the failure is shown as a warning and does not fail the submit) and a rule given as a function of the form.
- **VAL-4** `validateFirst` (the adapter, over the library's `first` / `firstFields`): stop at the first failing rule;
  `'parallel'`: run the rules concurrently but keep only the first failure in rule order. Otherwise all failing rules show
  their messages.
- **VAL-5** `validateDebounce` delays the start of a validation by that many milliseconds; a newer change cancels the wait.
- **VAL-6** Messages (the adapter's templates over the library's `messages` and per-rule `message`): a rule's `message`,
  else the template of `validateMessages` for that rule kind. Templates take
  `${name}` (the label as text if it is a string, else the field name), `${min}`, `${max}`, `${len}`, `${type}`, `${pattern}`,
  `${enum}` and the item's `messageVariables`; `\${` is not substituted.
- **VAL-7** A validation that a newer one superseded is ignored: only the latest result reaches the field (no stale message).
- **VAL-8** `dependencies`: when a **user** change touches a field that an item lists in `dependencies`, that item is
  re-validated **if it has been touched or has messages** (the "confirm password" case). Not by `setFieldValue(s)`.
  The exact condition is measured on the public "Dependencies" demo before implementation (O3).
- **VAL-9** **Layout stability** (public React bug: the form height fluctuated during rapid status changes): showing or
  hiding a message, an icon or a status does not change the item's own height beyond the space of the messages, and does not
  move the items above it. Tested in a browser with one-line and two-line messages, and **frame by frame** through the
  appearance animation (rule 7, layout on state change).

## A11y

There is **no APG pattern for form validation**; the external references are the WAI web accessibility tutorial "Forms:
Validating input" and WCAG 3.3.1 (error identification), 3.3.3 (error suggestion), 1.3.1 and 4.1.2.

- A `<label for>` names the control (ITEM-2). The control also gets `aria-labelledby` of the label's id from `field.attrs`
  **whenever the item has a label text** (not only for a group; an item with no label, or a `null` one, has none: an empty label would take the name of the control away), so it keeps its name when `htmlFor={null}` takes the click away from the label.
- `aria-describedby` on the control lists the ids of the messages area (when it has messages) and of `extra`; it points only
  to ids that exist (public bug 59702 of React; we have no `noStyle` in v1.0).
- `aria-invalid="true"` while the status is `error` (a warning does not set it); `aria-required="true"` while required.
- **The messages area is not `role="alert"`** (public issue 52661) and has no live region (the React behaviour, measured);
  a screen reader reads a message through `aria-describedby` when the control gets focus. On a **failed submit** focus
  moves to the first invalid control by default (Q4 B, FORM-2), so the reader reads the label, the invalid state and the
  message in one go; this is the one announcement the form makes. A consumer who sets `scrollToFirstError={false}` takes
  that over and must say in their own words that the submit failed.
- The tooltip icon is reachable with Tab and opens on focus (Tooltip's own keyboard contract: Escape closes it).
- `hidden` items are `display: none`: out of the tree and the tab order. A disabled control stays the consumer's business
  until `disabled` propagates (v1.1).
- Required, error and warning are never conveyed by colour alone: the star is text, messages are text, icons have shapes.
- `forced-colors`: error text, the star and icons use system colours; checked in the three engines.

## Agreed decisions (2026-11-17)

1. **Q1: an explicit field object (option A).** `FormItem` hands a `FormField` to its `children` snippet; the control binds
   `field.value`. Auto-connection of our own controls through a context is a possible additive step in v1.1.
2. **Q2: depend on a validation library (option B, the maintainer chose against the recommendation), and Q2b: it is
   `@rc-component/async-validator` (recommended).** The package gets its first runtime dependency. Consequences recorded in
   this document: the README and the Form page name the library ("rules are checked by `@rc-component/async-validator`, MIT;
   the rest of Form is original", P25); one adapter file imports it (`validate.ts`), so it can be swapped; `suppressWarning`
   is always passed; the browser-floor run must cover it (O5). The recommended own engine (about a day and a half, no
   dependency) is the alternative that was not chosen.
3. **Q3: option B.** `field.status`, `field.feedback` and also `disabled`, `size`, `variant` on the `Form` and in `field`,
   spread by hand; no context in v1.0. The automatic propagation stays reserved for v1.1.
4. **Q4: option B.** The default of `scrollToFirstError` is `{ focus: true }`: a failed submit scrolls to and focuses the
   first invalid control; `false` turns it off. A deliberate deviation from both originals (default `false`).

5. **N1, N2 and P1 to P26 accepted as written** ("принимаю", 2026-11-17): a rule's `message` is a string only; `scrollToFirstError`
   takes the native options only; `FormList`, `FormErrorList`, `FormProvider`, `noStyle` are v1.1; `dependencies` is in v1.0.

The questions and the alternatives, as they were put to the maintainer, follow.

## Decisions for the maintainer (workflow stage 2)

**Q1. How does a control get connected to a field?** React clones the child and injects `value` / `onChange`; that needs
nothing from the control, but Svelte cannot clone, and our controls do not read an item context (today).
- **A. Explicit field object (recommended).** `FormItem` hands a `FormField` to its `children` snippet (above):
  `bind:value={field.value}`. Works with our controls and any third-party control, no context leaks into popups (the React
  bug class of the Select / Popover entries in Findings), no `valuePropName` / `trigger` / `getValueFromEvent` (you choose `bind:checked` or `bind:value`), type-safe,
  and the setter is exactly the "user changed it" event. Cost: three lines per field instead of one; every field needs an
  initial value (STORE-11). **A later, additive step** (v1.1) can add auto-connection for our controls through a context.
- **B. Vue-3-like: the consumer's own `$state` model + item `name`.** Shortest markup (`<FormItem name="a"><Input bind:value={model.a} /></FormItem>`),
  but the item cannot tell a user change from a programmatic one (so no "no validation on `setFieldValue`"), has no way to
  put `id` and `aria-*` on the control (it would have to find the control in the DOM), and no way to hand over `status`. The
  controls would have to cooperate with a context: that is the whole of v1.1's work, done now for every control.

**Q2. The validation engine.** Both React and Vue use the MIT library `async-validator` for the rule shape.
- **A. Our own small engine (recommended).** No runtime dependency (the package has none, only the `svelte` peer), our message
  templates, our control of types and of cancelling stale runs; about a day and a half for the keys of VAL-3, covered by tests.
  Risk: edge cases of `type` (`email`, `url`, `tel`) differ in small ways from the library's.
- **B. Depend on `async-validator`.** Closest to the originals' behaviour for free; the first runtime dependency of the
  package (size, supply-chain surface, the independent-implementation statement then needs the dependency named).

**Q3. How do the status, the feedback icon and `disabled` / `size` / `variant` reach the controls in v1.0**, given the standing
decision (rule 6b) that the *global* propagation (ConfigProvider, Form) is v1.1?
- **A. Explicit through `FormField` (recommended).** `field.status` and `field.feedback` exist (spread or pass to the
  `status` and `suffix` of the control); `disabled`, `size`, `variant` stay reserved names on `Form` (v1.1); you pass them by
  hand. `hasFeedback` works with `Input` (`suffix={field.feedback}`) and with any control that has a suffix slot; with none, no
  icon is drawn.
- **B. A, plus `disabled`, `size`, `variant` in v1.0** on the `Form` and in `field` (`field.disabled`, `field.size`,
  `field.variant`), spread by hand: still no context, no automatic propagation. About half a day more; `disabled` is in both
  React and Vue.
- **C. Nothing in `field` but `errors` and `warnings`.** The consumer derives the look; `hasFeedback` is not drawn.

**Q4. What does a failed submit do by default?** React and Vue: nothing moves, and a screen-reader user hears nothing (see
Findings 2 and 3); `scrollToFirstError` (default `false`) opts in.
- **A. Same as React: default `false`.**
- **B. Focus and scroll to the first invalid control by default (recommended).** `scrollToFirstError={false}` turns it off.
  It is the one thing that tells a keyboard or screen-reader user that the submit failed and where; the control is then read
  with its label, `aria-invalid` and the message through `aria-describedby`. A deviation from the default of both.

### Proposals (accepted together unless the maintainer objects)

- **P1** Names: `Form`, `FormItem`, `createForm`, `getFormInstance`; types `FormInstance`, `FormProps`, `FormItemProps`,
  `FormField`, `FormRule`, `FormRuleConfig`, `FormNamePath`, `FormFieldData`, `FormLayout`, `FormLabelAlign`,
  `FormRequiredMark`, `FormValidateStatus`, `FormValidateTrigger`, `FormValidateMessages`, `FormSemanticName`,
  `FormClassNames`, `FormStyles`. Reserved: `FormList`, `FormErrorList`, `FormProvider`, `getFormItemStatus`.
- **P2** Files in `src/lib/Form/`: `Form.svelte`, `FormItem.svelte`, `store.svelte.ts` (the instance), `validate.ts` (the
  adapter over the library, the only file that imports it), `messages.ts`, `path.ts`, `context.ts`, `types.ts`, `README.md`.
- **P3** `initialValues` is a `Form` prop only; `createForm()` takes no argument (React semantics: one place).
- **P4** Callbacks are lower case (`onfinish`, `onfinishfailed`, `onvalueschange`, `onfieldschange`), as in the other
  components.
- **P5** `normalize`, `getValueFromEvent`, `getValueProps`, `valuePropName`, `trigger` are not taken; the page shows the
  binding patterns instead (a Switch with `bind:checked`, a transform with a function binding, a control that reports through
  a callback with `onchange={(v) => (field.value = v)}`).
- **P6** `<form novalidate>` is always set (the rules own validation, a native `required` attribute must not pop a second
  message); a consumer can still pass `novalidate={false}`.
- **P7** `validateTrigger` values are `'change'` and `'blur'` (the Vue form), not React's `onChange` / `onBlur` (event prop
  names that do not exist in Svelte).
- **P8** A `validator` returns nothing or a promise and **throws / rejects** with the message; the Vue callback style
  (`callback(error)`) is not taken. The value is the field value; the rule is its first argument. The adapter wraps it for
  the library's `asyncValidator`, and also accepts the library's own sync returns (`false`, an error, an array of errors).
- **P9** `message` is a template string; the escape `\${` is supported (React 5.20.2).
- **P10** Number rules are the library's documented ones: `min` / `max` / `len` of a `number` compare the **value**; of a
  `string` or an array the **length**; `len` wins over a range. The tests pin the edge cases (`NaN`, `0`, `false`) the
  README does not state.
- **P11** `dependencies` is in v1.0 (one day; the user-visible "confirm password" case).
- **P12** `noStyle` is v1.1: its status inheritance and the `aria-describedby` of nested items are where the originals still
  have open bugs (React 59702, 59703). Until then a group of two controls under one label is two items in a `Row`.
- **P13** `FormList` (with `operation`), `FormErrorList`, `FormProvider` are v1.1; their names and the React contract are
  reserved. Dynamic items are already possible: an `{#each}` with name paths such as `['users', i, 'name']`.
- **P14** `classNames` / `styles` are in (the six measured names), set on the `Form`, applied to every item.
- **P15** The unique id of an unnamed form (ITEM-2) is a deliberate improvement on React, whose ids collide between forms.
- **P16** No ConfigProvider defaults in v1.0 (it does not exist yet); the default messages are English.
- **P17** The page has no "Focus and blur" example (nothing of the `Form` itself takes focus), and the instance methods are
  in the API table only.
- **P18** `scrollToFirstError` takes the native `ScrollIntoViewOptions` and `focus` (N2).
- **P19** Number, boolean and `null` values are valid field values; an `Input` bound to a number field is the consumer's
  conversion (a function binding).
- **P20** `getFieldWarning(name)` is added beside React's `getFieldError` (React's `FieldData` carries warnings but the table
  names no getter for one field).
- **P21** `clearValidate` (Vue) is not taken; `setFields([{ name, errors: [] }])` does it.
- **P22** Right-to-left is logical properties; tested at `dir="rtl"` (label alignment `start` / `end`).
- **P23** In the docs the items use `Input`, `Switch`, `Checkbox`, `RadioGroup`, `Select` and `Button`; no new component is
  needed for the examples.
- **P24** `Form` and `FormItem` are two files and two exports; there is no `Form.Item` namespace in Svelte.
- **P25** The public text. README and the Form page: "API inspired by Ant Design (MIT). Original implementation for
  Svelte. Rules are checked by `@rc-component/async-validator` (MIT)." (rule 9 plus the dependency; the wording is the
  maintainer's to change). `package.json` gets `dependencies`: `@rc-component/async-validator` (`^6.0.0`); the lockfile is
  updated in the worktree, and the install changes the shared `node_modules` through the symlink (harmless to the other
  worktrees, but known).
- **P26** Types `FormSize` (`'small' | 'medium' | 'large'`, the canonical React names; the compatibility aliases `middle`
  and `default` that `Input` still accepts are **not** repeated here, as this is a new prop) and `FormVariant` (the four
  values of `Input`).

**N1. A rule's `message` is a string only** (a narrowing of React's `string | ReactElement`; reason in the value-forms
table). Confirm, or choose `string | Snippet` (then errors become `(string | Snippet)[]` everywhere).
**N2. `scrollToFirstError` takes the native options only** (a narrowing of the helper library's options). Confirm.

## Revision R (2026-11-18): typed instance, `model`, form-level `rules`

**Why.** The maintainer looked at the first example (`const form = createForm()`) and asked why the form is an untyped object
and not a variable whose shape TypeScript describes, "as in Vue". Where `createForm` came from: React's `Form.useForm()` and
Vue's `useForm`, taken as "core idea" in the tables; it is the Svelte form of that, not a hook. Q1 B (the Vue-3-like `model`)
was offered on 2026-11-17 and A (the explicit `field` object) was chosen, because B alone could not tell a user change from a
programmatic one, had no place for `id` / `aria-*` and no way to hand over `status`. This revision keeps A and **adds the model
as the place where the values live**, so the `field` object still carries `attrs`, `status` and the rest.

**Decisions of the maintainer (2026-11-18):**
1. Both: a typed `createForm<Values>()` **and** `model` (the maintainer: "createForm, где передаем тип, и модель как во Vue").
2. **Q5 A.** With `model`, a change of the value of a registered field that the instance did not write itself (a control that
   binds `values.username` directly, or `values.username = 'x'` in code) **counts as a user change**: the field is touched,
   `onvalueschange` runs, the field is validated on its `change` trigger, its dependents are validated again.
3. **Q6 B.** `Form` takes `rules` by field name (Vue-like), now.

**Proposals (accepted unless the maintainer objects):**
- **R1 Generics.** `createForm<Values extends object = Record<string, unknown>>(): FormInstance<Values>`; `FormInstance<Values>`
  is the store class. `Form` and `FormProps` are generic over `Values` (default `Record<string, unknown>`), inferred from
  `form` or from `model`, so old code that passes an untyped `createForm()` compiles as before.
- **R2 What is typed.** `getFieldValue(name)` returns `Values[K]` for a top-level key `K`, and `unknown` for a path given as an
  array; `setFieldValue(name, value)` takes `Values[K]` for a key and any value for an array path (a name that is not a key of
  `Values` is an error: the loose overload that accepted any name made a wrong type compile); `getFieldsValue(true)` returns `Values` and every other form of `getFieldsValue` a deep partial (R13); `setFieldsValue` and `initialValues` take `DeepPartial<Values>`; `validateFields()`
  resolves with `Values`; `onfinish(values: Values)`, `onfinishfailed({ values: Values, ... })`,
  `onvalueschange(changed: DeepPartial<Values>, all: Values)`. New exported type `FormDeepPartial<T>`.
- **R3 `name` stays untyped.** `FormItem` finds its form through the context, and a type does not travel through a context, so
  `name` is still `FormNamePath` and `field.value` is `any` (the control's prop decides). Typed names would need
  `FormItem` to take the form as a prop; not now.
- **R4 `form` and `model` together.** Both may be given: `form` carries the methods and the state of the fields, `model` the
  data. Only `model`: the `Form` makes the instance (`bind:form` returns it). Only `form`: the store keeps the data itself, as
  before. `Values` of `form` and of `model` must be the same type.
- **R5 Initial values and reset with `model`.** When the `Form` mounts, `initialValues` (and `initialValue` of the items) fill
  **only the keys the model leaves `undefined`**; the model's own values win. The model after that is the **snapshot that
  `resetFields()` returns to**. `resetFields()` writes the snapshot back into the **same object** (its identity stays; a top-level
  key that is not in the snapshot is deleted); `resetFields(names)` restores those paths. Touched flags and messages go too.
- **R6 Values set before the form mounts** (`form.setFieldsValue(...)` before the `Form` exists) only fill what the model lacks;
  they never overwrite the consumer's data.
- **R7 The model must be reactive.** Pass a `$state` object (a `$state.raw` one works for writes but not for markup that reads
  it). A plain object is written to, but markup that reads it does not update; this is said on the page, there is no runtime
  check (Svelte has no public test for "is a proxy").
- **R8 How a user change is told from the store's own write.** The store remembers, per registered field, the last value it
  knows (a snapshot). Every write by the store (`setFieldValue(s)`, `setFields`, `resetFields`, an item's `initialValue`, the
  setter of `field.value`) updates that memory at once; an item watches the value of its field in the model, and a value that
  differs from the memory was changed from outside, so it is handled as a user change. `field.value = x` therefore does not
  report twice. Two items on one name report once. Without a model nothing is watched.
- **R9 Swapping the model.** A `model` that is replaced later is attached again: the memory is read again (no change events),
  the snapshot for `resetFields()` is **not** taken again. For a fresh snapshot remount the form (`{#key}`).
- **R10 Form-level `rules`.** `FormRules = { [name: string]: FormRule[] | FormRules }`. The rules of a field are found by
  following its name path through the object (`['user', 'name']` reads `rules.user.name`; a string name is one key); an array at
  the end is the list. A rule list found in the middle of a path is not a rule list for a longer path. The item's own `rules`
  are **added after** the form's (both count for the required mark and `aria-required`; function rules get the instance). Public
  docs of Vue call both `rules` "validation rules of form" and do not say how they combine; ours is additive so nothing is
  silently ignored (to be compared with the Vue demo as a black box: O6, not blocking).
- **R11 Copies.** With `model`, `getFieldsValue(...)`, `onfinish` and `onvalueschange` give **copies** (snapshots), never the
  live proxy; `getFieldValue(name)` and `field.value` read the live value, as without a model.
- **R12 `preserve`.** An item that is destroyed with `preserve: false` deletes its key from the model.
- **R13 `getFieldsValue` is a partial (owner, 2026-11-19).** `getFieldsValue()`, `getFieldsValue(names)` and `getFieldsValue({ filter })`
  read the fields that are there (those with a mounted item, those named, those the filter keeps), so a field without an item
  is missing from the result. Typing the result as the whole `Values` would let `values.age.toFixed()` compile and fail at run
  time, so these forms return `FormDeepPartial<Values>` (deep, because a nested name such as `['address', 'city']` may be
  registered without its sibling). Only `getFieldsValue(true)` (every value in the store) returns `Values`. React types the
  no-argument form as the whole `Values` and `true` as `any`; the maintainers explain in the public tracker (ant-design issue
  26775) that the store holds more than the registered fields, so no one type fits: that is the reason for the difference.
  It is a type change only, the values are the same. **Decided by the owner, option A (2026-11-19):** `validateFields()`, `onfinish` and `onfinishfailed` stay typed `Values`, as in
  React, although they are built from the registered fields (a field hidden by `{#if}` is missing). Reason: a submit happens on a
  mounted form, so its items are there, while `getFieldsValue()` may run before they register; `Values` is the consumer's promise,
  so a field that can be hidden is declared optional in it (`age?: number`). Making them partial would put `?.` into every
  submit handler. The API table says so on `onfinish` and `validateFields` (en, ru, zh).

**Behavior ids (each has a test):**
- **TYPE-1** `createForm<V>()` types `getFieldValue`, `setFieldValue`, `getFieldsValue`, `setFieldsValue`, `validateFields`,
  and `onfinish` / `onvalueschange` of a `Form` that gets it; a wrong type is a compile error (`@ts-expect-error`).
- **TYPE-4** `getFieldsValue()`, `getFieldsValue(names)` and `getFieldsValue({ filter })` are typed `FormDeepPartial<Values>` and
  `getFieldsValue(true)` is typed `Values`; reading a field of the partial without a check is a compile error (`@ts-expect-error`).
- **TYPE-2** `createForm()` without an argument keeps `Record<string, unknown>`; a form without `form` and `model` compiles as before.
- **TYPE-3** `Values` is inferred from `model` when there is no `form`.
- **MODEL-1** With `model`, `field.value` reads the model and its setter writes it; the object keeps its identity.
- **MODEL-2** A control that binds `values.username` directly: the field is touched, validated on `change`, `onvalueschange` runs, dependents are validated again (Q5 A).
- **MODEL-3** `values.username = 'x'` in code does the same as MODEL-2; `field.value = x` reports once.
- **MODEL-4** `setFieldValue`, `setFieldsValue`, `setFields` and `resetFields` write the model and are **not** user changes.
- **MODEL-5** R5: `initialValues` fill the missing keys only; the model's values win; R6 for values set earlier on the instance.
- **MODEL-6** `resetFields()` and `resetFields(names)` restore the snapshot into the same object; keys added later go away.
- **MODEL-7** R11: copies from `getFieldsValue`, `onfinish`, `onvalueschange`.
- **MODEL-8** R9: a replaced model is attached again without change events; the snapshot is kept.
- **MODEL-9** R12: `preserve: false` deletes the key; `preserve: true` keeps it.
- **MODEL-10** Two items on one name: one change, one validation per trigger.
- **MODEL-11** Without `model` the instance behaves as before (nothing is watched).
- **MODEL-12** A server render shows the values of the model.
- **MODEL-13** A change during an IME composition does not validate until it ends (the same hold as for `field.value`).
- **FRULES-1** Form-level rules apply by name; nested names follow nested objects.
- **FRULES-2** The item's rules are added after the form's; either one gives the required mark and `aria-required`.
- **FRULES-3** A changed `rules` prop is used by the next validation and updates the mark; function rules receive the instance.
- **FRULES-4** A name without an entry has no form-level rules; a rule list in the middle of a path does not match.

**Cost (estimate):** types and generic `Form` half a day; model storage, the watcher, form-level rules and the tests a day;
two examples, the three languages and the tables half a day. Library code changes, so floor, the Form browser tests, the
mutation run and the Orca test are repeated.

## Dependencies

Rule 6b of the rules for AI assistants: what this component uses besides its own files. Checked against `origin/main`
(`e8bf2e0`, version 0.8.0) on 2026-11-17; the plan is `ai/dependencies.md`, row Form: *Grid (Row, Col), Tooltip; no primitive;
the status of the field (v1.1)*.

- **Whole components:** **`Grid`** (`Row`, `Col`): `FormItem` is the `Row` the user sees as a grid row, with a label `Col` and a
  control `Col`, and `labelCol` / `wrapperCol` are `Col` props (typed from `ComponentProps<typeof Col>`). **`Tooltip`**: the
  tooltip of a label is the same `Tooltip` the user sees elsewhere, configured by the same props.
- **Parts or primitives of `internal/`:** none. The small helpers `internal/semantic` (`classList`, `styleText`), `internal/env`
  and `internal/options` are plain functions, not primitives of rule 6b. The messages area is animated in CSS in `FormItem`; the
  planned shared `anim` primitive (`ai/dependencies.md`) is not needed and Form does not create it.
- **An npm package (not a component, so not in `DEPENDENCIES`):** `@rc-component/async-validator` `^6.0.0`, MIT, chosen by
  the maintainer on 2026-11-17 (Q2, Q2b). It is the library's **first runtime dependency**; `peerDependencies` stay
  `svelte` only. Only `validate.ts` imports it. `scripts/check-architecture.mjs` reads relative imports only, so it does
  not see it; the package list is checked by `npm run package` and `publint` where the project has them (to confirm at
  implementation, O5).
- **Shared state:** the form context (`setContext`, `context.ts` in `src/lib/Form/`) and the store class on runes
  (`store.svelte.ts`) are Form's own. The **shared status context** (the automatic status, size and disabled of controls) is
  **v1.1**, as the plan says (Q3).
- **What `origin/main` lacks:** nothing that Form needs. `Grid` and `Tooltip` are exported by `src/lib/index.ts`;
  `ConfigProvider`, `Space`, `Modal` do not exist and are not needed.
- **Deviation from the plan:** none. New entries for `scripts/check-architecture.mjs` (`DEPENDENCIES`), a decision of the owner
  by rule 6b: `Form → Grid` (a row of label and control, `labelCol` / `wrapperCol` are `Col` props) and `Form → Tooltip` (the
  label tooltip). Neither closes a cycle (`Grid` and `Tooltip` import no component).

## Quality matrix

| Row | Status | Where |
|---|---|---|
| WAI-ARIA | test | `tests/Form.test.ts`, `tests/FormItem.test.ts` (the attributes of "A11y" against the WAI "Forms: Validating input" tutorial; axe, in the Form and the FormItem suites) |
| Forced colors | test | `e2e/forced-colors.spec.ts` (the message, the star and the icons stay visible, in the system colour where the engine applies it: Chromium and Firefox; WebKit only matches the media query and is checked as visible; the shapes of the icons differ; the focus ring of the help icon stays) |
| IME | test | `e2e/form-ime.chromium.spec.ts` (VAL-2 through the debugging protocol: no message while a composition is open, the message at its end, validation on every change afterwards), `tests/FormItem.test.ts` (the same with composition events, in the unit tests); a real keyboard on a phone stays `manual pending` |
| Touch | test | `e2e/form-touch.chromium.spec.ts` (a tap on the help icon opens its tooltip, a tap on a label focuses its control, the rows are tall enough) |
| Browsers | test | `e2e/form.spec.ts` in Chromium, Firefox and WebKit (layouts, VAL-9 frame by frame, `dir="rtl"`, the first invalid field far down a page, generated colours) |
| Browser floor | test | `npm run test:floor` (the smoke of the Form lab and the CSS audit on Chromium 90, Firefox 85 and WebKit 15.4: 42 of 42 in each engine, nothing in the CSS that an engine does not understand, and the validation library loading and validating there) |
| Screen reader | test | `screen-reader/form.spec.ts` (Orca with Firefox: the name without the star and the colon, "required", the tooltip read as the description of its button, and after a failed submit the invalid field with its message); NVDA, VoiceOver, JAWS `manual pending` |

## Implementation notes (2026-11-17)

What implementation found out, and how the open points of stage 2 ended.

- **O1 (the tooltip icon)** is a `<button type="button">` after the label, **outside** the `<label>` (inside it the button name would be part
  of the name of the control). Its accessible name is `More information`, changed with `iconLabel` of the tooltip object (an addition to
  the contract, additive). Orca reads the tooltip text as the description of the button.
- **O2 (geometry)** measured on the public demo (Chromium, 1300 and 400 px): the item is 24 px apart from the next one; the label is
  14 px, 32 px high; the label column of `labelCol: { span: 8 }` is `flex: 0 0 33.3333%`; below 576 px the label takes the whole row
  with `padding: 0 0 8px` and starts the text at the start side; the colon has `margin-inline: 2px 8px`; the star is red with
  `margin-inline-end: 4px`; a message of one line sits in the margin of the item and the next item does not move (`nextOffset` stayed
  56 px). Ours: the same numbers, tokens `--ads-form-*`, and the `Col` props of the label and the control are rebuilt below 576 px
  (`layout.ts`) so no global CSS and no `:global` on the markup of `Col` is needed.
- **O3 (`dependencies`)**: implemented as "validate again after a **user** change of the listed field, if the dependent field was
  touched, validated or has messages" (`tests/formStore.test.ts`, VAL-8). **Not measured** on the public "Dependencies" demo; if it
  differs, the condition is the only line to change.
- **O4 (blur into a popup)**: not an issue for our controls: a `Select` keeps focus on its input, so `focusout` does not leave the
  box. A control that moves focus into a portal would be a blur; documented by the rule "focus that stays inside the box is not a blur".
- **O5 (the library)**: the adapter (`validate.ts`) runs **one library schema per rule** (so `warningOnly`, `validateFirst` and the
  templates are the adapter's own) and splits a rule that has both checks and a `validator` (the library alone would run only the
  validator). The documented behaviour was probed in Node first: `required` passes `0`, `false` and whitespace; a `validator` that
  returns nothing and is not a promise never settles, so the adapter always returns a promise; a throw inside the check rejects
  the schema, so the adapter catches it. The `es/` build of the package imports without extensions: bundlers resolve it, plain
  Node does not (the SSR build of the site is checked in `npm run build`). It runs on the browser floor.
- **A bug the tests found**: `<Form>` assigned `form = createForm()` to its own prop, and a parent that passes its props as a
  spread and updates them took the value back, so the items crashed. The store is now kept in the component and written back
  to `bind:form` only.
- **A bug the first run found**: `register()` read and wrote the same state inside an effect (`effect_update_depth_exceeded`); the
  counter that tells `getFieldsValue()` the set of fields changed is bumped with `untrack`.
- **A bug the browser found**: the generic site rule `.demo-pre form { display: flex }` (for the native form of the Button page) laid the
  items of a library `Form` in one row on the page, while the preview route looked right. The rule now leaves `.ads-form` alone.
- **Forced colors**: Chromium and Firefox replace the author colours; WebKit (Playwright) only matches the media query. The e2e test asks
  the engine (a probe element) before it asserts the system colour.
- **The package**: `@rc-component/async-validator` is in `dependencies`; `tests/packaging/tree-shaking.test.ts` installs it next to the
  package and checks that a bundle of `Button` or of `VERSION` does not contain it, and a bundle of `Form` does.
- **Browser floor**: nothing was added to `ENHANCEMENTS`; the CSS audit reports nothing that Chromium 90, Firefox 85 or WebKit 15.4
  does not understand. (An early draft drew the star and the colon with `content: '*' / ''`, which the audit would have flagged; they
  are elements now, which is also what the name of the control needs.)
- **Orca** (Firefox, the form lab): the name of the username field is "Username", not "Username *:" ; "required" is said; after a failed
  submit Orca says "Username. entry required. invalid entry. Please input your username." and the focus is on the field.

### Revision R (2026-11-18): what implementation found out

- **The watcher.** Each item runs an effect that calls `store.observe(entry)`; with a model it reads a deep snapshot of the field's
  value (so the effect depends on every part of it) and compares it with the snapshot the store last remembered. Every write by
  the store (`userChange`, `setFieldValue(s)`, `setFields`, `resetFields`, `setItemInitial`, a leaving item) refreshes that
  memory for the fields around the written path (the field itself, its ancestors and its descendants, so a list field and the
  field of one of its items agree). Without a model `observe` returns at once.
- **A bug the tests found:** reading the value for the memory outside `untrack` made the registration effect of the item depend on
  the value, so every change unregistered and registered the field again and the touched flag was lost. The read is untracked.
- **Strict instance types.** An overload that accepted any name with an `unknown` value let `setFieldValue('age', 'three')` compile.
  `getFieldValue` and `setFieldValue` now take a key of `Values` (typed) **or** a path as an array (not typed); `getFieldError`
  and the rest still take any `FormNamePath`. `ReturnType<typeof createForm>` is `FormInstance<object>`; the type to use is `FormInstance`.
- **`@ts-expect-error` in markup is not honoured** by svelte-check for attribute expressions, so the negative cases of the types are in
  `tests/formTypes.test.ts` (never-called functions), and the markup fixture `tests/fixtures/FormTyped.svelte` holds the positive ones
  (a loose `values` has no `toUpperCase` on `username`, so the file would not compile).
- **Open, not blocking (O6):** how Vue combines the rules of the form with the rules of the item is not stated in its public docs.
  Ours is additive; compare with its demo as a black box when convenient.
- **Mutation run:** `Form.svelte` and `FormItem.svelte` again after these changes (the store is a `.svelte.ts` file, which the runner does
  not mutate; the watcher was checked by hand: with `observe` switched off seven tests fail).

## Список тестов

Each point of "Store", "Form", "FormItem", "Validation" and "A11y" above has at least one test; the groups:

- `tests/formPath.test.ts`: STORE-2 (paths, number vs string keys, leaves).
- `tests/formStore.test.ts`: STORE-1, 3 to 10 and the triggers VAL-1, VAL-2, VAL-5, VAL-7, VAL-8, FORM-8 at the level of the store (values,
  reset, set without callbacks, flags, `validateFields` result and rejection, stale runs, `preserve`, `scrollToField`);
  `tests/formStoreErrors.test.ts`: a validation that breaks.
- `tests/formValidate.test.ts`: VAL-3 to VAL-6 (every rule key and type through the adapter, `warningOnly`, rule as a function,
  templates, `validateFirst`, parallel, nested rules, the failures of a validator, the edge cases the library's README does not state).
- `tests/formLayout.test.ts`: the columns of an item (ITEM-1, FORM-4).
- `tests/Form.test.ts`: FORM-1 to FORM-11, STORE-11, STORE-12, the Q4 behaviour, a11y; `tests/FormServer.test.ts`: the server render.
- `tests/FormItem.test.ts`: ITEM-1 to ITEM-12, VAL-1, VAL-2 and VAL-8 in the DOM, the `field` object, a11y attributes, axe.
- `e2e/form.spec.ts` (layout, VAL-9 frame by frame, `dir="rtl"`, a failed submit far down the page, generated colours, the tooltip),
  `e2e/form-ime.chromium.spec.ts`, `e2e/form-touch.chromium.spec.ts`, the Form block of `e2e/forced-colors.spec.ts`,
  `screen-reader/form.spec.ts`, and the Form lab check of `scripts/floor/smoke.cjs`.
- Revision R: `tests/formModelStore.test.ts` (MODEL-1 to 11 and 13 at the level of the store: the watcher, reset, copies, a replaced
  model, `preserve`, two items on one name, IME), `tests/FormModel.test.ts` (MODEL-1 to 9 in the DOM, FRULES-1 to 4),
  `tests/formTypes.test.ts` with `tests/fixtures/FormTyped.svelte` (TYPE-1 to 3), `tests/formPath.test.ts` (`fillMissing`, `isEqual`,
  `lookupRules`), `tests/FormServer.test.ts` (MODEL-12).
- `tests/docs/form-page.test.ts` and the "Form page" block of `docs/e2e/site.spec.ts`: the page.
- `tests/packaging/tree-shaking.test.ts`: the validation library is bundled with the Form only.

## Docs page (stage 6, done; two examples added by revision R)

One page, `docs/src/docs/data/form.ts`, `docs/src/docs/examples/form/` (20 examples, each a stage with one state of its own, rule 6a),
`docs/src/routes/[[lang=lang]]/components/form/+page.svelte`; texts in en, ru and zh. The examples, in the order of the page: basic form; binding other controls
(Switch, Checkbox, CheckboxGroup, RadioGroup, Select, a function binding: the second example, owner 2026-11-19, because it shows how any control is
connected); layout; label and control columns (`labelAlign`, `labelWrap`, `colon`); required mark; validation rules; validate trigger and
debounce; rule order and warnings; status icon (`hasFeedback`, `feedbackIcons`, `validateStatus`); help, extra hint and tooltip
(`htmlFor={null}`); initial value, hidden and preserve; dependencies; the form instance (`onvalueschange`, `onfieldschange`); submit and the first error
(`scrollToFirstError`); disabled, size and variant through `field`; styling the parts; messages and templates; dynamic fields;
a typed form (`createForm<Signup>()`); your own model (`model`, form-level `rules`, direct binding, reset).
**Look of the examples (owner, 2026-11-19, variant "sheet" chosen from live pages of five variants; the dotted canvas of that variant was dropped the same day).**
Every demo of this page takes a whole row (`wide: true` for all 20) on the usual background of the demo. An example is a `.stage` (a centred column,
660 px): the parameters that drive it in `.controls` above (each a unit: caption over the control), the form on a `.sheet` (white, rounded, soft shadow,
no fixed width of its own), the buttons that act on the form in a `.row`, the outputs in `.results` under the sheet (a status as a pill, a JSON as a
rounded block, a labelled output as a caption over its value). A control that stood after the form (`validateStatus`) now stands above it. No example
shows a prompt before anything has happened ("Press Submit."): a result block appears when it has a value (`{#if result}`); the outputs that always have
a value (the instance, the counters, the JSON) stay. `tests/docs/form-page.test.ts` checks the structure of every example, the flag and the absence of
prompts; "Form page" in `docs/e2e/site.spec.ts` checks the whole row and the sheet and that nothing stands under the form before the first submit,
in three engines. Other pages keep the two-column grid.

The top of the page has a section "Typed values and your own model" (`h2#values`): how the type is passed (`createForm<Signup>()`), the Vue-like `model`,
two code blocks and links to the two examples; the differences callout names both.
API tables: Form, FormItem, `field`, the methods of the instance (no example block of their own, P17), the rule keys, `createForm` and
`getFormInstance`, the design tokens. `tests/docs/form-page.test.ts` compares the tables with the sources; `docs/e2e/site.spec.ts`
("Form page") drives the examples. The page and the README say which checks were not made: NVDA, JAWS and VoiceOver, a real IME keyboard
on a phone, touch devices other than the Chromium emulation.

## Исходник, консультации

Не проводились. Исходный код Ant Design (React, Vue, Angular) для этого компонента **не читался**; сравнение построено на
документации, списках изменений, трекере задач и наблюдении за публичными демо как за чёрным ящиком (разделы 2, 4а, 7а).
Для npm-зависимости `@rc-component/async-validator` (решение Q2b) читались только манифест и README (документация
пакета); исходный код пакета не читался и не нужен: мы вызываем его документированный API.
