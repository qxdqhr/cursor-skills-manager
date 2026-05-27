import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanPersonalSkills } from './scan.js';
import { checkAgentsLink } from './agentsLink.js';

describe('scanPersonalSkills', () => {
  let root: string;
  let agents: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-personal-'));
    agents = await mkdtemp(join(tmpdir(), 'csm-agents-'));
    await mkdir(join(root, 'alpha'), { recursive: true });
    await writeFile(
      join(root, 'alpha', 'SKILL.md'),
      `---
name: alpha
description: Alpha skill for tests.
---
# Alpha
`,
    );
    await mkdir(join(root, 'cat', 'beta'), { recursive: true });
    await writeFile(
      join(root, 'cat', 'beta', 'SKILL.md'),
      `---
name: beta
description: Beta nested.
---
`,
    );
    await mkdir(join(root, 'scripts'), { recursive: true });
    await writeFile(join(root, 'scripts', 'noop.sh'), '#!/bin/sh\n');
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
    await rm(agents, { recursive: true, force: true });
  });

  it('finds skills and skips repo scripts/', async () => {
    const skills = await scanPersonalSkills({ root });
    expect(skills.length).toBe(2);
    expect(skills.map((s) => s.name).sort()).toEqual(['alpha', 'beta']);
    expect(skills.find((s) => s.name === 'beta')?.categoryPath).toBe('cat');
    expect(skills.every((s) => s.source === 'personal' && !s.readOnly)).toBe(true);
  });

  it('checkAgentsLink when symlink ok', async () => {
    await symlink(join(root, 'alpha'), join(agents, 'alpha'));
    const link = await checkAgentsLink('alpha', agents, root);
    expect(link.exists).toBe(true);
    expect(link.ok).toBe(true);
  });
});
