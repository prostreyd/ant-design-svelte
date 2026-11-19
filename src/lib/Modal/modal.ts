import { ensureLayer } from './layer.js';
import { destroyAll, openModal } from './store.js';
import type { ModalApi, ModalFuncOptions, ModalHandle, ModalKind } from './types.js';

function open(options: ModalFuncOptions, kind: ModalKind): ModalHandle {
  const handle = openModal(options, kind);
  ensureLayer();
  return handle;
}

/**
 * The static dialogs, called from code (specs/modal.md, "The static family"). Every call opens a dialog and returns a handle at once:
 * `await` it for `true` (OK) or `false` (anything else), `update` it, `destroy` it. With no `<ModalHost />` in the app the library
 * makes its own layer in the body.
 */
export const modal: ModalApi = {
  confirm: (options) => open({ ...options }, 'confirm'),
  info: (options) => open({ ...options }, 'info'),
  success: (options) => open({ ...options }, 'success'),
  warning: (options) => open({ ...options }, 'warning'),
  error: (options) => open({ ...options }, 'error'),
  destroyAll() {
    destroyAll();
  }
};
