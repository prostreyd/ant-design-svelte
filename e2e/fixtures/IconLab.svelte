<script lang="ts">
  import { flushSync, type Component } from 'svelte';
  import { createFromIconfontCN, getTwoToneColor, Icon, setTwoToneColor, type IconFontOptions, type IconFontProps, type TwoToneColor } from '$lib';
  import * as data from '$lib/Icon/data';
  import type { IconDefinition } from '$lib/Icon/types.js';

  // The lab of the public Icon (specs/icon.md): the test hands over which drawing, its props and the size and color of the text
  // around it, and the page draws that between two neighbours whose position must not move. `font` adds an iconfont.cn icon.
  type Lab = { name: string; props: Record<string, unknown>; fontSize: number; color: string };
  const definitions = data as unknown as Record<string, IconDefinition>;

  let lab = $state<Lab>({ name: 'StarOutlined', props: {}, fontSize: 14, color: '' });
  let fonts = $state<{ component: Component<IconFontProps>; type: string }[]>([]);

  const api = {
    set(next: Partial<Lab>) {
      lab = { ...lab, ...next };
      flushSync();
    },
    setGlobalColor(color: TwoToneColor) {
      setTwoToneColor(color);
      flushSync();
    },
    globalColor: () => getTwoToneColor(),
    font(options: IconFontOptions, type: string) {
      fonts = [...fonts, { component: createFromIconfontCN(options), type }];
      flushSync();
    }
  };
  (window as unknown as { __iconLab: typeof api }).__iconLab = api;
  document.body.style.background = 'var(--ads-color-bg-container)';
  document.body.style.color = 'var(--ads-color-text)';
</script>

<div class="host" data-testid="host" style:font-size="{lab.fontSize}px" style:color={lab.color || undefined}>
  <span data-testid="before">Before</span>
  <Icon data-testid="icon" icon={definitions[lab.name]} {...lab.props} />
  <span data-testid="after">After</span>
</div>

<div class="fixed" data-testid="fixed" style:font-size="24px">
  <Icon data-testid="dot-net" icon={data.DotNetOutlined} />
  <Icon data-testid="login" icon={data.LoginOutlined} />
  <Icon data-testid="rest" icon={data.RestOutlined} />
</div>

<div class="fonts" data-testid="fonts" style:font-size="14px">
  {#each fonts as font, index (index)}
    {@const Font = font.component}
    <Font type={font.type} data-testid="font-{index}" />
  {/each}
</div>

<style>
  .host,
  .fixed,
  .fonts {
    margin: 12px;
    line-height: 1.5;
  }
</style>
