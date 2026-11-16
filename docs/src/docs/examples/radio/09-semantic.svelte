<script lang="ts">
  import { Radio, RadioButton, RadioGroup } from 'svelte-ant-design';

  let value = $state('b');
</script>

<div class="stack">
  <div class="row">
    <!-- Radio: the parts root, icon and label. -->
    <Radio
      checked
      class="radio-demo-mine"
      classNames={{ label: 'radio-demo-strong' }}
      styles={{ icon: { '--ads-radio-checked-bg': '#52c41a' }, label: { 'font-weight': 600 } }}
    >
      Green mark
    </Radio>

    <!-- RadioButton: the parts root and label. -->
    <RadioButton checked styles={{ root: { 'border-radius': '16px' } }}>Round</RadioButton>
  </div>

  <!-- RadioGroup: root, item, itemIcon and itemLabel reach every radio inside. -->
  <RadioGroup
    bind:value
    options={[
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' }
    ]}
    aria-label="Parts"
    class="radio-demo-group"
    style="padding: 4px 8px"
    classNames={{ item: 'radio-demo-item', itemIcon: 'radio-demo-icon', itemLabel: 'radio-demo-label' }}
    styles={{
      root: { 'background-color': 'rgba(22, 119, 255, 0.08)', 'border-radius': '8px' },
      itemLabel: { 'letter-spacing': '0.04em' }
    }}
  />
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 24px;
  }

  :global(.radio-demo-strong) {
    text-decoration: underline;
  }

  :global(.radio-demo-item) {
    padding-block: 2px;
  }
</style>
