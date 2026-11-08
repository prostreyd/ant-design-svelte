export type SiteTheme = 'light' | 'dark';

const themeStorageKey = 'svelte-ui-theme';

export function getSiteTheme(): SiteTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function updateThemeColor(theme: SiteTheme): void {
  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#141414' : '#ffffff');
}

function applyTheme(theme: SiteTheme): void {
  document.documentElement.dataset.theme = theme;
  updateThemeColor(theme);
}

export function setSiteTheme(theme: SiteTheme): void {
  localStorage.setItem(themeStorageKey, theme);
  applyTheme(theme);
}

export function initializeSiteTheme(): void {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = localStorage.getItem(themeStorageKey);
  const theme: SiteTheme =
    savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : systemTheme.matches
        ? 'dark'
        : 'light';

  applyTheme(theme);

  systemTheme.addEventListener('change', (event) => {
    const storedTheme = localStorage.getItem(themeStorageKey);
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });
}
