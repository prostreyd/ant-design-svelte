// The pile (specs/overlay.md, `pile/`, PL1 to PL7): what a list that lies in a pile does when the pointer or the focus comes.
import { cleanup, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PileProbe from './fixtures/PileProbe.svelte';
import { pointer } from './helpers/message';

// The motion is measured in the browser (`e2e/message.spec.ts`); here only whether it is asked for, and when.
const flip = vi.hoisted(() => ({ readTops: vi.fn(), playFlip: vi.fn() }));
vi.mock('../src/lib/internal/anim/motion', () => flip);

const records = [
  { id: 1, pauseOnHover: true },
  { id: 2, pauseOnHover: false }
];

/** The last word each timer got about the reason `pile`. */
function spy() {
  const held = new Map<number, boolean>();
  const setPaused = vi.fn((id: number, reason: string, on: boolean) => {
    expect(reason).toBe('pile');
    held.set(id, on);
  });
  return { held, setPaused, state: () => Object.fromEntries(held) };
}

const content = () => screen.getByTestId('content');
const state = () => screen.getByTestId('state').textContent;

function leaveFocus(to: Element | null): void {
  content().dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: to }));
}

beforeEach(() => {
  flip.readTops.mockReset().mockReturnValue(new Map([['a', 10]]));
  flip.playFlip.mockReset();
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('PL1: piled', () => {
  it('a list that is not collapsed is never piled, whatever the pointer does', async () => {
    render(PileProbe, { collapsed: false, records, setPaused: spy().setPaused });
    expect(state()).toBe('open');
    pointer(content(), 'pointerenter');
    await tick();
    expect(state()).toBe('open');
  });

  it('a collapsed list lies in a pile until the pointer or the focus opens it', async () => {
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    expect(state()).toBe('piled');
    expect(content().classList.contains('piled')).toBe(true);
    await rerender({ collapsed: false });
    expect(state()).toBe('open');
  });
});

describe('PL2: the pointer', () => {
  it('a mouse opens the pile, and leaving closes it', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    pointer(content(), 'pointerenter');
    await tick();
    expect(state()).toBe('open');
    pointer(content(), 'pointerleave');
    await tick();
    expect(state()).toBe('piled');
  });

  it('a pen does the same', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    pointer(content(), 'pointerenter', 'pen');
    await tick();
    expect(state()).toBe('open');
    pointer(content(), 'pointerleave', 'pen');
    await tick();
    expect(state()).toBe('piled');
  });

  it('a touch does nothing: its hover would never go', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    pointer(content(), 'pointerenter', 'touch');
    await tick();
    expect(state()).toBe('piled');
    pointer(content(), 'pointerenter');
    await tick();
    pointer(content(), 'pointerleave', 'touch');
    await tick();
    expect(state()).toBe('open');
  });
});

describe('PL3: the focus', () => {
  it('focus inside opens the pile; focus leaving it closes it', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    screen.getByTestId('one').focus();
    await tick();
    expect(state()).toBe('open');
    screen.getByTestId('outside').focus();
    await tick();
    expect(state()).toBe('piled');
  });

  it('focus that moves to another element inside does not close it', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    screen.getByTestId('one').focus();
    await tick();
    leaveFocus(screen.getByTestId('two'));
    await tick();
    expect(state()).toBe('open');
  });

  it('focus that leaves for nowhere (the window lost it) closes it', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    screen.getByTestId('one').focus();
    await tick();
    leaveFocus(null);
    await tick();
    expect(state()).toBe('piled');
  });

  it('the pile stays open while the focus is in it, though the pointer has left', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    pointer(content(), 'pointerenter');
    screen.getByTestId('one').focus();
    await tick();
    pointer(content(), 'pointerleave');
    await tick();
    expect(state()).toBe('open');
  });
});

describe('PL4: the timers wait', () => {
  it('with the pointer only the records that are held by the pointer wait; with the focus all of them', async () => {
    const { state: held, setPaused } = spy();
    render(PileProbe, { collapsed: true, records, setPaused });
    await tick();
    expect(held()).toEqual({ 1: false, 2: false });
    pointer(content(), 'pointerenter');
    await tick();
    expect(held()).toEqual({ 1: true, 2: false });
    screen.getByTestId('one').focus();
    await tick();
    expect(held()).toEqual({ 1: true, 2: true });
  });

  it('they are let go when the pile closes', async () => {
    const { state: held, setPaused } = spy();
    render(PileProbe, { collapsed: true, records, setPaused });
    screen.getByTestId('one').focus();
    await tick();
    expect(held()).toEqual({ 1: true, 2: true });
    screen.getByTestId('outside').focus();
    await tick();
    expect(held()).toEqual({ 1: false, 2: false });
  });

  it('nothing waits in a list that is not collapsed, though the pointer is over it', async () => {
    const { state: held, setPaused } = spy();
    render(PileProbe, { collapsed: false, records, setPaused });
    pointer(content(), 'pointerenter');
    await tick();
    expect(held()).toEqual({ 1: false, 2: false });
  });

  it('they are let go when the list stops being collapsed while the pointer is over it', async () => {
    const { state: held, setPaused } = spy();
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused });
    pointer(content(), 'pointerenter');
    await tick();
    expect(held()).toEqual({ 1: true, 2: false });
    await rerender({ collapsed: false });
    expect(held()).toEqual({ 1: false, 2: false });
  });

  it('a change of the records lets the old ones go and holds the new ones', async () => {
    const { state: held, setPaused } = spy();
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused });
    screen.getByTestId('one').focus();
    await tick();
    await rerender({ records: [{ id: 3, pauseOnHover: true }] });
    expect(held()).toEqual({ 1: false, 2: false, 3: true });
  });

  it('they are let go when the owner is destroyed', async () => {
    const { state: held, setPaused } = spy();
    render(PileProbe, { collapsed: true, records, setPaused });
    screen.getByTestId('one').focus();
    await tick();
    expect(held()).toEqual({ 1: true, 2: true });
    cleanup();
    expect(held()).toEqual({ 1: false, 2: false });
  });
});

describe('PL5: forgotten with the element', () => {
  it('the list that comes after one that went away under the pointer is not held open', async () => {
    const { state: held, setPaused } = spy();
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused });
    pointer(content(), 'pointerenter');
    await tick();
    expect(state()).toBe('open');
    // The element goes, and it sends no `pointerleave`.
    await rerender({ show: false });
    await rerender({ show: true });
    expect(state()).toBe('piled');
    expect(held()).toEqual({ 1: false, 2: false });
  });

  it('the same for a focus that was inside it', async () => {
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    screen.getByTestId('one').focus();
    await tick();
    await rerender({ show: false });
    await rerender({ show: true });
    expect(state()).toBe('piled');
  });

  it('the listeners go with the element: nothing is left on a removed one', async () => {
    const { rerender } = render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    const old = content();
    await rerender({ show: false });
    pointer(old, 'pointerenter');
    old.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await rerender({ show: true });
    expect(state()).toBe('piled');
  });
});

describe('PL6: the rows slide', () => {
  it('when the pile opens and when it closes, the places are read before and played after', async () => {
    render(PileProbe, { collapsed: true, records, setPaused: spy().setPaused });
    expect(flip.readTops).not.toHaveBeenCalled();
    expect(flip.playFlip).not.toHaveBeenCalled();

    pointer(content(), 'pointerenter');
    await tick();
    expect(flip.readTops).toHaveBeenCalledTimes(1);
    expect(flip.readTops).toHaveBeenCalledWith(content());
    expect(flip.playFlip).toHaveBeenCalledTimes(1);
    expect(flip.playFlip).toHaveBeenCalledWith(content(), new Map([['a', 10]]));

    pointer(content(), 'pointerleave');
    await tick();
    expect(flip.readTops).toHaveBeenCalledTimes(2);
    expect(flip.playFlip).toHaveBeenCalledTimes(2);
  });

  it('nothing slides when the rows change but the pile stays as it was', async () => {
    const { rerender } = render(PileProbe, { collapsed: true, rows: 3, records, setPaused: spy().setPaused });
    await rerender({ rows: 4 });
    await rerender({ rows: 5 });
    expect(flip.readTops).not.toHaveBeenCalled();
    expect(flip.playFlip).not.toHaveBeenCalled();
  });

  it('a list that is not collapsed has no pile to open or close', async () => {
    render(PileProbe, { collapsed: false, records, setPaused: spy().setPaused });
    pointer(content(), 'pointerenter');
    await tick();
    expect(flip.readTops).not.toHaveBeenCalled();
    expect(flip.playFlip).not.toHaveBeenCalled();
  });

  it('a pile that opens with no element on the page has nothing to slide', async () => {
    const { rerender } = render(PileProbe, { collapsed: false, show: false, records, setPaused: spy().setPaused });
    await rerender({ collapsed: true });
    expect(state()).toBe('piled');
    expect(flip.readTops).not.toHaveBeenCalled();
    expect(flip.playFlip).not.toHaveBeenCalled();
  });
});

describe('PL7: inertWhen', () => {
  it('sets the attribute while it is active, takes it off when it is not, and follows the change', async () => {
    const { rerender } = render(PileProbe, { buried: false, setPaused: spy().setPaused });
    const box = screen.getByTestId('buried');
    expect(box.hasAttribute('inert')).toBe(false);
    await rerender({ buried: true });
    expect(box.hasAttribute('inert')).toBe(true);
    await rerender({ buried: false });
    expect(box.hasAttribute('inert')).toBe(false);
  });
});
