<script lang="ts">
  import { isProduction } from '../internal/env.js';
  import ModalLayer from './ModalLayer.svelte';
  import { getSnapshot, registerHost, subscribe, type HostRegistration } from './store.js';

  /**
   * Draws the static dialogs (`modal.confirm(...)` and the others). Place it once, near the root of the app: the dialogs are then drawn
   * where it stands, so that they see the context of the app. With no host in the app the library draws them itself, in the body.
   */

  // Registered while the component lives, and only in a browser: module state on a server is shared by every request.
  // The host mounted last is the active one; another renders nothing, and says so once while developing.
  let registration = $state.raw<HostRegistration | null>(null);
  $effect(() => {
    const host = registerHost();
    registration = host;
    let warned = false;
    const check = () => {
      if (getSnapshot().activeHost !== host.id && !warned && !isProduction()) {
        warned = true;
        console.warn('ModalHost: another ModalHost is mounted and draws the dialogs; this one draws nothing.');
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
</script>

{#if registration}
  <ModalLayer hostId={registration.id} />
{/if}
