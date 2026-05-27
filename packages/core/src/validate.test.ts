import { describe, it, expect } from 'vitest';
import { validateSkill } from './validate.js';

describe('validateSkill', () => {
  it('accepts valid skill', () => {
    const r = validateSkill({
      directoryName: 'my-skill',
      frontmatter: { name: 'my-skill', description: 'Does things' },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects name mismatch', () => {
    const r = validateSkill({
      directoryName: 'my-skill',
      frontmatter: { name: 'other', description: 'x' },
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.code === 'NAME_DIR_MISMATCH')).toBe(true);
  });

  it('rejects missing description', () => {
    const r = validateSkill({
      directoryName: 'x',
      frontmatter: { name: 'x', description: '' },
    });
    expect(r.errors.some((e) => e.code === 'DESCRIPTION_REQUIRED')).toBe(true);
  });
});
