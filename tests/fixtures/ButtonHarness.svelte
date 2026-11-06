<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import type {
    ButtonHTMLType,
    ButtonShape,
    ButtonSize,
    ButtonType
  } from '$lib/Button/types.js';

  interface Props {
    type?: ButtonType;
    size?: ButtonSize;
    shape?: ButtonShape;
    disabled?: boolean;
    loading?: boolean;
    danger?: boolean;
    block?: boolean;
    ghost?: boolean;
    href?: string;
    target?: string;
    htmlType?: ButtonHTMLType;
    onclick?: (event: MouseEvent) => void;
    label?: string;
  }

  let {
    type = 'default',
    size = 'middle',
    shape = 'default',
    disabled = false,
    loading = false,
    danger = false,
    block = false,
    ghost = false,
    href = undefined,
    target = undefined,
    htmlType = 'button',
    onclick,
    label = ''
  }: Props = $props();
</script>

<Button
  {type}
  {size}
  {shape}
  {disabled}
  {loading}
  {danger}
  {block}
  {ghost}
  {href}
  {target}
  {htmlType}
  {onclick}
>
  {label}
</Button>
