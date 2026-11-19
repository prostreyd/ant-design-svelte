<script lang="ts">
  import { Button, message } from 'svelte-ant-design';

  let clicks = $state(0);
  let closes = $state(0);
</script>

<!-- onclick is for a mouse or a finger only: a box cannot be reached with the keyboard. Put a button in the content
     (see Content) for an action. onclose is called once, when the message starts to close, however it was closed. -->
<div class="field">
  <Button onclick={() => message.info({ content: 'Click me', onclick: () => clicks++, onclose: () => closes++ })}>Open</Button>
  <span role="status">clicked {clicks}, closed {closes}</span>
</div>

<style>
  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }
</style>
