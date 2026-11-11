<script lang="ts">
  import { Input } from 'svelte-ant-design';

  let digits = $state('');
  let searched = $state('');
</script>

<!-- A function binding can refuse an edit: the field goes back to the last accepted text. Digits only here. -->
<Input
  bind:value={() => digits, (next) => (/^\d*$/.test(next) ? (digits = next) : undefined)}
  aria-label="Digits only"
  placeholder="Digits only"
/>
<!-- onpressenter runs on Enter, but not on the Enter that confirms an IME candidate. -->
<Input
  aria-label="Press Enter"
  placeholder="Type and press Enter"
  onpressenter={(event) => (searched = (event.currentTarget as HTMLInputElement).value)}
/>
<span role="status">Entered: {searched}</span>
