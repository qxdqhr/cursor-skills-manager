import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, it, expect, afterEach } from 'vitest';
import {
  createPersonalSkill,
  deletePersonalSkill,
  updatePersonalSkill,
} from './writeSkill.js';
import { SkillValidationError } from './skillErrors.js';
import { parseSkillMdFile } from './parse.js';

describe('writeSkill', () => {
  const root = join(tmpdir(), `csm-write-${Date.now()}`);
  let skillId = '';

  afterEach(async () => {
    await rm(root, { recursive: true, force: true }).catch(() => undefined);
  });

  it('creates, updates, and deletes a personal skill', async () => {
    await mkdir(root, { recursive: true });

    const created = await createPersonalSkill({
      personalRoot: root,
      name: 'test-write-skill',
      categoryPath: 'experiments',
    });
    skillId = created.skillId;
    expect(created.name).toBe('test-write-skill');

    await updatePersonalSkill({
      personalRoot: root,
      skillId,
      frontmatter: {
        name: 'test-write-skill',
        description: 'Updated description for test',
      },
      bodyMarkdown: '# Updated\n\nNew body.',
    });

    const md = await parseSkillMdFile(join(root, 'experiments/test-write-skill/SKILL.md'));
    expect(md.frontmatter.description).toBe('Updated description for test');
    expect(md.bodyMarkdown).toContain('# Updated');

    await deletePersonalSkill(root, skillId, 'hard');
    skillId = '';
  });

  it('rejects name mismatch on update', async () => {
    await mkdir(root, { recursive: true });
    const created = await createPersonalSkill({
      personalRoot: root,
      name: 'mismatch-test',
    });
    skillId = created.skillId;

    await expect(
      updatePersonalSkill({
        personalRoot: root,
        skillId,
        frontmatter: { name: 'other-name', description: 'x' },
        bodyMarkdown: '# x',
      }),
    ).rejects.toBeInstanceOf(SkillValidationError);

    await deletePersonalSkill(root, skillId, 'hard');
    skillId = '';
  });
});
