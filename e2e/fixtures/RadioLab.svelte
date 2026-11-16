<script lang="ts">
  import { Radio, RadioGroup } from '$lib';

  // The lab of the Radio (specs/radio.md): a few radios and two groups on a short page. The screen reader test and the
  // browser floor test reach it at `/#radio`; a short page keeps the screen reader's walk through the form fields short.
  let fruit = $state<string | undefined>('Pear');
  let size = $state<string | undefined>('Medium');
  let single = $state(false);
</script>

<main>
  <h1>Radio lab</h1>
  <input data-testid="lab-before" aria-label="Before the radios" />
  <Radio data-testid="lab-single" bind:checked={single}>Newsletter</Radio>
  <span id="lab-fruit-title">Fruit</span>
  <RadioGroup
    data-testid="lab-fruit"
    aria-labelledby="lab-fruit-title"
    bind:value={fruit}
    options={['Apple', 'Pear', 'Orange', { label: 'Plum', value: 'Plum', disabled: true }]}
  />
  <RadioGroup
    data-testid="lab-size"
    aria-label="Size"
    optionType="button"
    buttonStyle="solid"
    bind:value={size}
    options={['Small', 'Medium', 'Large']}
  />
  <RadioGroup data-testid="lab-vertical" aria-label="Plan" orientation="vertical" options={['Free', 'Team']} />
  <output data-testid="lab-value">{fruit ?? 'none'}</output>
  <output data-testid="lab-size-value">{size ?? 'none'}</output>
  <input data-testid="lab-after" aria-label="After the radios" />
</main>

<style>
  :global(body) {
    background: var(--ads-color-bg-container);
  }

  main {
    display: grid;
    justify-items: start;
    gap: 12px;
    padding: 24px;
    width: 360px;
  }
</style>
