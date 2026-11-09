<script lang="ts">
  import type { Snippet } from 'svelte';
  import Pager from './Pager.svelte';
  import Sidebar from './Sidebar.svelte';
  import Toc from './Toc.svelte';

  /** The frame of every documentation and component page: its own menu, the article, the table of contents. */
  let { section, children }: { section: 'docs' | 'components'; children: Snippet } = $props();
</script>

<div class="shell" class:comp={section === 'components'}>
  <Sidebar {section} />
  <main id="main" class="doc-view">
    <article class="art">
      {@render children()}
      <Pager {section} />
    </article>
    <Toc />
  </main>
</div>
