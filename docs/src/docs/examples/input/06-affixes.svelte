<script lang="ts">
  import { Input } from 'svelte-ant-design';
</script>

{#snippet at()}
  <span aria-hidden="true">@</span>
{/snippet}

{#snippet unit()}
  <em>kg</em>
{/snippet}

<!-- prefix and suffix take plain text or a snippet, and sit inside the border. -->
<Input prefix="$" suffix="USD" aria-label="Amount" placeholder="0.00" />
<Input prefix={at} aria-label="User name" placeholder="username" />
<Input suffix={unit} aria-label="Weight" placeholder="Weight" />
