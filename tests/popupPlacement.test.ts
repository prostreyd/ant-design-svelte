import { describe, expect, it } from 'vitest';
import {
  computePlacement,
  formatPlacement,
  mirrorPlacement,
  parsePlacement,
  type PlacementInput
} from '../src/lib/internal/popup/placement';
import { POPUP_PLACEMENTS } from '../src/lib/internal/popup/types';

const base: PlacementInput = {
  anchor: { left: 400, top: 300, width: 100, height: 40 },
  panel: { width: 200, height: 100 },
  viewport: { width: 1000, height: 800 },
  placement: 'top',
  offset: 4,
  autoAdjustOverflow: true,
  rtl: false
};
const at = (overrides: Partial<PlacementInput>) => computePlacement({ ...base, ...overrides });

describe('placement: the 12 placements (R1)', () => {
  // Anchor 400,300 100x40; panel 200x100; gap 4. Centered panel: x 350 (above, below) or y 270 (left, right).
  const cases: Array<[PlacementInput['placement'], number, number]> = [
    ['top', 350, 196],
    ['topLeft', 400, 196],
    ['topRight', 300, 196],
    ['bottom', 350, 344],
    ['bottomLeft', 400, 344],
    ['bottomRight', 300, 344],
    ['left', 196, 270],
    ['leftTop', 196, 300],
    ['leftBottom', 196, 240],
    ['right', 504, 270],
    ['rightTop', 504, 300],
    ['rightBottom', 504, 240]
  ];

  it.each(cases)('%s puts the panel at %i, %i', (placement, x, y) => {
    const result = at({ placement });
    expect([result.x, result.y]).toEqual([x, y]);
    expect(result.placement).toBe(placement);
  });

  it('covers every one of the 12 placement names', () => {
    expect(cases.map(([name]) => name).sort()).toEqual([...POPUP_PLACEMENTS].sort());
  });

  it('reports the side of the anchor the panel is on', () => {
    expect(at({ placement: 'topRight' }).side).toBe('top');
    expect(at({ placement: 'leftBottom' }).side).toBe('left');
    expect(at({ placement: 'right' }).side).toBe('right');
    expect(at({ placement: 'bottomLeft' }).side).toBe('bottom');
  });

  it('offset is the gap between the anchor and the panel', () => {
    expect(at({ placement: 'bottom', offset: 12 }).y).toBe(352);
    expect(at({ placement: 'right', offset: 0 }).x).toBe(500);
  });

  it('a point anchor is an anchor of no size', () => {
    const result = at({ anchor: { left: 120, top: 80, width: 0, height: 0 }, placement: 'bottomLeft' });
    expect([result.x, result.y]).toEqual([120, 84]);
  });
});

describe('placement: names', () => {
  it('formatPlacement is the inverse of parsePlacement for all 12', () => {
    for (const placement of POPUP_PLACEMENTS) {
      const { side, align } = parsePlacement(placement);
      expect(formatPlacement(side, align)).toBe(placement);
    }
  });

  it('mirrorPlacement swaps left and right, and is its own inverse (R15)', () => {
    expect(mirrorPlacement('bottomLeft')).toBe('bottomRight');
    expect(mirrorPlacement('topRight')).toBe('topLeft');
    expect(mirrorPlacement('left')).toBe('right');
    expect(mirrorPlacement('leftTop')).toBe('rightTop');
    expect(mirrorPlacement('rightBottom')).toBe('leftBottom');
    expect(mirrorPlacement('top')).toBe('top');
    for (const placement of POPUP_PLACEMENTS) expect(mirrorPlacement(mirrorPlacement(placement))).toBe(placement);
  });

  it('rtl mirrors the placement before placing', () => {
    const result = at({ placement: 'bottomLeft', rtl: true });
    expect(result.placement).toBe('bottomRight');
    expect(result.x).toBe(300);
    expect(at({ placement: 'left', rtl: true }).placement).toBe('right');
  });
});

describe('placement: overflow (R2)', () => {
  it('flips to the opposite side when there is no room and the other side fits', () => {
    const top = at({ placement: 'top', anchor: { left: 400, top: 10, width: 100, height: 40 } });
    expect(top.placement).toBe('bottom');
    expect(top.y).toBe(54);
    expect(at({ placement: 'topLeft', anchor: { left: 400, top: 10, width: 100, height: 40 } }).placement).toBe('bottomLeft');
    expect(at({ placement: 'left', anchor: { left: 50, top: 300, width: 100, height: 40 } }).placement).toBe('right');
    expect(at({ placement: 'rightBottom', anchor: { left: 900, top: 300, width: 80, height: 40 } }).placement).toBe('leftBottom');
    const bottom = at({ placement: 'bottom', anchor: { left: 400, top: 740, width: 100, height: 40 } });
    expect(bottom.placement).toBe('top');
    expect(bottom.y).toBe(636);
  });

  it('keeps the side when the other side sticks out more', () => {
    const result = at({
      placement: 'top',
      viewport: { width: 1000, height: 150 },
      anchor: { left: 400, top: 60, width: 100, height: 40 }
    });
    // Above: 44px out. Below: 54px out.
    expect(result.placement).toBe('top');
  });

  it('does not flip when it fits', () => {
    expect(at({ placement: 'top' }).placement).toBe('top');
  });

  it('autoAdjustOverflow false neither flips nor shifts', () => {
    const anchor = { left: 5, top: 10, width: 20, height: 40 };
    const result = at({ placement: 'top', anchor, autoAdjustOverflow: false });
    expect(result.placement).toBe('top');
    expect([result.x, result.y]).toEqual([-85, -94]);
  });

  it('shifts an unaligned placement along the edge', () => {
    const left = at({ placement: 'top', anchor: { left: 5, top: 300, width: 20, height: 40 } });
    expect(left.x).toBe(0);
    const right = at({ placement: 'top', anchor: { left: 950, top: 300, width: 40, height: 40 } });
    expect(right.x).toBe(800);
    const side = at({ placement: 'left', anchor: { left: 400, top: 790, width: 40, height: 20 } });
    expect(side.y).toBe(700);
  });

  it('an aligned placement only flips: it is not shifted', () => {
    const result = at({ placement: 'topLeft', anchor: { left: 950, top: 300, width: 40, height: 40 } });
    expect(result.x).toBe(950);
  });

  it('a panel wider than the viewport starts at the edge', () => {
    const result = at({ placement: 'top', panel: { width: 1200, height: 50 } });
    expect(result.x).toBe(0);
  });
});

describe('placement: arrow (R6)', () => {
  const arrow = { size: 8, pointAtCenter: false, edge: 16 };

  it('no arrow: no offset', () => {
    expect(at({ placement: 'top' }).arrow).toBeNull();
    expect(at({ placement: 'top', arrow: null }).arrow).toBeNull();
  });

  it('an unaligned placement points at the middle of the anchor', () => {
    expect(at({ placement: 'top', arrow }).arrow).toBe(100);
    expect(at({ placement: 'left', arrow }).arrow).toBe(50);
  });

  it('after a shift it still points at the anchor', () => {
    const result = at({ placement: 'top', arrow, anchor: { left: 5, top: 300, width: 20, height: 40 } });
    expect(result.x).toBe(0);
    expect(result.arrow).toBe(15);
  });

  it('an aligned placement keeps the arrow at the edge distance', () => {
    expect(at({ placement: 'topLeft', arrow }).arrow).toBe(16);
    expect(at({ placement: 'topRight', arrow }).arrow).toBe(184);
    expect(at({ placement: 'leftTop', arrow }).arrow).toBe(16);
    expect(at({ placement: 'rightBottom', arrow }).arrow).toBe(84);
  });

  it('a panel beside the anchor uses sideEdge, one above or below it uses edge', () => {
    const sided = { ...arrow, edge: 14, sideEdge: 10 };
    expect(at({ placement: 'leftTop', arrow: sided }).arrow).toBe(10);
    expect(at({ placement: 'rightBottom', arrow: sided }).arrow).toBe(90);
    expect(at({ placement: 'topLeft', arrow: sided }).arrow).toBe(14);
    expect(at({ placement: 'bottomRight', arrow: sided }).arrow).toBe(186);
  });

  it('without sideEdge a panel beside the anchor uses edge as well', () => {
    expect(at({ placement: 'leftBottom', arrow }).arrow).toBe(84);
  });

  it('pointAtCenter points at the middle of the anchor for an aligned placement', () => {
    expect(at({ placement: 'topLeft', arrow: { ...arrow, pointAtCenter: true } }).arrow).toBe(50);
  });

  it('an arrow that would point past a narrow anchor points at its middle', () => {
    const result = at({ placement: 'topLeft', arrow, anchor: { left: 400, top: 300, width: 10, height: 40 } });
    expect(result.arrow).toBe(8);
  });

  it('stays clear of the corners of the panel', () => {
    const result = at({ placement: 'topLeft', arrow: { ...arrow, edge: 2 } });
    expect(result.arrow).toBe(8);
    expect(at({ placement: 'top', arrow, panel: { width: 10, height: 20 } }).arrow).toBe(5);
  });

  it('follows the flipped side: the arrow offset is along the panel', () => {
    const result = at({ placement: 'top', arrow, anchor: { left: 400, top: 10, width: 100, height: 40 } });
    expect(result.placement).toBe('bottom');
    expect(result.arrow).toBe(100);
  });
});
