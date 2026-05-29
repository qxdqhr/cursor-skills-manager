import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { probePlatformCli, whichCommand } from './probe.js';
import { resolveEffectiveGlobalRoot } from './registry.js';
import type { PlatformDefinition } from './types.js';

describe('probe', () => {
  it('whichCommand finds node', async () => {
    const path = await whichCommand('node');
    expect(path).toBeTruthy();
  });

  it('probePlatformCli returns boolean for cursor', async () => {
    const result = await probePlatformCli('cursor');
    expect(typeof result.installed).toBe('boolean');
  });
});

describe('resolveEffectiveGlobalRoot', () => {
  let root: string;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('prefers alternate root when primary missing', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-root-'));
    const alt = join(root, 'skill');
    await mkdir(alt, { recursive: true });
    const platform: PlatformDefinition = {
      id: 'opencode',
      label: 'OpenCode',
      globalRoot: join(root, 'skills'),
      alternateRoots: [alt],
      role: 'target',
      syncMode: 'symlink',
      enabled: true,
    };
    expect(resolveEffectiveGlobalRoot(platform)).toBe(alt);
  });
});
