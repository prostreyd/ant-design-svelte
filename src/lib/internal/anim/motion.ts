/**
 * The motion of a row in a list of layers (a message, a notification): it comes in from a side (above by default) and fades, and
 * leaves the same way while its neighbours slide into its place (specs/overlay.md, A2 and A3). It was `Message/motion.ts` and moved here so that Notification can use it too.
 *
 * Written with the Web Animations API, not with CSS animations, because the height that the neighbours slide over is
 * only known once the box exists: it is measured and animated from there. A user who prefers reduced motion, and an
 * environment without `Element.animate` (a test in jsdom), gets none of it: the row appears and goes at once.
 */

const FALLBACK_DURATION = 200;
const FALLBACK_OFFSET = 64;

export function motionAllowed(): boolean {
  if (typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return false;
  return typeof matchMedia !== 'function' || !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function token(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/** The motion token as milliseconds (`0.2s` and `200ms` both work). */
function durationOf(element: Element): number {
  const raw = token(element, '--ads-motion-duration');
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return FALLBACK_DURATION;
  return raw.endsWith('ms') ? value : value * 1000;
}

/** The side a box comes in from, and leaves to. */
export type MotionSide = 'top' | 'bottom' | 'left' | 'right';

export interface MotionOptions {
  /** How far the box slides: the custom property of the component that plays the motion. */
  offsetToken?: string;
  /** The side the box comes in from and leaves to. Default `'top'` (a message). */
  from?: MotionSide;
  /**
   * Which padding of the slot is the gap to the next row: the one at its end (below it, for a list that grows downwards, the
   * default) or at its start (above it, for a list that stands on the bottom edge). That padding is animated with the height.
   */
  gap?: 'start' | 'end';
}

/** The transform of a box that is away (`away`) and of one that is in its place (`home`), for the side it comes from. */
function slide(from: MotionSide | undefined, offset: number): { away: string; home: string } {
  switch (from) {
    case 'bottom':
      return { away: `translateY(${offset}px)`, home: 'translateY(0)' };
    case 'left':
      return { away: `translateX(-${offset}px)`, home: 'translateX(0)' };
    case 'right':
      return { away: `translateX(${offset}px)`, home: 'translateX(0)' };
    default:
      return { away: `translateY(-${offset}px)`, home: 'translateY(0)' };
  }
}

function offsetOf(element: Element, offsetToken: string | undefined): number {
  const value = offsetToken ? parseFloat(token(element, offsetToken)) : NaN;
  return Number.isFinite(value) ? value : FALLBACK_OFFSET;
}

/**
 * The height of a row and its bottom padding (the gap to the next row). The row is `border-box`, so its height cannot
 * go below the padding: both are animated, or the row would stop at the gap and the others would jump when it goes.
 */
function measure(slot: HTMLElement, gap: 'start' | 'end' | undefined): { height: number; padding: string } {
  const style = getComputedStyle(slot);
  return { height: slot.getBoundingClientRect().height, padding: gap === 'start' ? style.paddingBlockStart : style.paddingBlockEnd };
}

/** The keyframe property of the gap padding. */
const gapProperty = (gap: 'start' | 'end' | undefined): 'paddingBlockStart' | 'paddingBlockEnd' =>
  gap === 'start' ? 'paddingBlockStart' : 'paddingBlockEnd';

function timing(element: Element, extra: KeyframeAnimationOptions = {}): KeyframeAnimationOptions {
  return { duration: durationOf(element), easing: token(element, '--ads-motion-ease') || 'ease', ...extra };
}

/**
 * A new row: its box fades in from above. With `shift` (a pile or a newest-on-top list, where the others are pushed
 * down) its slot also grows from nothing, so that the others slide instead of jumping.
 */
export function playEnter(slot: HTMLElement, item: HTMLElement, shift: boolean, options: MotionOptions = {}): void {
  if (!motionAllowed()) return;
  const { away, home } = slide(options.from, offsetOf(item, options.offsetToken));
  item.animate(
    [
      { opacity: 0, transform: away },
      { opacity: 1, transform: home }
    ],
    timing(item)
  );
  if (shift) {
    const { height, padding } = measure(slot, options.gap);
    const property = gapProperty(options.gap);
    slot.animate(
      [
        { height: '0px', [property]: '0px' },
        { height: `${height}px`, [property]: padding }
      ],
      timing(slot)
    );
  }
}

/** A closing row: the box fades out towards the side it came from and the slot shrinks, so the neighbours slide into its place. */
export function playLeave(slot: HTMLElement, item: HTMLElement, options: MotionOptions = {}): Promise<void> {
  if (!motionAllowed()) return Promise.resolve();
  const { away, home } = slide(options.from, offsetOf(item, options.offsetToken));
  const { height, padding } = measure(slot, options.gap);
  const property = gapProperty(options.gap);
  const fill = { fill: 'forwards' } as const;
  const fade = item.animate(
    [
      { opacity: 1, transform: home },
      { opacity: 0, transform: away }
    ],
    timing(item, fill)
  );
  const shrink = slot.animate(
    [
      { height: `${height}px`, [property]: padding },
      { height: '0px', [property]: '0px' }
    ],
    timing(slot, fill)
  );
  // A cancelled animation rejects; the row has to go either way.
  return Promise.all([fade.finished, shrink.finished]).then(
    () => undefined,
    () => undefined
  );
}

/** The top of each slot of a list, by `data-row-id`: the "first" of a FLIP. */
export function readTops(list: HTMLElement): Map<string, number> {
  const tops = new Map<string, number>();
  for (const slot of list.querySelectorAll<HTMLElement>('[data-row-id]')) {
    tops.set(slot.dataset.rowId as string, slot.getBoundingClientRect().top);
  }
  return tops;
}

/** Slides every slot from where it was to where it is (the pile opening or closing changes the layout at once). */
export function playFlip(list: HTMLElement, first: Map<string, number>): void {
  if (!motionAllowed()) return;
  for (const slot of list.querySelectorAll<HTMLElement>('[data-row-id]')) {
    const before = first.get(slot.dataset.rowId as string);
    if (before === undefined) continue;
    const delta = before - slot.getBoundingClientRect().top;
    if (Math.abs(delta) < 0.5) continue;
    slot.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], timing(slot));
  }
}
