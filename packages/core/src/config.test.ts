import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureConfig, loadConfig, saveConfig, configPath } from './config.js';
import { existsSync } from 'node:fs';

describe('config', () => {
  let root: string;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
  });

  it('ensureConfig creates token', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-cfg-'));
    const cfg = await ensureConfig(root);
    expect(existsSync(configPath(root))).toBe(true);
    expect(cfg.api.token).toBeTruthy();
    expect(cfg.paths.personalRoot).toBe(root);
  });

  it('saveConfig patches locale', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-cfg-'));
    await ensureConfig(root);
    const next = await saveConfig(root, { locale: 'en' });
    expect(next.locale).toBe('en');
    const loaded = await loadConfig(root);
    expect(loaded.locale).toBe('en');
  });

  it('migrates v1 config without platforms to v2', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-cfg-'));
    await mkdir(join(root, '.csm'), { recursive: true });
    await writeFile(
      join(root, '.csm', 'config.json'),
      `${JSON.stringify(
        {
          version: 1,
          locale: 'zh',
          api: { port: 3847, token: 'test-token' },
          paths: { personalRoot: root, agentsRoot: join(root, 'agents') },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    const loaded = await loadConfig(root);
    expect(loaded.version).toBe(2);
    expect(loaded.platforms?.enabled).toContain('cursor');
    expect(loaded.platforms?.enabled).toContain('agents');
  });

  it('saveConfig merges platforms patch', async () => {
    root = await mkdtemp(join(tmpdir(), 'csm-cfg-'));
    await ensureConfig(root);
    const next = await saveConfig(root, {
      platforms: {
        enabled: ['cursor', 'agents'],
        definitions: { opencode: { enabled: false } },
      },
    });
    expect(next.platforms?.enabled).toEqual(['cursor', 'agents']);
    expect(next.platforms?.definitions?.opencode?.enabled).toBe(false);
  });
});
