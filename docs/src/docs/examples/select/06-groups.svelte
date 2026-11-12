<script lang="ts">
  import { Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  // An entry with an options array is a group. A disabled option is shown and cannot be chosen.
  const people = [
    {
      label: 'Engineers',
      options: [
        { value: 'ada', label: 'Ada' },
        { value: 'linus', label: 'Linus' }
      ]
    },
    {
      label: 'Scientists',
      options: [
        { value: 'grace', label: 'Grace' },
        { value: 'barbara', label: 'Barbara', disabled: true }
      ]
    }
  ];

  // fieldNames maps the keys of your own data: here { id, name } instead of { value, label }.
  const countries = [
    { name: 'Asia', members: [{ id: 'kg', name: 'Kyrgyzstan' }, { id: 'kz', name: 'Kazakhstan' }] },
    { name: 'Europe', members: [{ id: 'fr', name: 'France' }] }
  ];

  let person = $state<SelectValue | undefined>();
  let country = $state<SelectValue | undefined>('kg');
</script>

<Select bind:value={person} aria-label="Person" placeholder="Pick a person" showSearch options={people} style="width: 240px" />
<span>{JSON.stringify(person)}</span>

<Select
  bind:value={country}
  aria-label="Country"
  options={countries}
  fieldNames={{ label: 'name', value: 'id', options: 'members' }}
  style="width: 240px"
/>
<span>{JSON.stringify(country)}</span>
