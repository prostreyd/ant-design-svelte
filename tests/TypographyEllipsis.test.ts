import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TypographyParagraph from '../src/lib/Typography/TypographyParagraph.svelte';
import TypographyText from '../src/lib/Typography/TypographyText.svelte';
import TypographyHarness from './fixtures/TypographyHarness.svelte';
import TypographySnippetsHarness from './fixtures/TypographySnippetsHarness.svelte';

// jsdom has no layout, so the browser is replaced by a model of one: a row holds `capacity` characters, a row is 21 px high (the
// fallback line height of the component), and the ruler of the script cut is as high as the rows its visible text needs.
const LINE = 21;
let capacity = 40;
let width = 300;

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  constructor(private callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    FakeResizeObserver.instances = FakeResizeObserver.instances.filter((observer) => observer !== this);
  }
  trigger(): void {
    this.callback();
  }
}
const resize = () => FakeResizeObserver.instances.forEach((observer) => observer.trigger());
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** The text a browser would lay out: hidden elements are left out, and white space between the parts is not a character. */
function visibleText(node: Node): string {
  if (node instanceof HTMLElement && node.hidden) return '';
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trim() === '' ? '' : (node.textContent ?? '');
  return [...node.childNodes].map(visibleText).join('');
}

const raw = (html: string) => createRawSnippet(() => ({ render: () => html }));
const text = (value: string) => raw(`<span>${value}</span>`);
const button = (name: string) => screen.getByRole('button', { name });
const expandButton = () => document.querySelector('[data-ads-expand]') as HTMLElement;
const part = () => document.querySelector('.ads-typography') as HTMLElement;
const content = () => document.querySelector('.ads-typography-content') as HTMLElement;
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
/** The visible, cut text and the text the dots follow. */
const shown = () => document.querySelector('.ads-typography-host > span[aria-hidden="true"]')?.textContent ?? null;
const full = () => document.querySelector('.ads-typography-sr')?.textContent ?? null;
const words = (count: number) => Array.from({ length: count }, (_, i) => `w${i}`).join(' ');

beforeEach(() => {
  capacity = 40;
  width = 300;
  FakeResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const ruler = this instanceof HTMLElement && this.getAttribute('aria-hidden') === 'true' && this.style.position === 'absolute';
    const rows = ruler ? Math.max(1, Math.ceil(visibleText(this).length / capacity)) : 0;
    return { x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: rows * LINE, toJSON: () => ({}) } as DOMRect;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Typography: the mode of the ellipsis (TYP-27, TYP-28)', () => {
  it('TYP-27: one row, with no suffix and no expand button, is CSS only: the text stays whole in the DOM', () => {
    render(TypographyParagraph, { props: { ellipsis: true, content: words(80) } });
    expect(appClasses(part())).toEqual(['ads-typography', 'ads-typography-paragraph', 'ads-typography-ellipsis', 'ads-typography-single']);
    expect(content()).toHaveTextContent(words(80));
    expect(document.querySelector('.ads-typography-sr')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('TYP-27: several rows with no buttons is CSS only, with the rows in a custom property', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 3 }, content: words(80) } });
    expect(part()).toHaveClass('ads-typography-clamp');
    expect(part().style.getPropertyValue('--ads-typography-rows')).toBe('3');
    expect(content()).toHaveTextContent(words(80));
  });

  it('TYP-27: one row with buttons is still CSS only, and the buttons stay', () => {
    render(TypographyParagraph, { props: { ellipsis: true, copyable: true, editable: true, content: words(80) } });
    expect(part()).toHaveClass('ads-typography-single');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('TYP-27: a suffix, an expand button, or several rows with buttons need the script cut', () => {
    for (const props of [
      { ellipsis: { suffix: '--Ant' } },
      { ellipsis: { rows: 2, expandable: true } },
      { ellipsis: { rows: 2 }, copyable: true },
      { ellipsis: { rows: 2 }, editable: true }
    ]) {
      const { unmount } = render(TypographyParagraph, { props: { ...props, content: words(80) } });
      expect(part()).toHaveClass('ads-typography-cut');
      expect(part()).not.toHaveClass('ads-typography-single', 'ads-typography-clamp');
      unmount();
    }
  });

  it('TYP-27: a Text is one inline row: rows and expandable are ignored', () => {
    render(TypographyText, { props: { ellipsis: { rows: 3, expandable: true } as never, content: words(80) } });
    expect(part()).toHaveClass('ads-typography-single');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('TYP-28: the Text and the paragraph with an ellipsis share the classes that make the layout', () => {
    render(TypographyText, { props: { ellipsis: true, content: 'x' } });
    expect(part()).toHaveClass('ads-typography-text', 'ads-typography-single');
  });

  it('rows: an integer from 1; anything else throws in development and is 1 in a production build', () => {
    for (const rows of [0, 1.5, -2, Number.NaN]) {
      expect(() => render(TypographyParagraph, { props: { ellipsis: { rows }, content: 'x' } })).toThrow(RangeError);
    }
    vi.stubEnv('NODE_ENV', 'production');
    render(TypographyParagraph, { props: { ellipsis: { rows: 0 }, content: 'x' } });
    expect(part().style.getPropertyValue('--ads-typography-rows')).toBe('1');
  });

  it('no ellipsis means no ellipsis classes and no measuring', () => {
    render(TypographyParagraph, { props: { content: words(80) } });
    expect(appClasses(part())).toEqual(['ads-typography', 'ads-typography-paragraph']);
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });
});

describe('Typography: the script cut (TYP-30)', () => {
  it('TYP-30: a text that fits is not cut: it is shown whole, with no expand button', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'short text' } });
    expect(shown()).toBeNull();
    expect(content()).toHaveTextContent('short text');
    expect(expandButton()).toHaveAttribute('hidden');
  });

  it('TYP-30: a long text is cut so that the dots and the button fit in the rows; the whole text stays for assistive technology', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    // 80 characters fit in two rows; the dots (3) and `Expand` (6) take 9 of them.
    expect(shown()).toBe('a'.repeat(71));
    expect(content().querySelector('.ads-typography-host')?.textContent).toContain('...');
    expect(full()).toBe('a'.repeat(100));
    expect(content().querySelectorAll('[aria-hidden="true"]')).toHaveLength(2);
    expect(button('Expand')).toBeVisible();
  });

  it('TYP-30: the text of a snippet child is cut too, read from the child', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, children: text('b'.repeat(100)) } });
    expect(shown()).toBe('b'.repeat(71));
    expect(full()).toBe('b'.repeat(100));
  });

  it('TYP-30: the buttons of the bar take room from the text', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2 }, copyable: true, content: 'a'.repeat(100) } });
    // The copy button has no text of its own in the model, so only the dots (3) are taken.
    expect(shown()?.length).toBe(77);
    expect(button('Copy')).toBeInTheDocument();
  });

  it('TYP-30: the cut falls on a code point, never inside a surrogate pair', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: '😀'.repeat(60) } });
    const prefix = shown() as string;
    expect(prefix.length).toBeGreaterThan(0);
    expect(prefix).toMatch(/^(?:😀)+$/u);
    expect([...prefix].length * 2).toBe(prefix.length);
  });

  it('TYP-30: an empty text is shown as it is', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: '' } });
    expect(shown()).toBeNull();
  });

  it('TYP-30: a width change cuts again (ResizeObserver, then one frame)', async () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    expect(shown()).toBe('a'.repeat(71));
    capacity = 30;
    width = 200;
    resize();
    await frame();
    await vi.waitFor(() => expect(shown()).toBe('a'.repeat(51)));
    capacity = 100;
    width = 600;
    resize();
    await vi.waitFor(() => expect(shown()).toBeNull());
    expect(content()).toHaveTextContent('a'.repeat(100));
  });

  it('TYP-30: a change of less than a pixel does not measure again', async () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    capacity = 30;
    width = 300.4;
    resize();
    await frame();
    expect(shown()).toBe('a'.repeat(71));
  });

  it('TYP-30: the text, the rows, the suffix and the symbol cut again', async () => {
    const view = render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    await view.rerender({ content: 'c'.repeat(130) });
    expect(shown()).toBe('c'.repeat(71));
    await view.rerender({ ellipsis: { rows: 3, expandable: true } });
    expect(shown()).toBe('c'.repeat(111));
    await view.rerender({ ellipsis: { rows: 3, expandable: true, suffix: '--Ant' } });
    expect(shown()).toBe('c'.repeat(106));
    await view.rerender({ ellipsis: { rows: 3, expandable: true, suffix: '--Ant', symbol: 'more' } });
    expect(shown()).toBe('c'.repeat(108));
  });

  it('TYP-30: the text of a child is read at the mount, from the hidden copy of the child', () => {
    render(TypographyHarness, { props: { text: 'a'.repeat(100), props: { ellipsis: { rows: 2, expandable: true } } } });
    expect(shown()).toBe('a'.repeat(71));
    expect(full()).toBe('a'.repeat(100));
  });

  it('TYP-30: the line height of the part sets the room of a row, else 1.5 times its font size', () => {
    const a = render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100), style: 'line-height: 21px' } });
    expect(shown()).toBe('a'.repeat(71));
    a.unmount();
    // A line of 42 px allows two of the model's 21 px rows in each of the two rows.
    const b = render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100), style: 'line-height: 42px' } });
    expect(shown()).toBeNull();
    b.unmount();
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100), style: 'font-size: 28px' } });
    expect(shown()).toBeNull();
  });

  it('TYP-30: an inline part takes its room from its parent, with and without the padding of the parent', () => {
    for (const padding of ['0px', '8px 12px']) {
      const host = document.createElement('div');
      host.style.padding = padding;
      document.body.appendChild(host);
      const view = render(TypographyText, { target: host, props: { ellipsis: { suffix: '--Ant' }, content: 'a'.repeat(100) } });
      expect(shown()).toBe('a'.repeat(32));
      view.unmount();
      host.remove();
    }
    width = 0;
    render(TypographyText, { props: { ellipsis: { suffix: '--Ant' }, content: 'a'.repeat(100) } });
    expect(shown()).toBe('a'.repeat(32));
  });

  it('TYP-30: a measurement scheduled before the field opened does nothing', async () => {
    render(TypographyParagraph, { props: { editable: true, ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    capacity = 30;
    width = 200;
    resize();
    await fireEvent.click(button('Edit'));
    await frame();
    expect(screen.getByRole('textbox')).toHaveValue('a'.repeat(100));
  });

  it('TYP-30: turning the ellipsis on and off', async () => {
    const view = render(TypographyParagraph, { props: { content: 'a'.repeat(100) } });
    expect(shown()).toBeNull();
    await view.rerender({ ellipsis: { rows: 2, expandable: true } });
    expect(shown()).toBe('a'.repeat(71));
    await view.rerender({ ellipsis: false });
    expect(shown()).toBeNull();
    expect(content()).toHaveTextContent('a'.repeat(100));
  });
});

describe('Typography: expand, suffix and the state (TYP-31 to TYP-33)', () => {
  it('TYP-31: the button is a real button named Expand, aria-expanded false, in the bar', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true }, content: 'a'.repeat(100) } });
    const expand = button('Expand');
    expect(expand).toHaveAttribute('type', 'button');
    expect(expand).toHaveAttribute('aria-expanded', 'false');
    expect(expand.closest('.ads-typography-actions')).not.toBeNull();
  });

  it('TYP-31: a click shows the whole text, calls onexpand(event, { expanded: true }), and expandable true leaves no button', async () => {
    const onexpand = vi.fn();
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true, onexpand }, content: 'a'.repeat(100) } });
    await fireEvent.click(button('Expand'));
    expect(content()).toHaveTextContent('a'.repeat(100));
    expect(shown()).toBeNull();
    expect(onexpand).toHaveBeenCalledOnce();
    expect(onexpand.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(onexpand.mock.calls[0][1]).toEqual({ expanded: true });
    expect(screen.queryByRole('button', { name: 'Collapse' })).toBeNull();
    expect(part()).toHaveClass('ads-typography-expanded');
  });

  it('TYP-31: collapsible: a Collapse button with aria-expanded true follows, and a click returns to the cut', async () => {
    const onexpand = vi.fn();
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: 'collapsible', onexpand }, content: 'a'.repeat(100) } });
    await fireEvent.click(button('Expand'));
    const collapse = button('Collapse');
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await fireEvent.click(collapse);
    expect(shown()).toBe('a'.repeat(71));
    expect(button('Expand')).toHaveAttribute('aria-expanded', 'false');
    expect(onexpand.mock.calls.map((call) => call[1])).toEqual([{ expanded: true }, { expanded: false }]);
  });

  it('TYP-31: symbol as a string is the expand text, the collapse text stays Collapse', async () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: 'collapsible', symbol: 'more' }, content: 'a'.repeat(100) } });
    await fireEvent.click(button('more'));
    expect(button('Collapse')).toBeInTheDocument();
  });

  it('TYP-31: symbol as a snippet gets expanded and is the content of the button', async () => {
    render(TypographySnippetsHarness, { props: { which: 'symbol' } });
    const more = document.querySelector('[data-symbol="false"]') as HTMLElement;
    expect(more).toHaveTextContent('more');
    await fireEvent.click(more);
    expect(document.querySelector('[data-symbol="true"]')).toHaveTextContent('less');
  });

  it('TYP-32: bind:expanded: the parent expands and collapses without a callback, and a click is reported back', async () => {
    const onexpand = vi.fn();
    render(TypographyHarness, { props: { asContent: true, text: 'a'.repeat(100), props: { ellipsis: { rows: 2, expandable: 'collapsible', onexpand } } } });
    expect(shown()).toBe('a'.repeat(71));
    await fireEvent.click(screen.getByTestId('toggle-expanded'));
    expect(shown()).toBeNull();
    expect(onexpand).not.toHaveBeenCalled();
    await fireEvent.click(button('Collapse'));
    expect(screen.getByTestId('expanded')).toHaveTextContent('false');
    expect(shown()).toBe('a'.repeat(71));
    expect(onexpand).toHaveBeenCalledOnce();
  });

  it('TYP-32: expanded true from the start shows the whole text', () => {
    render(TypographyHarness, { props: { asContent: true, text: 'a'.repeat(100), props: { expanded: true, ellipsis: { rows: 2, expandable: 'collapsible' } } } });
    expect(shown()).toBeNull();
    expect(content()).toHaveTextContent('a'.repeat(100));
    expect(button('Collapse')).toBeInTheDocument();
  });

  it('TYP-33: the suffix follows the cut text and the dots', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, suffix: '--Ant' }, content: 'a'.repeat(100) } });
    const suffix = document.querySelector('.ads-typography-suffix') as HTMLElement;
    expect(suffix).toHaveTextContent('--Ant');
    expect(content().compareDocumentPosition(suffix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(shown()).toBe('a'.repeat(72));
  });

  it('TYP-33: the suffix is shown also when the text fits, and then there is no cut and no button', () => {
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, suffix: '--Ant', expandable: true }, content: 'short' } });
    expect(document.querySelector('.ads-typography-suffix')).toHaveTextContent('--Ant');
    expect(shown()).toBeNull();
    expect(expandButton()).toHaveAttribute('hidden');
  });
});

describe('Typography: the tip and onellipsis (TYP-34, TYP-35)', () => {
  /** Makes the text box report that it clips its content. */
  function clip(clipped: boolean): void {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => (clipped ? 500 : 100));
  }
  const hover = (element: Element) => fireEvent.mouseEnter(element.closest('.ads-tooltip-trigger') ?? element);
  const tip = () => screen.queryByRole('tooltip');

  it('TYP-34: hovering a clipped text shows the whole text in a tip', async () => {
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: true }, content: words(80) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent(words(80)));
  });

  it('TYP-34: a text that is not clipped gets no tip', async () => {
    clip(false);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: true }, content: 'short' } });
    await hover(content());
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(tip()).toBeNull();
  });

  it('TYP-34: the tip is measured at the hover: a text that starts to be clipped gets one', async () => {
    clip(false);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: true }, content: words(80) } });
    await new Promise((resolve) => setTimeout(resolve, 50));
    clip(true);
    await hover(content());
    await vi.waitFor(() => expect(tip()).not.toBeNull());
  });

  it('TYP-34: the tip of a script cut shows with the cut, and not when the text is expanded', async () => {
    const a = render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true, tooltip: 'Full' }, content: 'a'.repeat(100) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent('Full'));
    a.unmount();
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true, tooltip: 'Full' }, content: 'a'.repeat(100), expanded: true } });
    await hover(content());
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(tip()).toBeNull();
  });

  it('TYP-34: tooltip as a string, as props of the Tooltip, and as a snippet', async () => {
    clip(true);
    const a = render(TypographyParagraph, { props: { ellipsis: { tooltip: 'Own text' }, content: words(80) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent('Own text'));
    a.unmount();
    const b = render(TypographyParagraph, { props: { ellipsis: { tooltip: { title: 'Props title', placement: 'bottom' } }, content: words(80) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent('Props title'));
    b.unmount();
    render(TypographyParagraph, { props: { ellipsis: { tooltip: text('From snippet') }, content: words(80) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent('From snippet'));
  });

  it('TYP-34: hovering a button of the bar does not open the tip of the text', async () => {
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: true }, copyable: true, content: words(80) } });
    await fireEvent.mouseEnter(button('Copy').closest('.ads-tooltip-trigger') as HTMLElement);
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(tip()).toHaveTextContent('Copy');
    expect(tip()).not.toHaveTextContent(words(80));
  });

  it('TYP-34: tooltip props with no title show the whole text, and leaving the text closes the tip', async () => {
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: { placement: 'bottom', mouseLeaveDelay: 0 } }, content: words(80) } });
    await hover(content());
    await vi.waitFor(() => expect(tip()).toHaveTextContent(words(80)));
    await fireEvent.mouseLeave(content().closest('.ads-tooltip-trigger') as HTMLElement);
    await vi.waitFor(() => expect(tip()).toBeNull());
  });

  it('TYP-34: no tooltip option, no tip', async () => {
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: true, content: words(80) } });
    await fireEvent.mouseEnter(content());
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(tip()).toBeNull();
  });

  it.each([
    ['exactly as wide and as high as its box', { scrollWidth: 300, scrollHeight: 44, clientHeight: 44 }, false],
    ['a rounding wider and higher', { scrollWidth: 300.5, scrollHeight: 45, clientHeight: 44 }, false],
    ['wider than its box', { scrollWidth: 301, scrollHeight: 44, clientHeight: 44 }, true],
    ['higher than its box', { scrollWidth: 300, scrollHeight: 66, clientHeight: 44 }, true]
  ])('TYP-29: a text %s is cut: %#', (_, sizes, cut) => {
    // The box is 300 wide (the model of this file); the other sizes are given by the case.
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => sizes.scrollWidth);
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => sizes.scrollHeight);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => sizes.clientHeight);
    const onellipsis = vi.fn();
    render(TypographyParagraph, { props: { ellipsis: { rows: 2, onellipsis }, content: 'text' } });
    expect(onellipsis.mock.calls).toEqual([[cut]]);
  });

  it('TYP-29: several resizes before a frame read the layout once', async () => {
    const read = vi.fn(() => 100);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(read);
    render(TypographyParagraph, { props: { ellipsis: { onellipsis: vi.fn() }, content: 'short' } });
    await frame();
    read.mockClear();
    resize();
    resize();
    resize();
    expect(read).not.toHaveBeenCalled();
    await frame();
    expect(read).toHaveBeenCalledOnce();
  });

  it('TYP-29: with a tip and no onellipsis nothing is read until somebody asks', async () => {
    const read = vi.fn(() => 500);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(read);
    render(TypographyParagraph, { props: { ellipsis: { tooltip: true }, content: words(80) } });
    await frame();
    expect(read).not.toHaveBeenCalled();
    await hover(content());
    // The tip opens after its delay; the box is read then.
    await vi.waitFor(() => expect(read).toHaveBeenCalled());
  });

  it('TYP-35: onellipsis(true) after the first measurement, once, and again only when the state changes (CSS only)', async () => {
    const onellipsis = vi.fn();
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: { onellipsis }, content: words(80) } });
    expect(onellipsis.mock.calls).toEqual([[true]]);
    resize();
    await frame();
    expect(onellipsis).toHaveBeenCalledOnce();
    clip(false);
    resize();
    await vi.waitFor(() => expect(onellipsis.mock.calls).toEqual([[true], [false]]));
  });

  it('TYP-35: a part that fits reports false once', () => {
    const onellipsis = vi.fn();
    clip(false);
    render(TypographyParagraph, { props: { ellipsis: { onellipsis }, content: 'short' } });
    expect(onellipsis.mock.calls).toEqual([[false]]);
  });

  it('TYP-35: the script cut reports its state too', async () => {
    const onellipsis = vi.fn();
    const view = render(TypographyParagraph, { props: { ellipsis: { rows: 2, expandable: true, onellipsis }, content: 'a'.repeat(100) } });
    expect(onellipsis.mock.calls).toEqual([[true]]);
    await view.rerender({ content: 'short' });
    expect(onellipsis.mock.calls).toEqual([[true], [false]]);
  });

  it('TYP-35: a measurement scheduled before the field opened does nothing in the CSS mode either', async () => {
    const onellipsis = vi.fn();
    clip(true);
    render(TypographyParagraph, { props: { editable: true, ellipsis: { onellipsis }, content: words(80) } });
    clip(false);
    resize();
    await fireEvent.click(button('Edit'));
    await frame();
    expect(onellipsis.mock.calls).toEqual([[true]]);
  });

  it('TYP-35: where the browser has no ResizeObserver the state is measured once', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const onellipsis = vi.fn();
    clip(true);
    render(TypographyParagraph, { props: { ellipsis: { onellipsis }, content: words(80) } });
    expect(onellipsis.mock.calls).toEqual([[true]]);
  });

  it('TYP-35: without onellipsis and a tip nothing is measured in the CSS mode', () => {
    render(TypographyParagraph, { props: { ellipsis: true, content: words(80) } });
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });
});
