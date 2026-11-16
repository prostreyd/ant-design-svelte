<script lang="ts">
  import { Button, Radio, RadioGroup } from 'svelte-ant-design';

  let size = $state<string | undefined>();
  let gift = $state(false);
  let result = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    result = `Submitted: ${JSON.stringify([...data.entries()])}`;
  }

  // A native reset does not change the state of the components: reset it here.
  function reset() {
    size = undefined;
    gift = false;
    result = '';
  }
</script>

<form class="stack" onsubmit={submit} onreset={reset}>
  <!-- A named group sends the value of the selected radio. -->
  <RadioGroup bind:value={size} name="size" options={['S', 'M', 'L']} aria-label="Size" />
  <Radio bind:checked={gift} name="gift" value="yes" required>Gift wrap</Radio>
  <!-- A group without a name is never submitted, so a form stays free of made-up keys. -->
  <RadioGroup value="a" options={['a', 'b']} aria-label="Not submitted" />
  <div class="row">
    <Button htmlType="submit" type="primary">Save</Button>
    <Button htmlType="reset">Reset</Button>
  </div>
  <span role="status">{result}</span>
</form>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .row {
    display: flex;
    gap: 8px;
  }
</style>
