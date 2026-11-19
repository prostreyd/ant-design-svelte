<script lang="ts">
  import { Button, modal } from 'svelte-ant-design';

  let tries = $state(0);

  // onok may return a Promise: the OK button waits (it is loading), a resolve closes the dialog, a reject keeps it open.
  function save() {
    modal.confirm({
      title: 'Save the changes?',
      content: 'The first try always fails.',
      onok: () =>
        new Promise<void>((resolve, reject) =>
          setTimeout(() => {
            tries += 1;
            return tries % 2 === 1 ? reject(new Error('failed')) : resolve();
          }, 1200)
        )
    });
  }

  // oncancel may return a Promise too: the Cancel button waits, and the dialog closes when it is resolved.
  function leave() {
    modal.confirm({ title: 'Discard the draft?', content: 'Cancel takes a moment.', oncancel: () => new Promise((resolve) => setTimeout(resolve, 1000)) });
  }
</script>

<div class="stack">
  <div class="row">
    <Button onclick={save}>OK waits for a Promise</Button>
    <Button onclick={leave}>Cancel waits for a Promise</Button>
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
