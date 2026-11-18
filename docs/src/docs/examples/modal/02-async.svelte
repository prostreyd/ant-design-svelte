<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  // 1. The app closes the Modal: it sets `confirmLoading` while it saves, and `open = false` when it is done.
  let manualOpen = $state(false);
  let saving = $state(false);
  function save() {
    saving = true;
    setTimeout(() => {
      saving = false;
      manualOpen = false;
    }, 1500);
  }

  // 2. `closeOnOk`: the Modal waits for the Promise that onok returns, and closes when it is resolved. A reject keeps it open.
  let waitOpen = $state(false);
  let attempts = $state(0);
  const submit = () =>
    new Promise<void>((resolve, reject) =>
      setTimeout(() => {
        attempts += 1;
        if (attempts % 2 === 1) reject(new Error('The first try fails'));
        else resolve();
      }, 1200)
    );
</script>

<div class="stack">
  <div class="field">
    <span class="caption">confirmLoading: the app closes it</span>
    <Button type="primary" onclick={() => (manualOpen = true)}>Open (confirmLoading)</Button>
    <Modal bind:open={manualOpen} title="Save the file" confirmLoading={saving} onok={save}>
      <p>The OK button is loading for 1.5 seconds, then the Modal closes.</p>
    </Modal>
  </div>

  <div class="field">
    <span class="caption">closeOnOk: onok returns a Promise (the first try is rejected)</span>
    <Button onclick={() => (waitOpen = true)}>Open (closeOnOk)</Button>
    <Modal bind:open={waitOpen} title="Send the form" closeOnOk onok={submit}>
      <p>Press OK. The first try fails and the Modal stays open; the second succeeds and closes it.</p>
    </Modal>
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
