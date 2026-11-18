// The dimming layer of the Modal (specs/modal.md, P21): one mask for the page, however many Modals are open over it.
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { removeLayer } from '../src/lib/Modal/layer';
import { resetModals } from '../src/lib/Modal/store';
import ModalHarness from './fixtures/ModalHarness.svelte';

afterEach(() => {
  cleanup();
  removeLayer();
  resetModals();
  document.body.innerHTML = '';
});

const masks = () => document.querySelectorAll('.ads-modal-mask').length;

describe('the mask of a Modal opened over another one (P21)', () => {
  it('one Modal draws one mask', async () => {
    render(ModalHarness, { props: { open: true, title: 'One' } });
    await tick();
    expect(masks()).toBe(1);
  });

  it('a Modal opened over a Modal draws no second mask, and both dialogs stay open', async () => {
    const lower = render(ModalHarness, { props: { open: true, title: 'Lower' } });
    await tick();
    const upper = render(ModalHarness, { props: { open: true, title: 'Upper' } });
    await tick();
    await tick();
    expect(masks()).toBe(1);
    expect(document.querySelectorAll('[role="dialog"]').length).toBe(2);
    lower.unmount();
    upper.unmount();
  });

  it('a Modal without a mask draws none, and a Modal over it still draws its own', async () => {
    const plain = render(ModalHarness, { props: { open: true, title: 'Plain', mask: false } });
    await tick();
    expect(masks()).toBe(0);
    const top = render(ModalHarness, { props: { open: true, title: 'Top' } });
    await tick();
    expect(masks()).toBe(1);
    plain.unmount();
    top.unmount();
  });
});
