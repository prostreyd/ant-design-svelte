<script lang="ts">
  export interface Crumb {
    label: string;
    href?: string;
  }

  let { items }: { items: Crumb[] } = $props();
</script>

<nav class="crumbs" aria-label="Breadcrumb">
  <ol>
    {#each items as crumb, i (i)}
      <li>{#if crumb.href}<a href={crumb.href}>{crumb.label}</a>{:else}<span aria-current="page">{crumb.label}</span>{/if}</li>
    {/each}
  </ol>
</nav>
