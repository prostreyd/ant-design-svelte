<script lang="ts">
  import { RadioGroup } from 'svelte-ant-design';

  let fruit = $state<string | undefined>('Apple');
  let size = $state<number | undefined>(2);
  let agree = $state<boolean | undefined>(false);
  let extra = $state<string | undefined>();
  let last = $state('no change yet');
</script>

{#snippet cherry()}<strong>Cherry</strong>{/snippet}

<div class="stack">
  <!-- Strings, numbers and booleans are both the value and the label. -->
  <RadioGroup bind:value={fruit} options={['Apple', 'Pear', 'Orange']} aria-label="Fruit" />
  <RadioGroup bind:value={size} options={[1, 2, 3]} aria-label="Size" />

  <!-- A boolean value stays a boolean in onchange; the form gets its text. -->
  <RadioGroup
    bind:value={agree}
    aria-label="Agree"
    options={[
      { label: 'Yes', value: true },
      { label: 'No', value: false }
    ]}
  />

  <!-- Objects add a snippet label, title, id, required, disabled and an onchange of the option. -->
  <RadioGroup
    bind:value={extra}
    aria-label="Extras"
    options={[
      { label: cherry, value: 'cherry', id: 'extra-cherry' },
      {
        label: 'Pear',
        value: 'pear',
        title: 'Juicy',
        required: true,
        onchange: (checked) => (last = `pear: ${checked}`)
      },
      { label: 'Plum', value: 'plum', disabled: true }
    ]}
  />
  <span role="status">{last}</span>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }
</style>
