// Build-time constants (see vite.config.ts) and project links.
declare const __SITE_BASE__: string;
declare const __SITE_ORIGIN__: string;

export const SITE_URL = `${__SITE_ORIGIN__}${__SITE_BASE__}`;
export const REPO = 'https://github.com/prostreyd/ant-design-svelte';
export const NPM = 'https://www.npmjs.com/package/svelte-ant-design';
export const CHANGELOG = `${REPO}/blob/main/CHANGELOG.md`;
