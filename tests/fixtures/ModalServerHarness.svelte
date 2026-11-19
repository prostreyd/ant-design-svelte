<script lang="ts">
  import ModalHost from '../../src/lib/Modal/ModalHost.svelte';
  import { modal } from '../../src/lib/Modal/modal';
  import { getSnapshot } from '../../src/lib/Modal/store';

  // Rendered on a server: the call must be a no-op that stores nothing and returns a handle, and the host must render nothing.
  const handle = modal.confirm({ title: 'Delete?' });
  const shape = [typeof handle.then, typeof handle.destroy, typeof handle.update].join(',');
  const stored = getSnapshot().records.length;
  const hosts = getSnapshot().activeHost === undefined ? 'no-host' : 'host';
  handle.destroy();
  handle.update({ title: 'x' });
  modal.destroyAll();
</script>

<p>{shape}|{stored}|{hosts}</p>
<ModalHost />
