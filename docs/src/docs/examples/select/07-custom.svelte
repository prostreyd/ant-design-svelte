<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Button, Select } from 'svelte-ant-design';
  import type { SelectOptionItem, SelectTag, SelectValue } from 'svelte-ant-design';

  const people = [
    { value: 'ada', label: 'Ada Lovelace', role: 'mathematician', emoji: '🧮' },
    { value: 'grace', label: 'Grace Hopper', role: 'rear admiral', emoji: '⚓' },
    { value: 'linus', label: 'Linus Torvalds', role: 'kernel maintainer', emoji: '🐧' }
  ];

  let one = $state<SelectValue | undefined>('ada');
  let tagged = $state<SelectValue[]>(['linus']);
  let wrapped = $state<SelectValue | undefined>();
  let presses = $state(0);
</script>

<!-- optionRender draws an option in the list (the field keeps the plain label); labelRender draws the selected value. -->
{#snippet row(option: SelectOptionItem, index: number)}
  <span>{option.emoji} <strong>{option.label}</strong> <small>{option.role} (#{index + 1})</small></span>
{/snippet}
{#snippet chosen(option: SelectOptionItem)}<span>{option.emoji} {option.label}</span>{/snippet}
<Select
  bind:value={one}
  aria-label="Person"
  options={people}
  optionRender={row}
  labelRender={chosen}
  popupMatchSelectWidth={320}
  style="width: 240px"
/>

<!-- tagRender draws a tag; onclose removes the value, closable says whether it may be removed. -->
{#snippet tag({ value, label, closable, onclose }: SelectTag)}
  <span class="chip" data-value={value}>
    {label}
    {#if closable}<button type="button" aria-label="Remove {value}" onclick={onclose}>×</button>{/if}
  </span>
{/snippet}
<Select bind:value={tagged} aria-label="Custom tags" mode="multiple" options={people} tagRender={tag} style="width: 320px" />

<!-- popupRender wraps the list; a press on the button does not take focus from the field or close the list. -->
{#snippet panel(list: Snippet)}
  <div>
    {@render list()}
    <div class="panel-foot">
      <Button size="small" onclick={() => presses++}>Add a person ({presses})</Button>
    </div>
  </div>
{/snippet}
<Select bind:value={wrapped} aria-label="With a footer" options={people} popupRender={panel} style="width: 240px" />

<style>
  .chip {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 0 6px;
    border: 1px solid var(--ads-color-border);
    border-radius: 4px;
  }

  .chip button {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
  }

  .panel-foot {
    padding: 4px;
    border-top: 1px solid var(--ads-color-border-secondary);
  }
</style>
