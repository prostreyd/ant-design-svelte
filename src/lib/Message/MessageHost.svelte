<script lang="ts">
  import { untrack } from 'svelte';
  import { isProduction } from '../internal/env.js';
  import MessageLayer from './MessageLayer.svelte';
  import { getSnapshot, registerHost, subscribe, type HostRegistration } from './store.js';
  import type {
    MessageConfigClassNames,
    MessageConfigStyles,
    MessageContainer,
    MessageLabels,
    MessageStack
  } from './types.js';

  /**
   * Draws the messages. Place it once, near the root of the app; `message.success(...)` and the other calls, from
   * anywhere, then show up in it. Its props are the settings of every message it draws and win over `message.config()`.
   */
  type MessageHostProps = {
    /** Distance of the first message from the top of the window. A number is pixels. Default 8. */
    top?: number | string;
    /** Default duration in seconds. Default 3. */
    duration?: number;
    /** At most this many open messages; the oldest is closed to make room. Default: no limit. */
    maxCount?: number;
    /** Where the layer is moved to. Default `document.body`. */
    container?: MessageContainer;
    /** Shows a close button on every message that does not say otherwise. */
    closable?: boolean;
    /** The type word read before the text, and the name of the close button. Pass a translation here. */
    labels?: MessageLabels;
    classNames?: MessageConfigClassNames;
    styles?: MessageConfigStyles;
    /** Turns the pile on: past 3 messages the rows lie behind the newest; `{ threshold }` sets the number. */
    stack?: MessageStack;
  };

  let { top, duration, maxCount, container, closable, labels, classNames, styles, stack }: MessageHostProps = $props();

  const settings = () => ({ top, duration, maxCount, container, closable, labels, classNames, styles, stack });

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
        console.warn('MessageHost: another MessageHost is mounted and draws the messages; this one draws nothing.');
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
  <MessageLayer hostId={registration.id} />
{/if}
