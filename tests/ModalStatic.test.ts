// The static family (specs/modal.md, R15, D2, D5, D6, D7): `modal.confirm`, `info`, `success`, `warning`, `error`, the handle, and the layer.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { removeLayer } from '../src/lib/Modal/layer';
import { modal } from '../src/lib/Modal/modal';
import { getSnapshot, resetModals } from '../src/lib/Modal/store';
import ModalContextHarness from './fixtures/ModalContextHarness.svelte';

const real = window.getComputedStyle.bind(window);

/** Every element reports an animation, so a leave has to wait for `animationend`. */
function stubAnimation(): void {
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element, pseudo?: string | null) => {
    const style = real(element, pseudo);
    return new Proxy(style, {
      get: (target, key) => {
        if (key === 'animationName') return 'ads-modal-zoom-out';
        const value = Reflect.get(target, key);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  });
}

const settle = async () => {
  await tick();
  await Promise.resolve();
  await tick();
};
const alertDialog = () => screen.getByRole('alertdialog');
const boxes = () => Array.from(document.querySelectorAll<HTMLElement>('.ads-modal'));
const ok = () => screen.getByRole('button', { name: 'OK' });
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' });
const escape = () => fireEvent.keyDown(document.body, { key: 'Escape', cancelable: true });
const footerButtons = () => Array.from(document.querySelectorAll('.ads-modal-footer button')).map((b) => b.textContent?.trim());

/** Follows what a handle resolves to. */
function outcome(handle: PromiseLike<boolean>): { value: boolean | undefined } {
  const seen: { value: boolean | undefined } = { value: undefined };
  void handle.then((value) => (seen.value = value));
  return seen;
}

beforeEach(() => {
  resetModals();
  // A leave animation that has to be waited for, so that a closed dialog can still be looked at. The tests of "no animation" say so.
  stubAnimation();
});

afterEach(() => {
  cleanup();
  removeLayer();
  resetModals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
  document.documentElement.removeAttribute('style');
});

describe('R15: the five calls', () => {
  it('confirm: the warning icon, the title and the text, Cancel and OK, the role of an alert dialog', async () => {
    modal.confirm({ title: 'Delete the file?', content: 'This cannot be undone.' });
    await settle();
    const box = alertDialog();
    expect(box).toHaveAttribute('aria-modal', 'true');
    expect(box).toHaveAccessibleName('Delete the file?');
    expect(box).toHaveAccessibleDescription('This cannot be undone.');
    expect(box.querySelector('.ads-modal-confirm-icon-warning .ads-icon-warning')).not.toBeNull();
    expect(footerButtons()).toEqual(['Cancel', 'OK']);
    expect(box.querySelector('.ads-modal-header')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it.each([
    ['info', 'info'],
    ['success', 'success'],
    ['warning', 'warning'],
    ['error', 'error']
  ] as const)('%s: its icon, and OK only', async (kind, icon) => {
    modal[kind]({ title: 'Title', content: 'Text' });
    await settle();
    expect(alertDialog().querySelector(`.ads-modal-confirm-icon-${icon} .ads-icon-${icon}`)).not.toBeNull();
    expect(footerButtons()).toEqual(['OK']);
  });

  it('okCancel adds Cancel to an info dialog, and takes it away from a confirm', async () => {
    modal.info({ title: 'T', okCancel: true });
    await settle();
    expect(footerButtons()).toEqual(['Cancel', 'OK']);
    cleanup();
    removeLayer();
    resetModals();
    modal.confirm({ title: 'T', okCancel: false });
    await settle();
    expect(footerButtons()).toEqual(['OK']);
  });

  it('a call makes the layer in the body, and the dialog is drawn', async () => {
    modal.info({ title: 'T' });
    await settle();
    expect(document.querySelector('.ads-modal-root')?.parentElement).toBe(document.body);
    expect(getSnapshot().records).toHaveLength(1);
  });

  it('the title, the text and the icon can be a number, a snippet, a string or nothing', async () => {
    const snippet = createRawSnippet(() => ({ render: () => '<b data-testid="own">own</b>' }));
    modal.info({ title: 0, content: snippet, icon: 'i' });
    await settle();
    expect(document.querySelector('.ads-modal-confirm-title')?.textContent?.trim()).toBe('0');
    expect(screen.getByTestId('own')).toBeInTheDocument();
    expect(document.querySelector('.ads-modal-confirm-icon')?.textContent?.trim()).toBe('i');
    cleanup();
    removeLayer();
    resetModals();

    const icon = createRawSnippet(() => ({ render: () => '<u data-testid="own-icon">u</u>' }));
    modal.info({ title: 'T', content: 0, icon });
    await settle();
    expect(screen.getByTestId('own-icon')).toBeInTheDocument();
    expect(document.querySelector('.ads-modal-confirm-description')?.textContent?.trim()).toBe('0');
    cleanup();
    removeLayer();
    resetModals();

    modal.info({ title: 'T', content: 'Text', icon: false });
    await settle();
    expect(document.querySelector('.ads-modal-confirm-icon')).toBeNull();
    expect(document.querySelector('.ads-modal-confirm-body')).toHaveClass('ads-modal-confirm-body-plain');
  });

  it('with no title the text names the dialog, and with neither the dialog has no name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    modal.info({ content: 'Only a text' });
    await settle();
    expect(alertDialog()).toHaveAccessibleName('Only a text');
    expect(alertDialog()).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('.ads-modal-confirm-description')).toHaveClass('ads-modal-confirm-description-alone');
    expect(warn).not.toHaveBeenCalled();
    cleanup();
    removeLayer();
    resetModals();

    modal.info({});
    await settle();
    expect(alertDialog()).not.toHaveAttribute('aria-labelledby');
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('the options of the Modal reach it: texts, the type and the props of the buttons, the width, the class names', async () => {
    modal.confirm({
      title: 'T',
      okText: 'Delete',
      cancelText: 'Keep',
      okType: 'primary',
      okButtonProps: { danger: true },
      cancelButtonProps: { class: 'mine' },
      width: 300,
      zIndex: 1200,
      class: 'box',
      wrapClassName: 'wrap',
      classNames: { confirmBody: 'c-body', icon: 'c-icon', title: 'c-title', description: 'c-description' },
      styles: { confirmBody: { '--probe': 'body' }, icon: { '--probe': 'icon' }, title: { '--probe': 'title' }, description: { '--probe': 'description' } },
      content: 'Text'
    });
    await settle();
    expect(footerButtons()).toEqual(['Keep', 'Delete']);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('ads-btn-danger');
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveClass('mine');
    expect(alertDialog().style.width).toBe('300px');
    expect(alertDialog()).toHaveClass('box');
    expect(document.querySelector('.ads-modal-root')).toHaveStyle({ zIndex: '1200' });
    expect(document.querySelector('.ads-modal-wrapper')).toHaveClass('wrap');
    for (const part of ['body', 'icon', 'title', 'description']) {
      const element = document.querySelector<HTMLElement>(`.c-${part}`);
      expect(element, part).not.toBeNull();
      expect(element?.style.getPropertyValue('--probe')).toBe(part);
    }
  });

  it('a footer of its own replaces the buttons', async () => {
    modal.info({ title: 'T', footer: 'Footer text' });
    await settle();
    expect(document.querySelector('.ads-modal-footer')?.textContent?.trim()).toBe('Footer text');
    cleanup();
    removeLayer();
    resetModals();
    modal.info({ title: 'T', footer: null });
    await settle();
    expect(document.querySelector('.ads-modal-footer')).toBeNull();
  });
});

describe('R15: the defaults of a dialog (P15)', () => {
  it('416 px wide (the token), no close button, and the mask does not close it', async () => {
    modal.confirm({ title: 'T' });
    await settle();
    expect(alertDialog().style.width).toBe('var(--ads-modal-confirm-width)');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    await fireEvent.pointerDown(document.querySelector('.ads-modal-wrapper') as HTMLElement);
    await fireEvent.click(document.querySelector('.ads-modal-wrapper') as HTMLElement);
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
  });

  it('focus goes to the OK button, and autoFocusButton changes it', async () => {
    modal.confirm({ title: 'T' });
    await settle();
    expect(document.activeElement).toBe(ok());
    cleanup();
    removeLayer();
    resetModals();
    modal.confirm({ title: 'T', focusable: { autoFocusButton: 'cancel' } });
    await settle();
    expect(document.activeElement).toBe(cancelButton());
    cleanup();
    removeLayer();
    resetModals();
    modal.confirm({ title: 'T', focusable: { autoFocusButton: null } });
    await settle();
    expect(document.activeElement).toBe(alertDialog());
  });

  it('the caller may turn on the close button and the closing mask, or take the mask away', async () => {
    modal.confirm({ title: 'T', closable: true, mask: { closable: true } });
    await settle();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    await fireEvent.pointerDown(document.querySelector('.ads-modal-wrapper') as HTMLElement);
    await fireEvent.click(document.querySelector('.ads-modal-wrapper') as HTMLElement);
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
    cleanup();
    removeLayer();
    resetModals();

    modal.confirm({ title: 'T', mask: false });
    await settle();
    expect(document.querySelector('.ads-modal-mask')).toBeNull();
    cleanup();
    removeLayer();
    resetModals();

    modal.confirm({ title: 'T', mask: true });
    await settle();
    expect(document.querySelector('.ads-modal-mask')).not.toBeNull();
  });

  it('Escape closes it, and keyboard false does not', async () => {
    modal.confirm({ title: 'T' });
    await settle();
    await escape();
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
    cleanup();
    removeLayer();
    resetModals();

    modal.confirm({ title: 'T', keyboard: false });
    await settle();
    await escape();
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
  });
});

describe('R15 and D6: what the handle resolves to', () => {
  it('OK is true', async () => {
    const seen = outcome(modal.confirm({ title: 'T' }));
    await settle();
    await fireEvent.click(ok());
    await settle();
    expect(seen.value).toBe(true);
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
  });

  it('Cancel, Escape, the close button, the mask, destroy and destroyAll are false', async () => {
    const results: boolean[] = [];
    const ways: [string, () => Promise<unknown> | void][] = [
      ['cancel', () => fireEvent.click(cancelButton())],
      ['escape', () => escape()],
      ['close button', () => fireEvent.click(screen.getByRole('button', { name: 'Close' }))],
      ['mask', async () => {
        const wrapper = document.querySelector('.ads-modal-wrapper') as HTMLElement;
        await fireEvent.pointerDown(wrapper);
        await fireEvent.click(wrapper);
      }]
    ];
    for (const [, act] of ways) {
      const handle = modal.confirm({ title: 'T', closable: true, mask: { closable: true } });
      void handle.then((value) => results.push(value));
      await settle();
      await act();
      await settle();
      cleanup();
      removeLayer();
      resetModals();
    }
    expect(results).toEqual([false, false, false, false]);

    const handle = modal.confirm({ title: 'T' });
    const seen = outcome(handle);
    await settle();
    handle.destroy();
    await settle();
    expect(seen.value).toBe(false);

    const second = outcome(modal.info({ title: 'two' }));
    const third = outcome(modal.error({ title: 'three' }));
    await settle();
    modal.destroyAll();
    await settle();
    expect(second.value).toBe(false);
    expect(third.value).toBe(false);
  });

  it('the handle can be awaited', async () => {
    const handle = modal.confirm({ title: 'T' });
    queueMicrotask(() => handle.destroy());
    await expect(handle).resolves.toBe(false);
  });

  it('then takes a rejection handler too', async () => {
    const handle = modal.confirm({ title: 'T' });
    handle.destroy();
    const result = await handle.then(undefined, () => 'rejected');
    expect(result).toBe(false);
  });
});

describe('R15: with no leave animation (prefers-reduced-motion)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('the dialog is gone at once, and the handle is still answered: true for OK', async () => {
    const seen = outcome(modal.confirm({ title: 'T' }));
    await settle();
    await fireEvent.click(ok());
    await settle();
    expect(seen.value).toBe(true);
    expect(document.querySelector('.ads-modal-root')).toBeNull();
    expect(getSnapshot().records).toHaveLength(0);
  });

  it('false for Cancel and for Escape', async () => {
    const first = outcome(modal.confirm({ title: 'T' }));
    await settle();
    await fireEvent.click(cancelButton());
    await settle();
    expect(first.value).toBe(false);
    cleanup();
    removeLayer();
    resetModals();

    const second = outcome(modal.confirm({ title: 'T' }));
    await settle();
    await escape();
    await settle();
    expect(second.value).toBe(false);
  });

  it('and for destroy, and the onafterclose of the caller runs once', async () => {
    const onafterclose = vi.fn();
    const handle = modal.confirm({ title: 'T', onafterclose });
    const seen = outcome(handle);
    await settle();
    handle.destroy();
    await settle();
    expect(seen.value).toBe(false);
    expect(onafterclose).toHaveBeenCalledTimes(1);
  });
});

describe('R15 and R4: OK that waits, and Cancel that waits', () => {
  it('a plain onok: the dialog closes, and onok got the mouse event', async () => {
    const onok = vi.fn();
    const seen = outcome(modal.confirm({ title: 'T', onok }));
    await settle();
    await fireEvent.click(ok());
    await settle();
    expect(onok.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(seen.value).toBe(true);
  });

  it('an onok that returns a Promise: the OK button waits, a resolve closes', async () => {
    let resolve!: () => void;
    const seen = outcome(modal.confirm({ title: 'T', onok: () => new Promise<void>((done) => (resolve = done)) }));
    await settle();
    await fireEvent.click(ok());
    await settle();
    expect(ok()).toHaveAttribute('aria-busy', 'true');
    expect(seen.value).toBeUndefined();
    resolve();
    await settle();
    expect(seen.value).toBe(true);
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
  });

  it('a reject keeps it open, it has not been answered, and OK can be pressed again', async () => {
    let fail!: () => void;
    const onok = vi.fn(() => new Promise<void>((_done, reject) => (fail = reject)));
    const seen = outcome(modal.confirm({ title: 'T', onok }));
    await settle();
    await fireEvent.click(ok());
    fail();
    await settle();
    expect(seen.value).toBeUndefined();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
    await fireEvent.click(ok());
    expect(onok).toHaveBeenCalledTimes(2);
  });

  it('preventDefault in onok keeps it open', async () => {
    modal.confirm({ title: 'T', onok: (event) => event.preventDefault() });
    await settle();
    await fireEvent.click(ok());
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
  });

  it('an oncancel that returns a Promise: the Cancel button waits, a resolve closes with false', async () => {
    let resolve!: () => void;
    const seen = outcome(modal.confirm({ title: 'T', oncancel: () => new Promise<void>((done) => (resolve = done)) }));
    await settle();
    await fireEvent.click(cancelButton());
    await settle();
    expect(cancelButton()).toHaveAttribute('aria-busy', 'true');
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
    resolve();
    await settle();
    expect(seen.value).toBe(false);
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
  });

  it('an oncancel Promise that rejects keeps it open and frees the Cancel button; OK still answers true', async () => {
    let fail!: () => void;
    const seen = outcome(modal.confirm({ title: 'T', oncancel: () => new Promise<void>((_done, reject) => (fail = reject)) }));
    await settle();
    await fireEvent.click(cancelButton());
    fail();
    await settle();
    expect(cancelButton()).not.toHaveAttribute('aria-busy', 'true');
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
    await fireEvent.click(ok());
    await settle();
    expect(seen.value).toBe(true);
  });

  it('preventDefault in oncancel keeps it open', async () => {
    modal.confirm({ title: 'T', oncancel: (event) => event.preventDefault() });
    await settle();
    await fireEvent.click(cancelButton());
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
    await escape();
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'open');
  });

  it('a plain oncancel is called with the event and the dialog closes', async () => {
    const oncancel = vi.fn();
    modal.confirm({ title: 'T', oncancel });
    await settle();
    await fireEvent.click(cancelButton());
    await settle();
    expect(oncancel.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
  });
});

describe('R15: update, destroy and the layer', () => {
  it('update with an object changes the dialog in place, and focus stays', async () => {
    const handle = modal.confirm({ title: 'Before', content: 'Text' });
    await settle();
    const before = document.activeElement;
    handle.update({ title: 'After', content: 'New text' });
    await settle();
    expect(alertDialog()).toHaveAccessibleName('After');
    expect(alertDialog()).toHaveAccessibleDescription('New text');
    expect(document.activeElement).toBe(before);
    expect(boxes()).toHaveLength(1);
  });

  it('update with a function gets the previous options', async () => {
    const handle = modal.confirm({ title: 'T', content: 'Text' });
    await settle();
    handle.update((previous) => ({ content: `${previous.content as string} more` }));
    await settle();
    expect(alertDialog()).toHaveAccessibleDescription('Text more');
  });

  it('update after the dialog was closed does nothing, and an unknown id does not fail', async () => {
    const handle = modal.confirm({ title: 'T' });
    await settle();
    handle.destroy();
    await settle();
    expect(() => handle.update({ title: 'Late' })).not.toThrow();
    removeLayer();
    resetModals();
    expect(() => handle.update({ title: 'Later' })).not.toThrow();
  });

  it('destroy closes it with the leave animation, and the layer goes with the last dialog', async () => {
    stubAnimation();
    const onafterclose = vi.fn();
    const handle = modal.confirm({ title: 'T', onafterclose });
    await settle();
    handle.destroy();
    await settle();
    expect(alertDialog()).toHaveAttribute('data-state', 'closed');
    expect(onafterclose).not.toHaveBeenCalled();
    expect(getSnapshot().records).toHaveLength(1);
    alertDialog().dispatchEvent(new Event('animationend'));
    await settle();
    expect(onafterclose).toHaveBeenCalledTimes(1);
    expect(getSnapshot().records).toHaveLength(0);
    expect(document.querySelector('.ads-modal-root')).toBeNull();
  });

  it('destroy twice does nothing the second time, and onafteropenchange is passed on', async () => {
    const onafteropenchange = vi.fn();
    const handle = modal.confirm({ title: 'T', onafteropenchange });
    await settle();
    alertDialog().dispatchEvent(new Event('animationend'));
    expect(onafteropenchange).toHaveBeenCalledExactlyOnceWith(true);
    handle.destroy();
    handle.destroy();
    await settle();
    alertDialog().dispatchEvent(new Event('animationend'));
    await settle();
    expect(onafteropenchange).toHaveBeenCalledTimes(2);
    expect(onafteropenchange).toHaveBeenLastCalledWith(false);
  });

  it('destroyAll closes the static dialogs and no Modal written in markup', async () => {
    const { default: ModalHarness } = await import('./fixtures/ModalHarness.svelte');
    render(ModalHarness, { title: 'Markup', open: true });
    modal.info({ title: 'Static one' });
    modal.error({ title: 'Static two' });
    await settle();
    modal.destroyAll();
    await settle();
    const states = boxes().map((box) => [box.getAttribute('aria-labelledby') ? (document.getElementById(box.getAttribute('aria-labelledby') as string)?.textContent?.trim() ?? '') : '', box.dataset.state]);
    expect(states).toContainEqual(['Markup', 'open']);
    expect(states).toContainEqual(['Static one', 'closed']);
    expect(states).toContainEqual(['Static two', 'closed']);
  });

  it('two dialogs are stacked: Escape closes the last one first', async () => {
    const first = outcome(modal.info({ title: 'First' }));
    const second = outcome(modal.confirm({ title: 'Second' }));
    await settle();
    expect(boxes()).toHaveLength(2);
    await escape();
    await settle();
    expect(second.value).toBe(false);
    expect(first.value).toBeUndefined();
    await escape();
    await settle();
    expect(first.value).toBe(false);
  });

  it('a call with options that are changed after it does not change the dialog (the options are copied)', async () => {
    const options = { title: 'Original' };
    modal.info(options);
    await settle();
    options.title = 'Changed';
    await settle();
    expect(alertDialog()).toHaveAccessibleName('Original');
  });
});

describe('D5: the host', () => {
  it('with no host the library makes its own layer; a host that is mounted takes the dialogs over, and its context is seen', async () => {
    render(ModalContextHarness, { withHost: false });
    await fireEvent.click(screen.getByTestId('open'));
    await settle();
    expect(screen.getByTestId('context')).toHaveTextContent('nobody');
    cleanup();
    removeLayer();
    resetModals();

    render(ModalContextHarness, { withHost: true });
    await settle();
    await fireEvent.click(screen.getByTestId('open'));
    await settle();
    expect(screen.getByTestId('context')).toHaveTextContent('host');
  });

  it('a host that comes after the dialog is open takes it over, and the layer of the library goes', async () => {
    modal.info({ title: 'Early', content: 'Text' });
    await settle();
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(1);
    const { default: ModalHost } = await import('../src/lib/Modal/ModalHost.svelte');
    render(ModalHost);
    await settle();
    await settle();
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(1);
    expect(alertDialog()).toHaveAccessibleName('Early');
  });

  it('a host that is gone hands the dialogs back to the layer of the library', async () => {
    const { default: ModalHost } = await import('../src/lib/Modal/ModalHost.svelte');
    const host = render(ModalHost);
    await settle();
    modal.info({ title: 'Kept' });
    await settle();
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(1);
    host.unmount();
    await settle();
    await settle();
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(1);
    expect(alertDialog()).toHaveAccessibleName('Kept');
  });

  it('a second host draws nothing and says so once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: ModalHost } = await import('../src/lib/Modal/ModalHost.svelte');
    render(ModalHost);
    render(ModalHost);
    await settle();
    modal.info({ title: 'Once' });
    modal.info({ title: 'Twice' });
    await settle();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('another ModalHost');
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(2);
  });

  it('no warning in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { default: ModalHost } = await import('../src/lib/Modal/ModalHost.svelte');
    render(ModalHost);
    render(ModalHost);
    await settle();
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it('a dialog that is closing when a host takes over goes at once and leaves nothing', async () => {
    stubAnimation();
    const handle = modal.info({ title: 'Leaving' });
    await settle();
    handle.destroy();
    await settle();
    const { default: ModalHost } = await import('../src/lib/Modal/ModalHost.svelte');
    render(ModalHost);
    await settle();
    await settle();
    expect(getSnapshot().records).toHaveLength(0);
    expect(document.querySelectorAll('.ads-modal')).toHaveLength(0);
  });
});

describe('R15: on a server', () => {
  it('a call stores nothing, returns a handle that can be used, and a host renders nothing', () => {
    const base = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(base, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/ModalServerHarness.svelte', props: {} }])],
      { cwd: base, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('function,function,function|0|no-host');
    expect(html).not.toContain('ads-modal');
  });
});
