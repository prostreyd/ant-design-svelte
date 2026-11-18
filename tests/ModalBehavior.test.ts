// The Modal: dismissal and its veto, OK, focus and keyboard, the scroll and the page behind, and the edge cases
// (specs/modal.md, R2, R3, R4, R9, R10, R14).
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openOverlays } from '../src/lib/internal/overlay/stack';
import ModalHarness from './fixtures/ModalHarness.svelte';

type Props = Record<string, unknown>;

const mount = (props: Props = {}) => render(ModalHarness, { title: 'Title', ...props });
const dialog = () => document.querySelector<HTMLElement>('.ads-modal') as HTMLElement;
const wrapper = () => document.querySelector<HTMLElement>('.ads-modal-wrapper') as HTMLElement;
const openState = () => screen.getByTestId('open-state').textContent;
const ok = () => screen.getByRole('button', { name: 'OK' });
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' });
const closeButton = () => screen.getByRole('button', { name: 'Close' });
const escape = (target: Element = document.body) => fireEvent.keyDown(target, { key: 'Escape', cancelable: true });
const press = async (target: Element) => {
  await fireEvent.pointerDown(target);
  await fireEvent.click(target);
};

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

describe('R3: the four ways to dismiss', () => {
  it('the close button: oncancel gets the mouse event, and the Modal closes (bind:open writes false)', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await fireEvent.click(closeButton());
    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(oncancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(openState()).toBe('false');
    expect(dialog().dataset.state).toBe('closed');
  });

  it('the Cancel button does the same', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await fireEvent.click(cancelButton());
    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(openState()).toBe('false');
  });

  it('Escape: oncancel gets the keyboard event, and the Modal closes', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await escape();
    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(oncancel.mock.calls[0][0]).toBeInstanceOf(KeyboardEvent);
    expect(openState()).toBe('false');
  });

  it('the mask: a press on the area around the dialog closes it', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await press(wrapper());
    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(openState()).toBe('false');
  });

  it('a press inside the dialog does not close it', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await press(screen.getByTestId('body'));
    await press(dialog());
    expect(oncancel).not.toHaveBeenCalled();
    expect(openState()).toBe('true');
  });

  it('a press that started inside the dialog and ended on the mask does not close it (selecting text)', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await fireEvent.pointerDown(screen.getByTestId('body'));
    await fireEvent.click(wrapper());
    expect(oncancel).not.toHaveBeenCalled();
    expect(openState()).toBe('true');
    // The next press on the mask alone closes it: the first one did not leave its mark.
    await press(wrapper());
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('a click on the mask with no press before it (a click made by a script) does not close it', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    await fireEvent.click(wrapper());
    expect(oncancel).not.toHaveBeenCalled();
  });
});

describe('R3: the veto, and the options', () => {
  const ways: [string, () => Promise<unknown>][] = [
    ['the close button', () => fireEvent.click(closeButton())],
    ['the Cancel button', () => fireEvent.click(cancelButton())],
    ['Escape', () => escape()],
    ['the mask', () => press(wrapper())]
  ];

  it.each(ways)('%s: oncancel that calls preventDefault keeps the Modal open', async (_name, act) => {
    const oncancel = vi.fn((event: Event) => event.preventDefault());
    mount({ oncancel });
    await act();
    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(openState()).toBe('true');
    expect(dialog().dataset.state).toBe('open');
  });

  it('Escape that was refused is still cancelled, so it does not do anything else', async () => {
    mount({ oncancel: (event: Event) => event.preventDefault() });
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('keyboard false: Escape does nothing, and is not cancelled', async () => {
    const oncancel = vi.fn();
    mount({ oncancel, keyboard: false });
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(oncancel).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
    expect(openState()).toBe('true');
  });

  it('mask.closable false: the mask does not close it, the other ways do', async () => {
    const oncancel = vi.fn();
    mount({ oncancel, mask: { closable: false } });
    await press(wrapper());
    expect(oncancel).not.toHaveBeenCalled();
    await escape();
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('mask false draws no mask, and the layer still covers the page and closes on a press (observed in React)', async () => {
    const oncancel = vi.fn();
    mount({ oncancel, mask: false });
    expect(document.querySelector('.ads-modal-mask')).toBeNull();
    expect(wrapper()).toBeInTheDocument();
    await press(wrapper());
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('mask {enabled: false} draws no mask; {enabled: true} and {} draw one', () => {
    mount({ mask: { enabled: false } });
    expect(document.querySelector('.ads-modal-mask')).toBeNull();
    cleanup();
    for (const mask of [{ enabled: true }, {}, true]) {
      mount({ mask });
      expect(document.querySelector('.ads-modal-mask')).not.toBeNull();
      cleanup();
    }
  });

  it('a frozen mask object is only read, never changed, and works again the next time', async () => {
    const mask = Object.freeze({ closable: false });
    const oncancel = vi.fn();
    mount({ oncancel, mask });
    await press(wrapper());
    expect(oncancel).not.toHaveBeenCalled();
    expect(mask).toEqual({ closable: false });
    cleanup();
    mount({ oncancel, mask });
    await press(wrapper());
    expect(oncancel).not.toHaveBeenCalled();
  });

  it('closable.disabled: the button does nothing', async () => {
    const oncancel = vi.fn();
    mount({ oncancel, closable: { disabled: true } });
    await fireEvent.click(closeButton());
    expect(oncancel).not.toHaveBeenCalled();
    expect(openState()).toBe('true');
    // The other ways are not stopped.
    await escape();
    expect(oncancel).toHaveBeenCalledTimes(1);
  });

  it('a Modal with no oncancel still closes on every way', async () => {
    mount();
    await escape();
    expect(openState()).toBe('false');
  });
});

describe('R4: OK', () => {
  it('onok gets the mouse event, and by default the Modal does not close', async () => {
    const onok = vi.fn();
    mount({ onok });
    await fireEvent.click(ok());
    expect(onok).toHaveBeenCalledTimes(1);
    expect(onok.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(openState()).toBe('true');
  });

  it('the handler of okButtonProps runs first, then onok; the same for Cancel and oncancel', async () => {
    const order: string[] = [];
    mount({
      okButtonProps: { onclick: () => order.push('button ok') },
      onok: () => order.push('onok'),
      cancelButtonProps: { onclick: () => order.push('button cancel') },
      oncancel: () => order.push('oncancel')
    });
    await fireEvent.click(ok());
    await fireEvent.click(cancelButton());
    expect(order).toEqual(['button ok', 'onok', 'button cancel', 'oncancel']);
  });

  it('with no onok the OK button does nothing, and with closeOnOk it closes', async () => {
    mount();
    await fireEvent.click(ok());
    expect(openState()).toBe('true');
    cleanup();
    mount({ closeOnOk: true });
    await fireEvent.click(ok());
    expect(openState()).toBe('false');
  });

  it('closeOnOk: it closes after a plain onok', async () => {
    const onok = vi.fn();
    mount({ onok, closeOnOk: true });
    await fireEvent.click(ok());
    expect(onok).toHaveBeenCalledTimes(1);
    expect(openState()).toBe('false');
  });

  it('closeOnOk: preventDefault in onok keeps it open', async () => {
    mount({ onok: (event: Event) => event.preventDefault(), closeOnOk: true });
    await fireEvent.click(ok());
    expect(openState()).toBe('true');
  });

  it('closeOnOk with a Promise: the OK button waits, a second press is ignored, a resolve closes', async () => {
    let resolve!: () => void;
    const onok = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    mount({ onok, closeOnOk: true });
    await fireEvent.click(ok());
    expect(ok()).toHaveAttribute('aria-busy', 'true');
    await fireEvent.click(ok());
    expect(onok).toHaveBeenCalledTimes(1);
    expect(openState()).toBe('true');
    resolve();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(openState()).toBe('false');
  });

  it('closeOnOk with a Promise: a reject keeps it open, and the button is free again', async () => {
    let reject!: () => void;
    const onok = vi.fn(() => new Promise<void>((_done, fail) => (reject = fail)));
    mount({ onok, closeOnOk: true });
    await fireEvent.click(ok());
    expect(ok()).toHaveAttribute('aria-busy', 'true');
    reject();
    await vi.advanceTimersByTimeAsync(0);
    await tick();
    expect(openState()).toBe('true');
    expect(ok()).not.toHaveAttribute('aria-busy', 'true');
    // It can be pressed again.
    await fireEvent.click(ok());
    expect(onok).toHaveBeenCalledTimes(2);
  });

  it('closeOnOk with a Promise: a resolve after the component is gone does nothing', async () => {
    let resolve!: () => void;
    const { unmount } = mount({ onok: () => new Promise<void>((done) => (resolve = done)), closeOnOk: true });
    await fireEvent.click(ok());
    unmount();
    expect(() => resolve()).not.toThrow();
    await vi.advanceTimersByTimeAsync(0);
  });

  it('without closeOnOk a Promise is not waited for, and the OK button is not busy', async () => {
    mount({ onok: () => new Promise<void>(() => {}) });
    await fireEvent.click(ok());
    expect(ok()).not.toHaveAttribute('aria-busy', 'true');
    expect(openState()).toBe('true');
  });

  it('confirmLoading puts the OK button into its loading state, and okButtonProps.loading does too', async () => {
    const { rerender } = mount({ confirmLoading: true });
    expect(ok()).toHaveAttribute('aria-busy', 'true');
    await rerender({ confirmLoading: false });
    expect(ok()).not.toHaveAttribute('aria-busy', 'true');
    await rerender({ okButtonProps: { loading: true } });
    expect(ok()).toHaveAttribute('aria-busy', 'true');
  });

  it('a loading OK button does not call onok', async () => {
    const onok = vi.fn();
    mount({ onok, confirmLoading: true });
    await fireEvent.click(ok());
    expect(onok).not.toHaveBeenCalled();
  });
});

describe('R9: focus and keyboard', () => {
  it('focus goes to the first element Tab reaches, the close button, when the Modal opens', () => {
    mount();
    expect(document.activeElement).toBe(closeButton());
  });

  it('with no close button it goes to the first element of the body, then of the footer, and with nothing to reach, to the dialog', () => {
    mount({ closable: false });
    expect(document.activeElement).toBe(screen.getByTestId('field'));
    cleanup();
    mount({ closable: false, bare: true });
    expect(document.activeElement).toBe(cancelButton());
    cleanup();
    mount({ closable: false, footer: null, bare: true });
    expect(document.activeElement).toBe(dialog());
  });

  it('autoFocusButton: ok, cancel, or null for the dialog itself', () => {
    mount({ focusable: { autoFocusButton: 'ok' } });
    expect(document.activeElement).toBe(ok());
    cleanup();
    mount({ focusable: { autoFocusButton: 'cancel' } });
    expect(document.activeElement).toBe(cancelButton());
    cleanup();
    mount({ focusable: { autoFocusButton: null } });
    expect(document.activeElement).toBe(dialog());
  });

  it('autoFocusButton ok with no OK button (a footer of text) falls back to the first element Tab reaches', () => {
    mount({ footer: 'text', focusable: { autoFocusButton: 'ok' } });
    expect(document.activeElement).toBe(closeButton());
  });

  it('Tab on the last element goes to the first, Shift+Tab on the first goes to the last', async () => {
    mount();
    ok().focus();
    await fireEvent.keyDown(ok(), { key: 'Tab', cancelable: true });
    expect(document.activeElement).toBe(closeButton());
    await fireEvent.keyDown(closeButton(), { key: 'Tab', shiftKey: true, cancelable: true });
    expect(document.activeElement).toBe(ok());
  });

  it('focusable.trap false: Tab is left to the browser', async () => {
    mount({ focusable: { trap: false } });
    ok().focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    ok().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(ok());
  });

  it('focus goes back to the button that opened it, and not when focusTriggerAfterClose is false', async () => {
    const first = mount({ open: false });
    const opener = screen.getByTestId('opener');
    opener.focus();
    await fireEvent.click(opener);
    expect(document.activeElement).toBe(closeButton());
    await escape();
    expect(document.activeElement).toBe(opener);
    first.unmount();
    cleanup();

    mount({ open: false, focusable: { focusTriggerAfterClose: false } });
    const other = screen.getByTestId('opener');
    other.focus();
    await fireEvent.click(other);
    await escape();
    expect(document.activeElement).not.toBe(other);
  });

  it('Escape with focus in a field inside the Modal closes it', async () => {
    const oncancel = vi.fn();
    mount({ oncancel });
    screen.getByTestId('field').focus();
    await escape(screen.getByTestId('field'));
    expect(oncancel).toHaveBeenCalledTimes(1);
  });
});

describe('R10: the scroll and the page behind', () => {
  it('the page does not scroll while it is open, and scrolls again when it closes', async () => {
    const { rerender } = mount();
    expect(document.body.style.overflow).toBe('hidden');
    await rerender({ open: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('scrollLock false leaves the page alone', () => {
    mount({ scrollLock: false });
    expect(document.body.style.overflow).toBe('');
  });

  it('the page behind is out of reach, the layer is not, and the page is given back on close', async () => {
    const { rerender } = mount();
    const page = screen.getByTestId('page');
    expect(page.closest('[inert]')).not.toBeNull();
    expect(dialog().closest('[inert]')).toBeNull();
    expect(document.querySelector('.ads-modal-mask')?.closest('[inert]')).toBeNull();
    await rerender({ open: false });
    expect(page.closest('[inert]')).toBeNull();
  });

  it('the dialog is modal for assistive technology', () => {
    mount();
    expect(dialog()).toHaveAttribute('aria-modal', 'true');
  });
});

describe('R14: edge cases', () => {
  it('a Modal destroyed while it is open lets the page go and leaves nothing in the page', () => {
    const { unmount } = mount();
    expect(openOverlays()).toHaveLength(1);
    unmount();
    expect(document.querySelector('.ads-modal-root')).toBeNull();
    expect(openOverlays()).toHaveLength(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('opening, closing and opening again quickly leaves one lock and a layer that works', async () => {
    const { rerender } = mount({ open: false });
    for (let index = 0; index < 5; index++) {
      await rerender({ open: true });
      await rerender({ open: false });
    }
    await rerender({ open: true });
    expect(openOverlays()).toHaveLength(1);
    expect(document.body.style.overflow).toBe('hidden');
    await escape();
    expect(openOverlays()).toHaveLength(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('two Modals: Escape closes the top one only, and the page is let go when the last one closes', async () => {
    mount({ 'aria-label': 'first' });
    mount({ 'aria-label': 'second' });
    expect(openOverlays()).toHaveLength(2);
    const [first, second] = Array.from(document.querySelectorAll<HTMLElement>('.ads-modal'));
    await escape();
    expect(second.dataset.state).toBe('closed');
    expect(first.dataset.state).toBe('open');
    expect(document.body.style.overflow).toBe('hidden');
    await escape();
    expect(first.dataset.state).toBe('closed');
    expect(document.body.style.overflow).toBe('');
  });

  it('two Modals closed the other way round: the page stays held until the last one closes', async () => {
    const lower = mount({ 'aria-label': 'first' });
    const upper = mount({ 'aria-label': 'second' });
    lower.unmount();
    expect(document.body.style.overflow).toBe('hidden');
    upper.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('a parent that closes it in the flush that opened it (before the layer is in the page) leaves nothing open', async () => {
    const onafterclose = vi.fn();
    mount({ open: false, closeRightAway: true, onafterclose });
    await fireEvent.click(screen.getByTestId('opener'));
    await tick();
    expect(openState()).toBe('false');
    expect(document.querySelector('.ads-modal-root')).toHaveAttribute('hidden');
    expect(document.body.style.overflow).toBe('');
    expect(openOverlays()).toHaveLength(0);
  });

  it('an empty body and a long title do not break it', () => {
    mount({ title: 'A very long title '.repeat(20), children: undefined });
    expect(document.querySelector('.ads-modal-title')?.textContent).toContain('A very long title');
  });
});
