<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Radio from '$lib/Radio/Radio.svelte';
  import RadioButton from '$lib/Radio/RadioButton.svelte';
  import RadioGroup from '$lib/Radio/RadioGroup.svelte';

  interface Props extends Omit<ComponentProps<typeof RadioGroup>, 'children'> {
    /** What the group holds: plain items, items nested in other elements, buttons, both kinds, an item without a value, or an item with its own `checked`. */
    variant?: 'plain' | 'nested' | 'buttons' | 'mixed' | 'novalue' | 'button-novalue' | 'own-checked' | 'item-onchange';
    log?: (entry: string) => void;
  }

  let { variant = 'plain', log, ...rest }: Props = $props();
</script>

<RadioGroup {...rest}>
  {#if variant === 'plain'}
    <Radio value="a">Apple</Radio>
    <Radio value="p">Pear</Radio>
    <Radio value="o">Orange</Radio>
  {:else if variant === 'nested'}
    <div class="grid">
      <div><Radio value="a">Apple</Radio></div>
      <div><Radio value="p">Pear</Radio></div>
    </div>
  {:else if variant === 'buttons'}
    <RadioButton value="a">Apple</RadioButton>
    <RadioButton value="p">Pear</RadioButton>
    <RadioButton value="o">Orange</RadioButton>
  {:else if variant === 'mixed'}
    <Radio value="a">Apple</Radio>
    <RadioButton value="p">Pear</RadioButton>
  {:else if variant === 'novalue'}
    <Radio>Apple</Radio>
  {:else if variant === 'button-novalue'}
    <RadioButton>Apple</RadioButton>
  {:else if variant === 'own-checked'}
    <Radio value="a" checked>Apple</Radio>
    <Radio value="p">Pear</Radio>
  {:else if variant === 'item-onchange'}
    <Radio value="a" onchange={() => log?.('item a')}>Apple</Radio>
    <Radio value="p" onchange={() => log?.('item p')}>Pear</Radio>
  {/if}
</RadioGroup>
