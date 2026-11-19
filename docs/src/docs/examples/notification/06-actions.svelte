<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';

  const key = 'actions';
  const undo = () => notification.destroy(key);
</script>

<!-- `actions` is content under the text, at the end: usually buttons. They are your elements, so the keyboard reaches them
     after the text and before the close button. -->
{#snippet actions()}
  <Button size="small" onclick={undo}>Undo</Button>
  <Button size="small" type="primary" onclick={undo}>Keep</Button>
{/snippet}

<Button onclick={() => notification.info({ title: 'Message moved', description: 'It is in the archive now.', actions, key, duration: 0 })}>
  With actions
</Button>
