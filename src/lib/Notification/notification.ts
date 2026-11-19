import { ensureLayer } from './layer.js';
import { destroyNotifications, openNotification, setConfig } from './store.js';
import type { NotificationApi, NotificationHandle, NotificationOptions, NotificationType } from './types.js';

function open(options: NotificationOptions, type: NotificationType): NotificationHandle {
  const handle = openNotification({ ...options }, type);
  ensureLayer();
  return handle;
}

/** The notifications. Every call returns a function that closes the notification. */
export const notification: NotificationApi = {
  open: (options) => open(options, 'open'),
  info: (options) => open(options, 'info'),
  success: (options) => open(options, 'success'),
  error: (options) => open(options, 'error'),
  warning: (options) => open(options, 'warning'),
  destroy(key) {
    destroyNotifications(key);
  },
  config(options) {
    setConfig(options);
  }
};
