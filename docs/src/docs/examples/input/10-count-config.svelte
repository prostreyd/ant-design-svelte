<script lang="ts">
  import { Input } from 'svelte-ant-design';

  // An emoji is one code point, so it is one character here (and a combined emoji is several).
  const words = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;
</script>

<!-- max is a soft limit: past it the count turns red and the field is invalid, the text is kept. -->
<Input count={{ max: 10, show: true }} value="more than ten characters" aria-label="Soft limit" />
<!-- strategy replaces the count; show can be a function that formats it. -->
<Input
  count={{ strategy: words, show: ({ count }) => `${count} words` }}
  value="count the words, not the letters"
  aria-label="Words"
/>
<!-- exceedFormatter cuts the text when it passes max (after an IME composition ends, not in the middle of it). -->
<Input
  count={{
    max: 8,
    show: true,
    exceedFormatter: (value, { max }) => [...value].slice(0, max).join('')
  }}
  aria-label="Cut at 8"
  placeholder="Cut at 8 characters"
/>
