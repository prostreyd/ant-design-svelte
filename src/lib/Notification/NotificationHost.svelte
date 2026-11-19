<script lang="ts">
  import { untrack } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import NotificationLayer from './NotificationLayer.svelte';
  import { getSnapshot, registerHost, subscribe, type HostRegistration } from './store.js';
  import type { NotificationConfig } from './types.js';

  /**
   * Draws the notifications. Place it once, near the root of the app; `notification.success({ ... })` and the other calls, from
   * anywhere, then show up in it. Its props are the settings of every notification it draws (`NotificationConfig`, described in
   * `types.ts`) and win over `notification.config()`.
   */
  let {
    top,
    bottom,
    placement,
    duration,
    maxCount,
    container,
    closable,
    closeIcon,
    showProgress,
    pauseOnHover,
    labels,
    classNames,
    styles,
    stack
  }: NotificationConfig = $props();

  const settings = () => ({
    top,
    bottom,
    placement,
    duration,
    maxCount,
    container,
    closable,
    closeIcon,
    showProgress,
    pauseOnHover,
    labels,
    classNames,
    styles,
    stack
  });

  // Registered while the component lives, and only in a browser: module state on a server is shared by every request.
  // The host mounted last is the active one; another renders nothing, and says so once while developing.
  let registration = $state.raw<HostRegistration | null>(null);
  $effect(() => {
    const host = registerHost(untrack(settings));
    registration = host;
    let warned = false;
    const check = () => {
      if (getSnapshot().activeHost !== host.id && !warned && !isProduction()) {
        warned = true;
        console.warn('NotificationHost: another NotificationHost is mounted and draws the notifications; this one draws nothing.');
      }
    };
    check();
    const stop = subscribe(check);
    return () => {
      stop();
      registration = null;
      host.dispose();
    };
  });

  $effect(() => {
    registration?.update(settings());
  });
</script>

{#if registration}
  <NotificationLayer hostId={registration.id} />
{/if}
