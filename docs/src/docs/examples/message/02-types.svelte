<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<!-- Five kinds. error and warning are read out at once by a screen reader; the others wait for it to finish. -->
<div class="row">
  <Button onclick={() => message.info('This is an information message')}>info</Button>
  <Button onclick={() => message.success('This is a success message')}>success</Button>
  <Button onclick={() => message.error('This is an error message')}>error</Button>
  <Button onclick={() => message.warning('This is a warning message')}>warning</Button>
  <Button onclick={() => message.loading('Action in progress..')}>loading</Button>
</div>

<style>
  .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }
</style>
