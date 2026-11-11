<script lang="ts">
  import { InputPassword } from 'svelte-ant-design';

  let shown = $state(false);
  let changes = $state(0);
</script>

{#snippet word(visible: boolean)}
  <small>{visible ? 'hide' : 'show'}</small>
{/snippet}

<!-- The toggle is a native button named "Show password"; aria-pressed follows the state. -->
<InputPassword aria-label="Password" placeholder="Password" onvisiblechange={() => changes++} />
<!-- bind:visible controls the state from outside. -->
<InputPassword bind:visible={shown} aria-label="Controlled password" value="secret" />
<span role="status">The password is {shown ? 'shown' : 'hidden'}; the first field toggled {changes} times</span>
<!-- visibilityToggle: false hides the button; the object form names it and sets its tab index. -->
<InputPassword visibilityToggle={false} aria-label="No toggle" value="secret" />
<InputPassword
  visibilityToggle={{ label: 'Reveal the password', tabIndex: -1 }}
  aria-label="Named toggle"
  value="secret"
/>
<!-- iconRender replaces the icon and receives the visibility. -->
<InputPassword iconRender={word} aria-label="Text toggle" value="secret" />
