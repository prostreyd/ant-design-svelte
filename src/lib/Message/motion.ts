/**
 * The motion of a message: it comes in from above and fades, and leaves the same way while the ones below move up.
 *
 * Written with the Web Animations API, not with CSS animations, because the height that the neighbours slide over is
 * only known once the box exists: it is measured and animated from there. A user who prefers reduced motion, and an
 * environment without `Element.animate` (a test in jsdom), gets none of it: the message appears and goes at once.
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

function offsetOf(element: Element): number {
  const value = parseFloat(token(element, '--ads-message-motion-offset'));
  return Number.isFinite(value) ? value : FALLBACK_OFFSET;
}

/**
 * The height of a row and its bottom padding (the gap to the next row). The row is `border-box`, so its height cannot
 * go below the padding: both are animated, or the row would stop at the gap and the others would jump when it goes.
 */
function measure(slot: HTMLElement): { height: number; padding: string } {
  return { height: slot.getBoundingClientRect().height, padding: getComputedStyle(slot).paddingBlockEnd };
}

function timing(element: Element, extra: KeyframeAnimationOptions = {}): KeyframeAnimationOptions {
  return { duration: durationOf(element), easing: token(element, '--ads-motion-ease') || 'ease', ...extra };
}

/**
 * A new message: its box fades in from above. With `shift` (a pile or a newest-on-top list, where the others are pushed
 * down) its slot also grows from nothing, so that the others slide instead of jumping.
 */
export function playEnter(slot: HTMLElement, item: HTMLElement, shift: boolean): void {
  if (!motionAllowed()) return;
  const offset = offsetOf(item);
  item.animate(
    [
      { opacity: 0, transform: `translateY(-${offset}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    timing(item)
  );
  if (shift) {
    const { height, padding } = measure(slot);
    slot.animate(
      [
        { height: '0px', paddingBlockEnd: '0px' },
        { height: `${height}px`, paddingBlockEnd: padding }
      ],
      timing(slot)
    );
  }
}

/** A closing message: the box fades up and the slot shrinks, so the ones below slide into its place. */
export function playLeave(slot: HTMLElement, item: HTMLElement): Promise<void> {
  if (!motionAllowed()) return Promise.resolve();
  const offset = offsetOf(item);
  const { height, padding } = measure(slot);
  const fill = { fill: 'forwards' } as const;
  const fade = item.animate(
    [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: `translateY(-${offset}px)` }
    ],
    timing(item, fill)
  );
  const shrink = slot.animate(
    [
      { height: `${height}px`, paddingBlockEnd: padding },
      { height: '0px', paddingBlockEnd: '0px' }
    ],
    timing(slot, fill)
  );
  // A cancelled animation rejects; the message has to go either way.
  return Promise.all([fade.finished, shrink.finished]).then(
    () => undefined,
    () => undefined
  );
}

/** The top of each slot of a list, by message id: the "first" of a FLIP. */
export function readTops(list: HTMLElement): Map<string, number> {
  const tops = new Map<string, number>();
  for (const slot of list.querySelectorAll<HTMLElement>('[data-message-id]')) {
    tops.set(slot.dataset.messageId as string, slot.getBoundingClientRect().top);
  }
  return tops;
}

/** Slides every slot from where it was to where it is (the pile opening or closing changes the layout at once). */
export function playFlip(list: HTMLElement, first: Map<string, number>): void {
  if (!motionAllowed()) return;
  for (const slot of list.querySelectorAll<HTMLElement>('[data-message-id]')) {
    const before = first.get(slot.dataset.messageId as string);
    if (before === undefined) continue;
    const delta = before - slot.getBoundingClientRect().top;
    if (Math.abs(delta) < 0.5) continue;
    slot.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], timing(slot));
  }
}
