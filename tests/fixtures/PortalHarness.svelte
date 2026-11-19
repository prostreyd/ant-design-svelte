<script lang="ts">
  import { portal, resolveContainer, type PortalContainer } from '../../src/lib/internal/portal/portal.svelte.js';

  /** A panel that an `active` flag moves to the container, and `null` leaves where it is. */
  let {
    active = true,
    container,
    inPlace = false,
    name = 'panel'
  }: { active?: boolean; container?: PortalContainer; inPlace?: boolean; name?: string } = $props();
</script>

<div data-testid="home-{name}">
  <div data-testid={name} {@attach portal(() => (active && !inPlace ? resolveContainer(container) : null))}>panel</div>
</div>
