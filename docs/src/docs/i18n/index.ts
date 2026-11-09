import { strings } from './strings';

export type Lang = 'en' | 'ru' | 'zh';
export type Key = keyof typeof strings;

export const LANGS: readonly Lang[] = ['en', 'ru', 'zh'];

/** Native language names for the language menu, and the value of <html lang>. */
export const LANG_INFO: Record<Lang, { label: string; name: string; html: string }> = {
  en: { label: 'EN', name: 'English', html: 'en' },
  ru: { label: 'RU', name: 'Русский', html: 'ru' },
  zh: { label: '中文', name: '中文', html: 'zh-CN' }
};

export function translate(lang: Lang, key: Key): string {
  return strings[key][lang];
}

/** Text without markup, for meta descriptions and attributes. */
export function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

export { strings };
