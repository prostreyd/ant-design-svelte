<script lang="ts">
  import { flushSync, type Component } from 'svelte';
  import { createFromIconfontCN, getTwoToneColor, Icon, setTwoToneColor, type IconFontOptions, type IconFontProps, type TwoToneColor } from '$lib';
  // Only the drawings the tests ask for, each from its own file: the labs are all loaded by every page of the browser tests, and an
  // import of the list of 848 made every page ask the development server for 848 more modules.
  import CheckCircleTwoTone from '@ant-design/icons-svg/es/asn/CheckCircleTwoTone.js';
  import DotNetOutlined from '@ant-design/icons-svg/es/asn/DotNetOutlined.js';
  import HeartTwoTone from '@ant-design/icons-svg/es/asn/HeartTwoTone.js';
  import LoadingOutlined from '@ant-design/icons-svg/es/asn/LoadingOutlined.js';
  import LoginOutlined from '@ant-design/icons-svg/es/asn/LoginOutlined.js';
  import RestOutlined from '@ant-design/icons-svg/es/asn/RestOutlined.js';
  import ShareAltOutlined from '@ant-design/icons-svg/es/asn/ShareAltOutlined.js';
  import SmileTwoTone from '@ant-design/icons-svg/es/asn/SmileTwoTone.js';
  import StarFilled from '@ant-design/icons-svg/es/asn/StarFilled.js';
  import StarOutlined from '@ant-design/icons-svg/es/asn/StarOutlined.js';
  import StarTwoTone from '@ant-design/icons-svg/es/asn/StarTwoTone.js';
  import type { IconDefinition } from '$lib/Icon/types.js';

  // The lab of the public Icon (specs/icon.md): the test hands over which drawing, its props and the size and color of the text
  // around it, and the page draws that between two neighbours whose position must not move. `font` adds an iconfont.cn icon.
  type Lab = { name: string; props: Record<string, unknown>; fontSize: number; color: string };
  const definitions: Record<string, IconDefinition> = {
    CheckCircleTwoTone, DotNetOutlined, HeartTwoTone, LoadingOutlined, LoginOutlined, RestOutlined, ShareAltOutlined, SmileTwoTone, StarFilled, StarOutlined, StarTwoTone
  };

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
  <Icon data-testid="dot-net" icon={DotNetOutlined} />
  <Icon data-testid="login" icon={LoginOutlined} />
  <Icon data-testid="rest" icon={RestOutlined} />
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
