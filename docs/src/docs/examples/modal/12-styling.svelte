<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let open = $state(false);
</script>

<!-- class and style go on the dialog box; wrapClassName on the scroll area; classNames and styles address the parts. -->
<div class="stack">
  <Button onclick={() => (open = true)}>Styled</Button>
  <Modal
    bind:open
    title="Styled"
    class="fancy-box"
    style="width: 480px"
    wrapClassName="fancy-wrap"
    classNames={{ header: 'fancy-header' }}
    styles={{ title: { 'letter-spacing': '0.04em' }, body: { color: 'var(--ads-color-primary)' } }}
  >
    <p>The parts: root, mask, wrapper, dialog, content, close, header, title, body and footer.</p>
  </Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  /* Classes of this example: they are passed to the Modal, which is drawn in the body, so the rules are global. */
  :global(.fancy-box) {
    outline: 2px dashed var(--ads-color-primary);
    outline-offset: 4px;
  }

  :global(.fancy-wrap) {
    background: rgba(22, 119, 255, 0.06);
  }

  :global(.fancy-header) {
    padding-bottom: 8px;
    border-bottom: 1px solid var(--ads-color-border);
  }
</style>
