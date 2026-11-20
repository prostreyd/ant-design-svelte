<script lang="ts">
  /*
   * An icon of an iconfont.cn sprite: the script of the project puts `<symbol id="icon-name">` into the page, and this draws
   * one with `<use>` inside the same wrapper as every other icon. Made by `createFromIconfontCN`, which loads the script.
   * No name is known for a symbol, so the icon is hidden from assistive technology unless `label` is set.
   *
   * The reference is `xlink:href`, not `href`: the prerender crawler of SvelteKit takes the `href` of any tag for a link and
   * fails a build on `#icon-name` that is no id of the page, while it does not read `xlink:href`.
   */
  import Icon from './Icon.svelte';
  import type { IconFontProps } from './types.js';

  let { type, ...rest }: IconFontProps = $props();
</script>

<Icon {...rest}>
  <svg width="1em" height="1em" fill="currentColor" focusable="false" aria-hidden="true" data-icon={type}>
    <use xlink:href="#{type}" />
  </svg>
</Icon>
