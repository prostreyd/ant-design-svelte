<script lang="ts">
  import { Button, Modal, Select, type SelectValue } from 'svelte-ant-design';

  let open = $state(false);
  let city = $state<SelectValue | undefined>('lisbon');
</script>

<!-- The list of a Select opens above the Modal, Escape closes the list first and the Modal on the second press, and the list follows the field when the Modal scrolls. -->
<div class="stack">
  <Button onclick={() => (open = true)}>A form with a Select</Button>
  <Modal bind:open title="Where to?" onok={() => (open = false)}>
    <div class="field">
      <span class="caption">City</span>
      <Select aria-label="City" options={['lisbon', 'porto', 'faro']} bind:value={city} style="width: 200px" />
    </div>
  </Modal>
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
