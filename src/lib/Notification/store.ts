/**
 * The global list of notifications (specs/notification.md).
 *
 * A notification is opened by a call from code, from anywhere, so the list lives in a module and not in a component:
 * `notification.success({ title })` adds to it, and a `NotificationHost` (or the layer the library creates itself) renders it.
 * The list itself (the records, the keys, the timers, the limit, the hosts, the server no-op) is the shared part
 * `internal/list/listStore.ts` (specs/overlay.md, LS1 to LS10); this file says what a notification is: the fields of its record,
 * its settings and their defaults. The place a notification stands in is a field of the record, and the places are made when the
 * records are drawn: the list has no groups.
 */
import { isProduction } from '../internal/env.js';
import {
  createListStore,
  isServer,
  mergeParts,
  validCount,
  validDuration,
  type ListHostRegistration,
  type ListRecord,
  type ListSnapshot
} from '../internal/list/listStore.js';
import { resolveOption } from '../internal/options.js';
import {
  NOTIFICATION_PLACEMENTS,
  type NotificationConfig,
  type NotificationConfigClassNames,
  type NotificationConfigStyles,
  type NotificationContainer,
  type NotificationHandle,
  type NotificationLabels,
  type NotificationOptions,
  type NotificationPlacement,
  type NotificationType,
  type NotificationIcon
} from './types.js';

export { EXIT_FALLBACK, type PauseReason } from '../internal/list/listStore.js';

export const DEFAULT_DURATION = 4.5;
export const DEFAULT_THRESHOLD = 3;
export const DEFAULT_PLACEMENT: NotificationPlacement = 'topRight';

export const DEFAULT_LABELS: Required<NotificationLabels> = {
  open: '',
  info: 'Info',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  close: 'Close'
};

/** What a host renders for one notification. A new object for every change, so that a comparison by identity is enough. */
export interface NotificationRecord extends ListRecord {
  readonly type: NotificationType;
  readonly title: NotificationOptions['title'];
  readonly description: NotificationOptions['description'];
  readonly actions: NotificationOptions['actions'];
  readonly icon: NotificationIcon | undefined;
  /** `undefined` takes the place of the host or of `notification.config()` when it is drawn. */
  readonly placement: NotificationPlacement | undefined;
  /** Seconds; `0` never closes. The progress strip counts against it. */
  readonly duration: number;
  readonly closable: boolean | undefined;
  readonly closeIcon: NotificationIcon | undefined;
  readonly showProgress: boolean | undefined;
  readonly pauseOnHover: boolean;
  readonly role: NotificationOptions['role'];
  readonly class: string | undefined;
  readonly style: NotificationOptions['style'];
  readonly classNames: NotificationOptions['classNames'];
  readonly styles: NotificationOptions['styles'];
  readonly props: NotificationOptions['props'];
  readonly onclick: NotificationOptions['onclick'];
}

/** The settings after the three layers are merged: `NotificationHost` props over `notification.config()` over the defaults. */
export interface NotificationSettings {
  /** `undefined` leaves the distance to the token `--ads-notification-top`; the same for `bottom`. */
  top: number | string | undefined;
  bottom: number | string | undefined;
  placement: NotificationPlacement;
  duration: number;
  maxCount: number | undefined;
  container: NotificationContainer | undefined;
  closable: boolean;
  closeIcon: NotificationIcon | undefined;
  showProgress: boolean;
  pauseOnHover: boolean;
  labels: Required<NotificationLabels>;
  classNames: NotificationConfigClassNames;
  styles: NotificationConfigStyles;
  stack: { enabled: boolean; threshold: number };
}

export type Snapshot = ListSnapshot<NotificationRecord, NotificationSettings>;
export type HostRegistration = ListHostRegistration<NotificationConfig>;

function warn(text: string): void {
  if (!isProduction()) console.warn(`Notification: ${text}`);
}

/** A duration of a call or of the settings: seconds, or `false` for never. `undefined` when it is not usable. */
function secondsOf(value: unknown): number | undefined {
  if (value === false) return 0;
  return validDuration(value) ? value : undefined;
}

function resolveSettings(host: NotificationConfig, config: NotificationConfig): NotificationSettings {
  const pick = <K extends keyof NotificationConfig>(name: K): NotificationConfig[K] => (host[name] !== undefined ? host[name] : config[name]);

  const durationValue = pick('duration');
  if (durationValue !== undefined && secondsOf(durationValue) === undefined) {
    warn('`duration` must be a non-negative number of seconds, or `false`; the default is used.');
  }
  const stackValue = pick('stack');
  const threshold = typeof stackValue === 'object' && stackValue !== null ? stackValue.threshold : undefined;
  const placementValue = pick('placement');
  if (placementValue !== undefined && !NOTIFICATION_PLACEMENTS.includes(placementValue)) {
    warn(`\`placement\` must be one of: ${NOTIFICATION_PLACEMENTS.join(', ')}; the default is used.`);
  }

  return {
    top: pick('top'),
    bottom: pick('bottom'),
    // A wrong place in the settings is not thrown: it would stay in the store and break every render after it.
    placement: placementValue !== undefined && NOTIFICATION_PLACEMENTS.includes(placementValue) ? placementValue : DEFAULT_PLACEMENT,
    duration: secondsOf(durationValue) ?? DEFAULT_DURATION,
    maxCount: validCount(pick('maxCount')) ? Math.floor(pick('maxCount') as number) : undefined,
    container: pick('container'),
    closable: pick('closable') ?? true,
    closeIcon: pick('closeIcon'),
    showProgress: pick('showProgress') ?? false,
    pauseOnHover: pick('pauseOnHover') ?? true,
    labels: { ...DEFAULT_LABELS, ...config.labels, ...host.labels },
    classNames: mergeParts(config.classNames, host.classNames),
    styles: mergeParts(config.styles, host.styles),
    stack: {
      // On unless it is switched off: `undefined` and `true` are on, an object is on with its own threshold.
      enabled: stackValue !== false,
      threshold: validCount(threshold) ? Math.floor(threshold) : DEFAULT_THRESHOLD
    }
  };
}

const store = createListStore<NotificationRecord, NotificationConfig, NotificationSettings>({
  keyPrefix: 'ads-notification',
  mergedKeys: ['labels', 'classNames', 'styles'],
  resolve: resolveSettings
});

/** The current state. The same object until something changes. */
export const getSnapshot = store.getSnapshot;

/** Calls `listener` after every change. Returns the function that stops it. */
export const subscribe = store.subscribe;

/** Holds or releases the timer of a notification for a reason (the pointer is over it, focus is in it, ...). */
export const setPaused = store.setPaused;

/** The milliseconds a notification has left before it closes by itself (0 for one that is not in the list); the progress strip draws from it. */
export const timeLeft = (id: number): number => store.timer(id)?.remaining ?? 0;

/** Closes the open notification with this id (the close button and Escape of a notification use it). */
export const closeById = (id: number): void => store.closeById(id);

/** Removes a closing notification once its exit motion is over. A notification that is still open is not touched. */
export const finalize = store.finalize;

/** Closes the open notification with this key, or every open notification. */
export const destroyNotifications = store.destroy;

/** Sets defaults for every notification. A value of `undefined` takes a setting back to its default. */
export const setConfig = store.setConfig;

/**
 * Registers a `NotificationHost`. The host mounted last is the active one: it renders the notifications, and its props are
 * the settings that win over `notification.config()`. Another host renders nothing.
 */
export const registerHost = store.registerHost;

/** Forgets everything: the notifications, the timers, the settings and the hosts. For tests. */
export const resetNotifications = store.reset;

// ---- the calls -------------------------------------------------------------------------------------------------------

/** What a call returns where there is no page (a server): closing does nothing. */
const inertHandle: NotificationHandle = () => {};

/** Opens a notification, or updates the open one with the same key. */
export function openNotification(options: NotificationOptions, type: NotificationType): NotificationHandle {
  if (isServer()) return inertHandle;

  const settings = store.settings();
  const given = secondsOf(options.duration);
  if (options.duration !== undefined && given === undefined) {
    warn('`duration` must be a non-negative number of seconds, or `false`; the default is used.');
  }
  const placement =
    options.placement === undefined
      ? undefined
      : resolveOption('Notification', 'placement', options.placement, NOTIFICATION_PLACEMENTS, DEFAULT_PLACEMENT);
  const duration = given ?? settings.duration;

  const ref = store.open({
    key: options.key,
    duration,
    onclose: options.onclose,
    build: (base) => ({
      ...base,
      type,
      title: options.title,
      description: options.description,
      actions: options.actions,
      icon: options.icon,
      placement,
      duration,
      closable: options.closable,
      closeIcon: options.closeIcon,
      showProgress: options.showProgress,
      pauseOnHover: options.pauseOnHover ?? settings.pauseOnHover,
      role: options.role,
      class: options.class,
      style: options.style,
      classNames: options.classNames,
      styles: options.styles,
      props: options.props,
      onclick: options.onclick
    })
  });
  // `open` gives nothing back only where there is no page, and that case returned above.
  return () => ref?.close();
}
