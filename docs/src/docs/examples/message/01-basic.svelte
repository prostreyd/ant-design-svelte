<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<!-- A call from anywhere in the code: no setup, no markup. The library makes a layer on the page by itself. -->
<Button onclick={() => message.info('This is a normal message')}>Show message</Button>
