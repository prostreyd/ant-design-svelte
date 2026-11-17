<script lang="ts">
  import { Button, message } from 'svelte-ant-design';

  // The same key updates the message in place: the box stays where it is, and a screen reader reads the new text.
  function run() {
    message.loading({ content: 'Loading...', key: 'updatable', duration: 0 });
    setTimeout(() => message.success({ content: 'Loaded!', key: 'updatable', duration: 2 }), 1500);
  }
</script>

<Button onclick={run}>Load</Button>
