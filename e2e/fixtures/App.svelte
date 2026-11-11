<script lang="ts">
  import { Button, Checkbox, CheckboxGroup, Input, InputOTP, InputPassword, InputSearch, InputTextArea, Switch } from '$lib';

  let clicks = $state(0);
  let busy = $state(false);
  let switchBusy = $state(false);
  let switchChanges = $state(0);

  const types = ['default', 'primary', 'dashed', 'text', 'link'] as const;

  let boxChanges = $state(0);
  let layoutDisabled = $state(false);
  let layoutIndeterminate = $state(false);
  let groupValue = $state<string[]>(['b']);

  let clearText = $state('abc');
  let searchLog = $state('');
  let otpValue = $state('');
  let softText = $state('');

  let layoutText = $state('');
  let layoutPassword = $state('');
  let layoutSearch = $state('');
  let layoutSearchButton = $state('');
  let layoutSearchText = $state('');
  let layoutArea = $state('');
  let layoutStatus = $state<'error' | 'warning' | undefined>(undefined);
  let inputsDisabled = $state(false);
  let layoutVisible = $state(false);
  let layoutLoading = $state(false);
</script>

<main>
  <Button data-testid="default" onclick={() => clicks++}>Default</Button>
  <Button data-testid="primary" type="primary" onclick={() => clicks++}>Primary</Button>
  <Button data-testid="dashed" type="dashed" onclick={() => clicks++}>Dashed</Button>
  <Button data-testid="text" type="text" onclick={() => clicks++}>Text</Button>
  <Button data-testid="link" type="link" onclick={() => clicks++}>Link type</Button>
  <Button data-testid="danger-primary" type="primary" danger onclick={() => clicks++}>Danger</Button>
  <Button data-testid="ghost-primary" type="primary" ghost onclick={() => clicks++}>Ghost</Button>
  <Button data-testid="block" block onclick={() => clicks++}>Block</Button>
  <Button data-testid="circle" shape="circle" aria-label="Circle">+</Button>
  <Button data-testid="round" shape="round" onclick={() => clicks++}>Round</Button>
  <Button data-testid="small" size="small" onclick={() => clicks++}>Small</Button>
  <Button data-testid="large" size="large" onclick={() => clicks++}>Large</Button>
  <Button data-testid="disabled" disabled onclick={() => clicks++}>Disabled</Button>
  <Button data-testid="loading" loading onclick={() => clicks++}>Loading</Button>
  <Button data-testid="anchor" href="#anchor-target">Anchor</Button>
  <Button data-testid="anchor-disabled" href="#anchor-target" disabled>Disabled anchor</Button>
  <Button data-testid="load-toggle" loading={busy} onclick={() => (busy = true)}>Start</Button>
  <a id="anchor-target" href="#anchor-target">target</a>
</main>

<!-- Every type x danger x ghost combination, used by the contrast matrix tests. -->
<section data-testid="matrix">
  {#each types as type (type)}
    {#each [false, true] as danger (danger)}
      {#each [false, true] as ghost (ghost)}
        <Button
          data-testid="m-{type}-{danger ? 'danger' : 'plain'}-{ghost ? 'ghost' : 'solid'}"
          {type}
          {danger}
          {ghost}>{type}</Button
        >
      {/each}
    {/each}
  {/each}
</section>

<output data-testid="clicks">{clicks}</output>

{#snippet on()}On{/snippet}
{#snippet off()}Off{/snippet}

<!-- Switch states, used by the Switch visual and contrast tests. -->
<section data-testid="switches">
  <Switch data-testid="sw-off" aria-label="Off" />
  <Switch data-testid="sw-on" aria-label="On" checked />
  <Switch data-testid="sw-small-off" aria-label="Small off" size="small" />
  <Switch data-testid="sw-small-on" aria-label="Small on" size="small" checked />
  <Switch
    data-testid="sw-text-off"
    aria-label="Text off"
    checkedChildren={on}
    unCheckedChildren={off}
  />
  <Switch
    data-testid="sw-text-on"
    aria-label="Text on"
    checked
    checkedChildren={on}
    unCheckedChildren={off}
  />
  <Switch data-testid="sw-disabled" aria-label="Disabled" disabled />
  <Switch data-testid="sw-disabled-on" aria-label="Disabled on" disabled checked />
  <Switch data-testid="sw-loading" aria-label="Loading" loading />
  <Switch
    data-testid="sw-start-loading"
    aria-label="Start loading"
    loading={switchBusy}
    onchange={() => {
      switchChanges++;
      switchBusy = true;
    }}
  />
</section>
<output data-testid="switch-changes">{switchChanges}</output>

<!--
  Contents of different widths: toggling must not change the width or move the neighbours.
  One pair is given as snippets, the others as plain strings.
-->
<section data-testid="width-demo">
  <Switch data-testid="sw-onoff" aria-label="On or off" checkedChildren={on} unCheckedChildren={off} />
  <Switch data-testid="sw-yesno" aria-label="Yes or no" checkedChildren="Yes" unCheckedChildren="No" />
  <Switch data-testid="sw-happy" aria-label="Happy or sad" checkedChildren="Happy" unCheckedChildren="Sad" />
  <Switch
    data-testid="sw-happy-small"
    aria-label="Small, happy or sad"
    size="small"
    checkedChildren="Happy"
    unCheckedChildren="Sad"
  />
  <Switch data-testid="sw-only-on" aria-label="Only the on text" checkedChildren="Happy" />
  <Switch data-testid="sw-only-off" aria-label="Only the off text" unCheckedChildren="Sad" />
  <span data-testid="width-after">after</span>
</section>


<!-- Checkbox states, used by the Checkbox visual and contrast tests. -->
<section data-testid="checkboxes">
  <Checkbox data-testid="cb-off">Off</Checkbox>
  <Checkbox data-testid="cb-on" checked>On</Checkbox>
  <Checkbox data-testid="cb-indeterminate" indeterminate>Indeterminate</Checkbox>
  <Checkbox data-testid="cb-indeterminate-on" indeterminate checked>Indeterminate and on</Checkbox>
  <Checkbox data-testid="cb-disabled" disabled>Disabled</Checkbox>
  <Checkbox data-testid="cb-disabled-on" disabled checked>Disabled and on</Checkbox>
  <Checkbox data-testid="cb-disabled-indeterminate" disabled indeterminate>Disabled, indeterminate</Checkbox>
  <Checkbox data-testid="cb-bare" aria-label="No label" />
  <Checkbox data-testid="cb-counted" onchange={() => boxChanges++}>Counted</Checkbox>
</section>
<output data-testid="checkbox-changes">{boxChanges}</output>

<!--
  Labels of different widths and one without a label: toggling checked, indeterminate and disabled
  must not change a size or move a neighbour.
-->
<section data-testid="checkbox-layout">
  <Checkbox data-testid="lay-short" indeterminate={layoutIndeterminate} disabled={layoutDisabled}>Yes</Checkbox>
  <Checkbox data-testid="lay-long" indeterminate={layoutIndeterminate} disabled={layoutDisabled}>
    A considerably longer label than the others
  </Checkbox>
  <Checkbox data-testid="lay-bare" aria-label="Bare" indeterminate={layoutIndeterminate} disabled={layoutDisabled} />
  <span data-testid="lay-after">after</span>
  <button type="button" data-testid="lay-toggle-indeterminate" onclick={() => (layoutIndeterminate = !layoutIndeterminate)}>indeterminate</button>
  <button type="button" data-testid="lay-toggle-disabled" onclick={() => (layoutDisabled = !layoutDisabled)}>disabled</button>
</section>

<section data-testid="checkbox-group">
  <CheckboxGroup
    data-testid="group"
    aria-label="Letters"
    bind:value={groupValue}
    options={['a', 'b', { label: 'A much longer option', value: 'c' }]}
  />
  <output data-testid="group-value">{groupValue.join(',')}</output>
</section>


<!-- Input states, used by the Input visual, behavior and contrast tests. -->
<section data-testid="inputs" class="inputs">
  <div class="field"><Input data-testid="in-rest" aria-label="Rest" placeholder="Placeholder" /></div>
  <div class="field"><Input data-testid="in-large" size="large" aria-label="Large" placeholder="Large" /></div>
  <div class="field"><Input data-testid="in-small" size="small" aria-label="Small" placeholder="Small" /></div>
  <div class="field"><Input data-testid="in-filled" variant="filled" aria-label="Filled" placeholder="Filled" /></div>
  <div class="field"><Input data-testid="in-borderless" variant="borderless" aria-label="Borderless" placeholder="Borderless" /></div>
  <div class="field"><Input data-testid="in-underlined" variant="underlined" aria-label="Underlined" placeholder="Underlined" /></div>
  <div class="field"><Input data-testid="in-error" status="error" aria-label="Error" value="Error" /></div>
  <div class="field"><Input data-testid="in-warning" status="warning" aria-label="Warning" value="Warning" /></div>
  <div class="field"><Input data-testid="in-error-filled" status="error" variant="filled" aria-label="Filled error" placeholder="Filled error" /></div>
  <div class="field"><Input data-testid="in-warning-underlined" status="warning" variant="underlined" aria-label="Underlined warning" value="Warning" /></div>
  <div class="field"><Input data-testid="in-disabled" disabled aria-label="Disabled" value="Disabled" /></div>
  <div class="field"><Input data-testid="in-readonly" readonly aria-label="Read only" value="Read only" /></div>
  <div class="field">
    <Input data-testid="in-affixes" prefix="$" suffix="USD" addonBefore="https://" addonAfter=".com" aria-label="Affixes" placeholder="Affixes" />
  </div>
  <div class="field"><Input data-testid="in-clear" allowClear bind:value={clearText} aria-label="Clear" /></div>
  <div class="field"><Input data-testid="in-number" type="number" aria-label="Number" /></div>
  <div class="field"><Input data-testid="in-count" showCount maxlength={20} aria-label="Count" value="abc" /></div>
  <div class="field"><Input data-testid="in-soft" bind:value={softText} count={{ max: 5, show: true }} aria-label="Soft limit" /></div>
  <div class="field"><InputPassword data-testid="in-password" aria-label="Password" value="secret" /></div>
  <div class="field">
    <InputSearch
      data-testid="in-search"
      aria-label="Search"
      placeholder="Search"
      allowClear
      onsearch={(value, _event, info) => (searchLog = `${info.source}:${value}`)}
    />
  </div>
  <div class="field"><InputSearch data-testid="in-search-button" aria-label="Search with a button" enterButton /></div>
  <div class="field"><InputTextArea data-testid="ta-auto" autoSize aria-label="Auto size" /></div>
  <div class="field"><InputTextArea data-testid="ta-limits" autoSize={{ minRows: 2, maxRows: 4 }} aria-label="Two to four rows" /></div>
  <div class="field"><InputTextArea data-testid="ta-counted" allowClear showCount aria-label="Counted" value="text" /></div>
  <div class="field"><InputTextArea data-testid="ta-plain" aria-label="Plain" placeholder="Plain textarea" /></div>
  <div class="field"><InputOTP data-testid="otp" aria-label="Code" length={4} bind:value={otpValue} /></div>
  <div class="field"><InputOTP data-testid="otp-separated" aria-label="Separated code" length={4} separator="-" size="large" /></div>
  <div class="field">
    <Input data-testid="in-ime" aria-label="IME" count={{ max: 3, exceedFormatter: (value, { max }) => [...value].slice(0, max).join('') }} />
  </div>
</section>
<output data-testid="search-log">{searchLog}</output>
<output data-testid="otp-value">{otpValue}</output>
<output data-testid="soft-value">{softText}</output>

<!--
  Texts of different widths: changing the text, the status, the visibility, the loading and the disabled state
  must not change a size or move a neighbour.
-->
<section data-testid="input-layout" class="column">
  <Input
    data-testid="lay-input"
    bind:value={layoutText}
    allowClear
    showCount
    maxlength={60}
    prefix="$"
    suffix="USD"
    status={layoutStatus}
    disabled={inputsDisabled}
    aria-label="Layout input"
  />
  <InputPassword data-testid="lay-password" bind:value={layoutPassword} bind:visible={layoutVisible} allowClear disabled={inputsDisabled} aria-label="Layout password" />
  <InputSearch data-testid="lay-search" bind:value={layoutSearch} allowClear loading={layoutLoading} disabled={inputsDisabled} aria-label="Layout search" />
  <InputSearch data-testid="lay-search-button" bind:value={layoutSearchButton} enterButton loading={layoutLoading} aria-label="Layout search with a button" />
  <InputSearch data-testid="lay-search-text" bind:value={layoutSearchText} enterButton="Search" loading={layoutLoading} aria-label="Layout search with a text button" />
  <InputTextArea data-testid="lay-area" bind:value={layoutArea} allowClear showCount maxlength={60} status={layoutStatus} disabled={inputsDisabled} aria-label="Layout textarea" />
  <span data-testid="input-lay-after">after</span>
  <div class="row">
    <button type="button" data-testid="lay-status" onclick={() => (layoutStatus = layoutStatus === 'error' ? undefined : 'error')}>status</button>
    <button type="button" data-testid="lay-warning" onclick={() => (layoutStatus = layoutStatus === 'warning' ? undefined : 'warning')}>warning</button>
    <button type="button" data-testid="lay-disabled" onclick={() => (inputsDisabled = !inputsDisabled)}>disabled</button>
    <button type="button" data-testid="lay-visible" onclick={() => (layoutVisible = !layoutVisible)}>visible</button>
    <button type="button" data-testid="lay-loading" onclick={() => (layoutLoading = !layoutLoading)}>loading</button>
  </div>
</section>

<style>
  :global(body) {
    background: var(--ads-color-bg-container);
  }

  section {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 24px;
    width: 640px;
  }

  .inputs {
    gap: 16px;
    width: 960px;
  }

  .field {
    width: 300px;
  }

  .column {
    flex-direction: column;
    flex-wrap: nowrap;
    width: 360px;
  }

  .row {
    display: flex;
    gap: 8px;
  }

  main {
    display: grid;
    justify-items: start;
    gap: 12px;
    padding: 24px;
    width: 320px;
  }
</style>
