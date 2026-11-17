<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<!-- Hover (a mouse or a pen, not a touch) and focus inside the message stop the timer; it goes on with the time that
     was left. The timer also waits while the page is hidden. -->
<div class="stack">
  <div class="field">
    <span class="caption">pauseOnHover (the default), duration 3: keep the pointer over it</span>
    <Button onclick={() => message.info('Hover me: I stay while you do')}>pauses</Button>
  </div>

  <div class="field">
    <span class="caption">pauseOnHover: false</span>
    <Button onclick={() => message.info({ content: 'I go on, whatever you do', pauseOnHover: false })}>does not pause</Button>
  </div>

  <div class="field">
    <span class="caption">closable, duration 3: Tab into it, and it waits for you</span>
    <Button onclick={() => message.warning({ content: 'Focus inside holds the timer', closable: true })}>holds on focus</Button>
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
