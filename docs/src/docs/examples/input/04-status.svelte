<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

<!-- error also sets aria-invalid="true"; warning is a look only. -->
<Input status="error" aria-label="Error" placeholder="Error" value="not an email" />
<Input status="warning" aria-label="Warning" placeholder="Warning" value="maybe a typo" />
<Input status="error" variant="filled" aria-label="Filled error" placeholder="Filled, error" />
<Input status="warning" variant="underlined" aria-label="Underlined warning" placeholder="Underlined, warning" />
