<script lang="ts">
  import { LANG_INFO } from '#docs/i18n';
  import { currentLang } from '#docs/i18n/use-t';

  // Prerendered pages carry the right <html lang> already; this keeps it right after a client-side
  // language switch, so a screen reader pronounces the text of the new language correctly.
  $effect(() => {
    document.documentElement.lang = LANG_INFO[currentLang()].html;
  });
</script>
