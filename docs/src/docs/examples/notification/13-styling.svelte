<script lang="ts">
  import { Button, notification } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">class, style: on the box</span>
    <Button onclick={() => notification.info({ title: 'Styled box', description: 'A class and a style.', class: 'fancy', style: { 'border-radius': '24px' } })}>
      class and style
    </Button>
  </div>
  <div class="field">
    <span class="caption">classNames, styles: the parts (root, icon, section, title, description, actions, close, progress)</span>
    <Button
      onclick={() =>
        notification.success({
          title: 'Styled parts',
          description: 'The box, the title and the strip.',
          showProgress: true,
          classNames: { title: 'fancy-title' },
          styles: { root: { background: 'var(--ads-color-primary-solid)', color: '#fff' }, icon: { color: '#fff' }, close: { color: '#fff' } }
        })}
    >
      classNames and styles
    </Button>
  </div>
  <div class="field">
    <span class="caption">props: data-* and aria-* on the box</span>
    <Button onclick={() => notification.info({ title: 'With attributes', props: { 'data-testid': 'my-note', 'aria-label': 'Custom label' } })}>props</Button>
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

  /* The notification is drawn outside this component, so a class that styles it is global here. */
  :global(.fancy) {
    outline: 2px dashed var(--ads-color-primary);
  }

  :global(.fancy-title) {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
</style>
