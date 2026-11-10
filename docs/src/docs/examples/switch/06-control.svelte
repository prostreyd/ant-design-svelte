<script lang="ts">
  import { Switch } from 'svelte-ant-design';

  let agreed = $state(false);
  let enabled = $state(false);
  let locked = $state(false);
  let refused = $state(0);
</script>

<label>
  <input type="checkbox" bind:checked={agreed} />
  I accept the terms
</label>

<!-- A function binding: the setter decides whether a change is accepted. -->
<Switch
  aria-label="Enable the feature"
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
/>
<span role="status">{enabled ? 'enabled' : 'disabled'}, refused {refused} times</span>

<!-- preventDefault() in onclick cancels the toggle and onchange. -->
<Switch
  bind:checked={locked}
  aria-label="Lock the setting"
  onclick={(event) => {
    if (!agreed) event.preventDefault();
  }}
/>
