import type { Snippet } from 'svelte';
import type { HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';
import type { SemanticStyle } from '../internal/semantic.js';

/** `middle` (Vue) and `default` (Vue, Angular) are compatibility aliases of `medium`. */
export type InputSize = 'large' | 'medium' | 'middle' | 'small' | 'default';

/** The validation look of the field. */
export type InputStatus = 'error' | 'warning';

/** The visual variant of the field. */
export type InputVariant = 'outlined' | 'filled' | 'borderless' | 'underlined';

/** What a character counter formatter receives. */
export interface CountInfo {
  /** The current text. */
  value: string;
  /** The count of the text (code points, or what `count.strategy` returns). */
  count: number;
  /** The limit shown next to the count: `count.max`, else the native `maxlength`. */
  maxLength?: number;
}

/** Character counting configuration (the `count` prop). */
export interface CountConfig {
  /** A soft limit: past it the count turns red and the field is marked invalid, the text is not cut. */
  max?: number;
  /** Replaces the default count (code points), for example to count an emoji as one. */
  strategy?: (value: string) => number;
  /** Shows the count (as `showCount`); a function formats the text of the count. */
  show?: boolean | ((info: CountInfo) => string);
  /** Cuts the text when it passes `max`. Without it nothing is cut. */
  exceedFormatter?: (value: string, config: { max: number }) => string;
}

/** The object form of `allowClear`. */
export interface AllowClearConfig {
  /** Replaces the clear icon: plain text or a snippet. */
  clearIcon?: string | Snippet;
  /** Accessible name of the clear button (default `Clear`). */
  label?: string;
  /** `tabindex` of the clear button; `-1` removes it from the Tab order (default 0). */
  tabIndex?: number;
}

/** The options of `focus()`. */
export interface InputFocusOptions {
  /** Do not scroll the field into view. */
  preventScroll?: boolean;
  /** Where to put the caret: the start, the end, or select all the text. */
  cursor?: 'start' | 'end' | 'all';
}

/** The named parts of an Input (and InputPassword) that `classNames` and `styles` address. */
export type InputSemanticName = 'root' | 'prefix' | 'input' | 'suffix' | 'clear' | 'count';
/** The named parts of an InputSearch: those of an Input, and the search `button`. */
export type InputSearchSemanticName = InputSemanticName | 'button';
/** The named parts of an InputTextArea. */
export type InputTextAreaSemanticName = 'root' | 'textarea' | 'clear' | 'count';
/** The named parts of an InputOTP. */
export type InputOTPSemanticName = 'root' | 'input' | 'separator';

export type InputClassNames = Partial<Record<InputSemanticName, string>>;
export type InputStyles = Partial<Record<InputSemanticName, SemanticStyle>>;
export type InputSearchClassNames = Partial<Record<InputSearchSemanticName, string>>;
export type InputSearchStyles = Partial<Record<InputSearchSemanticName, SemanticStyle>>;
export type InputTextAreaClassNames = Partial<Record<InputTextAreaSemanticName, string>>;
export type InputTextAreaStyles = Partial<Record<InputTextAreaSemanticName, SemanticStyle>>;
export type InputOTPClassNames = Partial<Record<InputOTPSemanticName, string>>;
export type InputOTPStyles = Partial<Record<InputOTPSemanticName, SemanticStyle>>;

/** The props that `Input` and `InputTextArea` share. */
interface FieldProps {
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Size of the field. `middle` and `default` are compatibility aliases of `medium`. */
  size?: InputSize;
  /** Visual variant. */
  variant?: InputVariant;
  /** Validation look; `error` also sets `aria-invalid`. */
  status?: InputStatus;
  /** Shows a clear button while there is text; the object form tunes the button. */
  allowClear?: boolean | AllowClearConfig;
  /** Shows the length of the text; the object form formats it. */
  showCount?: boolean | { formatter: (info: CountInfo) => string };
  /** Character counting configuration (a soft limit, a custom count, cutting). */
  count?: CountConfig;
  /** Called once per user edit, with the new text and the native `input` event. */
  onchange?: (value: string, event: Event) => void;
  /** Called when the clear button emptied the text. */
  onclear?: (event: MouseEvent) => void;
  /** Additional CSS class appended to the root classes. */
  class?: string;
  /** Inline style of the root; `styles.root` is applied after it. */
  style?: string;
}

export type InputProps = Omit<
  HTMLInputAttributes,
  | 'children'
  | 'class'
  | 'style'
  | 'size'
  | 'prefix'
  | 'type'
  | 'value'
  | 'disabled'
  | 'onchange'
> &
  FieldProps & {
    /** The text of the field. Use `bind:value` for two-way binding; a plain value is the initial text. */
    value?: string;
    /** Native `type`. Text-like types are supported (`text`, `search`, `email`, `tel`, `url`, `number`). */
    type?: string;
    /** Content before the text, inside the field: plain text or a snippet. */
    prefix?: string | Snippet;
    /** Content after the text, inside the field: plain text or a snippet. */
    suffix?: string | Snippet;
    /** A cell before the field, outside its border: plain text or a snippet. */
    addonBefore?: string | Snippet;
    /** A cell after the field, outside its border: plain text or a snippet. */
    addonAfter?: string | Snippet;
    /** Called on Enter, not while an IME composition is open. */
    onpressenter?: (event: KeyboardEvent) => void;
    /** Extra classes for the parts. */
    classNames?: InputClassNames;
    /** Inline styles for the parts. */
    styles?: InputStyles;
  };

export type InputTextAreaProps = Omit<
  HTMLTextareaAttributes,
  'children' | 'class' | 'style' | 'value' | 'disabled' | 'onchange'
> &
  FieldProps & {
    /** The text of the field. Use `bind:value` for two-way binding; a plain value is the initial text. */
    value?: string;
    /** The height follows the content, optionally within `minRows` and `maxRows` lines. */
    autoSize?: boolean | { minRows?: number; maxRows?: number };
    /** Called on Enter, not while an IME composition is open. */
    onpressenter?: (event: KeyboardEvent) => void;
    /** Extra classes for the parts. */
    classNames?: InputTextAreaClassNames;
    /** Inline styles for the parts. */
    styles?: InputTextAreaStyles;
  };
