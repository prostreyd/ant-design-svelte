// The Modal: rendering, the lifecycle, the title, the footer and customization (specs/modal.md, R1, R2, R5, R6, R7, R8, R11, R12).
// Dismissal, OK, focus, scroll and the rest are in tests/ModalBehavior.test.ts.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ModalHarness from './fixtures/ModalHarness.svelte';

type Props = Record<string, unknown>;

const real = window.getComputedStyle.bind(window);

/** Every element reports an animation, so a leave has to wait for `animationend`. */
function stubAnimation(name = 'ads-modal-zoom-out'): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
    const style = real(element, pseudo);
    return new Proxy(style, {
      get: (target, key) => {
        if (key === 'animationName') return name;
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  });
}

const text = (content: string) => createRawSnippet(() => ({ render: () => `<span>${content}</span>` }));

const root = () => document.querySelector<HTMLElement>('.ads-modal-root');
const dialog = () => document.querySelector<HTMLElement>('.ads-modal') as HTMLElement;
const footer = () => document.querySelector<HTMLElement>('.ads-modal-footer');
const buttons = () => Array.from(document.querySelectorAll<HTMLElement>('.ads-modal-footer button')).map((button) => button.textContent?.trim());
const mount = (props: Props = {}) => render(ModalHarness, props);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
});

describe('R1: rendering', () => {
  it('nothing is in the page until the first opening', () => {
    mount({ open: false });
    expect(root()).toBeNull();
  });

  it('opening puts the layer into the body, with the dialog role, aria-modal and the body', async () => {
    const { rerender } = mount({ open: false });
    await rerender({ open: true });
    expect(root()?.parentElement).toBe(document.body);
    const box = screen.getByRole('dialog');
    expect(box).toHaveAttribute('aria-modal', 'true');
    expect(box).toHaveAttribute('tabindex', '-1');
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('an open Modal at mount shows at once', () => {
    mount({ open: true });
    expect(root()).not.toBeNull();
    expect(root()).not.toHaveAttribute('hidden');
  });

  it('closing keeps the layer in the page, hidden, and opening again shows it', async () => {
    const { rerender } = mount({ open: true });
    await rerender({ open: false });
    expect(root()).toHaveAttribute('hidden');
    await rerender({ open: true });
    expect(root()).not.toHaveAttribute('hidden');
  });

  it('destroyOnHidden removes the layer after a close, and a new one is made on the next opening', async () => {
    const { rerender } = mount({ open: true, destroyOnHidden: true });
    await rerender({ open: false });
    expect(root()).toBeNull();
    await rerender({ open: true });
    expect(root()).not.toBeNull();
  });

  it('forceRender puts the layer in the page, hidden, before the first opening', async () => {
    mount({ open: false, forceRender: true });
    await tick();
    expect(root()).toHaveAttribute('hidden');
    expect(document.querySelector('[data-testid="body"]')).not.toBeNull();
  });

  it('the layer goes with the component', () => {
    const { unmount } = mount({ open: true });
    unmount();
    expect(root()).toBeNull();
  });

  it('the server renders nothing and does not touch the document (R12)', () => {
    const base = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(base, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/ModalHarness.svelte', props: { open: true, title: 'Hi' } }])],
      { cwd: base, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).not.toContain('ads-modal');
    expect(html).not.toContain('role="dialog"');
    expect(html).toContain('data-testid="opener"');
  });
});

describe('R1: the container', () => {
  it('an element, a function that returns one, a selector', async () => {
    const holder = document.createElement('section');
    holder.id = 'holder';
    document.body.append(holder);
    const first = mount({ open: true, container: holder });
    expect(root()?.parentElement).toBe(holder);
    first.unmount();

    const second = mount({ open: true, container: () => holder });
    expect(root()?.parentElement).toBe(holder);
    second.unmount();

    mount({ open: true, container: '#holder' });
    expect(root()?.parentElement).toBe(holder);
  });

  it('a selector that matches nothing falls back to the body', () => {
    mount({ open: true, container: '#nothing-here' });
    expect(root()?.parentElement).toBe(document.body);
  });

  it('a function that returns nothing falls back to the body', () => {
    mount({ open: true, container: (() => undefined) as never });
    expect(root()?.parentElement).toBe(document.body);
  });

  it('false leaves the layer where the component is written', () => {
    const { container } = mount({ open: true, container: false });
    expect(root()?.parentElement).not.toBe(document.body);
    expect(container.contains(root())).toBe(true);
  });
});

describe('R2: opening and closing', () => {
  it('the mask and the dialog carry data-state, open and then closed', async () => {
    const { rerender } = mount({ open: true });
    expect(dialog().dataset.state).toBe('open');
    expect(document.querySelector('.ads-modal-mask')).toHaveAttribute('data-state', 'open');
    await rerender({ open: false });
    expect(dialog().dataset.state).toBe('closed');
    expect(document.querySelector('.ads-modal-mask')).toHaveAttribute('data-state', 'closed');
  });

  it('waits for the leave animation of the dialog, then hides the layer, and says so once each way', async () => {
    stubAnimation();
    const onafteropenchange = vi.fn();
    const onafterclose = vi.fn();
    const { rerender } = mount({ open: true, onafteropenchange, onafterclose });
    // The enter animation has not ended: nothing was said yet.
    expect(onafteropenchange).not.toHaveBeenCalled();
    dialog().dispatchEvent(new Event('animationend'));
    expect(onafteropenchange).toHaveBeenCalledExactlyOnceWith(true);

    await rerender({ open: false });
    expect(root()).not.toHaveAttribute('hidden');
    expect(onafterclose).not.toHaveBeenCalled();
    // The end of an animation of something inside the dialog is not the end of the dialog's own.
    screen.getByTestId('body').dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(root()).not.toHaveAttribute('hidden');
    dialog().dispatchEvent(new Event('animationend'));
    await tick();
    expect(root()).toHaveAttribute('hidden');
    expect(onafteropenchange).toHaveBeenLastCalledWith(false);
    expect(onafterclose).toHaveBeenCalledTimes(1);
  });

  it('hides the layer after a second if the animation never ends', async () => {
    stubAnimation();
    const onafterclose = vi.fn();
    const { rerender } = mount({ open: true, onafterclose });
    await rerender({ open: false });
    vi.advanceTimersByTime(999);
    expect(onafterclose).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onafterclose).toHaveBeenCalledTimes(1);
    await tick();
    expect(root()).toHaveAttribute('hidden');
  });

  it('opening again during the leave cancels the hiding', async () => {
    stubAnimation();
    const onafterclose = vi.fn();
    const { rerender } = mount({ open: true, onafterclose });
    await rerender({ open: false });
    await rerender({ open: true });
    vi.advanceTimersByTime(5000);
    expect(root()).not.toHaveAttribute('hidden');
    expect(onafterclose).not.toHaveBeenCalled();
  });

  it('closing before the enter animation ended says nothing about the enter', async () => {
    stubAnimation();
    const onafteropenchange = vi.fn();
    const { rerender } = mount({ open: true, onafteropenchange });
    await rerender({ open: false });
    vi.advanceTimersByTime(5000);
    expect(onafteropenchange).not.toHaveBeenCalledWith(true);
  });

  it('without an animation (reduced motion) the layer is hidden at once, and the callbacks run', async () => {
    const onafteropenchange = vi.fn();
    const onafterclose = vi.fn();
    const { rerender } = mount({ open: true, onafteropenchange, onafterclose });
    expect(onafteropenchange).toHaveBeenCalledWith(true);
    await rerender({ open: false });
    expect(root()).toHaveAttribute('hidden');
    expect(onafterclose).toHaveBeenCalledTimes(1);
  });
});

describe('R6: the title and the close button', () => {
  it('a text title names the dialog', () => {
    mount({ title: 'Delete the file' });
    const box = screen.getByRole('dialog', { name: 'Delete the file' });
    expect(box).toHaveAttribute('aria-labelledby', document.querySelector('.ads-modal-title')?.id);
  });

  it('a number title is shown, and 0 is shown', () => {
    mount({ title: 0 });
    expect(document.querySelector('.ads-modal-title')?.textContent?.trim()).toBe('0');
  });

  it('a snippet title is shown', () => {
    mount({ titleAs: 'snippet' });
    expect(screen.getByTestId('title-snippet')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Rich title' })).toBeInTheDocument();
  });

  it('no title, null or an empty text: no header, and no aria-labelledby', () => {
    for (const title of [undefined, null, '']) {
      const { unmount } = mount({ title, 'aria-label': 'Named by the app' });
      expect(document.querySelector('.ads-modal-header')).toBeNull();
      expect(dialog()).not.toHaveAttribute('aria-labelledby');
      unmount();
    }
  });

  it('the close button has a name, a cross hidden from assistive technology, and goes with closable false', async () => {
    const { rerender } = mount({ title: 'T' });
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await rerender({ closable: false });
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('closable as an object: its own name, its own icon, disabled', () => {
    const closeIcon = createRawSnippet(() => ({ render: () => '<i data-testid="own-icon">x</i>' }));
    mount({ title: 'T', closable: { 'aria-label': 'Fermer', closeIcon, disabled: true } });
    const close = screen.getByRole('button', { name: 'Fermer' });
    expect(close).toBeDisabled();
    expect(screen.getByTestId('own-icon')).toBeInTheDocument();
  });

  it('closeIcon replaces the cross, and the one of closable wins over it', () => {
    const own = createRawSnippet(() => ({ render: () => '<i data-testid="top">t</i>' }));
    const inner = createRawSnippet(() => ({ render: () => '<i data-testid="inner">i</i>' }));
    mount({ title: 'T', closeIcon: own });
    expect(screen.getByTestId('top')).toBeInTheDocument();
    cleanup();
    mount({ title: 'T', closeIcon: own, closable: { closeIcon: inner } });
    expect(screen.queryByTestId('top')).toBeNull();
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });

  it('a Modal with no title and no name logs one warning while developing, and not when it is named', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount({ open: true });
    await tick();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('aria-label');
    cleanup();
    warn.mockClear();
    mount({ open: true, 'aria-label': 'Named' });
    mount({ open: true, 'aria-labelledby': 'somewhere' });
    mount({ open: true, title: 'T' });
    await tick();
    expect(warn).not.toHaveBeenCalled();
  });

  it('the warning is not made in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mount({ open: true });
    await tick();
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

describe('R5: the footer', () => {
  it('by default: Cancel, then OK', () => {
    mount({ title: 'T' });
    expect(buttons()).toEqual(['Cancel', 'OK']);
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass('ads-btn-primary');
  });

  it('null: no footer at all', () => {
    mount({ title: 'T', footer: null });
    expect(footer()).toBeNull();
  });

  it('a text or a number is the footer', () => {
    mount({ title: 'T', footer: 'All saved' });
    expect(footer()?.textContent?.trim()).toBe('All saved');
    cleanup();
    mount({ title: 'T', footer: 0 });
    expect(footer()?.textContent?.trim()).toBe('0');
  });

  it('the render form gets origin, and may wrap both buttons', () => {
    mount({ title: 'T', footerAs: 'origin' });
    expect(buttons()).toEqual(['Cancel', 'OK']);
    expect(screen.getByTestId('footer-custom')).toContainElement(screen.getByRole('button', { name: 'OK' }));
  });

  it('the render form gets ok and cancel to place one by one', () => {
    mount({ title: 'T', footerAs: 'parts' });
    expect(screen.getByTestId('ok-slot')).toContainElement(screen.getByRole('button', { name: 'OK' }));
    expect(screen.getByTestId('cancel-slot')).toContainElement(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('okText and cancelText: a text, a number, a snippet, and only undefined falls back (an empty text and 0 are shown)', () => {
    mount({ title: 'T', okText: 'Save', cancelText: text('Never mind') });
    expect(buttons()).toEqual(['Never mind', 'Save']);
    cleanup();
    mount({ title: 'T', okText: 0, cancelText: '' });
    expect(buttons()).toEqual(['', '0']);
  });

  it('okType sets the type of the OK button, and okButtonProps wins over it', () => {
    mount({ title: 'T', okType: 'dashed' });
    expect(screen.getByRole('button', { name: 'OK' })).toHaveClass('ads-btn-dashed');
    cleanup();
    mount({ title: 'T', okType: 'dashed', okButtonProps: { type: 'text', danger: true } });
    const ok = screen.getByRole('button', { name: 'OK' });
    expect(ok).toHaveClass('ads-btn-text');
    expect(ok).toHaveClass('ads-btn-danger');
  });

  it('cancelButtonProps reach the Cancel button', () => {
    mount({ title: 'T', cancelButtonProps: { disabled: true, class: 'mine' } });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(cancel).toBeDisabled();
    expect(cancel).toHaveClass('mine');
  });
});

describe('R7 and R8: the size and the layer', () => {
  it('the width is the token (520 px) by default, a number is px, a string is as written', () => {
    mount({ title: 'T' });
    expect(dialog().style.width).toBe('var(--ads-modal-width)');
    cleanup();
    mount({ title: 'T', width: 720 });
    expect(dialog().style.width).toBe('720px');
    cleanup();
    mount({ title: 'T', width: '40%' });
    expect(dialog().style.width).toBe('40%');
  });

  it('centered adds its class to the wrapper, and a Modal that is not centered has none', () => {
    mount({ title: 'T' });
    expect(document.querySelector('.ads-modal-wrapper')).not.toHaveClass('ads-modal-centered');
    cleanup();
    mount({ title: 'T', centered: true });
    expect(document.querySelector('.ads-modal-wrapper')).toHaveClass('ads-modal-centered');
  });

  it('zIndex is written on the layer, and with none the token decides', () => {
    mount({ title: 'T' });
    expect(root()?.style.zIndex).toBe('');
    cleanup();
    mount({ title: 'T', zIndex: 1234 });
    expect(root()?.style.zIndex).toBe('1234');
  });
});

describe('R11: customization', () => {
  it('class and style go on the dialog box, with the width kept', () => {
    mount({ title: 'T', class: 'mine', style: 'top: 20px' });
    expect(dialog()).toHaveClass('ads-modal', 'mine');
    expect(dialog().style.top).toBe('20px');
    expect(dialog().style.width).toBe('var(--ads-modal-width)');
  });

  it('wrapClassName goes on the wrapper', () => {
    mount({ title: 'T', wrapClassName: 'wrapped-by-me' });
    expect(document.querySelector('.ads-modal-wrapper')).toHaveClass('wrapped-by-me');
  });

  it('classNames and styles reach the named parts', () => {
    const parts = ['root', 'mask', 'wrapper', 'dialog', 'content', 'close', 'header', 'title', 'body', 'footer'] as const;
    const classNames = Object.fromEntries(parts.map((part) => [part, `c-${part}`]));
    const styles = Object.fromEntries(parts.map((part) => [part, { '--probe': part }]));
    mount({ title: 'T', classNames, styles });
    for (const part of parts) {
      const element = document.querySelector<HTMLElement>(`.c-${part}`);
      expect(element, part).not.toBeNull();
      expect(element?.style.getPropertyValue('--probe'), part).toBe(part);
    }
  });

  it('modalRender wraps the card, and the card is still inside it', () => {
    mount({ title: 'T', wrap: true });
    expect(screen.getByTestId('wrapped')).toContainElement(document.querySelector('.ads-modal-content') as HTMLElement);
    expect(dialog()).toContainElement(screen.getByTestId('wrapped'));
  });

  it('the rest of the attributes go on the dialog box and may replace the role', () => {
    mount({ title: 'T', id: 'my-dialog', 'data-extra': 'yes', role: 'alertdialog' });
    expect(dialog()).toHaveAttribute('id', 'my-dialog');
    expect(dialog()).toHaveAttribute('data-extra', 'yes');
    expect(dialog()).toHaveAttribute('role', 'alertdialog');
  });
});

describe('the pointer of a click (P9)', () => {
  it('the zoom starts at a click that came a moment before the opening, and at the center otherwise', async () => {
    const { rerender } = mount({ open: false });
    // A click with a place, in the same task as the opening.
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40, clientY: 50, detail: 1 }));
    await rerender({ open: true });
    expect(dialog().style.transformOrigin).toMatch(/px/);
    await rerender({ open: false });
    // A click from the keyboard has no place.
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 0, clientY: 0, detail: 0 }));
    await rerender({ open: true });
    expect(dialog().style.transformOrigin).toBe('');
  });

  it('a click in the task that opens the Modal is its press however long the opening takes (a busy machine)', async () => {
    const { rerender } = mount({ open: false });
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40, clientY: 50, detail: 1 }));
    // No timer has run: the opening is still in the task of the click, but the clock says a second has gone by.
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 1000);
    await rerender({ open: true });
    expect(dialog().style.transformOrigin).toMatch(/px/);
  });

  it('after the task of the click a press counts for 300 ms', async () => {
    const { rerender } = mount({ open: false });
    const now = performance.now();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40, clientY: 50, detail: 1 }));
    vi.advanceTimersByTime(50);
    vi.spyOn(performance, 'now').mockReturnValue(now + 200);
    await rerender({ open: true });
    expect(dialog().style.transformOrigin).toMatch(/px/);
  });

  it('a click that is older than a moment is forgotten', async () => {
    const { rerender } = mount({ open: false });
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 40, clientY: 50, detail: 1 }));
    vi.advanceTimersByTime(1000);
    vi.spyOn(performance, 'now').mockReturnValue(performance.now() + 1000);
    await rerender({ open: true });
    expect(dialog().style.transformOrigin).toBe('');
  });

  it('the listener goes with the last Modal', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const first = mount({ open: false });
    const second = mount({ open: false });
    // Svelte removes its own delegated `click` listener too: the one of the Modal is the one in the capture phase.
    const mine = () => remove.mock.calls.filter(([type, , options]) => type === 'click' && options === true);
    first.unmount();
    expect(mine()).toHaveLength(0);
    second.unmount();
    expect(mine()).toHaveLength(1);
  });
});

