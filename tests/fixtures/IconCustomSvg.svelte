<script lang="ts">
  // A custom drawing as Icon's `component` prop wants it: it renders one svg and uses the props it is given.
  let { width, height, fill }: { width: string; height: string; fill: string } = $props();
</script>

<svg {width} {height} {fill} viewBox="0 0 10 10" data-testid="custom-svg"><circle cx="5" cy="5" r="4" /></svg>
