<script lang="ts">
  import { Button, Select } from 'svelte-ant-design';
  import type { SelectPlacement, SelectValue } from 'svelte-ant-design';

  const moods = [
    { value: 'happy', label: 'Happy' },
    { value: 'sad', label: 'Sad' },
    { value: 'long', label: 'A rather long label that needs a wider list than the field' }
  ];
  const many = Array.from({ length: 40 }, (_, index) => ({ value: index, label: `Option ${index + 1}` }));

  let placement = $state<SelectValue | undefined>('bottomLeft');
  let open = $state(false);
  let log = $state('nothing yet');
  let scrolled = $state(0);
  let host = $state<HTMLElement>();
</script>

<!-- placement: the preferred side; the list flips at the edge of the screen. -->
<Select
  aria-label="Choose the placement"
  bind:value={placement}
  options={['bottomLeft', 'bottomRight', 'topLeft', 'topRight']}
  style="width: 200px"
/>
<Select aria-label="Placement" placement={placement as SelectPlacement} options={moods} placeholder="Open me" style="width: 200px" />

<!-- popupMatchSelectWidth: a number is a width in px (never narrower than the field), false fits the content. -->
<Select aria-label="A wider list" popupMatchSelectWidth={360} options={moods} placeholder="360px list" style="width: 160px" />
<Select aria-label="A list as wide as its content" popupMatchSelectWidth={false} options={moods} placeholder="false" style="width: 160px" />

<!-- listHeight: the list is at most this high and scrolls. onpopupscroll reports it. -->
<Select
  aria-label="A short list"
  listHeight={120}
  options={many}
  placeholder="listHeight 120"
  onpopupscroll={() => (scrolled += 1)}
  style="width: 200px"
/>
<span>scroll events: {scrolled}</span>

<!-- bind:open controls the list; onopenchange reports the changes the user makes. -->
<Select
  bind:open
  aria-label="Controlled list"
  options={moods}
  placeholder="Controlled"
  onopenchange={(value) => (log = `onopenchange(${value})`)}
  style="width: 200px"
/>
<Button onclick={() => (open = !open)}>{open ? 'Close' : 'Open'} from the page</Button>
<span role="status">{log}</span>

<!-- container: where the panel is put. Here, into a box of the page instead of the end of the body. -->
<Select aria-label="In a box" container={() => host!} options={moods} placeholder="container" style="width: 200px" />
<div bind:this={host} class="host"></div>

<style>
  .host {
    position: relative;
    min-height: 8px;
  }
</style>
