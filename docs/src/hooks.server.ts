import type { Handle } from '@sveltejs/kit/hooks';

const HTML_LANG: Record<string, string> = { ru: 'ru', zh: 'zh-CN' };

/** Writes the page language into <html lang> of the prerendered HTML. */
export const handle: Handle = ({ event, resolve }) => {
  const lang = HTML_LANG[event.params.lang ?? ''] ?? 'en';
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
