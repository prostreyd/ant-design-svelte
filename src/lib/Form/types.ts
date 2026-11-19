import type { ComponentProps, Snippet } from 'svelte';
import type { HTMLAttributes, HTMLFormAttributes } from 'svelte/elements';
import type Col from '../Grid/Col.svelte';
import type Tooltip from '../Tooltip/Tooltip.svelte';
import type { SemanticStyle } from '../internal/semantic.js';
import type { FormStore } from './store.svelte.js';

/**
 * The instance made by `createForm()`: the values and the state of the fields of one form. `Values` is the shape of the
 * values; it is the consumer's promise, the form does not check it.
 */
export type FormInstance<Values extends object = Record<string, unknown>> = FormStore<Values>;

/** `T` with every key optional, down through nested objects. Arrays, dates and functions stay as they are. */
export type FormDeepPartial<T> = T extends readonly unknown[] | Date | ((...args: never[]) => unknown)
  ? T
  : T extends object
    ? { [K in keyof T]?: FormDeepPartial<T[K]> }
    : T;

/** `horizontal` puts the label and the control in one row, `vertical` stacks them, `inline` lays the items in a row. */
export type FormLayout = 'horizontal' | 'vertical' | 'inline';
/** The layout of one item (`inline` is a layout of the whole form). */
export type FormItemLayout = 'horizontal' | 'vertical';
/** Alignment of the label text; `start` and `end` follow the text direction. */
export type FormLabelAlign = 'start' | 'end';
/** The size handed to the controls through `field.size`. */
export type FormSize = 'small' | 'medium' | 'large';
/** The variant handed to the controls through `field.variant`. */
export type FormVariant = 'outlined' | 'borderless' | 'filled' | 'underlined';
/** The status of an item. */
export type FormValidateStatus = 'success' | 'warning' | 'error' | 'validating';
/** The events that start a validation: a change made by the user, or the control losing focus. */
export type FormValidateTrigger = 'change' | 'blur';

/** One step of a name: a key of an object or an index of an array. */
export type FormNamePathPart = string | number;
/** The name of a field: one key, or a path into nested objects and arrays (`['user', 'address', 'city']`). */
export type FormNamePath = FormNamePathPart | readonly FormNamePathPart[];

/** The props of a `Col` (without its content and style), used for `labelCol` and `wrapperCol`. */
export type FormColProps = Omit<ComponentProps<typeof Col>, 'children' | 'class' | 'style'>;

/** The tooltip of a label: the props of `Tooltip` and the icon. */
export type FormTooltipConfig = Omit<ComponentProps<typeof Tooltip>, 'children' | 'anchor'> & {
  /** Replaces the help icon: plain text or a snippet. */
  icon?: string | Snippet;
  /** The accessible name of the icon button. Default `'More information'`. */
  iconLabel?: string;
};

/** What `requiredMark` can be: a switch, the optional mark, or a snippet that draws the label itself. */
export type FormRequiredMark =
  | boolean
  | 'optional'
  | Snippet<[{ label: string | Snippet | null; required: boolean }]>;

/** The types of a rule. */
export type FormRuleType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'method'
  | 'regexp'
  | 'integer'
  | 'float'
  | 'array'
  | 'object'
  | 'enum'
  | 'date'
  | 'url'
  | 'hex'
  | 'email'
  | 'tel'
  | 'any';

/** What a custom `validator` receives as its first argument: the rule and the name of the field. */
export type FormValidatorRule = FormRuleConfig & { field: string };

/** The result a `validator` may return: nothing (passed), a promise, `false`, an error, or errors. */
export type FormValidatorResult =
  | void
  | boolean
  | Error
  | Error[]
  | Promise<void | boolean | Error | Error[]>;

/** One rule of a field. Checked by `@rc-component/async-validator`, plus the options of the form. */
export interface FormRuleConfig {
  /** The field must have a value (`undefined`, `null`, `''` and `[]` do not). */
  required?: boolean;
  /** The type the value must have. Default `'string'`. */
  type?: FormRuleType;
  /** An exact length of a string or array, or an exact number. */
  len?: number;
  /** The least length of a string or array, or the least number. */
  min?: number;
  /** The most length of a string or array, or the most number. */
  max?: number;
  /** The value must match. */
  pattern?: RegExp;
  /** With `type: 'enum'`: the allowed values. */
  enum?: unknown[];
  /** With `type: 'string'`: a value of only whitespace fails. */
  whitespace?: boolean;
  /** Changes the value before it is checked. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a rule works on any value
  transform?: (value: any) => any;
  /** The text of the error. A template: `${name}`, `${min}`, `${max}`, `${len}`, `${type}`, `${pattern}`, `${enum}`. */
  message?: string;
  /** A check of your own: return nothing, or throw or reject with the message of the error. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a rule works on any value
  validator?: (rule: FormValidatorRule, value: any) => FormValidatorResult;
  /** A failure is shown as a warning and does not stop the submit. */
  warningOnly?: boolean;
  /** With `type: 'array'`: the rule of every element. */
  defaultField?: FormRuleConfig;
  /** With `type: 'array'` or `'object'`: the rules of the elements or keys. */
  fields?: Record<string, FormRuleConfig>;
  /** The events that run this rule: a subset of the `validateTrigger` of the item. */
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
}

/** A rule, or a function of the form that returns one (to compare with another field). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- a rule may be used in a form of any `Values`
export type FormRule = FormRuleConfig | ((form: FormInstance<any>) => FormRuleConfig);

/** The rules of a `Form` by field name: a list per name, or an object for the names below it (`{ user: { name: [rule] } }`). */
export interface FormRules {
  [name: string]: readonly FormRule[] | FormRules;
}

/** The templates of the generated error messages. The same shape as the library's, written with `${name}` style variables. */
export interface FormValidateMessages {
  default?: string;
  required?: string;
  enum?: string;
  whitespace?: string;
  date?: { format?: string; parse?: string; invalid?: string };
  types?: Partial<Record<FormRuleType, string>>;
  string?: { len?: string; min?: string; max?: string; range?: string };
  number?: { len?: string; min?: string; max?: string; range?: string };
  array?: { len?: string; min?: string; max?: string; range?: string };
  pattern?: { mismatch?: string };
}

/** The state of one field, as `setFields` takes it and `onfieldschange` reports it. */
export interface FormFieldData {
  name: FormNamePathPart[];
  value?: unknown;
  touched?: boolean;
  validating?: boolean;
  errors?: string[];
  warnings?: string[];
}

/** The messages of one field. */
export interface FormFieldError {
  name: FormNamePathPart[];
  errors: string[];
  warnings: string[];
}

/** What a failed submit or `validateFields()` rejects with. */
export interface FormFinishFailedInfo<Values extends object = Record<string, unknown>> {
  values: Values;
  errorFields: FormFieldError[];
  /** A newer validation started while this one ran. */
  outOfDate: boolean;
}

/** The options of `validateFields`. */
export interface FormValidateConfig {
  /** Compute the result without showing messages or changing the status. */
  validateOnly?: boolean;
  /** Also validate the fields below each given path. */
  recursive?: boolean;
  /** Only the fields that were touched or already validated. */
  dirty?: boolean;
}

/** `scrollToFirstError` and `scrollToField`: the native scroll options, and whether to focus the control. */
export type FormScrollOptions = ScrollIntoViewOptions & { focus?: boolean };

/** The parts of an item that `classNames` and `styles` address. */
export type FormSemanticName = 'root' | 'label' | 'content' | 'help' | 'helpItem' | 'extra';
export type FormClassNames = Partial<Record<FormSemanticName, string>>;
export type FormStyles = Partial<Record<FormSemanticName, SemanticStyle>>;

/** The icons of `hasFeedback`, one snippet per status. */
export type FormFeedbackIcons = Partial<Record<FormValidateStatus, Snippet>>;

/** What `FormItem` hands to its `children` snippet. Bind `value` to the control and spread `attrs` on it. */
export interface FormField {
  /** The value of the field. The setter is the path of a change made by the user: bind it to the control. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `bind:value` needs a type that fits the prop of every control
  value: any;
  /** For the `status` prop of a control: `error`, `warning`, or `undefined`. */
  readonly status: 'error' | 'warning' | undefined;
  /** `id`, `aria-describedby`, `aria-invalid`, `aria-required`, `aria-labelledby` (the ones that apply): spread on the control. */
  readonly attrs: Record<string, string>;
  /** The error messages of the field. */
  readonly errors: string[];
  /** The warning messages of the field. */
  readonly warnings: string[];
  /** A validation is running. */
  readonly validating: boolean;
  /** The user changed the field, or it was validated on blur. */
  readonly touched: boolean;
  /** The form's `disabled`, for the control. */
  readonly disabled: boolean | undefined;
  /** The form's `size`, for the control. */
  readonly size: FormSize | undefined;
  /** The form's `variant`, for the control. */
  readonly variant: FormVariant | undefined;
  /** The `hasFeedback` icon, for a suffix of the control; `undefined` when there is none to show. */
  readonly feedback: Snippet | undefined;
}

type NativeFormProps = Omit<HTMLFormAttributes, 'children' | 'class' | 'style' | 'onsubmit'>;

export type FormProps<Values extends object = Record<string, unknown>> = NativeFormProps & {
  /** The store of the form, from `createForm()`. Left out: the form makes one (`bind:form` returns it). */
  form?: FormInstance<Values>;
  /**
   * Your own `$state` object that holds the values of the fields (bind a control to `values.username` or to `field.value`).
   * Left out: the store keeps the values itself.
   */
  model?: Values;
  /** Rules by field name; the rules of the item with that name come after them. */
  rules?: FormRules;
  /** The values the fields start with and `resetFields` returns to. Not reactive. With `model`: only fills what it lacks. */
  initialValues?: FormDeepPartial<Values>;
  /** The prefix of the ids of the controls. Left out: a unique id is used. */
  name?: string;
  /** Default `'horizontal'`. */
  layout?: FormLayout;
  /** The layout of the label column, as the props of `Col`. An item's own value wins. */
  labelCol?: FormColProps;
  /** The layout of the control column, as the props of `Col`. An item's own value wins. */
  wrapperCol?: FormColProps;
  /** Default `'end'`. */
  labelAlign?: FormLabelAlign;
  /** Whether a long label wraps. Default `false`. */
  labelWrap?: boolean;
  /** Whether a colon follows the label (horizontal layout only). Default `true`. */
  colon?: boolean;
  /** The required mark: shown (`true`), hidden (`false`), the optional mark, or a snippet. Default `true`. */
  requiredMark?: FormRequiredMark;
  /** The events that validate a field. Default `'change'`. */
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
  /** The templates of the generated messages. */
  validateMessages?: FormValidateMessages;
  /** Whether a field keeps its value when its item is destroyed. Default `true`. */
  preserve?: boolean;
  /** Handed to controls through `field.disabled`. */
  disabled?: boolean;
  /** Handed to controls through `field.size`. */
  size?: FormSize;
  /** Handed to controls through `field.variant`. */
  variant?: FormVariant;
  /** Default tooltip props for every label tooltip. */
  tooltip?: FormTooltipConfig;
  /** After a failed submit: scroll the first invalid control into view and focus it. Default `{ focus: true }`. */
  scrollToFirstError?: boolean | FormScrollOptions;
  /** The icons of the items with `hasFeedback`. */
  feedbackIcons?: FormFeedbackIcons;
  /** Extra classes for the parts of every item. */
  classNames?: FormClassNames;
  /** Inline styles for the parts of every item. */
  styles?: FormStyles;
  /** The submit passed validation. */
  onfinish?: (values: Values) => void;
  /** The submit failed validation. */
  onfinishfailed?: (info: FormFinishFailedInfo<Values>) => void;
  /** A value was changed by the user (with `model`, also by a direct change of the model). */
  onvalueschange?: (changed: FormDeepPartial<Values>, all: Values) => void;
  /** Any state of any field changed. */
  onfieldschange?: (changed: FormFieldData[], all: FormFieldData[]) => void;
  class?: string;
  style?: string;
  children?: Snippet;
};

export type FormItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'style' | 'label'> & {
  /** Connects the item to a field. Left out: a row that only lays out its content. */
  name?: FormNamePath;
  /** The label: text or a snippet. `null` keeps the label column and the colon with no text. */
  label?: string | Snippet | null;
  /** The rules of the field. */
  rules?: FormRule[];
  /** Whether the field is required (the mark and `aria-required`). Left out: derived from the rules. */
  required?: boolean;
  /** Replaces the generated messages; `false` hides them. */
  help?: string | Snippet | false;
  /** A hint below the control and the messages. */
  extra?: string | Snippet;
  /** A help icon after the label. */
  tooltip?: string | Snippet | FormTooltipConfig;
  /** Gives the control a status icon through `field.feedback`. */
  hasFeedback?: boolean | { icons: FormFeedbackIcons };
  /** Sets the status by hand. Left out: derived from the validation. */
  validateStatus?: FormValidateStatus;
  /** Stop at the first failing rule (`true`), or run all and keep the first failure (`'parallel'`). */
  validateFirst?: boolean | 'parallel';
  /** The events that validate the field. Default: the form's. */
  validateTrigger?: FormValidateTrigger | FormValidateTrigger[];
  /** Milliseconds to wait before a validation starts. */
  validateDebounce?: number;
  /** The fields this one is validated again after, when the user changes them. */
  dependencies?: FormNamePath[];
  /** The value when the form has none. The form's `initialValues` win. */
  initialValue?: unknown;
  /** Hide the item; the field is still collected and validated. */
  hidden?: boolean;
  /** Whether the field keeps its value when this item is destroyed. */
  preserve?: boolean;
  /** Extra variables for the message templates. */
  messageVariables?: Record<string, string>;
  colon?: boolean;
  labelAlign?: FormLabelAlign;
  labelWrap?: boolean;
  labelCol?: FormColProps;
  wrapperCol?: FormColProps;
  /** `horizontal` or `vertical` for this item. */
  layout?: FormItemLayout;
  /** The `for` of the label. Default: the id of the control; `null` removes it. */
  htmlFor?: string | null;
  class?: string;
  style?: string;
  /** The control. It receives the field object. */
  children?: Snippet<[FormField]>;
};
