<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<!-- A call from anywhere shows a notification at the top right: no setup and no markup. It goes after 4.5 s. -->
<Button
  type="primary"
  onclick={() =>
    notification.open({
      title: 'Notification title',
      description: 'This is the content of the notification. A title, and a text under it.'
    })}
>
  Open the notification
</Button>
