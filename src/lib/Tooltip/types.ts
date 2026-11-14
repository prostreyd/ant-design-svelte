import type { PopupArrow, PopupContainer, PopupPlacement, PopupTrigger } from '../internal/popup/types.js';
import type { SemanticStyle } from '../internal/semantic.js';

/** The 12 placements: the side of the trigger plus the alignment (`topLeft`: above, left edges aligned). */
export type TooltipPlacement = PopupPlacement;

/** What opens the tooltip. An array combines them; an empty array means the tooltip is only controlled. */
export type TooltipTrigger = PopupTrigger;

/** `true` shows the arrow; `{ pointAtCenter: true }` points it at the middle of the trigger instead of its aligned edge. */
export type TooltipArrow = PopupArrow;

/** Where the panel is moved to: an element, or a function that returns it. Default `document.body`. */
export type TooltipContainer = PopupContainer;

/** The 13 preset colors of the Ant Design palette. */
export const TOOLTIP_PRESET_COLORS = [
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime'
] as const;

export type TooltipPresetColor = (typeof TOOLTIP_PRESET_COLORS)[number];

/** The named parts that `classNames` and `styles` address. */
export type TooltipSemanticName = 'root' | 'container' | 'arrow';

export type TooltipClassNames = Partial<Record<TooltipSemanticName, string>>;

export type TooltipStyles = Partial<Record<TooltipSemanticName, SemanticStyle>>;
