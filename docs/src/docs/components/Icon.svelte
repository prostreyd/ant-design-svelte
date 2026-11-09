<script lang="ts">
  export type IconName =
    | 'search' | 'chevron' | 'globe' | 'moon' | 'sun' | 'menu' | 'copy' | 'check' | 'code' | 'github'
    | 'cube' | 'circle-check' | 'dots' | 'layers' | 'close';

  let { name, class: className = '' }: { name: IconName; class?: string } = $props();
</script>

{#if name === 'github'}
  <svg class="i {className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false" style="fill: currentColor; stroke: none">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
  </svg>
{:else}
  <svg class="i {className}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    {#if name === 'search'}<circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" />
    {:else if name === 'chevron'}<path d="m4 6 4 4 4-4" />
    {:else if name === 'globe'}<circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" />
    {:else if name === 'moon'}<path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z" />
    {:else if name === 'sun'}<circle cx="8" cy="8" r="3" /><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    {:else if name === 'menu'}<path d="M2 4h12M2 8h12M2 12h12" />
    {:else if name === 'close'}<path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
    {:else if name === 'copy'}<rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    {:else if name === 'check'}<path d="M3 8.5 6.5 12 13 4.5" />
    {:else if name === 'code'}<path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" />
    {:else if name === 'cube'}<path d="M8 1.5 2 5v6l6 3.5 6-3.5V5L8 1.5Z" /><path d="m2 5 6 3.5L14 5M8 8.5v6" />
    {:else if name === 'circle-check'}<circle cx="8" cy="8" r="6.5" /><path d="m5.5 8.2 1.8 1.8 3.2-3.6" />
    {:else if name === 'dots'}<circle cx="5" cy="5" r="2.5" /><circle cx="11" cy="5" r="2.5" /><circle cx="8" cy="11" r="2.5" />
    {:else if name === 'layers'}<path d="M2.5 5.5 8 2.5l5.5 3L8 8.5l-5.5-3Z" /><path d="m2.5 8.5 5.5 3 5.5-3M2.5 11l5.5 3 5.5-3" />
    {/if}
  </svg>
{/if}
