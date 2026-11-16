<script lang="ts">
  import { Button, Radio, RadioGroup } from 'svelte-ant-design';

  let plan = $state<string | undefined>('free');
  let refused = $state(0);
  let locked = $state(false);
  let agreed = $state(false);
</script>

<div class="stack">
  <!-- A function binding: the setter decides whether a choice is accepted. The previous radio is put back. -->
  <RadioGroup
    bind:value={
      () => plan,
      (next) => {
        if (next === 'team' && !agreed) {
          refused++;
          return;
        }
        plan = next;
      }
    }
    options={[
      { label: 'Free', value: 'free' },
      { label: 'Team (needs the terms)', value: 'team' }
    ]}
    aria-label="Plan"
  />
  <div class="row">
    <Radio bind:checked={agreed}>I accept the terms</Radio>
    <span role="status">Plan: {plan ?? 'none'}, refused {refused} times</span>
  </div>

  <!-- preventDefault() in a forwarded onclick cancels the selection and onchange. -->
  <Radio
    bind:checked={locked}
    onclick={(event) => {
      if (!agreed) event.preventDefault();
    }}
  >
    Lock the plan
  </Radio>

  <!-- Setting the value to undefined clears the selection. -->
  <Button onclick={() => (plan = undefined)}>Clear the plan</Button>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
  }
</style>
