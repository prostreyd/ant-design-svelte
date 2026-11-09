// The page registry. Menus, search, previous/next links, the sitemap and the prerender entry list are all
// built from it. Plain TypeScript with no SvelteKit imports, so the build config and the tests can use it.
import type { Key, Lang } from './i18n/index.ts';

export type Section = 'home' | 'docs' | 'components';

/** An absolute path of the site, e.g. '/docs/faq/'. */
export type SitePath = `/${string}`;

export interface PageDef {
  /** Path without the language prefix, with a trailing slash. */
  path: SitePath;
  section: Section;
  title: Key;
  description: Key;
}

export const homePage: PageDef = { path: '/', section: 'home', title: 'home.title', description: 'hero.lead' };

export const docsPages: PageDef[] = [
  { path: '/docs/', section: 'docs', title: 'd.intro', description: 'intro.lead' },
  { path: '/docs/getting-started/', section: 'docs', title: 'd.start', description: 'start.lead' },
  { path: '/docs/theme/', section: 'docs', title: 'd.theme', description: 'theme.lead' },
  { path: '/docs/dark-mode/', section: 'docs', title: 'd.dark', description: 'dark.lead' },
  { path: '/docs/accessibility/', section: 'docs', title: 'd.a11y', description: 'a11y.lead' },
  { path: '/docs/faq/', section: 'docs', title: 'd.faq', description: 'faq.lead' },
  { path: '/docs/contributing/', section: 'docs', title: 'd.contrib', description: 'contrib.lead' }
];

export const componentPages: PageDef[] = [
  { path: '/components/', section: 'components', title: 'c.overview', description: 'ov.lead' },
  { path: '/components/button/', section: 'components', title: 'b.title', description: 'b.lead' }
];

export const allPages: PageDef[] = [homePage, ...docsPages, ...componentPages];

/** Where a component is on the roadmap: `now` has a page, `next` is the first batch, `later` follows. */
export type Phase = 'now' | 'next' | 'later';

export interface ComponentItem {
  name: string;
  /** Localized name shown next to the English one. */
  note: Key;
  phase: Phase;
  /** Present only when the component has a page (`phase: 'now'`). */
  path?: SitePath;
}

export interface ComponentGroup {
  title: Key;
  items: ComponentItem[];
}

/** The components of the library, grouped like the sidebar of the Components section. The roadmap is built from it. */
export const componentGroups: ComponentGroup[] = [
  {
    title: 'g.general',
    items: [
      { name: 'Button', note: 'n.button', phase: 'now', path: '/components/button/' },
      { name: 'Typography', note: 'n.typography', phase: 'next' },
      { name: 'Icon', note: 'n.icon', phase: 'next' }
    ]
  },
  {
    title: 'g.nav',
    items: [
      { name: 'Menu', note: 'n.menu', phase: 'later' },
      { name: 'Dropdown', note: 'n.dropdown', phase: 'later' }
    ]
  },
  {
    title: 'g.entry',
    items: [
      { name: 'Input', note: 'n.input', phase: 'next' },
      { name: 'Checkbox', note: 'n.checkbox', phase: 'next' },
      { name: 'Radio', note: 'n.radio', phase: 'next' },
      { name: 'Switch', note: 'n.switch', phase: 'next' },
      { name: 'Select', note: 'n.select', phase: 'later' },
      { name: 'DatePicker', note: 'n.datepicker', phase: 'later' },
      { name: 'Form', note: 'n.form', phase: 'later' }
    ]
  },
  {
    title: 'g.display',
    items: [
      { name: 'Table', note: 'n.table', phase: 'later' },
      { name: 'Tooltip', note: 'n.tooltip', phase: 'later' }
    ]
  },
  {
    title: 'g.feedback',
    items: [
      { name: 'Modal', note: 'n.modal', phase: 'later' },
      { name: 'Drawer', note: 'n.drawer', phase: 'later' },
      { name: 'Message', note: 'n.message', phase: 'later' },
      { name: 'Notification', note: 'n.notification', phase: 'later' }
    ]
  }
];

/** Names of the components in a phase of the roadmap, in the order of the sidebar. */
export function componentsIn(phase: Phase): string[] {
  return componentGroups.flatMap((group) => group.items).filter((item) => item.phase === phase).map((item) => item.name);
}

/** English is served from the root; Russian and Chinese live under /ru/ and /zh/. */
export function localize(path: SitePath, lang: Lang): SitePath {
  return lang === 'en' ? path : `/${lang}${path}`;
}

/** Every URL of the site (without the base path), for prerendering and the sitemap. */
export function allEntries(langs: readonly Lang[] = ['en', 'ru', 'zh']): SitePath[] {
  return allPages.flatMap((p) => langs.map((l) => localize(p.path, l)));
}

/** '/[[lang=lang]]/docs/faq' -> '/docs/faq/'. A missing route (error page) counts as the home page. */
export function logicalPath(routeId: string | null): SitePath {
  const path = (routeId ?? '').replace('/[[lang=lang]]', '') || '/';
  return (path.endsWith('/') ? path : `${path}/`) as SitePath;
}

export function sectionOf(path: string): Section {
  return path.startsWith('/docs/') ? 'docs' : path.startsWith('/components/') ? 'components' : 'home';
}
