// Helpers for tests that look at where a popup panel was put. The panel stays at the corner of its containing block
// and is moved with `transform: translate()`; jsdom has no layout, so these give it the rectangle a browser would.

export interface Place {
  left: number;
  top: number;
}

/** Where the panel was moved to, read from its `transform`. */
export function placed(panel: HTMLElement | null): Place {
  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(panel?.style.transform ?? '');
  return match ? { left: Number(match[1]), top: Number(match[2]) } : { left: 0, top: 0 };
}

/** The rectangle of a panel in a browser: the start of its containing block, moved by what was written. */
export function panelRect(panel: HTMLElement, origin: Place): { left: number; top: number; width: number; height: number } {
  const at = placed(panel);
  return { left: origin.left + at.left, top: origin.top + at.top, width: 0, height: 0 };
}
