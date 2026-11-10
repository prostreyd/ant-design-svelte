<script lang="ts">
  import { Checkbox } from 'svelte-ant-design';

  let remember = $state(true);
  let last = $state('no change yet');
</script>

<!-- The text between the tags is the children of the checkbox, and its accessible name. -->
<Checkbox bind:checked={remember} onchange={(checked) => (last = `onchange(${checked})`)}>
  Remember me
</Checkbox>
<span>The box is {remember ? 'checked' : 'unchecked'}</span>
<span role="status">{last}</span>
