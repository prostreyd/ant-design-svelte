<script lang="ts">
  import { Button, Modal } from 'svelte-ant-design';

  let selected = $state(false);
  let inPlace = $state(false);
  let box = $state<HTMLElement | null>(null);
  let where = $state('');

  // `data-demo` is an attribute of the dialog box (the rest of the attributes go there): it lets the example find it.
  function report(name: string) {
    const dialog = document.querySelector(`[data-demo="${name}"]`);
    where = `${name}: the dialog is ${box?.contains(dialog) ? 'inside the box' : 'outside the box'}`;
  }
</script>

<!-- container: an element, a function that returns one, a selector, or false to leave it where it is written. The layer still covers the window. -->
<div class="stack">
  <div class="row">
    <Button onclick={() => (selected = true)}>container="#modal-container"</Button>
    <Button onclick={() => (inPlace = true)}>container={'{false}'}</Button>
  </div>
  <div id="modal-container" class="box" bind:this={box}>the Modal goes into this box</div>
  <output class="caption">{where}</output>

  <Modal bind:open={selected} title="Into the box" container="#modal-container" data-demo="selector" onafteropenchange={(opened) => opened && report('selector')}>
    <p>Its layer is a child of the box in the page.</p>
  </Modal>
  <Modal bind:open={inPlace} title="In place" container={false} data-demo="false" onafteropenchange={(opened) => opened && report('false')}>
    <p>Its layer stays where the component is written.</p>
  </Modal>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .box {
    padding: 12px;
    border: 1px dashed var(--ads-color-border);
    border-radius: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
