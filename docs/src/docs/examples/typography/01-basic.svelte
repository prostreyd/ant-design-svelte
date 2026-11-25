<script lang="ts">
  import { Typography, TypographyLink, TypographyParagraph, TypographyText, TypographyTitle } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <Typography>
      <TypographyTitle level={3}>A design system</TypographyTitle>
      <TypographyParagraph>
        Many projects need the same design rules and the same parts. A design system keeps them in one place, so the work does not
        <TypographyText strong>start again</TypographyText> in every application.
      </TypographyParagraph>
      <TypographyTitle level={4}>How to start</TypographyTitle>
      <TypographyParagraph>
        Run <TypographyText code>npm install svelte-ant-design</TypographyText> and press <TypographyText keyboard>Enter</TypographyText>.
      </TypographyParagraph>
      <TypographyParagraph>
        <TypographyText mark>Decide first</TypographyText>, then build. The <TypographyLink href="#api">API table</TypographyLink> lists
        every property.
      </TypographyParagraph>
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

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
    width: 100%;
  }
</style>
