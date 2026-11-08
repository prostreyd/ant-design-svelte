<script lang="ts">
  import Button from '$lib/Button/Button.svelte';
  import type {
    ButtonHTMLType,
    ButtonIconPlacement,
    ButtonLoading,
    ButtonShape,
    ButtonSize,
    ButtonType
  } from '$lib/Button/types.js';

  interface Props {
    type?: ButtonType;
    size?: ButtonSize;
    shape?: ButtonShape;
    disabled?: boolean;
    loading?: ButtonLoading;
    danger?: boolean;
    block?: boolean;
    ghost?: boolean;
    href?: string;
    target?: string;
    rel?: string;
    download?: string | boolean;
    htmlType?: ButtonHTMLType;
    iconPlacement?: ButtonIconPlacement;
    icon?: boolean;
    ariaLabel?: string;
    name?: string;
    form?: string;
    value?: string;
    dataTestid?: string;
    onclick?: (event: MouseEvent) => void;
    label?: string;
    showLabel?: boolean;
    class?: string;
  }

  let {
    type,
    size,
    shape,
    disabled,
    loading,
    danger,
    block,
    ghost,
    href,
    target,
    rel,
    download,
    htmlType,
    iconPlacement,
    icon = false,
    ariaLabel,
    name,
    form,
    value,
    dataTestid,
    onclick,
    label = '',
    showLabel = true,
    class: className
  }: Props = $props();
</script>

{#snippet labelContent()}
  {label}
{/snippet}

{#snippet testIcon()}
  <svg data-testid="icon" viewBox="0 0 16 16"><path d="M1 8h14" /></svg>
{/snippet}

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
  {rel}
  {download}
  {htmlType}
  {iconPlacement}
  icon={icon ? testIcon : undefined}
  aria-label={ariaLabel}
  {name}
  {form}
  {value}
  data-testid={dataTestid}
  onclick={onclick}
  class={className}
  children={showLabel ? labelContent : undefined}
/>
