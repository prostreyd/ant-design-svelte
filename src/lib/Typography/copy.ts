/**
 * Writes text to the clipboard. The Clipboard API when it exists and the page is a secure context; otherwise, or when it
 * rejects, a temporary off-screen `<textarea>` and `document.execCommand('copy')`, which also works on plain HTTP.
 * Resolves `true` only when one of the two ways took the text, so a caller never shows "Copied" for a failed copy.
 */
export async function writeClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    if (window.isSecureContext && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // The permission was refused or the document was not focused: try the other way.
  }
  return copyWithSelection(text);
}

/**
 * Writes a text that is not there yet. A browser accepts a write only for a few seconds after the click, so the write starts at
 * once and is handed the promise (`ClipboardItem`). Where that cannot be done (no `ClipboardItem`, one that takes no promise,
 * no secure context) or is refused, the text is awaited and written the usual way, which a slow promise can miss.
 * Call it inside the click, with nothing awaited before it. Resolves `false`, and writes nothing, when the promise rejects.
 */
export async function writePromisedClipboard(source: PromiseLike<string>): Promise<boolean> {
  const text = Promise.resolve(source);
  if (await writeItem(text)) return true;
  try {
    return await writeClipboard(await text);
  } catch {
    return false;
  }
}

async function writeItem(text: Promise<string>): Promise<boolean> {
  try {
    if (!window.isSecureContext || typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
    const data = text.then((value) => new Blob([value], { type: 'text/plain' }));
    // A write that is refused may never look at `data`: a rejected text must not go unhandled there.
    data.catch(() => {});
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': data })]);
    // Done only when the text did come.
    await text;
    return true;
  } catch {
    return false;
  }
}

function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.cssText = 'position:fixed;top:0;inset-inline-start:0;width:1px;height:1px;padding:0;border:0;opacity:0;pointer-events:none';
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const selection = document.getSelection();
  const ranges: Range[] = [];
  if (selection) for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i));
  document.body.appendChild(area);
  let copied = false;
  try {
    area.select();
    area.setSelectionRange(0, text.length);
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  } finally {
    area.remove();
    if (selection) {
      selection.removeAllRanges();
      for (const range of ranges) selection.addRange(range);
    }
    active?.focus({ preventScroll: true });
  }
  return copied;
}
