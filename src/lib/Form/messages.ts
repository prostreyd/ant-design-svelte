import type { FormValidateMessages } from './types.js';

/**
 * The generated messages, English. Templates: `${name}` is the label of the item (or the name of the field), the others
 * are the values of the rule (`${min}`, `${max}`, `${len}`, `${type}`, `${pattern}`, `${enum}`) and the variables of the
 * item. The shape is the one of the validation library, so a form's `validateMessages` can replace any of them.
 */
export const defaultValidateMessages = {
  default: "Validation error on '${name}'",
  required: "'${name}' is required",
  enum: "'${name}' must be one of ${enum}",
  whitespace: "'${name}' cannot be empty",
  date: {
    format: "'${name}' is invalid for format date",
    parse: "'${name}' could not be parsed as date",
    invalid: "'${name}' is an invalid date"
  },
  types: {
    string: "'${name}' is not a valid ${type}",
    method: "'${name}' is not a valid ${type}",
    array: "'${name}' is not a valid ${type}",
    object: "'${name}' is not a valid ${type}",
    number: "'${name}' is not a valid ${type}",
    date: "'${name}' is not a valid ${type}",
    boolean: "'${name}' is not a valid ${type}",
    integer: "'${name}' is not a valid ${type}",
    float: "'${name}' is not a valid ${type}",
    regexp: "'${name}' is not a valid ${type}",
    email: "'${name}' is not a valid email",
    tel: "'${name}' is not a valid phone number",
    url: "'${name}' is not a valid url",
    hex: "'${name}' is not a valid ${type}"
  },
  string: {
    len: "'${name}' must be exactly ${len} characters",
    min: "'${name}' must be at least ${min} characters",
    max: "'${name}' cannot be longer than ${max} characters",
    range: "'${name}' must be between ${min} and ${max} characters"
  },
  number: {
    len: "'${name}' must equal ${len}",
    min: "'${name}' cannot be less than ${min}",
    max: "'${name}' cannot be greater than ${max}",
    range: "'${name}' must be between ${min} and ${max}"
  },
  array: {
    len: "'${name}' must be exactly ${len} in length",
    min: "'${name}' cannot be less than ${min} in length",
    max: "'${name}' cannot be greater than ${max} in length",
    range: "'${name}' must be between ${min} and ${max} in length"
  },
  pattern: {
    mismatch: "'${name}' does not match pattern ${pattern}"
  }
} satisfies FormValidateMessages;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The default messages with the given ones laid over them, key by key. Neither argument is changed. */
export function mergeMessages(...layers: ReadonlyArray<FormValidateMessages | undefined>): FormValidateMessages {
  const result: Record<string, unknown> = {};
  const lay = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue;
      if (isRecord(value)) {
        const inner = isRecord(target[key]) ? (target[key] as Record<string, unknown>) : {};
        target[key] = inner;
        lay(inner, value);
      } else target[key] = value;
    }
  };
  lay(result, defaultValidateMessages as unknown as Record<string, unknown>);
  for (const layer of layers) if (layer) lay(result, layer as unknown as Record<string, unknown>);
  return result as FormValidateMessages;
}

/**
 * Fills the variables of a template. `${name}` is replaced by the value of `name`; `\${name}` is kept as text; a name
 * that has no value is left as it is.
 */
export function formatMessage(template: string, variables: Readonly<Record<string, string>>): string {
  return template.replace(/(\\)?\$\{([\w.]+)\}/g, (match, escape: string | undefined, name: string) => {
    if (escape) return match.slice(1);
    return Object.prototype.hasOwnProperty.call(variables, name) ? variables[name] : match;
  });
}
