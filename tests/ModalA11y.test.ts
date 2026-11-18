// Accessibility of the Modal and of the static dialogs with axe-core (specs/modal.md, A11y; rule 7: no critical or serious violation).
// The colors are checked on the token sets (tests/tokens.test.ts); jsdom has no layout, so the contrast and region rules are off.
import { cleanup, render, screen } from '@testing-library/svelte';
import axe from 'axe-core';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { removeLayer } from '../src/lib/Modal/layer';
import { modal } from '../src/lib/Modal/modal';
import { resetModals } from '../src/lib/Modal/store';
import ModalHarness from './fixtures/ModalHarness.svelte';

afterEach(() => {
  cleanup();
  removeLayer();
  resetModals();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

/** The violations that matter: critical and serious ones. */
async function violations(): Promise<string[]> {
  const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  return result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious').map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.html).join(' ')}`);
}

describe('a11y: the Modal written in markup', () => {
  it('an open Modal with a title, a body, a close button and both footer buttons has no serious violation', async () => {
    render(ModalHarness, { props: { open: true, title: 'Basic Modal' } });
    await tick();
    expect(screen.getByRole('dialog', { name: 'Basic Modal' })).toBeTruthy();
    expect(await violations()).toEqual([]);
  });

  it('a Modal with no title and an aria-label has no serious violation', async () => {
    render(ModalHarness, { props: { open: true, 'aria-label': 'Settings' } });
    await tick();
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeTruthy();
    expect(await violations()).toEqual([]);
  });

  it('a Modal with no footer, no close button and a custom footer has no serious violation', async () => {
    render(ModalHarness, { props: { open: true, title: 'Plain', footer: null, closable: false } });
    await tick();
    expect(await violations()).toEqual([]);
    cleanup();
    render(ModalHarness, { props: { open: true, title: 'Custom', footerAs: 'parts' } });
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('a Modal with a loading OK button and a disabled close button has no serious violation', async () => {
    render(ModalHarness, { props: { open: true, title: 'Saving', confirmLoading: true, closable: { disabled: true } } });
    await tick();
    expect(await violations()).toEqual([]);
  });

  it('the check can fail: a dialog with no title and no aria-label has no name, and axe says so', async () => {
    render(ModalHarness, { props: { open: true } });
    await tick();
    expect((await violations()).join(' ')).toContain('aria-dialog-name');
  });

  it('the page behind an open Modal is out of reach, and the dialog is modal and named', async () => {
    const { container } = render(ModalHarness, { props: { open: true, title: 'Basic Modal' } });
    await tick();
    const dialog = screen.getByRole('dialog', { name: 'Basic Modal' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    // What the test rendered into the page is hidden from assistive technology while the layer is open.
    expect(container.hasAttribute('inert') || container.getAttribute('aria-hidden') === 'true' || container.parentElement?.hasAttribute('inert')).toBe(true);
  });
});

describe('a11y: the static dialogs', () => {
  for (const kind of ['confirm', 'info', 'success', 'warning', 'error'] as const) {
    it(`${kind} is an alert dialog with a name and a description and has no serious violation`, async () => {
      modal[kind]({ title: `A ${kind} title`, content: `A ${kind} text` });
      await tick();
      await tick();
      const dialog = screen.getByRole('alertdialog', { name: `A ${kind} title` });
      expect(dialog.getAttribute('aria-describedby')).toBeTruthy();
      expect(document.getElementById(dialog.getAttribute('aria-describedby')!)?.textContent).toBe(`A ${kind} text`);
      expect(await violations()).toEqual([]);
    });
  }

  it('a static dialog with a custom icon, a Cancel button and a close button has no serious violation', async () => {
    modal.confirm({ title: 'Install?', content: 'It takes a minute.', okCancel: true, closable: true, icon: '!' });
    await tick();
    await tick();
    expect(await violations()).toEqual([]);
  });
});
