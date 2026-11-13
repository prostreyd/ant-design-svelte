import { describe, expect, it, vi } from 'vitest';
import { clickable } from '../src/lib/internal/clickable';

describe('clickable: a click listener of the element itself, for WebKit', () => {
  it('adds a listener for click to the element, and nothing happens when it is clicked', () => {
    const node = document.createElement('div');
    const add = vi.spyOn(node, 'addEventListener');
    clickable(node);
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][0]).toBe('click');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    node.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
