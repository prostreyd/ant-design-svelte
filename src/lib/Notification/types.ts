import type { Snippet } from 'svelte';
import type { CloseReason } from '../internal/list/listStore.js';
import type { SemanticStyle } from '../internal/semantic.js';

/** The kinds of notification. `open` has no type icon and no type word. */
export const NOTIFICATION_TYPES = ['open', 'info', 'success', 'error', 'warning'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** The six places of the window. */
export const NOTIFICATION_PLACEMENTS = ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'] as const;

export type NotificationPlacement = (typeof NOTIFICATION_PLACEMENTS)[number];

/** The title, the description or the actions: text, a number (`0` is shown), or a Snippet. */
export type NotificationContent = string | number | Snippet;

/** A custom icon (a string is shown as text, for example an emoji), or `false` for none. */
export type NotificationIcon = string | Snippet | false;

/** Why a notification closed: its time ran out, the user closed it, the limit pushed it out, or code closed it. */
export type NotificationCloseReason = CloseReason;

/** The named parts of one notification that `classNames` and `styles` address. */
export type NotificationSemanticName = 'root' | 'icon' | 'section' | 'title' | 'description' | 'actions' | 'close' | 'progress';

/** The two parts of a place, addressed on `NotificationHost` and `notification.config()` only. */
export type NotificationListSemanticName = 'list' | 'listContent';

export type NotificationClassNames = Partial<Record<NotificationSemanticName, string>>;
export type NotificationStyles = Partial<Record<NotificationSemanticName, SemanticStyle>>;

export type NotificationConfigClassNames = Partial<Record<NotificationSemanticName | NotificationListSemanticName, string>>;
export type NotificationConfigStyles = Partial<Record<NotificationSemanticName | NotificationListSemanticName, SemanticStyle>>;

/** The words read by a screen reader: the type before the title, and the name of the close button. */
export type NotificationLabels = Partial<Record<NotificationType | 'close', string>>;

/** Where the layer is moved to: an element, or a function that returns it. Default `document.body`. */
export type NotificationContainer = HTMLElement | (() => HTMLElement);

/** `true` and the default collapse the notifications of a place into a pile after 3 of them; `{ threshold }` changes the number; `false` turns it off. */
export type NotificationStack = boolean | { threshold?: number };

/** Attributes put on the box: `data-*` and `aria-*`. */
export type NotificationProps = Record<`data-${string}` | `aria-${string}`, string>;

export interface NotificationOptions {
  /** The first line. `0` is shown. */
  title: NotificationContent;
  /** The text under the title. */
  description?: NotificationContent;
  /** Under the text, at the inline end: usually buttons. The elements you put here are the ones a keyboard user reaches. */
  actions?: NotificationContent;
  /** Replaces the icon of the type; `false` removes the icon. */
  icon?: NotificationIcon;
  /** Seconds before the notification goes away. `0` and `false` keep it until it is closed. Default 4.5. */
  duration?: number | false;
  /** The same key as an open notification updates that notification in place. Default: generated. */
  key?: string | number;
  /** Where it stands. Default `'topRight'`, or the one of the host. */
  placement?: NotificationPlacement;
  /** Shows the close button. Default `true`. */
  closable?: boolean;
  /** Replaces the cross of the close button; `false` removes the button. */
  closeIcon?: NotificationIcon;
  /** Shows a strip that runs down with the time left. Default `false`. */
  showProgress?: boolean;
  /** Keeps the timer still while the pointer is over the notification. Default `true`. */
  pauseOnHover?: boolean;
  /** Overrides the role: `alert` interrupts a screen reader, `status` waits for it. Default: `alert` for `error` and `warning`, else `status`. */
  role?: 'alert' | 'status';
  /** Extra classes of the box. */
  class?: string;
  /** Inline style of the box: a string or an object of CSS properties. */
  style?: string | SemanticStyle;
  classNames?: NotificationClassNames;
  styles?: NotificationStyles;
  /** `data-*` and `aria-*` attributes of the box. */
  props?: NotificationProps;
  /** Called with the event when the box is clicked (not when its close button is). */
  onclick?: (event: MouseEvent) => void;
  /** Called once, when the notification starts to close, with the reason. */
  onclose?: (reason: NotificationCloseReason) => void;
}

export interface NotificationConfig {
  /** Distance of the top places from the top of the window. A number is pixels. Default 24. */
  top?: number | string;
  /** Distance of the bottom places from the bottom of the window. A number is pixels. Default 24. */
  bottom?: number | string;
  /** The place of every notification that does not say one. Default `'topRight'`. */
  placement?: NotificationPlacement;
  /** Default duration in seconds. `0` and `false` never close. Default 4.5. */
  duration?: number | false;
  /** At most this many open notifications in all places together; the oldest is closed to make room. Default: no limit. */
  maxCount?: number;
  /** Where the layer is moved to. Default `document.body`. */
  container?: NotificationContainer;
  /** Default of `closable`. */
  closable?: boolean;
  /** Default of `closeIcon`. */
  closeIcon?: NotificationIcon;
  /** Default of `showProgress`. */
  showProgress?: boolean;
  /** Default of `pauseOnHover`. */
  pauseOnHover?: boolean;
  labels?: NotificationLabels;
  classNames?: NotificationConfigClassNames;
  styles?: NotificationConfigStyles;
  /** On by default: past 3 notifications in a place the older ones lie behind the newest. */
  stack?: NotificationStack;
}

/** A function that closes the notification. */
export type NotificationHandle = () => void;

/** What `notification` offers. */
export interface NotificationApi {
  /** A notification with no type icon. */
  open(options: NotificationOptions): NotificationHandle;
  info(options: NotificationOptions): NotificationHandle;
  success(options: NotificationOptions): NotificationHandle;
  error(options: NotificationOptions): NotificationHandle;
  warning(options: NotificationOptions): NotificationHandle;
  /** Closes the notification with this key, or every notification. */
  destroy(key?: string | number): void;
  /** Sets defaults for every notification from now on. */
  config(options: NotificationConfig): void;
}
