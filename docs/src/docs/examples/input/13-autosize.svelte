<script lang="ts">
  import { InputTextArea } from 'svelte-ant-design';

  let story = $state('Type here and the field grows.\nPress Enter for a new line.');
</script>

<!-- autoSize follows the content, within minRows and maxRows lines; past maxRows the field scrolls. -->
<InputTextArea bind:value={story} autoSize aria-label="Grows with the text" />
<InputTextArea
  autoSize={{ minRows: 2, maxRows: 4 }}
  aria-label="Two to four rows"
  placeholder="Two to four rows"
/>
