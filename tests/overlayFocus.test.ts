// Focus inside a layer (specs/overlay.md, O3): what Tab reaches, and how Tab wraps. jsdom has no layout, so what is shown is
// decided by the style, as the code does.
import { afterEach, describe, expect, it } from 'vitest';
import { focusQuietly, tabbables, wrapTab } from '../src/lib/internal/overlay/focus';

afterEach(() => {
  document.body.innerHTML = '';
});

function layer(html: string): HTMLElement {
  document.body.innerHTML = `<button id="outside">outside</button><div id="root" tabindex="-1">${html}</div>`;
  return document.getElementById('root') as HTMLElement;
}

const ids = (elements: HTMLElement[]) => elements.map((element) => element.id);

function tab(root: HTMLElement, shift = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true });
  wrapTab(root, event);
  return event;
}

const focused = () => (document.activeElement as HTMLElement).id;

describe('tabbables (O3)', () => {
  it('finds what Tab reaches, in document order', () => {
    const root = layer(
      '<a id="a" href="#">a</a><button id="b">b</button><input id="c"><select id="d"></select><textarea id="e"></textarea>' +
        '<div id="f" tabindex="0"></div><div id="g" contenteditable="true"></div><summary id="h"></summary>' +
        '<iframe id="i"></iframe><audio id="j" controls></audio><video id="k" controls></video>'
    );
    expect(ids(tabbables(root))).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
  });

  it('skips what Tab does not reach', () => {
    const root = layer(
      '<a id="no-href">x</a><button id="off" disabled>x</button><input id="hidden-input" type="hidden">' +
        '<div id="minus" tabindex="-1"></div><div id="not-a-number" tabindex="x"></div><button id="minus-button" tabindex="-1">x</button><div id="plain"></div><div id="ce" contenteditable="false"></div>' +
        '<button id="in-hidden-attr" hidden>x</button><div hidden><button id="in-hidden-parent">x</button></div>' +
        '<div inert><button id="in-inert">x</button></div>' +
        '<button id="display-none" style="display:none">x</button><div style="display:none"><button id="in-display-none">x</button></div>' +
        '<button id="invisible" style="visibility:hidden">x</button><button id="ok">ok</button>'
    );
    expect(ids(tabbables(root))).toEqual(['ok']);
  });

  it('a button with a tabindex that is not a number is still reached, as it is without one', () => {
    const root = layer('<button id="odd" tabindex="x">x</button><div id="positive" tabindex="3"></div>');
    expect(ids(tabbables(root))).toEqual(['odd', 'positive']);
  });

  it('an element is hidden by an ancestor of its own only below the root', () => {
    // The root itself is not shown (a layer that is closing); what is inside is still judged inside it.
    document.body.innerHTML = '<div id="root" style="display:none"><button id="b">b</button></div>';
    const root = document.getElementById('root') as HTMLElement;
    expect(ids(tabbables(root))).toEqual(['b']);
  });
});

describe('focusQuietly', () => {
  it('focuses without scrolling the page', () => {
    const root = layer('<button id="b">b</button>');
    const button = root.querySelector('button') as HTMLElement;
    let options: FocusOptions | undefined;
    const focus = button.focus.bind(button);
    button.focus = (given?: FocusOptions) => {
      options = given;
      focus(given);
    };
    focusQuietly(button);
    expect(options).toEqual({ preventScroll: true });
    expect(focused()).toBe('b');
  });
});

describe('wrapTab (O3)', () => {
  const buttons = '<button id="first">1</button><button id="middle">2</button><button id="last">3</button>';

  it('Tab on the last element goes to the first', () => {
    const root = layer(buttons);
    document.getElementById('last')?.focus();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(focused()).toBe('first');
  });

  it('Shift+Tab on the first element goes to the last', () => {
    const root = layer(buttons);
    document.getElementById('first')?.focus();
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(focused()).toBe('last');
  });

  it('Shift+Tab on the layer itself goes to the last element', () => {
    const root = layer(buttons);
    root.focus();
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(focused()).toBe('last');
  });

  it('Tab from the layer itself, and in the middle, is left to the browser', () => {
    const root = layer(buttons);
    root.focus();
    expect(tab(root).defaultPrevented).toBe(false);
    document.getElementById('middle')?.focus();
    expect(tab(root).defaultPrevented).toBe(false);
    expect(tab(root, true).defaultPrevented).toBe(false);
    expect(focused()).toBe('middle');
  });

  it('Tab on the first element and Shift+Tab on the last are left to the browser', () => {
    const root = layer(buttons);
    document.getElementById('first')?.focus();
    expect(tab(root).defaultPrevented).toBe(false);
    document.getElementById('last')?.focus();
    expect(tab(root, true).defaultPrevented).toBe(false);
  });

  it('Tab while focus is on the body goes in at the first element, Shift+Tab at the last', () => {
    const root = layer(buttons);
    (document.activeElement as HTMLElement | null)?.blur();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(focused()).toBe('first');
    (document.activeElement as HTMLElement).blur();
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(focused()).toBe('last');
  });

  it('focus on something outside the layer that is not the body is left alone: a popup that came from inside', () => {
    const root = layer(buttons);
    document.getElementById('outside')?.focus();
    expect(tab(root).defaultPrevented).toBe(false);
    expect(focused()).toBe('outside');
  });

  it('a layer with nothing to focus keeps focus on itself', () => {
    const root = layer('<p>text</p>');
    root.focus();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(root);
  });

  it('a layer with one element keeps focus on it', () => {
    const root = layer('<button id="only">x</button>');
    document.getElementById('only')?.focus();
    expect(tab(root).defaultPrevented).toBe(true);
    expect(focused()).toBe('only');
    expect(tab(root, true).defaultPrevented).toBe(true);
    expect(focused()).toBe('only');
  });
});
