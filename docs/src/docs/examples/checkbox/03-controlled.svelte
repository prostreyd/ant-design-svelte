<script lang="ts">
  import { Checkbox } from 'svelte-ant-design';

  let agreed = $state(false);
  let enabled = $state(false);
  let locked = $state(false);
  let refused = $state(0);
</script>

<Checkbox bind:checked={agreed}>I accept the terms</Checkbox>

<!-- A function binding: the setter decides whether a change is accepted. -->
<Checkbox
  bind:checked={
    () => enabled,
    (next) => {
      if (next && !agreed) {
        refused++;
        return;
      }
      enabled = next;
    }
  }
>
  Enable the feature
</Checkbox>
<span role="status">{enabled ? 'enabled' : 'disabled'}, refused {refused} times</span>

<!-- preventDefault() in a forwarded onclick cancels the toggle and onchange. -->
<Checkbox
  bind:checked={locked}
  onclick={(event) => {
    if (!agreed) event.preventDefault();
  }}
>
  Lock the setting
</Checkbox>
