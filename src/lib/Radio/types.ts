import type { Snippet } from 'svelte';
import type { SemanticStyle } from '../internal/semantic.js';

/** The identity of a radio inside a `RadioGroup` and the native `value` of its input (written as text). */
export type RadioValue = string | number | boolean;

/**
 * The size of the buttons of a group (it does not touch plain radios). `middle` and `default` are
 * aliases of `medium`: React's current name is `medium`, Vue and Angular say `default`.
 */
export type RadioSize = 'large' | 'medium' | 'middle' | 'small' | 'default';

/** How a checked `RadioButton` is drawn: a colored outline, or a solid fill. */
export type RadioButtonStyle = 'outline' | 'solid';

/** What the `options` of a group render: plain radios, or buttons. */
export type RadioOptionType = 'default' | 'button';

/** The direction of the items of a group. */
export type RadioOrientation = 'horizontal' | 'vertical';

/** The named parts of a Radio that `classNames` and `styles` address. */
export type RadioSemanticName = 'root' | 'icon' | 'label';

export type RadioClassNames = Partial<Record<RadioSemanticName, string>>;

export type RadioStyles = Partial<Record<RadioSemanticName, SemanticStyle>>;

/** A RadioButton has no mark, so it has no `icon` part. */
export type RadioButtonSemanticName = 'root' | 'label';

export type RadioButtonClassNames = Partial<Record<RadioButtonSemanticName, string>>;

export type RadioButtonStyles = Partial<Record<RadioButtonSemanticName, SemanticStyle>>;

/**
 * The named parts of a RadioGroup: `root` is the group element; `item`, `itemIcon` and `itemLabel`
 * reach the `root`, `icon` and `label` parts of every radio inside (`itemIcon` does nothing for buttons).
 */
export type RadioGroupSemanticName = 'root' | 'item' | 'itemIcon' | 'itemLabel';

export type RadioGroupClassNames = Partial<Record<RadioGroupSemanticName, string>>;

export type RadioGroupStyles = Partial<Record<RadioGroupSemanticName, SemanticStyle>>;

/** One entry of the `options` of a RadioGroup. A plain string, number or boolean is both the value and the label. */
export interface RadioOption {
  /** Label content: plain text, or a snippet for icons and markup. */
  label: string | Snippet;
  /** The value; it must be unique within the group. */
  value: RadioValue;
  /** Disables this option alone. */
  disabled?: boolean;
  /** Native `title` of the option's root label. */
  title?: string;
  /** Native `id` of the option's input, so an external `<label for>` or `aria-labelledby` can reach it. */
  id?: string;
  /** Native `required` of the option's input (one required radio makes the whole native group required). */
  required?: boolean;
  /** Extra class of the option's root. */
  class?: string;
  /** Inline style of the option's root. */
  style?: string;
  /** Called when this option is selected by the user, before the group's `onchange`. */
  onchange?: (checked: boolean, event: Event) => void;
}
