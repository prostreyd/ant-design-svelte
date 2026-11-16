<script lang="ts">
  import { Button, Input, InputPassword, InputTextArea } from 'svelte-ant-design';

  let email = $state('');
  let password = $state('');
  let about = $state('');
  let result = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    result = `Submitted: ${JSON.stringify([...data.entries()])}`;
  }

  // A native reset does not change the state of the components: reset it here.
  function reset() {
    email = '';
    password = '';
    about = '';
    result = '';
  }
</script>

<!-- name, required and type are native: the form submits the text of each field. -->
<form onsubmit={submit} onreset={reset}>
  <Input bind:value={email} type="email" name="email" required aria-label="Email" placeholder="Email" />
  <InputPassword bind:value={password} name="password" required autocomplete="new-password" aria-label="New password" />
  <InputTextArea bind:value={about} name="about" aria-label="About you" placeholder="About you" />
  <Input type="number" name="age" aria-label="Age" placeholder="Age" />
  <span>
    <Button htmlType="submit" type="primary">Save</Button>
    <Button htmlType="reset">Reset</Button>
  </span>
</form>
<span role="status">{result}</span>
