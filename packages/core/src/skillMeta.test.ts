import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadSkillMeta, saveSkillMeta, skillMetaFileKey } from './skillMeta.js';

describe('skillMeta', () => {
  let root: string;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('skillMetaFileKey encodes skillId', () => {
    expect(skillMetaFileKey('personal:rn/foo')).toBe('personal__rn__foo');
  });

  it('save and load roundtrip', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-meta-'));
    const skillId = 'personal:alpha';
    await saveSkillMeta(root, {
      skillId,
      categories: ['experiments'],
      tags: ['android'],
      favorite: true,
      note: 'test',
    });
    const loaded = await loadSkillMeta(root, skillId);
    expect(loaded?.tags).toEqual(['android']);
    expect(loaded?.favorite).toBe(true);
  });
});
