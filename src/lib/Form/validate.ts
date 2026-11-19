/**
 * The adapter between the rules of a field and the validation library (`@rc-component/async-validator`). It is the
 * only file that imports the library, so the engine can be replaced without touching anything else.
 *
 * The library checks one value against one descriptor: the keys `type`, `required`, `len`, `min`, `max`, `pattern`,
 * `enum`, `whitespace`, `transform`, `fields` and `defaultField`, and a custom check. What it does not have is added
 * here: `warningOnly`, the message templates, `validateFirst`, and the rule of a field as a list of independent units
 * (each rule is run by its own schema, so one rule can never change how another is read).
 */
import Schema from '@rc-component/async-validator';
import { formatMessage } from './messages.js';
import type { FormRuleConfig, FormValidateMessages } from './types.js';

/** What a run needs. */
export interface RuleRunInput {
  /** The value of the field. */
  value: unknown;
  /** The rules to run, in order. */
  rules: readonly FormRuleConfig[];
  /** `true`: stop at the first failing rule. `'parallel'`: run all, keep the messages of the first failing rule only. */
  first?: boolean | 'parallel';
  /** The templates of the messages, already merged with the defaults. */
  messages: FormValidateMessages;
  /** The variables of the templates besides the values of the rule. `name` is the label of the item. */
  variables: Readonly<Record<string, string>>;
}

/** What a run found. */
export interface RuleRunResult {
  errors: string[];
  warnings: string[];
}

const KEY = 'value';

/** The keys of a rule that the library checks. */
const CHECKS = [
  'required',
  'type',
  'len',
  'min',
  'max',
  'pattern',
  'enum',
  'whitespace',
  'transform',
  'defaultField',
  'fields'
] as const;

type Unit = { rule: FormRuleConfig; kind: 'checks' | 'validator' };

/**
 * One rule is one unit, or two: the checks of the library, and the custom `validator`. In the library a custom check
 * replaces the others of its rule, so a rule that has both (`{ required: true, validator }`) is split, and both run.
 */
function expand(rule: FormRuleConfig): Unit[] {
  const units: Unit[] = [];
  const hasChecks = CHECKS.some((key) => rule[key] !== undefined);
  if (hasChecks || !rule.validator) units.push({ rule, kind: 'checks' });
  if (rule.validator) units.push({ rule, kind: 'validator' });
  return units;
}

function failure(message: unknown, fallback: string): Error {
  if (message instanceof Error) return message.message ? message : new Error(fallback);
  const text = typeof message === 'string' ? message : message === undefined || message === null ? '' : String(message);
  return new Error(text || fallback);
}

/** Calls the validator of a rule and turns every way of failing (a return value, a throw, a rejection) into an error. */
async function callValidator(
  rule: FormRuleConfig,
  field: string,
  value: unknown,
  fallback: string
): Promise<void> {
  const checked = rule.transform ? rule.transform(value) : value;
  let result: unknown;
  try {
    result = await rule.validator!({ ...rule, field }, checked);
  } catch (error) {
    throw failure(error, fallback);
  }
  if (result === false) throw failure('', fallback);
  if (result instanceof Error) throw failure(result, fallback);
  if (Array.isArray(result) && result.length > 0) throw result.map((item) => failure(item, fallback));
}

/** The rule as the library reads it. */
function libraryRule(rule: FormRuleConfig, kind: Unit['kind'], messages: FormValidateMessages): Record<string, unknown> {
  if (kind === 'validator') {
    const fallback = rule.message ?? messages.default ?? 'Validation failed';
    return {
      asyncValidator: (seen: { field: string }, value: unknown) => callValidator(rule, seen.field, value, fallback)
    };
  }
  const out: Record<string, unknown> = {};
  for (const key of ['required', 'type', 'len', 'min', 'max', 'pattern', 'enum', 'whitespace', 'transform'] as const) {
    if (rule[key] !== undefined) out[key] = rule[key];
  }
  if (rule.message !== undefined) out.message = rule.message;
  // Rules below a field cannot be split into units, so a validator there stands in for the other checks of its rule.
  const nested = (inner: FormRuleConfig) =>
    inner.validator ? libraryRule(inner, 'validator', messages) : libraryRule(inner, 'checks', messages);
  if (rule.defaultField) out.defaultField = nested(rule.defaultField);
  if (rule.fields) {
    out.fields = Object.fromEntries(Object.entries(rule.fields).map(([key, inner]) => [key, nested(inner)]));
  }
  return out;
}

/** The values a template can use: the variables of the item, and what the rule says. */
function templateVariables(rule: FormRuleConfig, variables: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = { type: rule.type ?? 'string', ...variables };
  if (rule.len !== undefined) out.len = String(rule.len);
  if (rule.min !== undefined) out.min = String(rule.min);
  if (rule.max !== undefined) out.max = String(rule.max);
  if (rule.pattern !== undefined) out.pattern = String(rule.pattern);
  if (rule.enum !== undefined) out.enum = rule.enum.join(', ');
  return out;
}

async function runUnit(unit: Unit, input: RuleRunInput): Promise<string[]> {
  const schema = new Schema({ [KEY]: libraryRule(unit.rule, unit.kind, input.messages) } as never);
  // The templates go in as they are: the library formats with `%s`, which they do not contain, so they come back whole.
  schema.messages(input.messages as never);
  try {
    await schema.validate({ [KEY]: input.value }, { suppressWarning: true });
    return [];
  } catch (thrown) {
    const errors = (thrown as { errors?: { message: string }[] } | null)?.errors;
    // `errors` is how the library reports a rule that failed; anything else is a bug and is not hidden.
    if (!Array.isArray(errors)) throw thrown;
    const variables = templateVariables(unit.rule, input.variables);
    return errors.map((error) => formatMessage(error.message, variables));
  }
}

/** Runs the rules against the value. */
export async function runRules(input: RuleRunInput): Promise<RuleRunResult> {
  const units = input.rules.flatMap(expand);
  const errors: string[] = [];
  const warnings: string[] = [];
  const put = (unit: Unit, messages: string[]) => (unit.rule.warningOnly ? warnings : errors).push(...messages);

  if (input.first === true) {
    for (const unit of units) {
      const messages = await runUnit(unit, input);
      put(unit, messages);
      if (messages.length > 0 && !unit.rule.warningOnly) break;
    }
    return { errors, warnings };
  }

  const all = await Promise.all(units.map((unit) => runUnit(unit, input)));
  let failed = false;
  units.forEach((unit, index) => {
    const messages = all[index];
    if (messages.length === 0) return;
    if (unit.rule.warningOnly) warnings.push(...messages);
    else if (input.first !== 'parallel' || !failed) {
      errors.push(...messages);
      failed = true;
    }
  });
  return { errors, warnings };
}
