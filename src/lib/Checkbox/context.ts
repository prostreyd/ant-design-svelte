import { getContext, setContext } from 'svelte';
import type { CheckboxGroupClassNames, CheckboxGroupStyles, CheckboxValue } from './types.js';

/**
 * What a CheckboxGroup shares with the checkboxes inside it. The properties are getters over the
 * group's state, so a checkbox that reads them in a `$derived` follows their changes.
 */
export interface CheckboxGroupContext {
  /** Whether `value` is one of the selected values. */
  isChecked(value: CheckboxValue): boolean;
  readonly disabled: boolean;
  readonly name: string | undefined;
  readonly classNames: CheckboxGroupClassNames | undefined;
  readonly styles: CheckboxGroupStyles | undefined;
  /** Called by a checkbox after the user toggled it. */
  toggle(value: CheckboxValue, checked: boolean, event: Event): void;
  /** Registers a checkbox (its value is read when needed); returns the function that removes it. */
  register(value: () => CheckboxValue | undefined): () => void;
}

const KEY = Symbol('ads-checkbox-group');

export function setCheckboxGroup(context: CheckboxGroupContext): void {
  setContext(KEY, context);
}

/** The nearest CheckboxGroup, or `undefined` outside of one. */
export function getCheckboxGroup(): CheckboxGroupContext | undefined {
  return getContext<CheckboxGroupContext | undefined>(KEY);
}
