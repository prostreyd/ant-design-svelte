<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<!-- `showProgress` draws a strip that runs down with the time left. It is drawn from the timer that closes the notification, so it
     stands still while the pointer or the focus holds it. It is decorative: it is not announced. -->
<div class="stack">
  <div class="field">
    <span class="caption">showProgress, duration 8: hold the pointer over it</span>
    <Button onclick={() => notification.info({ title: 'Progress', description: 'The strip waits when the timer waits.', showProgress: true, duration: 8 })}>
      with a strip
    </Button>
  </div>
  <div class="field">
    <span class="caption">showProgress, pauseOnHover: false</span>
    <Button onclick={() => notification.info({ title: 'No pause', description: 'It goes on while you hold the pointer.', showProgress: true, pauseOnHover: false, duration: 8 })}>
      does not pause
    </Button>
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
