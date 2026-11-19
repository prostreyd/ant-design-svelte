import type { Snippet } from 'svelte';
import type { SemanticStyle } from '../internal/semantic.js';

/** The five kinds of message. `loading` shows a spinner and usually lasts until the work is done. */
export const MESSAGE_TYPES = ['info', 'success', 'error', 'warning', 'loading'] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

/** The text or the content of a message. `0` is shown. */
export type MessageContent = string | number | Snippet;

/** A custom icon (a string is shown as text, for example an emoji), or `false` for none. */
export type MessageIcon = string | Snippet | false;

/** The named parts of one message that `classNames` and `styles` address. */
export type MessageSemanticName = 'root' | 'wrapper' | 'icon' | 'title' | 'close';

/** The two parts of the layer, addressed on `MessageHost` and `message.config()` only. */
export type MessageListSemanticName = 'list' | 'listContent';

export type MessageClassNames = Partial<Record<MessageSemanticName, string>>;
export type MessageStyles = Partial<Record<MessageSemanticName, SemanticStyle>>;

export type MessageConfigClassNames = Partial<Record<MessageSemanticName | MessageListSemanticName, string>>;
export type MessageConfigStyles = Partial<Record<MessageSemanticName | MessageListSemanticName, SemanticStyle>>;

/** The words read by a screen reader: the type before the text, and the name of the close button. */
export type MessageLabels = Partial<Record<MessageType | 'close', string>>;

/** Where the layer is moved to: an element, or a function that returns it. Default `document.body`. */
export type MessageContainer = HTMLElement | (() => HTMLElement);

/** `true` collapses the messages into a pile after 3 of them; `{ threshold }` changes the number. */
export type MessageStack = boolean | { threshold?: number };

export interface MessageOptions {
  /** The kind. Only for `message.open`; the other methods fix it. Default `'info'`. */
  type?: MessageType;
  /** The text or the content. */
  content: MessageContent;
  /** Seconds before the message goes away. `0` keeps it until it is closed. Default 3. */
  duration?: number;
  /** Replaces the icon of the type; `false` removes the icon. */
  icon?: MessageIcon;
  /** The same key as an open message updates that message in place. Default: generated. */
  key?: string | number;
  /** Keeps the timer still while the pointer is over the message. Default `true`. */
  pauseOnHover?: boolean;
  /** Shows a close button. */
  closable?: boolean;
  /** Extra classes of the box. */
  class?: string;
  /** Inline style of the box: a string or an object of CSS properties. */
  style?: string | SemanticStyle;
  classNames?: MessageClassNames;
  styles?: MessageStyles;
  /** Called with the event when the box is clicked (not when its close button is). */
  onclick?: (event: MouseEvent) => void;
  /** Called once, when the message starts to close, however it was closed. */
  onclose?: () => void;
}

/** The options of the typed methods (`message.success(...)`): the type is fixed by the method. */
export type MessageTypedOptions = Omit<MessageOptions, 'type'>;

export interface MessageConfig {
  /** Distance of the first message from the top of the window. A number is pixels. Default 8. */
  top?: number | string;
  /** Default duration in seconds. Default 3. */
  duration?: number;
  /** At most this many open messages; the oldest is closed to make room. Default: no limit. */
  maxCount?: number;
  /** Where the layer is moved to. Default `document.body`. */
  container?: MessageContainer;
  /** Default of `closable`. */
  closable?: boolean;
  labels?: MessageLabels;
  classNames?: MessageConfigClassNames;
  styles?: MessageConfigStyles;
  stack?: MessageStack;
}

/**
 * A function that closes the message, which is also thenable: `message.success('a').then(afterClose)`. The promise
 * resolves when the message starts to close. `await message.success('x')` therefore waits for the close.
 */
export type MessageHandle = (() => void) & PromiseLike<void>;

/** What `message` offers. */
export interface MessageApi {
  open(options: MessageOptions): MessageHandle;
  info(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle;
  info(options: MessageTypedOptions): MessageHandle;
  success(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle;
  success(options: MessageTypedOptions): MessageHandle;
  error(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle;
  error(options: MessageTypedOptions): MessageHandle;
  warning(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle;
  warning(options: MessageTypedOptions): MessageHandle;
  loading(content: MessageContent, duration?: number, onclose?: () => void): MessageHandle;
  loading(options: MessageTypedOptions): MessageHandle;
  /** Closes the message with this key, or every message. */
  destroy(key?: string | number): void;
  /** Sets defaults for every message from now on. */
  config(options: MessageConfig): void;
}
