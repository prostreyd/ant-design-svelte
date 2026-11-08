// Public API of the library. Components are re-exported from here.

export const VERSION = '0.1.0-alpha.0';

export { default as Button } from './Button/Button.svelte';
export type {
  ButtonHTMLType,
  ButtonIconPlacement,
  ButtonLoading,
  ButtonShape,
  ButtonSize,
  ButtonType
} from './Button/types.js';
