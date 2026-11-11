<script lang="ts">
  import { Input, InputOTP, InputSearch, InputTextArea } from 'svelte-ant-design';
</script>

<!-- Each component names its parts: classNames adds a class to a part, styles adds inline styles to it. -->
<Input
  prefix="$"
  suffix="USD"
  allowClear
  showCount
  value="Styled"
  aria-label="Styled input"
  class="own-root"
  style="max-width: 320px"
  classNames={{ root: 'own-root-part', prefix: 'own-prefix', suffix: 'own-suffix', clear: 'own-clear', count: 'own-count' }}
  styles={{
    input: { 'font-weight': 600 },
    prefix: { color: '#1677ff' },
    suffix: { 'font-style': 'italic' },
    count: { 'letter-spacing': '1px' }
  }}
/>
<!-- numbers are written as they are (no automatic px); custom properties work too. -->
<InputTextArea
  value="Styled textarea"
  showCount
  aria-label="Styled textarea"
  class="own-area"
  style="max-width: 360px"
  classNames={{ textarea: 'own-textarea' }}
  styles={{ textarea: { 'font-family': 'monospace', '--own': 1 }, count: { color: 'crimson' } }}
/>
<!-- InputSearch has one more part, the button. -->
<InputSearch
  enterButton="Go"
  aria-label="Styled search"
  class="own-search"
  style="max-width: 360px"
  classNames={{ button: 'own-button' }}
  styles={{ button: { 'letter-spacing': '1px' } }}
/>
<InputOTP
  length={4}
  separator="/"
  aria-label="Styled code"
  class="own-otp"
  style="gap: 4px"
  classNames={{ input: 'own-cell', separator: 'own-separator' }}
  styles={{ input: { 'font-weight': 700 }, separator: { opacity: 0.5 } }}
/>
