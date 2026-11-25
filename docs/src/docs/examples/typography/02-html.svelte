<script lang="ts">
  import { Typography } from 'svelte-ant-design';

  // HTML that comes ready, here a constant. From Markdown or a CMS, pass only what you trust or have sanitized.
  const ready = `
    <h4>Release notes</h4>
    <p>Read the <a href="#api">table of properties</a> before you start.</p>
    <ul>
      <li>Run <code>npm install</code> and press <kbd>Enter</kbd></li>
      <li><mark>Decide first</mark>, then <strong>build</strong></li>
    </ul>
    <blockquote>Consistency is a feature that every page gets for free.</blockquote>
    <pre>npm install svelte-ant-design</pre>
  `;
</script>

<div class="stack">
  <div class="field">
    <Typography>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html ready}
    </Typography>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
    width: 100%;
  }

  /* The article takes the whole width, so a block such as `pre` is as wide as in a real page. */
  .field {
    display: grid;
    justify-items: stretch;
    gap: 8px;
    width: 100%;
  }
</style>
