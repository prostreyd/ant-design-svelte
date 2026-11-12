<script lang="ts">
  import { Select } from 'svelte-ant-design';

  const fruit = ['Apple', 'Banana', 'Cherry'];
  let cleared = $state<string | number | undefined>('Banana');
</script>

{#snippet star()}<span aria-hidden="true">★</span>{/snippet}
{#snippet wait()}<span aria-hidden="true">…</span>{/snippet}
{#snippet mark()}<span aria-hidden="true">✔</span>{/snippet}
{#snippet minus()}<span aria-hidden="true">−</span>{/snippet}

<!-- large is 40px high, medium 32px, small 24px; middle and default are aliases of medium. -->
<Select aria-label="Large" size="large" options={fruit} value="Apple" style="width: 160px" />
<Select aria-label="Medium" size="medium" options={fruit} value="Apple" style="width: 160px" />
<Select aria-label="Middle, an alias of medium" size="middle" options={fruit} value="Apple" style="width: 160px" />
<Select aria-label="Default, an alias of medium" size="default" options={fruit} value="Apple" style="width: 160px" />
<Select aria-label="Small" size="small" options={fruit} value="Apple" style="width: 160px" />

<!-- Four variants, two statuses. -->
<Select aria-label="Outlined" variant="outlined" options={fruit} placeholder="outlined" style="width: 160px" />
<Select aria-label="Filled" variant="filled" options={fruit} placeholder="filled" style="width: 160px" />
<Select aria-label="Borderless" variant="borderless" options={fruit} placeholder="borderless" style="width: 160px" />
<Select aria-label="Underlined" variant="underlined" options={fruit} placeholder="underlined" style="width: 160px" />
<Select aria-label="Error" status="error" options={fruit} placeholder="error" style="width: 160px" />
<Select aria-label="Warning" status="warning" options={fruit} placeholder="warning" style="width: 160px" />
<Select aria-label="Disabled" disabled options={fruit} value="Apple" style="width: 160px" />

<!-- prefix, a custom suffix (null hides it), custom icons, and loading, which takes the place of the arrow. -->
<Select aria-label="With a prefix" prefix={star} options={fruit} placeholder="prefix" style="width: 160px" />
<Select aria-label="Custom suffix" suffix="▾" options={fruit} placeholder="suffix" style="width: 160px" />
<Select aria-label="No suffix" suffix={null} options={fruit} placeholder="no suffix" style="width: 160px" />
<Select aria-label="Loading" loading options={fruit} placeholder="loading" style="width: 160px" />
<Select aria-label="Loading with an icon of your own" loading loadingIcon={wait} options={fruit} placeholder="loadingIcon" style="width: 160px" />
<Select
  bind:value={cleared}
  aria-label="Clearable"
  allowClear={{ label: 'Forget the fruit', clearIcon: minus }}
  menuItemSelectedIcon={mark}
  options={fruit}
  style="width: 200px"
/>
<Select
  aria-label="Tags with a custom remove icon"
  mode="multiple"
  removeIcon="×"
  options={fruit}
  value={['Apple', 'Cherry']}
  style="width: 240px"
/>
