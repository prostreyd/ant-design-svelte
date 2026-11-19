<script lang="ts" generics="Values extends object = Record<string, unknown>">
  import { untrack } from 'svelte';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { setFormContext } from './context.js';
  import { createForm, type FormHooks, type FormStore } from './store.svelte.js';
  import type { FormFinishFailedInfo, FormLayout, FormProps, FormValidateTrigger } from './types.js';

  const LAYOUTS = ['horizontal', 'vertical', 'inline'] as const satisfies readonly FormLayout[];

  const uid = $props.id();

  let {
    form = $bindable(),
    model,
    rules,
    initialValues,
    name,
    layout = 'horizontal',
    labelCol,
    wrapperCol,
    labelAlign = 'end',
    labelWrap = false,
    colon = true,
    requiredMark = true,
    validateTrigger = 'change',
    validateMessages,
    preserve = true,
    disabled,
    size,
    variant,
    tooltip,
    scrollToFirstError = { focus: true },
    feedbackIcons,
    classNames,
    styles,
    onfinish,
    onfinishfailed,
    onvalueschange,
    onfieldschange,
    novalidate = true,
    class: customClass,
    style,
    children,
    ...rest
  }: FormProps<Values> = $props();

  // The store is the consumer's (`createForm()`), or the form makes one and keeps it. It is kept here, not only in the
  // prop: a parent that passes its props as a spread and updates them takes a locally assigned prop back.
  let owned: FormStore<Values> | undefined;
  const store = $derived(form ?? (owned ??= createForm<Values>()));

  const effectiveLayout = $derived(resolveOption('Form', 'layout', layout, LAYOUTS, 'horizontal'));
  const triggers = $derived(
    (Array.isArray(validateTrigger) ? [...validateTrigger] : [validateTrigger]) as FormValidateTrigger[]
  );

  function isFailure(value: unknown): value is FormFinishFailedInfo<Values> {
    return typeof value === 'object' && value !== null && Array.isArray((value as FormFinishFailedInfo<Values>).errorFields);
  }

  /** A failed submit: scroll to the first invalid control and, by default, focus it. */
  function showFirstError(info: FormFinishFailedInfo<Values>): void {
    const option = scrollToFirstError;
    if (option === false || info.outOfDate) return;
    // A failure always has a failing field, so there is a first one.
    store.scrollToField(info.errorFields[0].name, option === true ? {} : option);
  }

  async function submit(): Promise<void> {
    let values: Values;
    try {
      values = await store.validateFields();
    } catch (failure) {
      if (!isFailure(failure)) throw failure;
      onfinishfailed?.(failure);
      showFirstError(failure);
      return;
    }
    onfinish?.(values);
  }

  // What the store hears from the form. The members read the props when they are called, so a new callback is used at once.
  const hooks: FormHooks = {
    submit: () => void submit(),
    get onvalueschange() {
      return onvalueschange as FormHooks['onvalueschange'];
    },
    get onfieldschange() {
      return onfieldschange;
    },
    messages: () => validateMessages
  };

  let prepared: FormStore<Values> | undefined;
  function prepare(store: FormStore<Values>): void {
    if (prepared === store) return;
    prepared = store;
    store.init(initialValues as Record<string, unknown> | undefined, model as Record<string, unknown> | undefined);
    store.bind(hooks);
  }

  // The first store is prepared while the component initializes, so a server render and the first client render already
  // show the initial values; a store that replaces it later is prepared before the items read it.
  prepare(untrack(() => store));
  $effect.pre(() => {
    const current = store;
    untrack(() => prepare(current));
  });
  // A `model` that is replaced later is attached again (the first one is attached by `init` above).
  $effect.pre(() => {
    const current = model as Record<string, unknown> | undefined;
    untrack(() => store.attachModel(current));
  });
  // `bind:form` gets the store the form made.
  $effect.pre(() => {
    if (!form) form = store;
  });

  setFormContext({
    get form() {
      return store;
    },
    id: uid,
    get name() {
      return name;
    },
    get layout() {
      return effectiveLayout;
    },
    get labelCol() {
      return labelCol;
    },
    get wrapperCol() {
      return wrapperCol;
    },
    get labelAlign() {
      return labelAlign;
    },
    get labelWrap() {
      return labelWrap;
    },
    get colon() {
      return colon;
    },
    get requiredMark() {
      return requiredMark;
    },
    get validateTrigger() {
      return triggers;
    },
    get rules() {
      return rules;
    },
    get preserve() {
      return preserve;
    },
    get disabled() {
      return disabled;
    },
    get size() {
      return size;
    },
    get variant() {
      return variant;
    },
    get tooltip() {
      return tooltip;
    },
    get classNames() {
      return classNames ?? {};
    },
    get styles() {
      return styles ?? {};
    },
    get feedbackIcons() {
      return feedbackIcons ?? {};
    }
  });

  const classes = $derived(classList('ads-form', `ads-form-${effectiveLayout}`, customClass));
  const inlineStyle = $derived(styleText(style));

  function handleSubmit(event: SubmitEvent): void {
    // The form never navigates: the values go to `onfinish`.
    event.preventDefault();
    void submit();
  }
</script>

<form {...rest} {novalidate} class={classes} style={inlineStyle} onsubmit={handleSubmit}>
  {@render children?.()}
</form>

<style>
  .ads-form {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-font-size);
    line-height: var(--ads-control-line-height);
  }

  .ads-form-inline {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }
</style>
