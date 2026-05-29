import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkPlatformBinding } from './checkBinding.js';
import type { PlatformDefinition } from './types.js';

describe('checkPlatformBinding', () => {
  let root: string;
  let agents: string;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  async function setupSkill(name = 'alpha') {
    root = await mkdtemp(join(tmpdir(), 'csm-bind-'));
    agents = join(root, 'agents');
    await mkdir(agents, { recursive: true });
    const skillDir = join(root, 'skills', name);
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '---\nname: alpha\ndescription: test\n---\n');
    return { skillDir, name };
  }

  const agentsPlatform = (globalRoot: string): PlatformDefinition => ({
    id: 'agents',
    label: 'Agents',
    globalRoot,
    role: 'target',
    syncMode: 'symlink',
    enabled: true,
    publishFrom: 'canonical',
  });

  it('reports missing symlink', async () => {
    const { name } = await setupSkill();
    const status = await checkPlatformBinding(
      { name, relativePath: name },
      join(root, 'skills'),
      agentsPlatform(agents),
    );
    expect(status.ok).toBe(false);
    expect(status.issue).toBe('missing');
  });

  it('accepts correct symlink target', async () => {
    const { name, skillDir } = await setupSkill();
    await symlink(skillDir, join(agents, name));
    const status = await checkPlatformBinding(
      { name, relativePath: name },
      join(root, 'skills'),
      agentsPlatform(agents),
    );
    expect(status.ok).toBe(true);
    expect(status.issue).toBeUndefined();
  });

  it('detects wrong symlink target', async () => {
    const { name } = await setupSkill();
    const other = join(root, 'skills', 'other');
    await mkdir(other, { recursive: true });
    await symlink(other, join(agents, name));
    const status = await checkPlatformBinding(
      { name, relativePath: name },
      join(root, 'skills'),
      agentsPlatform(agents),
    );
    expect(status.ok).toBe(false);
    expect(status.issue).toBe('wrong_target');
  });

  it('detects non-symlink path', async () => {
    const { name } = await setupSkill();
    await mkdir(join(agents, name), { recursive: true });
    const status = await checkPlatformBinding(
      { name, relativePath: name },
      join(root, 'skills'),
      agentsPlatform(agents),
    );
    expect(status.ok).toBe(false);
    expect(status.issue).toBe('not_symlink');
  });
});
