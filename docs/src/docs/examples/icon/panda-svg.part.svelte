<script lang="ts">
  // A custom drawing for Icon's `component` prop: it renders one svg and uses the width, the height and the fill it is given.
  let { width = '1em', height = '1em', fill = 'currentColor' }: { width?: string; height?: string; fill?: string } = $props();
</script>

<svg viewBox="0 0 24 24" {width} {height} aria-hidden="true">
  <circle cx="5.5" cy="5.5" r="3.5" {fill} />
  <circle cx="18.5" cy="5.5" r="3.5" {fill} />
  <circle cx="12" cy="13" r="9" fill="none" stroke={fill} stroke-width="2" />
  <circle cx="8.5" cy="12" r="1.6" {fill} />
  <circle cx="15.5" cy="12" r="1.6" {fill} />
</svg>
