<script lang="ts">
  import { Switch } from 'svelte-ant-design';
</script>

<!-- A label element: clicking the text toggles the switch. -->
<label for="wifi">Wi-Fi</label>
<Switch id="wifi" checked />

<!-- aria-label for a switch that has no visible text. -->
<Switch aria-label="Airplane mode" title="Airplane mode" />

<!-- aria-labelledby points at any element that holds the name. -->
<span id="bluetooth-name">Bluetooth</span>
<Switch aria-labelledby="bluetooth-name" aria-describedby="bluetooth-hint" />
<small id="bluetooth-hint">Needed for headphones</small>
