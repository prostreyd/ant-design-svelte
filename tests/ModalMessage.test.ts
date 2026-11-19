// A Modal and the layer of a Message (specs/modal.md, D4; specs/overlay.md, O2): a message stays reachable above an open Modal.
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { removeLayer } from '../src/lib/Message/layer';
import { message } from '../src/lib/Message/message';
import { resetMessages } from '../src/lib/Message/store';
import { removeLayer as removeModalLayer } from '../src/lib/Modal/layer';
import { modal } from '../src/lib/Modal/modal';
import { resetModals } from '../src/lib/Modal/store';
import ModalHarness from './fixtures/ModalHarness.svelte';

afterEach(() => {
  cleanup();
  removeLayer();
  removeModalLayer();
  resetMessages();
  resetModals();
  document.body.innerHTML = '';
  document.body.removeAttribute('style');
});

const messageLayer = () => document.querySelector<HTMLElement>('.ads-message-list');

describe('a message and an open Modal', () => {
  it('a message that is on the page when a Modal opens stays reachable, and the page behind the Modal does not', async () => {
    message.info('Saved earlier', 0);
    await tick();
    render(ModalHarness, { open: true, title: 'T' });
    await tick();
    expect(messageLayer()).not.toBeNull();
    expect(messageLayer()?.closest('[inert]')).toBeNull();
    expect(screen.getByTestId('page').closest('[inert]')).not.toBeNull();
  });

  it('a message opened by the OK button of a dialog is there and reachable (it makes its layer after the dialog opened)', async () => {
    modal.confirm({
      title: 'Save?',
      onok: () => {
        message.success('Saved', 0);
      }
    });
    await tick();
    expect(messageLayer()).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await tick();
    await tick();
    expect(messageLayer()).not.toBeNull();
    expect(messageLayer()?.closest('[inert]')).toBeNull();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });
});
