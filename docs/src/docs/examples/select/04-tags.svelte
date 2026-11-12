<script lang="ts">
  import { Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  let tags = $state<SelectValue[]>(['svelte']);
  let pasted = $state<SelectValue[]>([]);
</script>

<!-- mode="tags": Enter adds the typed text as a value, even when it is not in the list. -->
<Select
  bind:value={tags}
  aria-label="Tags"
  mode="tags"
  placeholder="Type a tag and press Enter"
  options={['svelte', 'typescript', 'a11y']}
  style="width: 320px"
/>
<span>{JSON.stringify(tags)}</span>

<!-- tokenSeparators: a comma ends a token; a pasted "red, green, blue" becomes three values. -->
<Select
  bind:value={pasted}
  aria-label="Comma separated tags"
  mode="tags"
  tokenSeparators={[',']}
  placeholder="Type or paste: red, green, blue"
  style="width: 320px"
/>
<span>{JSON.stringify(pasted)}</span>
