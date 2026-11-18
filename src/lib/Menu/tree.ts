/**
 * The tree of a menu, with no Svelte in it (specs/menu.md). `items` and the markup components both become `MenuNode`s;
 * the lists draw nodes, and the menu asks the index for parents, key paths and what can take focus.
 */
import { isProduction } from '../internal/env.js';
import type { ContainerRegistration, Registration } from './context.js';
import type {
  MenuContent,
  MenuDividerType,
  MenuGroupType,
  MenuItemEntry,
  MenuItemType,
  MenuItems,
  MenuSubMenuType
} from './types.js';

export interface MenuItemNode {
  kind: 'item';
  key: string;
  data: MenuItemType;
}

export interface MenuSubMenuNode {
  kind: 'submenu';
  key: string;
  data: MenuSubMenuType;
  children: MenuNode[];
}

export interface MenuGroupNode {
  kind: 'group';
  /** Generated: a group has no key of its own for selection or opening. */
  key: string;
  label: MenuContent | undefined;
  class: string | undefined;
  children: MenuNode[];
}

export interface MenuDividerNode {
  kind: 'divider';
  key: string;
  dashed: boolean;
}

export type MenuNode = MenuItemNode | MenuSubMenuNode | MenuGroupNode | MenuDividerNode;

/** A node that has a key the user can see: an item or a submenu. */
export type MenuKeyedNode = MenuItemNode | MenuSubMenuNode;

function warn(message: string): void {
  if (!isProduction()) console.warn(`Menu: ${message}`);
}

/** Keeps the first of two entries with one key, and drops what has no key. */
function claim(seen: Set<string>, key: unknown): key is string {
  if (typeof key !== 'string' || key === '') {
    warn('an item needs a `key` that is a non-empty string; it is left out.');
    return false;
  }
  if (seen.has(key)) {
    warn(`the key "${key}" is used twice; the first one is kept.`);
    return false;
  }
  seen.add(key);
  return true;
}

/** Turns the objects of `items` into nodes. */
export function normalizeItems(items: MenuItems): MenuNode[] {
  const seen = new Set<string>();
  let counter = 0;
  const walk = (entries: ReadonlyArray<MenuItemEntry | null | undefined>): MenuNode[] => {
    const nodes: MenuNode[] = [];
    for (const entry of entries) {
      if (!entry) continue;
      if (entry.type === 'divider') {
        nodes.push({ kind: 'divider', key: `divider:${counter++}`, dashed: (entry as MenuDividerType).dashed === true });
      } else if (entry.type === 'group') {
        const group = entry as MenuGroupType;
        nodes.push({
          kind: 'group',
          key: `group:${counter++}`,
          label: group.label,
          class: group.class,
          children: walk(group.children)
        });
      } else if ('children' in entry && Array.isArray(entry.children)) {
        if (!claim(seen, entry.key)) continue;
        nodes.push({ kind: 'submenu', key: entry.key, data: entry, children: walk(entry.children) });
      } else {
        if (!claim(seen, entry.key)) continue;
        nodes.push({ kind: 'item', key: entry.key, data: entry as MenuItemType });
      }
    }
    return nodes;
  };
  return walk(items);
}

/** Document order of two markers; markers that are not in the document yet keep their order. */
function compareMarkup(a: Registration, b: Registration): number {
  const left = a.node();
  const right = b.node();
  if (!left || !right || left === right) return 0;
  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

/** Turns the components written as markup into nodes, in the order of the markup. */
export function nodesFromRegistrations(registrations: readonly Registration[]): MenuNode[] {
  const roots: MenuNode[] = [];
  const containers = new Map<ContainerRegistration, MenuNode[]>();
  const seen = new Set<string>();
  let counter = 0;
  for (const registration of [...registrations].sort(compareMarkup)) {
    // A component inside one that is gone has no place to go.
    const target = registration.parent ? containers.get(registration.parent) : roots;
    if (!target) continue;
    if (registration.kind === 'divider') {
      target.push({ kind: 'divider', key: `divider:${counter++}`, dashed: registration.props().dashed === true });
    } else if (registration.kind === 'group') {
      const props = registration.props();
      const children: MenuNode[] = [];
      containers.set(registration, children);
      target.push({ kind: 'group', key: `group:${counter++}`, label: props.label, class: props.class, children });
    } else if (registration.kind === 'submenu') {
      const props = registration.props();
      if (!claim(seen, props.key)) continue;
      const children: MenuNode[] = [];
      containers.set(registration, children);
      const data: MenuSubMenuType = { ...props, children: [] };
      target.push({ kind: 'submenu', key: props.key, data, children });
    } else {
      const { children: content, ...props } = registration.props();
      if (!claim(seen, props.key)) continue;
      target.push({ kind: 'item', key: props.key, data: { ...props, label: props.label ?? content } });
    }
  }
  return roots;
}

export interface MenuIndex {
  /** Items and submenus by key. */
  nodeOf: Map<string, MenuKeyedNode>;
  /** The submenu a key is in (`null` at the top level; a group is not a level). */
  parentOf: Map<string, string | null>;
  /** The position among the top-level nodes of the one that holds a key (itself, or its outermost ancestor or group). */
  topIndexOf: Map<string, number>;
}

export function buildIndex(nodes: readonly MenuNode[]): MenuIndex {
  const nodeOf = new Map<string, MenuKeyedNode>();
  const parentOf = new Map<string, string | null>();
  const topIndexOf = new Map<string, number>();
  const walk = (list: readonly MenuNode[], parent: string | null, top: number | null): void => {
    list.forEach((node, position) => {
      const topIndex = top ?? position;
      if (node.kind === 'divider') return;
      if (node.kind === 'group') {
        walk(node.children, parent, topIndex);
        return;
      }
      nodeOf.set(node.key, node);
      parentOf.set(node.key, parent);
      topIndexOf.set(node.key, topIndex);
      if (node.kind === 'submenu') walk(node.children, node.key, topIndex);
    });
  };
  walk(nodes, null, null);
  return { nodeOf, parentOf, topIndexOf };
}

/** The keys from `key` up to the outermost submenu: `[item, parent, grandparent]`. */
export function keyPathOf(index: MenuIndex, key: string): string[] {
  const path: string[] = [];
  for (let current: string | null | undefined = key; current != null; current = index.parentOf.get(current)) {
    path.push(current);
  }
  return path;
}

/** The submenus that hold at least one of the selected keys. */
export function selectedAncestors(index: MenuIndex, selected: ReadonlySet<string>): Set<string> {
  const result = new Set<string>();
  for (const key of selected) {
    for (let parent = index.parentOf.get(key); parent != null; parent = index.parentOf.get(parent)) {
      result.add(parent);
    }
  }
  return result;
}

/**
 * The keys that can take focus, in the order the arrows go: items and submenus that are not disabled, entering a
 * submenu only when `expanded` says it is open. A horizontal bar shows only its first `limit` top-level nodes.
 */
export function focusableKeys(
  nodes: readonly MenuNode[],
  expanded: (key: string) => boolean,
  limit: number | null
): string[] {
  const keys: string[] = [];
  const walk = (list: readonly MenuNode[], top: boolean): void => {
    list.forEach((node, position) => {
      if (top && limit !== null && position >= limit) return;
      if (node.kind === 'group') walk(node.children, false);
      else if (node.kind === 'item') {
        if (!node.data.disabled) keys.push(node.key);
      } else if (node.kind === 'submenu') {
        if (node.data.disabled) return;
        keys.push(node.key);
        if (expanded(node.key)) walk(node.children, false);
      }
    });
  };
  walk(nodes, true);
  return keys;
}

/** The text a node would be found by when the user types: a string or number label; other labels are read from the page. */
export function labelText(label: MenuContent | undefined): string | undefined {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : undefined;
}
