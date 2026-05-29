import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { defaultConfig } from '../config.js';
import type { SkillSummary } from '../types.js';
import { checkPlatformBinding } from './checkBinding.js';
import { publishSkillBatch, publishSkillBinding, unpublishSkillBinding } from './publish.js';
import type { PlatformDefinition } from './types.js';

describe('publishSkillBinding', () => {
  let root: string;
  let agents: string;
  let config: ReturnType<typeof defaultConfig>;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  async function setupSkill(name = 'alpha') {
    root = await mkdtemp(join(tmpdir(), 'csm-pub-'));
    agents = join(root, 'agents');
    const personal = join(root, 'skills');
    await mkdir(agents, { recursive: true });
    const skillDir = join(personal, name);
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '---\nname: alpha\ndescription: test\n---\n');
    config = defaultConfig({
      paths: { personalRoot: personal, agentsRoot: agents },
    });
    const platform: PlatformDefinition = {
      id: 'agents',
      label: 'Agents',
      globalRoot: agents,
      role: 'target',
      syncMode: 'symlink',
      enabled: true,
      publishFrom: 'canonical',
    };
    const skill: Pick<SkillSummary, 'skillId' | 'name' | 'relativePath' | 'source'> = {
      skillId: `personal:${name}`,
      name,
      relativePath: name,
      source: 'personal',
    };
    return { platform, skill };
  }

  it('creates symlink on publish', async () => {
    const { platform, skill } = await setupSkill();
    const result = await publishSkillBinding(config, platform, skill);
    expect(result.action).toBe('created');
    const status = await checkPlatformBinding(skill, config.paths.personalRoot, platform);
    expect(status.ok).toBe(true);
  });

  it('dry-run does not create symlink', async () => {
    const { platform, skill } = await setupSkill();
    const result = await publishSkillBinding(config, platform, skill, { dryRun: true });
    expect(result.action).toBe('dry_run');
    const status = await checkPlatformBinding(skill, config.paths.personalRoot, platform);
    expect(status.ok).toBe(false);
  });

  it('skips when already linked', async () => {
    const { platform, skill } = await setupSkill();
    await publishSkillBinding(config, platform, skill);
    const again = await publishSkillBinding(config, platform, skill);
    expect(again.action).toBe('skipped');
  });

  it('repairs wrong symlink', async () => {
    const { platform, skill } = await setupSkill();
    const wrong = join(root, 'skills', 'other');
    await mkdir(wrong, { recursive: true });
    await symlink(wrong, join(agents, skill.name));
    const result = await publishSkillBinding(config, platform, skill);
    expect(result.action).toBe('repaired');
    const status = await checkPlatformBinding(skill, config.paths.personalRoot, platform);
    expect(status.ok).toBe(true);
  });

  it('conflicts on non-symlink directory without force', async () => {
    const { platform, skill } = await setupSkill();
    await mkdir(join(agents, skill.name), { recursive: true });
    await writeFile(join(agents, skill.name, 'keep'), 'x');
    const result = await publishSkillBinding(config, platform, skill);
    expect(result.action).toBe('conflict');
    expect(result.issue).toBe('not_symlink');
  });

  it('unpublish removes symlink', async () => {
    const { platform, skill } = await setupSkill();
    await publishSkillBinding(config, platform, skill);
    const result = await unpublishSkillBinding(config, platform, skill);
    expect(result.action).toBe('unpublished');
    const status = await checkPlatformBinding(skill, config.paths.personalRoot, platform);
    expect(status.ok).toBe(false);
  });

  it('publishSkillBatch summarizes actions', async () => {
    const { platform, skill } = await setupSkill();
    const full: SkillSummary = {
      ...skill,
      readOnly: false,
      description: 'test',
      categoryPath: '',
      rootPath: join(config.paths.personalRoot, skill.name),
      skillMdPath: join(config.paths.personalRoot, skill.name, 'SKILL.md'),
      hasScripts: false,
      mtimeMs: Date.now(),
      validation: { ok: true, errors: [] },
    };
    const batch = await publishSkillBatch(config, platform.id, [full]);
    expect(batch.summary.created).toBe(1);
  });
});
