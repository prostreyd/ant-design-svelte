<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  // The same key updates the notification in place: the box stays where it is, and a screen reader reads the new text.
  function run() {
    notification.info({ title: 'Uploading', description: 'The file is on its way.', key: 'upload', duration: 0 });
    setTimeout(() => notification.success({ title: 'Uploaded', description: 'The file is on the server.', key: 'upload', duration: 4 }), 1800);
  }
</script>

<Button onclick={run}>Upload</Button>
