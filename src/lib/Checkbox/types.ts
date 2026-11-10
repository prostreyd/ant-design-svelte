import type { Snippet } from 'svelte';
import type { SemanticStyle } from '../internal/semantic.js';

/** The identity of a checkbox inside a `CheckboxGroup` and the native `value` of its input. */
export type CheckboxValue = string | number;

/** The named parts of a Checkbox that `classNames` and `styles` address. */
export type CheckboxSemanticName = 'root' | 'icon' | 'label';

export type CheckboxClassNames = Partial<Record<CheckboxSemanticName, string>>;

export type CheckboxStyles = Partial<Record<CheckboxSemanticName, SemanticStyle>>;

/**
 * The named parts of a CheckboxGroup: `root` is the group element; `item`, `itemIcon` and
 * `itemLabel` reach the `root`, `icon` and `label` parts of every checkbox inside.
 */
export type CheckboxGroupSemanticName = 'root' | 'item' | 'itemIcon' | 'itemLabel';

export type CheckboxGroupClassNames = Partial<Record<CheckboxGroupSemanticName, string>>;

export type CheckboxGroupStyles = Partial<Record<CheckboxGroupSemanticName, SemanticStyle>>;

/** One entry of the `options` of a CheckboxGroup. A plain string or number is both the value and the label. */
export interface CheckboxOption {
  /** Label content: plain text, or a snippet for icons and markup. */
  label: string | Snippet;
  /** The value; it must be unique within the group. */
  value: CheckboxValue;
  /** Disables this option alone. */
  disabled?: boolean;
  /** Native `title` of the option's root label. */
  title?: string;
  /** Extra class of the option's root. */
  class?: string;
  /** Inline style of the option's root. */
  style?: string;
  /** Called when this option is toggled by the user, before the group's `onchange`. */
  onchange?: (checked: boolean, event: Event) => void;
}
