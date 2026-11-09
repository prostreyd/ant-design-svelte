import { page } from '$app/state';
import { translate, type Key, type Lang } from './index';

/** The language of the page; the error page has no layout data, so it falls back to the URL prefix. */
export function currentLang(): Lang {
  const fromData = page.data.lang as Lang | undefined;
  if (fromData) return fromData;
  const prefix = /\/(ru|zh)(\/|$)/.exec(page.url.pathname)?.[1];
  return (prefix as Lang | undefined) ?? 'en';
}

/**
 * Returns the translate function for the language of the current page. `page.data` is reactive, so a call
 * inside a template updates when the language changes.
 */
export function useT(): (key: Key) => string {
  return (key) => translate(currentLang(), key);
}
