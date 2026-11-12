<script lang="ts">
  import { Select } from 'svelte-ant-design';
  import type { SelectValue } from 'svelte-ant-design';

  const people = [
    { value: 'ada', label: 'Ada Lovelace', team: 'analytics' },
    { value: 'grace', label: 'Grace Hopper', team: 'compilers' },
    { value: 'linus', label: 'Linus Torvalds', team: 'kernel' },
    { value: 'margaret', label: 'Margaret Hamilton', team: 'flight software' },
    { value: 'dennis', label: 'Dennis Ritchie', team: 'compilers' }
  ];

  let person = $state<SelectValue | undefined>();
  let text = $state('');
  let heard = $state('');

  // Server-side search: the list is the answer of a (here, pretend) server, so the field does not filter it itself.
  let found = $state<{ value: string; label: string }[]>([]);
  let busy = $state(false);
  let remote = $state<SelectValue | undefined>();
  let timer: ReturnType<typeof setTimeout> | undefined;

  function search(query: string): void {
    clearTimeout(timer);
    if (query === '') {
      found = [];
      busy = false;
      return;
    }
    busy = true;
    timer = setTimeout(() => {
      found = ['cats', 'dogs', 'birds', 'fish'].filter((word) => word.includes(query.toLowerCase())).map((word) => ({ value: word, label: `${word} (${query})` }));
      busy = false;
    }, 400);
  }
</script>

<!-- showSearch filters by label; optionFilterProp names more fields; filterSort orders the matches. -->
<Select
  bind:value={person}
  bind:searchValue={text}
  aria-label="Person"
  placeholder="Search a person"
  showSearch
  options={people}
  optionFilterProp={['label', 'team']}
  filterSort={(a, b) => String(a.label).localeCompare(String(b.label))}
  notFoundContent="Nobody found"
  resultsText={(count) => `${count} found`}
  onsearch={(value) => (heard = `onsearch("${value}")`)}
  style="width: 280px"
/>
<span>search text: "{text}"</span>
<span role="status">{heard}</span>

<!-- A function decides per option: here the text must start the label. -->
<Select
  aria-label="Starts with"
  placeholder="Label starts with ..."
  showSearch
  options={people}
  filterOption={(input, option) => String(option.label).toLowerCase().startsWith(input.toLowerCase())}
  style="width: 280px"
/>

<!-- filterOption={false} leaves the list to you; loading shows that it is on the way. -->
<!-- autocomplete defaults to "new-password", so browsers do not offer saved values in the search box. -->
<Select
  bind:value={remote}
  aria-label="Remote search"
  placeholder="Type cat, dog, bird or fish"
  showSearch
  filterOption={false}
  loading={busy}
  options={found}
  onsearch={search}
  autocomplete="off"
  style="width: 280px"
/>
