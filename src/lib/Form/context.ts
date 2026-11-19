import { getContext, setContext } from 'svelte';
import type { FormStore } from './store.svelte.js';
import type {
  FormClassNames,
  FormColProps,
  FormFeedbackIcons,
  FormInstance,
  FormLabelAlign,
  FormLayout,
  FormRequiredMark,
  FormRules,
  FormSize,
  FormStyles,
  FormTooltipConfig,
  FormValidateTrigger,
  FormVariant
} from './types.js';

/** What a `Form` gives its items. Every member reads the current prop of the form, so a change reaches the items. */
export interface FormContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the items do not know the `Values` of their form
  readonly form: FormStore<any>;
  /** A unique id of the form, the prefix of the control ids when the form has no `name`. */
  readonly id: string;
  readonly name: string | undefined;
  readonly layout: FormLayout;
  readonly labelCol: FormColProps | undefined;
  readonly wrapperCol: FormColProps | undefined;
  readonly labelAlign: FormLabelAlign;
  readonly labelWrap: boolean;
  readonly colon: boolean;
  readonly requiredMark: FormRequiredMark;
  readonly validateTrigger: FormValidateTrigger[];
  /** The rules of the form by field name. */
  readonly rules: FormRules | undefined;
  readonly preserve: boolean;
  readonly disabled: boolean | undefined;
  readonly size: FormSize | undefined;
  readonly variant: FormVariant | undefined;
  readonly tooltip: FormTooltipConfig | undefined;
  readonly classNames: FormClassNames;
  readonly styles: FormStyles;
  readonly feedbackIcons: FormFeedbackIcons;
}

const KEY = Symbol('ads-form');

export function setFormContext(context: FormContext): void {
  setContext(KEY, context);
}

/** The context of the nearest `Form`, or `undefined` outside one. */
export function getFormContext(): FormContext | undefined {
  return getContext<FormContext | undefined>(KEY);
}

/**
 * The instance of the nearest `Form`, for a component that stands inside it (a custom control, a button that resets).
 * Call it while the component initializes. Outside a `Form` it throws.
 */
export function getFormInstance<Values extends object = Record<string, unknown>>(): FormInstance<Values> {
  const context = getFormContext();
  if (!context) throw new Error('getFormInstance() must be called by a component inside a <Form>.');
  return context.form as FormInstance<Values>;
}
