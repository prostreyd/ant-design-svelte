/**
 * The placement math of the popup: where the panel goes, next to which side of the anchor, and where its
 * arrow points. Pure functions with no DOM access, so they are tested with plain numbers (specs/popup.md,
 * R1, R2, R4, R6, R15). All coordinates are in the viewport.
 */
import type { PopupPlacement } from './types.js';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

const PARSED: Record<PopupPlacement, { side: Side; align: Align }> = {
  top: { side: 'top', align: 'center' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  leftTop: { side: 'left', align: 'start' },
  leftBottom: { side: 'left', align: 'end' },
  right: { side: 'right', align: 'center' },
  rightTop: { side: 'right', align: 'start' },
  rightBottom: { side: 'right', align: 'end' }
};

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

export function parsePlacement(placement: PopupPlacement): { side: Side; align: Align } {
  return PARSED[placement];
}

export function formatPlacement(side: Side, align: Align): PopupPlacement {
  if (align === 'center') return side;
  if (side === 'top' || side === 'bottom') return `${side}${align === 'start' ? 'Left' : 'Right'}`;
  return `${side}${align === 'start' ? 'Top' : 'Bottom'}`;
}

/**
 * The placement as it reads in a right-to-left layout: the names are physical, so `bottomLeft` (left edges
 * aligned) becomes `bottomRight`, and `left` becomes `right`.
 */
export function mirrorPlacement(placement: PopupPlacement): PopupPlacement {
  const { side, align } = PARSED[placement];
  if (side === 'top' || side === 'bottom') {
    return formatPlacement(side, align === 'start' ? 'end' : align === 'end' ? 'start' : 'center');
  }
  return formatPlacement(OPPOSITE[side], align);
}

export interface ArrowInput {
  /** Visible height of the arrow in px (the half of the rotated square that sticks out). */
  size: number;
  /** Point at the middle of the anchor even for an aligned placement. */
  pointAtCenter: boolean;
  /** Distance from the aligned edge of the panel to the middle of the arrow, for an aligned placement above or below the anchor. */
  edge: number;
  /**
   * The same for a panel beside the anchor (`leftTop`, `rightBottom`, ...). Those panels are usually one line high, so the
   * distance of the other axis would put the arrow in the middle and `rightTop`, `right` and `rightBottom` would look the
   * same. Defaults to `edge`.
   */
  sideEdge?: number;
}

export interface PlacementInput {
  anchor: Box;
  panel: Size;
  viewport: Size;
  placement: PopupPlacement;
  /** Gap between the anchor and the panel along the main axis, in px. */
  offset: number;
  /** Flip to the opposite side when there is no room, and shift along the edge for an unaligned placement. */
  autoAdjustOverflow: boolean;
  /** Right-to-left layout: the placement is mirrored first. */
  rtl: boolean;
  arrow?: ArrowInput | null;
}

export interface PlacementResult {
  /** Left and top of the panel in the viewport. */
  x: number;
  y: number;
  /** The placement actually used, after mirroring and flipping (physical names). */
  placement: PopupPlacement;
  /** The side of the anchor the panel is on. The arrow sits on the opposite edge of the panel. */
  side: Side;
  /** Distance of the middle of the arrow from the left (top and bottom sides) or top (left and right sides) of the panel. `null` without an arrow. */
  arrow: number | null;
}

function position(side: Side, align: Align, input: PlacementInput): { x: number; y: number } {
  const { anchor, panel, offset } = input;
  const centerX = anchor.left + anchor.width / 2 - panel.width / 2;
  const centerY = anchor.top + anchor.height / 2 - panel.height / 2;
  if (side === 'top' || side === 'bottom') {
    const y = side === 'top' ? anchor.top - offset - panel.height : anchor.top + anchor.height + offset;
    const x = align === 'start' ? anchor.left : align === 'end' ? anchor.left + anchor.width - panel.width : centerX;
    return { x, y };
  }
  const x = side === 'left' ? anchor.left - offset - panel.width : anchor.left + anchor.width + offset;
  const y = align === 'start' ? anchor.top : align === 'end' ? anchor.top + anchor.height - panel.height : centerY;
  return { x, y };
}

/** How far the panel sticks out of the viewport on the side it was placed on (0 when it fits). */
function mainOverflow(side: Side, at: { x: number; y: number }, input: PlacementInput): number {
  const { panel, viewport } = input;
  switch (side) {
    case 'top':
      return Math.max(0, -at.y);
    case 'bottom':
      return Math.max(0, at.y + panel.height - viewport.height);
    case 'left':
      return Math.max(0, -at.x);
    default:
      return Math.max(0, at.x + panel.width - viewport.width);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function computePlacement(input: PlacementInput): PlacementResult {
  const requested = input.rtl ? mirrorPlacement(input.placement) : input.placement;
  const parsed = PARSED[requested];
  let side = parsed.side;
  const { align } = parsed;
  let at = position(side, align, input);

  if (input.autoAdjustOverflow) {
    const opposite = OPPOSITE[side];
    const flipped = position(opposite, align, input);
    // Flip only when the first side does not fit and the other one sticks out less.
    if (mainOverflow(side, at, input) > mainOverflow(opposite, flipped, input)) {
      side = opposite;
      at = flipped;
    }
    // A placement without alignment also shifts along the edge; an aligned one only flips.
    if (align === 'center') {
      if (side === 'top' || side === 'bottom') at = { x: clamp(at.x, 0, input.viewport.width - input.panel.width), y: at.y };
      else at = { x: at.x, y: clamp(at.y, 0, input.viewport.height - input.panel.height) };
    }
  }

  let arrow: number | null = null;
  if (input.arrow) {
    const horizontal = side === 'top' || side === 'bottom';
    const panelStart = horizontal ? at.x : at.y;
    const panelSize = horizontal ? input.panel.width : input.panel.height;
    const anchorStart = (horizontal ? input.anchor.left : input.anchor.top) - panelStart;
    const anchorSize = horizontal ? input.anchor.width : input.anchor.height;
    const anchorCenter = anchorStart + anchorSize / 2;
    let wanted = anchorCenter;
    if (align !== 'center' && !input.arrow.pointAtCenter) {
      const edge = horizontal ? input.arrow.edge : (input.arrow.sideEdge ?? input.arrow.edge);
      wanted = align === 'start' ? edge : panelSize - edge;
      // An arrow that would point past the anchor points at its middle instead.
      if (wanted < anchorStart || wanted > anchorStart + anchorSize) wanted = anchorCenter;
    }
    const margin = input.arrow.size;
    arrow = panelSize < margin * 2 ? panelSize / 2 : clamp(wanted, margin, panelSize - margin);
  }

  return { x: at.x, y: at.y, placement: formatPlacement(side, align), side, arrow };
}
