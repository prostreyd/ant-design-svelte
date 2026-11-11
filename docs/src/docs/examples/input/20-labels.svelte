<script lang="ts">
  import { Input, InputTextArea } from 'svelte-ant-design';
</script>

<!-- A field has no label of its own: name it with an external label, aria-label or aria-labelledby. -->
<label for="input-labels-email">Email</label>
<Input id="input-labels-email" type="email" placeholder="you@example.com" />

<Input aria-label="Search the catalogue" title="Search the catalogue" placeholder="aria-label and title" />

<span id="input-labels-city">City</span>
<Input aria-labelledby="input-labels-city" aria-describedby="input-labels-city-hint" placeholder="aria-labelledby" />
<small id="input-labels-city-hint">The city you live in</small>

<!-- With a count, the count is joined to the field by aria-describedby, after your own ids. -->
<label for="input-labels-bio">Bio</label>
<InputTextArea id="input-labels-bio" showCount maxlength={80} aria-describedby="input-labels-bio-hint" />
<small id="input-labels-bio-hint">A short line about you</small>
