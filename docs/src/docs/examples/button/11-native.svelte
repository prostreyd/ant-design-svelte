<script lang="ts">
  import { Button } from 'svelte-ant-design';

  let result = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    // The name and value of the button that was pressed are part of the form data.
    const data = new FormData(event.currentTarget as HTMLFormElement, event.submitter);
    result = `Submitted: ${data.get('action')}`;
  }
</script>

<form onsubmit={submit} onreset={() => (result = '')}>
  <input name="title" aria-label="Title" placeholder="Title" required />
  <Button type="primary" htmlType="submit" name="action" value="save">Save</Button>
  <Button htmlType="reset">Reset</Button>
</form>
<Button href="data:text/plain;charset=utf-8,Hello" download="hello.txt">Download</Button>
<span role="status">{result}</span>
