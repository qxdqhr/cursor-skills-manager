import { describe, expect, it } from 'vitest';
import { UNCATEGORIZED_CATEGORY_ID } from './skillId.js';
import { buildSkillsTree, matchesCategoryPath } from './skillsTree.js';
import type { SkillSummary } from './types.js';

function skill(partial: Partial<SkillSummary> & Pick<SkillSummary, 'name' | 'categoryPath'>): SkillSummary {
  return {
    skillId: `personal:${partial.categoryPath ? `${partial.categoryPath}/` : ''}${partial.name}`,
    source: 'personal',
    readOnly: false,
    description: '',
    relativePath: partial.categoryPath ? `${partial.categoryPath}/${partial.name}` : partial.name,
    rootPath: '/skills',
    skillMdPath: '/skills/SKILL.md',
    hasScripts: false,
    mtimeMs: 0,
    validation: { ok: true, errors: [] },
    ...partial,
  };
}

describe('buildSkillsTree', () => {
  it('groups by folder path without per-skill leaf nodes', () => {
    const tree = buildSkillsTree(
      [
        skill({ name: 'a', categoryPath: 'rn' }),
        skill({ name: 'b', categoryPath: 'rn' }),
        skill({ name: 'solo', categoryPath: 'web' }),
      ],
      [],
    );

    expect(tree.personal).toEqual([
      {
        id: 'rn',
        label: 'rn',
        skillCount: 2,
        children: [],
      },
      {
        id: 'web',
        label: 'web',
        skillCount: 1,
        children: [],
      },
    ]);
  });

  it('adds uncategorized bucket for root-level skills', () => {
    const tree = buildSkillsTree([skill({ name: 'root-skill', categoryPath: '' })], []);

    expect(tree.personal).toEqual([
      {
        id: UNCATEGORIZED_CATEGORY_ID,
        label: UNCATEGORIZED_CATEGORY_ID,
        skillCount: 1,
        children: [],
      },
    ]);
  });

  it('supports nested folders', () => {
    const tree = buildSkillsTree([skill({ name: 'leaf', categoryPath: 'mobile/rn' })], []);

    expect(tree.personal[0]).toMatchObject({
      id: 'mobile',
      skillCount: 1,
      children: [{ id: 'rn', skillCount: 1, children: [] }],
    });
  });
});

describe('matchesCategoryPath', () => {
  it('matches subtree', () => {
    expect(matchesCategoryPath({ categoryPath: 'rn/apk' }, 'rn')).toBe(true);
    expect(matchesCategoryPath({ categoryPath: 'web' }, 'rn')).toBe(false);
  });

  it('matches uncategorized only', () => {
    expect(matchesCategoryPath({ categoryPath: '', name: 'x' }, UNCATEGORIZED_CATEGORY_ID)).toBe(true);
    expect(matchesCategoryPath({ categoryPath: 'rn', name: 'x' }, UNCATEGORIZED_CATEGORY_ID)).toBe(false);
  });

  it('matches legacy tree leaf by skill name', () => {
    expect(matchesCategoryPath({ categoryPath: '', name: 'my-skill' }, 'my-skill')).toBe(true);
  });
});
