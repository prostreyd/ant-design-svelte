<script lang="ts">
  import { Button, message } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">class, style: on the box</span>
    <Button
      onclick={() => message.info({ content: 'Styled box', class: 'fancy', style: { 'border-radius': '24px' } })}
    >
      class and style
    </Button>
  </div>

  <div class="field">
    <span class="caption">classNames, styles: the parts (root, wrapper, icon, title, close)</span>
    <Button
      onclick={() =>
        message.success({
          content: 'Styled parts',
          closable: true,
          classNames: { title: 'fancy-title' },
          styles: { root: { background: 'var(--ads-color-primary-solid)', color: '#fff' }, icon: { color: '#fff' }, close: { color: '#fff' } }
        })}
    >
      classNames and styles
    </Button>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 16px;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }

  /* The message is drawn outside this component, so a class that styles it is global here. */
  :global(.fancy) {
    outline: 2px dashed var(--ads-color-primary);
  }

  :global(.fancy-title) {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
