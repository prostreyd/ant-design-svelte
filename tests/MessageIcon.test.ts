import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MessageIcon from '../src/lib/Message/MessageIcon.svelte';

describe('MessageIcon', () => {
  it('draws each of the six icons, decorative, and gives each mask its own id', () => {
    const names = ['info', 'success', 'error', 'warning', 'loading', 'close'] as const;
    const ids = new Set<string>();
    for (const name of names) {
      const { container } = render(MessageIcon, { props: { name } });
      const svg = container.querySelector('svg')!;
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveClass(`ads-message-svg-${name}`);
      const mask = svg.querySelector('mask');
      if (mask) ids.add(mask.id);
      expect(svg.querySelector('path, circle')).not.toBeNull();
    }
    expect(ids.size).toBe(4);
  });
});
