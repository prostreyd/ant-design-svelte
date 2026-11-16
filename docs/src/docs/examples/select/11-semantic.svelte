<script lang="ts">
  import { Select } from 'svelte-ant-design';
</script>

<!-- classNames adds a class to a part, styles adds inline styles to it; numbers are written as they are. -->
<!-- popup, list and listItem are in the panel; item is a selected value or a tag. -->
<Select
  aria-label="Styled parts"
  mode="multiple"
  allowClear
  prefix="🍎"
  placeholder="Pick fruit"
  options={['Apple', 'Banana', 'Cherry']}
  value={['Apple']}
  class="semantic-select"
  style="width: 320px"
  classNames={{ root: 'semantic-root', item: 'semantic-item', popup: 'semantic-popup', listItem: 'semantic-option' }}
  styles={{
    root: { 'border-style': 'dashed' },
    prefix: { 'margin-inline-end': '8px' },
    content: { 'padding-block': '1px' },
    placeholder: { 'font-style': 'italic' },
    item: { 'font-weight': 600 },
    clear: { color: 'crimson' },
    input: { 'letter-spacing': '0.5px' },
    suffix: { opacity: 0.6 },
    popup: { 'border-radius': '12px' },
    list: { 'padding-block': '2px' },
    listItem: { 'font-variant': 'small-caps' }
  }}
/>

<style>
  :global(.semantic-popup) {
    outline: 1px dashed var(--ads-color-border);
  }

  :global(.semantic-item) {
    letter-spacing: 0.2px;
  }
</style>
