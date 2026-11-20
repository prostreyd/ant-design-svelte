import type { Component } from 'svelte';
import IconFont from './IconFont.svelte';
import type { IconFontOptions, IconFontProps } from './types.js';

/** The attribute that marks a script this module added, so that one URL is loaded once however often it is asked for. */
const MARK = 'data-ads-iconfont';

/**
 * Adds one `<script src>` per URL that is not in the page yet. They run in the order of the list (`async = false`), and the
 * sprite script of iconfont.cn puts its symbols in front of the earlier ones, so a later URL overrides an earlier one for a
 * name that both use. On the server there is no document and nothing happens.
 */
function load(urls: readonly string[]): void {
  if (typeof document === 'undefined') return;
  for (const url of urls) {
    if (!url || Array.from(document.scripts).some((script) => script.getAttribute(MARK) === url)) continue;
    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.setAttribute(MARK, url);
    (document.head ?? document.documentElement).appendChild(script);
  }
}

/** The props of one icon with the shared ones behind them: a prop the icon sets wins, whatever it is. Exported for its tests only: the package entry does not export it. */
export function withDefaults<T extends object>(props: T, defaults: Record<string, unknown>): T {
  if (Object.keys(defaults).length === 0) return props;
  return new Proxy(props, {
    get: (target, key, receiver) => (key in target ? Reflect.get(target, key, receiver) : defaults[key as string]),
    has: (target, key) => key in target || key in defaults,
    ownKeys: (target) => [...new Set([...Reflect.ownKeys(target), ...Reflect.ownKeys(defaults)])],
    getOwnPropertyDescriptor: (target, key) =>
      Reflect.getOwnPropertyDescriptor(target, key) ??
      (key in defaults ? { enumerable: true, configurable: true, writable: true, value: defaults[key as string] } : undefined)
  });
}

/**
 * Loads the sprite scripts of an iconfont.cn project and returns the icon component of that font: `<MyIcon type="icon-name" />`.
 * The script is loaded in the browser as soon as this is called; it is a script from the URL the owner gives, run with the page's rights.
 */
export function createFromIconfontCN(options: IconFontOptions = {}): Component<IconFontProps> {
  const { scriptUrl, extraCommonProps = {} } = options;
  load(typeof scriptUrl === 'string' ? [scriptUrl] : (scriptUrl ?? []));
  return (internals, props) => IconFont(internals, withDefaults(props, extraCommonProps));
}
