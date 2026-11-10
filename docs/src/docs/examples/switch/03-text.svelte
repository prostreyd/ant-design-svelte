<script lang="ts">
  import { Switch } from 'svelte-ant-design';
</script>

<!-- Plain text for the two states. -->
<Switch checked checkedChildren="On" unCheckedChildren="Off" aria-label="Power" />
<Switch checkedChildren="On" unCheckedChildren="Off" aria-label="Power, off" />
<!-- The texts differ in width, yet the switch keeps the width of the longer one. -->
<Switch checkedChildren="Happy" unCheckedChildren="Sad" aria-label="Mood" />

<!-- A snippet for icons and other markup. -->
{#snippet check()}
  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 6.5 5 9l5-6" />
  </svg>
{/snippet}

{#snippet cross()}
  <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2">
    <path d="m2.5 2.5 7 7m0-7-7 7" />
  </svg>
{/snippet}

<Switch checked checkedChildren={check} unCheckedChildren={cross} aria-label="Approved" />
<Switch checkedChildren={check} unCheckedChildren={cross} aria-label="Approved, off" />
<Switch size="small" checked checkedChildren="On" unCheckedChildren="Off" aria-label="Small power" />
<span>Nothing around the switches moves when you toggle them.</span>
