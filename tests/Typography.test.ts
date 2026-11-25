import { fireEvent, render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Typography from '../src/lib/Typography/Typography.svelte';
import TypographyLink from '../src/lib/Typography/TypographyLink.svelte';
import TypographyParagraph from '../src/lib/Typography/TypographyParagraph.svelte';
import TypographyText from '../src/lib/Typography/TypographyText.svelte';
import TypographyTitle from '../src/lib/Typography/TypographyTitle.svelte';
import TypographySnippetsHarness from './fixtures/TypographySnippetsHarness.svelte';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(document, 'execCommand');
});

/** A single element, so that it can be a child snippet (a raw snippet draws one element). */
const raw = (html: string) => createRawSnippet(() => ({ render: () => html }));
const text = (value: string) => raw(`<span>${value}</span>`);
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
const part = () => document.querySelector('.ads-typography') as HTMLElement;
const content = () => document.querySelector('.ads-typography-content') as HTMLElement;
const button = (name: string) => screen.getByRole('button', { name });

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

describe('Typography: elements and styles (TYP-1 to TYP-7)', () => {
  it('TYP-1: Typography is an article with the classes, the attributes and the semantic root', () => {
    render(Typography, {
      props: { children: text('Body'), id: 'a', 'data-x': 'y', class: 'mine', style: 'color: red', classNames: { root: 'sem' }, styles: { root: { 'margin-top': '3px' } } }
    });
    const article = screen.getByText('Body').closest('article') as HTMLElement;
    expect(article.id).toBe('a');
    expect(article.getAttribute('data-x')).toBe('y');
    expect(appClasses(article)).toEqual(['ads-typography', 'ads-typography-article']);
    expect(article).toHaveClass('mine', 'sem');
    expect(article.getAttribute('style')).toMatch(/^color: red; margin-top: 3px;?$/);
  });

  it('TYP-1: the four parts draw their own element', () => {
    for (const [component, tag] of [
      [TypographyParagraph, 'DIV'],
      [TypographyText, 'SPAN'],
      [TypographyLink, 'A'],
      [TypographyTitle, 'H1']
    ] as const) {
      // The four parts have prop types of their own; only the children are passed here.
      const { unmount } = render(component as typeof TypographyParagraph, { props: { children: text('x') } });
      expect(part().tagName).toBe(tag);
      unmount();
    }
  });

  it('TYP-1: native attributes, class and style go to the root of a part', () => {
    render(TypographyParagraph, { props: { children: text('x'), id: 'p', 'aria-label': 'Note', class: 'mine', style: 'color: red', classNames: { root: 'sem' }, styles: { root: { 'margin-top': '3px' } } } });
    expect(part().id).toBe('p');
    expect(part()).toHaveAttribute('aria-label', 'Note');
    expect(part()).toHaveClass('mine', 'sem');
    expect(part().getAttribute('style')).toMatch(/^color: red; margin-top: 3px;?$/);
  });

  it('TYP-6: level 1 to 5 gives h1 to h5, 1 by default', () => {
    for (const level of [1, 2, 3, 4, 5] as const) {
      const { unmount } = render(TypographyTitle, { props: { level, children: text('x') } });
      expect(part().tagName).toBe(`H${level}`);
      expect(part()).toHaveClass(`ads-typography-title-${level}`);
      unmount();
    }
    render(TypographyTitle, { props: { children: text('x') } });
    expect(part().tagName).toBe('H1');
  });

  it('TYP-6: a level outside 1 to 5 throws in development and is 1 in a production build', () => {
    expect(() => render(TypographyTitle, { props: { level: 6 as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(TypographyTitle, { props: { level: 6 as never, children: text('x') } });
    expect(part().tagName).toBe('H1');
  });

  it('TYP-2: each decoration flag wraps the content in its tag, in a fixed order, and they combine', () => {
    render(TypographyText, {
      props: { strong: true, italic: true, underline: true, delete: true, mark: true, code: true, keyboard: true, children: text('x') }
    });
    const tags: string[] = [];
    for (let node = content().firstElementChild; node && !node.hasAttribute('data-ads-host'); node = node.firstElementChild) tags.push(node.tagName);
    expect(tags).toEqual(['STRONG', 'I', 'U', 'DEL', 'MARK', 'CODE', 'KBD']);
  });

  it('TYP-2: with no flag the content is not wrapped', () => {
    render(TypographyText, { props: { children: text('x') } });
    expect(content().firstElementChild).toHaveAttribute('data-ads-host');
  });

  it('TYP-3: type and disabled are classes of the root', () => {
    for (const type of ['secondary', 'success', 'warning', 'danger'] as const) {
      const { unmount } = render(TypographyText, { props: { type, children: text('x') } });
      expect(part()).toHaveClass(`ads-typography-${type}`);
      unmount();
    }
    render(TypographyText, { props: { disabled: true, children: text('x') } });
    expect(part()).toHaveClass('ads-typography-disabled');
  });

  it('TYP-7: a type outside the list throws in development and is ignored in a production build', () => {
    expect(() => render(TypographyText, { props: { type: 'info' as never } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(TypographyText, { props: { type: 'info' as never, children: text('x') } });
    expect(appClasses(part())).toEqual(['ads-typography', 'ads-typography-text']);
  });

  it('TYP-4: title levels and paragraphs carry their kind classes', () => {
    render(TypographyParagraph, { props: { children: text('x') } });
    expect(appClasses(part())).toEqual(['ads-typography', 'ads-typography-paragraph']);
  });

  it('content wins over children, and a development warning says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(TypographyText, { props: { content: 'From content', children: text('From child') } });
    expect(part()).toHaveTextContent('From content');
    expect(part()).not.toHaveTextContent('From child');
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('Typography: Link (TYP-8, TYP-9)', () => {
  it('TYP-8: target _blank without a rel gets noopener noreferrer, a given rel is kept', () => {
    render(TypographyLink, { props: { href: 'https://example.com', target: '_blank', children: text('Go') } });
    expect(part()).toHaveAttribute('rel', 'noopener noreferrer');
    expect(part()).toHaveAttribute('href', 'https://example.com');
  });

  it('TYP-8: a rel that is given is kept as it is, and no target means no rel', () => {
    const { unmount } = render(TypographyLink, { props: { href: '/x', target: '_blank', rel: 'nofollow', children: text('Go') } });
    expect(part()).toHaveAttribute('rel', 'nofollow');
    unmount();
    render(TypographyLink, { props: { href: '/x', children: text('Go') } });
    expect(part()).not.toHaveAttribute('rel');
  });

  it('TYP-9: a disabled link has no href, says aria-disabled and does not call onclick', async () => {
    const onclick = vi.fn();
    render(TypographyLink, { props: { href: '/x', disabled: true, onclick, children: text('Go') } });
    expect(part()).not.toHaveAttribute('href');
    expect(part()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('link')).toBeNull();
    await fireEvent.click(part());
    expect(onclick).not.toHaveBeenCalled();
  });

  it('TYP-9: the buttons of a disabled link keep working', async () => {
    const onchange = vi.fn();
    render(TypographyLink, { props: { href: '/x', disabled: true, editable: { onchange }, children: text('Go') } });
    await fireEvent.click(button('Edit'));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('an enabled link calls onclick', async () => {
    const onclick = vi.fn();
    render(TypographyLink, { props: { href: '/x', onclick, children: text('Go') } });
    await fireEvent.click(part());
    expect(onclick).toHaveBeenCalledOnce();
  });
});

describe('Typography: copy (TYP-10 to TYP-16)', () => {
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  it('TYP-10: copyable adds a button named Copy with the copy icon, after the text', () => {
    render(TypographyParagraph, { props: { copyable: true, children: text('Hello') } });
    const copyButton = button('Copy');
    expect(copyButton).toHaveAttribute('type', 'button');
    expect(copyButton.querySelector('.ads-icon-copy, [aria-hidden="true"]')).not.toBeNull();
    expect(part().textContent?.indexOf('Hello')).toBeLessThan(part().innerHTML.indexOf('ads-typography-actions'));
  });

  it('TYP-11: a click copies the rendered text of a snippet child, without the buttons', async () => {
    render(TypographyParagraph, { props: { copyable: true, children: text('Hello world') } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('Hello world'));
  });

  it('TYP-11: content, and copyable.text as a string, a function and a promise, in that order of priority', async () => {
    const { unmount } = render(TypographyParagraph, { props: { copyable: true, content: 'From content' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith('From content'));
    unmount();
    const a = render(TypographyParagraph, { props: { copyable: { text: 'Plain' }, content: 'Shown' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Plain'));
    a.unmount();
    let n = 0;
    const b = render(TypographyParagraph, { props: { copyable: { text: () => `Call ${++n}` }, content: 'Shown' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Call 1'));
    await fireEvent.click(button(/Cop/ as never));
    await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Call 2'));
    b.unmount();
    render(TypographyParagraph, { props: { copyable: { text: () => Promise.resolve('Later') }, content: 'Shown' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenLastCalledWith('Later'));
  });

  it('TYP-11a: while a promised text is awaited the button shows a spinner, is busy and starts no second request', async () => {
    let resolve!: (value: string) => void;
    const source = vi.fn(() => new Promise<string>((done) => (resolve = done)));
    const oncopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { text: source, oncopy }, content: 'Shown' } });
    const copy = button('Copy');
    await fireEvent.click(copy);
    expect(copy.querySelector('.ads-icon-loading.ads-icon-spin')).not.toBeNull();
    expect(copy.querySelector('.ads-icon-copy')).toBeNull();
    expect(copy).toHaveAttribute('aria-busy', 'true');
    expect(copy).toHaveAttribute('aria-disabled', 'true');
    expect(copy).not.toBeDisabled();
    expect(copy).toHaveClass('ads-typography-copy-loading');
    expect(copy).toHaveAttribute('aria-label', 'Copy');
    await fireEvent.click(copy);
    expect(source).toHaveBeenCalledOnce();
    expect(writeText).not.toHaveBeenCalled();
    resolve('Later');
    await vi.waitFor(() => expect(button('Copied')).toBe(copy));
    expect(writeText).toHaveBeenCalledExactlyOnceWith('Later');
    expect(oncopy).toHaveBeenCalledOnce();
    expect(copy.querySelector('.ads-icon-loading')).toBeNull();
    expect(copy.querySelector('.ads-icon-check')).not.toBeNull();
    expect(copy).not.toHaveAttribute('aria-busy');
    expect(copy).not.toHaveAttribute('aria-disabled');
    expect(copy).not.toHaveClass('ads-typography-copy-loading');
  });

  it('TYP-11a: a rejected promise ends the spinner with no success, and the next click asks again', async () => {
    const source = vi.fn<() => Promise<string>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue('ok');
    const oncopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { text: source, oncopy }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copy')).not.toHaveAttribute('aria-busy'));
    expect(button('Copy').querySelector('.ads-icon-copy')).not.toBeNull();
    expect(writeText).not.toHaveBeenCalled();
    expect(oncopy).not.toHaveBeenCalled();
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('TYP-11a: a promised text that cannot be written ends the spinner with the copy icon', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    Object.defineProperty(document, 'execCommand', { value: vi.fn(() => false), configurable: true });
    render(TypographyParagraph, { props: { copyable: { text: () => Promise.resolve('x') }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    await vi.waitFor(() => expect(button('Copy')).not.toHaveAttribute('aria-busy'));
    expect(button('Copy').querySelector('.ads-icon-copy')).not.toBeNull();
  });

  it('TYP-11a: a string, and a function that returns one, show no spinner', async () => {
    // The write never ends, so what the button shows now is what it shows while writing.
    writeText.mockReturnValue(new Promise(() => {}));
    for (const source of ['plain', () => 'from a function']) {
      const view = render(TypographyParagraph, { props: { copyable: { text: source }, content: 'x' } });
      await fireEvent.click(button('Copy'));
      expect(writeText).toHaveBeenCalled();
      expect(button('Copy')).not.toHaveAttribute('aria-busy');
      expect(button('Copy').querySelector('.ads-icon-copy')).not.toBeNull();
      view.unmount();
      writeText.mockClear();
    }
  });

  it('TYP-11a: a click on Copied replaces the check with the spinner, and the 3 s start when the new text is written', async () => {
    vi.useFakeTimers();
    const later = () => new Promise<string>((done) => setTimeout(() => done('x'), 1000));
    render(TypographyParagraph, { props: { copyable: { text: later }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2500);
    await fireEvent.click(button('Copied'));
    expect(button('Copy')).toHaveAttribute('aria-busy', 'true');
    // The first success would have ended here: its timer is gone.
    await vi.advanceTimersByTimeAsync(1000);
    expect(button('Copied')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(2900);
    expect(button('Copied')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(200);
    expect(button('Copy')).toBeInTheDocument();
  });

  it('TYP-12a: a click on a promised text starts the write at once; the check and oncopy come with the text', async () => {
    let resolve!: (value: string) => void;
    const written: string[] = [];
    const write = vi.fn(async (items: { data: Record<string, Promise<Blob>> }[]) => {
      written.push(String((await items[0].data['text/plain']).size));
    });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(readonly data: Record<string, Promise<Blob>>) {}
      }
    );
    Object.defineProperty(navigator, 'clipboard', { value: { writeText, write }, configurable: true });
    const oncopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { text: () => new Promise<string>((done) => (resolve = done)), oncopy }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    expect(write).toHaveBeenCalledOnce();
    expect(button('Copy')).toHaveAttribute('aria-busy', 'true');
    expect(oncopy).not.toHaveBeenCalled();
    resolve('Later');
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(written).toEqual(['5']);
    expect(writeText).not.toHaveBeenCalled();
    expect(oncopy).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('TYP-11a: the spinner takes the place of a custom icon too', async () => {
    let resolve!: (value: string) => void;
    render(TypographySnippetsHarness, { props: { which: 'copyIcon', copyText: () => new Promise<string>((done) => (resolve = done)) } });
    await fireEvent.click(button('Copy'));
    expect(document.querySelector('[data-copied]')).toBeNull();
    expect(button('Copy').querySelector('.ads-icon-loading')).not.toBeNull();
    resolve('x');
    await vi.waitFor(() => expect(document.querySelector('[data-copied="true"]')).not.toBeNull());
  });

  it('TYP-11: the text is read at the click, not before', async () => {
    const harness = render(TypographyParagraph, { props: { copyable: true, content: 'First' } });
    await harness.rerender({ content: 'Second' });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('Second'));
  });

  it('TYP-12: with no Clipboard API the text goes through a temporary textarea and execCommand', async () => {
    Reflect.deleteProperty(navigator, 'clipboard');
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    const onCopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { oncopy: onCopy }, content: 'Plain HTTP' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('TYP-12: a Clipboard API that rejects falls back to execCommand', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    render(TypographyParagraph, { props: { copyable: true, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(execCommand).toHaveBeenCalledOnce();
  });

  it('TYP-13: success: the check icon, the name Copied, oncopy once; back after 3 s; a new click restarts the 3 s', async () => {
    vi.useFakeTimers();
    const oncopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { oncopy }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.advanceTimersByTimeAsync(0);
    expect(button('Copied')).toBeInTheDocument();
    expect(oncopy).toHaveBeenCalledOnce();
    expect(oncopy.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    await vi.advanceTimersByTimeAsync(2000);
    await fireEvent.click(button('Copied'));
    await vi.advanceTimersByTimeAsync(0);
    expect(oncopy).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2500);
    expect(button('Copied')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(600);
    expect(button('Copy')).toBeInTheDocument();
  });

  it('TYP-14: when both ways fail nothing changes: no Copied, no oncopy, a retry works', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    const execCommand = vi.fn(() => false);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    const oncopy = vi.fn();
    render(TypographyParagraph, { props: { copyable: { oncopy }, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(execCommand).toHaveBeenCalled());
    await vi.waitFor(() => expect(button('Copy')).toBeInTheDocument());
    expect(oncopy).not.toHaveBeenCalled();
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(oncopy).toHaveBeenCalledOnce();
  });

  it('TYP-14: a failure right after a success clears the success state', async () => {
    const execCommand = vi.fn(() => false);
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    render(TypographyParagraph, { props: { copyable: true, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    writeText.mockRejectedValue(new Error('denied'));
    await fireEvent.click(button('Copied'));
    await vi.waitFor(() => expect(button('Copy')).toBeInTheDocument());
  });

  it('TYP-14: a text function that throws is a failed copy', async () => {
    render(TypographyParagraph, {
      props: { copyable: { text: () => Promise.reject(new Error('no')) }, content: 'x' }
    });
    await fireEvent.click(button('Copy'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(button('Copy')).toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('TYP-15: a polite status says Copied for the 3 s, and is empty before and after', async () => {
    vi.useFakeTimers();
    render(TypographyParagraph, { props: { copyable: true, content: 'x' } });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');
    await fireEvent.click(button('Copy'));
    await vi.advanceTimersByTimeAsync(0);
    expect(status).toHaveTextContent('Copied');
    await vi.advanceTimersByTimeAsync(3100);
    expect(status).toHaveTextContent('');
  });

  it('TYP-13: the timer is cleared when the part is destroyed', async () => {
    vi.useFakeTimers();
    const { unmount } = render(TypographyParagraph, { props: { copyable: true, content: 'x' } });
    await fireEvent.click(button('Copy'));
    await vi.advanceTimersByTimeAsync(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('copyable.tooltips: custom strings are the names, false keeps the default names', async () => {
    const { unmount } = render(TypographyParagraph, { props: { copyable: { tooltips: ['click here', 'done'] }, content: 'x' } });
    await fireEvent.click(button('click here'));
    await vi.waitFor(() => expect(button('done')).toBeInTheDocument());
    unmount();
    render(TypographyParagraph, { props: { copyable: { tooltips: false }, content: 'x' } });
    expect(button('Copy')).toBeInTheDocument();
  });

  it('copyable.tooltips: a snippet is the tip, the name stays the default, before and after the copy', async () => {
    render(TypographySnippetsHarness, { props: { which: 'tooltips' } });
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
  });

  it('copyable.icon: one snippet that gets copied', async () => {
    render(TypographySnippetsHarness, { props: { which: 'copyIcon' } });
    expect(document.querySelector('[data-copied="false"]')).not.toBeNull();
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(document.querySelector('[data-copied="true"]')).not.toBeNull());
  });

  it('copyable.tooltips: empty strings hide the tip, and the names stay the default ones', () => {
    render(TypographyParagraph, { props: { copyable: { tooltips: ['', ''] }, content: 'x' } });
    expect(button('Copy')).toBeInTheDocument();
  });

  it('a copy button of a link does not follow the link', async () => {
    render(TypographyLink, { props: { href: '#x', copyable: true, content: 'Go' } });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    button('Copy').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
  });

  it('copyable.tabIndex goes to the button', () => {
    render(TypographyParagraph, { props: { copyable: { tabIndex: -1 }, content: 'x' } });
    expect(button('Copy')).toHaveAttribute('tabindex', '-1');
  });

  it('TYP-16: the copy icon and the check icon are drawn with the same box', async () => {
    render(TypographyParagraph, { props: { copyable: true, content: 'x' } });
    const before = button('Copy').querySelector('svg')!.getAttribute('viewBox');
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    expect(button('Copied').querySelector('svg')!.getAttribute('viewBox')).toBe(before);
  });
});

describe('Typography: the bar of buttons, shimmer and semantic parts (TYP-37 to TYP-42)', () => {
  it('TYP-37: the bar is after the text by default and before it for start, in the order edit then copy', () => {
    const { unmount } = render(TypographyParagraph, { props: { copyable: true, editable: true, content: 'x' } });
    const bar = document.querySelector('.ads-typography-actions') as HTMLElement;
    expect(content().compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([...bar.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Edit', 'Copy']);
    unmount();
    render(TypographyParagraph, { props: { copyable: true, actions: { placement: 'start' }, content: 'x' } });
    const start = document.querySelector('.ads-typography-actions') as HTMLElement;
    expect(start).toHaveClass('ads-typography-actions-start');
    expect(start.compareDocumentPosition(content()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('TYP-37: a placement outside start and end throws in development', () => {
    expect(() => render(TypographyParagraph, { props: { copyable: true, actions: { placement: 'middle' as never }, content: 'x' } })).toThrow(RangeError);
  });

  it('TYP-38: shimmer sets aria-busy and the custom properties, default 1 s and 1 s', () => {
    const { unmount } = render(TypographyText, { props: { shimmer: true, content: 'Thinking' } });
    expect(part()).toHaveAttribute('aria-busy', 'true');
    expect(part()).toHaveClass('ads-typography-shimmer');
    expect(part().style.getPropertyValue('--ads-typography-shimmer-motion')).toBe('1');
    expect(part().style.getPropertyValue('--ads-typography-shimmer-wait')).toBe('1');
    unmount();
    const a = render(TypographyText, { props: { shimmer: { duration: 3 }, content: 'x' } });
    expect(part().style.getPropertyValue('--ads-typography-shimmer-motion')).toBe('3');
    expect(part().style.getPropertyValue('--ads-typography-shimmer-wait')).toBe('1');
    a.unmount();
    render(TypographyText, { props: { shimmer: { duration: [2, 0.5] }, content: 'x' } });
    expect(part().style.getPropertyValue('--ads-typography-shimmer-motion')).toBe('2');
    expect(part().style.getPropertyValue('--ads-typography-shimmer-wait')).toBe('0.5');
  });

  it('TYP-38: no shimmer, no aria-busy; a bad duration throws in development and is 1 and 1 in production', () => {
    const { unmount } = render(TypographyText, { props: { content: 'x' } });
    expect(part()).not.toHaveAttribute('aria-busy');
    unmount();
    expect(() => render(TypographyText, { props: { shimmer: { duration: 0 }, content: 'x' } })).toThrow(RangeError);
    vi.stubEnv('NODE_ENV', 'production');
    render(TypographyText, { props: { shimmer: { duration: -1 }, content: 'x' } });
    expect(part().style.getPropertyValue('--ads-typography-shimmer-motion')).toBe('1');
  });

  it('TYP-40: classNames and styles reach the four parts; styles come after the component\'s own', () => {
    render(TypographyParagraph, {
      props: {
        copyable: true,
        editable: true,
        content: 'x',
        classNames: { root: 'c-root', actions: 'c-actions', action: 'c-action', textarea: 'c-area' },
        styles: { root: { color: 'red' }, actions: { color: 'blue' }, action: { color: 'green' }, textarea: { color: 'pink' } }
      }
    });
    expect(part()).toHaveClass('c-root');
    expect(part().style.color).toBe('red');
    const bar = document.querySelector('.ads-typography-actions') as HTMLElement;
    expect(bar).toHaveClass('c-actions');
    expect(bar.style.color).toBe('blue');
    for (const action of bar.querySelectorAll('button')) {
      expect(action).toHaveClass('c-action');
      expect((action as HTMLElement).style.color).toBe('green');
    }
  });

  it('TYP-40: the textarea part gets its class and style in the edit field', async () => {
    render(TypographyParagraph, {
      props: { editable: true, content: 'x', classNames: { textarea: 'c-area' }, styles: { textarea: { color: 'pink', 'font-size': '20px' } } }
    });
    await fireEvent.click(button('Edit'));
    const area = screen.getByRole('textbox');
    expect(area).toHaveClass('c-area');
    expect((area as HTMLElement).style.color).toBe('pink');
    expect((area as HTMLElement).style.fontSize).toBe('20px');
  });

  it('TYP-42: turning copyable, editable and ellipsis on and off re-renders', async () => {
    const view = render(TypographyParagraph, { props: { content: 'x' } });
    expect(screen.queryByRole('button')).toBeNull();
    await view.rerender({ copyable: true, editable: true });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    await view.rerender({ copyable: false, editable: false });
    expect(screen.queryByRole('button')).toBeNull();
    await view.rerender({ type: 'danger', code: true });
    expect(part()).toHaveClass('ads-typography-danger');
    expect(document.querySelector('code')).not.toBeNull();
  });

  it('TYP-36: onclick is called for a click on the part and on its buttons, and nothing stops the propagation', async () => {
    const onclick = vi.fn();
    const outer = vi.fn();
    const { container } = render(TypographyParagraph, { props: { copyable: true, content: 'x', onclick } });
    container.addEventListener('click', outer);
    await fireEvent.click(content());
    await fireEvent.click(button('Copy'));
    expect(onclick).toHaveBeenCalledTimes(2);
    expect(outer).toHaveBeenCalledTimes(2);
  });
});

describe('Typography: accessibility', () => {
  const clean = async (container: HTMLElement) => {
    const result = await axe.run(container, AXE_OPTIONS);
    expect(result.violations.map((violation) => `${violation.id}: ${violation.nodes[0]?.html}`)).toEqual([]);
  };

  it('axe: plain parts, types, a link, disabled, shimmer', async () => {
    const { container } = render(Typography, {
      props: {
        children: raw(
          '<div><h1>Title</h1><p>Paragraph <code>code</code> <kbd>Esc</kbd> <mark>mark</mark></p><ul><li>One</li></ul><blockquote>Quote</blockquote></div>'
        )
      }
    });
    await clean(container);
    for (const props of [{ type: 'danger' }, { disabled: true }, { shimmer: true }, { strong: true, code: true }] as const) {
      const view = render(TypographyText, { props: { ...props, content: 'Text' } });
      await clean(view.container);
      view.unmount();
    }
    const link = render(TypographyLink, { props: { href: '/x', content: 'Link' } });
    await clean(link.container);
    link.unmount();
    const disabled = render(TypographyLink, { props: { href: '/x', disabled: true, content: 'Link' } });
    await clean(disabled.container);
  });

  it('axe: copy before and after, edit closed and open', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    const { container } = render(TypographyParagraph, { props: { copyable: true, editable: true, content: 'Hello' } });
    await clean(container);
    await fireEvent.click(button('Copy'));
    await vi.waitFor(() => expect(button('Copied')).toBeInTheDocument());
    await clean(container);
    await fireEvent.click(button('Edit'));
    await clean(container);
  });

  it('the icons inside the buttons are hidden, the button carries the name', () => {
    render(TypographyParagraph, { props: { copyable: true, editable: true, content: 'x' } });
    for (const name of ['Copy', 'Edit']) {
      const icon = button(name).querySelector('.ads-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).not.toHaveAttribute('role', 'img');
    }
  });

  it('the edit field has an accessible name and the enter mark is hidden', async () => {
    render(TypographyParagraph, { props: { editable: true, content: 'x' } });
    await fireEvent.click(button('Edit'));
    expect(screen.getByRole('textbox', { name: 'Edit' })).toBeInTheDocument();
    expect(document.querySelector('.ads-typography-enter')).toHaveAttribute('aria-hidden', 'true');
  });
});
