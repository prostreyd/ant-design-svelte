<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

<!-- showCount shows the length; with maxlength it shows "n / max" and the browser stops the input at the limit. -->
<Input showCount aria-label="Counted" placeholder="Type something" />
<Input showCount maxlength={20} aria-label="Limited to 20" placeholder="At most 20 characters" />
<Input
  showCount={{ formatter: ({ count, maxLength }) => `${count} of ${maxLength} used` }}
  maxlength={10}
  aria-label="Formatted count"
  placeholder="Formatted count"
/>
