import { afterEach, describe, expect, it, vi } from 'vitest';
import { isProduction } from '$lib/internal/env.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('isProduction', () => {
  it('is false outside production builds', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(isProduction()).toBe(false);
  });

  it('is true when NODE_ENV is production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(isProduction()).toBe(true);
  });

  it('is false when there is no process object, as on a browser dev server', () => {
    vi.stubGlobal('process', undefined);
    expect(isProduction()).toBe(false);
  });
});
