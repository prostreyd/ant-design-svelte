/**
 * Types of the internal popup primitive (specs/popup.md). The primitive is not exported from the package
 * in v1.0; the components built on it (Select, Tooltip, Dropdown, ...) re-export what their users need.
 */

/** The 12 placements. The name is the side of the anchor plus the alignment: `topLeft` is above the anchor, left edges aligned. */
export const POPUP_PLACEMENTS = [
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
  'left',
  'leftTop',
  'leftBottom',
  'right',
  'rightTop',
  'rightBottom'
] as const;

export type PopupPlacement = (typeof POPUP_PLACEMENTS)[number];

/** A point in viewport coordinates, used as an anchor (the context menu opens at the pointer). */
export type PopupPoint = { x: number; y: number };

/** What the panel is placed next to: an element, a point, or nothing (then nothing is rendered). */
export type PopupAnchor = HTMLElement | PopupPoint | null;

/** `true` shows the arrow; `pointAtCenter` points it at the middle of the anchor instead of its aligned edge. */
export type PopupArrow = boolean | { pointAtCenter: boolean };

/** What closes the popup by itself. Both default to `true`. */
export type PopupDismiss = { outsidePress?: boolean; escape?: boolean };

/** Who caused an open-state change: the trigger helper, the content of the panel, or a dismissal (outside press, Escape). */
export type PopupSource = 'trigger' | 'content' | 'dismiss';

/** The element the panel is moved into, or a function that returns it (React and Vue `getPopupContainer`). */
export type PopupContainer = HTMLElement | ((anchor: HTMLElement | null) => HTMLElement);

/** The three layers of the Ant Design token table, in stacking order: popover, dropdown (and select), tooltip. */
export type PopupLayer = 'popover' | 'dropdown' | 'tooltip';

export const POPUP_LAYERS = ['popover', 'dropdown', 'tooltip'] as const;

export type PopupTrigger = 'hover' | 'focus' | 'click' | 'contextMenu';

export function isPopupElement(anchor: PopupAnchor | undefined): anchor is HTMLElement {
  return typeof anchor === 'object' && anchor !== null && 'nodeType' in anchor;
}
