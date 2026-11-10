<script lang="ts">
  import { Switch } from 'svelte-ant-design';
</script>

<Switch checked aria-label="Medium" />
<Switch checked size="medium" aria-label="Medium, explicit" />
<Switch checked size="small" aria-label="Small" />
<!-- `default` is an alias of `medium` for people coming from Ant Design Vue or NG-ZORRO. -->
<Switch checked size="default" aria-label="Default, same as medium" />
