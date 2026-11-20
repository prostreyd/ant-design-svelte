<script lang="ts">
  /*
   * The generic icon (specs/icon.md): one wrapper `<span>` that holds one `<svg>` drawn from a definition (`icon`), from a
   * custom component (`component`) or from custom content (`children`). The svg is `1em` square and takes the color of the
   * text (`currentColor`), so the owner sets `font-size` and `color` on the icon or on a parent. The wrapper carries the
   * accessible name (`role="img"` and `aria-label`); the svg is hidden from assistive technology. The ready components
   * (`StarOutlined` and the others) are this component with one definition.
   */
  import { classList, styleText } from '../internal/semantic.js';
  import { resolveTwoTone } from './twoTone.svelte.js';
  import type { AbstractNode, IconProps } from './types.js';

  let {
    icon,
    component: CustomComponent,
    children,
    spin,
    rotate,
    twoToneColor,
    label,
    class: customClass,
    style: customStyle,
    role,
    'aria-label': ariaLabel,
    'aria-hidden': ariaHidden,
    ...rest
  }: IconProps = $props();

  // The name a screen reader reads: `label`, else an `aria-label` the owner passed, else the name of the drawing. No name (a custom
  // drawing) or an empty one hides the icon: an image with no name is a defect, and `label=""` is how an icon next to text is hidden.
  const name = $derived(label ?? ariaLabel ?? icon?.name);
  const hidden = $derived(name === undefined || name === '');
  // `loading` turns by itself, as in Ant Design; an explicit `spin={false}` stops it.
  const spinning = $derived(spin ?? icon?.name === 'loading');
  const rotated = $derived(typeof rotate === 'number' && Number.isFinite(rotate));

  // In the last branch of the template only a drawing is left (the guard there lets nothing else in), so `root` is set.
  // A two-tone drawing is a function of two colors; it reads the global color, so `setTwoToneColor` reaches a rendered icon.
  const root = $derived.by((): AbstractNode | undefined => {
    if (!icon) return undefined;
    if (typeof icon.icon !== 'function') return icon.icon;
    const [primary, secondary] = resolveTwoTone(twoToneColor);
    return icon.icon(primary, secondary);
  });

  const classes = $derived(
    classList('ads-icon', icon && `ads-icon-${icon.name}`, spinning && 'ads-icon-spin', rotated && 'ads-icon-rotated', customClass)
  );
  const wrapperStyle = $derived(styleText(rotated && `--ads-icon-rotate: ${rotate}deg`, customStyle));

  // A `var()` is not a valid value of the `fill` attribute; as a style declaration it is. A literal color stays an attribute.
  function attributesOf(node: AbstractNode): Record<string, string> {
    const { fill, ...others } = node.attrs;
    if (fill === undefined) return others;
    return fill.startsWith('var(') ? { ...others, style: `fill: ${fill}` } : node.attrs;
  }
</script>

{#if children || CustomComponent || root}
  <span
    {...rest}
    class={classes}
    style={wrapperStyle}
    role={hidden ? role : (role ?? 'img')}
    aria-label={hidden ? undefined : name}
    aria-hidden={hidden ? (ariaHidden ?? 'true') : ariaHidden}
  >
    {#if children}
      {@render children()}
    {:else if CustomComponent}
      <CustomComponent width="1em" height="1em" fill="currentColor" />
    {:else}
      {@const shape = root as AbstractNode}
      <svg
        {...shape.attrs}
        width="1em"
        height="1em"
        fill="currentColor"
        focusable="false"
        aria-hidden="true"
        data-icon={icon?.name}
      >
        {#snippet part(node: AbstractNode)}
          <svelte:element this={node.tag} xmlns="http://www.w3.org/2000/svg" {...attributesOf(node)}>
            {#each node.children ?? [] as child, index (index)}
              {@render part(child)}
            {/each}
          </svelte:element>
        {/snippet}
        {#each shape.children ?? [] as child, index (index)}
          {@render part(child)}
        {/each}
      </svg>
    {/if}
  </span>
{/if}

<style>
  /* The wrapper of Ant Design's icon, as measured on its demo: centered, no line box, aligned to the text. */
  .ads-icon {
    display: inline-flex;
    align-items: center;
    color: inherit;
    font-style: normal;
    line-height: 0;
    text-align: center;
    text-transform: none;
    vertical-align: -0.125em;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  .ads-icon > :global(*) {
    line-height: 1;
  }

  .ads-icon > :global(svg) {
    display: block;
  }

  /* The drawing turns, not the wrapper: the wrapper can be spinning at the same time. It also reaches the svg of a `component` and of `children`. */
  .ads-icon-rotated > :global(svg) {
    transform: rotate(var(--ads-icon-rotate));
  }

  .ads-icon-spin {
    animation: ads-icon-turn var(--ads-motion-duration-spinner, 1s) linear infinite;
  }

  @keyframes ads-icon-turn {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-icon-spin {
      animation-duration: var(--ads-motion-duration-spinner-reduced, 2.5s);
    }
  }
</style>
