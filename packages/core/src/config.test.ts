import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
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
});
