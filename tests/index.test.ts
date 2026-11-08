import { describe, expect, it } from 'vitest';
import { VERSION } from '../src/lib/index';

describe('library entry', () => {
  it('exposes a version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
