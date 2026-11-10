// Public API of the library. Components are re-exported from here.

export const VERSION = '0.1.0-alpha.2';

export { default as Button } from './Button/Button.svelte';
export { default as Switch } from './Switch/Switch.svelte';
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
