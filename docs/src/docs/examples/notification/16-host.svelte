<script lang="ts">
  import { Button, NotificationHost, Switch, notification } from 'svelte-ant-design';

  let mounted = $state(false);
</script>

<!-- <NotificationHost> draws the notifications where you put it. Its props are the settings and win over notification.config(). Without one the library
     makes its own layer. Only one host is active at a time. -->
{#if mounted}
  <NotificationHost placement="bottomLeft" bottom={72} duration={8} labels={{ close: 'Dismiss', success: 'Done', error: 'Failed' }} />
{/if}

<div class="stack">
  <div class="row">
    <Switch bind:checked={mounted} aria-label="NotificationHost" />
    <span>&lt;NotificationHost placement="bottomLeft" bottom=&#123;72&#125; ... /&gt; {mounted ? 'mounted' : 'not mounted'}</span>
  </div>
  <div class="row">
    <Button onclick={() => notification.success({ title: 'Saved' })}>success</Button>
    <Button onclick={() => notification.error({ title: 'Upload' })}>error</Button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

</style>
