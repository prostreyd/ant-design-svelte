<script lang="ts">
  import { Button, message } from 'svelte-ant-design';

  // The handle is thenable: the promise resolves when the message starts to close, so the next one comes in as
  // the first one goes. (For the same reason `await message.info(...)` waits for the message to close.)
  function run() {
    message
      .loading('Action in progress..', 2.5)
      .then(() => message.success('Loading finished', 2.5))
      .then(() => message.info('Loading finished is finished', 2.5));
  }
</script>

<Button onclick={run}>Display sequential messages</Button>
