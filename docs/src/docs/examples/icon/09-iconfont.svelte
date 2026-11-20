<script lang="ts">
  import { createFromIconfontCN } from 'svelte-ant-design';

  // In your project `scriptUrl` is the address that your iconfont.cn project gives you, for example '//at.alicdn.com/t/font_xxx.js'.
  // Here the sprite script is made on the page, so that the example works without a network. It does what that script does:
  // it puts a <svg> with a <symbol id="icon-..."> for every icon at the start of the body.
  const sprite = `(function () {
    var holder = document.createElement('div');
    holder.innerHTML = '<svg><symbol id="icon-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3"/></symbol>' +
      '<symbol id="icon-square" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor"/></symbol></svg>';
    var svg = holder.firstChild;
    svg.style.position = 'absolute';
    svg.style.width = 0;
    svg.style.height = 0;
    document.body.insertBefore(svg, document.body.firstChild);
  })();`;
  const scriptUrl = typeof document === 'undefined' ? '' : URL.createObjectURL(new Blob([sprite], { type: 'text/javascript' }));

  const IconFont = createFromIconfontCN({ scriptUrl });
  // `extraCommonProps` go to every icon of this font; the props of one icon win.
  const Marker = createFromIconfontCN({ scriptUrl, extraCommonProps: { style: 'color: var(--ads-color-primary)' } });
</script>

<div class="stack">
  <div class="field">
    <span class="caption">IconFont type="icon-ring", type="icon-square"</span>
    <div class="row">
      <IconFont type="icon-ring" label="Ring" />
      <IconFont type="icon-square" label="Square" />
      <IconFont type="icon-ring" spin label="Ring, spinning" />
    </div>
  </div>

  <div class="field">
    <span class="caption">extraCommonProps: style for every icon of the font</span>
    <div class="row">
      <Marker type="icon-square" label="Square" />
      <Marker type="icon-ring" label="Ring" rotate={45} />
    </div>
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

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    font-size: 28px;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
