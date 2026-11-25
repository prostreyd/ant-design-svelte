// The clipboard helpers of Typography (specs/typography.md, TYP-12, TYP-12a and TYP-14): the ways of writing text, also one that comes
// later, and what they leave behind.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeClipboard, writePromisedClipboard } from '../src/lib/Typography/copy.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(document, 'execCommand');
});

const execCommand = (result: boolean | Error) => {
  const mock = vi.fn(() => {
    if (result instanceof Error) throw result;
    return result;
  });
  Object.defineProperty(document, 'execCommand', { value: mock, configurable: true });
  return mock;
};

describe('writeClipboard', () => {
  it('TYP-14: without a window there is nothing to write to', async () => {
    vi.stubGlobal('window', undefined);
    await expect(writeClipboard('x')).resolves.toBe(false);
  });

  it('TYP-12: the temporary textarea is removed and the focus and the selection come back', async () => {
    const command = execCommand(true);
    const field = document.createElement('input');
    const paragraph = document.createElement('p');
    paragraph.textContent = 'selected';
    document.body.append(field, paragraph);
    field.focus();
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    document.getSelection()!.removeAllRanges();
    document.getSelection()!.addRange(range);
    await expect(writeClipboard('Text to copy')).resolves.toBe(true);
    expect(command).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(document.activeElement).toBe(field);
    expect(document.getSelection()!.rangeCount).toBe(1);
    expect(document.getSelection()!.toString()).toBe('selected');
    field.remove();
    paragraph.remove();
  });

  it('TYP-14: a command that returns false or throws is a failure', async () => {
    execCommand(false);
    await expect(writeClipboard('x')).resolves.toBe(false);
    execCommand(new Error('no'));
    await expect(writeClipboard('x')).resolves.toBe(false);
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('TYP-12: it works with no focused element and no selection object', async () => {
    execCommand(true);
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
    vi.spyOn(document, 'getSelection').mockReturnValue(null);
    await expect(writeClipboard('x')).resolves.toBe(true);
  });
});

/** A promise that the test keeps or breaks by hand. */
function later() {
  let resolve!: (value: string) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<string>((yes, no) => ([resolve, reject] = [yes, no]));
  return { promise, resolve, reject };
}
/** Lets every pending promise callback run. */
const settle = () => new Promise((done) => setTimeout(done, 0));

class Item {
  constructor(readonly data: Record<string, Promise<Blob>>) {}
}

/** A secure page with a clipboard; `write` reads the data of the item, as a browser does, unless the test gives its own. */
function clipboard(write?: (items: Item[]) => Promise<void>) {
  const written: Blob[] = [];
  const fake = {
    write: vi.fn(write ?? (async (items: Item[]) => void written.push(await items[0].data['text/plain']))),
    writeText: vi.fn().mockResolvedValue(undefined)
  };
  vi.stubGlobal('ClipboardItem', Item);
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'clipboard', { value: fake, configurable: true });
  return { ...fake, written };
}

describe('writePromisedClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals(); // a stubbed `window` must be back before it is touched
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(window, 'isSecureContext');
  });

  it('TYP-12a: the write starts at once, with the promise of a plain-text blob, and is done when the text came', async () => {
    const fake = clipboard();
    const text = later();
    const done = vi.fn();
    void writePromisedClipboard(text.promise).then(done);
    // Nothing was awaited: the browser still counts the click.
    expect(fake.write).toHaveBeenCalledOnce();
    await settle();
    expect(done).not.toHaveBeenCalled();
    text.resolve('Late');
    await settle();
    expect(done).toHaveBeenCalledExactlyOnceWith(true);
    expect(fake.written).toHaveLength(1);
    expect(fake.written[0].type).toBe('text/plain');
    expect(fake.written[0].size).toBe(4);
    expect(fake.writeText).not.toHaveBeenCalled();
  });

  it('TYP-12a: a write that resolves before the text waits for it', async () => {
    clipboard(() => Promise.resolve());
    const text = later();
    const done = vi.fn();
    void writePromisedClipboard(text.promise).then(done);
    await settle();
    expect(done).not.toHaveBeenCalled();
    text.resolve('Late');
    await settle();
    expect(done).toHaveBeenCalledExactlyOnceWith(true);
  });

  it.each([
    ['there is no ClipboardItem', () => vi.stubGlobal('ClipboardItem', undefined)],
    ['there is no write', () => Reflect.deleteProperty(navigator.clipboard, 'write')],
    [
      'the ClipboardItem takes no promise',
      () =>
        vi.stubGlobal(
          'ClipboardItem',
          class {
            constructor() {
              throw new TypeError("Failed to convert value to 'Blob'");
            }
          }
        )
    ],
    ['the write is refused', () => void vi.mocked(navigator.clipboard.write).mockRejectedValue(new Error('NotAllowedError'))]
  ])('TYP-12a: when %s, the text is awaited and written the usual way', async (_, break_) => {
    clipboard();
    const writeText = vi.mocked(navigator.clipboard.writeText);
    break_();
    const text = later();
    const done = writePromisedClipboard(text.promise);
    await settle();
    expect(writeText).not.toHaveBeenCalled();
    text.resolve('Late');
    await expect(done).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledExactlyOnceWith('Late');
  });

  it('TYP-12a: a page that is not secure does not use write, and goes through execCommand', async () => {
    const fake = clipboard();
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    const command = execCommand(true);
    await expect(writePromisedClipboard(Promise.resolve('x'))).resolves.toBe(true);
    expect(fake.write).not.toHaveBeenCalled();
    expect(command).toHaveBeenCalledWith('copy');
  });

  it.each([
    ['a write that reads it', () => {}],
    ['no ClipboardItem', () => vi.stubGlobal('ClipboardItem', undefined)],
    ['a write that is refused without reading it', () => void vi.mocked(navigator.clipboard.write).mockRejectedValue(new Error('no'))],
    ['a write that resolves all the same', () => void vi.mocked(navigator.clipboard.write).mockResolvedValue(undefined)]
  ])('TYP-12a: a rejected text with %s writes nothing and resolves false', async (_, arrange) => {
    // Vitest fails the run on a rejection that nobody handled, so this also checks that there is none.
    const fake = clipboard();
    arrange();
    const command = execCommand(true);
    const text = later();
    const done = writePromisedClipboard(text.promise);
    await settle();
    text.reject(new Error('offline'));
    await expect(done).resolves.toBe(false);
    await settle();
    expect(fake.written).toHaveLength(0);
    expect(fake.writeText).not.toHaveBeenCalled();
    expect(command).not.toHaveBeenCalled();
  });

  it('TYP-12a: without a window there is nothing to write to', async () => {
    vi.stubGlobal('window', undefined);
    await expect(writePromisedClipboard(Promise.resolve('x'))).resolves.toBe(false);
  });
});
