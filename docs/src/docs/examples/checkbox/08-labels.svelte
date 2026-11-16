<script lang="ts">
  import { Checkbox } from 'svelte-ant-design';
</script>

<!-- The text between the tags names the checkbox, and a click on it toggles the box. -->
<Checkbox>Wi-Fi</Checkbox>

<!-- aria-label for a checkbox that has no visible text. -->
<Checkbox aria-label="Airplane mode" title="Airplane mode" />

<!-- aria-labelledby points at any element that holds the name. -->
<span id="bluetooth-name">Bluetooth</span>
<Checkbox aria-labelledby="bluetooth-name" aria-describedby="bluetooth-hint" />
<small id="bluetooth-hint">Needed for headphones</small>

<!-- An external label: the id of the checkbox goes to its input. -->
<label for="sound">Sound</label>
<Checkbox id="sound" checked />
