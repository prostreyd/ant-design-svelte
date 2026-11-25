<script lang="ts">
  import { TypographyText } from 'svelte-ant-design';
</script>

<div class="stack">
  <div class="field">
    <span class="caption">type</span>
    <TypographyText>Ant Design (default)</TypographyText>
    <TypographyText type="secondary">Ant Design (secondary)</TypographyText>
    <TypographyText type="success">Ant Design (success)</TypographyText>
    <TypographyText type="warning">Ant Design (warning)</TypographyText>
    <TypographyText type="danger">Ant Design (danger)</TypographyText>
    <TypographyText disabled>Ant Design (disabled)</TypographyText>
  </div>

  <div class="field">
    <span class="caption">decorations</span>
    <TypographyText mark>Ant Design (mark)</TypographyText>
    <TypographyText code>Ant Design (code)</TypographyText>
    <TypographyText keyboard>Ant Design (keyboard)</TypographyText>
    <TypographyText underline>Ant Design (underline)</TypographyText>
    <TypographyText delete>Ant Design (delete)</TypographyText>
    <TypographyText strong>Ant Design (strong)</TypographyText>
    <TypographyText italic>Ant Design (italic)</TypographyText>
  </div>

  <div class="field">
    <span class="caption">combined</span>
    <TypographyText strong code type="danger">Not for production</TypographyText>
  </div>
</div>

<style>
  .stack {
    display: grid;
    justify-items: start;
    gap: 20px;
    --ads-typography-paragraph-margin-bottom: 0;
  }

  .field {
    display: grid;
    justify-items: start;
    gap: 8px;
    width: 100%;
  }

  .caption {
    color: var(--ads-color-text-secondary);
    font-size: 12px;
  }
</style>
