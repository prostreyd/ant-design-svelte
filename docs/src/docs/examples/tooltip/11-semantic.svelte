<script lang="ts">
  import { Button, Tooltip } from 'svelte-ant-design';
</script>

<!-- root: the positioned element, container: the visible box, arrow: the little square pointing at the trigger. -->
<Tooltip
  title="With classes"
  classNames={{ root: 'tt-demo-root', container: 'tt-demo-box', arrow: 'tt-demo-arrow' }}
>
  <Button>classNames</Button>
</Tooltip>

<!-- styles are inline styles per part; custom properties work too. -->
<Tooltip
  title="With styles"
  styles={{
    container: { 'font-weight': 700, 'letter-spacing': '0.02em', '--ads-tooltip-bg': '#237804' },
    arrow: { opacity: 0.9 }
  }}
>
  <Button>styles</Button>
</Tooltip>

<style>
  :global(.tt-demo-root) {
    filter: drop-shadow(0 4px 8px rgb(0 0 0 / 35%));
  }

  :global(.tt-demo-box) {
    outline: 2px solid #faad14;
    outline-offset: 1px;
  }

  :global(.tt-demo-arrow) {
    outline: 2px solid #faad14;
  }
</style>
