<script lang="ts">
  import { Checkbox, CheckboxGroup } from 'svelte-ant-design';
</script>

<!-- class goes to the root; classNames adds classes to the root, icon and label parts. -->
<Checkbox checked class="spaced" classNames={{ root: 'halo', label: 'strong' }}>With classes</Checkbox>

<!-- styles are inline styles per part; custom properties work too. -->
<Checkbox
  checked
  styles={{
    root: { '--ads-checkbox-checked-bg': '#237804', '--ads-checkbox-checked-bg-hover': '#135200' },
    icon: { 'border-radius': '50%' },
    label: { 'font-weight': 600 }
  }}
>
  With styles
</Checkbox>

<!-- style is the inline style of the root; styles.root is written after it and wins. -->
<Checkbox style="outline: 2px dashed #8c8c8c; outline-offset: 2px" styles={{ root: { opacity: 0.85 } }}>
  With style
</Checkbox>

<!-- A group: root, and item, itemIcon and itemLabel for every checkbox inside. -->
<CheckboxGroup
  value={['a']}
  options={['a', 'b']}
  aria-label="Group parts"
  class="boxed"
  classNames={{ root: 'halo', item: 'item' }}
  styles={{ itemIcon: { 'border-radius': '50%' }, itemLabel: { 'font-style': 'italic' } }}
  style="padding: 4px 8px"
/>

<style>
  :global(.spaced) {
    margin-inline-end: 12px;
  }

  :global(.halo) {
    box-shadow: 0 0 0 4px rgb(22 104 220 / 25%);
    border-radius: 4px;
  }

  :global(.strong) {
    text-decoration: underline;
  }

  :global(.boxed) {
    border: 1px dashed #8c8c8c;
  }

  :global(.item) {
    padding-inline: 4px;
  }
</style>
