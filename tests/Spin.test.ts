import { render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { createRawSnippet, flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Spin from '../src/lib/Spin/Spin.svelte';
import SpinHarness from './fixtures/SpinHarness.svelte';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/** The status element: the root of a standalone or fullscreen Spin, the section of an embedded one. */
const status = () => screen.getByRole('status');
const queryStatus = () => screen.queryByRole('status');
const raw = (html: string) => createRawSnippet(() => ({ render: () => html }));
/** The component's own classes; Svelte adds a generated scoping class that tests ignore. */
const appClasses = (element: Element | null) => [...(element?.classList ?? [])].filter((name) => name.startsWith('ads-'));
const styleOf = (element: Element | null) => (element as HTMLElement).style;
const dots = (root: ParentNode = document) => root.querySelectorAll('.ads-spin-dots > span');
const indicator = () => document.querySelector('.ads-spin-indicator');
const description = () => document.querySelector('.ads-spin-description');
/** The progressbar: the indicator part itself, with the drawing (an svg) inside. */
const ring = () => document.querySelector('[role="progressbar"]');
const drawing = () => document.querySelector('svg.ads-spin-ring');
const arc = () => document.querySelector('.ads-spin-ring-arc');
const container = () => document.querySelector('.ads-spin-container');
const section = () => document.querySelector('.ads-spin-section');

const AXE_OPTIONS = {
  runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: { 'color-contrast': { enabled: false } }
};

// A Spin with no description and no name warns once in development; the tests that do not look at the
// warning keep it quiet.
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('Spin: standalone (SPN-1, SPN-2)', () => {
  it('SPN-1: no children: a status element with the indicator of four dots, medium', () => {
    const { container: host } = render(Spin);
    expect(status().tagName).toBe('DIV');
    expect(appClasses(status())).toEqual(['ads-spin', 'ads-spin-standalone', 'ads-spin-medium']);
    expect(dots(host)).toHaveLength(4);
    expect(description()).toBeNull();
    expect(container()).toBeNull();
    expect(section()).toBeNull();
  });

  it('SPN-1: the indicator is hidden from assistive technology', () => {
    render(Spin);
    expect(indicator()).toHaveAttribute('aria-hidden', 'true');
  });

  it('SPN-1: the description comes after the indicator, inside the same element', () => {
    render(Spin, { props: { description: 'Loading' } });
    const parts = [...status().children];
    expect(parts).toHaveLength(2);
    expect(parts[0]).toHaveClass('ads-spin-indicator');
    expect(parts[1]).toHaveClass('ads-spin-description');
    expect(parts[1]).toHaveTextContent('Loading');
  });

  it('SPN-2: spinning={false} renders nothing, and the space is not kept', () => {
    const { container: host } = render(Spin, { props: { spinning: false } });
    expect(host.querySelector('.ads-spin')).toBeNull();
    expect(host.textContent).toBe('');
  });

  it('spinning: undefined counts as the default, true (React issue 57082)', () => {
    render(Spin, { props: { spinning: undefined } });
    expect(status()).toBeInTheDocument();
  });

  it('spinning: a change shows and hides the indicator', async () => {
    const { rerender } = render(Spin, { props: { spinning: false } });
    expect(queryStatus()).toBeNull();
    await rerender({ spinning: true });
    expect(status()).toBeInTheDocument();
    await rerender({ spinning: false });
    expect(queryStatus()).toBeNull();
  });
});

describe('Spin: embedded (SPN-3 to SPN-7)', () => {
  it('SPN-3: children: a root with the covered content in a container', () => {
    render(SpinHarness, { props: { content: 'text' } });
    const root = document.querySelector('.ads-spin') as HTMLElement;
    expect(appClasses(root)).toEqual(['ads-spin', 'ads-spin-embedded', 'ads-spin-medium']);
    expect(root).not.toHaveAttribute('role');
    expect(container()).toContainElement(screen.getByTestId('content'));
    expect(container()?.parentElement).toBe(root);
  });

  it('SPN-3: while spinning the container is busy and the section (status) sits before it in the root', () => {
    render(SpinHarness, { props: { content: 'text', description: 'Loading' } });
    const root = document.querySelector('.ads-spin') as HTMLElement;
    expect(container()).toHaveClass('ads-spin-container-busy');
    expect(container()).toHaveAttribute('aria-busy', 'true');
    expect([...root.children]).toEqual([section(), container()]);
    expect(status()).toBe(section());
    expect(status()).toHaveClass('ads-spin-section');
    expect(dots(status())).toHaveLength(4);
    expect(description()).toHaveTextContent('Loading');
  });

  it('SPN-4: not spinning: the content is as it is, with no section, no busy class and no aria-busy', () => {
    render(SpinHarness, { props: { content: 'text', spinning: false } });
    expect(section()).toBeNull();
    expect(container()).not.toHaveClass('ads-spin-container-busy');
    expect(container()).not.toHaveAttribute('aria-busy');
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('SPN-5: spinning at mount: the busy state is there on the first render (no change from the idle state)', () => {
    render(SpinHarness, { props: { content: 'text' } });
    expect(container()).toHaveClass('ads-spin-container-busy');
  });

  it('SPN-4: the busy state follows spinning', async () => {
    const { rerender } = render(SpinHarness, { props: { content: 'text', spinning: false } });
    await rerender({ spinning: true });
    expect(container()).toHaveClass('ads-spin-container-busy');
    expect(container()).toHaveAttribute('aria-busy', 'true');
    await rerender({ spinning: false });
    expect(container()).not.toHaveClass('ads-spin-container-busy');
    expect(section()).toBeNull();
  });

  it('SPN-6: the covered content is neither inert nor hidden from assistive technology, and keeps its focus', () => {
    render(SpinHarness, { props: { content: 'button' } });
    const button = screen.getByRole('button', { name: 'Save' });
    expect(container()).not.toHaveAttribute('inert');
    expect(container()).not.toHaveAttribute('aria-hidden');
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('SPN-6: the content is reachable when the Spin starts: a focused element keeps focus', async () => {
    const { rerender } = render(SpinHarness, { props: { content: 'button', spinning: false } });
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    await rerender({ spinning: true });
    expect(document.activeElement).toBe(button);
  });

  it('SPN-7: a Spin inside the covered content works on its own; its section is not the outer one', () => {
    render(SpinHarness, { props: { content: 'nested', description: 'outer' } });
    const roots = document.querySelectorAll('.ads-spin');
    expect(roots).toHaveLength(2);
    const outer = roots[0];
    // Only the outer root has a section; the inner Spin is a standalone element inside the outer container.
    expect(outer.querySelectorAll(':scope > .ads-spin-section')).toHaveLength(1);
    const inner = screen.getByTestId('inner');
    expect(inner).toHaveClass('ads-spin-standalone');
    expect(container()).toContainElement(inner);
  });

  it('SPN-7: a finished inner Spin takes no room and the outer content is still there', () => {
    render(SpinHarness, { props: { content: 'nested', innerSpinning: false } });
    expect(screen.queryByTestId('inner')).toBeNull();
    expect(screen.getByTestId('outer-content')).toBeInTheDocument();
  });
});

describe('Spin: delay (SPN-8 to SPN-12)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const elapse = (ms: number) => {
    vi.advanceTimersByTime(ms);
    flushSync();
  };

  it('SPN-8: the indicator is not there before the delay and is there after it', () => {
    render(Spin, { props: { delay: 500 } });
    expect(queryStatus()).toBeNull();
    elapse(499);
    expect(queryStatus()).toBeNull();
    elapse(1);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-8: spinning at mount waits for the delay too', () => {
    render(Spin, { props: { delay: 300, spinning: true } });
    expect(queryStatus()).toBeNull();
    elapse(300);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-8: turning spinning off inside the delay: it is never shown', async () => {
    const { rerender } = render(Spin, { props: { delay: 500, spinning: false } });
    await rerender({ spinning: true });
    elapse(100);
    await rerender({ spinning: false });
    elapse(1000);
    expect(queryStatus()).toBeNull();
  });

  it('SPN-8: turning spinning off hides at once, with no waiting', async () => {
    const { rerender } = render(Spin, { props: { delay: 200 } });
    elapse(200);
    expect(status()).toBeInTheDocument();
    await rerender({ spinning: false });
    expect(queryStatus()).toBeNull();
  });

  it('SPN-8: off and on again starts a new delay (NG-ZORRO 5926)', async () => {
    const { rerender } = render(Spin, { props: { delay: 500 } });
    elapse(500);
    expect(status()).toBeInTheDocument();
    await rerender({ spinning: false });
    elapse(100);
    await rerender({ spinning: true });
    expect(queryStatus()).toBeNull();
    elapse(499);
    expect(queryStatus()).toBeNull();
    elapse(1);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-9: a repeated true neither starts another timer nor restarts the pending one (React issue 6383)', async () => {
    const { rerender } = render(Spin, { props: { delay: 500 } });
    expect(vi.getTimerCount()).toBe(1);
    elapse(300);
    await rerender({ spinning: true });
    await rerender({ spinning: true, description: 'x' });
    expect(vi.getTimerCount()).toBe(1);
    elapse(200);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-10: during the delay the embedded content is live: no section, no busy state', async () => {
    render(SpinHarness, { props: { content: 'text', delay: 500 } });
    expect(section()).toBeNull();
    expect(container()).not.toHaveClass('ads-spin-container-busy');
    expect(container()).not.toHaveAttribute('aria-busy');
    elapse(500);
    expect(container()).toHaveClass('ads-spin-container-busy');
    expect(container()).toHaveAttribute('aria-busy', 'true');
    expect(section()).not.toBeNull();
  });

  it('SPN-10: delay of 0 and no delay: no timer, the first render shows the indicator', () => {
    render(Spin, { props: { delay: 0 } });
    expect(status()).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('SPN-10: no delay prop: no timer', () => {
    render(Spin);
    expect(vi.getTimerCount()).toBe(0);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-10: a delay changed while pending restarts the wait with the new value', async () => {
    const { rerender } = render(Spin, { props: { delay: 1000 } });
    elapse(100);
    await rerender({ delay: 200 });
    elapse(199);
    expect(queryStatus()).toBeNull();
    elapse(1);
    expect(status()).toBeInTheDocument();
  });

  it('SPN-10: a delay changed to 0 while pending shows the indicator at once', async () => {
    const { rerender } = render(Spin, { props: { delay: 1000 } });
    await rerender({ delay: 0 });
    expect(status()).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('SPN-11: a negative, infinite, NaN or non-number delay throws a RangeError outside production', () => {
    for (const delay of [-1, Infinity, NaN, '500' as never]) {
      let caught: unknown;
      try {
        render(Spin, { props: { delay } });
      } catch (error) {
        caught = error;
      }
      expect(caught, String(delay)).toBeInstanceOf(RangeError);
      expect((caught as Error).message).toContain('Spin delay must be a finite number of milliseconds, 0 or more.');
    }
  });

  it('SPN-11: in production an invalid delay means no delay', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Spin, { props: { delay: -5 } });
    expect(status()).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('SPN-12: the timer is cleared when the component is destroyed', () => {
    const { unmount } = render(Spin, { props: { delay: 500 } });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Spin: size (SPN-13)', () => {
  it.each([
    ['small', 'ads-spin-small'],
    ['medium', 'ads-spin-medium'],
    ['large', 'ads-spin-large'],
    ['default', 'ads-spin-medium']
  ] as const)('size %s: %s (default is an alias of medium)', (size, className) => {
    render(Spin, { props: { size } });
    expect(status()).toHaveClass(className);
  });

  it('size: the default is medium', () => {
    render(Spin);
    expect(status()).toHaveClass('ads-spin-medium');
  });

  it('size: an invalid value throws a RangeError outside production', () => {
    let caught: unknown;
    try {
      render(Spin, { props: { size: 'huge' as never } });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(RangeError);
    expect((caught as Error).message).toContain('Spin size must be one of: small, medium, large, default.');
  });

  it('size: an invalid value falls back to medium in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Spin, { props: { size: 'huge' as never } });
    expect(status()).toHaveClass('ads-spin-medium');
  });

  it('size: the embedded and the fullscreen root carry the size class too', () => {
    const { unmount } = render(SpinHarness, { props: { content: 'text', size: 'large' } });
    expect(document.querySelector('.ads-spin')).toHaveClass('ads-spin-large');
    unmount();
    render(Spin, { props: { fullscreen: true, size: 'small' } });
    expect(status()).toHaveClass('ads-spin-small');
  });
});

describe('Spin: description (SPN-13)', () => {
  it('description: a string is text, never HTML', () => {
    render(Spin, { props: { description: '<b>x</b> & "y"' } });
    expect(description()).toHaveTextContent('<b>x</b> & "y"');
    expect(description()?.querySelector('b')).toBeNull();
  });

  it('description: an empty string counts as not given', () => {
    render(Spin, { props: { description: '' } });
    expect(description()).toBeNull();
  });

  it('description: a snippet is rendered', () => {
    render(Spin, { props: { description: raw('<em>soon</em>') } });
    expect(description()?.querySelector('em')).toHaveTextContent('soon');
  });

  it('description: a change is rendered', async () => {
    const { rerender } = render(Spin, { props: { description: 'one' } });
    await rerender({ description: 'two' });
    expect(description()).toHaveTextContent('two');
    await rerender({ description: undefined });
    expect(description()).toBeNull();
  });

  it('description: the font size and the part exist at every size', () => {
    render(Spin, { props: { description: 'x', size: 'large' } });
    expect(description()).toHaveClass('ads-spin-description');
  });

  it('description: embedded: it is inside the status section', () => {
    render(SpinHarness, { props: { content: 'text', description: 'Loading' } });
    expect(status()).toContainElement(description() as HTMLElement);
  });
});

describe('Spin: indicator (SPN-14)', () => {
  it('indicator: replaces the default dots, in the indicator part, hidden from assistive technology', () => {
    render(Spin, { props: { indicator: raw('<i data-testid="mine">*</i>') } });
    expect(dots(document)).toHaveLength(0);
    expect(indicator()).toContainElement(screen.getByTestId('mine'));
    expect(indicator()).toHaveAttribute('aria-hidden', 'true');
    expect(indicator()).toHaveClass('ads-spin-indicator-custom');
  });

  it('indicator: a change back to nothing draws the dots again', async () => {
    const { rerender } = render(Spin, { props: { indicator: raw('<i>*</i>') } });
    await rerender({ indicator: undefined });
    expect(dots(document)).toHaveLength(4);
  });

  it('indicator: it wins over percent', () => {
    render(Spin, { props: { indicator: raw('<i data-testid="mine">*</i>'), percent: 40 } });
    expect(ring()).toBeNull();
    expect(screen.getByTestId('mine')).toBeInTheDocument();
  });
});

describe('Spin: percent (SPN-15, SPN-16)', () => {
  it('percent: a number draws the ring in place of the dots', () => {
    render(Spin, { props: { percent: 40, 'aria-label': 'Upload' } });
    expect(ring()).not.toBeNull();
    expect(drawing()).not.toBeNull();
    expect(dots(document)).toHaveLength(0);
    // 100 is the path length; the arc is 40 of it, so the part that is hidden is 60.
    expect(arc()).toHaveAttribute('stroke-dashoffset', '60');
    expect(arc()).toHaveAttribute('stroke-dasharray', '100 100');
  });

  it('percent: the ring is the progressbar, with the values', () => {
    render(Spin, { props: { percent: 40, 'aria-label': 'Upload' } });
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toBe(ring());
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
  });

  it('percent: the indicator part is the progressbar and is not hidden; the drawing inside is', () => {
    render(Spin, { props: { percent: 10, 'aria-label': 'Upload' } });
    expect(indicator()).toBe(ring());
    expect(indicator()).not.toHaveAttribute('aria-hidden');
    expect(drawing()).toHaveAttribute('aria-hidden', 'true');
  });

  it('percent: a change is rendered (the value and the arc)', async () => {
    const { rerender } = render(Spin, { props: { percent: 10, 'aria-label': 'Upload' } });
    await rerender({ percent: 75 });
    expect(ring()).toHaveAttribute('aria-valuenow', '75');
    expect(arc()).toHaveAttribute('stroke-dashoffset', '25');
  });

  it('percent: a number is clamped to 0 to 100', async () => {
    const { rerender } = render(Spin, { props: { percent: -20, 'aria-label': 'Upload' } });
    expect(ring()).toHaveAttribute('aria-valuenow', '0');
    expect(arc()).toHaveAttribute('stroke-dashoffset', '100');
    await rerender({ percent: 150 });
    expect(ring()).toHaveAttribute('aria-valuenow', '100');
    expect(arc()).toHaveAttribute('stroke-dashoffset', '0');
    await rerender({ percent: Infinity });
    expect(ring()).toHaveAttribute('aria-valuenow', '100');
  });

  it("percent: 'auto' is an indeterminate ring: no aria-valuenow, a turning arc, no timer", () => {
    vi.useFakeTimers();
    render(Spin, { props: { percent: 'auto', 'aria-label': 'Upload' } });
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(drawing()).toHaveClass('ads-spin-ring-auto');
    expect(arc()).toHaveAttribute('stroke-dasharray', '30 70');
    expect(arc()).toHaveAttribute('stroke-dashoffset', '0');
    expect(vi.getTimerCount()).toBe(0);
  });

  it("percent: from 'auto' to a number and back", async () => {
    const { rerender } = render(Spin, { props: { percent: 'auto', 'aria-label': 'Upload' } });
    await rerender({ percent: 50 });
    expect(ring()).toHaveAttribute('aria-valuenow', '50');
    expect(drawing()).not.toHaveClass('ads-spin-ring-auto');
    await rerender({ percent: 'auto' });
    expect(ring()).not.toHaveAttribute('aria-valuenow');
  });

  it('percent: removing it draws the dots again', async () => {
    const { rerender } = render(Spin, { props: { percent: 50, 'aria-label': 'Upload' } });
    await rerender({ percent: undefined });
    expect(ring()).toBeNull();
    expect(dots(document)).toHaveLength(4);
  });

  it('percent: NaN or a non-number throws a RangeError outside production', () => {
    for (const percent of [NaN, '50' as never, null as never]) {
      let caught: unknown;
      try {
        render(Spin, { props: { percent } });
      } catch (error) {
        caught = error;
      }
      expect(caught, String(percent)).toBeInstanceOf(RangeError);
      expect((caught as Error).message).toContain("Spin percent must be a number or 'auto'.");
    }
  });

  it('percent: in production an invalid value is ignored and the dots are drawn', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Spin, { props: { percent: NaN } });
    expect(ring()).toBeNull();
    expect(dots(document)).toHaveLength(4);
  });

  it('SPN-16: the ring is named by the description when there is one (a string or a snippet)', () => {
    const { unmount } = render(Spin, { props: { percent: 30, description: 'Uploading' } });
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBe(ring());
    expect(ring()).not.toHaveAttribute('aria-label');
    unmount();
    render(Spin, { props: { percent: 30, description: raw('<b>Sending</b>') } });
    expect(screen.getByRole('progressbar', { name: 'Sending' })).toBe(ring());
  });

  it('SPN-16: the ring takes the name of aria-labelledby when there is no description', () => {
    render(Spin, { props: { percent: 30, 'aria-labelledby': 'title' } });
    expect(ring()).toHaveAttribute('aria-labelledby', 'title');
  });

  it('SPN-16: a ring with no description and no name has no name (and development warns)', () => {
    render(Spin, { props: { percent: 30 } });
    expect(ring()).not.toHaveAttribute('aria-label');
    expect(ring()).not.toHaveAttribute('aria-labelledby');
    expect(console.warn).toHaveBeenCalledOnce();
  });
});

describe('Spin: fullscreen (SPN-17 to SPN-20)', () => {
  it('SPN-17: a backdrop root that is the status element, with the section inside it', () => {
    render(Spin, { props: { fullscreen: true, description: 'Loading' } });
    expect(appClasses(status())).toEqual(['ads-spin', 'ads-spin-fullscreen', 'ads-spin-medium']);
    expect(status().children).toHaveLength(1);
    expect(status().firstElementChild).toHaveClass('ads-spin-section');
    expect(dots(status())).toHaveLength(4);
    expect(description()).toHaveTextContent('Loading');
  });

  it('SPN-18: not spinning: nothing is rendered, so nothing can block the page', () => {
    const { container: host } = render(Spin, { props: { fullscreen: true, spinning: false } });
    expect(host.querySelector('.ads-spin')).toBeNull();
  });

  it('SPN-18: inside the delay nothing is rendered either, then the backdrop appears', () => {
    vi.useFakeTimers();
    render(Spin, { props: { fullscreen: true, delay: 400 } });
    expect(queryStatus()).toBeNull();
    vi.advanceTimersByTime(400);
    flushSync();
    expect(status()).toHaveClass('ads-spin-fullscreen');
  });

  it('SPN-19: it is drawn where the component is (no portal): the backdrop is inside the host', () => {
    const { container: host } = render(Spin, { props: { fullscreen: true } });
    expect(host).toContainElement(status());
  });

  it('SPN-20: fullscreen with children: both are drawn, and the content is not dimmed', () => {
    render(SpinHarness, { props: { fullscreen: true, content: 'text' } });
    expect(status()).toHaveClass('ads-spin-fullscreen');
    expect(container()).toContainElement(screen.getByTestId('content'));
    expect(container()).not.toHaveClass('ads-spin-container-busy');
    expect(container()).not.toHaveAttribute('aria-busy');
  });

  it('SPN-20: fullscreen with children and not spinning: only the content', () => {
    render(SpinHarness, { props: { fullscreen: true, spinning: false, content: 'text' } });
    expect(queryStatus()).toBeNull();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('SPN-25: the shape follows the props: standalone, embedded and fullscreen', async () => {
    const { rerender } = render(SpinHarness, { props: { content: 'none' } });
    expect(status()).toHaveClass('ads-spin-standalone');
    await rerender({ content: 'text' });
    expect(document.querySelector('.ads-spin')).toHaveClass('ads-spin-embedded');
    await rerender({ fullscreen: true });
    expect(status()).toHaveClass('ads-spin-fullscreen');
    await rerender({ fullscreen: false, content: 'none' });
    expect(status()).toHaveClass('ads-spin-standalone');
  });
});

describe('Spin: classNames, styles, class and style (SPN-24)', () => {
  const classNames = {
    root: 'my-root',
    section: 'my-section',
    indicator: 'my-indicator',
    description: 'my-description',
    container: 'my-container'
  };
  const styles = {
    root: { 'min-width': '10px' },
    section: { 'padding-top': '3px' },
    indicator: { '--my-var': 'red' },
    description: { 'letter-spacing': '2px' },
    container: { 'flex-grow': 3 }
  };

  it('classNames: a standalone Spin has one element for the root and the section', () => {
    render(Spin, { props: { classNames, description: 'x' } });
    expect(status()).toHaveClass('ads-spin', 'my-root', 'my-section');
    expect(indicator()).toHaveClass('ads-spin-indicator', 'my-indicator');
    expect(description()).toHaveClass('ads-spin-description', 'my-description');
  });

  it('styles: standalone: the root and the section styles both land on the one element, section after root', () => {
    render(Spin, { props: { styles: { root: { padding: '1px' }, section: { padding: '2px' } }, description: 'x' } });
    expect(styleOf(status()).padding).toBe('2px');
  });

  it('classNames: embedded: the root, the section, the indicator, the description and the container get their classes', () => {
    render(SpinHarness, { props: { content: 'text', classNames, description: 'x' } });
    const root = document.querySelector('.ads-spin') as HTMLElement;
    expect(root).toHaveClass('my-root');
    expect(root).not.toHaveClass('my-section');
    expect(section()).toHaveClass('my-section');
    expect(indicator()).toHaveClass('my-indicator');
    expect(description()).toHaveClass('my-description');
    expect(container()).toHaveClass('ads-spin-container', 'my-container');
  });

  it('styles: embedded: each part gets its inline style, kebab-case keys, custom properties, numbers as they are', () => {
    render(SpinHarness, { props: { content: 'text', styles, description: 'x' } });
    const root = document.querySelector('.ads-spin') as HTMLElement;
    expect(styleOf(root).minWidth).toBe('10px');
    expect(styleOf(section()).paddingTop).toBe('3px');
    expect(styleOf(indicator()).getPropertyValue('--my-var')).toBe('red');
    expect(styleOf(description()).letterSpacing).toBe('2px');
    expect(styleOf(container()).flexGrow).toBe('3');
  });

  it('classNames and styles: the fullscreen backdrop, section and content container take them', () => {
    render(SpinHarness, { props: { fullscreen: true, content: 'text', classNames, styles, description: 'x' } });
    expect(status()).toHaveClass('my-root');
    expect(section()).toHaveClass('my-section');
    expect(styleOf(section()).paddingTop).toBe('3px');
    expect(container()).toHaveClass('my-container');
    expect(styleOf(container()).flexGrow).toBe('3');
  });

  it('class and style: appended to the root, with classNames.root; styles.root is written after style', () => {
    render(Spin, { props: { class: 'mine', classNames: { root: 'other' }, style: 'margin: 1px; color: red', styles: { root: { color: 'blue' } } } });
    expect(status()).toHaveClass('ads-spin', 'mine', 'other');
    expect(styleOf(status()).margin).toBe('1px');
    expect(styleOf(status()).color).toBe('blue');
  });

  it('styles: a change is applied and clearing it removes the style attribute', async () => {
    const { rerender } = render(Spin, { props: { styles: { root: { color: 'red' } } } });
    expect(styleOf(status()).color).toBe('red');
    await rerender({ styles: undefined });
    expect(status()).not.toHaveAttribute('style');
  });
});

describe('Spin: native attributes and accessibility (A11y)', () => {
  it('forwards id, title and data-* to the root', () => {
    render(Spin, { props: { id: 'busy', title: 'wait', 'data-extra': '1' } as never });
    expect(status()).toHaveAttribute('id', 'busy');
    expect(status()).toHaveAttribute('title', 'wait');
    expect(status()).toHaveAttribute('data-extra', '1');
  });

  it('forwards the attributes to the root of an embedded Spin, not to the section', () => {
    render(SpinHarness, { props: { content: 'text', id: 'outer', 'data-extra': '1' } as never });
    expect(document.querySelector('.ads-spin')).toHaveAttribute('id', 'outer');
    expect(section()).not.toHaveAttribute('id');
  });

  it('the role is the component\'s own and cannot be replaced', () => {
    render(Spin, { props: { role: 'alert' } as never });
    expect(status()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a consumer aria-busy and aria-live are forwarded to the root', () => {
    render(Spin, { props: { 'aria-busy': true, 'aria-live': 'assertive' } as never });
    expect(status()).toHaveAttribute('aria-busy', 'true');
    expect(status()).toHaveAttribute('aria-live', 'assertive');
  });

  it('aria-label names the status element of a standalone Spin', () => {
    render(Spin, { props: { 'aria-label': 'Saving' } });
    expect(screen.getByRole('status', { name: 'Saving' })).toBe(status());
  });

  it('aria-label names the section of an embedded Spin, not the root', () => {
    render(SpinHarness, { props: { content: 'text', 'aria-label': 'Saving' } as never });
    expect(screen.getByRole('status', { name: 'Saving' })).toBe(section());
    expect(document.querySelector('.ads-spin')).not.toHaveAttribute('aria-label');
  });

  it('aria-label and aria-labelledby name the fullscreen backdrop', () => {
    const { unmount } = render(Spin, { props: { fullscreen: true, 'aria-label': 'Loading the page' } });
    expect(screen.getByRole('status', { name: 'Loading the page' })).toBe(status());
    unmount();
    render(Spin, { props: { fullscreen: true, 'aria-labelledby': 'heading' } });
    expect(status()).toHaveAttribute('aria-labelledby', 'heading');
  });

  it('the description is in the status element, which is what a screen reader announces', () => {
    render(Spin, { props: { description: 'Loading the report' } });
    expect(status()).toHaveTextContent('Loading the report');
  });

  it('every graphic is hidden from assistive technology: the dots and a custom indicator', () => {
    const { unmount } = render(Spin);
    expect(document.querySelector('.ads-spin-indicator')).toHaveAttribute('aria-hidden', 'true');
    unmount();
    render(Spin, { props: { indicator: raw('<svg></svg>') } });
    expect(document.querySelector('.ads-spin-indicator')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Spin: development warning for a silent Spin', () => {
  it('warns once when a spinning Spin has neither a description nor a name', async () => {
    const { rerender } = render(Spin);
    expect(console.warn).toHaveBeenCalledOnce();
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain('Spin: it has no description and no accessible name');
    await rerender({ size: 'large' });
    await rerender({ spinning: false });
    await rerender({ spinning: true });
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it.each([
    ['a description', { description: 'Loading' }],
    ['a snippet description', { description: raw('<b>x</b>') }],
    ['aria-label', { 'aria-label': 'Loading' }],
    ['aria-labelledby', { 'aria-labelledby': 'title' }]
  ])('does not warn with %s', (_name, props) => {
    render(Spin, { props });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not warn when it is not spinning', () => {
    render(Spin, { props: { spinning: false } });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(Spin);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('waits until the indicator is shown: nothing is said during the delay', () => {
    vi.useFakeTimers();
    render(Spin, { props: { delay: 100 } });
    expect(console.warn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    flushSync();
    expect(console.warn).toHaveBeenCalledOnce();
  });
});

describe('Spin: reactivity (SPN-25)', () => {
  it('size, description, percent, indicator and fullscreen re-render correctly', async () => {
    const { rerender } = render(Spin, { props: { 'aria-label': 'x' } });
    await rerender({ size: 'small' });
    expect(status()).toHaveClass('ads-spin-small');
    await rerender({ size: 'large', description: 'later' });
    expect(status()).toHaveClass('ads-spin-large');
    expect(description()).toHaveTextContent('later');
    await rerender({ percent: 20 });
    expect(ring()).toHaveAttribute('aria-valuenow', '20');
    await rerender({ indicator: raw('<i>*</i>') });
    expect(ring()).toBeNull();
    await rerender({ indicator: undefined, percent: undefined, fullscreen: true });
    expect(status()).toHaveClass('ads-spin-fullscreen');
    expect(dots(document)).toHaveLength(4);
  });
});

describe('Spin: axe', () => {
  const states: Array<[string, Record<string, unknown>, 'none' | 'text']> = [
    ['standalone with a description', { description: 'Loading' }, 'none'],
    ['standalone with an aria-label', { 'aria-label': 'Loading' }, 'none'],
    ['small and large', { description: 'Loading', size: 'large' }, 'none'],
    ['embedded', { description: 'Loading' }, 'text'],
    ['embedded with an aria-label', { 'aria-label': 'Loading' }, 'text'],
    ['embedded and not spinning', { spinning: false }, 'text'],
    ['fullscreen', { fullscreen: true, description: 'Loading' }, 'none'],
    ['a custom indicator', { indicator: raw('<svg aria-hidden="true"></svg>'), description: 'Loading' }, 'none'],
    ['a ring with a number', { percent: 40, description: 'Uploading' }, 'none'],
    ['an indeterminate ring', { percent: 'auto', 'aria-label': 'Uploading' }, 'none']
  ];

  it.each(states)('has no axe violations: %s', async (_name, props, content) => {
    const { container: host } = render(SpinHarness, { props: { ...props, content } as never });
    const results = await axe.run(host, AXE_OPTIONS);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  it('a progressbar without a name is reported (negative check)', async () => {
    const { container: host } = render(Spin, { props: { percent: 40 } });
    const results = await axe.run(host, AXE_OPTIONS);
    expect(results.violations.map((v) => v.id)).toContain('aria-progressbar-name');
  });
});
