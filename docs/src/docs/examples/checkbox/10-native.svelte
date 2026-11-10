<script lang="ts">
  import { Button, Checkbox, CheckboxGroup } from 'svelte-ant-design';

  let terms = $state(false);
  let topics = $state<string[]>([]);
  let result = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    result = `Submitted: ${JSON.stringify([...data.entries()])}`;
  }

  // A native reset does not change the state of the components: reset it here.
  function reset() {
    terms = false;
    topics = [];
    result = '';
  }
</script>

<form onsubmit={submit} onreset={reset}>
  <Checkbox bind:checked={terms} name="terms" value="accepted" required>I accept the terms</Checkbox>
  <CheckboxGroup bind:value={topics} name="topic" options={['news', 'offers']} aria-label="Topics" />
  <Button htmlType="submit" type="primary">Save</Button>
  <Button htmlType="reset">Reset</Button>
</form>
<span role="status">{result}</span>
