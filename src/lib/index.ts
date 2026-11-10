// Public API of the library. Components are re-exported from here.

export const VERSION = '0.3.0';

export { default as Button } from './Button/Button.svelte';
export { default as Switch } from './Switch/Switch.svelte';
export { default as Checkbox } from './Checkbox/Checkbox.svelte';
export { default as CheckboxGroup } from './Checkbox/CheckboxGroup.svelte';
export type {
  CheckboxClassNames,
  CheckboxGroupClassNames,
  CheckboxGroupSemanticName,
  CheckboxGroupStyles,
  CheckboxOption,
  CheckboxSemanticName,
  CheckboxStyles,
  CheckboxValue
} from './Checkbox/types.js';
export type {
  SwitchClassNames,
  SwitchSemanticName,
  SwitchSize,
  SwitchStyles
} from './Switch/types.js';
export type {
  ButtonHTMLType,
  ButtonIconPlacement,
  ButtonLoading,
  ButtonShape,
  ButtonSize,
  ButtonType
} from './Button/types.js';
