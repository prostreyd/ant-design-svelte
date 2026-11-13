<script lang="ts">
  // A silhouette of a component for its card on the overview page, drawn here from plain shapes (nothing is copied
  // from anywhere): outlines, no text. It shows what the component is without being it.
  // `tone` is for a card that says whether the component is ready: blue lines for a ready one, grey dashes for a
  // planned one. Without it the silhouette keeps its neutral lines.
  let { name, tone }: { name: string; tone?: 'ready' | 'planned' } = $props();
</script>

<svg class="wire" class:ready={tone === 'ready'} class:planned={tone === 'planned'} viewBox="0 0 160 76" aria-hidden="true" focusable="false">
  {#if name === 'Button'}
    <rect class="fl" x="24" y="10" width="112" height="26" rx="7" /><path d="M62 23h36" />
    <rect x="40" y="44" width="80" height="22" rx="6" /><path d="M64 55h32" />
  {:else if name === 'Input'}
    <rect x="18" y="14" width="124" height="28" rx="6" /><path d="M30 28h48" /><path class="fl" d="M86 22v12" />
    <path d="M18 58h64" />
  {:else if name === 'Checkbox'}
    <rect class="fl" x="30" y="10" width="20" height="20" rx="5" /><path d="m35 20 4 4 7-8" /><path d="M60 20h62" />
    <rect x="30" y="44" width="20" height="20" rx="5" /><path d="M60 54h48" />
  {:else if name === 'Switch'}
    <rect class="fl" x="22" y="10" width="48" height="26" rx="13" /><circle class="acc" cx="57" cy="23" r="8" /><path d="M84 23h52" />
    <rect x="22" y="44" width="48" height="26" rx="13" /><circle cx="35" cy="57" r="8" /><path d="M84 57h40" />
  {:else if name === 'Select'}
    <rect x="20" y="8" width="120" height="22" rx="5" /><path d="M32 19h46M118 17l4 4 4-4" />
    <rect class="fl" x="20" y="36" width="120" height="32" rx="5" /><path d="M32 47h58M32 58h40M118 56l3 3 7-7" />
  {:else if name === 'Typography'}
    <rect class="fl" x="14" y="10" width="64" height="10" rx="3" />
    <path d="M14 34h132M14 46h132M14 58h92" />
  {:else if name === 'Icon'}
    <circle cx="34" cy="38" r="14" />
    <rect x="66" y="24" width="28" height="28" rx="7" />
    <path class="fl" d="M114 52l14-28 14 28z" />
  {:else if name === 'Menu'}
    <rect class="fl" x="20" y="8" width="120" height="16" rx="5" />
    <rect x="28" y="12" width="8" height="8" rx="2" /><path d="M44 16h46" />
    <rect x="28" y="33" width="8" height="8" rx="2" /><path d="M44 37h60" />
    <rect x="28" y="54" width="8" height="8" rx="2" /><path d="M44 58h38" />
  {:else if name === 'Dropdown'}
    <rect x="28" y="8" width="104" height="20" rx="5" /><path d="M40 18h40M112 16l4 4 4-4" />
    <rect class="fl" x="28" y="34" width="104" height="34" rx="5" /><path d="M40 45h60M40 57h44" />
  {:else if name === 'Radio'}
    <circle cx="32" cy="14" r="7" /><circle class="acc" cx="32" cy="14" r="3" /><path d="M50 14h70" />
    <circle cx="32" cy="38" r="7" /><path d="M50 38h56" />
    <circle cx="32" cy="62" r="7" /><path d="M50 62h64" />
  {:else if name === 'DatePicker'}
    <rect x="20" y="6" width="120" height="20" rx="5" /><rect x="28" y="12" width="9" height="9" rx="2" /><path d="M46 16h44" />
    <path d="M30 40h4M47 40h4M64 40h4M81 40h4M98 40h4M115 40h4M132 40h4M30 52h4M47 52h4M64 52h4M81 52h4M98 52h4M115 52h4M132 52h4M30 64h4M47 64h4M64 64h4" />
    <circle class="acc" cx="83" cy="52" r="4" />
  {:else if name === 'Form'}
    <path d="M16 14h30M16 38h30" /><rect x="58" y="6" width="86" height="16" rx="4" /><rect x="58" y="30" width="86" height="16" rx="4" />
    <rect class="fl" x="58" y="54" width="40" height="16" rx="4" />
  {:else if name === 'Table'}
    <rect x="14" y="8" width="132" height="60" rx="6" /><rect class="fl" x="14" y="8" width="132" height="16" rx="6" />
    <path d="M14 38h132M14 53h132M58 8v60M102 8v60" />
  {:else if name === 'Tooltip'}
    <rect class="fl" x="38" y="8" width="84" height="26" rx="6" /><path d="M50 21h40M72 34l8 7 8-7" />
    <rect x="62" y="48" width="36" height="18" rx="5" />
  {:else if name === 'Modal'}
    <rect class="dash" x="8" y="4" width="144" height="68" rx="8" />
    <rect x="32" y="12" width="96" height="52" rx="6" /><path d="M42 24h40M42 36h72" />
    <rect x="76" y="46" width="22" height="12" rx="3" /><rect class="fl" x="102" y="46" width="22" height="12" rx="3" />
  {:else if name === 'Drawer'}
    <rect x="10" y="6" width="140" height="64" rx="6" />
    <path class="fl" d="M88 6h56a6 6 0 0 1 6 6v52a6 6 0 0 1-6 6H88z" /><path d="M98 20h40M98 32h40M98 44h26" />
  {:else if name === 'Message'}
    <rect class="dash" x="8" y="4" width="144" height="68" rx="8" />
    <rect class="fl" x="32" y="12" width="96" height="24" rx="12" /><circle class="acc" cx="48" cy="24" r="4" /><path d="M60 24h52" />
  {:else if name === 'Notification'}
    <rect class="dash" x="8" y="4" width="144" height="68" rx="8" />
    <rect class="fl" x="64" y="12" width="86" height="42" rx="6" /><path d="M74 24h40M74 38h60M136 22l6 6M142 22l-6 6" />
  {/if}
</svg>

<style>
  .wire {
    display: block;
    width: 100%;
    max-width: 150px;
    height: auto;
    color: var(--ads-color-text-secondary);
  }

  .wire :global(*) {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .wire :global(.fl) {
    fill: var(--s-primary-soft);
    stroke: var(--s-link);
  }

  .wire :global(.acc) {
    fill: var(--s-link);
    stroke: none;
  }

  .wire.ready {
    color: var(--s-link);
  }

  .wire.planned :global(*) {
    stroke-dasharray: 4 3;
  }

  .wire.planned :global(.fl) {
    fill: none;
    stroke: currentColor;
  }

  .wire.planned :global(.acc) {
    fill: currentColor;
  }

  .wire :global(.dash) {
    stroke-dasharray: 3 4;
    opacity: 0.7;
  }
</style>
