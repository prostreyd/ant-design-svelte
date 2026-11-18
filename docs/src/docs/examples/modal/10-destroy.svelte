<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let kept = $state(false);
  let fresh = $state(false);
  let present = $state(false);
  let log = $state<string[]>([]);
</script>

<div class="stack">
  <div class="field">
    <span class="caption">default: the content is kept</span>
    <Button onclick={() => (kept = true)}>Keeps what you typed</Button>
    <Modal bind:open={kept} title="Kept"><input aria-label="Draft" placeholder="Type, close, open again" /></Modal>
  </div>

  <div class="field">
    <span class="caption">destroyOnHidden</span>
    <Button onclick={() => (fresh = true)}>Starts empty each time</Button>
    <Modal bind:open={fresh} title="Fresh" destroyOnHidden><input aria-label="Draft" placeholder="Type, close, open again" /></Modal>
  </div>

  <div class="field">
    <span class="caption">forceRender, onafteropenchange and onafterclose</span>
    <Button onclick={() => (present = true)}>Present from the start</Button>
    <Modal
      bind:open={present}
      title="Present"
      forceRender
      onafteropenchange={(opened) => (log = [...log, opened ? 'opened' : 'closed'])}
      onafterclose={() => (log = [...log, 'afterclose'])}
    >
      <p>It was in the page, hidden, before this first opening.</p>
    </Modal>
    <output class="caption">{log.join(' → ')}</output>
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
