<script lang="ts">
  // The scenes of the server-render test (tests/IconServer.test.ts): the same markup must come out on the server and in a browser.
  import Icon from '$lib/Icon/Icon.svelte';
  import { createFromIconfontCN } from '$lib/Icon/iconfont.js';
  import LoadingOutlined from '@ant-design/icons-svg/es/asn/LoadingOutlined.js';
  import SmileTwoTone from '@ant-design/icons-svg/es/asn/SmileTwoTone.js';
  import StarOutlined from '@ant-design/icons-svg/es/asn/StarOutlined.js';
  import StarOutlinedComponent from '$lib/Icon/icons/StarOutlined.svelte';
  import CustomSvg from './IconCustomSvg.svelte';

  let { scene }: { scene: string } = $props();

  // Made on the server as well: with no document it must do nothing and not throw.
  const Font = createFromIconfontCN({ scriptUrl: '//example.invalid/font.js', extraCommonProps: { class: 'shared' } });
</script>

{#if scene === 'outlined'}
  <Icon icon={StarOutlined} />
{:else if scene === 'ready component'}
  <StarOutlinedComponent />
{:else if scene === 'two-tone'}
  <Icon icon={SmileTwoTone} />
{:else if scene === 'two-tone with a color'}
  <Icon icon={SmileTwoTone} twoToneColor="#eb2f96" />
{:else if scene === 'two-tone with a pair'}
  <Icon icon={SmileTwoTone} twoToneColor={['#1677ff', '#ffe58f']} />
{:else if scene === 'spin, rotate, class and style'}
  <Icon icon={StarOutlined} spin rotate={90} class="mine" style="color: red" />
{:else if scene === 'loading'}
  <Icon icon={LoadingOutlined} />
{:else if scene === 'label'}
  <Icon icon={StarOutlined} label="Favourite" />
{:else if scene === 'decorative'}
  <Icon icon={StarOutlined} label="" />
{:else if scene === 'custom component'}
  <Icon component={CustomSvg} label="Custom" />
{:else if scene === 'children'}
  <Icon spin>
    <svg width="1em" height="1em" viewBox="0 0 10 10"><rect width="10" height="10" /></svg>
  </Icon>
{:else if scene === 'iconfont'}
  <Font type="icon-tuichu" spin />
{/if}
