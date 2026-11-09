// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
  namespace App {
    interface PageData {
      lang: import('#docs/i18n').Lang;
    }
  }
}

export {};
