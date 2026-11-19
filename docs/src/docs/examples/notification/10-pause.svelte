<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<!-- Hover (a mouse or a pen, not a touch) and focus inside stop the timer; it goes on with the time that was left. The timer also
     waits while the page is hidden. -->
<div class="stack">
  <div class="field">
    <span class="caption">pauseOnHover (the default), duration 5: keep the pointer over it</span>
    <Button onclick={() => notification.info({ title: 'Hover me', description: 'I stay while you do.', duration: 5 })}>pauses</Button>
  </div>
  <div class="field">
    <span class="caption">pauseOnHover: false</span>
    <Button onclick={() => notification.info({ title: 'I go on', description: 'Whatever you do.', duration: 5, pauseOnHover: false })}>does not pause</Button>
  </div>
  <div class="field">
    <span class="caption">duration 5: Tab to the close button, and it waits for you</span>
    <Button onclick={() => notification.warning({ title: 'Focus holds it', description: 'Focus inside the box stops the timer.', duration: 5 })}>holds on focus</Button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
