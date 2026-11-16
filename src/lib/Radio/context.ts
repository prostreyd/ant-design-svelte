import { getContext, setContext } from 'svelte';
import type {
  RadioButtonStyle,
  RadioGroupClassNames,
  RadioGroupStyles,
  RadioOrientation,
  RadioValue
} from './types.js';

/**
 * What a RadioGroup shares with the radios inside it. The properties are getters over the group's
 * state, so a radio that reads them in a `$derived` follows their changes.
 */
export interface RadioGroupContext {
  /** Whether `value` is the selected value. */
  isChecked(value: RadioValue): boolean;
  readonly disabled: boolean;
  /** The native `name` of every input of the group: the group's own, or a generated one. */
  readonly name: string;
  /**
   * A `form` attribute that names no form, set when the group has no `name` of its own: the inputs
   * then have no form owner, so a surrounding `<form>` never submits the generated name. `undefined`
   * when the group is named.
   */
  readonly form: string | undefined;
  readonly buttonStyle: RadioButtonStyle;
  readonly size: 'large' | 'medium' | 'small';
  readonly orientation: RadioOrientation;
  readonly block: boolean;
  readonly classNames: RadioGroupClassNames | undefined;
  readonly styles: RadioGroupStyles | undefined;
  /** Called by a radio after the user selected it: sets the value, calls `onchange`, re-asserts every radio. */
  select(value: RadioValue, event: Event): void;
  /**
   * Registers the function that writes a radio's state back to its input; returns the function that
   * removes it. The group calls every one of them after a selection, because the browser unchecks the
   * previously checked radio on its own, which the group's state may not agree with.
   */
  register(sync: () => void): () => void;
}

const KEY = Symbol('ads-radio-group');

export function setRadioGroup(context: RadioGroupContext): void {
  setContext(KEY, context);
}

/** The nearest RadioGroup, or `undefined` outside of one. */
export function getRadioGroup(): RadioGroupContext | undefined {
  return getContext<RadioGroupContext | undefined>(KEY);
}
