<script lang="ts">
  // Checked by `npm run check` (svelte-check): `values` and `all` must be the types of the instance or the model (a loose type
  // has no `toUpperCase` on `username`, so this file would not compile). The negative cases are in tests/formTypes.test.ts.
  import Form from '../../src/lib/Form/Form.svelte';
  import { createForm } from '../../src/lib/Form/store.svelte.js';

  interface Signup {
    username: string;
    age: number;
    address: { city: string };
  }

  const form = createForm<Signup>();
  const model: Signup = $state({ username: 'a', age: 1, address: { city: 'x' } });
  const seen: string[] = [];
</script>

<!-- `Values` comes from the instance. -->
<Form
  {form}
  initialValues={{ address: { city: 'Osh' } }}
  onfinish={(values) => seen.push(values.username.toUpperCase(), String(values.age + 1), values.address.city)}
  onvalueschange={(changed, all) => seen.push(String(all.age), changed.address?.city ?? '')}
  onfinishfailed={(info) => seen.push(info.values.username)}
/>

<!-- `Values` comes from the model when there is no instance. -->
<Form {model} onfinish={(values) => seen.push(values.username, String(values.age))} />

<!-- A form with neither keeps the loose type. -->
<Form onfinish={(values) => seen.push(String(values.anything))} />
