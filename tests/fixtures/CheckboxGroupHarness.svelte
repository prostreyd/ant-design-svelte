<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import Checkbox from '$lib/Checkbox/Checkbox.svelte';
  import CheckboxGroup from '$lib/Checkbox/CheckboxGroup.svelte';
  import type { CheckboxValue } from '$lib/Checkbox/types.js';

  interface Props extends Omit<ComponentProps<typeof CheckboxGroup>, 'value' | 'children'> {
    /** Initial values held by the parent. */
    initial?: CheckboxValue[];
    /**
     * `bind`: `bind:value`. `plain`: one-way `value={values}`.
     * `confirm`: a function binding whose setter accepts a change only while `allow` is true.
     */
    mode?: 'bind' | 'plain' | 'confirm';
    allow?: boolean;
    /** Render checkboxes as custom markup (the `children` snippet) instead of `options`. */
    markup?: boolean;
    /** Add a checkbox without a value to the markup. */
    unvalued?: boolean;
    /** Disable the "Cherry" checkbox of the markup on its own. */
    cherryDisabled?: boolean;
    /** Callback of the "Apple" checkbox of the markup. */
    onApple?: (checked: boolean, event: Event) => void;
  }

  let {
    initial = [],
    mode = 'bind',
    allow = true,
    markup = false,
    unvalued = false,
    cherryDisabled = false,
    onApple,
    ...rest
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let values = $state(initial);
</script>

<span data-testid="parent-value">{JSON.stringify(values)}</span>
<button type="button" data-testid="parent-set" onclick={() => (values = ['b'])}>set b</button>

{#snippet items()}
  {#if markup}
    <Checkbox value="a" name="own" onchange={onApple} classNames={{ root: 'own-root', icon: 'own-icon', label: 'own-label' }}>Apple</Checkbox>
    <!-- The checkbox's own `checked` is ignored inside a group. -->
    <Checkbox value="b" checked>Banana</Checkbox>
    <div class="cell"><Checkbox value="c" disabled={cherryDisabled}>Cherry</Checkbox></div>
    {#if unvalued}<Checkbox>No value</Checkbox>{/if}
  {/if}
{/snippet}

{#if mode === 'bind'}
  <CheckboxGroup bind:value={values} {...rest}>{@render items()}</CheckboxGroup>
{:else if mode === 'plain'}
  <CheckboxGroup value={values} {...rest}>{@render items()}</CheckboxGroup>
{:else}
  <CheckboxGroup
    bind:value={
      () => values,
      (next) => {
        if (allow) values = next;
      }
    }
    {...rest}>{@render items()}</CheckboxGroup
  >
{/if}
