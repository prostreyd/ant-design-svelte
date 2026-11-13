// Select: the panel (where it is put, how wide and high, where it opens, what it holds). The placement math and the
// layers are tested with the popup primitive itself (Popup.test.ts, popupPlacement.test.ts, popupLayers.test.ts).
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Select from '../src/lib/Select/Select.svelte';
import SelectPanelHarness from './fixtures/SelectPanelHarness.svelte';
import { placed, panelRect } from './popupHelpers';
import { OPTIONS, activeOption, combobox, listbox, named, optionNamed, options, root } from './selectHelpers';

// jsdom has no layout: every rectangle is empty. The field gets a rectangle and the panel a size.
let fieldRect = { left: 100, top: 100, width: 150, height: 32 };
const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');

beforeEach(() => {
  fieldRect = { left: 100, top: 100, width: 150, height: 32 };
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const r = this.classList.contains('ads-select') ? fieldRect : this.classList.contains('ads-popup') ? panelRect(this as HTMLElement, { left: 0, top: 0 }) : { left: 0, top: 0, width: 0, height: 0 };
    return { ...r, right: r.left + r.width, bottom: r.top + r.height, x: r.left, y: r.top, toJSON: () => r } as DOMRect;
  });
  const isPanel = (element: HTMLElement) => element.classList.contains('ads-popup');
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return isPanel(this) ? 200 : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return isPanel(this) ? 100 : 0; } });
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 800 });
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalWidth) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalWidth);
  if (originalHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalHeight);
  delete (document.documentElement as unknown as Record<string, unknown>).clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>).clientHeight;
  document.body.innerHTML = '';
});

const panelOf = () => document.querySelector<HTMLElement>('.ads-popup')!;
const frameOf = () => document.querySelector<HTMLElement>('.ads-popup-frame')!;
const openField = async () => {
  const user = userEvent.setup();
  await user.click(combobox());
  await waitFor(() => expect(panelOf()).not.toBeNull());
  return user;
};
const field = { ...named, options: OPTIONS };

describe('Select panel: where it is put', () => {
  it('the panel is moved to document.body, in the dropdown layer, out of the place where the Select is written', async () => {
    const { container } = render(Select, { props: field });
    await openField();
    expect(panelOf().parentElement).toBe(document.body);
    expect(container.contains(panelOf())).toBe(false);
    expect(panelOf()).toHaveClass('ads-popup-dropdown');
  });

  it('container: an element, or a function that gets the field and returns one', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    const first = render(Select, { props: { ...field, container: target } });
    await openField();
    expect(panelOf().parentElement).toBe(target);
    first.unmount();
    const container = vi.fn(() => target);
    render(Select, { props: { ...field, container } });
    await openField();
    expect(container).toHaveBeenCalledWith(root());
    expect(panelOf().parentElement).toBe(target);
  });
});

describe('Select panel: the size', () => {
  it('popupMatchSelectWidth true (default): the panel is at least as wide as the field', async () => {
    render(Select, { props: field });
    await openField();
    expect(panelOf().style.minWidth).toBe('150px');
  });

  it('popupMatchSelectWidth as a number: that width, but never narrower than the field', async () => {
    const first = render(Select, { props: { ...field, popupMatchSelectWidth: 300 } });
    await openField();
    expect(panelOf().style.minWidth).toBe('300px');
    first.unmount();
    document.body.innerHTML = '';
    render(Select, { props: { ...field, popupMatchSelectWidth: 100 } });
    await openField();
    expect(panelOf().style.minWidth).toBe('150px');
  });

  it('popupMatchSelectWidth false: the panel is as wide as its content', async () => {
    render(Select, { props: { ...field, popupMatchSelectWidth: false } });
    await openField();
    expect(panelOf().style.minWidth).toBe('');
  });

  it('listHeight: the list is at most that high (256 by default) and scrolls beyond it', async () => {
    const first = render(Select, { props: field });
    await openField();
    expect(listbox()!.style.maxHeight).toBe('256px');
    first.unmount();
    document.body.innerHTML = '';
    render(Select, { props: { ...field, listHeight: 120 } });
    await openField();
    expect(listbox()!.style.maxHeight).toBe('120px');
  });
});

describe('Select panel: where it opens', () => {
  it('placement bottomLeft (default): under the field, left edges aligned, with the gap of a popup', async () => {
    render(Select, { props: field });
    await openField();
    expect(placed(panelOf()).left).toBe(100);
    expect(placed(panelOf()).top).toBe(136);
    expect(frameOf().dataset.placement).toBe('bottomLeft');
  });

  it('bottomRight: right edges aligned', async () => {
    render(Select, { props: { ...field, placement: 'bottomRight' } });
    await openField();
    expect(placed(panelOf()).left).toBe(50);
    expect(frameOf().dataset.placement).toBe('bottomRight');
  });

  it('topLeft and topRight: above the field', async () => {
    fieldRect = { left: 100, top: 400, width: 150, height: 32 };
    const first = render(Select, { props: { ...field, placement: 'topLeft' } });
    await openField();
    expect(placed(panelOf()).top).toBe(296);
    expect(frameOf().dataset.side).toBe('top');
    first.unmount();
    document.body.innerHTML = '';
    render(Select, { props: { ...field, placement: 'topRight' } });
    await openField();
    expect(placed(panelOf()).left).toBe(50);
  });

  it('it flips to the other side at the edge of the screen', async () => {
    fieldRect = { left: 100, top: 740, width: 150, height: 32 };
    render(Select, { props: field });
    await openField();
    expect(frameOf().dataset.side).toBe('top');
  });

  it('it follows the field when the page scrolls or the window resizes', async () => {
    render(Select, { props: field });
    await openField();
    fieldRect = { left: 100, top: 160, width: 150, height: 32 };
    await fireEvent.scroll(document);
    await waitFor(() => expect(placed(panelOf()).top).toBe(196));
  });
});

describe('Select panel: the highlighted option comes into view', () => {
  it('the selected option is scrolled into view when the list opens', async () => {
    const scrollTops = new WeakMap<Element, number>();
    const many = Array.from({ length: 20 }, (_, index) => ({ value: index, label: `Item ${index}` }));
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockImplementation(function (this: HTMLElement) {
      return scrollTops.get(this) ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(function (this: HTMLElement, value: number) {
      scrollTops.set(this, value);
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return this.getAttribute('role') === 'listbox' ? 96 : 0;
      }
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get() {
        const index = Number(this.id.split('-').pop());
        return this.getAttribute('role') === 'option' ? index * 32 : 0;
      }
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() {
        return this.classList.contains('ads-popup') ? 100 : this.getAttribute('role') === 'option' ? 32 : 0;
      }
    });
    render(Select, { props: { ...named, options: many, value: 8 } });
    await openField();
    await waitFor(() => expect(activeOption()).toHaveTextContent('Item 8'));
    // Item 8 spans 256 to 288; a list 96 high shows it with its bottom edge at 288.
    await waitFor(() => expect(scrollTops.get(listbox()!)).toBe(192));
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight;
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetTop;
  });

  it('with the first option highlighted the list is at the top, group labels included', async () => {
    const scrollTops = new WeakMap<Element, number>();
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'get').mockImplementation(function (this: HTMLElement) {
      return scrollTops.get(this) ?? 40;
    });
    vi.spyOn(HTMLElement.prototype, 'scrollTop', 'set').mockImplementation(function (this: HTMLElement, value: number) {
      scrollTops.set(this, value);
    });
    render(Select, { props: { ...named, options: [{ label: 'Group', options: ['a', 'b'] }] } });
    await openField();
    await waitFor(() => expect(scrollTops.get(listbox()!)).toBe(0));
  });
});

describe('Select panel: onpopupscroll', () => {
  it('is called with the scroll event of the list', async () => {
    const onpopupscroll = vi.fn();
    render(Select, { props: { ...field, onpopupscroll } });
    await openField();
    await fireEvent.scroll(listbox()!);
    expect(onpopupscroll).toHaveBeenCalledTimes(1);
    expect(onpopupscroll.mock.calls[0][0]).toBeInstanceOf(Event);
  });
});

describe('Select panel: popupRender', () => {
  it('wraps the list with custom content; the list is still the listbox of the field', async () => {
    render(SelectPanelHarness, { props: { ...field, extra: 'button' } });
    await openField();
    expect(screen.getByTestId('panel-extra').contains(listbox())).toBe(true);
    expect(screen.getByTestId('panel-button')).toBeInTheDocument();
    expect(combobox()).toHaveAttribute('aria-controls', listbox()!.id);
  });

  it('a press and a click on a button of the panel do not blur the field or close the list, and the click works', async () => {
    const user = await (async () => {
      render(SelectPanelHarness, { props: { ...field, extra: 'button' } });
      return openField();
    })();
    await user.click(screen.getByTestId('panel-button'));
    expect(screen.getByTestId('presses')).toHaveTextContent('1');
    expect(combobox()).toHaveFocus();
    expect(listbox()).not.toBeNull();
  });

  it('an input in the panel takes the focus and the typing, and the list stays open', async () => {
    render(SelectPanelHarness, { props: { ...field, extra: 'input' } });
    const user = await openField();
    await user.click(screen.getByLabelText('In panel'));
    await user.keyboard('hello');
    expect(screen.getByLabelText('In panel')).toHaveValue('hello');
    expect(listbox()).not.toBeNull();
    await tick();
  });

  it('a Select inside the panel keeps the outer list open while it is used; Escape closes the inner list first', async () => {
    const user = userEvent.setup();
    render(SelectPanelHarness, { props: { ...named, options: OPTIONS, extra: 'select' } });
    await user.click(screen.getAllByRole('combobox')[0]);
    await waitFor(() => expect(panelOf()).not.toBeNull());
    const inner = screen.getByRole('combobox', { name: 'Inner' });
    await user.click(inner);
    await waitFor(() => expect(screen.getAllByRole('listbox')).toHaveLength(2));
    await user.click(screen.getByRole('option', { name: 'x' }));
    await waitFor(() => expect(inner).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getAllByRole('combobox')[0]).toHaveAttribute('aria-expanded', 'true');
    await user.click(inner);
    await waitFor(() => expect(inner).toHaveAttribute('aria-expanded', 'true'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(inner).toHaveAttribute('aria-expanded', 'false'));
    expect(screen.getAllByRole('combobox')[0]).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getAllByRole('combobox')[0]).toHaveAttribute('aria-expanded', 'false'));
  });
});

describe('Select panel: the lifetime', () => {
  it('the panel is removed from the document with the Select', async () => {
    const { unmount } = render(Select, { props: field });
    await openField();
    unmount();
    expect(document.querySelector('.ads-popup')).toBeNull();
  });

  it('a list that is closed stays in the document but is hidden, and shows again', async () => {
    const user = await (async () => {
      render(Select, { props: field });
      return openField();
    })();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(panelOf()).toHaveAttribute('hidden'));
    await user.click(combobox());
    await waitFor(() => expect(panelOf()).not.toHaveAttribute('hidden'));
    expect(options()).toHaveLength(4);
    expect(optionNamed('Beta')).toBeInTheDocument();
  });
});

describe('Select panel: the list holds the wheel only while it scrolls', () => {
  // jsdom has no layout. The list is `rows` rows of 30px in a box of `box` px, the way a browser measures it.
  let box = 256;
  const rowsOf = (list: Element) => list.querySelectorAll('[role="option"]').length;
  beforeEach(() => {
    box = 256;
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
      return this.classList.contains('ads-select-list') ? box : 0;
    });
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
      return this.classList.contains('ads-select-list') ? rowsOf(this) * 30 : 0;
    });
  });

  it('a list that fits in its box lets the wheel through to the page', async () => {
    render(Select, { props: field });
    await openField();
    expect(listbox()).not.toHaveAttribute('data-scrollable');
  });

  it('a list taller than its box keeps the wheel to itself', async () => {
    render(Select, { props: { ...field, listHeight: 256, options: Array.from({ length: 12 }, (_, index) => ({ value: index, label: `Row ${index}` })) } });
    await openField();
    await waitFor(() => expect(listbox()).toHaveAttribute('data-scrollable'));
  });

  it('it measures again when the options change: a filter that leaves a few rows lets the wheel through', async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ value: index, label: `Row ${index}` }));
    const user = userEvent.setup();
    render(Select, { props: { ...named, showSearch: true, options: many } });
    await user.click(combobox());
    await waitFor(() => expect(listbox()).toHaveAttribute('data-scrollable'));
    await user.keyboard('Row 1');
    await waitFor(() => expect(options()).toHaveLength(3));
    await waitFor(() => expect(listbox()).not.toHaveAttribute('data-scrollable'));
  });

  it('it measures again in the next frame, when the layout has settled', async () => {
    render(Select, { props: field });
    await openField();
    expect(listbox()).not.toHaveAttribute('data-scrollable');
    box = 60;
    await waitFor(() => expect(listbox()).toHaveAttribute('data-scrollable'));
  });

  it('a list that is closed again has no scroll to hold', async () => {
    box = 60;
    const user = await (async () => {
      render(Select, { props: field });
      return openField();
    })();
    await waitFor(() => expect(listbox()).toHaveAttribute('data-scrollable'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(panelOf()).toHaveAttribute('hidden'));
  });
});


describe('Select panel: an option can be tapped in WebKit', () => {
  it('every option has a click listener of its own: WebKit sends the click of a tap only to such an element', async () => {
    const listeners: Array<{ node: unknown; type: string }> = [];
    const add = EventTarget.prototype.addEventListener;
    vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function (this: EventTarget, type: string, ...rest: unknown[]) {
      listeners.push({ node: this, type });
      return (add as (...args: unknown[]) => void).call(this, type, ...rest);
    });
    render(Select, { props: field });
    await openField();
    const own = (element: Element) => listeners.some((entry) => entry.node === element && entry.type === 'click');
    expect(options().length).toBeGreaterThan(0);
    for (const option of options()) expect(own(option)).toBe(true);
  });

  it('and a click on an option still chooses it, once', async () => {
    const onchange = vi.fn();
    render(Select, { props: { ...field, onchange } });
    const user = await openField();
    await user.click(optionNamed('Beta'));
    expect(onchange).toHaveBeenCalledTimes(1);
  });
});
