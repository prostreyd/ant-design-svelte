<script lang="ts">
  import { Select, SelectOption, SelectOptGroup } from '$lib';
  import type { SelectValue } from '$lib';

  // Labels of very different width ("Happy" and "Sad"): a field that changes size when the label changes would show it.
  const moods = [
    { value: 'happy', label: 'Happy' },
    { value: 'sad', label: 'Sad' },
    { value: 'long', label: 'A very long label that does not fit into a narrow field at all' },
    { value: 'off', label: 'Not available', disabled: true }
  ];
  const people = ['Ada', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Radia'];
  const groups = [
    { label: 'Engineers', options: [{ value: 'ada', label: 'Ada' }, { value: 'linus', label: 'Linus' }] },
    { label: 'Scientists', options: [{ value: 'grace', label: 'Grace' }, { value: 'barbara', label: 'Barbara', disabled: true }] }
  ];
  const many = Array.from({ length: 60 }, (_, index) => ({ value: index, label: `Option ${index}` }));

  let single = $state<SelectValue | undefined>();
  let multi = $state<SelectValue[]>(['Ada', 'Grace']);
  let tagsValue = $state<SelectValue[]>([]);
  let changes = $state(0);
  let log = $state<string[]>([]);
  let loading = $state(false);
  let disabled = $state(false);
  let open = $state(false);
  let markup = $state<SelectValue | undefined>('b');
  let showMiddle = $state(false);
  let reversed = $state(false);

  const record = (name: string) => () => log.push(name);

  // Lets a test set the state of the page without going through the controls.
  (window as unknown as { __selectLab: unknown }).__selectLab = {
    set(patch: { loading?: boolean; disabled?: boolean; single?: SelectValue | undefined; multi?: SelectValue[] }) {
      if ('loading' in patch) loading = patch.loading as boolean;
      if ('disabled' in patch) disabled = patch.disabled as boolean;
      if ('single' in patch) single = patch.single;
      if ('multi' in patch) multi = patch.multi as SelectValue[];
    }
  };
</script>

<main class="lab">
  <section>
    <label for="mood">Mood</label>
    <div class="row" data-testid="single-row">
      <span data-testid="before">before</span>
      <div class="slot" style="width: 240px" data-testid="single-slot">
        <Select id="mood" data-testid="single" options={moods} bind:value={single} placeholder="Pick a mood" allowClear {loading} {disabled} onchange={() => changes++} />
      </div>
      <span data-testid="after">after</span>
    </div>
    <output data-testid="single-value">{String(single)}</output>
    <output data-testid="changes">{changes}</output>
    <button type="button" data-testid="set-happy" onclick={() => (single = 'happy')}>Happy</button>
    <button type="button" data-testid="set-sad" onclick={() => (single = 'sad')}>Sad</button>
    <button type="button" data-testid="set-none" onclick={() => (single = undefined)}>None</button>
    <button type="button" data-testid="toggle-loading" onclick={() => (loading = !loading)}>Loading</button>
    <button type="button" data-testid="toggle-disabled" onclick={() => (disabled = !disabled)}>Disabled</button>
  </section>

  <section data-testid="sizes">
    <div class="slot" style="width: 220px"><Select aria-label="Large" data-testid="size-large" size="large" options={moods} value="happy" /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Medium" data-testid="size-medium" options={moods} value="happy" /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Small" data-testid="size-small" size="small" options={moods} value="happy" /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Large multiple" data-testid="size-large-multi" size="large" mode="multiple" options={people} value={['Ada']} /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Medium multiple" data-testid="size-medium-multi" mode="multiple" options={people} value={['Ada']} /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Small multiple" data-testid="size-small-multi" size="small" mode="multiple" options={people} value={['Ada']} /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Large empty multiple" data-testid="size-large-empty" size="large" mode="multiple" options={people} placeholder="Pick people" /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Medium empty multiple" data-testid="size-medium-empty" mode="multiple" options={people} placeholder="Pick people" /></div>
    <div class="slot" style="width: 220px"><Select aria-label="Small empty multiple" data-testid="size-small-empty" size="small" mode="multiple" options={people} placeholder="Pick people" /></div>
  </section>

  <section data-testid="multiple-section">
    <div class="slot" style="width: 260px">
      <Select aria-label="People" data-testid="multiple" mode="multiple" options={people} bind:value={multi} placeholder="Pick people" allowClear onchange={() => changes++} />
    </div>
    <output data-testid="multi-value">{JSON.stringify(multi)}</output>
    <div class="slot" style="width: 260px">
      <Select aria-label="Colours" data-testid="multi-plain" mode="multiple" showSearch={false} options={['Red', 'Green', 'Blue']} placeholder="Pick colours" />
    </div>
    <div class="slot" style="width: 260px">
      <Select aria-label="Tags" data-testid="tags" mode="tags" options={people} bind:value={tagsValue} tokenSeparators={[',']} placeholder="Type and press Enter" />
    </div>
    <output data-testid="tags-value">{JSON.stringify(tagsValue)}</output>
  </section>

  <section data-testid="variants">
    {#each ['outlined', 'filled', 'borderless', 'underlined'] as const as variant (variant)}
      <div class="slot" style="width: 200px"><Select aria-label={variant} data-testid="variant-{variant}" {variant} options={moods} value="happy" /></div>
    {/each}
    <div class="slot" style="width: 200px"><Select aria-label="Error" data-testid="status-error" status="error" options={moods} placeholder="Error" /></div>
    <div class="slot" style="width: 200px"><Select aria-label="Warning" data-testid="status-warning" status="warning" options={moods} placeholder="Warning" /></div>
    <div class="slot" style="width: 200px"><Select aria-label="Disabled" data-testid="disabled-select" disabled options={moods} value="happy" /></div>
    <div class="slot" style="width: 200px"><Select aria-label="Disabled multiple" data-testid="disabled-multi" disabled mode="multiple" options={people} value={['Ada', 'Grace']} /></div>
  </section>

  <section>
    <div class="slot" style="width: 240px">
      <Select aria-label="Searchable" data-testid="search" showSearch options={moods} placeholder="Search a mood" />
    </div>
    <div class="slot" style="width: 240px">
      <Select aria-label="Groups" data-testid="groups" options={groups} placeholder="Pick a person" />
    </div>
    <div class="slot" style="width: 240px">
      <Select aria-label="Long list" data-testid="long" options={many} placeholder="Long list" listHeight={160} />
    </div>
    <div class="slot" style="width: 240px">
      <Select aria-label="Narrow panel" data-testid="wide-panel" options={moods} placeholder="Wide panel" popupMatchSelectWidth={360} />
    </div>
    <div class="slot" style="width: 240px">
      <Select aria-label="Controlled open" data-testid="controlled-open" options={moods} bind:open onopenchange={record('openchange')} />
    </div>
    <output data-testid="open-value">{String(open)}</output>
    <output data-testid="log">{log.join(',')}</output>
  </section>

  <section>
    <div class="slot" style="width: 240px">
      <Select aria-label="Markup" data-testid="markup" bind:value={markup}>
        <SelectOption value="a">Option A</SelectOption>
        {#if showMiddle}<SelectOption value="m" label="Middle" />{/if}
        <SelectOptGroup label="Group">
          {#each reversed ? ['d', 'c', 'b'] : ['b', 'c', 'd'] as key (key)}
            <SelectOption value={key} label={`Option ${key.toUpperCase()}`} />
          {/each}
        </SelectOptGroup>
      </Select>
    </div>
    <button type="button" data-testid="markup-insert" onclick={() => (showMiddle = !showMiddle)}>Insert</button>
    <button type="button" data-testid="markup-reverse" onclick={() => (reversed = !reversed)}>Reverse</button>
  </section>

  <section dir="rtl" data-testid="rtl-section">
    <div class="slot" style="width: 240px">
      <Select aria-label="Right to left" data-testid="rtl" options={moods} placeholder="Pick a mood" prefix="P" allowClear value="happy" />
    </div>
  </section>

  <section class="bottom">
    <div class="slot" style="width: 240px">
      <Select aria-label="At the bottom" data-testid="bottom" options={many} placeholder="At the bottom of the page" />
    </div>
  </section>
</main>

<style>
  .lab {
    padding: 16px;
    display: grid;
    gap: 16px;
    font-family: var(--ads-font-family);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .slot {
    margin-block: 4px;
  }

  .bottom {
    margin-block-start: 40vh;
  }
</style>
