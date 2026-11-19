import { untrack } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { mergeMessages } from './messages.js';
import { clone, deleteIn, fillMissing, getIn, isEqual, isPrefix, leafPaths, mergeDeep, pathKey, setIn, toPath } from './path.js';
import type {
  FormDeepPartial,
  FormFieldData,
  FormFieldError,
  FormFinishFailedInfo,
  FormNamePath,
  FormNamePathPart,
  FormRuleConfig,
  FormScrollOptions,
  FormValidateConfig,
  FormValidateMessages,
  FormValidateTrigger
} from './types.js';
import { runRules } from './validate.js';

/** What the store keeps of one field besides its value. */
interface FieldMeta {
  touched: boolean;
  validating: boolean;
  /** A validation has finished for the field (the base of the `success` status). */
  validated: boolean;
  errors: string[];
  warnings: string[];
}

const EMPTY: FieldMeta = { touched: false, validating: false, validated: false, errors: [], warnings: [] };

/** What an item tells the store about its field. Every member reads the current state of the item, so a prop can change. */
export interface FieldEntry {
  readonly id: symbol;
  path(): FormNamePathPart[];
  /** The rules, with the functions already called. */
  rules(): FormRuleConfig[];
  triggers(): FormValidateTrigger[];
  validateFirst(): boolean | 'parallel';
  debounce(): number | undefined;
  dependencies(): FormNamePathPart[][];
  /** The variables of the message templates; `name` is the label of the item. */
  variables(): Record<string, string>;
  preserve(): boolean;
  /** An IME composition is open in the control. */
  composing(): boolean;
  /** The `id` of the control. */
  controlId(): string;
  /** The box that holds the control. */
  container(): HTMLElement | null;
}

/** What the `Form` that owns the store gives it. */
export interface FormHooks {
  submit?: () => void;
  onvalueschange?: (changed: object, all: object) => void;
  onfieldschange?: (changed: FormFieldData[], all: FormFieldData[]) => void;
  /** The `validateMessages` of the form. */
  messages?: () => FormValidateMessages | undefined;
}

/** Tells which fields `getFieldsValue` keeps. */
type FieldsFilter = (meta: { touched: boolean; validating: boolean }) => boolean;
type GetFieldsOptions = { filter?: FieldsFilter };

interface Validation {
  errors: string[];
  warnings: string[];
}

const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const asList = <T>(value: T | readonly T[] | undefined): T[] =>
  value === undefined ? [] : Array.isArray(value) ? [...(value as readonly T[])] : [value as T];

/** The element that takes focus for a control: itself when it can, else the first focusable inside. */
function focusTarget(element: HTMLElement): HTMLElement | null {
  if (element.matches(FOCUSABLE)) return element;
  return element.querySelector<HTMLElement>(FOCUSABLE);
}

/**
 * The values and the state of the fields of one form. Make one with `createForm()`, pass it to a `Form`, and read or
 * change it from anywhere. Reading a value, an error or a flag inside markup, `$derived` or `$effect` is tracked.
 */
export class FormStore<Values extends object = Record<string, unknown>> {
  #values: Record<string, unknown> = $state({});
  /** The consumer's own object that holds the values (the `model` of the `Form`), when there is one. */
  #model = $state.raw<Record<string, unknown> | undefined>(undefined);
  /** The last value of each registered field that the store knows (a snapshot): what a change from outside is compared with. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #seen = new Map<string, unknown>();
  #meta = new SvelteMap<string, FieldMeta>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #entries = new Map<symbol, FieldEntry>();
  /** Changes when an item registers or leaves, so `getFieldsValue()` follows the set of fields. */
  #version = $state(0);
  #initial: Record<string, unknown> = {};
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #itemInitials = new Map<string, { path: FormNamePathPart[]; value: unknown }>();
  #hooks: FormHooks = {};
  /** The id of the latest validation of each field: a result of an older one is dropped. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #runs = new Map<string, number>();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #timers = new Map<symbol, ReturnType<typeof setTimeout>>();
  /** Fields whose `change` validation waits for the end of an IME composition. */
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- bookkeeping of the store, read by no template: it must not be reactive
  #pending = new Set<symbol>();
  #validateRun = 0;

  // ---- the owner (Form) and the items ---------------------------------------------------------------------------

  /**
   * Called by the `Form`: the values the fields start with, and the consumer's `model` when it has one. Without a model,
   * values that are already set are kept. With one, the model's own values win: what was set on the instance before and then
   * `initialValues` only fill what it lacks, and the model as it is now is what `resetFields()` returns to.
   */
  init(initialValues?: Record<string, unknown>, model?: Record<string, unknown>): void {
    const preset = $state.snapshot(this.#values) as Record<string, unknown>;
    if (model) {
      fillMissing(model, preset);
      fillMissing(model, initialValues ?? {});
      this.#initial = clone($state.snapshot(model) as Record<string, unknown>);
      this.#values = {};
      this.#model = model;
      this.#settle();
      return;
    }
    this.#model = undefined;
    this.#initial = clone(initialValues ?? {});
    const base = clone(this.#initial);
    mergeDeep(base, preset);
    this.#values = base;
  }

  /**
   * Called by the `Form` when its `model` is replaced (or removed): the values are read from the new object, no change is
   * reported, and the snapshot for `resetFields()` stays. A removed model leaves its values in the store.
   */
  attachModel(model: Record<string, unknown> | undefined): void {
    const current = untrack(() => this.#model);
    if (current === model) return;
    if (!model && current) this.#values = clone($state.snapshot(current) as Record<string, unknown>);
    this.#model = model;
    this.#settle();
  }

  /** Called by the `Form`: what it wants to hear and the submit it runs. */
  bind(hooks: FormHooks): void {
    this.#hooks = hooks;
  }

  /** Called by an item: the value it starts with when the form has none. */
  setItemInitial(path: readonly FormNamePathPart[], value: unknown): void {
    this.#itemInitials.set(pathKey(path), { path: [...path], value });
    const data = this.#current();
    if (value !== undefined && getIn(data, path) === undefined) setIn(data, path, clone(value));
    this.#settle(path);
  }

  /** Called by an item when it mounts. Returns what to call when it leaves. */
  register(entry: FieldEntry): () => void {
    this.#entries.set(entry.id, entry);
    this.#remember(entry.path());
    this.#bump();
    return () => {
      this.#entries.delete(entry.id);
      this.#bump();
      const timer = this.#timers.get(entry.id);
      if (timer !== undefined) clearTimeout(timer);
      this.#timers.delete(entry.id);
      this.#pending.delete(entry.id);
      const path = entry.path();
      const key = pathKey(path);
      const stays = [...this.#entries.values()].some((other) => pathKey(other.path()) === key);
      if (!stays) {
        this.#runs.set(key, (this.#runs.get(key) ?? 0) + 1);
        this.#meta.delete(key);
        this.#seen.delete(key);
        if (!entry.preserve()) deleteIn(this.#current(), path);
        this.#settle(path);
      }
    };
  }

  /** The state of a field, reactive. */
  fieldMeta(path: readonly FormNamePathPart[]): Readonly<FieldMeta> {
    return this.#meta.get(pathKey(path)) ?? EMPTY;
  }

  /** The live value of a field (not a copy), reactive. */
  valueAt(path: readonly FormNamePathPart[]): unknown {
    return getIn(this.#data(), path);
  }

  // ---- reading --------------------------------------------------------------------------------------------------

  /** The value of a field. It is the live value: copy it before changing it. */
  getFieldValue<K extends keyof Values>(name: K): Values[K];
  getFieldValue(name: readonly FormNamePathPart[]): unknown;
  getFieldValue(name: FormNamePath): unknown {
    return this.valueAt(toPath(name));
  }

  /**
   * The values of the fields, as a nested object. No argument: the fields that have an item. `true`: every value in
   * the store. A list of names: those. `{ filter }` (alone or as the second argument) keeps the fields it returns `true` for.
   * Only `true` returns the whole `Values`; the other forms return the fields that are there, so their type is a partial.
   */
  getFieldsValue(names: true): Values;
  getFieldsValue(names?: readonly FormNamePath[] | GetFieldsOptions, options?: GetFieldsOptions): FormDeepPartial<Values>;
  getFieldsValue(names?: true | readonly FormNamePath[] | GetFieldsOptions, options?: GetFieldsOptions): unknown {
    return this.#collect(names, options);
  }

  /** The body of `getFieldsValue`. The callbacks that promise `Values` (`validateFields`, `onvalueschange`) read it as `Values`. */
  #collect(names?: true | readonly FormNamePath[] | GetFieldsOptions, options?: GetFieldsOptions): Values {
    void this.#version;
    const isList = Array.isArray(names);
    const filter = options?.filter ?? (names && names !== true && !isList ? (names as GetFieldsOptions).filter : undefined);
    const data = this.#data();
    if (names === true) return clone($state.snapshot(data)) as Values;
    const paths = isList ? (names as readonly FormNamePath[]).map(toPath) : this.#registeredPaths();
    const result: Record<string, unknown> = {};
    for (const path of paths) {
      if (filter) {
        const meta = this.fieldMeta(path);
        if (!filter({ touched: meta.touched, validating: meta.validating })) continue;
      }
      setIn(result, path, clone($state.snapshot(getIn(data, path))));
    }
    return result as Values;
  }

  getFieldError(name: FormNamePath): string[] {
    return [...this.fieldMeta(toPath(name)).errors];
  }

  getFieldWarning(name: FormNamePath): string[] {
    return [...this.fieldMeta(toPath(name)).warnings];
  }

  getFieldsError(names?: readonly FormNamePath[]): FormFieldError[] {
    void this.#version;
    const paths = names ? names.map(toPath) : this.#registeredPaths();
    return paths.map((path) => {
      const meta = this.fieldMeta(path);
      return { name: path, errors: [...meta.errors], warnings: [...meta.warnings] };
    });
  }

  isFieldTouched(name: FormNamePath): boolean {
    return this.fieldMeta(toPath(name)).touched;
  }

  /** Whether any (or, with `allTouched`, every) listed field was touched; no list: every field that has an item. */
  isFieldsTouched(names?: readonly FormNamePath[], allTouched = false): boolean {
    void this.#version;
    const paths = names ? names.map(toPath) : this.#registeredPaths();
    if (paths.length === 0) return false;
    const touched = (path: FormNamePathPart[]) => this.fieldMeta(path).touched;
    return allTouched ? paths.every(touched) : paths.some(touched);
  }

  isFieldValidating(name: FormNamePath): boolean {
    return this.fieldMeta(toPath(name)).validating;
  }

  // ---- writing --------------------------------------------------------------------------------------------------

  /** Sets a value and clears the messages of the field. It is not a user change: no callback, no validation. */
  setFieldValue<K extends keyof Values>(name: K, value: Values[K]): void;
  setFieldValue(name: readonly FormNamePathPart[], value: unknown): void;
  setFieldValue(name: FormNamePath, value: unknown): void {
    const path = toPath(name);
    setIn(this.#data(), path, value);
    this.#settle(path);
    this.#clear(path);
  }

  /** Merges values into the store and clears the messages of the fields they reach. No callback, no validation. */
  setFieldsValue(values: FormDeepPartial<Values>): void {
    mergeDeep(this.#data(), values as Record<string, unknown>);
    this.#settle();
    const leaves = leafPaths(values);
    const reached: Record<string, true> = {};
    for (const entry of this.#entries.values()) {
      const path = entry.path();
      if (leaves.some((leaf) => isPrefix(leaf, path) || isPrefix(path, leaf))) reached[pathKey(path)] = true;
    }
    for (const leaf of leaves) reached[pathKey(leaf)] = true;
    for (const key of Object.keys(reached)) this.#clearKey(key);
  }

  /** Sets the state of fields: any of the value, `touched`, `validating`, `errors`, `warnings`. */
  setFields(fields: readonly FormFieldData[]): void {
    for (const field of fields) {
      const key = pathKey(field.name);
      if ('value' in field) {
        setIn(this.#data(), field.name, field.value);
        this.#settle(field.name);
      }
      const patch: Partial<FieldMeta> = {};
      if (field.touched !== undefined) patch.touched = field.touched;
      if (field.validating !== undefined) patch.validating = field.validating;
      if (field.errors !== undefined) patch.errors = [...field.errors];
      if (field.warnings !== undefined) patch.warnings = [...field.warnings];
      if (field.errors !== undefined || field.warnings !== undefined) patch.validated = true;
      if (Object.keys(patch).length > 0) {
        this.#runs.set(key, (this.#runs.get(key) ?? 0) + 1);
        this.#patch(key, patch);
      }
    }
  }

  /** Back to the initial values (all fields, or the listed ones), with no touched flags and no messages. */
  resetFields(names?: readonly FormNamePath[]): void {
    if (!names) {
      const base = clone(this.#initial);
      for (const { path, value } of this.#itemInitials.values()) {
        if (getIn(base, path) === undefined && value !== undefined) setIn(base, path, clone(value));
      }
      this.#replaceData(base);
      this.#settle();
      for (const key of [...this.#meta.keys()]) this.#clearKey(key, true);
      for (const entry of this.#entries.values()) this.#clearKey(pathKey(entry.path()), true);
      return;
    }
    const data = this.#data();
    for (const name of names) {
      const path = toPath(name);
      const key = pathKey(path);
      const initial = getIn(this.#initial, path) ?? this.#itemInitials.get(key)?.value;
      if (initial === undefined) deleteIn(data, path);
      else setIn(data, path, clone(initial));
      this.#settle(path);
      this.#clearKey(key, true);
    }
  }

  // ---- validation -----------------------------------------------------------------------------------------------

  /**
   * Validates the fields that have an item (or the listed ones) and resolves with their values. A failure rejects with
   * `{ values, errorFields, outOfDate }`. A field with only warnings does not fail.
   */
  async validateFields(
    names?: readonly FormNamePath[],
    config: FormValidateConfig = {}
  ): Promise<Values> {
    const run = ++this.#validateRun;
    const targets = this.#select(names, config);
    const results = await Promise.all(targets.map((entry) => this.#validate(entry, null, config.validateOnly === true)));
    const errorFields: FormFieldError[] = [];
    targets.forEach((entry, index) => {
      const result = results[index];
      if (result && result.errors.length > 0) {
        errorFields.push({ name: entry.path(), errors: result.errors, warnings: result.warnings });
      }
    });
    errorFields.sort((a, b) => this.#documentOrder(a.name, b.name));
    const values = names && names.length > 0 ? this.#collect(names) : this.#collect();
    const outOfDate = run !== this.#validateRun;
    if (errorFields.length > 0) {
      const info: FormFinishFailedInfo<Values> = { values, errorFields, outOfDate };
      throw info;
    }
    return values;
  }

  /** Does what a submit button does: validate, then `onfinish` or `onfinishfailed`. Needs a mounted `Form`. */
  submit(): void {
    this.#hooks.submit?.();
  }

  /** Scrolls the control of a field into view, and focuses it with `{ focus: true }`. */
  scrollToField(name: FormNamePath, options: FormScrollOptions = {}): void {
    const key = pathKey(toPath(name));
    const entry = [...this.#entries.values()].find((candidate) => pathKey(candidate.path()) === key);
    if (!entry || typeof document === 'undefined') return;
    const { focus, ...scroll } = options;
    const element = document.getElementById(entry.controlId()) ?? entry.container();
    if (!element) return;
    const target = focusTarget(element) ?? element;
    // `scrollIntoView` is missing in some test environments; focusing still works there.
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'nearest', ...scroll });
    if (focus) target.focus({ preventScroll: true });
  }

  // ---- called by the items --------------------------------------------------------------------------------------

  /** The user changed the field: store it, mark it touched, tell the form, validate, and re-validate its dependents. */
  userChange(entry: FieldEntry, value: unknown): void {
    const path = entry.path();
    setIn(this.#current(), path, value);
    // The value is written by the store itself, so the watcher of the model must not report it a second time.
    this.#settle(path);
    this.#changed(entry, value);
  }

  /**
   * Called by an item inside an effect. With a model, a value that differs from what the store last knew was changed from
   * outside (a control that binds the model, or code that assigns to it): it is a user change (Q5 A).
   */
  observe(entry: FieldEntry): void {
    const model = this.#model;
    if (!model) return;
    const path = entry.path();
    // The deep snapshot reads every part of the value, so the effect runs again when any part of it changes.
    const current = $state.snapshot(getIn(model, path));
    untrack(() => {
      if (isEqual(this.#seen.get(pathKey(path)), current)) return;
      this.#remember(path);
      this.#changed(entry, current);
    });
  }

  /** What follows a change by the user, however it came: touched, the callbacks, validation, the dependents. */
  #changed(entry: FieldEntry, value: unknown): void {
    const path = entry.path();
    const key = pathKey(path);
    this.#runs.set(key, (this.#runs.get(key) ?? 0) + 1);
    this.#patch(key, { touched: true });
    if (this.#hooks.onvalueschange) {
      const changed: Record<string, unknown> = {};
      setIn(changed, path, clone($state.snapshot(value)));
      this.#hooks.onvalueschange(changed, this.#collect());
    }
    this.#emit([path]);
    if (entry.triggers().includes('change')) {
      if (entry.composing()) this.#pending.add(entry.id);
      else this.#schedule(entry, 'change');
    }
    this.#revalidateDependents(path);
  }

  /** The control of a field lost focus. */
  blur(entry: FieldEntry): void {
    if (!entry.triggers().includes('blur')) return;
    this.#patch(pathKey(entry.path()), { touched: true });
    this.#schedule(entry, 'blur');
  }

  /** An IME composition in the control ended: a held-back `change` validation runs now. */
  compositionEnd(entry: FieldEntry): void {
    if (this.#pending.delete(entry.id)) this.#schedule(entry, 'change');
  }

  // ---- inside ---------------------------------------------------------------------------------------------------

  /** Tells the readers of `getFieldsValue()` that the set of fields changed. It reads nothing, so an effect may call it. */
  #bump(): void {
    const current = untrack(() => this.#version);
    this.#version = current + 1;
  }

  /** The object that holds the values: the consumer's model, or the store's own. A read here is tracked. */
  #data(): Record<string, unknown> {
    return this.#model ?? this.#values;
  }

  /** The same, read without tracking, for what runs inside an effect or an event. */
  #current(): Record<string, unknown> {
    return untrack(() => this.#model ?? this.#values);
  }

  /** Writes a whole set of values in place (the model keeps its identity); the store's own values are replaced. */
  #replaceData(base: Record<string, unknown>): void {
    const model = untrack(() => this.#model);
    if (!model) {
      this.#values = base;
      return;
    }
    for (const key of Object.keys(model)) {
      if (!(key in base)) delete model[key];
    }
    for (const key of Object.keys(base)) model[key] = base[key];
  }

  /** Remembers the value a registered field has now, as the one the store knows. Reads without tracking: it runs in effects. */
  #remember(path: readonly FormNamePathPart[]): void {
    this.#seen.set(
      pathKey(path),
      untrack(() => $state.snapshot(getIn(this.#model ?? this.#values, path)))
    );
  }

  /** After a write by the store: remember the values of the fields it may have touched (all, or those around `path`). */
  #settle(path?: readonly FormNamePathPart[]): void {
    for (const entry of this.#entries.values()) {
      const mine = entry.path();
      if (!path || isPrefix(path, mine) || isPrefix(mine, path)) this.#remember(mine);
    }
  }

  #registeredPaths(): FormNamePathPart[][] {
    const seen: Record<string, true> = {};
    const paths: FormNamePathPart[][] = [];
    for (const entry of this.#entries.values()) {
      const path = entry.path();
      const key = pathKey(path);
      if (seen[key]) continue;
      seen[key] = true;
      paths.push(path);
    }
    return paths;
  }

  #patch(key: string, patch: Partial<FieldMeta>): void {
    this.#meta.set(key, { ...(this.#meta.get(key) ?? EMPTY), ...patch });
  }

  #clear(path: readonly FormNamePathPart[]): void {
    this.#clearKey(pathKey(path));
  }

  /** Drops the messages of a field and cancels what is running for it; `all` drops the touched flag too. */
  #clearKey(key: string, all = false): void {
    this.#runs.set(key, (this.#runs.get(key) ?? 0) + 1);
    const current = this.#meta.get(key);
    if (!current) return;
    if (all) this.#meta.delete(key);
    else this.#meta.set(key, { ...current, validating: false, validated: false, errors: [], warnings: [] });
  }

  #fieldData(path: FormNamePathPart[]): FormFieldData {
    const meta = this.fieldMeta(path);
    return {
      name: path,
      value: clone($state.snapshot(getIn(this.#current(), path))),
      touched: meta.touched,
      validating: meta.validating,
      errors: [...meta.errors],
      warnings: [...meta.warnings]
    };
  }

  #emit(paths: FormNamePathPart[][]): void {
    const hook = this.#hooks.onfieldschange;
    if (!hook) return;
    hook(
      paths.map((path) => this.#fieldData(path)),
      this.#registeredPaths().map((path) => this.#fieldData(path))
    );
  }

  /** The items a validation addresses. */
  #select(names: readonly FormNamePath[] | undefined, config: FormValidateConfig): FieldEntry[] {
    let entries = [...this.#entries.values()];
    if (names && names.length > 0) {
      const wanted = names.map(toPath);
      entries = entries.filter((entry) => {
        const path = entry.path();
        return wanted.some((name) => pathKey(name) === pathKey(path) || (config.recursive === true && isPrefix(name, path)));
      });
    }
    if (config.dirty) {
      entries = entries.filter((entry) => {
        const meta = this.fieldMeta(entry.path());
        return meta.touched || meta.validated;
      });
    }
    return entries;
  }

  #documentOrder(a: FormNamePathPart[], b: FormNamePathPart[]): number {
    const container = (path: FormNamePathPart[]) =>
      [...this.#entries.values()].find((entry) => pathKey(entry.path()) === pathKey(path))?.container() ?? null;
    const first = container(a);
    const second = container(b);
    if (!first || !second || first === second) return 0;
    return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }

  /** The rules that run on a trigger (`null`: all of them). */
  #rulesFor(entry: FieldEntry, trigger: FormValidateTrigger | null): FormRuleConfig[] {
    const itemTriggers = entry.triggers();
    return entry.rules().filter((rule) => {
      if (trigger === null) return true;
      const own = asList(rule.validateTrigger);
      return (own.length > 0 ? own : itemTriggers).includes(trigger);
    });
  }

  /**
   * Runs the rules of a field. `silent` computes the result and touches nothing (`validateOnly`). Resolves `null` when
   * no rule is bound to the trigger, so the status stays as it was.
   */
  async #validate(entry: FieldEntry, trigger: FormValidateTrigger | null, silent = false): Promise<Validation | null> {
    const path = entry.path();
    const key = pathKey(path);
    const rules = this.#rulesFor(entry, trigger);
    if (rules.length === 0 && trigger !== null) return null;
    const run = (this.#runs.get(key) ?? 0) + 1;
    this.#runs.set(key, run);
    if (!silent) {
      this.#patch(key, { validating: true });
      this.#emit([path]);
    }
    let result: Validation;
    try {
      result = await runRules({
        value: $state.snapshot(getIn(this.#current(), path)),
        rules,
        first: entry.validateFirst(),
        messages: mergeMessages(this.#hooks.messages?.()),
        variables: entry.variables()
      });
    } catch (error) {
      if (!silent && this.#runs.get(key) === run) this.#patch(key, { validating: false });
      throw error;
    }
    if (!silent && this.#runs.get(key) === run) {
      this.#patch(key, { validating: false, validated: true, errors: result.errors, warnings: result.warnings });
      this.#emit([path]);
    }
    return result;
  }

  /** Starts a validation after the item's debounce. A newer change replaces a waiting one. */
  #schedule(entry: FieldEntry, trigger: FormValidateTrigger | null): void {
    const waiting = this.#timers.get(entry.id);
    if (waiting !== undefined) clearTimeout(waiting);
    const run = () => {
      this.#timers.delete(entry.id);
      this.#validate(entry, trigger).catch((error) => {
        console.error('Form: a validation failed with an error.', error);
      });
    };
    const delay = entry.debounce();
    if (delay !== undefined && delay > 0) this.#timers.set(entry.id, setTimeout(run, delay));
    else run();
  }

  /** The items that list the changed field as a dependency are validated again if they were touched or validated. */
  #revalidateDependents(changed: readonly FormNamePathPart[]): void {
    for (const entry of this.#entries.values()) {
      const related = entry.dependencies().some((dependency) => isPrefix(dependency, changed) || isPrefix(changed, dependency));
      if (!related) continue;
      const meta = this.fieldMeta(entry.path());
      if (meta.touched || meta.validated || meta.errors.length > 0 || meta.warnings.length > 0) this.#schedule(entry, null);
    }
  }
}

/** Makes the store of a form: pass it to `<Form {form}>` and call its methods. */
export function createForm<Values extends object = Record<string, unknown>>(): FormStore<Values> {
  return new FormStore<Values>();
}
