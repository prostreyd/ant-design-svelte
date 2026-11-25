/**
 * The cut of a long text: how many characters fit.
 *
 * `fits(n)` answers whether the first `n` code points (plus whatever the caller puts after them: the dots, the suffix,
 * the buttons) fit in the allowed rows. It must be monotonic: if `n` fits, every smaller number fits. The cut falls on a
 * code point, never inside a surrogate pair. One layout read per step, so about `log2(length)` reads, not one per character.
 *
 * @returns `null` when the whole text fits (nothing is cut); otherwise the text before the cut, trimmed at its end.
 */
export function findCut(text: string, fits: (prefix: string) => boolean): string | null {
  if (fits(text)) return null;
  const points = Array.from(text);
  let low = 0;
  let high = points.length - 1;
  // `low` always fits (0 characters is the least that can be shown); `high + 1` does not (the whole text was tried).
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (fits(points.slice(0, middle).join(''))) low = middle;
    else high = middle - 1;
  }
  return points.slice(0, low).join('').trimEnd();
}

/** Whether a box clips its content: the text is wider than a single row, or taller than the rows it was given. */
export function isClipped(element: HTMLElement): boolean {
  return element.scrollWidth > element.clientWidth + 0.5 || element.scrollHeight > element.clientHeight + 1;
}
