<script lang="ts">
  import { Switch } from 'svelte-ant-design';
</script>

<!-- class goes to the root; classNames adds classes to the root, content and indicator parts. -->
<Switch
  checked
  aria-label="With classes"
  class="spaced"
  classNames={{ root: 'halo', indicator: 'handle-outline' }}
/>

<!-- styles are inline styles per part; custom properties work too. -->
<Switch
  checked
  aria-label="With styles"
  styles={{
    root: { '--ads-switch-track-on': '#237804', '--ads-switch-track-on-hover': '#135200' },
    indicator: { 'box-shadow': '0 0 0 2px #fff' }
  }}
/>

<!-- style is the inline style of the root; styles.root is written after it and wins. -->
<Switch
  aria-label="With style"
  style="outline: 2px dashed #8c8c8c; outline-offset: 2px"
  styles={{ root: { opacity: 0.85 } }}
/>

<style>
  :global(.spaced) {
    margin-inline-end: 12px;
  }

  :global(.halo) {
    box-shadow: 0 0 0 4px rgb(22 104 220 / 25%);
  }

  :global(.handle-outline) {
    outline: 1px solid rgb(0 0 0 / 35%);
  }
</style>
