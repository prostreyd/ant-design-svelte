import { resolveOption } from '../internal/options.js';
import { ensureLayer } from './layer.js';
import { destroyMessages, openMessage, setConfig } from './store.js';
import {
  MESSAGE_TYPES,
  type MessageApi,
  type MessageContent,
  type MessageHandle,
  type MessageOptions,
  type MessageType,
  type MessageTypedOptions
} from './types.js';

function open(options: MessageOptions, type: MessageType): MessageHandle {
  const handle = openMessage(options, type);
  ensureLayer();
  return handle;
}

/** `message.success('Saved', 2, onclose)` or `message.success({ content: 'Saved', duration: 2 })`. */
function typed(type: MessageType) {
  return (first: MessageContent | MessageTypedOptions, duration?: number, onclose?: () => void): MessageHandle => {
    const options: MessageOptions =
      typeof first === 'object' && first !== null ? { ...first } : { content: first, duration, onclose };
    return open(options, type);
  };
}

/**
 * The messages. Every call returns a function that closes the message, which is also thenable (the promise resolves
 * when the message starts to close).
 */
export const message: MessageApi = {
  open(options) {
    const type = resolveOption('Message', 'type', options.type ?? 'info', MESSAGE_TYPES, 'info');
    return open({ ...options }, type);
  },
  info: typed('info'),
  success: typed('success'),
  error: typed('error'),
  warning: typed('warning'),
  loading: typed('loading'),
  destroy(key) {
    destroyMessages(key);
  },
  config(options) {
    setConfig(options);
  }
};
