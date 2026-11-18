// The portal (specs/overlay.md, P1 to P5): the attachment that moves a panel into a container.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveContainer } from '../src/lib/internal/portal/portal.svelte';
import PortalHarness from './fixtures/PortalHarness.svelte';

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

const home = (name = 'panel') => screen.getByTestId(`home-${name}`);
const panel = (name = 'panel') => screen.getByTestId(name);

describe('resolveContainer (P2)', () => {
  it('an element is the container', () => {
    const element = document.createElement('div');
    expect(resolveContainer(element)).toBe(element);
  });

  it('a function is called with the arguments it is given, and its element is the container', () => {
    const element = document.createElement('div');
    const seen: unknown[] = [];
    const container = (...args: unknown[]) => {
      seen.push(...args);
      return element;
    };
    expect(resolveContainer(container, 'anchor')).toBe(element);
    expect(seen).toEqual(['anchor']);
  });

  it('nothing, or a function that returns nothing, is the body', () => {
    expect(resolveContainer(undefined)).toBe(document.body);
    expect(resolveContainer(null)).toBe(document.body);
    expect(resolveContainer(() => null)).toBe(document.body);
    expect(resolveContainer(() => undefined)).toBe(document.body);
  });
});

describe('portal (P1, P3, P4)', () => {
  it('P1: moves the panel out of its place into the body by default', () => {
    render(PortalHarness);
    expect(panel().parentElement).toBe(document.body);
    expect(home().contains(panel())).toBe(false);
  });

  it('P1: moves the panel into an element, and into what a function returns', () => {
    const target = document.createElement('section');
    document.body.append(target);
    render(PortalHarness, { container: target });
    expect(panel().parentElement).toBe(target);
    cleanup();

    const other = document.createElement('article');
    document.body.append(other);
    render(PortalHarness, { container: () => other });
    expect(panel().parentElement).toBe(other);
  });

  it('P1: an inactive panel stays where it is', () => {
    render(PortalHarness, { active: false });
    expect(panel().parentElement).toBe(home());
  });

  it('P2: no target at all leaves the panel in place', () => {
    render(PortalHarness, { inPlace: true });
    expect(panel().parentElement).toBe(home());
  });

  it('P1: becomes active later, and moves then', async () => {
    const { rerender } = render(PortalHarness, { active: false });
    expect(panel().parentElement).toBe(home());
    await rerender({ active: true });
    expect(panel().parentElement).toBe(document.body);
  });

  it('P1: goes last in the container on every activation, so layers of equal z-index stack in the order of opening', async () => {
    const first = render(PortalHarness, { name: 'first', active: false });
    const second = render(PortalHarness, { name: 'second', active: false });
    await first.rerender({ active: true });
    await second.rerender({ active: true });
    expect(document.body.lastElementChild).toBe(panel('second'));
    expect(document.body.contains(panel('first'))).toBe(true);
    // The first one is shown again: it is now above the second.
    await first.rerender({ active: false });
    await first.rerender({ active: true });
    expect(document.body.lastElementChild).toBe(panel('first'));
  });

  it('P1: an active panel is not moved again when its target is read again and is the same', async () => {
    const { rerender } = render(PortalHarness, { name: 'one', container: () => document.body });
    render(PortalHarness, { name: 'two' });
    expect(document.body.lastElementChild).toBe(panel('two'));
    // A new function for the same body: the target is read again, and it has not changed.
    await rerender({ container: () => document.body });
    expect(document.body.lastElementChild).toBe(panel('two'));
  });

  it('P3: follows a container that changes while the panel is active', async () => {
    const one = document.createElement('section');
    const two = document.createElement('article');
    document.body.append(one, two);
    const { rerender } = render(PortalHarness, { container: one });
    expect(panel().parentElement).toBe(one);
    await rerender({ container: two });
    expect(panel().parentElement).toBe(two);
  });

  it('P4: takes the panel out of wherever it is when the owner is destroyed', () => {
    const target = document.createElement('section');
    document.body.append(target);
    const { unmount } = render(PortalHarness, { container: target });
    expect(target.children).toHaveLength(1);
    unmount();
    expect(target.children).toHaveLength(0);
  });
});

describe('portal on the server (P5)', () => {
  it('renders the panel where it is and touches no document', () => {
    const root = join(import.meta.dirname, '..');
    const output = execFileSync(
      process.execPath,
      [join(root, 'tests/helpers/renderOnServer.mjs'), JSON.stringify([{ file: 'tests/fixtures/PortalHarness.svelte', props: {} }])],
      { cwd: root, encoding: 'utf8' }
    );
    const [html] = JSON.parse(output) as string[];
    expect(html).toContain('data-testid="panel"');
  });
});
