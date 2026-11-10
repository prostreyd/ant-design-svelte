import { isProduction } from './env.js';

/**
 * Validates an enum-like prop against its contract.
 *
 * Values outside the contract throw a `RangeError` while developing, so the mistake is
 * caught early. A production build falls back to the documented default instead, so a bad
 * value (for example one coming from a CMS) cannot take down the page.
 */
export function resolveOption<T extends string>(
  component: string,
  name: string,
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  if (allowed.includes(value as T)) return value as T;
  if (!isProduction()) {
    throw new RangeError(`${component} ${name} must be one of: ${allowed.join(', ')}.`);
  }
  return fallback;
}
