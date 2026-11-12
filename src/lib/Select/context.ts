import { getContext, setContext, type Snippet } from 'svelte';
import type { SelectValue } from './types.js';

/** What a `SelectOption` written as markup tells its Select. The members are getters over its props. */
export interface OptionRegistration {
  kind: 'option';
  /** The invisible element the option leaves in the markup; its position is the position of the option. */
  node: () => Element | null;
  group: GroupRegistration | undefined;
  props: () => {
    value: SelectValue;
    label: string | number | Snippet | undefined;
    disabled: boolean | undefined;
    title: string | undefined;
    class: string | undefined;
    children: Snippet | undefined;
  };
}

/** What a `SelectOptGroup` written as markup tells its Select. */
export interface GroupRegistration {
  kind: 'group';
  node: () => Element | null;
  props: () => {
    label: string | number | Snippet;
    title: string | undefined;
    class: string | undefined;
  };
}

export type Registration = OptionRegistration | GroupRegistration;

/** The Select that the options and groups written inside it register with. */
export interface SelectContext {
  /** Adds an option or a group; returns the function that removes it. */
  register(registration: Registration): () => void;
}

const SELECT_KEY = Symbol('ads-select');
const GROUP_KEY = Symbol('ads-select-group');

export function setSelectContext(context: SelectContext): void {
  setContext(SELECT_KEY, context);
}

/** The nearest Select, or `undefined` outside of one. */
export function getSelectContext(): SelectContext | undefined {
  return getContext<SelectContext | undefined>(SELECT_KEY);
}

export function setGroupContext(group: GroupRegistration): void {
  setContext(GROUP_KEY, group);
}

/** The nearest `SelectOptGroup` between here and the Select, or `undefined`. */
export function getGroupContext(): GroupRegistration | undefined {
  return getContext<GroupRegistration | undefined>(GROUP_KEY);
}
