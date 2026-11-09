import { page } from '$app/state';
import { resolve } from '$app/paths';
import { localize, type SitePath } from './pages';
import type { Lang } from './i18n';

// resolve() is typed against the route IDs of this app, while the links of the site come from the page
// registry (pages.ts) with the language prefix added on top. Its pathname form needs no route ID.
const resolvePathname = resolve as unknown as (pathname: string) => string;

/** Internal link: adds the base path (relative while prerendering, so the build works under any base). */
export function href(path: SitePath): string {
  return resolvePathname(path.slice(1));
}

/** Link to a page in the language of the page being viewed. */
export function localHref(path: SitePath, lang: Lang = page.data.lang): string {
  return href(localize(path, lang));
}
