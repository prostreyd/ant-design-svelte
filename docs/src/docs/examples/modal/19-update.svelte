<script lang="ts">
  import { Button, modal } from 'svelte-ant-design';

  // The handle changes the dialog in place (an object is merged, a function gets the previous options) and closes it.
  function countdown() {
    let seconds = 5;
    const handle = modal.success({ title: 'Done', content: `This closes in ${seconds} seconds.`, okText: 'Close now' });
    const timer = setInterval(() => {
      seconds -= 1;
      if (seconds <= 0) {
        clearInterval(timer);
        handle.destroy();
      } else {
        handle.update({ content: `This closes in ${seconds} seconds.` });
      }
    }, 1000);
    void handle.then(() => clearInterval(timer));
  }

  function several() {
    modal.info({ title: 'One' });
    modal.warning({ title: 'Two' });
    modal.error({ title: 'Three' });
  }
</script>

<div class="stack">
  <div class="row">
    <Button onclick={countdown}>update and destroy</Button>
    <Button onclick={several}>Open three</Button>
    <Button onclick={() => modal.destroyAll()}>destroyAll</Button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
</style>
