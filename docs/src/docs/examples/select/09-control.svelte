<script lang="ts">
  import { Checkbox, Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  const plans = [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' }
  ];

  let plan = $state<SelectValue | undefined>('free');
  let locked = $state(true);
  let log = $state<string[]>([]);
  let quiet = $state<SelectValue | undefined>();

  const note = (text: string) => (log = [...log.slice(-3), text]);
</script>

<!-- A function binding decides what the field may change to: while "locked" is on, every change is refused. -->
<Select
  bind:value={
    () => plan,
    (next) => {
      if (!locked) plan = next;
    }
  }
  aria-label="Plan"
  options={plans}
  style="width: 200px"
/>
<Checkbox bind:checked={locked}>The plan is locked</Checkbox>
<span>{JSON.stringify(plan)}</span>

<!-- The callbacks report what the user does, in this order: onselect, then onchange; onclear after a clear. -->
<!-- onkeydown and oninput are the native handlers of the focused element; oninputkeydown is the same key, as a callback of the Select. -->
<Select
  bind:value={quiet}
  aria-label="Plan, with callbacks"
  allowClear
  showSearch
  options={plans}
  placeholder="Choose, clear, tab away"
  onselect={(value) => note(`onselect(${value})`)}
  onchange={(value) => note(`onchange(${JSON.stringify(value)})`)}
  onclear={() => note('onclear()')}
  onfocus={() => note('onfocus')}
  onblur={() => note('onblur')}
  onkeydown={() => note('onkeydown')}
  oninput={() => note('oninput')}
  oninputkeydown={(event) => note(`oninputkeydown(${event.key})`)}
  defaultActiveFirstOption={false}
  style="width: 240px"
/>
<ol class="log" aria-label="Callbacks">
  {#each log as entry, index (index)}<li>{entry}</li>{/each}
</ol>

<style>
  .log {
    margin: 0;
    padding-inline-start: 20px;
    font-family: monospace;
    font-size: 12px;
  }
</style>
