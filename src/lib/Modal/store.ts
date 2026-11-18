/**
 * The static dialogs that are open (specs/modal.md, R15): a list in module state, the hosts that may draw it, and what a call
 * returns. There is no state on a server (it would be shared by every request): a call there returns a handle that resolves
 * `false` and keeps nothing.
 */
import type { ModalFuncOptions, ModalHandle, ModalKind } from './types.js';

export interface ModalRecord {
  id: number;
  kind: ModalKind;
  options: ModalFuncOptions;
  /** `false` from the moment it starts to close; the record goes when the leave animation is over (`finalize`). */
  open: boolean;
}

export interface Snapshot {
  records: readonly ModalRecord[];
  /** The id of the host that draws the dialogs, or `undefined` when none is mounted (the layer of the library draws them). */
  activeHost: number | undefined;
}

export interface HostRegistration {
  id: number;
  dispose: () => void;
}

interface Entry {
  record: ModalRecord;
  settle: (value: boolean) => void;
  settled: boolean;
  promise: Promise<boolean>;
}

let entries: Entry[] = [];
const hosts: number[] = [];
const listeners = new Set<() => void>();
let nextId = 0;
let nextHostId = 0;
let snapshot: Snapshot | null = null;

const isServer = (): boolean => typeof document === 'undefined';

function notify(): void {
  snapshot = null;
  for (const listener of [...listeners]) listener();
}

/** The same object until something changes, so that a component can compare and subscribe cheaply. */
export function getSnapshot(): Snapshot {
  snapshot ??= { records: entries.map((entry) => entry.record), activeHost: hosts[hosts.length - 1] };
  return snapshot;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const find = (id: number): Entry | undefined => entries.find((entry) => entry.record.id === id);

/** Starts to close a dialog and says how: `true` is OK. It resolves the handle at once and the layer plays the leave animation. */
export function closeEntry(id: number, result: boolean): void {
  const entry = find(id);
  if (!entry || entry.settled) return;
  entry.settled = true;
  entry.record = { ...entry.record, open: false };
  entry.settle(result);
  notify();
}

/** Takes a dialog out of the list, once its leave animation is over. */
export function finalize(id: number): void {
  const before = entries.length;
  entries = entries.filter((entry) => entry.record.id !== id);
  if (entries.length !== before) notify();
}

function update(id: number, patch: ModalFuncOptions | ((previous: ModalFuncOptions) => ModalFuncOptions)): void {
  const entry = find(id);
  if (!entry || entry.settled) return;
  const next = typeof patch === 'function' ? patch(entry.record.options) : patch;
  entry.record = { ...entry.record, options: { ...entry.record.options, ...next } };
  notify();
}

/** A handle for a call that did nothing (on a server): it can be awaited and resolves `false`. */
function inertHandle(): ModalHandle {
  return { destroy() {}, update() {}, then: (onfulfilled, onrejected) => Promise.resolve(false).then(onfulfilled, onrejected) };
}

export function openModal(options: ModalFuncOptions, kind: ModalKind): ModalHandle {
  if (isServer()) return inertHandle();
  let settle!: (value: boolean) => void;
  const promise = new Promise<boolean>((resolve) => (settle = resolve));
  const id = ++nextId;
  entries.push({ record: { id, kind, options: { ...options }, open: true }, settle, settled: false, promise });
  notify();
  return {
    destroy: () => closeEntry(id, false),
    update: (patch) => update(id, patch),
    then: (onfulfilled, onrejected) => promise.then(onfulfilled, onrejected)
  };
}

/** Closes every static dialog that is open. */
export function destroyAll(): void {
  for (const entry of [...entries]) closeEntry(entry.record.id, false);
}

/** A `ModalHost` mounts: it draws the dialogs from now on, the one mounted last. */
export function registerHost(): HostRegistration {
  const id = ++nextHostId;
  hosts.push(id);
  notify();
  return {
    id,
    dispose() {
      const index = hosts.indexOf(id);
      if (index !== -1) hosts.splice(index, 1);
      notify();
    }
  };
}

/** Forgets everything. For tests. */
export function resetModals(): void {
  entries = [];
  hosts.length = 0;
  listeners.clear();
  nextId = 0;
  nextHostId = 0;
  snapshot = null;
}
