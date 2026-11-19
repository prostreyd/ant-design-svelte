<script lang="ts">
  import { Button, MessageHost, Switch, message } from 'svelte-ant-design';

  let mounted = $state(false);
</script>

<!-- <MessageHost> draws the messages where you put it. Its props are the settings and win over message.config().
     Without one the library makes its own layer. Only one host is active at a time. -->
{#if mounted}
  <MessageHost top={72} closable labels={{ close: 'Dismiss', success: 'Done', error: 'Failed' }} />
{/if}

<div class="stack">
  <div class="row">
    <Switch bind:checked={mounted} aria-label="MessageHost" />
    <span>&lt;MessageHost top=&#123;72&#125; closable labels=&#123;...&#125; /&gt; {mounted ? 'mounted' : 'not mounted'}</span>
  </div>

  <div class="row">
    <Button onclick={() => message.success('Saved')}>success</Button>
    <Button onclick={() => message.error('Upload')}>error</Button>
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
