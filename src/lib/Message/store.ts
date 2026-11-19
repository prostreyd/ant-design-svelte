/**
 * The global list of messages (specs/message.md).
 *
 * A message is opened by a call from code, from anywhere, so the list lives in a module and not in a component:
 * `message.success('Saved')` adds to it, and a `MessageHost` (or the layer the library creates itself) renders it.
 * The list itself (the records, the keys, the timers, the limit, the hosts, the server no-op) is the shared part
 * `internal/list/listStore.ts` (specs/overlay.md, LS1 to LS9); this file says what a message is: the fields of its
 * record, its settings and their defaults, the form of the handle a call returns.
 */
import { isProduction } from '../internal/env.js';
import {
  createListStore,
  isServer,
  mergeParts,
  validCount,
  validDuration,
  type ListEntryRef,
  type ListHostRegistration,
  type ListRecord,
  type ListSnapshot
} from '../internal/list/listStore.js';
import type {
  MessageConfig,
  MessageConfigClassNames,
  MessageConfigStyles,
  MessageContainer,
  MessageContent,
  MessageHandle,
  MessageIcon,
  MessageLabels,
  MessageOptions,
  MessageType
} from './types.js';

export { EXIT_FALLBACK, type PauseReason } from '../internal/list/listStore.js';

export const DEFAULT_DURATION = 3;
export const DEFAULT_THRESHOLD = 3;

export const DEFAULT_LABELS: Required<MessageLabels> = {
  info: 'Info',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  loading: 'Loading',
  close: 'Close'
};

/** What a host renders for one message. A new object for every change, so that a comparison by identity is enough. */
export interface MessageRecord extends ListRecord {
  readonly type: MessageType;
  readonly content: MessageContent;
  readonly icon: MessageIcon | undefined;
  readonly closable: boolean | undefined;
  readonly pauseOnHover: boolean;
  readonly class: string | undefined;
  readonly style: MessageOptions['style'];
  readonly classNames: MessageOptions['classNames'];
  readonly styles: MessageOptions['styles'];
  readonly onclick: MessageOptions['onclick'];
}

/** The settings after the three layers are merged: `MessageHost` props over `message.config()` over the defaults. */
export interface MessageSettings {
  /** `undefined` leaves the distance to the token `--ads-message-top`. */
  top: number | string | undefined;
  duration: number;
  maxCount: number | undefined;
  container: MessageContainer | undefined;
  closable: boolean;
  labels: Required<MessageLabels>;
  classNames: MessageConfigClassNames;
  styles: MessageConfigStyles;
  stack: { enabled: boolean; threshold: number };
}

export type Snapshot = ListSnapshot<MessageRecord, MessageSettings>;
export type HostRegistration = ListHostRegistration<MessageConfig>;

function warn(text: string): void {
  if (!isProduction()) console.warn(`Message: ${text}`);
}

function resolveSettings(host: MessageConfig, config: MessageConfig): MessageSettings {
  const pick = <K extends keyof MessageConfig>(name: K): MessageConfig[K] => (host[name] !== undefined ? host[name] : config[name]);

  const durationValue = pick('duration');
  if (durationValue !== undefined && !validDuration(durationValue)) {
    warn('`duration` must be a non-negative number of seconds; the default is used.');
  }
  const stackValue = pick('stack');
  const threshold = typeof stackValue === 'object' && stackValue !== null ? stackValue.threshold : undefined;

  return {
    top: pick('top'),
    duration: validDuration(durationValue) ? durationValue : DEFAULT_DURATION,
    maxCount: validCount(pick('maxCount')) ? Math.floor(pick('maxCount') as number) : undefined,
    container: pick('container'),
    closable: pick('closable') ?? false,
    labels: { ...DEFAULT_LABELS, ...config.labels, ...host.labels },
    classNames: mergeParts(config.classNames, host.classNames),
    styles: mergeParts(config.styles, host.styles),
    stack: {
      enabled: stackValue === true || (typeof stackValue === 'object' && stackValue !== null),
      threshold: validCount(threshold) ? Math.floor(threshold) : DEFAULT_THRESHOLD
    }
  };
}

const store = createListStore<MessageRecord, MessageConfig, MessageSettings>({
  keyPrefix: 'ads-message',
  mergedKeys: ['labels', 'classNames', 'styles'],
  resolve: resolveSettings
});

/** The current state. The same object until something changes. */
export const getSnapshot = store.getSnapshot;

/** Calls `listener` after every change. Returns the function that stops it. */
export const subscribe = store.subscribe;

/** Holds or releases the timer of a message for a reason (the pointer is over it, focus is in it, ...). */
export const setPaused = store.setPaused;

/** Closes the open message with this id (the close button and Escape of a message use it). */
export const closeById = (id: number): void => store.closeById(id);

/** Removes a closing message once its exit motion is over. A message that is still open is not touched. */
export const finalize = store.finalize;

/** Closes the open message with this key, or every open message. */
export const destroyMessages = store.destroy;

/** Sets defaults for every message. A value of `undefined` takes a setting back to its default. */
export const setConfig = store.setConfig;

/**
 * Registers a `MessageHost`. The host mounted last is the active one: it renders the messages, and its props are
 * the settings that win over `message.config()`. Another host renders nothing.
 */
export const registerHost = store.registerHost;

/** Forgets everything: the messages, the timers, the settings and the hosts. For tests. */
export const resetMessages = store.reset;

// ---- the calls -------------------------------------------------------------------------------------------------------

function handleFor(ref: ListEntryRef): MessageHandle {
  return Object.assign(() => ref.close(), {
    then: <A = void, B = never>(
      onfulfilled?: ((value: void) => A | PromiseLike<A>) | null,
      onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
    ): PromiseLike<A | B> => ref.closed.then(onfulfilled, onrejected)
  });
}

/** What a call returns where there is no page (a server): closing does nothing, and the promise is already settled. */
function inertHandle(): MessageHandle {
  return Object.assign(() => {}, {
    then: <A = void, B = never>(
      onfulfilled?: ((value: void) => A | PromiseLike<A>) | null,
      onrejected?: ((reason: unknown) => B | PromiseLike<B>) | null
    ): PromiseLike<A | B> => Promise.resolve().then(onfulfilled, onrejected)
  });
}

/** Opens a message, or updates the open one with the same key. */
export function openMessage(options: MessageOptions, type: MessageType): MessageHandle {
  if (isServer()) return inertHandle();

  const settings = store.settings();
  const duration = validDuration(options.duration) ? options.duration : settings.duration;
  if (options.duration !== undefined && !validDuration(options.duration)) {
    warn('`duration` must be a non-negative number of seconds; the default is used.');
  }

  const { onclose } = options;
  const ref = store.open({
    key: options.key,
    duration,
    // The reason of the close is not passed on yet: `onclose` of a message takes no argument.
    onclose: onclose ? () => onclose() : undefined,
    build: (base) => ({
      ...base,
      type,
      content: options.content,
      icon: options.icon,
      closable: options.closable,
      pauseOnHover: options.pauseOnHover !== false,
      class: options.class,
      style: options.style,
      classNames: options.classNames,
      styles: options.styles,
      onclick: options.onclick
    })
  });
  // `open` gives nothing back only where there is no page, and that case returned above.
  return handleFor(ref as ListEntryRef);
}
